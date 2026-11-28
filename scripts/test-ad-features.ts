// Unit tests for the owner's ad rules (pure engine), the shareable report (signed token, ranges,
// summary) and the promote request builders (Meta + LinkedIn). No database, no network: the
// LinkedIn call helper runs against a mocked fetch. Nothing here can create or change an ad.
// Run: npx tsx scripts/test-ad-features.ts
import assert from "node:assert/strict"
import { describeRule, evaluateRules, GUARD_FLOOR, metricValue, PRESETS, RAISE_MIN_CONVERSIONS, validateRule, type AdRule, type RuleContext, type RuleTarget, type Stats } from "../src/lib/ad-rules/engine"
import { daysIn, liveLink, makeReportToken, periodPhrase, rangeFor, readReportToken, type ReportLink } from "../src/lib/ad-report/token"
import { reportKpis, summarize, totalsOf, type ReportRow } from "../src/lib/ad-report/summary"
import { promoBlocker, promoRequests, type PromoSpec } from "../src/lib/metaads/promote-rules"
import { hasAdsScopes, liCall, liPromoRequests, liStatusPatch } from "../src/lib/linkedin-ads/api"
import { engagementRate, splitPicks } from "../src/lib/promote/rank"
import type { PostPick } from "../src/lib/promote/posts"

let passed = 0
async function test(name: string, fn: () => Promise<void> | void) {
  await fn()
  passed++
  console.log(`ok - ${name}`)
}

// ── Rule engine ─────────────────────────────────────────────────────────────
const S = (o: Partial<Stats> = {}): Stats => ({ spend: 0, impressions: 0, clicks: 0, conversions: 0, frequency: null, revenue: null, ...o })
const rule = (o: Partial<AdRule>): AdRule => {
  const v = validateRule({ id: "rule1", level: "ad", platform: "all", metric: "cpl", op: "gt", value: 30, days: 30, minSpend: 60, minImpressions: 0, action: "pause", ...o })
  if (!v.ok) throw new Error(v.error)
  return v.rule
}
const ad = (o: Partial<RuleTarget> & { w?: Stats; d?: 7 | 14 | 30 } = {}): RuleTarget => ({
  key: "meta:ad:1", platform: "meta", level: "ad", campaign: "meta:c1", name: "Ad 1 in “Spring”", status: "active", liveDays: 20, currency: "USD", windows: { [o.d ?? 30]: o.w ?? S() }, ...o,
})
const camp = (o: Partial<RuleTarget> & { w?: Stats; d?: 7 | 14 | 30 } = {}): RuleTarget => ({ ...ad(o), key: "meta:campaign:c1", level: "campaign", name: "“Spring”", dailyBudget: 20, ...o })
const ctx = (o: Partial<RuleContext> = {}): RuleContext => ({ capDaily: 100, committedDaily: 20, canChangeBudget: true, actedToday: new Set(), notedThisWeek: new Set(), ...o })

async function main() {
await test("validate: needs a minimum-data guard", () => {
  const v = validateRule({ metric: "cpl", op: "gt", value: 30, minSpend: 0, minImpressions: 0, action: "pause", level: "ad" })
  assert.equal(v.ok, false)
  assert.ok(validateRule({ metric: "cpl", op: "gt", value: 30, minSpend: GUARD_FLOOR.spend, action: "pause", level: "ad" }).ok)
  assert.equal(validateRule({ metric: "ctr", op: "lt", value: 1, minSpend: 100, minImpressions: 10, action: "notify", level: "ad" }).ok, false, "CTR needs impressions")
})
await test("validate: budget rules are campaign level, capped at 50%", () => {
  assert.equal(validateRule({ metric: "cpl", op: "lt", value: 20, minSpend: 50, action: "budget", level: "ad", budgetPct: 20 }).ok, false)
  assert.equal(validateRule({ metric: "cpl", op: "lt", value: 20, minSpend: 50, action: "budget", level: "campaign", budgetPct: 80 }).ok, false)
  assert.ok(validateRule({ metric: "cpl", op: "lt", value: 20, minSpend: 50, action: "budget", level: "campaign", budgetPct: 20 }).ok)
})
await test("validate: Google is campaign level and has no frequency", () => {
  assert.equal(validateRule({ metric: "cpl", op: "gt", value: 30, minSpend: 60, action: "pause", level: "ad", platform: "google" }).ok, false)
  assert.equal(validateRule({ metric: "frequency", op: "gt", value: 4, minImpressions: 1000, action: "notify", level: "campaign", platform: "google" }).ok, false)
})
await test("every preset is a valid rule", () => {
  for (const p of PRESETS) assert.ok(validateRule(p.rule).ok, p.key)
})
await test("metric values: no leads after spend = CPL above any limit; nothing to divide = null", () => {
  assert.equal(metricValue("cpl", S({ spend: 60 })), Infinity)
  assert.equal(metricValue("cpl", S()), null)
  assert.equal(metricValue("cpl", S({ spend: 90, conversions: 3 })), 30)
  assert.equal(metricValue("ctr", S({ impressions: 1000, clicks: 12 })), 1.2)
  assert.equal(metricValue("roas", S({ spend: 100 })), null)
})
await test("pause an ad when CPL is over the limit after the spend guard", () => {
  const r = rule({})
  const out = evaluateRules([r], [ad({ w: S({ spend: 126.3, conversions: 3, impressions: 5000, clicks: 80 }) })], ctx())
  assert.equal(out.actions.length, 1)
  assert.equal(out.actions[0].kind, "pause")
  assert.match(out.actions[0].why, /\$42\.10/)
  assert.match(out.actions[0].why, /\$126\.30 spent/)
  assert.ok(!/[—–]/.test(out.actions[0].why), "no dashes")
})
await test("below the minimum data: no decision", () => {
  const out = evaluateRules([rule({})], [ad({ w: S({ spend: 59, conversions: 0 }) })], ctx())
  assert.equal(out.actions.length, 0)
  assert.equal(out.checks[0].result, "not_enough_data")
})
await test("spent past the guard with no leads counts as over the CPL limit", () => {
  const out = evaluateRules([rule({})], [ad({ w: S({ spend: 75 }) })], ctx())
  assert.equal(out.actions[0]?.kind, "pause")
  assert.match(out.actions[0].why, /no leads/)
})
await test("never acts on a paused or ended target", () => {
  const out = evaluateRules([rule({})], [ad({ status: "paused", w: S({ spend: 500 }) }), ad({ key: "meta:ad:2", status: "ended", w: S({ spend: 500 }) })], ctx())
  assert.equal(out.actions.length, 0)
  assert.deepEqual(out.checks.map((c) => c.result), ["not_running", "not_running"])
})
await test("at most one change per ad per day (history and within a run)", () => {
  const out = evaluateRules([rule({})], [ad({ w: S({ spend: 500 }) })], ctx({ actedToday: new Set(["meta:ad:1"]) }))
  assert.equal(out.actions.length, 0)
  assert.equal(out.checks[0].result, "done_today")
  const two = evaluateRules([rule({ id: "a1" }), rule({ id: "a2", metric: "spend", op: "gt", value: 100 })], [ad({ w: S({ spend: 500 }) })], ctx())
  assert.equal(two.actions.length, 1)
})
await test("pausing a campaign stops its ads being judged in the same run", () => {
  const rc = rule({ id: "c", level: "campaign", metric: "conversions", op: "lt", value: 1, minSpend: 100 })
  const ra = rule({ id: "a", minSpend: 10 })
  const out = evaluateRules([ra, rc], [camp({ w: S({ spend: 200 }) }), ad({ w: S({ spend: 200 }) })], ctx())
  assert.deepEqual(out.actions.map((a) => a.targetKey), ["meta:campaign:c1"])
})
await test("raise budget 20% when CPL is under the limit for 7 days, inside the monthly cap", () => {
  const r = rule({ level: "campaign", metric: "cpl", op: "lt", value: 20, days: 7, minSpend: 50, action: "budget", budgetPct: 20 })
  const out = evaluateRules([r], [camp({ d: 7, w: S({ spend: 60, conversions: 4 }) })], ctx())
  assert.equal(out.actions[0].kind, "budget")
  assert.equal(out.actions[0].from, 20)
  assert.equal(out.actions[0].to, 24)
  // Only 2 a day of room left under the cap: capped there, and said so.
  const capped = evaluateRules([r], [camp({ d: 7, w: S({ spend: 60, conversions: 4 }) })], ctx({ capDaily: 22, committedDaily: 20 }))
  assert.equal(capped.actions[0].to, 22)
  assert.match(capped.actions[0].why, /monthly limit/)
  // No room: a note, nothing changed.
  const full = evaluateRules([r], [camp({ d: 7, w: S({ spend: 60, conversions: 4 }) })], ctx({ capDaily: 20, committedDaily: 20 }))
  assert.equal(full.actions[0].kind, "notify")
})
await test("budget raises need real results, enough days, a limit and Autopilot", () => {
  const r = rule({ level: "campaign", metric: "cpl", op: "lt", value: 20, days: 7, minSpend: 50, action: "budget", budgetPct: 20 })
  const few = evaluateRules([r], [camp({ d: 7, w: S({ spend: 60, conversions: RAISE_MIN_CONVERSIONS - 1 }) })], ctx())
  assert.equal(few.actions.length, 0)
  const young = evaluateRules([r], [camp({ d: 7, liveDays: 3, w: S({ spend: 60, conversions: 4 }) })], ctx())
  assert.equal(young.actions.length, 0)
  const noCap = evaluateRules([r], [camp({ d: 7, w: S({ spend: 60, conversions: 4 }) })], ctx({ capDaily: null }))
  assert.equal(noCap.actions[0].kind, "notify")
  assert.match(noCap.actions[0].why, /monthly limit first/)
  const noConsent = evaluateRules([r], [camp({ d: 7, w: S({ spend: 60, conversions: 4 }) })], ctx({ canChangeBudget: false }))
  assert.equal(noConsent.actions[0].kind, "notify")
  assert.match(noConsent.actions[0].why, /Autopilot/)
})
await test("two raises in one run share the room under the cap", () => {
  const r = rule({ level: "campaign", metric: "cpl", op: "lt", value: 20, days: 7, minSpend: 50, action: "budget", budgetPct: 50 })
  const a = camp({ d: 7, w: S({ spend: 60, conversions: 4 }) })
  const b = camp({ d: 7, key: "meta:campaign:c2", campaign: "meta:c2", w: S({ spend: 60, conversions: 4 }) })
  const out = evaluateRules([r], [a, b], ctx({ capDaily: 55, committedDaily: 40 }))
  const total = out.actions.filter((x) => x.kind === "budget").reduce((s, x) => s + (x.to! - x.from!), 0)
  assert.ok(total <= 15 + 0.001, `raised ${total}, room was 15`)
})
await test("tell me: one note per rule per target per week, and it changes nothing", () => {
  const r = rule({ metric: "ctr", op: "lt", value: 0.8, minSpend: 0, minImpressions: 1000, action: "notify", days: 7 })
  const t = ad({ d: 7, w: S({ impressions: 2000, clicks: 10, spend: 20 }) })
  const out = evaluateRules([r], [t], ctx())
  assert.equal(out.actions[0].kind, "notify")
  assert.match(out.actions[0].why, /changed nothing/)
  const again = evaluateRules([r], [t], ctx({ notedThisWeek: new Set([`${r.id}|${t.key}`]) }))
  assert.equal(again.actions.length, 0)
})
await test("ROAS rules wait: unavailable until revenue is tracked", () => {
  const r = rule({ metric: "roas", op: "lt", value: 2, minSpend: 50, action: "notify" })
  const out = evaluateRules([r], [ad({ w: S({ spend: 100 }) })], ctx())
  assert.equal(out.checks[0].result, "unavailable")
  const tracked = evaluateRules([r], [ad({ w: S({ spend: 100, revenue: 150 }) })], ctx())
  assert.equal(tracked.actions[0]?.kind, "notify")
})
await test("scope: platform and campaign filters", () => {
  const r = rule({ platform: "google", level: "campaign", metric: "spend", op: "gt", value: 10, minSpend: 10 })
  const g: RuleTarget = { ...camp({ w: S({ spend: 50 }) }), key: "google:campaign:x", platform: "google", campaign: "google:x" }
  const out = evaluateRules([r], [camp({ w: S({ spend: 50 }) }), g], ctx())
  assert.deepEqual(out.actions.map((a) => a.targetKey), ["google:campaign:x"])
  const only = rule({ campaign: "meta:c9", minSpend: 10 })
  assert.equal(evaluateRules([only], [ad({ w: S({ spend: 500 }) })], ctx()).actions.length, 0)
})
await test("describeRule is plain English with no dashes", () => {
  const t = describeRule(rule({}))
  assert.equal(t, "Pause an ad when its cost per lead is over $30, once it has spent $60 (last 30 days).")
  assert.match(describeRule(rule({ level: "campaign", metric: "conversions", op: "lt", value: 1, minSpend: 100 })), /when it has no leads/)
})

// ── Report token + summary ──────────────────────────────────────────────────
process.env.CRON_SECRET = "test-secret-0123456789abcdef"
await test("report token: signed, expiring, tamper-proof", () => {
  const exp = new Date(Date.now() + 86_400_000)
  const t = makeReportToken("user1", "link1", exp)!
  assert.deepEqual(readReportToken(t), { u: "user1", r: "link1", e: exp.getTime() })
  const [p, m] = t.split(".")
  const forged = Buffer.from(JSON.stringify({ u: "user2", r: "link1", e: exp.getTime() })).toString("base64url")
  assert.equal(readReportToken(`${forged}.${m}`), null)
  assert.equal(readReportToken(`${p}.${m}x`), null)
  assert.equal(readReportToken(t, exp.getTime() + 1), null, "expired")
  process.env.AD_REPORT_SECRET = "another-secret-0123456789"
  assert.equal(readReportToken(t), null, "a different secret")
  delete process.env.AD_REPORT_SECRET
})
await test("report link: revoked or expired links show nothing", () => {
  const l: ReportLink = { id: "a", from: "2026-11-01", to: "2026-11-30", label: "November 2026", createdAt: "2026-12-01T00:00:00Z", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), by: "owner" }
  const claim = { u: "u", r: "a", e: Date.now() + 86_400_000 }
  assert.ok(liveLink([l], claim))
  assert.equal(liveLink([{ ...l, revokedAt: new Date().toISOString() }], claim), null)
  assert.equal(liveLink([{ ...l, expiresAt: new Date(Date.now() - 1000).toISOString() }], claim), null)
  assert.equal(liveLink([l], { ...claim, r: "b" }), null)
})
await test("ranges: last 7/30 end yesterday, last month is the calendar month", () => {
  const now = new Date("2026-12-01T10:00:00Z")
  assert.deepEqual(rangeFor("month", now), { from: "2026-11-01", to: "2026-11-30", label: "November 2026" })
  const r7 = rangeFor("last7", now)
  assert.equal(r7.to, "2026-11-30"); assert.equal(daysIn(r7), 7)
  assert.equal(daysIn(rangeFor("last30", now)), 30)
  assert.equal(periodPhrase(rangeFor("month", now)), "In November 2026")
  assert.equal(periodPhrase(r7), "From Nov 24, 2026 to Nov 30, 2026")
})
const row = (o: Partial<ReportRow>): ReportRow => ({ platform: "Facebook & Instagram", name: "A", status: "Running", currency: "USD", spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: null, ...o })
await test("report summary: every number from the rows, no ROAS without revenue", () => {
  const rows = [row({ name: "Spring", spend: 300, impressions: 20000, clicks: 400, conversions: 10 }), row({ name: "Google", platform: "Google", spend: 200, impressions: 5000, clicks: 100, conversions: 2 })]
  const s = summarize({ period: "In November 2026", rows, changes: 3, currencies: ["USD"] })
  assert.equal(s[0], "In November 2026, your ads spent $500 and brought 12 leads, $41.67 each.")
  assert.match(s[1], /2% of the times.*500 clicks from 25,000 views, \$1 a click/)
  assert.ok(s.some((x) => x.includes("“Spring” brought leads for the least: $30 each.")))
  assert.ok(!s.some((x) => /times what the ads cost/.test(x)), "no ROAS line")
  assert.ok(s.some((x) => x.includes("3 changes")))
  for (const x of s) assert.ok(!/[—–]/.test(x), "no dashes")
  assert.equal(reportKpis(totalsOf(rows)).roas, null)
})
await test("report summary: no spend, mixed currencies, revenue only when every row has it", () => {
  assert.deepEqual(summarize({ period: "In November 2026", rows: [], changes: 0, currencies: [] }), ["In November 2026, your ads didn’t spend anything."])
  const mixed = summarize({ period: "In November 2026", rows: [row({ spend: 10, currency: "USD" }), row({ spend: 10, currency: "CAD" })], changes: 0, currencies: ["USD", "CAD"] })
  assert.match(mixed[0], /USD and CAD/)
  assert.equal(totalsOf([row({ spend: 10, revenue: 30 }), row({ spend: 10 })]).revenue, null)
  const t = totalsOf([row({ spend: 10, revenue: 30 }), row({ spend: 10, revenue: 10 })])
  assert.equal(reportKpis(t).roas, 2)
  const withSales = summarize({ period: "In November 2026", rows: [row({ spend: 100, revenue: 250, conversions: 2 })], changes: 0, currencies: ["USD"] })
  assert.ok(withSales.includes("Sales the ad platforms tracked were worth $250, 2.5 times what the ads cost."))
})

// ── Promote: Meta builders ──────────────────────────────────────────────────
const spec = (o: Partial<PromoSpec> = {}): PromoSpec => ({ adAccountId: "act_1", currency: "USD", name: "Biz · promoted post", special: "NONE", country: "US", dailyBudget: 12.5, pageId: "111", city: { key: "2420379", name: "Austin" }, radiusMiles: 10, from: "facebook", postId: "111_222", igUserId: "999", ...o })
await test("promote (Meta): everything PAUSED, engagement objective, existing Facebook post", () => {
  const r = promoRequests(spec())
  assert.equal(r.campaign.status, "PAUSED")
  assert.equal(r.campaign.objective, "OUTCOME_ENGAGEMENT")
  assert.deepEqual(r.campaign.special_ad_categories, [])
  const set = r.adSet("c1")
  assert.equal(set.status, "PAUSED"); assert.equal(set.optimization_goal, "POST_ENGAGEMENT"); assert.equal(set.destination_type, "ON_POST")
  assert.equal(set.daily_budget, "1250", "minor units")
  assert.deepEqual((set.targeting as { geo_locations: unknown }).geo_locations, { cities: [{ key: "2420379", radius: 10, distance_unit: "mile" }] })
  assert.deepEqual(r.creative, { name: "Biz · promoted post · post", object_story_id: "111_222" })
  assert.equal(r.ad("s1", "cr1").status, "PAUSED")
})
await test("promote (Meta): Instagram post uses source_instagram_media_id; special categories widen the radius", () => {
  const r = promoRequests(spec({ from: "instagram", postId: "1789", special: "HOUSING" }))
  assert.deepEqual(r.creative, { name: "Biz · promoted post · post", object_id: "111", instagram_user_id: "999", source_instagram_media_id: "1789" })
  assert.deepEqual(r.campaign.special_ad_categories, ["HOUSING"])
  assert.deepEqual(r.campaign.special_ad_category_country, ["US"])
  const t = r.adSet("c").targeting as { geo_locations: { cities: { radius: number }[] }; age_max?: number }
  assert.equal(t.geo_locations.cities[0].radius, 15); assert.equal(t.age_max, 65)
})
await test("promote (Meta): only posts on the ads' own Page / Instagram account", () => {
  assert.equal(promoBlocker({ from: "facebook", externalId: "111_222", pageId: "111", accountExternalId: "111" }), null)
  assert.match(promoBlocker({ from: "facebook", externalId: "333_222", pageId: "111", accountExternalId: "333" })!, /different Page/)
  assert.match(promoBlocker({ from: "facebook", externalId: "222", pageId: "111", accountExternalId: "111" })!, /full id/)
  assert.equal(promoBlocker({ from: "instagram", externalId: "1789", pageId: "111", igUserId: "999", accountExternalId: "999" }), null)
  assert.match(promoBlocker({ from: "instagram", externalId: "1789", pageId: "111", igUserId: "999", accountExternalId: "888" })!, /different Instagram/)
})

// ── Promote: LinkedIn builders + call helper (mocked fetch) ────────────────
await test("promote (LinkedIn): campaign PAUSED, Sponsored Content from the Page post, political intent only when confirmed", () => {
  const r = liPromoRequests({ adAccountId: "5123", currency: "USD", name: "Biz", orgUrn: "urn:li:organization:42", postUrn: "urn:li:share:777", dailyBudget: 25, days: 7, geoUrns: ["urn:li:geo:103644278"], notPolitical: true, startMs: 1_000 })
  assert.equal(r.group.account, "urn:li:sponsoredAccount:5123")
  assert.equal(r.group.runSchedule.end, 1_000 + 7 * 86_400_000)
  const c = r.campaign("urn:li:sponsoredCampaignGroup:9")
  assert.equal(c.status, "PAUSED"); assert.equal(c.type, "SPONSORED_UPDATES"); assert.equal(c.associatedEntity, "urn:li:organization:42")
  assert.deepEqual(c.dailyBudget, { amount: "25.00", currencyCode: "USD" })
  assert.equal(c.politicalIntent, "NOT_POLITICAL"); assert.equal(c.offsiteDeliveryEnabled, false)
  assert.deepEqual(r.creative("urn:li:sponsoredCampaign:1"), { campaign: "urn:li:sponsoredCampaign:1", content: { reference: "urn:li:share:777" }, intendedStatus: "ACTIVE" })
  assert.equal(liPromoRequests({ adAccountId: "1", currency: "USD", name: "x", orgUrn: "urn:li:organization:1", postUrn: "urn:li:ugcPost:2", dailyBudget: 10, days: 3, geoUrns: ["urn:li:geo:1"], notPolitical: false, startMs: 0 }).campaign("g").politicalIntent, "NOT_DECLARED")
  assert.throws(() => liPromoRequests({ adAccountId: "1", currency: "USD", name: "x", orgUrn: "urn:li:person:1", postUrn: "urn:li:share:2", dailyBudget: 10, days: 3, geoUrns: ["g"], notPolitical: true, startMs: 0 }), /company Page/)
  assert.deepEqual(liStatusPatch(true, { startMs: 5, days: 3 }), { patch: { $set: { status: "ACTIVE", runSchedule: { start: 5, end: 5 + 3 * 86_400_000 } } } })
  assert.deepEqual(liStatusPatch(false), { patch: { $set: { status: "PAUSED" } } })
  assert.ok(hasAdsScopes("r_ads rw_ads")); assert.equal(hasAdsScopes("r_ads"), false)
})
await test("LinkedIn call helper: version headers, id header, readable error (mocked, nothing sent)", async () => {
  const seen: { url: string; init: RequestInit }[] = []
  const ok = async (url: string, init: RequestInit) => { seen.push({ url, init }); return new Response("", { status: 201, headers: { "x-restli-id": "urn:li:sponsoredCampaign:55" } }) }
  const r = await liCall("tok", "adAccounts/1/adCampaigns", { method: "POST", body: { a: 1 }, fetchImpl: ok })
  assert.equal(r.id, "urn:li:sponsoredCampaign:55")
  const h = seen[0].init.headers as Record<string, string>
  assert.equal(h["X-Restli-Protocol-Version"], "2.0.0"); assert.match(h["LinkedIn-Version"], /^\d{6}$/)
  assert.equal(seen[0].url, "https://api.linkedin.com/rest/adAccounts/1/adCampaigns")
  const bad = async () => new Response(JSON.stringify({ message: "Not enough permissions" }), { status: 403 })
  await assert.rejects(liCall("tok", "x", { fetchImpl: bad }), /LinkedIn 403: Not enough permissions/)
})

// ── Promote: ranking ────────────────────────────────────────────────────────
await test("posts rank only by real stats; the rest are recent, newest first", () => {
  assert.equal(engagementRate({ impressions: 50, likes: 5, comments: 0, at: "" }), null, "under the minimum views")
  assert.equal(engagementRate({ impressions: 1000, likes: 20, comments: 5, shares: 3, clicks: 12, at: "" }), 4)
  const p = (id: string, rate: number | null, at: string): PostPick => ({ socialPostId: id, platform: rate === null ? "facebook" : "linkedin", accountId: "a", accountName: "x", externalId: "e", url: null, text: "t", image: null, publishedAt: at, stats: null, rate })
  const { ranked, recent } = splitPicks([p("a", 2, "2026-11-01"), p("b", 5, "2026-10-01"), p("c", null, "2026-11-20"), p("d", null, "2026-11-25")])
  assert.deepEqual(ranked.map((x) => x.socialPostId), ["b", "a"])
  assert.deepEqual(recent.map((x) => x.socialPostId), ["d", "c"])
})

console.log(`\n${passed} passed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
