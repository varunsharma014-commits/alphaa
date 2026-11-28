// Pure ranking of promotable posts (tested): only real stats rank a post.
import type { PostStats } from "@/lib/social/types"
import type { PostPick } from "./posts"

/** A post needs this many views before its stats rank it. */
export const MIN_VIEWS_TO_RANK = 100

/** Pure: (likes + comments + reposts + clicks) ÷ views, %, or null under the minimum. */
export function engagementRate(s: PostStats | null | undefined): number | null {
  if (!s || s.impressions == null || s.impressions < MIN_VIEWS_TO_RANK) return null
  const acts = s.likes + s.comments + (s.shares ?? 0) + (s.clicks ?? 0)
  return Math.round((acts / s.impressions) * 10000) / 100
}

/** Pure: ranked (by real stats) and recent (no stats: newest first, not ranked). */
export function splitPicks(picks: PostPick[]): { ranked: PostPick[]; recent: PostPick[] } {
  const ranked = picks.filter((p) => p.rate !== null).sort((a, b) => b.rate! - a.rate! || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const recent = picks.filter((p) => p.rate === null).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return { ranked: ranked.slice(0, 6), recent: recent.slice(0, 6) }
}

