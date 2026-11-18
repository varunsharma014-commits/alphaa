// "Plan my first Google Ads campaign": ONE Search campaign for the business, from its real
// facts only (profile, the owner's voice, the Google searches that already find them, what's
// working). Opus proposes it with structured output; code then checks every line: Google's
// length limits, no superlatives or claims, numbers only from the facts, and every keyword's
// search volume from Google's own Keyword Planner (generateKeywordIdeas). Nothing is created
// here: the plan waits in the chat for the owner's approval (lib/gads/create.ts).
import { metaMonthlyCommitment } from "@/lib/metaads/plan"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { factsOf } from "@/lib/content"
import { getAgentSettings } from "@/lib/agent/settings"
import { voiceText } from "@/lib/voice"
import { latestInsights } from "@/lib/insights"
import { keywordIdeasBody, fromMicros, type KeywordIdea } from "./api"
import { gadsFor, type Gads } from "./client"
import { createPlan } from "./store"
import type { AdPlan, PlanAdGroup, PlanKeyword } from "./plan-types"
import { cleanKeyword, cleanLines, cleanPath, countryOf, dailyFromMonthly, DESCRIPTION_MAX, HEADLINE_MAX, numbersIn, suggestDaily } from "./rules"

const MODEL = "claude-opus-5-5"

const Schema = z.object({
  campaignName: z.string().describe("Short internal name, e.g. 'Search - Emergency plumbing - Austin'"),
  adGroups: z.array(z.object({
    name: z.string().describe("The service this group sells"),
    keywords: z.array(z.object({
      text: z.string().describe("What a ready-to-buy customer types, lowercase, 2-5 words"),
      match: z.enum(["EXACT", "PHRASE"]),
      why: z.string().describe("Fact key(s) it comes from, e.g. 'G3' or 'P1'"),
    })).describe("10-20 keywords across all groups"),
    headlines: z.array(z.string()).describe("15 headlines, each 30 characters or fewer"),
    descriptions: z.array(z.string()).describe("4 descriptions, each 90 characters or fewer"),
    path1: z.string().describe("Display URL path, 15 characters or fewer, no spaces"),
    path2: z.string().describe("Second display path, 15 characters or fewer, or empty"),
  })).describe("1 ad group, or 2 only if the business clearly sells two different services"),
  negatives: z.array(z.object({
    theme: z.string().describe("e.g. 'Jobs and careers', 'Do it yourself', 'Things you don't offer'"),
    keywords: z.array(z.string()),
  })).describe("Exactly 3 themed lists of negative keywords, 5-12 each"),
  radius: z.number().describe("Targeting radius around the business, in the unit given"),
  why: z.array(z.object({ text: z.string().describe("One plain sentence for the owner"), keys: z.array(z.string()) })).describe("2-4 reasons for this campaign, each citing fact keys"),
})

type Fact = { key: string; text: string }

async function gatherFacts(userId: string) {
  const [user, s, insights, queries] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    getAgentSettings(userId),
    latestInsights(userId).catch(() => null),
    db.keywordRanking.groupBy({ by: ["query"], where: { userId, date: { gte: new Date(Date.now() - 90 * 86_400_000) } }, _sum: { impressions: true, clicks: true }, orderBy: { _sum: { impressions: "desc" } }, take: 25 }),
  ])
  if (!user) return null
  const facts: Fact[] = []
  const voice = s.voice ? voiceText(s.voice) : null
  facts.push({ key: "P1", text: factsOf(user).replace(/\n/g, "; ") })
  ;(s.locations ?? []).slice(0, 3).forEach((l, i) => facts.push({ key: `L${i + 1}`, text: `Another location: ${l.name}, ${[l.street, l.city, l.state].filter(Boolean).join(", ")}` }))
  queries.forEach((q, i) => facts.push({ key: `G${i + 1}`, text: `Google search "${q.query}" showed their site ${q._sum.impressions ?? 0} times and brought ${q._sum.clicks ?? 0} clicks in the last 90 days` }))
  for (const l of [...(insights?.working ?? []), ...(insights?.notWorking ?? [])].slice(0, 8)) facts.push({ key: `I-${l.key}`, text: l.text })
  return { user, s, voice, facts }
}

const LANGUAGE: Record<string, string> = { english: "languageConstants/1000", french: "languageConstants/1002" } // Google's language codes table
const site = (u: string) => (u.startsWith("http") ? u : `https://${u}`)

/** Write a plan, check it against Google's numbers, save it as "proposed". */
export async function proposePlan(userId: string): Promise<AdPlan> {
  const g = await gadsFor(userId)
  const f = await gatherFacts(userId)
  if (!f) throw new Error("I couldn’t find your business details.")
  const { user, s, voice, facts } = f
  if (!user.websiteUrl) throw new Error("Add your website first, so the ad has somewhere to send people.")
  const city = user.city?.trim() || null
  if (!city) throw new Error("Add your city first, so I only show your ads to people near you.")
  const country = countryOf(user.state, user.zip)
  const units: "MILES" | "KILOMETERS" = country === "CA" ? "KILOMETERS" : "MILES"

  const msg = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "medium", format: zodOutputFormat(Schema) },
    messages: [{
      role: "user",
      content: `Plan ONE Google Search campaign for this local business, to bring in new customers who are searching right now.

Rules:
- Use only the facts below. Never invent prices, offers, hours, years, awards, reviews, ratings, staff, insurance or guarantees.
- Keywords: 10 to 20 in total, things a ready-to-buy customer types (service + intent or + "near me" or + the city). PHRASE or EXACT only. Prefer the real searches in the G facts. No competitor brand names. No keywords for things the facts don't say they offer.
- Headlines: 15 per ad group, each 30 characters or fewer (count them). Descriptions: 4, each 90 characters or fewer. Plain, specific, benefit first, with a clear next step ("Book online", "Call today"). Include the business name in 1-2 headlines and the city in 2-3.
- Never use "best", "#1", "top-rated", "leading", "cheapest", "guaranteed", "award-winning" or any superlative; no exclamation marks in headlines; no emoji; no ALL CAPS; no numbers unless the number is in the facts.
- Negatives: exactly 3 themed lists (for example jobs/careers, free or DIY, and services or places they don't serve).
- Radius in ${units === "MILES" ? "miles" : "kilometres"} around ${city}: how far a customer would reasonably travel or the business would go (usually ${units === "MILES" ? "5-25" : "10-40"}).
- "why": 2-4 short sentences for the owner on why this campaign, each citing fact keys. Only numbers from those facts.
${voice ? `\nWrite the ads in this voice:\n${voice}\n` : ""}
FACTS (key: text)
${facts.map((x) => `${x.key}: ${x.text}`).join("\n")}`,
    }],
  })
  const out = msg.parsed_output
  if (!out || !out.adGroups.length) throw new Error("I couldn’t put a plan together just now. Try again in a minute.")

  const byKey = new Map(facts.map((x) => [x.key, x.text]))
  const allowed = new Set(facts.flatMap((x) => numbersIn(x.text)))
  const brand = user.businessName

  // Keywords: cleaned, deduped, then checked against Google's search volumes for this area.
  const groups = out.adGroups.slice(0, 2)
  const wanted = groups.flatMap((gr) => gr.keywords.map((k) => cleanKeyword(k.text)).filter((k): k is string => !!k))
  const { ideas, checked } = await checkVolumes(g, Array.from(new Set(wanted)), city, country, user.websiteUrl, s.voice?.style.language)
  const vol = new Map(ideas.map((i) => [i.text.toLowerCase(), i]))

  const adGroups: PlanAdGroup[] = []
  for (const gr of groups) {
    const kws: PlanKeyword[] = []
    const seen = new Set<string>()
    for (const k of gr.keywords) {
      const text = cleanKeyword(k.text)
      if (!text || seen.has(text)) continue
      seen.add(text)
      const idea = vol.get(text)
      const searches = idea?.avgMonthlySearches ?? null
      if (checked && searches === 0) continue // Google says nobody searches it
      kws.push({ text, match: k.match, searches, why: k.why })
    }
    const heads = cleanLines(gr.headlines, HEADLINE_MAX, 15, allowed, true, brand)
    const descs = cleanLines(gr.descriptions, DESCRIPTION_MAX, 4, allowed, false, brand)
    if (heads.ok.length < 3 || descs.ok.length < 2 || !kws.length) continue
    adGroups.push({ name: gr.name.trim().slice(0, 80), keywords: kws.slice(0, 20), ad: { headlines: heads.ok, descriptions: descs.ok, path1: cleanPath(gr.path1), path2: cleanPath(gr.path2) } })
  }
  if (!adGroups.length) throw new Error("The ads I wrote didn’t pass my checks. Try again and I’ll write them fresh.")
  // Top up thin keyword lists with Google's own related searches that share a word with ours.
  const total = adGroups.reduce((n, gr) => n + gr.keywords.length, 0)
  if (checked && total < 10) topUp(adGroups[0], ideas, 10 - total, out.negatives.flatMap((n) => n.keywords))

  const negatives = out.negatives.slice(0, 3).map((n) => ({ theme: n.theme.trim().slice(0, 60), keywords: Array.from(new Set(n.keywords.map(cleanKeyword).filter((k): k is string => !!k))).slice(0, 15) })).filter((n) => n.keywords.length)

  // Budget: the owner's monthly cap if set, else ~10 clicks a day at Google's estimated cost a click.
  // One monthly cap covers Google and Meta: leave out what live Meta campaigns are set to spend.
  const cap = s.autopilot?.adBudget != null ? Math.max(0, s.autopilot.adBudget - (await metaMonthlyCommitment(userId).catch(() => 0))) : null
  const kwIdeas = adGroups.flatMap((gr) => gr.keywords).map((k) => vol.get(k.text)).filter((i): i is KeywordIdea => !!i)
  const sug = suggestDaily(kwIdeas.map((i) => i.highBidMicros ?? i.lowBidMicros ?? 0))
  const cur = g.account.currency ?? "USD"
  let daily: number | null = null
  let dailySource: AdPlan["dailySource"] = "none"
  let dailyBasis: string | undefined
  if (cap) {
    daily = dailyFromMonthly(cap)
    dailySource = "cap"
    dailyBasis = `Your monthly ad budget of ${money(cap, cur)}, spread over the month.`
  } else if (sug) {
    daily = sug.daily
    dailySource = "suggested"
    dailyBasis = `About 10 clicks a day at the ${money(sug.cpc, cur)} a click Google estimates for these searches near you.`
  }

  // Bidding: Maximize Conversions once the account records conversions, else Maximize Clicks.
  const conv = await g.search<{ metrics?: { conversions?: number } }>("SELECT metrics.conversions FROM customer WHERE segments.date DURING LAST_30_DAYS").catch(() => [])
  const bidding = conv.reduce((n, r) => n + Number(r.metrics?.conversions ?? 0), 0) > 0 ? "conversions" : "clicks"

  const why = out.why.flatMap((w) => {
    const keys = w.keys.filter((k) => byKey.has(k))
    if (!keys.length) return []
    const ok = new Set(keys.flatMap((k) => numbersIn(byKey.get(k)!)))
    if (numbersIn(w.text).some((n) => !ok.has(n))) return []
    if (/\b(best|#1|leading)\b/i.test(w.text)) return []
    return [w.text.trim().slice(0, 240)]
  }).slice(0, 4)

  const radius = Math.min(units === "MILES" ? 50 : 80, Math.max(units === "MILES" ? 3 : 5, Math.round(out.radius) || (units === "MILES" ? 15 : 25)))
  const lang = LANGUAGE[(s.voice?.style.language ?? "English").trim().toLowerCase()] ?? null
  return createPlan(userId, {
    at: new Date().toISOString(),
    status: "proposed",
    customerId: g.customerId,
    currency: cur,
    campaignName: out.campaignName.trim().slice(0, 100) || `Search - ${brand ?? "Leads"}`,
    finalUrl: site(user.websiteUrl),
    adGroups,
    negatives,
    location: { label: `${radius} ${units === "MILES" ? "miles" : "km"} around ${[city, user.state].filter(Boolean).join(", ")}`, cityName: city, provinceCode: user.state?.trim() || undefined, postalCode: user.zip?.trim() || undefined, countryCode: country ?? undefined, radius, units },
    language: lang,
    bidding,
    daily,
    dailySource,
    dailyBasis,
    cap,
    why,
    sources: facts.map((x) => x.text).slice(0, 12),
    keywordCheck: checked ? "checked" : "unchecked",
  })
}

async function checkVolumes(g: Gads, keywords: string[], city: string, country: string | null, url: string, language?: string): Promise<{ ideas: KeywordIdea[]; checked: boolean }> {
  if (!keywords.length) return { ideas: [], checked: false }
  try {
    const geo = await g.geoTarget(city, country).catch(() => null)
    const lang = LANGUAGE[(language ?? "English").trim().toLowerCase()] ?? null
    const ideas = await g.keywordIdeas(keywordIdeasBody({ keywords, url: site(url), language: lang, geoTargets: geo ? [geo] : [] }))
    return { ideas, checked: ideas.length > 0 }
  } catch (err) {
    console.error("[gads/plan] keyword ideas", err instanceof Error ? err.message : err)
    return { ideas: [], checked: false }
  }
}

function topUp(group: PlanAdGroup, ideas: KeywordIdea[], n: number, negatives: string[]) {
  const have = new Set(group.keywords.map((k) => k.text))
  const words = new Set(group.keywords.flatMap((k) => k.text.split(" ")).filter((w) => w.length > 3))
  const neg = negatives.map((x) => x.toLowerCase())
  const extra = ideas
    .filter((i) => (i.avgMonthlySearches ?? 0) > 0 && !have.has(i.text.toLowerCase()) && i.text.split(" ").some((w) => words.has(w.toLowerCase())) && !neg.some((x) => i.text.toLowerCase().includes(x)))
    .sort((a, z) => (z.avgMonthlySearches ?? 0) - (a.avgMonthlySearches ?? 0))
    .slice(0, n)
  for (const i of extra) {
    const text = cleanKeyword(i.text)
    if (text) group.keywords.push({ text, match: "PHRASE", searches: i.avgMonthlySearches, why: "Google Keyword Planner" })
  }
}

export function money(n: number, currency: string): string {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: n < 100 ? 2 : 0 }).format(n) } catch { return `${n.toFixed(2)} ${currency}` }
}
export { fromMicros }
