export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { Lightbulb, ArrowUpRight, TrendingUp } from "lucide-react"
import { AnalyzeGapsButton } from "./AnalyzeGapsButton"
import type { GapItem } from "@/lib/content-gaps"
import { formatDate } from "@/lib/utils"

export const metadata = { title: "Topic Ideas" }

const PRIORITY_META = {
  high:   { label: "High Priority",   badge: "bg-red-500/15 border-red-500/25 text-red-400",    bar: "bg-red-400",    gradient: "from-red-500/[0.08]",    border: "border-red-500/15",   dot: "bg-red-400"    },
  medium: { label: "Medium Priority", badge: "bg-amber-500/15 border-amber-500/25 text-amber-400", bar: "bg-amber-400", gradient: "from-amber-500/[0.08]", border: "border-amber-500/15", dot: "bg-amber-400"  },
  low:    { label: "Low Priority",    badge: "bg-blue-500/15 border-blue-500/25 text-blue-400",  bar: "bg-blue-400",   gradient: "from-blue-500/[0.08]",    border: "border-blue-500/15",  dot: "bg-blue-400"   },
} as const

export default async function ContentGapsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/sign-in")

  const latestGap = await db.contentGap.findFirst({
    where: { userId: user.id },
    orderBy: { analyzedAt: "desc" },
  })

  const gaps = (latestGap?.gaps as unknown as GapItem[]) ?? []

  const highGaps   = gaps.filter((g) => g.priority === "high")
  const mediumGaps = gaps.filter((g) => g.priority === "medium")
  const lowGaps    = gaps.filter((g) => g.priority === "low")

  if (!latestGap) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-white font-bold text-2xl">Topic Ideas</h1>
          <p className="text-white/40 text-sm mt-1">Topics your competitors rank for that you're missing</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/[0.08] via-transparent to-transparent p-10">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-orange/15 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-brand-orange" />
            </div>
            <div className="max-w-sm">
              <h2 className="text-white font-bold text-xl">Discover content opportunities</h2>
              <p className="text-white/50 text-sm mt-2 leading-relaxed">
                Enter a competitor's website and alphaa finds the topics they rank for that you should cover — with suggested titles and outlines ready to use.
              </p>
            </div>
            <AnalyzeGapsButton prominent />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Hero ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/[0.10] via-transparent to-transparent p-6 md:p-8">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-brand-orange/12 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-brand-orange" />
              <span className="text-brand-orange text-xs font-semibold uppercase tracking-widest">Topic Ideas</span>
            </div>
            <h1 className="text-white font-bold text-3xl">
              {gaps.length} <span className="text-white/50 font-normal">opportunities found</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              vs <span className="text-white/60 font-mono">{latestGap.competitorUrl}</span> · {formatDate(latestGap.analyzedAt)}
            </p>

            {/* Priority breakdown */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-white/60 text-xs">{highGaps.length} high</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-white/60 text-xs">{mediumGaps.length} medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-white/60 text-xs">{lowGaps.length} low</span>
              </div>
            </div>
          </div>
          <AnalyzeGapsButton />
        </div>

        {latestGap.summary && (
          <div className="relative mt-5 pt-5 border-t border-white/[0.08]">
            <p className="text-white/60 text-sm leading-relaxed">{latestGap.summary}</p>
          </div>
        )}
      </div>

      {/* ── Gap Groups ───────────────────────────── */}
      {([
        { priority: "high",   items: highGaps   },
        { priority: "medium", items: mediumGaps  },
        { priority: "low",    items: lowGaps     },
      ] as const).map(({ priority, items }) => {
        if (items.length === 0) return null
        const meta = PRIORITY_META[priority]
        return (
          <div key={priority} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              <h2 className="text-white font-semibold text-sm">{meta.label}</h2>
              <span className="text-white/25 text-xs">{items.length} topic{items.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Cards */}
            {items.map((gap, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl border ${meta.border} bg-gradient-to-br ${meta.gradient} via-transparent to-transparent p-5 hover:border-opacity-50 transition-all`}
              >
                {/* Topic + priority */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${meta.badge}`}>
                      {meta.label}
                    </span>
                    {gap.topic && (
                      <span className="text-white/35 text-xs">{gap.topic}</span>
                    )}
                  </div>
                </div>

                {/* Suggested title */}
                <h3 className="text-white font-semibold text-base leading-snug mb-3">
                  {gap.suggestedTitle}
                </h3>

                {/* Outline */}
                {gap.suggestedOutline.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {gap.suggestedOutline.map((point, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-white/20 text-xs mt-0.5 flex-shrink-0">{j + 1}.</span>
                        <span className="text-white/55 text-sm leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Impact */}
                {gap.estimatedImpact && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                    <TrendingUp className="w-3 h-3 text-white/25" />
                    <span className="text-white/40 text-xs">{gap.estimatedImpact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
