// Unit tests for ROAS (lib/roas): source picking, tracked vs estimated, attribution, the Meta and
// Google parsers, the upload payload builders, ROAS-driven tuning and the browser click capture.
// Pure logic + mocked fetch only: never calls Google, Meta, a store or the database.
// Run: npx tsx scripts/test-roas.ts
import assert from "node:assert/strict"
import vm from "node:vm"
import {
  adClick, breakEvenLeads, cleanClick, CLICK_CAPTURE_JS, fbcOf, fmtRoas, ga4Platform, gadsValueKind, inWindow, META_URL_TAGS, metaPurchase,
  overallRoas, pickSource, platformOf, platformRoas, roasGrade, roasOf, SOURCE_ORDER, type PlatformWindow,
} from "../src/lib/roas/rules"
import { assemble, parseOrders } from "../src/lib/roas/assemble"
import { googleDateTime, googleUploadBody, metaSaleEvent, uploadPlan } from "../src/lib/roas/payloads"
import { decideTuning } from "../src/lib/metaads/rules"
import { buildPaused, totalsOf, type CampaignSpec } from "../src/lib/metaads/graph"
import { readFileSync } from "node:fs"
import { THRESHOLDS } from "../src/lib/ad-strategy/playbook"

let passed = 0
async function test(name: string, fn: () => Promise<void> | void) {
  await fn()
  passed++
  console.log(`ok - ${name}`)
}

const NOW = Date.parse("2026-11-28T15:00:00Z")
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString()

async function main() {
  // ── Core maths ────────────────────────────────────────────────────────────
  await test("roasOf: revenue ÷ spend, null without spend or revenue (never a fake 0)", () => {
    assert.equal(roasOf(300, 100), 3)
    assert.equal(roasOf(0, 100), 0)
    assert.equal(roasOf(null, 100), null)
    assert.equal(roasOf(300, 0), null)
    assert.equal(fmtRoas(null), "—")
    assert.equal(fmtRoas(3.14159), "3.14x")
  })

  await test("pickSource: best tracked source with data, in SOURCE_ORDER; estimates never picked", () => {
    assert.deepEqual(SOURCE_ORDER.slice(0, 2), ["meta_purchases", "google_values"])
    const r = pickSource([
      { source: "won_leads", revenue: 500, count: 2, tracked: true },
      { source: "ga4", revenue: 300, count: 3, tracked: true },
      { source: "meta_purchases", revenue: 0, count: 0, tracked: true },
      { source: "google_fixed_values", revenue: 9000, count: 30, tracked: false },
    ])
    assert.equal(r?.source, "ga4")
    assert.equal(pickSource([{ source: "google_fixed_values", revenue: 9000, count: 30, tracked: false }]), null)
  })

  const metaW = (o: Partial<PlatformWindow> = {}): PlatformWindow => ({ platform: "meta", days: 30, spend: 200, currency: "USD", leads: 10, readings: [], ...o })

  await test("platformRoas: tracked from one source, the others shown but never added", () => {
    const p = platformRoas(metaW({ readings: [{ source: "meta_purchases", revenue: 600, count: 4, tracked: true }, { source: "ga4", revenue: 550, count: 4, tracked: true }] }))
    assert.equal(p.source, "meta_purchases")
    assert.equal(p.revenue, 600)
    assert.equal(p.roas, 3)
    assert.equal(p.perSale, 50)
    assert.equal(p.others.length, 1)
    assert.equal(p.others[0].source, "ga4")
  })

  await test("platformRoas: estimate from customer value is separate and labelled, never in revenue/roas", () => {
    const p = platformRoas(metaW(), { amount: 400, source: "estimate" })
    assert.equal(p.revenue, null)
    assert.equal(p.roas, null)
    assert.equal(p.source, null)
    assert.ok(p.estimate)
    assert.equal(p.estimate!.revenue, 4000)
    assert.equal(p.estimate!.roas, 20)
    assert.equal(p.estimate!.valueSource, "estimate")
    // 200 / 10 = $20 a lead, $400 a customer → pays for itself at 1 in 20.
    assert.equal(p.estimate!.breakEven, 20)
    assert.equal(breakEvenLeads(200, 10, 10), 0)
    assert.equal(breakEvenLeads(0, 10, 10), null)
  })

  await test("platformRoas: no spend → no ROAS and no estimate", () => {
    const p = platformRoas(metaW({ spend: 0, readings: [{ source: "won_leads", revenue: 100, count: 1, tracked: true }] }), { amount: 400, source: "owner" })
    assert.equal(p.roas, null)
    assert.equal(p.estimate, null)
  })

  await test("overallRoas: only platforms with a tracked source; uncovered platforms named; mixed currencies = no number", () => {
    const meta = platformRoas(metaW({ readings: [{ source: "meta_purchases", revenue: 600, count: 4, tracked: true }] }))
    const google = platformRoas({ platform: "google", days: 30, spend: 300, currency: "USD", leads: 5, readings: [] })
    const o = overallRoas([meta, google], 30)
    assert.equal(o.roas, 3)
    assert.equal(o.spend, 200)
    assert.deepEqual(o.covers, ["meta"])
    assert.deepEqual(o.uncovered, ["google"])
    const cad = platformRoas({ platform: "google", days: 30, spend: 300, currency: "CAD", leads: 5, readings: [{ source: "google_values", revenue: 900, count: 3, tracked: true }] })
    assert.equal(overallRoas([meta, cad], 30).roas, null)
    assert.equal(overallRoas([], 30).roas, null)
  })

  await test("roasGrade: kill/hold/scale only after the judge spend, from the playbook marks", () => {
    assert.equal(roasGrade(0.5, 10), "wait")
    assert.equal(roasGrade(0.5, THRESHOLDS.metaJudgeSpend), "kill")
    assert.equal(roasGrade(1.5, 100), "hold")
    assert.equal(roasGrade(2, 100), "scale")
    assert.equal(roasGrade(null, 1000), "wait")
    assert.ok(THRESHOLDS.rows.some((r) => /Return on ad spend/.test(r.metric)))
  })

  // ── Parsers ──────────────────────────────────────────────────────────────
  await test("metaPurchase: takes omni_purchase first, never sums overlapping purchase types", () => {
    const row = {
      actions: [{ action_type: "purchase", value: "3" }, { action_type: "omni_purchase", value: "3" }, { action_type: "offsite_conversion.fb_pixel_purchase", value: "3" }, { action_type: "lead", value: "9" }],
      action_values: [{ action_type: "offsite_conversion.fb_pixel_purchase", value: "150.50" }, { action_type: "omni_purchase", value: "150.50" }, { action_type: "purchase", value: "150.50" }],
    }
    assert.deepEqual(metaPurchase(row), { value: 150.5, count: 3 })
    assert.deepEqual(metaPurchase({ actions: [{ action_type: "lead", value: "2" }] }), { value: 0, count: 0 })
  })

  await test("totalsOf (Meta insights): purchases + purchase value summed per row", () => {
    const t = totalsOf([
      { spend: "10", impressions: "100", clicks: "5", inline_link_clicks: "4", actions: [{ action_type: "lead", value: "1" }, { action_type: "omni_purchase", value: "1" }], action_values: [{ action_type: "omni_purchase", value: "80" }] },
      { spend: "5", impressions: "50", clicks: "2", inline_link_clicks: "2", actions: [{ action_type: "purchase", value: "2" }], action_values: [{ action_type: "purchase", value: "40" }] },
    ], "OUTCOME_LEADS")
    assert.equal(t.spend, 15)
    assert.equal(t.results, 1)
    assert.equal(t.purchases, 3)
    assert.equal(t.purchaseValue, 120)
  })

  await test("gadsValueKind: real tag values vs fixed values vs counts (1 per conversion) vs none", () => {
    assert.equal(gadsValueKind([], { conversions: 4, value: 400 }), "none")
    assert.equal(gadsValueKind([{ includeInConversionsMetric: false, alwaysUseDefaultValue: false }], { conversions: 4, value: 400 }), "none")
    assert.equal(gadsValueKind([{ alwaysUseDefaultValue: false, defaultValue: 0 }], { conversions: 4, value: 812.4 }), "real")
    assert.equal(gadsValueKind([{ alwaysUseDefaultValue: true, defaultValue: 150 }], { conversions: 4, value: 600 }), "fixed")
    assert.equal(gadsValueKind([{ alwaysUseDefaultValue: true, defaultValue: 1 }], { conversions: 4, value: 4 }), "counts")
    assert.equal(gadsValueKind([{ alwaysUseDefaultValue: false, defaultValue: 1 }], { conversions: 7, value: 0 }), "counts")
  })

  await test("parseOrders: drops bad rows, keeps totals + attribution only", () => {
    const r = parseOrders({ woo: true, currency: "usd", all: { count: 5, total: 900 }, orders: [
      { id: 11, at: "2026-11-20T10:00:00+00:00", total: "120.5", currency: "USD", click: { g: "Cj0KCQiA_abc123", s: "google", m: "cpc" } },
      { id: 12, at: "not a date", total: 10, currency: "USD", click: {} },
      { id: 13, at: "2026-11-21T10:00:00+00:00", total: -5, currency: "USD", click: {} },
      { id: 14, at: "2026-11-22T10:00:00+00:00", total: 50, currency: "USD", click: { s: "facebook", m: "paid_social", c: "Spring", email: "x@y.z" } },
    ] })
    assert.equal(r.state, "ok")
    if (r.state !== "ok") return
    assert.equal(r.orders.length, 2)
    assert.equal(r.orders[0].click.gclid, "Cj0KCQiA_abc123")
    assert.equal(r.orders[1].utm.campaign, "Spring")
    assert.equal(JSON.stringify(r).includes("x@y.z"), false)
    assert.equal(parseOrders({ woo: false }).state, "no_woo")
  })

  // ── Click ids + attribution ──────────────────────────────────────────────
  await test("cleanClick: ids only, junk dropped, fbc built from fbclid + time in Meta's format", () => {
    const c = cleanClick({ g: "Cj0KCQiA_abc123", f: "IwAR2xyz_123", t: 1764340000000, s: "Google", m: "CPC", c: "Brand <script>", x: "nope" })
    assert.equal(c?.click.gclid, "Cj0KCQiA_abc123")
    assert.equal(c?.click.fbc, fbcOf("IwAR2xyz_123", 1764340000000))
    assert.equal(c?.click.fbc, "fb.1.1764340000000.IwAR2xyz_123")
    assert.equal(c?.utm.source, "google")
    assert.equal(c?.utm.medium, "cpc")
    assert.equal(c?.utm.campaign, "Brand script")
    assert.equal(cleanClick({ g: "bad id!", fbc: "fb.1.x.y" }), null)
    assert.equal(cleanClick({ fbc: "fb.1.1764340000000.IwAR2xyz_123" })?.click.fbc, "fb.1.1764340000000.IwAR2xyz_123")
    assert.equal(cleanClick(null), null)
  })

  await test("platformOf: gclid = Google; Meta only for a paid Meta UTM on a campaign I built; fbclid alone = nothing", () => {
    const mine = ["Spring leads"]
    assert.equal(platformOf({ gclid: "Cj0KCQiA_abc123" }, {}, mine), "google")
    assert.equal(platformOf({ wbraid: "wbraid_123456" }, {}, mine), "google")
    assert.equal(platformOf({ fbclid: "IwAR2xyz_123", fbc: "fb.1.1.IwAR2xyz_123" }, {}, mine), null)
    assert.equal(platformOf({}, { source: "facebook", medium: "paid_social", campaign: "spring leads" }, mine), "meta")
    assert.equal(platformOf({}, { source: "instagram", medium: "paid", campaign: "Someone else's" }, mine), null)
    assert.equal(platformOf({}, { source: "google", medium: "organic" }, mine), null)
    assert.equal(platformOf({}, { source: "google", medium: "cpc" }, mine), "google")
    assert.equal(ga4Platform("google / cpc", "Brand", mine), "google")
    assert.equal(ga4Platform("facebook / paid_social", "Spring leads", mine), "meta")
    assert.equal(ga4Platform("l.facebook.com / referral", "(not set)", mine), null)
    assert.equal(adClick({ gclid: "Cj0KCQiA_abc123" }, {}), true)
    assert.equal(adClick({ fbc: "fb.1.1.IwAR2xyz_123" }, {}), false)
    assert.equal(adClick({}, { medium: "paid_social" }), true)
  })

  await test("inWindow: last N days, not counting today (the platforms' convention)", () => {
    assert.equal(inWindow(daysAgo(1), 7, NOW), true)
    assert.equal(inWindow(daysAgo(0), 7, NOW), false)
    assert.equal(inWindow(daysAgo(8), 7, NOW), false)
    assert.equal(inWindow(daysAgo(29), 30, NOW), true)
    assert.equal(inWindow(null, 30, NOW), false)
  })

  await test("assemble: per platform + per campaign, currency-checked, store orders in window only", () => {
    const won = { revenue: 500, count: 2, byCampaignRow: new Map([["row1", { revenue: 500, count: 2 }]]) }
    const out = assemble({
      days: 7, now: NOW,
      meta: { currency: "USD", spend: 100, leads: 6, purchases: 0, purchaseValue: 0, campaigns: [{ rowId: "row1", name: "Spring leads", spend: 100, leads: 6, purchases: 0, purchaseValue: 0 }] },
      google: { currency: "USD", spend: 200, conversions: 4, value: 4, valueKind: "counts", campaigns: [{ id: "9", name: "Brand", spend: 200, conversions: 4, value: 4 }] },
      ga4: { currency: "EUR", rows: [{ sourceMedium: "google / cpc", campaign: "Brand", revenue: 999, purchases: 3 }] },
      orders: [
        { at: daysAgo(2), total: 300, currency: "USD", click: { gclid: "Cj0KCQiA_abc123" }, utm: { campaign: "Brand" } },
        { at: daysAgo(20), total: 700, currency: "USD", click: { gclid: "Cj0KCQiA_old000" }, utm: {} },
        { at: daysAgo(3), total: 80, currency: "USD", click: {}, utm: { source: "facebook", medium: "paid_social", campaign: "Spring leads" } },
      ],
      won: { meta: won, google: null },
    })
    const meta = platformRoas(out.find((p) => p.platform === "meta")!)
    const google = platformRoas(out.find((p) => p.platform === "google")!)
    // Meta: no purchase values → the store's order (woocommerce) comes before won leads.
    assert.equal(meta.source, "woocommerce")
    assert.equal(meta.revenue, 80)
    assert.equal(meta.others.find((o) => o.source === "won_leads")?.revenue, 500)
    assert.equal(meta.campaigns[0].revenue, 80)
    // Google: "1 per conversion" values aren't revenue; GA4 in EUR is skipped; the 20-day-old order is outside 7 days.
    assert.equal(google.source, "woocommerce")
    assert.equal(google.revenue, 300)
    assert.equal(google.roas, 1.5)
    assert.equal(google.campaigns[0].roas, 1.5)
    assert.equal(google.others.some((o) => o.source === "ga4"), false)
  })

  await test("assemble: fixed Google values are shown as an estimate, never as tracked revenue", () => {
    const out = assemble({ days: 30, meta: null, ga4: null, orders: null, won: { meta: null, google: null },
      google: { currency: "USD", spend: 100, conversions: 5, value: 750, valueKind: "fixed", campaigns: [] } })
    const g = platformRoas(out[0])
    assert.equal(g.roas, null)
    assert.equal(g.others[0].source, "google_fixed_values")
    assert.equal(g.others[0].tracked, false)
  })

  // ── Upload payloads (built, never sent) ─────────────────────────────────
  const sale = { ref: "m_abc123", value: 1250.456, currency: "USD", at: "2026-11-27T09:05:03.000Z" }
  await test("googleUploadBody: one click id, UPLOAD_CLICKS action, Google's date format, partialFailure, validateOnly dry run", () => {
    assert.equal(googleDateTime("2026-11-27T09:05:03.000Z"), "2026-11-27 09:05:03+00:00")
    const { path, body } = googleUploadBody({ customerId: "123-456-7890", conversionAction: "customers/1234567890/conversionActions/555", click: { gclid: "Cj0KCQiA_abc123", gbraid: "gb_999999" }, sale, validateOnly: true })
    assert.equal(path, "/customers/1234567890:uploadClickConversions")
    assert.equal(body.partialFailure, true)
    assert.equal(body.validateOnly, true)
    const c = body.conversions[0] as Record<string, unknown>
    assert.equal(c.gclid, "Cj0KCQiA_abc123")
    assert.equal(c.gbraid, undefined)
    assert.equal(c.conversionValue, 1250.46)
    assert.equal(c.currencyCode, "USD")
    assert.equal(c.conversionDateTime, "2026-11-27 09:05:03+00:00")
    assert.equal(c.orderId, "alphaa-m_abc123")
    const b2 = googleUploadBody({ customerId: "1", conversionAction: "customers/1/conversionActions/2", click: { wbraid: "wb_123456" }, sale, validateOnly: false })
    assert.equal((b2.body.conversions[0] as Record<string, unknown>).wbraid, "wb_123456")
    assert.throws(() => googleUploadBody({ customerId: "1", conversionAction: "customers/1/conversionActions/2", click: {}, sale, validateOnly: true }), /click id/)
    assert.throws(() => googleUploadBody({ customerId: "1", conversionAction: "nope", click: { gclid: "Cj0KCQiA_abc123" }, sale, validateOnly: true }), /conversion action/)
    assert.throws(() => googleUploadBody({ customerId: "1", conversionAction: "customers/1/conversionActions/2", click: { gclid: "Cj0KCQiA_abc123" }, sale: { ...sale, value: 0 }, validateOnly: true }), /amount/)
  })

  await test("metaSaleEvent: CRM Purchase with value, lead_id for form leads, fbc for website leads", () => {
    const a = metaSaleEvent({ leadId: "1234567890", fbc: "fb.1.1.x", sale, nowMs: NOW })
    const e = a.data[0]
    assert.equal(e.event_name, "Purchase")
    assert.equal(e.action_source, "system_generated")
    assert.deepEqual(e.user_data, { lead_id: "1234567890" })
    assert.deepEqual(e.custom_data, { value: 1250.46, currency: "USD", event_source: "crm", lead_event_source: "Alphaa" })
    assert.equal(e.event_id, "won_m_abc123")
    assert.equal(e.event_time, Math.floor(Date.parse(sale.at) / 1000))
    assert.deepEqual(metaSaleEvent({ fbc: "fb.1.1764340000000.IwAR2xyz_123", sale }).data[0].user_data, { fbc: "fb.1.1764340000000.IwAR2xyz_123" })
    assert.throws(() => metaSaleEvent({ sale }), /lead id/)
  })

  await test("uploadPlan: owner opt-in per platform, GPC respected, every missing piece named", () => {
    const base = { click: { gclid: "Cj0KCQiA_abc123", fbc: "fb.1.1.IwAR2xyz_123" }, leadId: null, googleConnected: true, capi: true }
    assert.deepEqual(uploadPlan({ ...base, settings: undefined }), { google: "off", meta: "off" })
    assert.deepEqual(uploadPlan({ ...base, settings: { google: true, meta: true, googleAction: "customers/1/conversionActions/2" } }), { google: null, meta: null })
    const gpc = uploadPlan({ ...base, gpc: true, settings: { google: true, meta: true, googleAction: "customers/1/conversionActions/2" } })
    assert.match(gpc.google!, /not to be tracked/)
    assert.match(gpc.meta!, /not to be tracked/)
    assert.match(uploadPlan({ ...base, settings: { google: true } }).google!, /conversion action/)
    assert.match(uploadPlan({ ...base, capi: false, settings: { meta: true } }).meta!, /Conversions API/)
    assert.match(uploadPlan({ ...base, click: {}, settings: { google: true, meta: true, googleAction: "customers/1/conversionActions/2" } }).google!, /No Google click/)
    assert.equal(uploadPlan({ ...base, click: {}, leadId: "999", settings: { meta: true } }).meta, null)
  })

  // ── Tuning by ROAS ──────────────────────────────────────────────────────
  await test("decideTuning: with tracked revenue, budget moves to the higher-ROAS campaign even when its cost per lead is worse", () => {
    const input = (roas: boolean) => ({
      currency: "USD", capDaily: null, roas,
      campaigns: [
        // A: cheap leads ($5 each) but few sales: ROAS 0.5
        { rowId: "A", name: "A", adSetId: "sa", dailyBudget: 20, goal: "OUTCOME_LEADS" as const, revenue: roas ? 50 : null, ads: [{ adId: "a1", spend: 100, results: 20, revenue: roas ? 50 : null }] },
        // B: pricier leads ($10 each) that buy: ROAS 4
        { rowId: "B", name: "B", adSetId: "sb", dailyBudget: 20, goal: "OUTCOME_LEADS" as const, revenue: roas ? 400 : null, ads: [{ adId: "b1", spend: 100, results: 10, revenue: roas ? 400 : null }] },
      ],
    })
    const withRoas = decideTuning(input(true)).actions.filter((a) => a.kind === "budget")
    assert.equal(withRoas.find((a) => a.campaignRowId === "B" && a.kind === "budget")!.kind === "budget" && (withRoas.find((a) => a.campaignRowId === "B") as { to: number }).to, 24)
    assert.match(withRoas.find((a) => a.campaignRowId === "B")!.why, /4x/)
    const byCpl = decideTuning(input(false)).actions.filter((a) => a.kind === "budget")
    assert.equal((byCpl.find((a) => a.campaignRowId === "A") as { to: number }).to, 24)
  })

  await test("decideTuning: an ad that spent 4 days of budget with no sale (while others sold) is paused; never every ad", () => {
    const r = decideTuning({ currency: "USD", capDaily: null, roas: true, campaigns: [
      { rowId: "C", name: "C", adSetId: "sc", dailyBudget: 10, goal: "OUTCOME_LEADS", revenue: 300, ads: [
        { adId: "c1", spend: 45, results: 3, revenue: 0 },
        { adId: "c2", spend: 30, results: 2, revenue: 300 },
        { adId: "c3", spend: 30, results: 2, revenue: 0 },
      ] },
    ] })
    const paused = r.actions.filter((a) => a.kind === "pause_ad").map((a) => (a as { adId: string }).adId)
    assert.deepEqual(paused, ["c1"])
    assert.match(r.summary[0], /in sales/)
    const none = decideTuning({ currency: "USD", capDaily: null, roas: true, campaigns: [
      { rowId: "D", name: "D", adSetId: "sd", dailyBudget: 10, goal: "OUTCOME_LEADS", revenue: 0, ads: [{ adId: "d1", spend: 45, results: 3, revenue: 0 }, { adId: "d2", spend: 45, results: 3, revenue: 0 }] },
    ] })
    assert.equal(none.actions.filter((a) => a.kind === "pause_ad").length, 0)
  })

  // ── Meta website ads carry UTMs ─────────────────────────────────────────
  await test("buildPaused: website ads get url_tags with the campaign's own name; instant-form ads don't", async () => {
    const calls: { url: string; params: URLSearchParams }[] = []
    let n = 0
    globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
      const url = String(input).split("?")[0]
      calls.push({ url, params: new URLSearchParams(String(init?.body ?? "")) })
      return new Response(JSON.stringify(url.endsWith("/adimages") ? { images: { x: { hash: `h${++n}` } } } : { id: `id${++n}` }), { status: 200, headers: { "Content-Type": "application/json" } })
    }) as typeof fetch
    const spec = (o: Partial<CampaignSpec>): CampaignSpec => ({
      adAccountId: "act_1", currency: "USD", name: "Test", goal: "OUTCOME_LEADS", special: "NONE", country: "US", dailyBudget: 10,
      pageId: "page1", pageToken: "ptok", igUserId: null, pixelId: "px1", website: "https://example.com", privacyUrl: "https://example.com/privacy",
      city: { key: "2420379", name: "Austin" }, radiusMiles: 10, ads: [{ primaryText: "p", headline: "h", description: "d", jpegB64: "AAAA" }], ...o,
    })
    await buildPaused("tok", spec({ goal: "OUTCOME_TRAFFIC" }))
    assert.equal(calls.find((c) => c.url.endsWith("/adcreatives"))!.params.get("url_tags"), META_URL_TAGS)
    calls.length = 0
    await buildPaused("tok", spec({}))
    assert.equal(calls.find((c) => c.url.endsWith("/adcreatives"))!.params.get("url_tags"), null)
    assert.match(META_URL_TAGS, /utm_campaign=\{\{campaign\.name\}\}/)
  })

  // ── Browser click capture (the tag + WordPress plugin) ──────────────────
  type Doc = { cookie: string }
  const run = (search: string, gpc: boolean, cookie = "") => {
    const jar: string[] = cookie ? [cookie] : []
    const document = {} as Doc
    Object.defineProperty(document, "cookie", { get: () => jar.join("; "), set: (v: string) => { const [kv] = v.split(";"); const k = kv.split("=")[0]; const i = jar.findIndex((x) => x.startsWith(`${k}=`)); if (i >= 0) jar[i] = kv; else jar.push(kv) } })
    const ctx = vm.createContext({ document, location: { search, protocol: "https:" }, gpc, Date, JSON, String, RegExp, decodeURIComponent, encodeURIComponent })
    vm.runInContext(`${CLICK_CAPTURE_JS}; var out = clk();`, ctx)
    return { out: (ctx as { out: Record<string, unknown> | null }).out, jar }
  }
  await test("CLICK_CAPTURE_JS: remembers gclid + UTM in a first-party cookie and sends it with the lead", () => {
    const r = run("?gclid=Cj0KCQiA_abc123&utm_source=google&utm_medium=cpc&utm_campaign=Brand%20search", false)
    assert.equal(r.out?.g, "Cj0KCQiA_abc123")
    assert.equal(r.out?.c, "Brand search")
    assert.ok(r.jar.some((x) => x.startsWith("alphaa_clk=")))
    const c = cleanClick(r.out)
    assert.equal(c?.click.gclid, "Cj0KCQiA_abc123")
    // A later page without the params still has the click from the cookie, plus Meta's _fbc.
    const later = run("", false, `${r.jar[0]}; _fbc=fb.1.1764340000000.IwAR2xyz_123`)
    assert.equal(later.out?.g, "Cj0KCQiA_abc123")
    assert.equal(later.out?.fbc, "fb.1.1764340000000.IwAR2xyz_123")
  })
  await test("CLICK_CAPTURE_JS: Global Privacy Control = no cookie, nothing sent", () => {
    const r = run("?gclid=Cj0KCQiA_abc123&fbclid=IwAR2xyz_123", true, "_fbc=fb.1.1764340000000.IwAR2xyz_123")
    assert.equal(r.out, null)
    assert.equal(r.jar.some((x) => x.startsWith("alphaa_clk=")), false)
  })
  await test("TAG_TRACKING_JS still parses with the click capture inside", () => {
    // lib/tracking.ts imports the database, so read its template from the source instead of importing it.
    const src = readFileSync(new URL("../src/lib/tracking.ts", import.meta.url), "utf8")
    const tpl = src.match(/export const TAG_TRACKING_JS = `([\s\S]*?)`\n/)![1].replace("${CLICK_CAPTURE_JS}", CLICK_CAPTURE_JS).replace(/\\\\/g, "\\")
    assert.ok(tpl.includes("c: k === 'test' ? undefined : clk()"))
    assert.doesNotThrow(() => new Function("id", "origin", `${tpl}; return track;`))
  })

  console.log(`\n${passed} passed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
