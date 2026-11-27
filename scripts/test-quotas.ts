// Pure tests for plan quotas (lib/quota-rules.ts), AI prices (lib/ai-prices.ts) and the
// "Extra ad account" add-on helpers (lib/stripe.ts). No database, no network.
//   npx tsx scripts/test-quotas.ts
import assert from "node:assert/strict"
import { createLimiter, createPublicCounter, decide, limitsFor, periodStart, planKey, quotaMessage, QuotaError, isQuotaError, type QuotaKind, type UsageStore } from "../src/lib/quota-rules"
import { estimateCallCost, tokCost, usageCost } from "../src/lib/ai-prices"
import { extraAdAccounts, isAdAccountAddon, planItem } from "../src/lib/stripe"

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

  const kinds: QuotaKind[] = ["content_piece:blog", "publish:social", "ai_cost_usd"]
  await test("every plan has a number for every kind", () => {
    for (const p of ["none", "starter", "pro", "growth"]) for (const k of kinds) assert.ok(Object.keys(limitsFor(p, k)).length > 0, `${p} ${k}`)
  })

  console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`)
}

void main()
