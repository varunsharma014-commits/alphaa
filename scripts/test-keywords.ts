// Tests for keyword data (lib/keywords/rules.ts, lib/gads/api.ts historical metrics, the Topic plan
// W inputs) against real answers recorded 2026-11-28: Keyword Planner through Alphaa's founder
// connection (scripts/fixtures/keyword-planner/) and DataForSEO Labs (scripts/fixtures/dataforseo/).
// No network, no database.
//   npx tsx scripts/test-keywords.ts
import { readFileSync } from "node:fs"
import { join } from "node:path"

process.env.ANTHROPIC_API_KEY ||= "test-key"
process.env.DATABASE_URL ||= "postgresql://nobody@127.0.0.1:1/none"

const fx = (dir: string, name: string) => JSON.parse(readFileSync(join(__dirname, "fixtures", dir, `${name}.json`), "utf8"))
let fails = 0
const ok = (cond: unknown, msg: string) => { if (cond) console.log(`  ok  ${msg}`); else { fails++; console.log(`  FAIL ${msg}`) } }

async function main() {
  const r = await import("../src/lib/keywords/rules")
  const api = await import("../src/lib/gads/api")
  const p = await import("../src/lib/dataforseo-parse")
  const cr = await import("../src/lib/cluster-rules")

  console.log("Keyword Planner (recorded: historical metrics, Ottawa, English)")
  const hist = api.parseHistoricalMetrics(fx("keyword-planner", "historical-metrics"))
  {
    ok(hist.length === 3, "3 keywords back")
    const seo = hist.find((h) => h.text === "seo agency ottawa")!
    ok(seo.avgMonthlySearches === 170 && seo.competition === "LOW" && seo.competitionIndex === 7, "avg 170, LOW competition, index 7")
    ok(seo.lowBidMicros === 6014031 && seo.highBidMicros === 17494555, "bid range in micros")
    ok(seo.monthly.length === 12 && seo.monthly[0].year === 2025 && seo.monthly[0].month === 11 && seo.monthly[0].searches === 320, "12 months, oldest first, month numbers parsed")
    const ai = hist.find((h) => h.text === "ai search optimization")!
    ok(ai.avgCpcMicros === null, "missing averageCpcMicros = null, not 0")
    ok(api.parseHistoricalMetrics(null).length === 0 && api.parseHistoricalMetrics({ results: [{}] }).length === 0, "garbage in: nothing out")
    const body = api.historicalMetricsBody({ keywords: ["a b"], language: "languageConstants/1000", geoTargets: ["geoTargetConstants/1002376"] })
    ok(body.keywordPlanNetwork === "GOOGLE_SEARCH" && body.historicalMetricsOptions.includeAverageCpc && body.geoTargetConstants[0] === "geoTargetConstants/1002376", "request body: network, CPC, geo")
    // Mocked call: right path, POST, bearer, login-customer-id only when given.
    let seen: { url: string; init: RequestInit } | null = null
    const fetchImpl = async (url: string, init: RequestInit) => { seen = { url, init }; return new Response(JSON.stringify(fx("keyword-planner", "historical-metrics")), { status: 200 }) }
    const rows = await api.generateKeywordHistoricalMetrics("619-472-6495", body, { token: "t", loginCustomerId: "123-456", fetchImpl })
    const s = seen as unknown as { url: string; init: RequestInit }
    ok(rows.length === 3 && s.url.endsWith("/v26/customers/6194726495:generateKeywordHistoricalMetrics"), "mocked call: customer id digits only, v26 path")
    const h = s.init.headers as Record<string, string>
    ok(h.Authorization === "Bearer t" && h["login-customer-id"] === "123456" && !("developer-token" in h), "headers: bearer + login-customer-id, no developer token")
    const ideas = fx("keyword-planner", "keyword-ideas") as { results: unknown[] }
    ok(Array.isArray(ideas.results) && ideas.results.length > 0, "keyword ideas fixture has results")
  }

  console.log("Volume: honest numbers and ranges")
  {
    const seo = hist.find((h) => h.text === "seo agency ottawa")!
    const v = r.volumeFrom(seo.avgMonthlySearches, seo.monthly.map((m) => m.searches))!
    ok(v.low === null && r.volumeLabel(v) === "About 170 a month", "exact Google number: About 170 a month")
    const b = r.volumeFrom(100, [100, 100, 10, 100, 100, 100, 1000, 100, 100, 100, 100, 100])!
    ok(b.low === 100 && b.high === 1000 && r.volumeLabel(b) === "100 to 1K a month", "bucketed (no ad spend): shown as the range 100 to 1K")
    ok(r.volumeValue(b) === 316, "a range ranks at its geometric middle (316)")
    ok(r.volumeLabel(r.volumeFrom(0, [0, 0])) === "Under 10 a month", "0 = under 10")
    ok(r.volumeLabel(r.volumeFrom(10, [10, 10, 10, 20])) === "About 10 a month", "a flat 10 is a tiny number, not a 10 to 100 range")
    ok(r.volumeLabel(null) === "No Google data", "no data says so")
    ok(r.volumeLabel(r.volumeFrom(10_000, [10_000, 10_000, 10_000])) === "10K to 100K a month", "big bucket")
    ok(!/[–—]/.test(r.volumeLabel(b)), "no dashes in labels")
    const up = r.volumeFrom(200, [100, 100, 100, 100, 100, 100, 100, 100, 100, 200, 220, 260])
    ok(r.trendOf(up) === "up" && r.trendOf(b) === null, "trend: rising; none for ranges")
  }

  console.log("DataForSEO Labs (recorded)")
  {
    const d = p.firstTask(fx("dataforseo", "labs_bulk_keyword_difficulty_live"))
    ok(d.ok && d.cost === 0.0126, "difficulty: ok, cost $0.0126 for 5 keywords")
    const dm = r.parseDifficulty(d.result)
    ok(dm.get("local seo") === 36 && dm.get("ai search optimization") === 28 && dm.get("google business profile optimization") === 39, "difficulty values read")
    ok(!dm.has("how to rank on chatgpt"), "null difficulty is left out (not 0)")
    const i = p.firstTask(fx("dataforseo", "labs_search_intent_live"))
    const im = r.parseIntent(i.result)
    ok(i.ok && im.size === 5 && [...im.values()].every((x) => ["informational", "navigational", "commercial", "transactional"].includes(x.intent)), "intent: 5 keywords, known labels")
    ok(im.get("seo agency ottawa")?.intent === "commercial" && (im.get("seo agency ottawa")?.p ?? 0) > 0.5, "seo agency ottawa = commercial")
    ok(r.parseDifficulty(null).size === 0 && r.parseIntent({ items: [{ keyword: "x", keyword_intent: { label: "weird" } }] }).size === 0, "garbage / unknown labels dropped")
  }

  console.log("Labels, winnability, the target pick")
  {
    ok(r.difficultyLabel(10) === "Very easy" && r.difficultyLabel(36) === "Doable" && r.difficultyLabel(90) === "Out of reach for now" && r.difficultyLabel(null) === "Not measured", "difficulty labels")
    ok(r.intentLabel("transactional") === "Ready to buy" && r.intentLabel(null) === "Unknown", "intent labels")
    ok(r.siteStrength(31) === 31 && r.siteStrength(null) === 15, "site strength from link rank, small-site default")
    ok(r.winnability(80, 15) < 0.2 && r.winnability(20, 15) === 1, "hard keyword for a small site = low; easy = 1")
    ok(r.winnability(80, 15, 8) === 0.9 && r.winnability(80, 15, 18) === 0.7, "already top 10 / top 20 on Google lifts it")
    const m = (keyword: string, avg: number, difficulty: number | null, intent: "commercial" | "informational" | null = null) => ({ keyword, volume: r.volumeFrom(avg, []), competition: null, bidLow: null, bidHigh: null, currency: null, difficulty, intent, intentP: null })
    const head = m("seo", 50_000, 95)
    const mid = m("seo agency ottawa", 170, 20, "commercial")
    const none = m("nobody searches this", 0, 5)
    const pick = r.pickTarget([{ keyword: head.keyword, metric: head }, { keyword: mid.keyword, metric: mid }, { keyword: none.keyword, metric: none }], 15)
    ok(pick?.keyword === "seo agency ottawa", "winnable mid-volume beats an impossible head term")
    ok(!!pick && pick.why.includes("About 170 a month") && pick.why.includes("difficulty 20 of 100"), "the reason carries the real numbers")
    ok(r.pickTarget([{ keyword: "x", metric: none }, { keyword: "y", metric: undefined }], 15) === null, "no volume anywhere = no pick")
    const big = m("seo", 50_000, 95)
    ok(r.pickTarget([{ keyword: big.keyword, metric: big, position: 6 }, { keyword: mid.keyword, metric: mid }], 15)?.keyword === "seo", "already ranking #6 on a big term: take it")
    ok(r.forDifficulty([{ ...head, difficulty: null }, { ...mid, difficulty: null }, none, { ...mid, keyword: "z", difficulty: 3 }], 1).join() === "seo", "difficulty batch: only unmeasured with volume, biggest first, capped")
  }

  console.log("Keyword text")
  {
    ok(r.normKeyword("  SEO Agency, Ottawa?! ") === "seo agency ottawa", "normalised")
    ok(r.plannerOk("seo agency ottawa") && !r.plannerOk("one two three four five six seven eight nine ten eleven"), "planner limit: 10 words")
    ok(r.overlap("How much does a roof repair cost in Ottawa", "roof repairs ottawa") === 3, "topic overlap counts shared words (plural ok)")
  }

  console.log("Topic plan: W inputs (searches with Google volume)")
  {
    const inputs = {
      questions: [], queries: [], pages: [], drafts: [], gaps: [], services: [{ name: "Roofing", url: null }],
      keywords: [{ keyword: "roof repair ottawa", detail: "about 170 a month, difficulty 20/100", pinned: true }],
    }
    ok(cr.promptLists(inputs).includes("W0: roof repair ottawa  [about 170 a month, difficulty 20/100]  [pinned]"), "prompt lists W with numbers + pinned")
    const map = cr.validatePlan({ clusters: [{ pillar: "Roofing in Ottawa", pillarSources: ["S0"], pillarPage: null, articles: [{ title: "Roof repair in Ottawa: what to expect", question: "roof repair ottawa", sources: ["W0"], page: null }, { title: "Made up topic", question: null, sources: ["W9"], page: null }] }] }, inputs)
    const arts = map.clusters[0]?.articles ?? []
    ok(arts.length === 1 && arts[0].sources[0].kind === "kw" && arts[0].sources[0].label === "Search you picked", "W source resolves; an unknown W id is dropped")
    ok(arts[0].question === "roof repair ottawa", "a W search counts as a real question")
    ok(map.clusters[0].why.includes("1 search with real Google volume"), "why mentions the search")
    ok(cr.promptLists({ ...inputs, keywords: undefined }).indexOf("W0") === -1, "no keywords = no W section (older inputs still work)")
  }

  console.log(fails ? `\n${fails} FAILED` : "\nall passed")
  process.exit(fails ? 1 : 0)
}
main()
