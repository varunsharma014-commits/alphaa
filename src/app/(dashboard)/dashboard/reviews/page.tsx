export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { pageTitle } from "@/lib/page-title"
import { savedReviewDraft } from "@/lib/approvals"
import { ReviewsView } from "@/components/workspace/ReviewsView"
import { SyncReviewsButton } from "./SyncReviewsButton"

export const metadata = { title: pageTitle("Reviews") }

export default async function ReviewsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { integration: true, gmbReviews: { orderBy: { publishedAt: "desc" } } },
  })
  if (!user) redirect("/login")

  const connected = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)
  const canReply = hasPro(user)
  // The replies I already wrote overnight (review-drafts cron), shown inline so posting is one tap.
  const drafts = new Map<string, string | null>()
  if (connected && canReply) {
    await Promise.all(user.gmbReviews.filter((r) => !r.reply).slice(0, 30).map(async (r) => drafts.set(r.id, await savedReviewDraft(user.id, r.id).catch(() => null))))
  }

  return (
    <ReviewsView
      action={connected ? <SyncReviewsButton /> : undefined}
      data={{
        connected,
        canReply,
        location: user.integration?.gmbLocationName ?? null,
        reviews: user.gmbReviews.map((r) => ({
          id: r.id,
          author: r.authorName,
          rating: r.rating,
          comment: r.comment,
          at: (r.publishedAt ?? r.createdAt).toISOString(),
          reply: r.reply,
          draft: drafts.get(r.id) ?? null,
        })),
      }}
    />
  )
}
