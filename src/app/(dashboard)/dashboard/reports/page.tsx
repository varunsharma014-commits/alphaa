export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { FileText, Mail, CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react"

export const metadata = { title: "Reports" }

type KeywordMover = {
  query: string
  positionBefore: number
  positionAfter: number
  change: number
}

type VisibilityDelta = Record<string, number>

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  google_ai: "Google AI",
  gemini: "Gemini",
}

function formatWeekLabel(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function DeltaBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-green-400 text-xs font-medium">
        <TrendingUp className="w-3 h-3" />+{value}
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-medium">
        <TrendingDown className="w-3 h-3" />{value}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-white/30 text-xs font-medium">
      <Minus className="w-3 h-3" />—
    </span>
  )
}

export default async function ReportsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    select: { id: true, businessName: true },
  })

  const reports = user
    ? await db.weeklyReport.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : []

  const latestReport = reports[0] ?? null

  const stats = [
    {
      label: "Total Reports",
      value: reports.length,
      icon: FileText,
    },
    {
      label: "Posts Published (latest)",
      value: latestReport?.postsPublished ?? "—",
      icon: CheckCircle2,
    },
    {
      label: "New Reviews (latest)",
      value: latestReport?.reviewsNew ?? "—",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white font-semibold text-2xl">Reports</h1>
        <p className="text-white/50 text-sm mt-0.5">Your weekly performance summaries</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white/40">
              <s.icon className="w-4 h-4" />
              <span className="text-xs">{s.label}</span>
            </div>
            <span className="text-white text-2xl font-semibold mono">{s.value}</span>
          </GlassCard>
        ))}
      </div>

      {/* Reports list */}
      {reports.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
            <FileText className="w-7 h-7 text-white/30" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No reports yet</h2>
          <p className="text-white/50 text-sm max-w-xs">
            Your first weekly report will be generated automatically every Monday morning.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const visibilityDelta = (report.visibilityDelta ?? {}) as VisibilityDelta
            const keywordMovers = (report.keywordMovers ?? []) as KeywordMover[]
            const topMovers = keywordMovers.slice(0, 3)

            return (
              <GlassCard key={report.id} hover>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium text-sm">
                        Week of {formatWeekLabel(report.createdAt)}
                      </h3>
                      {report.emailSent && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          <Mail className="w-3 h-3" />
                          Email sent
                        </span>
                      )}
                    </div>
                    {report.summary && (
                      <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
                        {report.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Stats */}
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-white/30 text-xs mb-1">Posts published</p>
                    <p className="text-white font-semibold mono text-lg">{report.postsPublished}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-white/30 text-xs mb-1">New reviews</p>
                    <p className="text-white font-semibold mono text-lg">{report.reviewsNew}</p>
                  </div>

                  {/* Visibility delta */}
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-white/30 text-xs mb-2">AI visibility</p>
                    <div className="space-y-1">
                      {Object.entries(visibilityDelta).map(([engine, delta]) => (
                        <div key={engine} className="flex items-center justify-between">
                          <span className="text-white/50 text-xs">
                            {ENGINE_LABELS[engine] ?? engine}
                          </span>
                          <DeltaBadge value={delta} />
                        </div>
                      ))}
                      {Object.keys(visibilityDelta).length === 0 && (
                        <p className="text-white/30 text-xs">No data</p>
                      )}
                    </div>
                  </div>

                  {/* Keyword movers */}
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-white/30 text-xs mb-2">Keyword movers</p>
                    <div className="space-y-1">
                      {topMovers.map((k) => (
                        <div key={k.query} className="flex items-center justify-between gap-2">
                          <span className="text-white/50 text-xs truncate">{k.query}</span>
                          <span
                            className={`text-xs mono font-medium flex-shrink-0 ${
                              k.change > 0
                                ? "text-green-400"
                                : k.change < 0
                                ? "text-red-400"
                                : "text-white/30"
                            }`}
                          >
                            {k.change > 0 ? "+" : ""}{k.change}
                          </span>
                        </div>
                      ))}
                      {topMovers.length === 0 && (
                        <p className="text-white/30 text-xs">No movement tracked</p>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
