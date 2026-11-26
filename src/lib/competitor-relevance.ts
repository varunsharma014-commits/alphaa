// Is this site really a competitor? Two gates, both additive (no rows are deleted):
//   1. Domain rules: wikis, directories and listing sites, forums, social platforms,
//      marketplaces, website builders, big platforms and news/media are never competitors.
//      Applies to every row (a wiki is never a rival, whoever added it).
//   2. A cheap niche check (Haiku) against the business's own description and location, cached
//      per host in agent settings `competitorRelevance`. Skipped for sites the owner added
//      themselves (crawlData.source === "manual").
// The owner can also dismiss one ("Not a competitor"): agent settings `competitorsDismissed`.
import { claudeFor } from "@/lib/claude"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { db } from "@/lib/db"

const anthropic = claudeFor("competitor-relevance")

const BLOCK_PARTS = [
  // wikis / reference
  "wikipedia.", "fandom.", "wikia.", "wikihow.", "britannica.", "imdb.", "wiki.",
  // directories, listings, reviews
  "yelp.", "yellowpages.", "yellow.", "bbb.org", "angi.", "angieslist.", "thumbtack.", "houzz.", "homeadvisor.", "nextdoor.",
  "mapquest.", "foursquare.", "tripadvisor.", "manta.", "chamberofcommerce.", "superpages.", "citysearch.", "local.com",
  "merchantcircle.", "healthgrades.", "zocdoc.", "avvo.", "findlaw.", "justia.", "clutch.co", "g2.com", "capterra.", "trustpilot.",
  "sitejabber.", "glassdoor.", "indeed.", "crunchbase.", "zoominfo.", "producthunt.", "goodfirms.", "designrush.", "upcity.", "expertise.com",
  "sortlist.", "bark.com", "opentable.", "booking.", "expedia.", "groupon.",
  // forums / Q&A / blogs
  "reddit.", "quora.", "stackexchange.", "stackoverflow.", "medium.com", "substack.", "blogspot.", "tumblr.", "wattpad.",
  // social / video
  "facebook.", "instagram.", "linkedin.", "twitter.", "x.com", "tiktok.", "pinterest.", "youtube.", "vimeo.", "threads.net", "snapchat.",
  // marketplaces / delivery
  "amazon.", "ebay.", "etsy.", "walmart.", "alibaba.", "fiverr.", "upwork.", "doordash.", "ubereats.", "grubhub.", "skipthedishes.",
  // website builders / hosting
  "squarespace.", "wix.", "wordpress.com", "wordpress.org", "webflow.", "shopify.", "godaddy.", "weebly.", "hostinger.", "duda.", "jimdo.", "carrd.",
  // big platforms / search
  "google.", "bing.", "duckduckgo.", "yahoo.", "apple.com", "microsoft.", "adobe.", "salesforce.", "hubspot.", "oracle.", "canva.", "mailchimp.", "zoom.us",
  // news / media
  "nytimes.", "forbes.", "cnn.", "bbc.", "theguardian.", "wsj.", "bloomberg.", "reuters.", "businessinsider.", "techcrunch.", "inc.com",
  "entrepreneur.com", "huffpost.", "usatoday.", "cbc.ca", "ctvnews.", "globalnews.", "theverge.", "wired.", "fastcompany.", "cnbc.",
]

export const hostOf = (url: string): string | null => {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

/** Domain rule: never a competitor, whoever added it. */
export function blockedHost(host: string | null): boolean {
  if (!host) return true
  return BLOCK_PARTS.some((p) =>
    p.endsWith(".")
      // "yelp." = a label: yelp.com, yelp.ca, foo.yelp.com, kimetsu.fandom.com
      ? host.startsWith(p) || host.includes(`.${p}`)
      // "x.com" = that domain and its subdomains only (not fedex.com)
      : host === p || host.endsWith(`.${p}`),
  ) || /\.(gov|edu)(\.[a-z]{2})?$/.test(host)
}

export type Verdict = { ok: boolean; why?: string; at: string }
export type Candidate = { host: string; name?: string | null; about?: string | null }
type Biz = { id: string; businessName: string | null; businessType: string | null; city: string | null; websiteUrl: string | null; voiceDescription?: string | null }

/**
 * Niche check for hosts we haven't judged yet (one small call for all of them), cached per host.
 * Returns the verdict per host; hosts the model didn't answer for are left out (shown, not hidden).
 */
export async function nicheVerdicts(user: Biz, items: Candidate[], opts: { save?: boolean } = {}): Promise<Record<string, Verdict>> {
  const s = await getAgentSettings(user.id)
  const cache = { ...(s.competitorRelevance ?? {}) }
  const todo = items.filter((i) => !cache[i.host]).slice(0, 12)
  if (todo.length) {
    try {
      const list = todo.map((t, k) => `${k + 1}. ${t.host}${t.name ? ` (${t.name})` : ""}${t.about ? `: ${t.about.replace(/\s+/g, " ").slice(0, 220)}` : ""}`).join("\n")
      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 600,
        messages: [{
          role: "user",
          content:
            `A business owner wants to know which of these websites are their real competitors: businesses that sell something similar to the same kind of customer${user.city?.trim() ? " (if the business is local, in or near the same area)" : ""}.\n\n` +
            `The business: ${user.businessName ?? "unknown"} (${user.websiteUrl ?? "no website"}). Type: ${user.businessType ?? "unknown"}.${user.city?.trim() ? ` Location: ${user.city.trim()}.` : ""}\n` +
            `What they do: ${(user.voiceDescription ?? "").slice(0, 400) || "unknown"}\n\n` +
            `Websites:\n${list}\n\n` +
            `NOT competitors: wikis, fan sites, directories, review or listing sites, forums, social networks, marketplaces, website builders, big software platforms the business might use, news and media, and businesses in a different industry.\n` +
            `Reply with ONLY JSON: [{"n": <number>, "competitor": true|false, "why": "<max 8 words>"}]`,
        }],
      })
      const text = msg.content.find((b) => b.type === "text")
      const raw = text && text.type === "text" ? text.text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim() : "[]"
      const parsed = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)) as { n?: number; competitor?: boolean; why?: string }[]
      const at = new Date().toISOString()
      for (const p of parsed) {
        const t = typeof p.n === "number" ? todo[p.n - 1] : undefined
        if (t && typeof p.competitor === "boolean") cache[t.host] = { ok: p.competitor, why: typeof p.why === "string" ? p.why.slice(0, 80) : undefined, at }
      }
      if (opts.save !== false) {
        // Keep the cache small: newest 200 hosts.
        const entries = Object.entries(cache).sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, 200)
        await saveAgentSettings(user.id, { competitorRelevance: Object.fromEntries(entries) })
      }
    } catch {
      // No verdict this time: the site stays visible (domain rules still apply) and is retried next load.
    }
  }
  return Object.fromEntries(items.filter((i) => cache[i.host]).map((i) => [i.host, cache[i.host]]))
}

export async function dismissedHosts(userId: string): Promise<Set<string>> {
  const s = await getAgentSettings(userId)
  return new Set((s.competitorsDismissed ?? []).map((h) => h.toLowerCase()))
}

// ── The single gate every surface uses (pages, chat threads, generation, emails) ─────────────

type Row = { url: string; name?: string | null; crawlData?: unknown }
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
/** The owner added this one by hand (POST /api/competitors): the niche check never hides it. */
export const isManualRow = (r: Pick<Row, "crawlData">) => isObj(r.crawlData) && r.crawlData.source === "manual"

export type CompetitorGate = {
  /** True when this site may be shown to the owner or used for generation. */
  keep: (url: string, manual?: boolean) => boolean
  dismissed: Set<string>
  verdicts: Record<string, Verdict>
}

async function bizOf(user: string | Biz): Promise<Biz | null> {
  if (typeof user !== "string") return user
  return db.user.findUnique({ where: { id: user }, select: { id: true, businessName: true, businessType: true, city: true, websiteUrl: true, voiceDescription: true } })
}

/**
 * Domain rules + the owner's dismissals + the cached niche verdict. With `judge` (default) hosts
 * not judged yet are checked once (Haiku, cached), waiting at most `ms`; a host without a verdict
 * is kept. `rows` / `urls` are the sites the caller is about to show or use.
 */
export async function competitorGate(user: string | Biz, opts: { rows?: Row[]; urls?: string[]; judge?: boolean; ms?: number } = {}): Promise<CompetitorGate> {
  const biz = await bizOf(user)
  const userId = typeof user === "string" ? user : user.id
  const [s, dismissed] = await Promise.all([getAgentSettings(userId), dismissedHosts(userId)])
  const own = hostOf(biz?.websiteUrl ?? "")
  let verdicts: Record<string, Verdict> = { ...(s.competitorRelevance ?? {}) }
  if (biz && opts.judge !== false) {
    const items: Candidate[] = []
    const add = (url: string, name?: string | null, about?: string | null) => {
      const h = hostOf(url)
      if (h && h !== own && !blockedHost(h) && !dismissed.has(h) && !verdicts[h] && !items.some((i) => i.host === h)) items.push({ host: h, name, about })
    }
    for (const r of opts.rows ?? []) if (!isManualRow(r)) add(r.url, r.name, isObj(r.crawlData) && typeof r.crawlData.aiSummary === "string" ? r.crawlData.aiSummary : null)
    for (const u of opts.urls ?? []) add(u)
    if (items.length) {
      const fresh = await Promise.race([
        nicheVerdicts(biz, items).catch(() => ({} as Record<string, Verdict>)),
        new Promise<Record<string, Verdict>>((res) => setTimeout(() => res({}), opts.ms ?? 8000)),
      ])
      verdicts = { ...verdicts, ...fresh }
    }
  }
  const keep = (url: string, manual = false) => {
    const h = hostOf(url)
    return !!h && h !== own && !blockedHost(h) && !dismissed.has(h) && (manual || verdicts[h]?.ok !== false)
  }
  return { keep, dismissed, verdicts }
}

/** Competitor rows the owner should see / generation may use, in the same order. */
export async function relevantCompetitors<T extends Row>(user: string | Biz, rows: T[], opts: { judge?: boolean; ms?: number } = {}): Promise<T[]> {
  if (!rows.length) return rows
  const gate = await competitorGate(user, { rows, ...opts })
  return rows.filter((r) => gate.keep(r.url, isManualRow(r)))
}

/** ContentGap rows whose competitor passes the gate (a gap from a hand-added competitor always does). */
export async function relevantGaps<T extends { competitorUrl: string }>(user: string | Biz, gaps: T[], opts: { judge?: boolean; ms?: number } = {}): Promise<T[]> {
  if (!gaps.length) return gaps
  const userId = typeof user === "string" ? user : user.id
  const comps = await db.competitor.findMany({ where: { userId }, select: { url: true, crawlData: true } })
  const manual = new Set(comps.filter(isManualRow).map((c) => hostOf(c.url)).filter(Boolean) as string[])
  const gate = await competitorGate(user, { urls: gaps.map((g) => g.competitorUrl), ...opts })
  return gaps.filter((g) => gate.keep(g.competitorUrl, manual.has(hostOf(g.competitorUrl) ?? "")))
}
