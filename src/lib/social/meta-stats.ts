// The owner's OWN Facebook Page and Instagram numbers, for posts Alphaa published for them:
//
//   Instagram  like_count / comments_count on the media (instagram_basic, round 1) and, once the
//              token has instagram_manage_insights (round 2), media insights: reach, views, saved,
//              shares, total_interactions (GET /{ig-media-id}/insights). Valid for FEED and REELS
//              in v27.0; `impressions`/`plays`/`video_views` are deprecated, never requested.
//   Facebook   reactions / comments / shares on the Page post (pages_read_engagement, round 1) and,
//              once the token has read_insights, post_media_view (views), post_total_media_view_unique
//              (people reached) and post_clicks. post_impressions* were removed on 2025-11-15.
//   Followers  /{ig-user-id}?fields=followers_count and /{page-id}?fields=followers_count, one
//              snapshot per account per day (MockActivity `social_audience`), for follower growth.
//
// Granted permissions come from debug_token on the brand's business token (lib/social/meta-insights
// grantedScopes, cached 6h). A call that answers with a permission error also counts as "not granted".
// Saved on PostResult.stats like LinkedIn (lib/social/stats.ts). Nothing here throws.
import { db } from "@/lib/db"
import { dec, listAccounts } from "./store"
import type { PostStats, SocialAccount } from "./types"

const G = "https://graph.facebook.com/v27.0"
const DAY = 86_400_000
export const AUDIENCE = "social_audience"

export const IG_INSIGHT_SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_read_engagement"]
export const FB_INSIGHT_SCOPES = ["read_insights", "pages_read_engagement"]
/** Media insights metrics we ask for. All valid for FEED (image, carousel album) and REELS in v27.0. */
export const IG_METRICS = ["reach", "views", "likes", "comments", "shares", "saved", "total_interactions"]
export const IG_CORE = ["reach", "likes", "comments", "shares", "saved"]
/** Page post insights metrics (lifetime). */
export const FB_METRICS = ["post_media_view", "post_total_media_view_unique", "post_clicks"]

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : null)

// ── Pure parsers (scripts/test-meta-insights.ts) ────────────────────────────────────────────────

/** { data: [{ name, values: [{ value }] } | { name, total_value: { value } }] } → name → number. */
export function insightValues(j: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  const list = isObj(j) && Array.isArray(j.data) ? j.data : []
  for (const m of list) {
    if (!isObj(m) || typeof m.name !== "string") continue
    const tv = isObj(m.total_value) ? num(m.total_value.value) : null
    const vals = Array.isArray(m.values) ? m.values : []
    const last = vals.length && isObj(vals[vals.length - 1]) ? (vals[vals.length - 1] as Record<string, unknown>).value : undefined
    // post_clicks can come back as a number or (older answers) an object by type: add them up.
    const v = tv ?? num(last) ?? (isObj(last) ? Object.values(last).reduce<number>((a, x) => a + (num(x) ?? 0), 0) : null)
    if (v != null) out[m.name] = v
  }
  return out
}

/** Instagram: the media's own counts (+ insights when we have them). */
export function igStats(fields: unknown, insights: unknown | null, at = new Date().toISOString()): PostStats | null {
  const f = isObj(fields) ? fields : {}
  const i = insights ? insightValues(insights) : {}
  const likes = i.likes ?? num(f.like_count)
  const comments = i.comments ?? num(f.comments_count)
  if (likes == null && comments == null && !Object.keys(i).length) return null
  const s: PostStats = { likes: likes ?? 0, comments: comments ?? 0, at, level: insights && Object.keys(i).length ? "full" : "basic" }
  if (i.reach != null) s.reach = i.reach
  if (i.views != null) s.views = i.views
  if (i.shares != null) s.shares = i.shares
  if (i.saved != null) s.saves = i.saved
  return s
}

/** Facebook: the Page post's reactions / comments / shares (+ views, reach and clicks with read_insights). */
export function fbStats(fields: unknown, insights: unknown | null, at = new Date().toISOString()): PostStats | null {
  if (!isObj(fields)) return null
  const total = (k: string) => { const x = fields[k]; return isObj(x) && isObj(x.summary) ? num(x.summary.total_count) : null }
  const likes = total("reactions"), comments = total("comments")
  const shares = isObj(fields.shares) ? num(fields.shares.count) : null
  const i = insights ? insightValues(insights) : {}
  if (likes == null && comments == null && shares == null && !Object.keys(i).length) return null
  const s: PostStats = { likes: likes ?? 0, comments: comments ?? 0, shares: shares ?? 0, at, level: Object.keys(i).length ? "full" : "basic" }
  if (i.post_media_view != null) s.views = i.post_media_view
  if (i.post_total_media_view_unique != null) s.reach = i.post_total_media_view_unique
  if (i.post_clicks != null) s.clicks = i.post_clicks
  return s
}

/** A Graph error that means "this token lacks a permission" (codes 10, 200-299, or #10/#200 text). */
export function isPermissionError(j: unknown): boolean {
  const e = isObj(j) && isObj(j.error) ? j.error : null
  if (!e) return false
  const code = num(e.code)
  return code === 10 || (code != null && code >= 200 && code < 300) || /permission|not authorized|\(#10\)|\(#200\)/i.test(String(e.message ?? ""))
}

export type AudiencePoint = { d: string; n: number }
/** Adds today's count (one point per UTC day, the newest count of the day wins), keeps 400 days. */
export function addPoint(points: AudiencePoint[], n: number, now = Date.now()): AudiencePoint[] {
  const d = new Date(now).toISOString().slice(0, 10)
  return [...points.filter((p) => p.d !== d), { d, n }].sort((a, b) => a.d.localeCompare(b.d)).slice(-400)
}

/** Followers now and the change over `days` (null when no point is that old yet: growth needs history). */
export function growth(points: AudiencePoint[], days = 30, now = Date.now()): { now: number | null; change: number | null; since: string | null } {
  if (!points.length) return { now: null, change: null, since: null }
  const last = points[points.length - 1]
  const cutoff = new Date(now - days * DAY).toISOString().slice(0, 10)
  // The newest point on or before the cutoff; allow 5 days of slack so a missed day still compares.
  const before = [...points].reverse().find((p) => p.d <= cutoff && p.d >= new Date(now - (days + 5) * DAY).toISOString().slice(0, 10))
  if (before) return { now: last.n, change: last.n - before.n, since: before.d }
  const first = points[0]
  return { now: last.n, change: points.length > 1 && first.d !== last.d ? last.n - first.n : null, since: points.length > 1 ? first.d : null }
}

// ── Graph calls ─────────────────────────────────────────────────────────────────────────────────

type Answer = { ok: true; j: unknown } | { ok: false; denied: boolean }
async function get(path: string, params: Record<string, string>, token: string): Promise<Answer> {
  try {
    const r = await fetch(`${G}${path}?${new URLSearchParams({ ...params, access_token: token })}`, { signal: AbortSignal.timeout(15_000) })
    const j = (await r.json().catch(() => null)) as unknown
    if (r.ok && isObj(j) && !j.error) return { ok: true, j }
    // Never log the URL: it carries the token.
    const e = isObj(j) && isObj(j.error) ? j.error : {}
    console.warn(`[meta-stats] ${path.replace(/\/\d[\d_]*/g, "/:id")} ${r.status} ${String(e.code ?? "")} ${String(e.message ?? "").slice(0, 120)}`)
    return { ok: false, denied: isPermissionError(j) }
  } catch (err) {
    console.warn("[meta-stats]", err instanceof Error ? err.message : "failed")
    return { ok: false, denied: false }
  }
}

export type MetaGrants = {
  /** Meta accounts connected for this brand. */
  facebook: boolean
  instagram: boolean
  scopes: string[]
  /** Instagram reach / saves / shares (instagram_manage_insights). */
  igInsights: boolean
  /** Facebook Page views / reach / clicks (read_insights). */
  fbInsights: boolean
  /** The permissions the owner would add by reconnecting (empty = nothing missing). */
  missing: string[]
  /** The Login for Business configuration already asks for them (env META_INSIGHTS_IN_LOGIN=1), so reconnecting helps. */
  canAsk: boolean
}

/** What the brand's Meta login allows for stats (debug_token, cached 6h in meta-insights). */
export async function metaGrants(userId: string, accounts?: SocialAccount[]): Promise<MetaGrants> {
  const accs = (accounts ?? (await listAccounts(userId).catch(() => []))).filter((a) => (a.platform === "facebook" || a.platform === "instagram") && a.status === "active")
  const facebook = accs.some((a) => a.platform === "facebook"), instagram = accs.some((a) => a.platform === "instagram")
  let scopes: string[] = []
  if (accs.length) {
    try {
      const { grantedScopes } = await import("./meta-insights")
      let token = dec(accs[0].tokenEnc)
      try {
        const { getAccess, decToken } = await import("@/lib/metaads/store")
        const a = await getAccess(userId)
        if (a && a.status === "active") token = decToken(a)
      } catch { /* the Page token it is */ }
      scopes = await grantedScopes(token)
    } catch { scopes = [] }
  }
  const has = (need: string[]) => need.every((s) => scopes.includes(s))
  const igInsights = instagram && has(IG_INSIGHT_SCOPES)
  const fbInsights = facebook && has(FB_INSIGHT_SCOPES)
  const missing = [
    ...(instagram && !igInsights ? IG_INSIGHT_SCOPES.filter((s) => !scopes.includes(s)) : []),
    ...(facebook && !fbInsights ? FB_INSIGHT_SCOPES.filter((s) => !scopes.includes(s)) : []),
  ].filter((s, i, a) => a.indexOf(s) === i)
  return { facebook, instagram, scopes, igInsights, fbInsights, missing, canAsk: process.env.META_INSIGHTS_IN_LOGIN === "1" }
}

/** Stats for one published post. `insights` false = only the round-1 counts are asked for. */
export async function metaPostStats(acc: SocialAccount, externalId: string, insights: boolean): Promise<{ stats: PostStats | null; denied: boolean }> {
  const token = dec(acc.tokenEnc)
  if (acc.platform === "instagram") {
    const f = await get(`/${externalId}`, { fields: "like_count,comments_count,media_type,media_product_type" }, token)
    if (!f.ok) return { stats: null, denied: f.denied }
    const type = isObj(f.j) ? String(f.j.media_product_type ?? "") : ""
    // Stories expire after 24h and have different metrics; Alphaa posts FEED images and REELS only.
    let ins: Answer | null = null
    if (insights && type !== "STORY") {
      ins = await get(`/${externalId}/insights`, { metric: IG_METRICS.join(",") }, token)
      // One metric Meta doesn't offer for this media fails the whole call: retry with the core ones.
      if (!ins.ok && !ins.denied) ins = await get(`/${externalId}/insights`, { metric: IG_CORE.join(",") }, token)
    }
    return { stats: igStats(f.j, ins?.ok ? ins.j : null), denied: !!ins && !ins.ok && ins.denied }
  }
  // Facebook photo posts are "<page>_<post>"; a bare id is a video, which has its own metrics: skipped.
  if (!externalId.includes("_")) return { stats: null, denied: false }
  const f = await get(`/${externalId}`, { fields: "shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)" }, token)
  if (!f.ok) return { stats: null, denied: f.denied }
  const ins = insights ? await get(`/${externalId}/insights`, { metric: FB_METRICS.join(",") }, token) : null
  return { stats: fbStats(f.j, ins?.ok ? ins.j : null), denied: !!ins && !ins.ok && ins.denied }
}

// ── Follower snapshots ──────────────────────────────────────────────────────────────────────────

type AudienceRow = { accountId: string; platform: "facebook" | "instagram"; points: AudiencePoint[] }

/** Today's follower count for every connected Facebook Page and Instagram account (once a day each). */
export async function snapshotAudience(userId: string, accounts?: SocialAccount[]): Promise<number> {
  const accs = (accounts ?? (await listAccounts(userId).catch(() => []))).filter((a) => (a.platform === "facebook" || a.platform === "instagram") && a.status === "active")
  if (!accs.length) return 0
  const rows = await db.mockActivity.findMany({ where: { userId, type: AUDIENCE } })
  const today = new Date().toISOString().slice(0, 10)
  let saved = 0
  for (const a of accs) {
    const row = rows.find((r) => (r.metadata as AudienceRow | null)?.accountId === a.id)
    const cur = (row?.metadata as AudienceRow | null)?.points ?? []
    if (cur.some((p) => p.d === today)) continue
    const r = await get(`/${a.externalId}`, { fields: "followers_count" }, dec(a.tokenEnc))
    const n = r.ok && isObj(r.j) ? num(r.j.followers_count) : null
    if (n == null) continue
    const meta: AudienceRow = { accountId: a.id, platform: a.platform as AudienceRow["platform"], points: addPoint(cur, n) }
    if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: meta as object } })
    else await db.mockActivity.create({ data: { userId, type: AUDIENCE, title: `Followers: ${a.name}`, metadata: meta as object } })
    saved++
  }
  return saved
}

export type Audience = { accountId: string; platform: "facebook" | "instagram"; name: string; followers: number | null; change: number | null; since: string | null; points: AudiencePoint[] }

/** Stored follower history for the brand's Meta accounts (no outside call). */
export async function audienceOf(userId: string, accounts?: SocialAccount[]): Promise<Audience[]> {
  const accs = (accounts ?? (await listAccounts(userId).catch(() => []))).filter((a) => a.platform === "facebook" || a.platform === "instagram")
  if (!accs.length) return []
  const rows = await db.mockActivity.findMany({ where: { userId, type: AUDIENCE } })
  const out: Audience[] = []
  for (const a of accs) {
    const m = rows.map((r) => r.metadata as AudienceRow | null).find((x) => x?.accountId === a.id)
    if (!m?.points?.length) continue
    const g = growth(m.points)
    out.push({ accountId: a.id, platform: m.platform, name: a.name, followers: g.now, change: g.change, since: g.since, points: m.points.slice(-90) })
  }
  return out
}
