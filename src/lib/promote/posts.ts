// The owner's published organic posts that can be promoted as ads. Ranked only by real stats:
// LinkedIn company Page posts carry views/likes/comments/reposts/clicks (PostResult.stats, from
// lib/social/stats.ts). Facebook and Instagram don't give us post stats yet, so those are listed
// newest first and labelled "Recent posts", never ranked. Pure ranking below is tested.
import { db } from "@/lib/db"
import { listAccounts } from "@/lib/social/store"
import { imageUrl } from "@/lib/images"
import type { PostStats, SocialPost } from "@/lib/social/types"

export type PromoPlatform = "facebook" | "instagram" | "linkedin"
export type PostPick = {
  socialPostId: string
  platform: PromoPlatform
  accountId: string
  accountName: string
  /** Facebook "<pageId>_<postId>", Instagram media id, LinkedIn share/ugcPost URN. */
  externalId: string
  url: string | null
  text: string
  image: string | null
  publishedAt: string
  stats: PostStats | null
  /** Engagement per view, in percent (LinkedIn Page posts with enough views only). */
  rate: number | null
}

export { engagementRate, splitPicks, MIN_VIEWS_TO_RANK } from "./rank"
import { engagementRate } from "./rank"

const DAYS = 90

/** Every successfully published post result from the last 90 days on a platform we can promote. */
export async function promotablePosts(userId: string): Promise<PostPick[]> {
  const [rows, accounts] = await Promise.all([
    db.mockActivity.findMany({ where: { userId, type: "social_post", createdAt: { gte: new Date(Date.now() - (DAYS + 30) * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 150 }),
    listAccounts(userId),
  ])
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const out: PostPick[] = []
  for (const r of rows) {
    const p = { ...(r.metadata as Omit<SocialPost, "id">), id: r.id }
    if (!(p.status === "published" || p.status === "partial") || !p.publishedAt || Date.now() - Date.parse(p.publishedAt) > DAYS * 86_400_000) continue
    for (const res of p.results ?? []) {
      if (!res.ok || !res.externalId) continue
      const acc = byId.get(res.accountId)
      if (!acc) continue
      if (res.platform !== "facebook" && res.platform !== "instagram" && res.platform !== "linkedin") continue
      // LinkedIn: only company Page posts can be Sponsored Content.
      if (res.platform === "linkedin" && acc.extra?.kind !== "organization") continue
      out.push({
        socialPostId: p.id, platform: res.platform, accountId: acc.id, accountName: acc.name, externalId: res.externalId, url: res.url ?? null,
        text: p.text.slice(0, 400), image: p.imageId ? imageUrl(p.imageId) : null, publishedAt: p.publishedAt,
        stats: res.stats ?? null, rate: res.platform === "linkedin" ? engagementRate(res.stats) : null,
      })
    }
  }
  return out
}
