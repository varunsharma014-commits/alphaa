// Core Web Vitals parser tests on RECORDED PageSpeed Insights v5 responses (lib/seo/cwv.ts).
// No network, no database.
//   npx tsx scripts/test-cwv.ts
//
// Fixtures: scripts/fixtures/psi/{mobile,desktop}.json = real PSI v5 responses recorded by Google's
// Site Kit plugin (github.com/google/site-kit-wp, assets/js/modules/pagespeed-insights/datastore/
// __fixtures__, Apache-2.0), with the screenshot/i18n blobs removed. We couldn't record our own: the
// keyless PSI quota answers 429 and PAGESPEED_API_KEY isn't set on Railway (2026-11-28).
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { newlyPoor, parseCruxHistory, parsePsi, rate, sentence, viewportOk, type PsiResponse } from "../src/lib/seo/cwv"

let passed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`ok  ${name}`) } catch (e) { console.error(`FAIL ${name}`); throw e }
}
const load = (f: string) => JSON.parse(readFileSync(join(__dirname, "fixtures/psi", f), "utf8")) as PsiResponse
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const mobile = load("mobile.json")
const desktop = load("desktop.json")

test("thresholds (web.dev): good / needs / poor at the edges", () => {
  assert.equal(rate("lcp", 2500), "good")
  assert.equal(rate("lcp", 2501), "needs")
  assert.equal(rate("lcp", 4001), "poor")
  assert.equal(rate("inp", 200), "good")
  assert.equal(rate("inp", 500), "needs")
  assert.equal(rate("cls", 0.1), "good")
  assert.equal(rate("cls", 0.26), "poor")
  assert.equal(rate("ttfb", 1801), "poor")
})

test("recorded mobile response: page-level field data, p75 + rating per metric", () => {
  const r = parsePsi(mobile, "mobile")
  assert.equal(r.strategy, "mobile")
  assert.equal(r.url, "https://example.com/")
  assert.ok(r.field)
  assert.equal(r.field!.scope, "page")
  const m = Object.fromEntries(r.field!.metrics.map((x) => [x.key, x]))
  assert.equal(m.lcp.p75, 2600)
  assert.equal(m.lcp.rating, "needs")
  assert.equal(m.inp.p75, 295)
  assert.equal(m.inp.rating, "needs")
  assert.equal(m.cls.p75, 0.3) // PSI sends CLS ×100
  assert.equal(m.cls.rating, "poor")
  assert.equal(m.fcp.p75, 2032)
  assert.equal(m.ttfb.p75, 842)
  assert.ok(Math.abs((m.lcp.goodShare ?? 0) - 0.8358) < 0.001)
  assert.equal(r.field!.overall, "needs") // Google's AVERAGE
})

test("recorded mobile response: lab test is separate (score, metrics, opportunities by saving)", () => {
  const r = parsePsi(mobile, "mobile")
  assert.ok(r.lab)
  assert.equal(r.lab!.score, 100)
  assert.equal(r.lab!.lcp, 1100)
  assert.equal(r.lab!.tbt, 90)
  assert.equal(r.lab!.opportunities[0].id, "uses-webp-images")
  assert.equal(r.lab!.opportunities[0].savingsMs, 510)
  assert.equal(r.lab!.opportunities[1].id, "offscreen-images")
  assert.ok(r.lab!.opportunities.every((o) => (o.savingsMs ?? 0) > 0))
  // Lighthouse 6 performance-only run: no SEO audits, so usability is "not measured", never "fails".
  assert.deepEqual(r.usability, { viewport: null, fontSize: null, tapTargets: null })
})

test("recorded desktop response parses with its own lab numbers", () => {
  const r = parsePsi(desktop, "desktop")
  assert.equal(r.strategy, "desktop")
  assert.ok(r.field && r.field.metrics.length >= 4)
  assert.equal(r.lab!.lcp, 3700)
  assert.equal(r.lab!.cls, 0.13)
})

test("origin fallback: page has too few visits → whole-site data, labelled origin", () => {
  const j = clone(mobile)
  j.loadingExperience = { ...j.loadingExperience!, origin_fallback: true }
  const r = parsePsi(j, "mobile")
  assert.equal(r.field!.scope, "origin")
  assert.equal(r.field!.metrics.find((x) => x.key === "fcp")!.p75, 2128)
})

test("no field data at all (small site) → field null, lab still there", () => {
  const j = clone(mobile)
  j.loadingExperience = { id: "https://example.com/" }
  delete j.originLoadingExperience
  const r = parsePsi(j, "mobile")
  assert.equal(r.field, null)
  assert.ok(r.lab)
})

test("older INP key (EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT) still read", () => {
  const j = clone(mobile)
  const metrics = j.loadingExperience!.metrics!
  metrics.EXPERIMENTAL_INTERACTION_TO_NEXT_PAINT = metrics.INTERACTION_TO_NEXT_PAINT
  delete metrics.INTERACTION_TO_NEXT_PAINT
  assert.equal(parsePsi(j, "mobile").field!.metrics.find((x) => x.key === "inp")!.p75, 295)
})

test("Lighthouse 12+/13 insight audits (metricSavings, no overallSavingsMs) count as opportunities", () => {
  const j = clone(mobile)
  j.lighthouseResult!.audits!["lcp-discovery-insight"] = { id: "lcp-discovery-insight", title: "LCP request discovery", score: 0, metricSavings: { LCP: 1200 } }
  j.lighthouseResult!.categories!.performance.auditRefs!.push({ id: "lcp-discovery-insight", weight: 0 })
  const r = parsePsi(j, "mobile")
  assert.equal(r.lab!.opportunities[0].id, "lcp-discovery-insight")
  assert.equal(r.lab!.opportunities[0].savingsMs, 1200)
})

test("mobile usability from SEO audits when present", () => {
  const j = clone(mobile)
  j.lighthouseResult!.audits!.viewport = { id: "viewport", score: 1, scoreDisplayMode: "binary" }
  j.lighthouseResult!.audits!["font-size"] = { id: "font-size", score: 0, scoreDisplayMode: "binary" }
  j.lighthouseResult!.audits!["tap-targets"] = { id: "tap-targets", score: null, scoreDisplayMode: "notApplicable" }
  assert.deepEqual(parsePsi(j, "mobile").usability, { viewport: true, fontSize: false, tapTargets: null })
})

test("plain English: the owner sentence + Google's goal", () => {
  assert.equal(sentence({ key: "lcp", p75: 4100 }, "mobile"), "Your main image or headline shows up in 4.1s on phones. Google wants under 2.5s.")
  assert.equal(sentence({ key: "cls", p75: 0.3 }, "desktop"), "Things jump around while your page loads on computers (shift score 0.30). Google wants under 0.1.")
  assert.ok(!/ [-–—] /.test(sentence({ key: "inp", p75: 620 }, "mobile"))) // no dashes as punctuation
})

test("alerts only when a core metric TURNS poor (not every week it stays poor)", () => {
  const cur = parsePsi(mobile, "mobile") // CLS poor
  const prevNeeds = clone(cur)
  prevNeeds.field!.metrics.find((x) => x.key === "cls")!.rating = "needs"
  assert.deepEqual(newlyPoor(prevNeeds, cur).map((m) => m.key), ["cls"])
  assert.deepEqual(newlyPoor(cur, cur), [])
  assert.deepEqual(newlyPoor(null, cur).map((m) => m.key), ["cls"]) // first check: report what's poor
  const noField = clone(cur); noField.field = null
  assert.deepEqual(newlyPoor(cur, noField), [])
})

test("viewport meta from the page HTML", () => {
  assert.equal(viewportOk('<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>'), true)
  assert.equal(viewportOk("<head><meta name=viewport content='width=device-width'></head>"), true)
  assert.equal(viewportOk('<head><meta name="viewport" content="width=1024"></head>'), false)
  assert.equal(viewportOk("<head><title>x</title></head>"), false)
})

test("CrUX history: weekly p75s, CLS strings, missing weeks", () => {
  // Shape per https://developer.chrome.com/docs/crux/history-api (constructed sample, 3 weeks).
  const h = parseCruxHistory({
    record: {
      metrics: {
        largest_contentful_paint: { percentilesTimeseries: { p75s: [3100, null, 2600] } },
        cumulative_layout_shift: { percentilesTimeseries: { p75s: ["0.12", "NaN", "0.08"] } },
      },
      collectionPeriods: [
        { firstDate: { year: 2026, month: 10, day: 5 }, lastDate: { year: 2026, month: 11, day: 1 } },
        { firstDate: { year: 2026, month: 10, day: 12 }, lastDate: { year: 2026, month: 11, day: 8 } },
        { firstDate: { year: 2026, month: 10, day: 19 }, lastDate: { year: 2026, month: 11, day: 15 } },
      ],
    },
  })
  assert.deepEqual(h!.lcp, [{ end: "2026-11-01", p75: 3100 }, { end: "2026-11-08", p75: null }, { end: "2026-11-15", p75: 2600 }])
  assert.deepEqual(h!.cls!.map((p) => p.p75), [0.12, null, 0.08])
  assert.equal(parseCruxHistory({}), null)
})

console.log(`\n${passed} passed`)
