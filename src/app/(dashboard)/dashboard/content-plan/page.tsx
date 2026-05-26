export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { Info } from "lucide-react"
import { GenerateMonthButton } from "./GenerateMonthButton"

function getWeekLabel(weekIndex: number) {
  return `Week ${weekIndex + 1}`
}

function getPostsForWeek(
  posts: Array<{ createdAt: Date; status: string }>,
  weekStart: Date,
  weekEnd: Date
) {
  return posts.filter((p) => {
    const d = new Date(p.createdAt)
    return d >= weekStart && d < weekEnd
  })
}

function WeekDot({ status }: { status: string }) {
  const color =
    status === "posted"
      ? "bg-green-400"
      : status === "draft"
        ? "bg-amber-400"
        : "bg-red-400"
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
}

function EmptySlot() {
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-white/10" />
}

function PostTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    UPDATE: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    OFFER: "bg-green-500/10 border-green-500/20 text-green-400",
    EVENT: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${styles[type] ?? styles.UPDATE}`}
    >
      {type}
    </span>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export default async function ContentPlanPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: {
      gbpPosts: { orderBy: { createdAt: "desc" } },
    },
  })

  const posts = user?.gbpPosts ?? []

  // Build 4-week view starting from this month's start
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const weeks: Array<{ start: Date; end: Date }> = Array.from(
    { length: 4 },
    (_, i) => {
      const start = new Date(monthStart)
      start.setDate(1 + i * 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      return { start, end }
    }
  )

  const recentPosts = posts.slice(0, 10)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">Content Plan</h1>
          <p className="text-muted text-sm mt-1">
            Your automated content schedule
          </p>
        </div>
        <GenerateMonthButton />
      </div>

      {/* Tip box */}
      <GlassCard className="flex items-start gap-3 py-4">
        <Info className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
        <p className="text-white/70 text-sm leading-relaxed">
          <span className="text-white font-medium">Tip:</span> Alphaa
          automatically generates and schedules 2 posts per week. Posts are
          generated Sunday evening and published Monday + Thursday.
        </p>
      </GlassCard>

      {/* This Month weekly view */}
      <GlassCard>
        <h2 className="text-white font-medium mb-5">
          This Month —{" "}
          {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {weeks.map((week, i) => {
            const weekPosts = getPostsForWeek(posts, week.start, week.end)
            const slots = [0, 1] // 2 posts per week target
            return (
              <div key={i} className="bg-bg-tertiary rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-white text-sm font-medium">
                    {getWeekLabel(i)}
                  </p>
                  <p className="text-muted text-xs">
                    {formatDate(week.start)} – {formatDate(week.end)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {slots.map((slot) => {
                    const post = weekPosts[slot]
                    return post ? (
                      <WeekDot key={slot} status={post.status} />
                    ) : (
                      <EmptySlot key={slot} />
                    )
                  })}
                  {weekPosts.length > 2 && (
                    <span className="text-muted text-xs">
                      +{weekPosts.length - 2}
                    </span>
                  )}
                </div>
                <p className="text-muted text-xs">
                  {weekPosts.length === 0
                    ? "No posts"
                    : `${weekPosts.length} post${weekPosts.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/[0.06] flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
            Published
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Draft
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-white/10 inline-block" />
            Empty slot
          </div>
        </div>
      </GlassCard>

      {/* Recent posts table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-medium text-sm">
            Recent Posts{" "}
            <span className="text-muted font-normal">
              ({posts.length} total)
            </span>
          </h2>
        </div>

        {recentPosts.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-muted text-sm">
              No posts yet. Use the "Auto-Generate Month" button to create your
              first batch of posts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recentPosts.map((post) => (
              <div key={post.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">
                    {post.content.slice(0, 80)}
                    {post.content.length > 80 ? "…" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PostTypeBadge type={post.postType} />
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${
                      post.status === "posted"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : post.status === "draft"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}
                  >
                    {post.status}
                  </span>
                  <span className="text-muted text-xs whitespace-nowrap">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
