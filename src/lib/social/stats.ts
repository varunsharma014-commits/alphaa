// Post stats for the Social thread. LinkedIn company Pages report views, likes, comments, shares
// and clicks per post (organizationalEntityShareStatistics, r_organization_social on the Pages
// app). Posts on a personal profile aren't readable by apps, so they show no numbers.
// Saved on each post's result (PostResult.stats); the daily cron refreshes posts from the last 30 days.
import { db } from "@/lib/db"
import { dec, listAccounts, savePost } from "./store"
import { rest } from "./providers/linkedin"
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

/** Refreshes stats on this brand's recent posts. Returns how many results got new numbers. */
export async function refreshPostStats(userId: string, opts: { force?: boolean } = {}): Promise<number> {
  const accounts = (await listAccounts(userId)).filter((a) => a.platform === "linkedin" && a.extra?.kind === "organization" && a.status === "active")
  if (!accounts.length) return 0
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000)
  const rows = await db.mockActivity.findMany({ where: { userId, type: "social_post", createdAt: { gte: new Date(since.getTime() - 14 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 100 })
  const posts: SocialPost[] = rows
    .map((r) => ({ ...(r.metadata as Omit<SocialPost, "id">), id: r.id }))
    .filter((p) => (p.status === "published" || p.status === "partial") && p.publishedAt && Date.parse(p.publishedAt) >= since.getTime())
  let updated = 0
  for (const acc of accounts) {
    const mine = posts.flatMap((p) => (p.results ?? []).filter((r) => r.ok && r.accountId === acc.id && r.externalId && (opts.force || !r.stats || Date.now() - Date.parse(r.stats.at) > STALE_MS)).map((r) => ({ p, r })))
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
  return updated
}

/** "1,204 views · 18 likes · 3 comments" (only the numbers the platform gave). */
export function statsLine(s?: PostStats): string | null {
  if (!s) return null
  const n = (x: number, one: string, many: string) => `${x.toLocaleString("en-US")} ${x === 1 ? one : many}`
  return [s.impressions != null ? n(s.impressions, "view", "views") : null, n(s.likes, "like", "likes"), n(s.comments, "comment", "comments"), s.shares ? n(s.shares, "repost", "reposts") : null, s.clicks ? n(s.clicks, "click", "clicks") : null].filter(Boolean).join(" · ")
}
