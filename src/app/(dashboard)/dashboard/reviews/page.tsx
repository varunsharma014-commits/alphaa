export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
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

  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => r.rating === n).length,
  }))
  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1)

  if (!hasGmb) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-white font-semibold text-2xl">Reviews</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage and respond to your Google Business Profile reviews
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.12] via-transparent to-transparent p-8">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-5 py-6">
            <span className="text-6xl">⭐</span>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-white font-semibold text-xl">
                Connect Google to see your reviews
              </h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Once your Google Business Profile is connected, Alphaa pulls your
                reviews here and helps you respond professionally with AI.
              </p>
            </div>
            <Link
              href="/dashboard/settings/integrations"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B1A] hover:bg-[#e85c00] text-white font-semibold text-sm transition-colors"
            >
              Connect Google Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.12] via-transparent to-transparent p-6 md:p-8">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
        <div className="relative">
          {/* Top row: title + sync button */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-white font-semibold text-2xl">Reviews</h1>
              <p className="text-white/50 text-sm mt-0.5">
                Your Google Business Profile reviews
                {integration.gmbLocationName && (
                  <span className="ml-1 text-white/30">· {integration.gmbLocationName}</span>
                )}
              </p>
            </div>
            <SyncReviewsButton />
          </div>

          {/* Stats + distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            {/* Left: average + total */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-7xl font-bold font-mono text-white leading-none">
                  {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
                </p>
                <div className="mt-2">
                  <StarRating rating={Math.round(avgRating)} />
                </div>
                <p className="text-white/40 text-xs mt-1">Average rating</p>
              </div>
              <div className="pl-6 border-l border-white/[0.08]">
                <p className="text-4xl font-bold font-mono text-white">{totalReviews}</p>
                <p className="text-white/40 text-xs mt-1">reviews monitored</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium">
                    {reviews.filter((r) => !r.reply).length} need replies
                  </span>
                </div>
              </div>
            </div>

            {/* Right: rating distribution bars */}
            <div className="space-y-2">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-4 text-right">{star}</span>
                  <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${totalReviews > 0 ? (count / maxCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.08] via-transparent to-transparent p-8">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-4 py-8">
            <span className="text-5xl">⭐</span>
            <div className="space-y-1.5 max-w-xs">
              <h2 className="text-white font-semibold text-lg">No reviews synced yet</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Click &ldquo;Sync Reviews&rdquo; above to pull your latest Google Business
                Profile reviews.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
            >
              {/* Top row: avatar + name + date */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FF6B1A]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF6B1A] text-xs font-bold">
                      {getInitials(review.authorName)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm leading-tight">
                      {review.authorName}
                    </p>
                    <div className="mt-0.5">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                </div>
                <span className="text-white/30 text-xs whitespace-nowrap">
                  {review.publishedAt ? formatDate(review.publishedAt) : formatDate(review.createdAt)}
                </span>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-white/70 text-sm leading-relaxed mt-3">
                  {review.comment}
                </p>
              )}

              {/* Reply */}
              {review.reply ? (
                <div className="ml-4 mt-3 pl-4 border-l-2 border-[#FF6B1A]/30 bg-[#FF6B1A]/[0.05] rounded-r-xl p-3">
                  <p className="text-[#FF6B1A] text-xs font-medium mb-1">Our response</p>
                  <p className="text-white/70 text-sm leading-relaxed">{review.reply}</p>
                </div>
              ) : (
                <div className="pt-3 mt-3 border-t border-white/[0.06]">
                  <GenerateReplyButton reviewId={review.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
