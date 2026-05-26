export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { formatDate } from "@/lib/utils"
import AnalyzeGapsButton from "./AnalyzeGapsButton"
import type { GapItem } from "@/lib/content-gaps"

export const metadata = { title: "Content Gaps" }

const PRIORITY_STYLES: Record<GapItem["priority"], { badge: string; label: string }> = {
  high: { badge: "bg-red-500/20 text-red-400 border border-red-500/30", label: "High" },
  medium: { badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30", label: "Medium" },
  low: { badge: "bg-blue-500/20 text-blue-400 border border-blue-500/30", label: "Low" },
}

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-semibold text-2xl">Content Gaps</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Discover what topics your competitors rank for that your site is missing.
          </p>
        </div>
        {latestGap && (
          <div className="shrink-0">
            <GlassCard className="py-3 px-4">
              <p className="text-white/50 text-xs mb-2">Run new analysis</p>
              <AnalyzeGapsButton />
            </GlassCard>
          </div>
        )}
      </div>

      {!latestGap ? (
        /* Empty state */
        <GlassCard>
          <div className="text-center py-10 space-y-5">
            <p className="text-4xl">🔍</p>
            <div>
              <h2 className="text-white font-semibold text-lg">No analysis yet</h2>
              <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                Enter a competitor&apos;s website URL and Claude will identify content gaps — topics
                they rank for that you should also cover.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <AnalyzeGapsButton prominent />
            </div>
          </div>
        </GlassCard>
      ) : (
        <>
          {/* Summary card */}
          <GlassCard>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                <span className="text-orange-400 text-lg">📊</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-medium text-sm">Analysis Summary</h2>
                  <span className="text-white/30 text-xs">vs</span>
                  <span className="text-white/50 text-xs font-mono truncate max-w-xs">{latestGap.competitorUrl}</span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">
                  {formatDate(latestGap.analyzedAt)} · {gaps.length} gap{gaps.length !== 1 ? "s" : ""} identified
                </p>
                {latestGap.summary && (
                  <p className="text-white/70 text-sm mt-3 leading-relaxed">{latestGap.summary}</p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Gap cards */}
          <div className="space-y-3">
            {gaps.map((gap, i) => {
              const priorityStyle = PRIORITY_STYLES[gap.priority] ?? PRIORITY_STYLES.medium
              return (
                <GlassCard key={i} hover>
                  <div className="space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyle.badge}`}>
                            {priorityStyle.label} priority
                          </span>
                          <span className="text-white/40 text-xs">{gap.topic}</span>
                        </div>
                        <h3 className="text-white font-medium text-sm mt-1.5 leading-snug">{gap.suggestedTitle}</h3>
                      </div>
                    </div>

                    {/* Outline */}
                    {gap.suggestedOutline.length > 0 && (
                      <ul className="space-y-1">
                        {gap.suggestedOutline.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-white/50 text-xs">
                            <span className="text-white/20 shrink-0 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Impact */}
                    {gap.estimatedImpact && (
                      <div className="pt-1 border-t border-white/5">
                        <p className="text-white/40 text-xs">
                          <span className="text-white/25">Impact: </span>
                          {gap.estimatedImpact}
                        </p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
