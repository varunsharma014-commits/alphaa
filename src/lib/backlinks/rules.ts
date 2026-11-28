// Backlinks, pure (no DB, no network): parsers for DataForSEO Backlinks API answers (the first
// result object from lib/dataforseo.ts runTask) and the link-gap logic. Tested by
// scripts/test-backlinks.ts against recorded answers in scripts/fixtures/dataforseo/.
import { classifySource, SOURCE_KIND_LABEL, type SourceKind } from "@/lib/ai-sources"

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)

export type LinkSummary = {
  target: string
  /** DataForSEO rank, 0-100 scale (rank_scale one_hundred). */
  rank: number | null
  backlinks: number | null
  /** Main domains (subdomains rolled up): the number owners understand as "sites linking to you". */
  referringDomains: number | null
  spamScore: number | null
  brokenBacklinks: number | null
  firstSeen: string | null
}

export function parseSummary(result: unknown): LinkSummary | null {
  if (!isObj(result) || !str(result.target)) return null
  return {
    target: str(result.target)!,
    rank: num(result.rank),
    backlinks: num(result.backlinks),
    referringDomains: num(result.referring_main_domains) ?? num(result.referring_domains),
    spamScore: num(result.backlinks_spam_score),
    brokenBacklinks: num(result.broken_backlinks),
    firstSeen: str(result.first_seen),
  }
}

export type MonthPoint = { month: string; rank: number | null; referringDomains: number | null; newDomains: number | null; lostDomains: number | null; backlinks: number | null }

/** history result → one point per month ("2026-10"), oldest first. */
export function parseHistory(result: unknown): MonthPoint[] {
  const out: MonthPoint[] = []
  for (const it of arr(isObj(result) ? result.items : null)) {
    if (!isObj(it)) continue
    const d = str(it.date)
    if (!d) continue
    out.push({
      month: d.slice(0, 7),
      rank: num(it.rank),
      referringDomains: num(it.referring_main_domains) ?? num(it.referring_domains),
      newDomains: num(it.new_referring_domains),
      lostDomains: num(it.lost_referring_domains),
      backlinks: num(it.backlinks),
    })
  }
  return out.sort((a, b) => a.month.localeCompare(b.month))
}

export type RefDomain = { domain: string; rank: number | null; backlinks: number | null; spamScore: number | null; firstSeen: string | null }

/** referring_domains result → rows. */
export function parseReferringDomains(result: unknown): { total: number | null; items: RefDomain[] } {
  const items: RefDomain[] = []
  for (const it of arr(isObj(result) ? result.items : null)) {
    if (!isObj(it) || !str(it.domain)) continue
    items.push({ domain: str(it.domain)!.toLowerCase(), rank: num(it.rank), backlinks: num(it.backlinks), spamScore: num(it.backlinks_spam_score), firstSeen: str(it.first_seen) })
  }
  return { total: isObj(result) ? num(result.total_count) : null, items }
}

export type Intersection = { domain: string; rank: number | null; spamScore: number | null; links: Record<string, number> }

/**
 * domain_intersection result → referring domains with which targets they link to. `targets` maps
 * the request's keys ("1", "2"…) to the competitor hosts.
 */
export function parseIntersection(result: unknown, targets: Record<string, string>): Intersection[] {
  const out: Intersection[] = []
  for (const it of arr(isObj(result) ? result.items : null)) {
    if (!isObj(it) || !isObj(it.domain_intersection)) continue
    const links: Record<string, number> = {}
    let domain: string | null = null
    let rank: number | null = null
    let spam: number | null = null
    for (const [k, v] of Object.entries(it.domain_intersection)) {
      if (!isObj(v) || !targets[k]) continue
      domain ??= str(v.target)?.toLowerCase() ?? null
      rank = Math.max(rank ?? 0, num(v.rank) ?? 0)
      spam = Math.max(spam ?? 0, num(v.backlinks_spam_score) ?? 0)
      links[targets[k]] = num(v.backlinks) ?? 0
    }
    if (domain) out.push({ domain, rank, spamScore: spam, links })
  }
  return out
}

// ── Link gap ───────────────────────────────────────────────────────────────────────────────────

/** Hosts that link to everyone and aren't a link anyone can ask for (CDNs, platforms, tools). */
const NOT_ASKABLE = [
  /^\d+\.\d+\.\d+\.\d+$/, /cloudfront\.net$/, /amazonaws\.com$/, /googleusercontent\.com$/, /akamai/, /cdn/, /\.azureedge\.net$/, /\.herokuapp\.com$/, /\.vercel\.app$/, /\.netlify\.app$/,
  /^(stripe|beehiiv|simplecast|mailchimp|substack|wix|squarespace|shopify|webflow|wordpress|godaddy|hubspot|calendly|typeform|zapier|gravatar|github|gitlab|bitly|linktr|linktree|feedburner|disqus|addthis|sharethis|clay|notion|canva|zoom|apple|google|bing|microsoft|yahoo)\./,
  /(^|\.)(t\.co|bit\.ly|lnkd\.in|ow\.ly|buff\.ly)$/,
]
export const askable = (host: string) => !NOT_ASKABLE.some((re) => re.test(host))

export const MAX_SPAM = 30

export type GapSite = {
  domain: string
  kind: SourceKind
  kindLabel: string
  rank: number | null
  /** Competitors it links to (hosts), most links first. */
  linksTo: string[]
}

/**
 * Sites linking to 2+ competitors but not the brand. Pairwise intersection answers are merged
 * (one site can show up in several pairs). Spam (score > MAX_SPAM), the brand's own site and
 * its known referring domains, the competitors themselves, social/forum hosts and
 * platforms/CDNs are dropped; directories and media stay, labelled.
 */
export function linkGap(sets: Intersection[][], ctx: { brandHost: string; competitorHosts: string[]; brandReferring?: Set<string>; max?: number }): GapSite[] {
  const merged = new Map<string, { rank: number | null; spam: number | null; links: Map<string, number> }>()
  for (const list of sets) for (const x of list) {
    const cur = merged.get(x.domain) ?? { rank: x.rank, spam: x.spamScore, links: new Map<string, number>() }
    cur.rank = Math.max(cur.rank ?? 0, x.rank ?? 0)
    cur.spam = Math.max(cur.spam ?? 0, x.spamScore ?? 0)
    for (const [h, n] of Object.entries(x.links)) cur.links.set(h, Math.max(cur.links.get(h) ?? 0, n))
    merged.set(x.domain, cur)
  }
  const out: GapSite[] = []
  for (const [domain, v] of merged) {
    const linked = [...v.links.entries()].filter(([, n]) => n > 0)
    if (linked.length < 2) continue
    if ((v.spam ?? 0) > MAX_SPAM || !askable(domain)) continue
    if (ctx.brandReferring?.has(domain)) continue
    const kind = classifySource(`https://${domain}/`, { ownHost: ctx.brandHost, competitorHosts: ctx.competitorHosts })
    if (kind === "own" || kind === "competitor" || kind === "social" || kind === "forum") continue
    out.push({ domain, kind, kindLabel: SOURCE_KIND_LABEL[kind], rank: v.rank, linksTo: linked.sort((a, b) => b[1] - a[1]).map(([h]) => h) })
  }
  return out.sort((a, b) => b.linksTo.length - a.linksTo.length || (b.rank ?? 0) - (a.rank ?? 0)).slice(0, ctx.max ?? 25)
}

/** Every pair of targets (for 2 competitors: one pair; 3: three pairs). */
export function pairs<T>(xs: T[]): [T, T][] {
  const out: [T, T][] = []
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) out.push([xs[i], xs[j]])
  return out
}

/** Month over month: the newest full month's new/lost sites linking in, vs the month before. */
export function monthOverMonth(h: MonthPoint[]): { month: string; newDomains: number | null; lostDomains: number | null; net: number | null; prevReferring: number | null; referring: number | null } | null {
  const last = h[h.length - 1]
  if (!last) return null
  const prev = h[h.length - 2] ?? null
  const net = last.newDomains !== null && last.lostDomains !== null ? last.newDomains - last.lostDomains : null
  return { month: last.month, newDomains: last.newDomains, lostDomains: last.lostDomains, net, prevReferring: prev?.referringDomains ?? null, referring: last.referringDomains }
}

/** What the owner's plan covers (CLAUDE.md "Keywords + backlinks"): Starter = own summary; Pro/Growth = competitors + link gap. */
export function backlinkScope(plan: string, comped: boolean): "own" | "full" {
  return comped || /pro|full|growth/i.test(plan) ? "full" : "own"
}
