// Unit tests for Facebook + Instagram ads: the build sequence (pixel linking, promoted_object per
// goal), insights totals + KPIs, and creative fatigue. Mocked fetch, never calls Meta.
// Run: npx tsx scripts/test-meta-ads.ts
import assert from "node:assert/strict"
import { buildPaused, dailyAdInsights, deliveryFor, totalsOf, trackingSpecs, type CampaignSpec } from "../src/lib/metaads/graph"
import { detectFatigue, FATIGUE, type AdDay } from "../src/lib/metaads/rules"
import { kpisOf, pct } from "../src/lib/ads-kpis"
import { THRESHOLDS } from "../src/lib/ad-strategy/playbook"

let passed = 0
async function test(name: string, fn: () => Promise<void> | void) {
  await fn()
  passed++
  console.log(`ok - ${name}`)
}

type Call = { url: string; method: string; params: URLSearchParams }
function mockFetch(answer: (c: Call) => unknown) {
  const calls: Call[] = []
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? "GET"
    const params = method === "GET" ? new URL(url).searchParams : new URLSearchParams(String(init?.body ?? ""))
    const c = { url: url.split("?")[0], method, params }
    calls.push(c)
    return new Response(JSON.stringify(answer(c)), { status: 200, headers: { "Content-Type": "application/json" } })
  }) as typeof fetch
  return calls
}
let n = 0
const ids = (c: Call) => {
  if (c.url.endsWith("/adimages")) return { images: { x: { hash: `h${++n}` } } }
  return { id: `id${++n}` }
}
const json = (c: Call, k: string) => JSON.parse(c.params.get(k) ?? "null")

const spec = (o: Partial<CampaignSpec> = {}): CampaignSpec => ({
  adAccountId: "act_1", currency: "USD", name: "Test", goal: "OUTCOME_LEADS", special: "NONE", country: "US", dailyBudget: 10,
  pageId: "page1", pageToken: "ptok", igUserId: null, pixelId: null, website: "https://example.com", privacyUrl: "https://example.com/privacy",
  city: { key: "2420379", name: "Austin" }, radiusMiles: 10, ads: [{ primaryText: "p", headline: "h", description: "d", jpegB64: "AAAA" }], ...o,
})

async function main() {
  await test("deliveryFor: instant form = LEAD_GENERATION, ON_AD, promoted_object page_id", () => {
    const d = deliveryFor({ goal: "OUTCOME_LEADS", pageId: "p", pixelId: "px", website: "https://x.com" })
    assert.deepEqual(d, { optimization_goal: "LEAD_GENERATION", destination_type: "ON_AD", promoted_object: { page_id: "p" }, form: true })
  })
  await test("deliveryFor: website leads = OFFSITE_CONVERSIONS + promoted_object pixel_id + LEAD", () => {
    const d = deliveryFor({ goal: "OUTCOME_LEADS", leadsOn: "website", pageId: "p", pixelId: "px", website: "https://x.com" })
    assert.deepEqual(d, { optimization_goal: "OFFSITE_CONVERSIONS", destination_type: "WEBSITE", promoted_object: { pixel_id: "px", custom_event_type: "LEAD" }, form: false })
  })
  await test("deliveryFor: website leads without a pixel or website refuse", () => {
    assert.throws(() => deliveryFor({ goal: "OUTCOME_LEADS", leadsOn: "website", pageId: "p", pixelId: null, website: "https://x.com" }), /Pixel/)
    assert.throws(() => deliveryFor({ goal: "OUTCOME_LEADS", leadsOn: "website", pageId: "p", pixelId: "px", website: null }), /website/)
  })
  await test("deliveryFor: traffic stays LINK_CLICKS to the website, no promoted_object (even with a pixel)", () => {
    const d = deliveryFor({ goal: "OUTCOME_TRAFFIC", pageId: "p", pixelId: "px", website: "https://x.com" })
    assert.deepEqual(d, { optimization_goal: "LINK_CLICKS", destination_type: "WEBSITE", form: false })
  })
  await test("trackingSpecs: offsite_conversion + fb_pixel, null without a pixel", () => {
    assert.deepEqual(trackingSpecs("px"), [{ "action.type": ["offsite_conversion"], fb_pixel: ["px"] }])
    assert.equal(trackingSpecs(null), null)
  })

  await test("buildPaused (form leads + pixel): form first, ad set page_id, every ad tracks the pixel, all PAUSED", async () => {
    const calls = mockFetch(ids)
    const b = await buildPaused("tok", spec({ pixelId: "px9", ads: [{ primaryText: "a", headline: "b", description: "c", jpegB64: "A" }, { primaryText: "a2", headline: "b2", description: "c2", jpegB64: "B" }] }))
    assert.ok(calls[0].url.endsWith("/page1/leadgen_forms"))
    const adset = calls.find((c) => c.url.endsWith("/adsets"))!
    assert.equal(adset.params.get("optimization_goal"), "LEAD_GENERATION")
    assert.equal(adset.params.get("destination_type"), "ON_AD")
    assert.deepEqual(json(adset, "promoted_object"), { page_id: "page1" })
    assert.equal(adset.params.get("status"), "PAUSED")
    const ads = calls.filter((c) => c.url.endsWith("/ads"))
    assert.equal(ads.length, 2)
    for (const a of ads) {
      assert.deepEqual(json(a, "tracking_specs"), [{ "action.type": ["offsite_conversion"], fb_pixel: ["px9"] }])
      assert.equal(a.params.get("status"), "PAUSED")
    }
    const camp = calls.find((c) => c.url.endsWith("/campaigns"))!
    assert.equal(camp.params.get("status"), "PAUSED")
    assert.ok(b.formId && b.ads.length === 2)
    assert.ok(calls.every((c) => c.params.get("access_token")), "token on every call")
  })

  await test("buildPaused (website leads): no form, pixel promoted_object, ads link to the website", async () => {
    const calls = mockFetch(ids)
    const b = await buildPaused("tok", spec({ pixelId: "px9", leadsOn: "website", privacyUrl: null }))
    assert.ok(!calls.some((c) => c.url.endsWith("/leadgen_forms")))
    assert.equal(b.formId, undefined)
    const adset = calls.find((c) => c.url.endsWith("/adsets"))!
    assert.equal(adset.params.get("optimization_goal"), "OFFSITE_CONVERSIONS")
    assert.equal(adset.params.get("destination_type"), "WEBSITE")
    assert.deepEqual(json(adset, "promoted_object"), { pixel_id: "px9", custom_event_type: "LEAD" })
    const creative = calls.find((c) => c.url.endsWith("/adcreatives"))!
    const ld = json(creative, "object_story_spec").link_data
    assert.equal(ld.link, "https://example.com")
    assert.equal(ld.call_to_action.value.link, "https://example.com")
    assert.equal(ld.call_to_action.value.lead_gen_form_id, undefined)
  })

  await test("buildPaused (traffic, no pixel): valid as before, no promoted_object, no tracking_specs", async () => {
    const calls = mockFetch(ids)
    await buildPaused("tok", spec({ goal: "OUTCOME_TRAFFIC", privacyUrl: null }))
    const adset = calls.find((c) => c.url.endsWith("/adsets"))!
    assert.equal(adset.params.get("optimization_goal"), "LINK_CLICKS")
    assert.equal(adset.params.get("destination_type"), "WEBSITE")
    assert.equal(adset.params.get("promoted_object"), null)
    const ad = calls.find((c) => c.url.endsWith("/ads"))!
    assert.equal(ad.params.get("tracking_specs"), null)
    const creative = calls.find((c) => c.url.endsWith("/adcreatives"))!
    assert.equal(json(creative, "object_story_spec").link_data.call_to_action.type, "LEARN_MORE")
  })

  await test("buildPaused (traffic + pixel): the ads still track the pixel", async () => {
    const calls = mockFetch(ids)
    await buildPaused("tok", spec({ goal: "OUTCOME_TRAFFIC", pixelId: "px1" }))
    assert.equal(calls.find((c) => c.url.endsWith("/adsets"))!.params.get("promoted_object"), null)
    assert.deepEqual(json(calls.find((c) => c.url.endsWith("/ads"))!, "tracking_specs"), [{ "action.type": ["offsite_conversion"], fb_pixel: ["px1"] }])
  })

  await test("dailyAdInsights: time_increment=1, time_range, follows paging links", async () => {
    let page = 0
    const calls = mockFetch(() => (page++ === 0
      ? { data: [{ ad_id: "a", date_start: "2026-11-01", impressions: "10" }], paging: { next: "https://graph.facebook.com/v27.0/c1/insights?after=X&access_token=tok" } }
      : { data: [{ ad_id: "a", date_start: "2026-11-02", impressions: "5" }] }))
    const rows = await dailyAdInsights("tok", "c1", "2026-11-01", "2026-11-28")
    assert.equal(rows.length, 2)
    assert.equal(calls[0].params.get("time_increment"), "1")
    assert.deepEqual(JSON.parse(calls[0].params.get("time_range")!), { since: "2026-11-01", until: "2026-11-28" })
    assert.equal(calls[1].params.get("after"), "X")
    assert.equal(calls[1].params.getAll("access_token").length, 1)
  })

  await test("totalsOf sums link clicks; kpisOf: CTR, CPC, CPM, conversion rate, cost per conversion", () => {
    const t = totalsOf([{ spend: "50", impressions: "4000", clicks: "120", inline_link_clicks: "80", actions: [{ action_type: "lead", value: "4" }] }, { spend: "50", impressions: "6000", clicks: "80", inline_link_clicks: "20" }], "OUTCOME_LEADS")
    assert.deepEqual(t, { spend: 100, impressions: 10000, clicks: 200, linkClicks: 100, results: 4 })
    const k = kpisOf({ spend: t.spend, impressions: t.impressions, clicks: t.linkClicks, conversions: t.results })
    assert.deepEqual(k, { ctr: 1, cpc: 1, cpm: 10, convRate: 4, costPerConversion: 25 })
    assert.deepEqual(kpisOf({ spend: 0, impressions: 0, clicks: 0, conversions: 0 }), { ctr: null, cpc: null, cpm: null, convRate: null, costPerConversion: null })
    assert.equal(pct(1.234), "1.23%")
    assert.equal(pct(null), null)
  })

  // ── Fatigue ──
  const day = (i: number, o: Partial<AdDay>): AdDay => ({ date: new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10), spend: 10, impressions: 400, linkClicks: 8, results: 1, ...o })
  const run = (days: AdDay[], frequency: number | null, goal: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC" = "OUTCOME_LEADS") => detectFatigue([{ adId: "a1", label: "Ad 1", goal, frequency, days }], "USD")
  // 21 days: first week CTR 2%, last week CTR 1.2% (40% lower), steady spend + results.
  const ctrFall = Array.from({ length: 21 }, (_, i) => day(i, { linkClicks: i >= 14 ? 5 : 8 }))

  await test("fatigue: frequency > 3 and CTR down > 30% vs own first week = flagged (ctr)", () => {
    const f = run(ctrFall, 3.4)
    assert.equal(f.length, 1)
    assert.equal(f[0].reason, "ctr")
    assert.match(f[0].why, /3\.4 times/)
    assert.match(f[0].why, /2% in its first week to 1\.3%/)
  })
  await test("fatigue: same CTR fall but frequency ≤ 3 = not flagged", () => {
    assert.equal(run(ctrFall, FATIGUE.frequency).length, 0)
    assert.equal(run(ctrFall, null).length, 0)
  })
  await test("fatigue: CTR down only 25% = not flagged", () => {
    assert.equal(run(Array.from({ length: 21 }, (_, i) => day(i, { linkClicks: i >= 14 ? 6 : 8 })), 4).length, 0)
  })
  await test("fatigue: not enough impressions in a week (under the playbook's judge mark) = not flagged", () => {
    const thin = Array.from({ length: 21 }, (_, i) => day(i, { impressions: 150, linkClicks: i >= 14 ? 1 : 3, spend: 2 }))
    assert.ok(thin.slice(0, 7).reduce((s, d) => s + d.impressions, 0) < THRESHOLDS.metaJudgeImpressions)
    assert.equal(run(thin, 5).length, 0)
  })
  await test("fatigue: under 14 days of delivery = not judged", () => {
    assert.equal(run(ctrFall.slice(0, 13), 5).length, 0)
  })
  await test("fatigue: cost per lead up > 40% vs own first week = flagged (cpa)", () => {
    // first week 70 spent / 7 leads = 10; last week 70 / 3 = 23.33 (+133%)
    const days = Array.from({ length: 21 }, (_, i) => day(i, { results: i >= 14 && i % 2 === 0 ? 0 : 1 }))
    const f = run(days, 1.5)
    assert.equal(f.length, 1)
    assert.equal(f[0].reason, "cpa")
    assert.match(f[0].why, /each lead now costs 23\.33 USD, up from 10 USD/)
  })
  await test("fatigue: cost per lead up only 30% = not flagged; under $60 a week = not judged", () => {
    const mild = Array.from({ length: 21 }, (_, i) => day(i, { spend: i >= 14 ? 13 : 10 }))
    assert.equal(run(mild, 1.5).length, 0)
    const cheap = Array.from({ length: 21 }, (_, i) => day(i, { spend: 5, results: i >= 14 ? 0 : 1 }))
    assert.equal(run(cheap, 1.5).length, 0)
  })
  await test("fatigue: no results this week after a good first week = flagged with the spend", () => {
    const f = run(Array.from({ length: 21 }, (_, i) => day(i, { results: i >= 14 ? 0 : 1 })), 1.2)
    assert.equal(f[0]?.reason, "cpa")
    assert.match(f[0].why, /spent 70 USD this week with no leads/)
  })
  await test("fatigue: an ad that got better is never flagged", () => {
    assert.equal(run(Array.from({ length: 21 }, (_, i) => day(i, { linkClicks: i >= 14 ? 12 : 8, results: i >= 14 ? 2 : 1 })), 4).length, 0)
  })

  console.log(`\n${passed} passed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
