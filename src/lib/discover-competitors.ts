// Auto-discover competitors for a business: search "[type] [city]" on Google,
// filter out directories, take the top real business sites, analyze each, and
// store them as Competitor records tagged source: "auto_discovered".

import { db } from "@/lib/db"
import { googleSearch } from "@/lib/apify-search"
import { analyzeCompetitor } from "@/lib/competitor-analyzer"
import { analyzeContentGaps } from "@/lib/content-gaps"
import { anthropic } from "@/lib/claude"

// Hosts that are directories / aggregators / social / wikis — not real competitors.
const DIRECTORY_HOSTS = [
  "yelp.", "google.", "maps.", "bing.", "duckduckgo.", "facebook.", "instagram.",
  "linkedin.", "twitter.", "x.com", "tiktok.", "pinterest.", "youtube.", "reddit.",
  "tripadvisor.", "bbb.org", "yellowpages.", "yellow.", "angi.", "angieslist.",
  "thumbtack.", "houzz.", "nextdoor.", "mapquest.", "foursquare.", "indeed.",
  "glassdoor.", "wikipedia.", "amazon.", "expedia.", "booking.", "groupon.",
  "manta.", "chamberofcommerce.", "superpages.", "citysearch.", "local.com",
  "merchantcircle.", "apple.com", "opentable.", "doordash.", "ubereats.",
  "grubhub.", "healthgrades.", "zocdoc.", "avvo.", "findlaw.", "justia.",
  "fandom.", "wikia.", "wiki.", "quora.", "imdb.", "wattpad.", "pinterest.",
  "medium.com", "substack.", "blogspot.", "wordpress.com",
]

export type DiscoverUser = {
  id: string
  businessName: string | null
  businessType: string | null
  city: string | null
  websiteUrl: string | null
  voiceDescription?: string | null
}

// Build a real Google query that surfaces direct competitors — for ANY kind of
// business. The model decides whether the business is LOCAL (geo-target the
// query) or NON-LOCAL / online / B2B (query by category, no city), so we never
// search nonsense like "Other Kanata" and don't force a city onto a national
// business.
async function buildCompetitorQuery(user: DiscoverUser): Promise<string> {
  const city = (user.city ?? "").trim()
  const fallback = `${user.businessType ?? "business"} ${city}`.trim()

  try {
    const about = (user.voiceDescription ?? "").slice(0, 500)
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 40,
      messages: [
        {
          role: "user",
          content:
            `Build ONE Google search query that surfaces the direct competitors of this business.\n` +
            `Business name: ${user.businessName ?? "unknown"}\n` +
            `Type: ${user.businessType ?? "unknown"}\n` +
            `Website: ${user.websiteUrl ?? "unknown"}\n` +
            `What they do: ${about || "unknown"}\n` +
            `Location: ${city || "unknown"}\n\n` +
            `First decide: is this a LOCAL business (serves one area — dentist, plumber, restaurant, law firm) or a NON-LOCAL business (serves customers anywhere — SaaS, marketing/ad agency, online store, consultancy, B2B service)?\n` +
            `- LOCAL: include the city in the query (e.g. "family dentist Kanata").\n` +
            `- NON-LOCAL: do NOT include the city; query by category/niche (e.g. "B2B growth marketing agency", "project management software", "ecommerce SEO agency").\n` +
            `Reply with ONLY the search query — no quotes, no explanation.`,
        },
      ],
    })
    const block = msg.content.find((b) => b.type === "text")
    const q =
      block && block.type === "text"
        ? block.text.trim().split("\n")[0].replace(/^["']+|["']+$/g, "").trim()
        : ""
    return q.length >= 3 ? q : fallback
  } catch {
    return fallback
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .replace(/^www\./, "")
      .toLowerCase()
  } catch {
    return null
  }
}

function isDirectory(host: string): boolean {
  return DIRECTORY_HOSTS.some((d) => host.includes(d))
}

// Returns the number of new competitors discovered + stored.
export async function discoverCompetitors(user: DiscoverUser, max = 5): Promise<number> {
  if (!process.env.APIFY_TOKEN) return 0
  if (!user.businessType) return 0

  const query = await buildCompetitorQuery(user)
  const results = await googleSearch(query, { results: 10 })
  if (results.length === 0) return 0

  const ownHost = user.websiteUrl ? hostOf(user.websiteUrl) : null
  const seen = new Set<string>()
  const picks: string[] = []

  for (const r of results) {
    const host = hostOf(r.url)
    if (!host || isDirectory(host) || host === ownHost || seen.has(host)) continue
    seen.add(host)
    picks.push(`https://${host}`)
    if (picks.length >= max) break
  }

  let created = 0
  for (const url of picks) {
    const host = hostOf(url)
    if (!host) continue
    // Skip if we already track this competitor.
    const existing = await db.competitor.findFirst({
      where: { userId: user.id, url: { contains: host } },
    })
    if (existing) continue

    try {
      const analysis = await analyzeCompetitor(url, "", user.businessType, user.city ?? "")
      await db.competitor.create({
        data: {
          userId: user.id,
          url: analysis.url,
          name: analysis.name,
          // crawlData carries the typed crawl stats + aiSummary (as elsewhere)
          // plus a source tag so the UI can show "Auto-discovered by alphaa".
          crawlData: {
            ...analysis.crawlData,
            aiSummary: analysis.aiSummary,
            source: "auto_discovered",
          } as object,
          analyzedAt: new Date(),
        },
      })
      created++
    } catch {
      // One competitor failing shouldn't stop the rest.
    }
  }

  return created
}

// Discover competitors AND auto-generate content gaps from the top one
// (Change 1 + Change 2 in one pass). Best-effort: gap generation never blocks
// or fails the discovery result.
export async function runAutoDiscovery(
  user: DiscoverUser,
): Promise<{ discovered: number; gapsGenerated: number }> {
  const discovered = await discoverCompetitors(user)

  let gapsGenerated = 0
  if (user.websiteUrl && user.businessType) {
    try {
      const top = await db.competitor.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
      if (top) {
        const { gaps, summary } = await analyzeContentGaps(
          user.websiteUrl,
          top.url,
          user.businessName ?? "",
          user.businessType,
          user.city ?? "",
        )
        if (gaps.length > 0) {
          await db.contentGap.create({
            data: {
              userId: user.id,
              competitorUrl: top.url,
              gaps: gaps as object,
              summary,
            },
          })
          gapsGenerated = gaps.length
        }
      }
    } catch {
      // gaps are best-effort — discovery still succeeds
    }
  }

  return { discovered, gapsGenerated }
}
