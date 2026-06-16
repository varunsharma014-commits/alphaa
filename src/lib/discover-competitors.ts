// Auto-discover competitors for a business: search "[type] [city]" on Google,
// filter out directories, take the top real business sites, analyze each, and
// store them as Competitor records tagged source: "auto_discovered".

import { db } from "@/lib/db"
import { googleSearch } from "@/lib/apify-search"
import { analyzeCompetitor } from "@/lib/competitor-analyzer"

// Hosts that are directories / aggregators / social — not direct competitors.
const DIRECTORY_HOSTS = [
  "yelp.", "google.", "maps.", "bing.", "duckduckgo.", "facebook.", "instagram.",
  "linkedin.", "twitter.", "x.com", "tiktok.", "pinterest.", "youtube.", "reddit.",
  "tripadvisor.", "bbb.org", "yellowpages.", "yellow.", "angi.", "angieslist.",
  "thumbtack.", "houzz.", "nextdoor.", "mapquest.", "foursquare.", "indeed.",
  "glassdoor.", "wikipedia.", "amazon.", "expedia.", "booking.", "groupon.",
  "manta.", "chamberofcommerce.", "superpages.", "citysearch.", "local.com",
  "merchantcircle.", "apple.com", "opentable.", "doordash.", "ubereats.",
  "grubhub.", "healthgrades.", "zocdoc.", "avvo.", "findlaw.", "justia.",
]

export type DiscoverUser = {
  id: string
  businessName: string | null
  businessType: string | null
  city: string | null
  websiteUrl: string | null
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
  if (!user.businessType || !user.city) return 0

  const results = await googleSearch(`${user.businessType} ${user.city}`, { results: 10 })
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
      const analysis = await analyzeCompetitor(url, "", user.businessType, user.city)
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
