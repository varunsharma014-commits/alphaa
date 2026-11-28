// Post stats for Social Studio, the Social thread, the calendar and best-time-to-post.
// LinkedIn company Pages report views, likes, comments, shares and clicks per post
// (organizationalEntityShareStatistics, r_organization_social on the Pages app). Facebook Pages and
// Instagram: lib/social/meta-stats.ts (likes/comments now; reach, views, saves, shares once the owner's
// Meta login has instagram_manage_insights / read_insights). Posts on a personal LinkedIn profile
// aren't readable by apps, so they show no numbers.
// Saved on each post's result (PostResult.stats); the daily cron refreshes posts from the last 30 days.
import { db } from "@/lib/db"
import { dec, listAccounts, savePost } from "./store"
import { rest } from "./providers/linkedin"
import { metaGrants, metaPostStats, snapshotAudience } from "./meta-stats"
import type { PostStats, SocialAccount, SocialPost } from "./types"

const WINDOW_DAYS = 30
const STALE_MS = 6 * 3_600_000

type ShareStats = { share?: string; ugcPost?: string; totalShareStatistics?: { impressionCount?: number; likeCount?: number; commentCount?: number; shareCount?: number; clickCount?: number } }

/** Stats for up to 20 posts of one company Page, keyed by post URN. */
async function linkedinPageStats(acc: SocialAccount, urns: string[]): Promise<Map<string, PostStats>> {
  const out = new Map<string, PostStats>()
  if (!urns.length) return out
  const token = dec(acc.tokenEnc)
  const list = (kind: string) => urns.filter((u) => u.startsWith(`urn:li:${kind}:`)).map(encodeURIComponent).join(",")
  const shares = list("share"), ugc = list("ugcPost")
  const q = `q=organizationalEntity&organizationalEntity=${encodeURIComponent(acc.extra?.author ?? acc.externalId)}${shares ? `&shares=List(${shares})` : ""}${ugc ? `&ugcPosts=List(${ugc})` : ""}`
  const r = await fetch(`https://api.linkedin.com/rest/organizationalEntityShareStatistics?${q}`, { headers: rest(token), signal: AbortSignal.timeout(20_000) })
  if (!r.ok) throw new Error(`LinkedIn stats ${r.status}: ${(await r.text()).slice(0, 160)}`)
  const j = (await r.json()) as { elements?: ShareStats[] }
  const at = new Date().toISOString()
  for (const e of j.elements ?? []) {
    const urn = e.share ?? e.ugcPost
    const t = e.totalShareStatistics
    if (!urn || !t) continue
    out.set(urn, { impressions: t.impressionCount ?? 0, likes: t.likeCount ?? 0, comments: t.commentCount ?? 0, shares: t.shareCount ?? 0, clicks: t.clickCount ?? 0, at })
  }
  return out
}

const inFlight = new Set<string>()

/** Refreshes stats on this brand's recent posts (and today's follower counts). Returns how many results got new numbers. */
export async function refreshPostStats(userId: string, opts: { force?: boolean } = {}): Promise<number> {
  if (inFlight.has(userId)) return 0
  inFlight.add(userId)
  try {
    return await refresh(userId, opts)
  } finally {
    inFlight.delete(userId)
  }
}

async function refresh(userId: string, opts: { force?: boolean }): Promise<number> {
  const all = (await listAccounts(userId)).filter((a) => a.status === "active")
  const li = all.filter((a) => a.platform === "linkedin" && a.extra?.kind === "organization")
  const meta = all.filter((a) => a.platform === "facebook" || a.platform === "instagram")
  if (!li.length && !meta.length) return 0
  if (meta.length) await snapshotAudience(userId, meta).catch(() => 0)
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000)
  const rows = await db.mockActivity.findMany({ where: { userId, type: "social_post", createdAt: { gte: new Date(since.getTime() - 14 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 100 })
  const posts: SocialPost[] = rows
    .map((r) => ({ ...(r.metadata as Omit<SocialPost, "id">), id: r.id }))
    .filter((p) => (p.status === "published" || p.status === "partial") && p.publishedAt && Date.parse(p.publishedAt) >= since.getTime())
  const due = (acc: SocialAccount) => posts.flatMap((p) => (p.results ?? []).filter((r) => r.ok && r.accountId === acc.id && r.externalId && (opts.force || !r.stats || Date.now() - Date.parse(r.stats.at) > STALE_MS)).map((r) => ({ p, r })))
  let updated = 0
  for (const acc of li) {
    const mine = due(acc)
    for (let i = 0; i < mine.length; i += 20) {
      const chunk = mine.slice(i, i + 20)
      let stats: Map<string, PostStats>
      try {
        stats = await linkedinPageStats(acc, chunk.map((x) => x.r.externalId!))
      } catch (err) {
        console.warn("[social-stats]", acc.id, err instanceof Error ? err.message : err)
        break
      }
      const touched = new Set<SocialPost>()
      for (const { p, r } of chunk) {
        const s = stats.get(r.externalId!)
        if (s) { r.stats = s; touched.add(p); updated++ }
      }
      for (const p of touched) await savePost(userId, p)
    }
  }
  if (meta.length) {
    const g = await metaGrants(userId, all).catch(() => null)
    for (const acc of meta) {
      let insights = acc.platform === "instagram" ? !!g?.igInsights : !!g?.fbInsights
      const touched = new Set<SocialPost>()
      // At most 40 posts per account per run, one at a time (Meta's per-app rate limit is per hour).
      for (const { p, r } of due(acc).slice(0, 40)) {
        const res = await metaPostStats(acc, r.externalId!, insights)
        // A permission error on insights: the token lost the grant; stop asking this run.
        if (res.denied) insights = false
        if (res.stats) { r.stats = res.stats; touched.add(p); updated++ }
      }
      for (const p of touched) await savePost(userId, p)
    }
  }
  return updated
}

/** "1,204 reach · 18 likes · 3 comments · 4 saves" (only the numbers the platform gave). */
export function statsLine(s?: PostStats, platform?: string): string | null {
  if (!s) return null
  const n = (x: number, one: string, many: string) => `${x.toLocaleString("en-US")} ${x === 1 ? one : many}`
  const views = s.views ?? s.impressions
  return [
    s.reach != null ? n(s.reach, "reached", "reached") : null,
    views != null ? n(views, "view", "views") : null,
    n(s.likes, platform === "facebook" ? "reaction" : "like", platform === "facebook" ? "reactions" : "likes"),
    n(s.comments, "comment", "comments"),
    s.shares ? n(s.shares, platform === "linkedin" ? "repost" : "share", platform === "linkedin" ? "reposts" : "shares") : null,
    s.saves ? n(s.saves, "save", "saves") : null,
    s.clicks ? n(s.clicks, "click", "clicks") : null,
  ].filter(Boolean).join(" · ")
}

/** Engagements and the audience they came from, for best-time-to-post (null without a base to divide by). */
export function engagementOf(s: PostStats, followers?: number | null): { base: number; engagements: number } | null {
  const base = s.reach ?? s.views ?? s.impressions ?? (followers && followers > 0 ? followers : null)
  if (!base) return null
  return { base, engagements: (s.likes ?? 0) + (s.comments ?? 0) + (s.shares ?? 0) + (s.saves ?? 0) + (s.clicks ?? 0) }
}
