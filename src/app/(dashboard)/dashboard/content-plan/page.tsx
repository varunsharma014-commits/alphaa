export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { CalendarDays, CheckCircle2, Clock, Info } from "lucide-react"
import { GenerateMonthButton } from "./GenerateMonthButton"

export const metadata = { title: "Content Plan" }

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date))
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(new Date(date))
}

type PostStatus = "posted" | "draft" | "failed" | "scheduled"
type PostType = "UPDATE" | "OFFER" | "EVENT"

const STATUS_META: Record<PostStatus, { label: string; dot: string; badge: string }> = {
  posted:    { label: "Published", dot: "bg-green-400",  badge: "bg-green-500/10 border-green-500/20 text-green-400"  },
  draft:     { label: "Draft",     dot: "bg-amber-400",  badge: "bg-amber-500/10 border-amber-500/20 text-amber-400"  },
  scheduled: { label: "Scheduled", dot: "bg-blue-400",   badge: "bg-blue-500/10 border-blue-500/20 text-blue-400"    },
  failed:    { label: "Failed",    dot: "bg-red-400",    badge: "bg-red-500/10 border-red-500/20 text-red-400"        },
}

const TYPE_META: Record<PostType, { label: string; badge: string }> = {
  UPDATE: { label: "Update", badge: "bg-blue-500/10 border-blue-500/20 text-blue-400"     },
  OFFER:  { label: "Offer",  badge: "bg-green-500/10 border-green-500/20 text-green-400"  },
  EVENT:  { label: "Event",  badge: "bg-purple-500/10 border-purple-500/20 text-purple-400" },
}

export default async function ContentPlanPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: { gbpPosts: { orderBy: { createdAt: "desc" } } },
  })

  const posts = user?.gbpPosts ?? []

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" })

  // Build 4-week grid
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(monthStart)
    start.setDate(1 + i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  })

  // Stats
  const thisMonth = posts.filter((p) => {
    const d = new Date(p.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const publishedCount = thisMonth.filter((p) => p.status === "posted").length
  const draftCount     = thisMonth.filter((p) => p.status === "draft").length
  const targetPerMonth = 8
  const progressPct    = Math.min(100, Math.round((publishedCount / targetPerMonth) * 100))

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/[0.10] via-transparent to-transparent p-6 md:p-8">
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-brand-orange" />
              <span className="text-brand-orange text-xs font-semibold uppercase tracking-widest">Content Plan</span>
            </div>
            <h1 className="text-white font-bold text-3xl">{monthName}</h1>
            <p className="text-white/40 text-sm mt-1">2 posts per week, automated by alphaa</p>

            {/* Progress bar */}
            <div className="mt-4 max-w-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/50 text-xs">{publishedCount} of {targetPerMonth} posts published</span>
                <span className="text-brand-orange text-xs font-semibold">{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-orange transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
          <GenerateMonthButton />
        </div>

        {/* Quick stats */}
        <div className="relative flex items-center gap-6 mt-6 pt-6 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-white/70 text-sm">{publishedCount} published</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-white/70 text-sm">{draftCount} drafts ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/25" />
            <span className="text-white/35 text-sm text-xs">Posts on Mon + Thu each week</span>
          </div>
        </div>
      </div>

      {/* ── 4-Week Calendar ──────────────────────────── */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-3">This Month at a Glance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {weeks.map((week, i) => {
            const weekPosts = posts.filter((p) => {
              const d = new Date(p.createdAt)
              return d >= week.start && d < week.end
            })
            const postedInWeek  = weekPosts.filter((p) => p.status === "posted").length
            const draftInWeek   = weekPosts.filter((p) => p.status === "draft").length
            const isCurrentWeek = now >= week.start && now < week.end

            return (
              <div
                key={i}
                className={`relative rounded-2xl p-4 border transition-all ${
                  isCurrentWeek
                    ? "border-brand-orange/30 bg-brand-orange/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {isCurrentWeek && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold text-brand-orange uppercase tracking-widest">
                    Now
                  </span>
                )}
                <p className="text-white font-semibold text-sm">Week {i + 1}</p>
                <p className="text-white/35 text-xs mt-0.5">
                  {formatDate(week.start)} – {formatDate(week.end)}
                </p>

                {/* Slot dots */}
                <div className="flex items-center gap-1.5 mt-3">
                  {[0, 1].map((slot) => {
                    const post = weekPosts[slot]
                    if (!post) return <span key={slot} className="w-3 h-3 rounded-full bg-white/[0.08] border border-white/10" />
                    const s = STATUS_META[post.status as PostStatus] ?? STATUS_META.draft
                    return <span key={slot} className={`w-3 h-3 rounded-full ${s.dot}`} title={s.label} />
                  })}
                  {weekPosts.length > 2 && (
                    <span className="text-white/30 text-xs">+{weekPosts.length - 2}</span>
                  )}
                </div>

                <p className="text-white/50 text-xs mt-2">
                  {weekPosts.length === 0 ? (
                    <span className="text-white/25">No posts yet</span>
                  ) : (
                    <>
                      {postedInWeek > 0 && <span className="text-green-400">{postedInWeek} published</span>}
                      {postedInWeek > 0 && draftInWeek > 0 && <span className="text-white/20"> · </span>}
                      {draftInWeek > 0  && <span className="text-amber-400">{draftInWeek} draft</span>}
                    </>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 px-1">
          {[
            { dot: "bg-green-400", label: "Published" },
            { dot: "bg-amber-400", label: "Draft" },
            { dot: "bg-blue-400",  label: "Scheduled" },
            { dot: "bg-white/[0.08] border border-white/10", label: "Empty slot" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${l.dot}`} />
              <span className="text-white/30 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Posts Table ───────────────────────────── */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-sm">
            All Posts <span className="text-white/30 font-normal">({posts.length})</span>
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-14 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-brand-orange" />
            </div>
            <div className="max-w-xs">
              <p className="text-white font-semibold">No posts yet</p>
              <p className="text-white/40 text-sm mt-1 leading-relaxed">
                Use "Auto-Generate Month" to create your first batch. alphaa writes them in your voice.
              </p>
            </div>
            <GenerateMonthButton />
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {posts.slice(0, 20).map((post) => {
              const s = STATUS_META[post.status as PostStatus] ?? STATUS_META.draft
              const t = TYPE_META[post.postType as PostType] ?? TYPE_META.UPDATE
              return (
                <div key={post.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${s.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                      {post.content.slice(0, 180)}{post.content.length > 180 ? "…" : ""}
                    </p>
                    <p className="text-white/30 text-xs mt-1">{formatDateLong(post.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${t.badge}`}>
                      {t.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${s.badge}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
