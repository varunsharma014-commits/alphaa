// Auto-discover competitors for a business: search "[type] [city]" on Google,
// filter out directories, take the top real business sites, analyze each, and
// store them as Competitor records tagged source: "auto_discovered".

import { db } from "@/lib/db"
import { dataforseoConfigured, googleSearch, type Mode } from "@/lib/dataforseo"
import { analyzeCompetitor } from "@/lib/competitor-analyzer"
import { analyzeContentGaps } from "@/lib/content-gaps"
import { claudeFor } from "@/lib/claude"
import { logActivity } from "@/lib/activity"
import { blockedHost, dismissedHosts, nicheVerdicts } from "@/lib/competitor-relevance"

const anthropic = claudeFor("competitors")

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
  state?: string | null
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
  return DIRECTORY_HOSTS.some((d) => host.includes(d)) || blockedHost(host)
}

// Returns the number of new competitors discovered + stored.
// `mode`: "live" when the owner is waiting (the "Find competitors now" button), else standard
// (onboarding, the weekly cron, a dismissal's background re-search): cheaper, a minute or two.
export async function discoverCompetitors(user: DiscoverUser, max = 5, opts: { mode?: Mode } = {}): Promise<number> {
  if (!dataforseoConfigured()) return 0
  if (!user.businessType) return 0

  const query = await buildCompetitorQuery(user)
  const results = await googleSearch(query, { results: 10, city: user.city, state: user.state, websiteUrl: user.websiteUrl, mode: opts.mode ?? "standard", timeoutMs: opts.mode === "live" ? 60_000 : 6 * 60_000 })
  if (results.length === 0) return 0

  const ownHost = user.websiteUrl ? hostOf(user.websiteUrl) : null
  const dismissed = await dismissedHosts(user.id).catch(() => new Set<string>())
  const seen = new Set<string>()
  const cands: { host: string; name: string; about: string }[] = []

  for (const r of results) {
    const host = hostOf(r.url)
    if (!host || isDirectory(host) || host === ownHost || dismissed.has(host) || seen.has(host)) continue
    seen.add(host)
    cands.push({ host, name: r.title, about: r.description ?? "" })
  }
  // Niche check before the (expensive) crawl + analysis: only real competitors get stored.
  // No verdict (model unavailable) = keep the old behaviour for that site.
  const verdicts = await nicheVerdicts(user, cands).catch(() => ({} as Record<string, { ok: boolean }>))
  const picks = cands.filter((c) => verdicts[c.host]?.ok !== false).slice(0, max).map((c) => `https://${c.host}`)

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
  opts: { mode?: Mode } = {},
): Promise<{ discovered: number; gapsGenerated: number }> {
  const discovered = await discoverCompetitors(user, 5, opts)

  if (discovered > 0) {
    // Pull the names of the competitors just stored so the activity feed can
    // show who alphaa is now watching.
    let names = ""
    try {
      const recent = await db.competitor.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: discovered,
        select: { name: true },
      })
      names = recent.map((c) => c.name).filter(Boolean).join(", ")
    } catch {
      // names are decorative — the count alone is fine
    }
    await logActivity(
      user.id,
      "competitors",
      `alphaa found ${discovered} competitor${discovered === 1 ? "" : "s"} to track`,
      names || `${discovered} local competitor${discovered === 1 ? "" : "s"} now being watched`
    )
  }

  let gapsGenerated = 0
  if (user.websiteUrl && user.businessType) {
    try {
      const recent = await db.competitor.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 })
      const dismissed = await dismissedHosts(user.id).catch(() => new Set<string>())
      const ok = await nicheVerdicts(user, recent.map((c) => ({ host: hostOf(c.url) ?? c.url, name: c.name }))).catch(() => ({} as Record<string, { ok: boolean }>))
      const top = recent.find((c) => { const h = hostOf(c.url); return h && !blockedHost(h) && !dismissed.has(h) && ok[h]?.ok !== false }) ?? null
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
          await logActivity(
            user.id,
            "content_gaps",
            `alphaa found ${gapsGenerated} content opportunit${gapsGenerated === 1 ? "y" : "ies"}`,
            "Topics your competitors cover that you don't — ready in your content plan"
          )
        }
      }
    } catch {
      // gaps are best-effort — discovery still succeeds
    }
  }

  return { discovered, gapsGenerated }
}
