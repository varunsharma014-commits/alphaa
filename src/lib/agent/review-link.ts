import { db } from "@/lib/db"
import { getReviewLink } from "@/lib/gmb"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"

/** The owner's Google "write a review" link: remembered, else asked of Google once. */
export async function reviewLinkFor(userId: string): Promise<string | null> {
  const s = await getAgentSettings(userId)
  if (s.reviewLink) return s.reviewLink
  const integ = await db.integration.findUnique({ where: { userId } })
  if (!integ?.gmbLocationId) return null
  const link = await getReviewLink(integ)
  if (link) await saveAgentSettings(userId, { reviewLink: link })
  return link
}
