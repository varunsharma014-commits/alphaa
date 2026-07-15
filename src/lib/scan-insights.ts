// Business-specific intelligence for the PUBLIC scan pipeline (/api/scan).
//
// Three claude-haiku helpers + SERP + pure helpers:
//   1. inferBusinessProfile  — figures out the plain-English industry + whether
//      the business is local, writes ONE customer-style question a real buyer
//      would ask an AI assistant (the query the engines get asked), and the
//      short keyword phrase the same buyer would type into Google.
//   2. extractMentionedBusinesses — ONE batched call over all engine answers
//      that extracts which businesses each engine actually recommended.
//   3. estimateMonthlyLoss   — conservative {low, high, basis} estimate of how
//      many people per month ask AI assistants for this category; null when it
//      can't be estimated honestly. Basis references the keyword phrase.
//   4. buildCompetitorList   — frequency-ordered union of mentions (max 5).
//   5. fetchKeywordSerp      — ONE Apify google-search-scraper run for the
//      keyword (top 10 organic results). Gated on APIFY_TOKEN and
//      SCAN_SERP_DISABLED; hard 20s cap; null on any failure.
//   6. buildCompetitorDetails — matches v1 competitor names against the SERP
//      (domain/title heuristics) to attach link + Google-rank evidence.
//   7. fallbackKeyword       — keyword derivation when the haiku profile failed.
//
// Every AI call is strict-JSON (fence-strip + try/catch per CLAUDE.md gotcha 9)
// and degrades to null/{} on any failure — nothing here ever throws into the
// scan route.

import { anthropic } from "@/lib/claude"
import { googleSearch, isSearchConfigured } from "@/lib/apify-search"
import type { EngineResult } from "@/lib/ai-engines"
import type { ScanSerp, SerpEntry, CompetitorDetail } from "@/types/scan"

export type BusinessProfile = {
  industry: string
  isLocal: boolean
  query: string
  keyword: string
}

export type MonthlyLossEstimate = {
  low: number
  high: number
  basis: string
}

const HAIKU = "claude-haiku-4-5"

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
}

function textOf(msg: { content: Array<{ type: string; text?: string }> }): string {
  const block = msg.content.find((b) => b.type === "text")
  return block && typeof block.text === "string" ? block.text : ""
}

// Lowercased, suffix-stripped, alphanumeric-only form of a business name so
// "Joe's Pizza, LLC" and "joes pizza" compare equal.
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(llc|inc|co|corp|ltd|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
}

// True when a candidate mention is actually the scanned business itself,
// matched by name or by website domain (case-insensitive).
function isSelfMention(candidate: string, businessName: string, websiteUrl: string): boolean {
  const cand = normalizeName(candidate)
  if (!cand) return true // garbage/empty — drop it
  const own = normalizeName(businessName)
  if (own) {
    if (cand === own) return true
    if (own.length >= 4 && cand.includes(own)) return true
    if (cand.length >= 4 && own.includes(cand)) return true
  }
  if (websiteUrl) {
    try {
      const host = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`)
        .hostname.replace(/^www\./, "")
        .toLowerCase()
      if (host) {
        if (candidate.toLowerCase().includes(host)) return true
        const hostNorm = normalizeName(host)
        if (hostNorm && cand === hostNorm) return true
        const base = normalizeName(host.split(".")[0])
        if (base && base.length >= 4 && cand === base) return true
      }
    } catch {
      // unparseable URL — name check above already ran
    }
  }
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Industry + locality + the ONE customer question the engines get asked
// ─────────────────────────────────────────────────────────────────────────────

export async function inferBusinessProfile(input: {
  businessName: string
  businessType: string
  city: string
  websiteUrl: string
  siteTitle?: string
  siteDescription?: string
  siteText?: string
}): Promise<BusinessProfile | null> {
  try {
    const msg = await withTimeout(
      anthropic.messages.create({
        model: HAIKU,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `You simulate how real customers ask AI assistants (ChatGPT, Claude, Gemini, Perplexity) for recommendations.\n\n` +
              `Business being scanned:\n` +
              `- Name: ${input.businessName}\n` +
              `- Self-described type: ${input.businessType || "unknown"}\n` +
              `- Location: ${input.city || "unknown"}\n` +
              `- Website: ${input.websiteUrl || "unknown"}\n` +
              (input.siteTitle ? `- Website title: ${input.siteTitle.slice(0, 200)}\n` : "") +
              (input.siteDescription ? `- Website description: ${input.siteDescription.slice(0, 300)}\n` : "") +
              (input.siteText ? `- Website text excerpt: ${input.siteText.slice(0, 1200)}\n` : "") +
              `\nStep 1 — Identify the industry in plain English, specific to what THIS business sells (e.g. "dental practice", "AI marketing software", "family law firm", "ecommerce shoe store"). Never just "business".\n` +
              `Step 2 — Decide if it is LOCAL (serves one area — dentist, plumber, restaurant, clinic, law firm) or NON-LOCAL (serves customers anywhere — SaaS, software, online store, national agency, B2B service).\n` +
              `Step 3 — Write ONE natural question a real potential customer would ask an AI assistant when shopping in this category.\n` +
              `- LOCAL: include the city, e.g. "Who is the best dental practice in Kanata?" or "Can you recommend a good dentist in Kanata?"\n` +
              `- NON-LOCAL: no city, e.g. "What is the best AI marketing software for a small business?"\n` +
              `The question must be about the CATEGORY — never name the business itself.\n` +
              `Step 4 — Write the SHORT keyword phrase (2-4 words) the same customer would type into Google when shopping in this category.\n` +
              `- LOCAL: include the city, e.g. "dentist in Kanata".\n` +
              `- NON-LOCAL: category only, e.g. "equity crowdfunding agency".\n` +
              `The keyword must be about the CATEGORY — never name the business itself, no quotes, no punctuation.\n\n` +
              `Return ONLY valid JSON, no markdown fences, exactly:\n` +
              `{"industry": "<plain-English industry>", "is_local": true|false, "query": "<the customer question>", "keyword": "<the 2-4 word Google search phrase>"}`,
          },
        ],
      }),
      8000
    )
    const parsed = JSON.parse(stripFences(textOf(msg)))
    const industry = typeof parsed.industry === "string" ? parsed.industry.trim() : ""
    const isLocal = typeof parsed.is_local === "boolean" ? parsed.is_local : null
    const query = typeof parsed.query === "string" ? parsed.query.trim() : ""
    if (industry.length < 3 || query.length < 10 || isLocal === null) return null
    if (industry.toLowerCase() === "business") return null
    // Keyword is best-effort: a bad/missing keyword never sinks the profile —
    // derive one from the industry instead.
    let keyword =
      typeof parsed.keyword === "string"
        ? parsed.keyword.trim().replace(/^["']+|["']+$/g, "").trim()
        : ""
    const words = keyword.split(/\s+/).filter(Boolean)
    if (keyword.length < 3 || keyword.length > 60 || words.length > 6) {
      keyword = fallbackKeyword(industry, isLocal, input.city)
    }
    return { industry, isLocal, query, keyword }
  } catch (err) {
    console.error("inferBusinessProfile error:", err)
    return null
  }
}

// Customer-facing Google search phrase when the haiku profile is unavailable:
// "dentist in Kanata" for local businesses, the industry itself otherwise.
export function fallbackKeyword(industry: string, isLocal: boolean, city: string): string {
  const ind = industry.trim()
  if (!ind) return ""
  const c = city.trim()
  return isLocal && c ? `${ind} in ${c}` : ind
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Which businesses each engine actually recommended (ONE batched call)
// ─────────────────────────────────────────────────────────────────────────────

// A domain claimed by the extractor is only trusted when it visibly matches
// the business name (seedinvest.com ⊂ "SeedInvest") — this makes LLM domain
// recall safe to link: a hallucinated domain won't contain the name.
function validatedDomain(name: string, domain: unknown): string | null {
  if (typeof domain !== "string") return null
  const host = hostOf(domain)
  if (!host || host.length < 4 || !host.includes(".")) return null
  if (isAggregator(host)) return null
  const key = normalizeName(name)
  const base = normalizeName(host.split(".")[0])
  if (key.length < 4 || base.length < 4) return null
  return base.includes(key) || key.includes(base) ? host : null
}

export interface MentionExtraction {
  mentioned: Record<string, string[]>
  // normalizeName(business) -> validated domain, for link fallback when the
  // SERP produced no confident match.
  domains: Record<string, string>
}

export async function extractMentionedBusinesses(
  results: Array<Pick<EngineResult, "engine" | "query" | "response">>,
  businessName: string,
  websiteUrl: string
): Promise<MentionExtraction> {
  const empty: MentionExtraction = { mentioned: {}, domains: {} }
  const answered = results.filter((r) => r.response && r.response.trim().length > 0)
  if (answered.length === 0) return empty
  try {
    const sections = answered
      .map((r) => `### ${r.engine}\nQuestion asked: ${r.query}\nAnswer:\n${r.response.slice(0, 1500)}`)
      .join("\n\n")
    const keysExample = answered
      .map((r) => `"${r.engine}": [{"name": "Name One", "domain": "nameone.com"}, {"name": "Name Two", "domain": null}]`)
      .join(", ")

    const msg = await withTimeout(
      anthropic.messages.create({
        model: HAIKU,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content:
              `You are auditing answers from AI assistants to see which businesses each one recommended.\n\n` +
              `The business being scanned is "${businessName}". NEVER include it in your lists.\n\n` +
              `${sections}\n\n` +
              `For EACH assistant above, extract the specific businesses, brands, products, or companies it actually recommended or presented as options.\n` +
              `Rules:\n` +
              `- Use the exact name as written in the answer.\n` +
              `- For "domain": the business's official website domain (e.g. "seedinvest.com") ONLY if you are confident you know it; otherwise null. Never guess.\n` +
              `- Skip generic phrases ("local dentists", "several options", "many clinics").\n` +
              `- Skip platforms/directories mentioned only as places to search (Google Maps, Yelp, Reddit).\n` +
              `- Skip "${businessName}" itself.\n` +
              `- If an assistant recommended nothing specific, use an empty array.\n\n` +
              `Return ONLY valid JSON, no markdown fences, with exactly these keys:\n` +
              `{${keysExample}}`,
          },
        ],
      }),
      12000
    )
    const parsed = JSON.parse(stripFences(textOf(msg)))
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return empty

    const out: Record<string, string[]> = {}
    const domains: Record<string, string> = {}
    for (const r of answered) {
      const raw = (parsed as Record<string, unknown>)[r.engine]
      // Accept both the new object shape and a bare-string fallback.
      const entries: Array<{ name: string; domain: unknown }> = Array.isArray(raw)
        ? raw
            .map((item): { name: string; domain: unknown } | null => {
              if (typeof item === "string") return { name: item.trim(), domain: null }
              if (typeof item === "object" && item !== null && typeof (item as { name?: unknown }).name === "string") {
                return { name: (item as { name: string }).name.trim(), domain: (item as { domain?: unknown }).domain ?? null }
              }
              return null
            })
            .filter((e): e is { name: string; domain: unknown } => e !== null)
        : []
      const seen = new Set<string>()
      out[r.engine] = entries
        .filter((e) => {
          const n = e.name
          if (n.length < 2 || n.length > 80) return false
          if (isSelfMention(n, businessName, websiteUrl)) return false
          const key = normalizeName(n)
          if (!key || seen.has(key)) return false
          seen.add(key)
          const dom = validatedDomain(n, e.domain)
          if (dom && !domains[key]) domains[key] = dom
          return true
        })
        .map((e) => e.name)
        .slice(0, 10)
    }
    return { mentioned: out, domains }
  } catch (err) {
    console.error("extractMentionedBusinesses error:", err)
    return empty
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Conservative monthly-loss estimate — null when it can't be honest
// ─────────────────────────────────────────────────────────────────────────────

export async function estimateMonthlyLoss(
  industry: string,
  isLocal: boolean,
  city: string,
  keyword?: string
): Promise<MonthlyLossEstimate | null> {
  try {
    const market = isLocal && city ? `local — ${city}` : "non-local (serves customers online / nationally)"
    const inCity = isLocal && city ? ` in ${city}` : ""
    // The customer-facing phrase the basis sentence must quote — the same
    // keyword the SERP evidence uses, so the report reads as one story.
    const phrase = (keyword ?? "").trim() || `${industry}${inCity}`
    const msg = await withTimeout(
      anthropic.messages.create({
        model: HAIKU,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `Estimate how many people PER MONTH ask AI assistants (ChatGPT, Gemini, Perplexity, Claude) for recommendations in this category.\n\n` +
              `Industry: ${industry}\n` +
              `Market: ${market}\n` +
              `Customer search phrase: "${phrase}"\n\n` +
              `Method: start from typical monthly Google search interest for "${phrase}", then take only the small share of those searches that now happen inside AI assistants (a few percent of traditional search volume). Round to sensible numbers.\n\n` +
              `Rules:\n` +
              `- Be CONSERVATIVE. When unsure, go lower.\n` +
              `- "low" and "high" must be DIFFERENT positive integers forming a genuine range — never a fake exact number.\n` +
              `- "basis" is ONE plain-English sentence describing the methodology and it MUST quote the search phrase, e.g. "Based on typical monthly search interest for '${phrase}' and the share of searches now happening in AI assistants."\n` +
              `- If the niche is too obscure or the market too unclear to estimate with reasonable confidence, return exactly: null\n\n` +
              `Return ONLY valid JSON, no markdown fences: {"low": <integer>, "high": <integer>, "basis": "<sentence>"} or null`,
          },
        ],
      }),
      12000
    )
    const parsed = JSON.parse(stripFences(textOf(msg)))
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null
    const low = Number(parsed.low)
    const high = Number(parsed.high)
    const basis = typeof parsed.basis === "string" ? parsed.basis.trim() : ""
    if (!Number.isFinite(low) || !Number.isFinite(high)) return null
    if (low <= 0 || high <= low) return null // must be a real range, not a fake exact number
    if (basis.length < 10) return null
    return { low: Math.round(low), high: Math.round(high), basis }
  } catch (err) {
    console.error("estimateMonthlyLoss error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Frequency-ordered union of mentions across engines (max 5)
// ─────────────────────────────────────────────────────────────────────────────

export function buildCompetitorList(
  mentionedByEngine: Record<string, string[]>,
  max = 5
): string[] {
  const counts = new Map<string, { name: string; count: number; firstSeen: number }>()
  let order = 0
  for (const names of Object.values(mentionedByEngine)) {
    const seenThisEngine = new Set<string>()
    for (const name of names) {
      const key = normalizeName(name)
      if (!key || seenThisEngine.has(key)) continue
      seenThisEngine.add(key)
      const entry = counts.get(key)
      if (entry) {
        entry.count++
      } else {
        counts.set(key, { name, count: 1, firstSeen: order++ })
      }
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen)
    .slice(0, max)
    .map((e) => e.name)
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Google SERP evidence for the keyword — ONE Apify run per scan, hard 20s cap
// ─────────────────────────────────────────────────────────────────────────────

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .toLowerCase()
  } catch {
    return ""
  }
}

// Geo-match the SERP to the business so "your Google rank" reflects what THEIR
// customers see (an Ottawa business is judged on google.ca, not US google.com).
// Deterministic: Canadian province / UK / AU markers in the city string, then
// the site TLD, else US.
export function inferCountryCode(city: string, websiteUrl: string): string {
  const c = (city || "").toUpperCase()
  if (/,\s*(ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|YT|NT|NU)\b/.test(c) || /\bCANADA\b/.test(c)) return "ca"
  if (/\b(UK|UNITED KINGDOM|ENGLAND|SCOTLAND|WALES)\b/.test(c)) return "gb"
  if (/,\s*(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\b/.test(c) || /\bAUSTRALIA\b/.test(c)) return "au"
  const host = websiteUrl ? hostOf(websiteUrl) : ""
  if (host.endsWith(".ca")) return "ca"
  if (host.endsWith(".co.uk") || host.endsWith(".uk")) return "gb"
  if (host.endsWith(".com.au") || host.endsWith(".au")) return "au"
  return "us"
}

// The scan route calls this at most ONCE per scan (cost control — the Apify
// account has a monthly cap). Returns null whenever real SERP evidence isn't
// available: APIFY_TOKEN unset, SCAN_SERP_DISABLED=1, run failed, timed out
// (20s), or came back empty — the results page hides the block on null.
export async function fetchKeywordSerp(keyword: string, countryCode = "us"): Promise<ScanSerp | null> {
  const kw = keyword.trim()
  if (!kw) return null
  if (process.env.SCAN_SERP_DISABLED === "1") return null
  if (!isSearchConfigured()) return null
  try {
    const raw = await googleSearch(kw, { results: 10, timeoutMs: 20_000, country: countryCode })
    const results: SerpEntry[] = raw.slice(0, 10).flatMap((r, i) => {
      const domain = hostOf(r.url)
      // position is the true organic slot (index in the returned list), kept
      // stable even when an unparseable URL gets skipped.
      return domain ? [{ position: i + 1, title: r.title, url: r.url, domain }] : []
    })
    // googleSearch swallows its own failures into [] — treat empty as
    // unavailable rather than pretending page one of Google is blank.
    return results.length > 0 ? { keyword: kw, results, countryCode } : null
  } catch (err) {
    console.error("fetchKeywordSerp error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Competitor names × SERP → link + Google-rank evidence per competitor
// ─────────────────────────────────────────────────────────────────────────────

// Aggregator/directory hosts that must never be attributed as a competitor's
// own website (a Yelp listing title often contains the business name).
const AGGREGATOR_HOSTS = [
  "yelp.", "google.", "maps.", "bing.", "facebook.", "instagram.", "linkedin.",
  "twitter.", "x.com", "tiktok.", "pinterest.", "youtube.", "reddit.",
  "tripadvisor.", "bbb.org", "yellowpages.", "angi.", "thumbtack.", "houzz.",
  "nextdoor.", "mapquest.", "foursquare.", "indeed.", "glassdoor.",
  "wikipedia.", "amazon.", "expedia.", "booking.", "groupon.", "opentable.",
  "doordash.", "ubereats.", "grubhub.", "healthgrades.", "zocdoc.", "avvo.",
  "findlaw.", "justia.", "quora.", "medium.com", "substack.", "clutch.co",
  "g2.com", "capterra.", "trustpilot.", "crunchbase.",
]

function isAggregator(domain: string): boolean {
  return AGGREGATOR_HOSTS.some((d) => domain.includes(d))
}

// Enrich the v1 competitor names with SERP evidence. Pure and defensive —
// never throws, never attributes the scanned business's own domain, never
// attributes a directory listing as a competitor's website. Match heuristics
// (checked against each SERP result in rank order, first confident hit wins):
//   - normalized competitor name == normalized domain (or its base word)
//   - name/domain-base containment, both sides >= 5 normalized chars
//   - full competitor name appears in the result title (case-insensitive)
export function buildCompetitorDetails(
  competitors: string[],
  mentionedByEngine: Record<string, string[]>,
  serp: ScanSerp | null,
  websiteUrl: string,
  // Extraction-recalled domains (already name-validated) — link fallback when
  // the SERP has no confident match. Never provides a googleRank.
  knownDomains: Record<string, string> = {}
): CompetitorDetail[] {
  const own = websiteUrl ? hostOf(websiteUrl) : ""
  return competitors.slice(0, 5).map((name) => {
    const key = normalizeName(name)

    // How many engines (0-4) recommended this competitor.
    let aiMentions = 0
    for (const names of Object.values(mentionedByEngine)) {
      if (names.some((n) => normalizeName(n) === key)) aiMentions++
    }
    aiMentions = Math.min(aiMentions, 4)

    let match: SerpEntry | null = null
    if (serp && key) {
      const nameLower = name.trim().toLowerCase()
      for (const r of serp.results) {
        const domain = r.domain
        // Self-exclusion: the scanned business's own domain never appears.
        if (own && (domain === own || domain.endsWith(`.${own}`))) continue
        if (isAggregator(domain)) continue
        const domainNorm = normalizeName(domain)
        const domainBase = normalizeName(domain.split(".")[0])
        const confident =
          (key.length >= 4 && (domainBase === key || domainNorm === key)) ||
          (key.length >= 5 &&
            domainBase.length >= 5 &&
            (domainBase.includes(key) || key.includes(domainBase))) ||
          (nameLower.length >= 4 && r.title.toLowerCase().includes(nameLower))
        if (confident) {
          match = r
          break
        }
      }
    }

    // Link fallback: validated extraction domain (never the scanned business's
    // own site), rank stays null — we only claim ranks the SERP proved.
    const fallback = !match && key ? knownDomains[key] : undefined
    const own2 = own && fallback ? fallback === own || fallback.endsWith(`.${own}`) : false
    const fallbackDomain = fallback && !own2 ? fallback : null

    return {
      name,
      domain: match ? match.domain : fallbackDomain,
      url: match ? match.url : fallbackDomain ? `https://${fallbackDomain}` : null,
      aiMentions,
      googleRank: match ? match.position : null,
    }
  })
}

// The AI engines and Google's top-10 rarely name the same businesses. Google's
// top rankers for the keyword are competitor evidence in their own right —
// guaranteed real link + rank — so surface the top few as extra rows
// (aiMentions 0, which the table renders honestly as "0 of 4").
export function appendSerpCompetitors(
  details: CompetitorDetail[],
  serp: ScanSerp | null,
  websiteUrl: string,
  maxExtras = 3
): CompetitorDetail[] {
  if (!serp || serp.results.length === 0) return details
  const own = websiteUrl ? hostOf(websiteUrl) : ""
  const taken = new Set(details.filter((d) => d.domain).map((d) => d.domain as string))
  const extras: CompetitorDetail[] = []
  for (const r of serp.results) {
    if (extras.length >= maxExtras) break
    const domain = r.domain
    if (!domain || taken.has(domain)) continue
    if (own && (domain === own || domain.endsWith(`.${own}`))) continue
    if (isAggregator(domain)) continue
    // Pretty name: first segment of the title, else capitalized domain base.
    const titleHead = r.title.split(/[|–—-]/)[0].trim()
    const base = domain.split(".")[0]
    const name =
      titleHead.length >= 3 && titleHead.length <= 60
        ? titleHead
        : base.charAt(0).toUpperCase() + base.slice(1)
    taken.add(domain)
    extras.push({ name, domain, url: r.url, aiMentions: 0, googleRank: r.position })
  }
  return [...details, ...extras].slice(0, 8)
}
