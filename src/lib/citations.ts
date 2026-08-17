import { googleSearch, isSearchConfigured, type SerpResult } from "./apify-search"
import { checkAppearance } from "./ai-engines"

// AI Citation Building.
//
// Deliberately NOT backlink building. AI engines don't count links — they read
// and cite pages. Perplexity footnotes its sources; ChatGPT and Gemini
// synthesise "best X in Y" listicles, directories, forums and review profiles.
// So the job is: find the pages an engine actually reads when asked about this
// category in this city, then report which of them mention the business.
//
// The output is a work list, not a link scheme: "these 18 pages decide the
// answer, you appear on 4 of them."

export type CitationKind = "bestof" | "directory" | "forum" | "review" | "other"

export type CitationStatus = "listed" | "missing" | "unknown"

export interface CitationTarget {
  url: string
  domain: string
  title: string
  kind: CitationKind
  status: CitationStatus
  /** Google position for the query that surfaced it — a proxy for how likely an engine is to read it. */
  rank: number
  query: string
  /** Text around the mention when we found one. */
  snippet: string | null
}

export interface CitationReport {
  generatedAt: string
  queries: string[]
  targets: CitationTarget[]
  listed: number
  missing: number
  unknown: number
  /** Null when APIFY_TOKEN is absent — we say so rather than returning an empty report. */
  searchConfigured: boolean
}

const REVIEW_DOMAINS = [
  "yelp.", "trustpilot.", "bbb.org", "angi.com", "angieslist.", "healthgrades.",
  "zocdoc.", "avvo.", "tripadvisor.", "opentable.", "thumbtack.", "houzz.",
  "facebook.com", "google.com/maps", "birdeye.", "podium.",
]

const FORUM_DOMAINS = [
  "reddit.com", "quora.com", "nextdoor.", "stackexchange.", "stackoverflow.",
  "forums.", "/forum", "discussions.", "city-data.com",
]

const DIRECTORY_DOMAINS = [
  "yellowpages.", "yp.com", "manta.com", "chamberofcommerce.", "bizapedia.",
  "merchantcircle.", "hotfrog.", "cylex.", "brownbook.", "foursquare.",
  "mapquest.", "superpages.", "local.com", "citysearch.", "expertise.com",
  "porch.com", "homeadvisor.",
]

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return ""
  }
}

export function classify(url: string, title: string): CitationKind {
  const u = url.toLowerCase()
  const t = title.toLowerCase()
  if (REVIEW_DOMAINS.some((d) => u.includes(d))) return "review"
  if (FORUM_DOMAINS.some((d) => u.includes(d))) return "forum"
  if (DIRECTORY_DOMAINS.some((d) => u.includes(d))) return "directory"
  // "Best 10 plumbers in Dallas", "Top-rated dentists near me", "… guide"
  if (/\b(best|top\s*\d*|top-rated|leading)\b/.test(t)) return "bestof"
  return "other"
}

/**
 * The queries a customer would type — and therefore the pages an engine reads
 * when answering them. Kept small: each one is a paid SERP call.
 */
export function buildQueries(businessType: string, city: string): string[] {
  const trade = businessType.trim() || "business"
  const place = city.trim()
  const inPlace = place ? ` in ${place}` : ""
  return [
    `best ${trade}${inPlace}`,
    `top rated ${trade}${inPlace}`,
    `${trade}${inPlace} reviews`,
    place ? `${trade} directory ${place}` : `${trade} directory`,
    `${trade}${inPlace} reddit`,
  ]
}

/**
 * Does this page mention the business? Fetches the page and looks for the name
 * or the domain. Returns "unknown" — never "missing" — when the page can't be
 * read, because "we couldn't check" and "you're not on it" are different claims
 * to make to a paying customer.
 */
async function checkPage(
  url: string,
  businessName: string,
  ownDomain: string | null
): Promise<{ status: CitationStatus; snippet: string | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        // Identify honestly. Some sites block unknown agents outright, which is
        // fine — that becomes "unknown", not a false "missing".
        "user-agent": "Mozilla/5.0 (compatible; AlphaaCitationBot/1.0; +https://alphaa.app)",
        accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { status: "unknown", snippet: null }

    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")

    // A link to their own domain counts as a citation even if the name is
    // written differently on the page.
    if (ownDomain && html.toLowerCase().includes(ownDomain)) {
      return { status: "listed", snippet: null }
    }

    // Same matcher the AI scan uses, so CamelCase and spacing variants are
    // handled identically ("GrowthTurbine" vs "Growth Turbine").
    const { appeared, snippet } = checkAppearance(text, businessName)
    return { status: appeared ? "listed" : "missing", snippet }
  } catch {
    return { status: "unknown", snippet: null }
  }
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++
        out[idx] = await fn(items[idx])
      }
    })
  )
  return out
}

export async function buildCitationReport(input: {
  businessName: string
  businessType: string
  city: string
  websiteUrl?: string | null
  /** Cap on pages fetched — each is a live HTTP request. */
  maxTargets?: number
}): Promise<CitationReport> {
  const queries = buildQueries(input.businessType, input.city)

  if (!isSearchConfigured()) {
    return {
      generatedAt: new Date().toISOString(),
      queries,
      targets: [],
      listed: 0,
      missing: 0,
      unknown: 0,
      searchConfigured: false,
    }
  }

  // websiteUrl is stored without a protocol in this codebase.
  const ownDomain = input.websiteUrl
    ? input.websiteUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
    : null

  const seen = new Set<string>()
  const candidates: Omit<CitationTarget, "status" | "snippet">[] = []

  for (const q of queries) {
    let results: SerpResult[] = []
    try {
      results = await googleSearch(q, { results: 10, timeoutMs: 60_000 })
    } catch {
      continue
    }
    results.forEach((r, i) => {
      const domain = hostOf(r.url)
      if (!domain) return
      // Their own site isn't a third-party citation.
      if (ownDomain && domain.includes(ownDomain)) return
      if (seen.has(r.url)) return
      seen.add(r.url)
      candidates.push({
        url: r.url,
        domain,
        title: r.title || domain,
        kind: classify(r.url, r.title || ""),
        rank: i + 1,
        query: q,
      })
    })
  }

  // Highest-leverage first: the pages an engine is most likely to quote.
  const KIND_WEIGHT: Record<CitationKind, number> = {
    bestof: 0, directory: 1, review: 2, forum: 3, other: 4,
  }
  candidates.sort((a, b) => KIND_WEIGHT[a.kind] - KIND_WEIGHT[b.kind] || a.rank - b.rank)

  const shortlist = candidates.slice(0, input.maxTargets ?? 24)

  const checked = await mapWithLimit(shortlist, 6, async (c) => {
    const { status, snippet } = await checkPage(c.url, input.businessName, ownDomain)
    return { ...c, status, snippet } as CitationTarget
  })

  return {
    generatedAt: new Date().toISOString(),
    queries,
    targets: checked,
    listed: checked.filter((t) => t.status === "listed").length,
    missing: checked.filter((t) => t.status === "missing").length,
    unknown: checked.filter((t) => t.status === "unknown").length,
    searchConfigured: true,
  }
}
