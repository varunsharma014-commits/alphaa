// Tests for lib/ai-sources.ts against real API responses recorded 2026-11-28 (scripts/fixtures/
// ai-citations/: Claude Haiku 5.5 + web_search, gpt-4o-mini Responses + web_search_preview,
// gemini-3-flash-preview + googleSearch (thinkingLevel low), Perplexity sonar; the Google AI
// Overview is DataForSEO's results page in scripts/fixtures/dataforseo/). Encrypted fields
// stripped. No network, no DB.
//   npx tsx scripts/test-ai-citations.ts
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  claudeSources, openaiSources, geminiSources, perplexitySources, inlineSources, classifySource, sourceSite,
  rankNames, validStance, parseAiOverview, shareOfVoice, rivalKeys, weekOf, cleanUrl, PLATFORM_NAME,
} from "../src/lib/ai-sources"
import { firstTask } from "../src/lib/dataforseo-parse"

const dir = join(__dirname, "fixtures", "ai-citations")
const fx = (name: string) => JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"))
let fails = 0
const ok = (cond: unknown, msg: string) => { if (cond) console.log(`  ok  ${msg}`); else { fails++; console.log(`  FAIL ${msg}`) } }

console.log("Claude")
{
  const s = claudeSources(fx("claude").content)
  ok(s.length > 0 && s.length <= 8, `parses sources (${s.length})`)
  ok(s[0].cited, "cited pages come first")
  ok(s.some((x) => x.url.includes("vanguardmedia.ca")), "text-block citation kept")
  ok(s.some((x) => !x.cited), "search results read but not cited are flagged cited:false")
  ok(new Set(s.map((x) => x.url)).size === s.length, "deduped by URL")
  ok(claudeSources([{ type: "web_search_tool_result", content: { type: "web_search_tool_result_error", error_code: "max_uses_exceeded" } }]).length === 0, "search error block ignored")
}

console.log("ChatGPT")
{
  const s = openaiSources(fx("openai"))
  ok(s.length >= 5, `url_citation annotations (${s.length})`)
  ok(s.every((x) => !/utm_source/.test(x.url)), "utm_source=openai stripped")
  ok(s.every((x) => x.title), "titles kept")
  ok(classifySource(s[0].url, { ownHost: null, competitorHosts: [] }) === "directory", "Google Maps link = directory")
  ok(sourceSite(s[0].url) === "Google Maps", "Google Maps site label")
  ok(openaiSources({ output: [{ type: "message", content: [{ type: "output_text", annotations: [], text: "x" }] }] }).length === 0, "no search = no sources")
}

console.log("Gemini")
{
  const cand = fx("gemini").candidates[0]
  const raw = geminiSources(cand)
  ok(raw.length === 5, `grounding chunks without resolved redirects fall back to the domain (${raw.length})`)
  ok(raw.every((x) => /^https:\/\/[a-z0-9.-]+\/$/.test(x.url)), "fallback URL = https://<domain>/")
  ok(raw.some((x) => x.url.includes("whatclinic.com")), "whatclinic.com present")
  const first = cand.groundingMetadata.groundingChunks[0].web.uri
  const res = geminiSources(cand, { [first]: "https://www.whatclinic.com/dentists/canada/ontario/toronto/family-dentists" })
  ok(res.some((x) => x.url === "https://www.whatclinic.com/dentists/canada/ontario/toronto/family-dentists"), "resolved redirect used")
  ok(classifySource("https://www.whatclinic.com/x", { ownHost: null, competitorHosts: [] }) === "directory", "whatclinic = directory")
  ok(geminiSources({ content: {} }).length === 0, "ungrounded answer = no sources")
}

console.log("Perplexity")
{
  const p = fx("perplexity")
  const s = perplexitySources(p)
  ok(s.length > 0 && s.every((x) => x.title), `search_results with titles (${s.length})`)
  ok(perplexitySources({ citations: p.citations }).length > 0, "bare citations fallback")
}

console.log("Inline links")
{
  const s = inlineSources("See [Acme Dental](https://acmedental.ca/?utm_source=x) or https://www.yelp.ca/biz/acme. Thanks.")
  ok(s.length === 2, "markdown + bare URL")
  ok(s[0].url === "https://acmedental.ca/", "utm stripped")
  ok(s[1].url === "https://www.yelp.ca/biz/acme", "trailing period dropped")
  ok(cleanUrl("https://a.com/p?utm_medium=a&q=1#x") === "https://a.com/p?q=1", "cleanUrl keeps real params")
}

console.log("Classify")
{
  const ctx = { ownHost: "alphaa.app", competitorHosts: ["otterly.ai", "peec.ai"] }
  ok(classifySource("https://alphaa.app/blog/x", ctx) === "own", "own site")
  ok(classifySource("https://blog.alphaa.app/x", ctx) === "own", "own subdomain")
  ok(classifySource("https://otterly.ai/pricing", ctx) === "competitor", "competitor")
  ok(classifySource("https://www.g2.com/x", ctx) === "directory", "g2 = directory")
  ok(classifySource("https://www.reddit.com/r/x", ctx) === "forum", "reddit = forum")
  ok(classifySource("https://www.youtube.com/watch?v=1", ctx) === "social", "youtube = social")
  ok(classifySource("https://www.entrepreneur.com/x", ctx) === "media", "entrepreneur = media")
  ok(classifySource("https://en.wikipedia.org/wiki/X", ctx) === "reference", "wikipedia = reference")
  ok(classifySource("https://vanguardmedia.ca/blog", ctx) === "other", "agency blog = other")
  ok(classifySource("https://fedex.com/", ctx) === "other", "fedex.com is not x.com")
}

console.log("Rank")
{
  const text = "Top picks: 1. **Waterview Dental** near the lake. 2. Dentistry on King, downtown. 3. Smile City Dental. Also Acme Dental is good."
  const r = rankNames(text, ["Smile City Dental", "Waterview Dental", "Dentistry on King", "Ghost Clinic"], "Acme Dental")
  ok(r.ranks[0].name === "Waterview Dental" && r.ranks[0].rank === 1, "first named = rank 1")
  ok(r.ranks.find((x) => x.name === "Smile City Dental")?.rank === 3, "order by first mention")
  ok(r.ownRank === 4, "owner rank among named")
  ok(r.ranks.find((x) => x.name === "Ghost Clinic")?.rank === 5, "not-found name goes last")
  ok(rankNames("We like GrowthTurbine and Growth Turbine.", [], "Growth Turbine").ownRank === 1, "owner found")
}

console.log("Stance")
{
  const ans = "Acme Dental is a **friendly** family clinic with great reviews. Others exist."
  ok(validStance({ tone: "positive", quote: "Acme Dental is a friendly family clinic with great reviews." }, ans, null)?.tone === "positive", "verbatim quote accepted (formatting aside)")
  ok(validStance({ tone: "positive", quote: "Acme is the best dentist in the world, everyone says." }, ans, "Acme Dental is a friendly")?.quote === "Acme Dental is a friendly", "invented quote replaced by the snippet")
  ok(validStance({ tone: "glowing", quote: "x" }, ans, "y") === null, "unknown tone rejected")
  ok(validStance({ tone: "neutral", quote: "nope nope nope nope" }, ans, null) === null, "no verifiable quote = no stance")
}

console.log("AI Overview")
{
  const serp = firstTask(JSON.parse(readFileSync(join(__dirname, "fixtures", "dataforseo", "serp_live_advanced.json"), "utf8"))).result
  const ao = parseAiOverview(serp)
  ok(ao.shown && ao.sources.length > 0, `AI Overview parsed (${ao.sources.length} sources)`)
  ok(!!ao.content && !/Highlight (start|end)/.test(ao.content), "highlight markers removed")
  ok(ao.sources.every((x) => !/google\.com\/goto/.test(x.url)), "Google redirect links left out of the sources")
  ok(!parseAiOverview({ items: [] }).shown, "no ai_overview item = not shown")
}

console.log("Share of voice")
{
  const e = (appeared: boolean, named: string[], status = appeared ? "appeared" : "not_appearing") => ({ appeared, status, named })
  const scans = [
    { at: "2026-11-04T10:00:00Z", questions: [{ engines: { chatgpt: e(false, ["Otterly.AI", "ChatGPT"]), claude: e(false, ["Otterly AI", "Profound"]), gemini: e(false, [], "error") } }] },
    { at: "2026-11-11T10:00:00Z", questions: [{ engines: { chatgpt: e(true, ["OtterlyAI"]), claude: e(false, ["Semrush AI Visibility Toolkit", "Semrush"]), perplexity: e(false, ["Profound"]) } }] },
    { at: "2026-11-12T10:00:00Z", questions: [{ engines: { chatgpt: e(true, ["Semrush"]), claude: e(true, ["Profound"]) } }] }, // same week: newest wins
  ]
  const sov = shareOfVoice(scans, { ownName: "Alphaa", keep: (n) => !PLATFORM_NAME.test(n), top: 3 })
  ok(sov.weeks.length === 2, "one point per week (newest scan of the week)")
  ok(sov.weeks[0].answers === 2, "errors don't count as answers")
  ok(sov.series[0].own && sov.series[0].points[1].share === 100, "owner share in week 2 = 2 of 2")
  const otterly = sov.series.find((s) => s.key === "otterlyai")
  ok(otterly?.points[0].share === 100, "Otterly variants merged (named in both week-1 answers)")
  ok(!sov.series.some((s) => /chatgpt/i.test(s.name)), "platforms excluded")
  ok(rivalKeys(["Semrush", "Semrush AI Visibility Toolkit", "SEMrush"]).get("Semrush AI Visibility Toolkit") === "semrush", "product line merges into brand")
  ok(weekOf("2026-11-30T23:00:00Z") === "2026-11-30" && weekOf("2026-11-29T10:00:00Z") === "2026-11-23", "Monday weeks (UTC)")
}

console.log(fails ? `\n${fails} FAILED` : "\nall passed")
process.exit(fails ? 1 : 0)
