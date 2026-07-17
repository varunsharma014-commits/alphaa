export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Star, Globe } from "lucide-react"
import { GenerateReplyButton } from "./GenerateReplyButton"
import { SyncReviewsButton } from "./SyncReviewsButton"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { DsCard } from "@/components/dashboard/DsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import Link from "next/link"

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          color={n <= rating ? "var(--ds-warn)" : "var(--ds-border-3)"}
          fill={n <= rating ? "var(--ds-warn)" : "none"}
        />
      ))}
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
  const repliedCount = reviews.filter((r) => r.reply).length

  // New this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const newThisWeek = reviews.filter((r) => {
    const d = r.publishedAt ?? r.createdAt
    return d ? new Date(d) >= weekAgo : false
  }).length

  // Split: needs a reply first, answered after
  const needsReply = reviews.filter((r) => !r.reply)
  const answered = reviews.filter((r) => r.reply)

  if (!hasGmb) {
    return (
      <div className="max-w-3xl mx-auto">
        <AutopilotBar message="alphaa monitors new reviews daily and drafts replies for you" />

        <div className="mb-6">
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>
            Customer reviews
          </h1>
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "4px", lineHeight: 1.6 }}>
            alphaa monitors your Google reviews daily and drafts professional replies — you just approve.
          </p>
        </div>

        <DsCard>
          <EmptyState
            icon={Globe}
            title="Connect Google to see your reviews"
            body="Once connected, alphaa pulls in every review, tracks your rating over time, and writes reply drafts so you never leave a review unanswered."
          >
            <Link
              href="/dashboard/settings/integrations"
              style={{
                background: "var(--ds-accent)",
                color: "var(--ds-text)",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 500,
                display: "inline-block",
                marginTop: "4px",
              }}
            >
              Connect Google Account →
            </Link>
          </EmptyState>
        </DsCard>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <AutopilotBar message="alphaa monitors new reviews daily and drafts replies for you" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>
            Customer reviews
          </h1>
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "4px", lineHeight: 1.6 }}>
            alphaa monitors your Google reviews daily and drafts professional replies — you just approve.
            {integration.gmbLocationName && (
              <span style={{ color: "var(--ds-text-faint)" }}> · {integration.gmbLocationName}</span>
            )}
          </p>
        </div>
        <SyncReviewsButton />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        <StatBox
          value={totalReviews > 0 ? avgRating.toFixed(1) : "—"}
          label="Average rating"
          tone="warning"
        />
        <StatBox value={totalReviews} label="Total reviews" tone="default" />
        <StatBox
          value={`${repliedCount}/${totalReviews}`}
          label="Replied"
          tone={repliedCount === totalReviews && totalReviews > 0 ? "success" : "default"}
        />
        <StatBox value={newThisWeek} label="New this week" tone="muted" />
      </div>

      {reviews.length === 0 ? (
        <DsCard>
          <EmptyState
            icon={Star}
            title="alphaa will collect your reviews automatically"
            body="As soon as a customer leaves a Google review, alphaa pulls it in here and drafts a professional reply for you to approve. Nothing to do — we check daily."
          />
        </DsCard>
      ) : (
        <>
          {/* Reviews needing a reply — prominent, first */}
          {needsReply.length > 0 && (
            <>
              <SectionDivider>Needs your approval</SectionDivider>
              <div className="space-y-3">
                {needsReply.map((review) => (
                  <DsCard key={review.id} accent="var(--ds-warn)">
                    {/* Reviewer row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "var(--ds-warn-bg)",
                            border: "1px solid var(--ds-warn-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ color: "var(--ds-warn)", fontSize: "11px", fontWeight: 600 }}>
                            {getInitials(review.authorName)}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)", lineHeight: 1.2 }}>
                            {review.authorName}
                          </p>
                          <div style={{ marginTop: "3px" }}>
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--ds-text-faint)", whiteSpace: "nowrap" }}>
                        {review.publishedAt ? formatDate(review.publishedAt) : formatDate(review.createdAt)}
                      </span>
                    </div>

                    {/* Review text */}
                    {review.comment && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--ds-text-mute)",
                          lineHeight: 1.6,
                          marginTop: "12px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {review.comment}
                      </p>
                    )}

                    {/* alphaa drafted reply */}
                    <GenerateReplyButton reviewId={review.id} />
                  </DsCard>
                ))}
              </div>
            </>
          )}

          {/* Answered reviews */}
          {answered.length > 0 && (
            <>
              <SectionDivider>Already replied for you</SectionDivider>
              <div className="space-y-3">
                {answered.map((review) => (
                  <DsCard key={review.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "var(--ds-surface)",
                            border: "1px solid var(--ds-border-2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ color: "var(--ds-text-mute)", fontSize: "11px", fontWeight: 600 }}>
                            {getInitials(review.authorName)}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)", lineHeight: 1.2 }}>
                            {review.authorName}
                          </p>
                          <div style={{ marginTop: "3px" }}>
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--ds-text-faint)", whiteSpace: "nowrap" }}>
                        {review.publishedAt ? formatDate(review.publishedAt) : formatDate(review.createdAt)}
                      </span>
                    </div>

                    {review.comment && (
                      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "12px" }}>
                        {review.comment}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: "12px",
                        background: "var(--ds-surface)",
                        border: "1px solid var(--ds-border)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--ds-accent)",
                          marginBottom: "6px",
                        }}
                      >
                        Your reply
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6 }}>
                        {review.reply}
                      </p>
                    </div>
                  </DsCard>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
