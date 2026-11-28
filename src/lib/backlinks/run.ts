// "Who links to you vs competitors" (DataForSEO Backlinks API, live only). One snapshot per brand
// per refresh, stored as MockActivity "backlinks" (newest row = what Research shows):
//   every paid plan: the brand's summary (sites linking in, backlinks, rank) + monthly history
//     (new / lost sites linking in, month over month)
//   Pro / Growth (and comped): + its top sites linking in (100 rows), its top 3 real competitors'
//     summaries (lib/competitor-relevance gate), and the link gap: sites linking to 2+ of those
//     competitors but not the brand (pairwise domain_intersection, 100 rows each, brand excluded).
// Monthly cron (/api/cron/backlinks, 1st + catch-up, one snapshot per brand per month) and on
// demand at most once a day. Every call goes through lib/dataforseo.ts (data_usd quota + real
// cost). Suggested actions are cards only: Alphaa never emails a site.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { runTask, apiDenied, dataforseoConfigured } from "@/lib/dataforseo"
import { hostOf, relevantCompetitors, isManualRow } from "@/lib/competitor-relevance"
import {
  backlinkScope, linkGap, monthOverMonth, pairs, parseHistory, parseIntersection, parseReferringDomains, parseSummary,
  type GapSite, type LinkSummary, type MonthPoint, type RefDomain,
} from "./rules"

export const BACKLINKS_TYPE = "backlinks"
/** Rows per list call (cost: about $0.02 per call + $0.00003 per row). */
export const ROWS = 100

export type BacklinkSnapshot = {
  at: string
  month: string
  scope: "own" | "full"
  host: string
  summary: LinkSummary | null
  history: MonthPoint[]
  mom: ReturnType<typeof monthOverMonth>
  top: RefDomain[]
  competitors: { host: string; name: string | null; summary: LinkSummary | null }[]
  gap: GapSite[]
  costUsd: number
  calls: number
  /** Why something is missing (first person, for the owner). */
  notes: string[]
  source: "cron" | "owner"
}

export async function latestBacklinks(userId: string): Promise<(BacklinkSnapshot & { id: string }) | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: BACKLINKS_TYPE }, orderBy: { createdAt: "desc" }, select: { id: true, metadata: true } })
  return row ? { ...(row.metadata as unknown as BacklinkSnapshot), id: row.id } : null
}

const monthKey = (d = new Date()) => d.toISOString().slice(0, 7)
const running = new Set<string>()

/** Whether this brand gets backlinks at all (paid plan or comped) and how much. */
export function backlinksFor(user: Pick<User, "plan" | "email" | "subscriptionStatus" | "stripeSubscriptionId">): "own" | "full" | null {
  const comped = isComped(user.email)
  if (!comped && !hasPaidPlan(user)) return null
  return backlinkScope(user.plan, comped)
}

/** Top 3 real competitors' hosts: hand-added first, then the newest analysed. */
async function topCompetitors(user: User): Promise<{ host: string; name: string | null }[]> {
  const rows = await db.competitor.findMany({ where: { userId: user.id }, orderBy: { analyzedAt: "desc" }, take: 20, select: { url: true, name: true, crawlData: true } })
  const kept = await relevantCompetitors(user.id, rows, { ms: 8000 }).catch(() => [] as typeof rows)
  kept.sort((a, b) => Number(isManualRow(b)) - Number(isManualRow(a)))
  const own = hostOf(user.websiteUrl ?? "")
  const out: { host: string; name: string | null }[] = []
  for (const r of kept) { const h = hostOf(r.url); if (h && h !== own && !out.some((x) => x.host === h)) out.push({ host: h, name: r.name ?? null }) }
  return out.slice(0, 3)
}

/**
 * One fresh snapshot. `source: "cron"` skips a brand that already has one this month; "owner"
 * refuses more than one a day. Returns null when skipped (with the reason).
 */
export async function refreshBacklinks(user: User, source: "cron" | "owner"): Promise<{ snapshot: BacklinkSnapshot | null; skipped?: string }> {
  const scope = backlinksFor(user)
  if (!scope) return { snapshot: null, skipped: "plan" }
  const host = hostOf(user.websiteUrl ?? "")
  if (!host) return { snapshot: null, skipped: "no website" }
  if (!dataforseoConfigured()) return { snapshot: null, skipped: "not configured" }
  if (apiDenied("backlinks")) return { snapshot: null, skipped: "access denied" }
  if (running.has(user.id)) return { snapshot: null, skipped: "running" }
  const prev = await latestBacklinks(user.id)
  if (source === "cron" && prev?.month === monthKey()) return { snapshot: null, skipped: "this month" }
  if (source === "owner" && prev && Date.now() - Date.parse(prev.at) < 20 * 3_600_000) return { snapshot: null, skipped: "today" }
  running.add(user.id)
  try {
    const snap = await build(user, host, scope, source)
    if (!snap.summary && !snap.calls) return { snapshot: null, skipped: "failed" }
    await db.mockActivity.create({ data: { userId: user.id, type: BACKLINKS_TYPE, title: "Checked who links to your site", metadata: snap as unknown as object } })
    return { snapshot: snap }
  } finally {
    running.delete(user.id)
  }
}

async function build(user: User, host: string, scope: "own" | "full", source: "cron" | "owner"): Promise<BacklinkSnapshot> {
  let cost = 0
  let calls = 0
  const notes: string[] = []
  const call = async (ep: Parameters<typeof runTask>[0], task: Record<string, unknown>) => {
    const r = await runTask(ep, task, { estUsd: 0.025, timeoutMs: 60_000 })
    cost += r.cost
    if (r.ok || r.cost > 0) calls++
    return r
  }
  const base = { rank_scale: "one_hundred", internal_list_limit: 1 }
  const from = new Date(Date.now() - 100 * 86_400_000).toISOString().slice(0, 10)

  const [sum, hist, top] = await Promise.all([
    call("blSummary", { target: host, include_subdomains: true, backlinks_status_type: "live", ...base }),
    call("blHistory", { target: host, date_from: from, rank_scale: "one_hundred" }),
    scope === "full" ? call("blReferringDomains", { target: host, limit: ROWS, order_by: ["rank,desc"], exclude_internal_backlinks: true, backlinks_status_type: "live", ...base }) : Promise.resolve(null),
  ])
  const summary = sum.ok ? parseSummary(sum.result) : null
  if (!sum.ok) notes.push(apiDenied("backlinks") ? "The link data service turned me away, so I couldn’t check your links this time." : "I couldn’t read your link data this time. I’ll try again.")
  const history = hist.ok ? parseHistory(hist.result) : []
  const topList = top?.ok ? parseReferringDomains(top.result).items : []

  let competitors: BacklinkSnapshot["competitors"] = []
  let gap: GapSite[] = []
  if (scope === "full" && summary) {
    const comps = await topCompetitors(user)
    if (!comps.length) notes.push("I’m not watching any real competitors yet, so there’s nothing to compare links with.")
    const sums = await Promise.all(comps.map((c) => call("blSummary", { target: c.host, include_subdomains: true, backlinks_status_type: "live", ...base })))
    competitors = comps.map((c, i) => ({ ...c, summary: sums[i].ok ? parseSummary(sums[i].result) : null }))
    if (comps.length >= 2) {
      const sets = await Promise.all(pairs(comps.map((c) => c.host)).map(async ([a, b]) => {
        const r = await call("blIntersection", { targets: { "1": a, "2": b }, exclude_targets: [host], intersection_mode: "all", limit: ROWS, order_by: ["1.rank,desc"], exclude_internal_backlinks: true, ...base })
        return r.ok ? parseIntersection(r.result, { "1": a, "2": b }) : []
      }))
      gap = linkGap(sets, { brandHost: host, competitorHosts: comps.map((c) => c.host), brandReferring: new Set(topList.map((t) => t.domain)) })
    } else if (comps.length === 1) notes.push("I need at least 2 competitors to find sites that link to them and not to you.")
  }
  return { at: new Date().toISOString(), month: monthKey(), scope, host, summary, history, mom: monthOverMonth(history), top: topList.slice(0, 20), competitors, gap, costUsd: Math.round(cost * 1e5) / 1e5, calls, notes, source }
}
