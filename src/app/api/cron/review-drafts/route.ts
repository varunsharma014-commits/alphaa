export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { approveReviewReply, draftReviewReply, REVIEW_DRAFT } from "@/lib/approvals"
import { getAgentSettings } from "@/lib/agent/settings"
import { asUser } from "@/lib/usage"
import { containsPlaceholders } from "@/lib/gbp-poster"

// Overnight: write a reply for every new Google review that doesn't have one,
// so the briefing shows the finished reply and approving it is one tap.
// Nothing is posted here unless the owner chose "post replies without asking" (autopilot.reviews:
// "positive" = 4-5 stars only, "all" = every reply). Reviews sync daily at 05:00 UTC (seo-sync); this
// runs at 06:00. At most 5 drafts per account per night.

const PER_USER = 5

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const since = new Date(Date.now() - 60 * 86_400_000)
  const reviews = await db.gmbReview.findMany({
    where: { reply: null, publishedAt: { gte: since }, user: { integration: { gmbLocationId: { not: null } } } },
    orderBy: { publishedAt: "desc" },
    select: { id: true, userId: true, rating: true },
    take: 500,
  })
  const drafted = await db.mockActivity.findMany({ where: { type: REVIEW_DRAFT, userId: { in: [...new Set(reviews.map((r) => r.userId))] } }, select: { metadata: true } })
  const have = new Set(drafted.map((d) => (d.metadata as { reviewId?: string } | null)?.reviewId).filter(Boolean))

  const perUser = new Map<string, number>()
  const mode = new Map<string, string>()
  let written = 0
  let posted = 0
  const errors: string[] = []
  for (const r of reviews) {
    asUser(r.userId)
    if (have.has(r.id) || (perUser.get(r.userId) ?? 0) >= PER_USER) continue
    try {
      const text = await draftReviewReply(r.userId, r.id)
      if (text) {
        written++
        perUser.set(r.userId, (perUser.get(r.userId) ?? 0) + 1)
        if (!mode.has(r.userId)) mode.set(r.userId, (await getAgentSettings(r.userId)).autopilot?.reviews ?? "ask")
        const m = mode.get(r.userId)
        if ((m === "all" || (m === "positive" && r.rating >= 4)) && !containsPlaceholders(text)) {
          const res = await approveReviewReply(r.userId, r.id, text)
          if (res.ok) posted++
          else errors.push(`${r.id}: auto-post ${res.error}`)
        }
      }
    } catch (err) {
      errors.push(`${r.id}: ${err instanceof Error ? err.message : err}`)
    }
  }
  return NextResponse.json({ candidates: reviews.length, written, posted, errors })
}
