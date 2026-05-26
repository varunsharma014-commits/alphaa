export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { Star, MessageSquare } from "lucide-react"
import { GenerateReplyButton } from "./GenerateReplyButton"
import { SyncReviewsButton } from "./SyncReviewsButton"
import Link from "next/link"

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-sm">
      {"⭐".repeat(rating)}
      {"☆".repeat(Math.max(0, 5 - rating))}
    </span>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export default async function ReviewsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: {
      integration: true,
      gmbReviews: { orderBy: { publishedAt: "desc" } },
    },
  })

  const integration = user?.integration
  const hasGmb = !!(integration?.gmbAccountId && integration?.gmbLocationId)
  const reviews = user?.gmbReviews ?? []

  // Stats
  const totalReviews = reviews.length
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
      : 0
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length
  const lowStarCount = reviews.filter((r) => r.rating <= 2).length

  if (!hasGmb) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Reviews</h1>
          <p className="text-muted text-sm mt-1">
            Manage and respond to your Google Business Profile reviews
          </p>
        </div>

        <GlassCard className="flex flex-col items-center text-center py-12 gap-5">
          <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
            <Star className="w-6 h-6 text-muted" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-white font-semibold text-lg">
              Connect your Google account to see reviews
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Once your Google Business Profile is connected, Alphaa will pull
              your reviews here and help you respond professionally with AI.
            </p>
          </div>
          <Link
            href="/dashboard/settings/integrations"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white font-semibold text-sm transition-colors"
          >
            Connect Google Account
          </Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">Reviews</h1>
          <p className="text-muted text-sm mt-1">
            Your Google Business Profile reviews
            {integration.gmbLocationName && (
              <span className="ml-1 text-white/40">· {integration.gmbLocationName}</span>
            )}
          </p>
        </div>
        <SyncReviewsButton />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <MessageSquare className="w-4 h-4 text-muted" />
          <p className="text-white text-xl font-semibold font-mono">{totalReviews}</p>
          <p className="text-muted text-xs">Total Reviews</p>
        </div>
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <Star className="w-4 h-4 text-muted" />
          <p className="text-white text-xl font-semibold font-mono">
            {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-muted text-xs">
            Avg Rating{" "}
            {totalReviews > 0 && (
              <span>{"⭐".repeat(Math.round(avgRating))}</span>
            )}
          </p>
        </div>
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <span className="text-sm">⭐</span>
          <p className="text-white text-xl font-semibold font-mono">{fiveStarCount}</p>
          <p className="text-muted text-xs">5-Star Reviews</p>
        </div>
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <span className="text-sm">⚠️</span>
          <p className="text-white text-xl font-semibold font-mono">{lowStarCount}</p>
          <p className="text-muted text-xs">1-2 Star Reviews</p>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <GlassCard className="flex flex-col items-center text-center py-12 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-muted" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h2 className="text-white font-semibold">No reviews synced yet</h2>
            <p className="text-muted text-sm">
              Click "Sync Reviews" above to pull your latest Google Business
              Profile reviews.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <GlassCard key={review.id} className="p-5 space-y-3">
              {/* Author + rating row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-medium text-sm">{review.authorName}</p>
                  <StarRating rating={review.rating} />
                </div>
                <span className="text-muted text-xs whitespace-nowrap">
                  {formatDate(review.publishedAt)}
                </span>
              </div>

              {/* Comment */}
              {review.comment && (
                <blockquote className="text-white/70 text-sm italic leading-relaxed border-l-2 border-white/10 pl-3">
                  &ldquo;{review.comment}&rdquo;
                </blockquote>
              )}

              {/* Reply */}
              {review.reply ? (
                <div className="bg-bg-tertiary rounded-xl p-3 space-y-1">
                  <p className="text-muted text-xs font-medium uppercase tracking-wider">
                    Reply from owner
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed">{review.reply}</p>
                </div>
              ) : (
                <div className="pt-1">
                  <GenerateReplyButton reviewId={review.id} />
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
