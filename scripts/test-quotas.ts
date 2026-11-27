// Pure tests for plan quotas (lib/quota-rules.ts), usage credits (lib/credit-rules.ts), AI prices
// (lib/ai-prices.ts), the ad-account allowance (lib/ad-account-rules.ts) and the "Extra ad account"
// add-on helpers (lib/stripe.ts). No database, no network.
//   npx tsx scripts/test-quotas.ts
import assert from "node:assert/strict"
import { createLimiter, createPublicCounter, decide, limitsFor, periodStart, planKey, quotaMessage, QuotaError, isQuotaError, type QuotaKind, type UsageStore } from "../src/lib/quota-rules"
import { estimateCallCost, tokCost, usageCost } from "../src/lib/ai-prices"
import { extraAdAccounts, isAdAccountAddon, planItem } from "../src/lib/stripe"
import { aiHeadroom, creditCost, expiryFor, grantEntry, refundEntry, replay, type LedgerEntry } from "../src/lib/credit-rules"
import { accountsAfter, adAccountDecision, allowanceFor, type AdAccountState } from "../src/lib/ad-account-rules"
import type { CreditProvider } from "../src/lib/quota-rules"

/** In-memory credit ledger for the limiter (same replay as the app). */
function memCredits(entries: LedgerEntry[], autoUse = true, clock: () => Date = () => new Date()): CreditProvider & { entries: LedgerEntry[] } {
  return {
    entries,
    async state(_u, now) {
      await new Promise((r) => setTimeout(r, Math.random() * 5))
      return { balance: replay(entries, now).balance, autoUse }
    },
    async spend(_u, credits, kind, n) {
      entries.push({ t: "spend", credits, at: clock().toISOString(), action: kind, n })
    },
  }
}
const buyAt = (credits: number, at: string, sessionId = `cs_${credits}_${at}`, pi = `pi_${sessionId}`): LedgerEntry =>
  grantEntry([], { sessionId, credits, paymentIntent: pi, amount: credits * 50, currency: "usd", at: new Date(at) })!

let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`ok   ${name}`)
  } catch (e) {
    console.error(`FAIL ${name}\n     ${e instanceof Error ? e.message : e}`)
    process.exitCode = 1
  }
}

/** In-memory ledger with timestamps, like usage_day rows + pending counts. */
function memStore(now: () => Date): UsageStore & { rows: { userId: string; kind: string; n: number; at: Date }[] } {
  const rows: { userId: string; kind: string; n: number; at: Date }[] = []
  return {
    rows,
    async used(userId, kind, since) {
      await new Promise((r) => setTimeout(r, Math.random() * 5)) // the DB read takes a moment
      return rows.filter((r) => r.userId === userId && r.kind === kind && r.at >= since).reduce((a, r) => a + r.n, 0)
    },
    add(userId, kind, n) {
      rows.push({ userId, kind, n, at: now() })
    },
  }
}

async function main() {
  delete process.env.QUOTAS_JSON

  await test("plan keys", () => {
    assert.equal(planKey("growth"), "growth")
    assert.equal(planKey("pro"), "pro")
    assert.equal(planKey("fullservice"), "pro")
    assert.equal(planKey("starter"), "starter")
    assert.equal(planKey("none"), "none")
    assert.equal(planKey(null), "none")
  })

  await test("limits follow the pricing page (+ regenerations)", () => {
    assert.deepEqual(limitsFor("starter", "content_piece:blog"), { month: 4 }) // 2 promised + 2
    assert.deepEqual(limitsFor("pro", "content_piece:blog"), { month: 8 }) // 4 promised + 4
    assert.equal(limitsFor("pro", "content_piece:gbp").week, 6) // 4 a week promised
    assert.equal(limitsFor("pro", "content_piece:social").month, 30)
    assert.equal(limitsFor("starter", "sandbox_question").day, 20)
    assert.equal(limitsFor("pro", "sandbox_question").day, 50)
    assert.equal(limitsFor("growth", "ad_plan").month, 4)
    assert.equal(limitsFor("pro", "email_send").day, 2000) // list cap
    assert.deepEqual(limitsFor("starter", "ai_cost_usd"), { day: 1, month: 10 })
    assert.deepEqual(limitsFor("pro", "ai_cost_usd"), { day: 4, month: 40 })
    assert.deepEqual(limitsFor("growth", "ai_cost_usd"), { day: 8, month: 80 })
    // Growth = Pro + ads: content numbers are Pro's.
    assert.deepEqual(limitsFor("growth", "content_piece:gbp"), limitsFor("pro", "content_piece:gbp"))
  })

  await test("periods: UTC day, Monday week, calendar month", () => {
    const wed = new Date("2026-11-25T15:00:00Z") // a Wednesday
    assert.equal(periodStart("day", wed).toISOString(), "2026-11-25T00:00:00.000Z")
    assert.equal(periodStart("week", wed).toISOString(), "2026-11-23T00:00:00.000Z")
    assert.equal(periodStart("month", wed).toISOString(), "2026-11-01T00:00:00.000Z")
    const sun = new Date("2026-11-29T23:59:00Z")
    assert.equal(periodStart("week", sun).toISOString(), "2026-11-23T00:00:00.000Z")
    const mon = new Date("2026-11-30T00:00:01Z")
    assert.equal(periodStart("week", mon).toISOString(), "2026-11-30T00:00:00.000Z")
  })

  await test("decide: under, at and over the limit; the tightest period wins", () => {
    const s = { plan: "pro" }
    const lim = { day: 2, week: 6 }
    assert.equal(decide("content_piece:gbp", lim, { day: 1, week: 1 }, 1, s).allowed, true)
    const d = decide("content_piece:gbp", lim, { day: 2, week: 2 }, 1, s)
    assert.equal(d.allowed, false)
    assert.equal(d.period, "day")
    const w = decide("content_piece:gbp", lim, { day: 0, week: 6 }, 1, s)
    assert.equal(w.allowed, false)
    assert.equal(w.period, "week")
    assert.match(w.message ?? "", /Google posts for this week\. More opens on Monday/)
    // n > 1 (a 4-engine check) must fit entirely.
    assert.equal(decide("engine_check", { day: 10 }, { day: 7 }, 4, s).allowed, false)
    assert.equal(decide("engine_check", { day: 10 }, { day: 6 }, 4, s).allowed, true)
    assert.equal(decide("engine_check", { day: 10 }, { day: 6 }, 4, s).remaining, 0)
  })

  await test("comped / founder accounts are never blocked (bypassed, logged)", () => {
    const d = decide("content_piece:blog", { month: 4 }, { month: 9 }, 1, { plan: "starter", comped: true })
    assert.equal(d.allowed, true)
    assert.equal(d.bypassed, true)
    assert.equal(d.message, undefined)
  })

  await test("messages are first person, friendly, and only suggest a real upgrade", () => {
    const now = new Date("2026-11-25T12:00:00Z")
    const starter = quotaMessage("content_piece:blog", "month", 4, "starter", now)
    assert.match(starter, /^I've made your 4 blog posts for this month\. More opens on December 1, or move to Pro for more\.$/)
    const growth = quotaMessage("content_piece:gbp", "week", 6, "growth", now)
    assert.equal(growth, "I've made your 6 Google posts for this week. More opens on Monday.")
    const ai = quotaMessage("ai_cost_usd", "day", 4, "pro", now)
    assert.match(ai, /^I've done all the work your plan covers today, so I'm pausing new writing and research until tomorrow, or move to Growth for more\./)
    assert.doesNotMatch(ai, /\$/) // never money in the owner's words
    assert.match(quotaMessage("email_send", "month", 0, "starter", now), /doesn't include emails yet, or move to Pro/)
  })

  await test("QUOTAS_JSON overrides: plan, '*' and null", () => {
    const raw = JSON.stringify({ "*": { sandbox_question: { day: 80 } }, pro: { "content_piece:blog": { month: 12 }, "content_piece:gbp": { week: null } } })
    assert.equal(limitsFor("starter", "sandbox_question", raw).day, 80)
    assert.equal(limitsFor("pro", "sandbox_question", raw).day, 80)
    assert.equal(limitsFor("pro", "content_piece:blog", raw).month, 12)
    assert.equal(limitsFor("pro", "content_piece:gbp", raw).week, undefined)
    assert.equal(limitsFor("pro", "content_piece:gbp", raw).month, 26)
    assert.equal(limitsFor("starter", "content_piece:blog", raw).month, 4) // other plans untouched
    // Bad JSON or bad values fall back to the built-in numbers.
    assert.equal(limitsFor("pro", "content_piece:blog", "{nope").month, 8)
    assert.equal(limitsFor("pro", "content_piece:blog", JSON.stringify({ pro: { "content_piece:blog": { month: -3 } } })).month, 8)
    // Read from the env by default.
    process.env.QUOTAS_JSON = JSON.stringify({ growth: { ad_plan: { month: 9 } } })
    assert.equal(limitsFor("growth", "ad_plan").month, 9)
    delete process.env.QUOTAS_JSON
    assert.equal(limitsFor("growth", "ad_plan").month, 4)
  })

  await test("burst: 20 parallel checks against a limit of 4 let exactly 4 through", async () => {
    let clock = new Date("2026-11-25T10:00:00Z")
    const store = memStore(() => clock)
    const lim = createLimiter(store)
    const s = { userId: "b1", plan: "starter" }
    const out = await Promise.all(Array.from({ length: 20 }, () => lim.check(s, "content_piece:blog")))
    assert.equal(out.filter((d) => d.allowed).length, 4)
    assert.equal(store.rows.length, 4)
    // Another brand has its own room.
    assert.equal((await lim.check({ userId: "b2", plan: "starter" }, "content_piece:blog")).allowed, true)
    // Next month it opens again.
    clock = new Date("2026-12-01T00:00:05Z")
    assert.equal((await lim.check(s, "content_piece:blog", { now: clock })).allowed, true)
  })

  await test("weekly limit reopens on Monday, daily at midnight UTC", async () => {
    let clock = new Date("2026-11-27T09:00:00Z") // Friday
    const store = memStore(() => clock)
    const lim = createLimiter(store)
    const s = { userId: "g", plan: "pro" }
    for (let i = 0; i < 2; i++) assert.equal((await lim.check(s, "publish:gbp", { now: clock })).allowed, true)
    assert.equal((await lim.check(s, "publish:gbp", { now: clock })).allowed, false) // 2 a day
    clock = new Date("2026-11-28T09:00:00Z")
    for (let i = 0; i < 2; i++) assert.equal((await lim.check(s, "publish:gbp", { now: clock })).allowed, true)
    clock = new Date("2026-11-29T09:00:00Z")
    for (let i = 0; i < 2; i++) assert.equal((await lim.check(s, "publish:gbp", { now: clock })).allowed, true)
    clock = new Date("2026-11-29T10:00:00Z")
    const d = await lim.check(s, "publish:gbp", { now: clock }) // 6 this week (Fri-Sun)
    assert.equal(d.allowed, false)
    assert.equal(d.period, "day")
    clock = new Date("2026-11-30T08:00:00Z") // Monday
    assert.equal((await lim.check(s, "publish:gbp", { now: clock })).allowed, true)
  })

  await test("record: false only looks; remaining is what's left", async () => {
    const store = memStore(() => new Date())
    const lim = createLimiter(store)
    const s = { userId: "p", plan: "pro" }
    const peek = await lim.check(s, "sandbox_question", { record: false })
    assert.equal(peek.allowed, true)
    assert.equal(peek.remaining, 50)
    assert.equal(store.rows.length, 0)
    const used = await lim.check(s, "sandbox_question")
    assert.equal(used.remaining, 49)
  })

  await test("comped burst: everything allowed, all of it counted", async () => {
    const store = memStore(() => new Date())
    const lim = createLimiter(store)
    const s = { userId: "f", plan: "none", comped: true }
    const out = await Promise.all(Array.from({ length: 10 }, () => lim.check(s, "content_piece:blog")))
    assert.ok(out.every((d) => d.allowed))
    assert.equal(store.rows.length, 10)
    assert.ok(out.some((d) => d.bypassed))
  })

  await test("dollar kinds: fractional amounts", async () => {
    const store = memStore(() => new Date())
    const lim = createLimiter(store)
    const s = { userId: "a", plan: "starter" } // apify $0.5/day, $1/month
    assert.equal((await lim.check(s, "apify_usd", { n: 0.25 })).allowed, true)
    assert.equal((await lim.check(s, "apify_usd", { n: 0.25 })).allowed, true)
    assert.equal((await lim.check(s, "apify_usd", { n: 0.05 })).allowed, false)
  })

  await test("public counter: per-IP and global caps, reset daily", () => {
    const c = createPublicCounter()
    const raw = JSON.stringify({ public: { scan_ip_day: 2, scan_global_day: 3 } })
    const t = new Date("2026-11-25T10:00:00Z")
    assert.equal(c.hit("scan", "1.1.1.1", t, raw).ok, true)
    assert.equal(c.hit("scan", "1.1.1.1", t, raw).ok, true)
    assert.equal(c.hit("scan", "1.1.1.1", t, raw).reason, "ip")
    assert.equal(c.hit("scan", "2.2.2.2", t, raw).ok, true)
    assert.equal(c.hit("scan", "3.3.3.3", t, raw).reason, "global")
    assert.equal(c.hit("scan", "unknown", t, raw).reason, "global") // signed-in skips the IP cap, not the global one
    assert.equal(c.hit("scan", "1.1.1.1", new Date("2026-11-26T00:00:01Z"), raw).ok, true)
  })

  await test("QuotaError carries the decision and is recognisable", () => {
    const d = decide("week_run", { week: 3 }, { week: 3 }, 1, { plan: "pro" })
    const e = new QuotaError(d)
    assert.ok(isQuotaError(e))
    assert.equal(e.message, d.message)
    assert.ok(!isQuotaError(new Error("x")))
  })

  await test("AI prices: list prices, cache discounts, unknown models never free", () => {
    assert.equal(tokCost("claude-opus-5-5", { in: 1e6, out: 0 }), 4)
    assert.equal(tokCost("claude-opus-5-5", { in: 0, out: 1e6 }), 20)
    assert.equal(tokCost("claude-opus-5-5", { in: 0, out: 0, cacheRead: 1e6 }), 0.2) // 0.05x
    assert.equal(tokCost("claude-haiku-4-5", { in: 0, out: 0, cacheRead: 1e6 }), 0.1) // 0.1x
    assert.equal(tokCost("no-such-model", { in: 1, out: 1 }), null)
    assert.ok(usageCost({ "no-such-model": { in: 1e6, out: 0 } }) > 0)
    assert.equal(usageCost({}, 3), 0.03) // web searches $0.01
    assert.ok(Math.abs(estimateCallCost("claude-sonnet-5-5", 1000, 4000) - (1000 * 10 + 1000 * 2) / 1e6) < 1e-12)
    assert.ok(estimateCallCost("claude-opus-5-5", 64000, 0) <= (8000 * 20) / 1e6) // output budget capped at 8k
  })

  await test("Extra ad account add-on: found by metadata/lookup key, never read as the plan", () => {
    const plan = { price: { id: "price_growth", metadata: { alphaa_plan: "growth" } }, quantity: 1 }
    const addon = { price: { id: "price_x", metadata: { alphaa_addon: "extra_ad_account" } }, quantity: 3 }
    const byKey = { price: { id: "price_y", lookup_key: "alphaa_extra_ad_account_yearly_2026_11", metadata: {} }, quantity: 1 }
    assert.ok(isAdAccountAddon(addon.price))
    assert.ok(isAdAccountAddon(byKey.price))
    assert.ok(!isAdAccountAddon(plan.price))
    assert.equal(planItem([addon, plan])?.price?.id, "price_growth") // add-on listed first
    assert.equal(extraAdAccounts([addon, plan]), 3)
    assert.equal(extraAdAccounts([plan, addon, byKey]), 4)
    assert.equal(extraAdAccounts([plan]), 0)
    assert.equal(extraAdAccounts(undefined), 0)
  })


  // ── Usage credits ─────────────────────────────────────────────────────────
  await test("credit costs: Varun's numbers, QUOTAS_JSON override", () => {
    assert.equal(creditCost("content_piece:blog", ""), 5)
    assert.equal(creditCost("content_piece:social", ""), 1)
    assert.equal(creditCost("content_piece:gbp", ""), 1)
    assert.equal(creditCost("content_piece:email", ""), 3)
    assert.equal(creditCost("content_piece:review", ""), 0.5)
    assert.equal(creditCost("ad_plan", ""), 10)
    assert.equal(creditCost("week_run", ""), 8)
    assert.equal(creditCost("image_gen", ""), 1)
    assert.equal(creditCost("sandbox_question", ""), 0.2)
    assert.equal(creditCost("engine_check", ""), 0.1)
    assert.equal(creditCost("search", ""), 0.2)
    assert.equal(creditCost("scan", ""), 2)
    assert.equal(creditCost("content_piece:blog", JSON.stringify({ credits: { "content_piece:blog": 4 } })), 4)
    assert.equal(creditCost("content_piece:blog", "{bad"), 5)
  })

  await test("spending order: plan quota first, then credits", async () => {
    const store = memStore(() => new Date())
    const credits = memCredits([buyAt(50, new Date(Date.now() - 86_400_000).toISOString())])
    const lim = createLimiter(store, credits, (k) => creditCost(k, ""))
    const s = { userId: "c1", plan: "starter" } // 4 blogs a month
    for (let i = 0; i < 4; i++) {
      const d = await lim.check(s, "content_piece:blog")
      assert.equal(d.allowed, true)
      assert.equal(d.credits, undefined) // inside the plan: free
    }
    assert.equal(credits.entries.filter((e) => e.t === "spend").length, 0)
    const fifth = await lim.check(s, "content_piece:blog")
    assert.equal(fifth.allowed, true)
    assert.equal(fifth.credits, 5)
    assert.equal(replay(credits.entries).balance, 45)
  })

  await test("insufficient balance: blocked with Buy more; auto-use off: blocked and told how", async () => {
    const store = memStore(() => new Date())
    const recent = new Date(Date.now() - 3_600_000).toISOString()
    const low = memCredits([buyAt(50, recent), { t: "spend", credits: 47, at: new Date(Date.now() - 1_800_000).toISOString(), action: "x" }])
    const lim = createLimiter(store, low, (k) => creditCost(k, ""))
    const s = { userId: "c2", plan: "starter" }
    for (let i = 0; i < 4; i++) await lim.check(s, "content_piece:blog")
    const d = await lim.check(s, "content_piece:blog") // needs 5, has 3
    assert.equal(d.allowed, false)
    assert.deepEqual(d.buy, { need: 5, balance: 3, autoUse: true })
    assert.match(d.message ?? "", /Buy more credits/)
    assert.equal(replay(low.entries).balance, 3) // nothing taken
    // Enough credits, but the owner turned auto-use off.
    const off = createLimiter(memStore(() => new Date()), memCredits([buyAt(50, recent)], false), (k) => creditCost(k, ""))
    for (let i = 0; i < 4; i++) await off.check({ userId: "c3", plan: "starter" }, "content_piece:blog")
    const o = await off.check({ userId: "c3", plan: "starter" }, "content_piece:blog")
    assert.equal(o.allowed, false)
    assert.match(o.message ?? "", /turn on "Use credits when I run out"/)
    // Background work (useCredits: false) never spends.
    const bg = createLimiter(memStore(() => new Date()), memCredits([buyAt(50, recent)]), (k) => creditCost(k, ""))
    for (let i = 0; i < 4; i++) await bg.check({ userId: "c4", plan: "starter" }, "content_piece:blog")
    assert.equal((await bg.check({ userId: "c4", plan: "starter" }, "content_piece:blog", { useCredits: false })).allowed, false)
  })

  await test("credits burst: 30 parallel checks, 10 in plan, then exactly 12 paid with 12 credits (no double-spend)", async () => {
    const store = memStore(() => new Date())
    const credits = memCredits([buyAt(12, new Date(Date.now() - 60_000).toISOString())])
    const lim = createLimiter(store, credits, (k) => creditCost(k, ""))
    const s = { userId: "c5", plan: "pro" }
    const out = await Promise.all(Array.from({ length: 30 }, () => lim.check(s, "content_piece:social"))) // 10/week in plan, then 1 credit each
    assert.equal(out.filter((d) => d.allowed && !d.credits).length, 10)
    assert.equal(out.filter((d) => d.credits === 1).length, 12)
    assert.equal(out.filter((d) => !d.allowed).length, 8)
    assert.equal(replay(credits.entries).balance, 0)
  })

  await test("record: false only looks: credits would cover it, nothing spent", async () => {
    const credits = memCredits([buyAt(50, new Date(Date.now() - 60_000).toISOString())])
    const lim = createLimiter(memStore(() => new Date()), credits, (k) => creditCost(k, ""))
    const s = { userId: "c6", plan: "none" }
    for (let i = 0; i < 5; i++) await lim.check(s, "sandbox_question") // 5 a day
    const peek = await lim.check(s, "sandbox_question", { record: false })
    assert.equal(peek.allowed, true)
    assert.equal(peek.wouldUseCredits, true)
    assert.equal(credits.entries.filter((e) => e.t === "spend").length, 0)
  })

  await test("expiry: a pack lasts 12 months; spends use the pack that expires first", () => {
    const a = buyAt(50, "2025-12-01T00:00:00Z", "cs_a")
    const b = buyAt(120, "2026-06-01T00:00:00Z", "cs_b")
    assert.equal(expiryFor(new Date("2025-12-01T00:00:00Z")).toISOString(), "2026-12-01T00:00:00.000Z")
    const spend: LedgerEntry = { t: "spend", credits: 60, at: "2026-07-01T00:00:00Z", action: "content_piece:blog" }
    const r = replay([a, b, spend], new Date("2026-07-02T00:00:00Z"))
    assert.equal(r.balance, 110) // 50 from a (all), 10 from b
    assert.equal(r.lots.find((l) => l.sessionId === "cs_a")?.left, 0)
    // Pack a expires on Dec 1, 2026 with whatever's left; spends after that can't use it.
    const r2 = replay([a, b], new Date("2026-12-02T00:00:00Z"))
    assert.equal(r2.balance, 120)
    assert.equal(r2.expired, 50)
    const late: LedgerEntry = { t: "spend", credits: 10, at: "2026-12-05T00:00:00Z", action: "x" }
    assert.equal(replay([a, b, late], new Date("2026-12-06T00:00:00Z")).lots.find((l) => l.sessionId === "cs_b")?.left, 110)
  })

  await test("webhook is idempotent by session id", () => {
    const first = grantEntry([], { sessionId: "cs_1", credits: 120, paymentIntent: "pi_1", amount: 5000 })
    assert.ok(first)
    assert.equal(grantEntry([first!], { sessionId: "cs_1", credits: 120, paymentIntent: "pi_1", amount: 5000 }), null)
    // Even if a duplicate row slipped in, the balance counts the session once.
    assert.equal(replay([first!, first!]).balance, 120)
    assert.equal(grantEntry([], { sessionId: "cs_2", credits: 0 }), null)
  })

  await test("refund removes the unspent remainder (full), a share (partial), once per charge state", () => {
    const buy = grantEntry([], { sessionId: "cs_r", credits: 120, paymentIntent: "pi_r", amount: 5000, at: new Date(Date.now() - 86_400_000) })!
    const spent: LedgerEntry = { t: "spend", credits: 30, at: new Date(Date.now() - 3_600_000).toISOString(), action: "content_piece:blog" }
    const full = refundEntry([buy, spent], { paymentIntent: "pi_r", chargeId: "ch_r", amount: 5000, amountRefunded: 5000 })
    assert.equal(full?.credits, 90)
    assert.equal(replay([buy, spent, full!]).balance, 0)
    assert.equal(refundEntry([buy, spent, full!], { paymentIntent: "pi_r", chargeId: "ch_r", amount: 5000, amountRefunded: 5000 }), null) // replayed webhook
    // Partial: half the money back = up to half the pack, from what's left.
    const half = refundEntry([buy], { paymentIntent: "pi_r", chargeId: "ch_p", amount: 5000, amountRefunded: 2500 })
    assert.equal(half?.credits, 60)
    const rest = refundEntry([buy, half!], { paymentIntent: "pi_r", chargeId: "ch_p", amount: 5000, amountRefunded: 5000 })
    assert.equal(rest?.credits, 60)
    assert.equal(refundEntry([buy], { paymentIntent: "pi_other", chargeId: "ch_x", amount: 5000, amountRefunded: 5000 }), null) // not a credit purchase
  })

  await test("give-back: failed work returns its credits", () => {
    const buy = buyAt(50, new Date(Date.now() - 86_400_000).toISOString())
    const now = Date.now()
    const es: LedgerEntry[] = [buy, { t: "spend", credits: 5, at: new Date(now - 2000).toISOString(), action: "content_piece:blog" }, { t: "spend", credits: -5, at: new Date(now - 1000).toISOString(), action: "content_piece:blog" }]
    const r = replay(es)
    assert.equal(r.balance, 50)
    assert.equal(r.spentToday, 0)
  })

  await test("credits raise the daily AI ceiling: +$1 per 10 credits spent today", () => {
    assert.equal(aiHeadroom(0), 0)
    assert.equal(aiHeadroom(10), 1)
    assert.equal(aiHeadroom(25), 2.5)
    assert.equal(aiHeadroom(-5), 0)
    assert.equal(creditCost("ai_cost_usd", ""), 10)
  })

  // ── Ad accounts: a total across Google and Meta ───────────────────────────
  await test("1 ad account means 1 in total: Google + Meta needs 1 add-on", () => {
    const none: AdAccountState = { live: { google: [], meta: [] }, picks: { google: null, meta: null } }
    const g: AdAccountState = { live: { google: [], meta: [] }, picks: { google: "123", meta: null } }
    assert.equal(allowanceFor("growth", false, 0), 1)
    assert.equal(allowanceFor("growth", false, 2), 3)
    assert.equal(allowanceFor("pro", false, 5), 0)
    assert.equal(allowanceFor("starter", true, 0), Infinity)
    assert.equal(adAccountDecision(none, 1, "google", "123", false).ok, true)
    const d = adAccountDecision(g, 1, "meta", "act_9", true)
    assert.equal(d.ok, false)
    if (!d.ok) assert.match(d.message, /1 ad account in total, Google or Meta/)
    assert.equal(adAccountDecision(g, 2, "meta", "act_9", true).ok, true) // with 1 add-on
    // Switching Google accounts with nothing running is fine; with the old one still running it isn't.
    assert.equal(adAccountDecision(g, 1, "google", "456", false).ok, true)
    const running: AdAccountState = { live: { google: ["123"], meta: [] }, picks: { google: "123", meta: null } }
    assert.equal(adAccountDecision(running, 1, "google", "456", false).ok, false)
    assert.equal(accountsAfter({ live: { google: ["1"], meta: ["act_1"] }, picks: { google: "1", meta: "act_1" } }, "meta", "act_1").size, 2)
  })

  const kinds: QuotaKind[] = ["content_piece:blog", "publish:social", "ai_cost_usd"]
  await test("every plan has a number for every kind", () => {
    for (const p of ["none", "starter", "pro", "growth"]) for (const k of kinds) assert.ok(Object.keys(limitsFor(p, k)).length > 0, `${p} ${k}`)
  })

  console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`)
}

void main()
