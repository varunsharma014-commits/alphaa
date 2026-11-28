// Pure ranking of promotable posts (tested): only real stats rank a post.
import type { PostStats } from "@/lib/social/types"
import type { PostPick } from "./posts"

/** A post needs this many views (or people reached) before its stats rank it. */
export const MIN_VIEWS_TO_RANK = 100

/** Pure: (likes + comments + shares + saves + clicks) ÷ reach (else views), %, or null under the minimum.
 * Instagram/Facebook posts only have a base once Meta shares reach (instagram_manage_insights / read_insights). */
export function engagementRate(s: PostStats | null | undefined): number | null {
  const base = s ? s.reach ?? s.views ?? s.impressions : null
  if (!s || base == null || base < MIN_VIEWS_TO_RANK) return null
  const acts = s.likes + s.comments + (s.shares ?? 0) + (s.saves ?? 0) + (s.clicks ?? 0)
  return Math.round((acts / base) * 10000) / 100
}

/** Pure: ranked (by real stats) and recent (no stats: newest first, not ranked). */
export function splitPicks(picks: PostPick[]): { ranked: PostPick[]; recent: PostPick[] } {
  const ranked = picks.filter((p) => p.rate !== null).sort((a, b) => b.rate! - a.rate! || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  const recent = picks.filter((p) => p.rate === null).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return { ranked: ranked.slice(0, 6), recent: recent.slice(0, 6) }
}

