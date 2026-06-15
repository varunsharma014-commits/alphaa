export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import {
  BarChart3, FileText, Mail, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Star, MapPin,
} from "lucide-react"

export const metadata = { title: "Reports" }

type KeywordMover = {
  query: string
  positionBefore: number
  positionAfter: number
  change: number
}

type VisibilityDelta = Record<string, number>

const ENGINE_META: Record<string, { label: string; emoji: string }> = {
  chatgpt:    { label: "ChatGPT",    emoji: "🤖" },
  perplexity: { label: "Perplexity", emoji: "🔍" },
  google_ai:  { label: "Google AI",  emoji: "🌐" },
  gemini:     { label: "Gemini",     emoji: "✨" },
}

function formatWeek(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function DeltaChip({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
      <TrendingUp className="w-3 h-3" />+{value}
    </span>
  )
  if (value < 0) return (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
      <TrendingDown className="w-3 h-3" />{value}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-white/30 text-xs bg-white/[0.04] px-2 py-0.5 rounded-full">
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

  const latest = reports[0] ?? null

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Hero ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.10] via-transparent to-transparent p-6 md:p-8">
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-widest">Weekly Reports</span>
          </div>
          <h1 className="text-white font-bold text-3xl">
            {reports.length} <span className="text-white/50 font-normal text-2xl">reports generated</span>
          </h1>
          <p className="text-white/40 text-sm mt-1">Delivered every Monday morning · automatically</p>

          {latest && (
            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/[0.08]">
              <div>
                <p className="text-white/30 text-xs mb-0.5">Latest week</p>
                <p className="text-white/80 text-sm font-medium">{formatWeek(latest.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-sm">{latest.postsPublished} posts published</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-white/60 text-sm">{latest.reviewsNew} new reviews</span>
              </div>
              {latest.emailSent && (
                <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                  <Mail className="w-3 h-3" />
                  Email sent
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Empty state ───────────────────────────── */}
      {reports.length === 0 && (
        <div className="flex flex-col items-center text-center gap-5 py-16 px-6 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <FileText className="w-7 h-7 text-white/25" />
          </div>
          <div className="max-w-xs">
            <h2 className="text-white font-semibold text-lg">No reports yet</h2>
            <p className="text-white/40 text-sm mt-1 leading-relaxed">
              Your first weekly report will be generated automatically every Monday. It'll include posts published, reviews received, and AI visibility changes.
            </p>
          </div>
        </div>
      )}

      {/* ── Report cards ──────────────────────────── */}
      {reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report, idx) => {
            const visibilityDelta = (report.visibilityDelta ?? {}) as VisibilityDelta
            const keywordMovers   = (report.keywordMovers ?? [])  as KeywordMover[]
            const topMovers       = keywordMovers.slice(0, 4)
            const isLatest        = idx === 0

            return (
              <div
                key={report.id}
                className={`relative overflow-hidden rounded-2xl border ${
                  isLatest ? "border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent" : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                {/* Card header */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm">{formatWeek(report.createdAt)}</h3>
                      {isLatest && (
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Latest
                        </span>
                      )}
                    </div>
                    {report.summary && (
                      <p className="text-white/40 text-xs mt-0.5 leading-relaxed max-w-xl">
                        {report.summary}
                      </p>
                    )}
                  </div>
                  {report.emailSent && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20 flex-shrink-0">
                      <Mail className="w-3 h-3" />
                      Emailed
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-white/[0.06]">

                  {/* Posts */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-white/25" />
                      <span className="text-white/30 text-xs">Posts published</span>
                    </div>
                    <p className="text-white font-bold text-3xl font-mono">{report.postsPublished}</p>
                  </div>

                  {/* Reviews */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3.5 h-3.5 text-white/25" />
                      <span className="text-white/30 text-xs">New reviews</span>
                    </div>
                    <p className="text-white font-bold text-3xl font-mono">{report.reviewsNew}</p>
                  </div>

                  {/* AI Visibility */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <TrendingUp className="w-3.5 h-3.5 text-white/25" />
                      <span className="text-white/30 text-xs">AI visibility</span>
                    </div>
                    {Object.keys(visibilityDelta).length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.entries(visibilityDelta).map(([engine, delta]) => {
                          const meta = ENGINE_META[engine]
                          return (
                            <div key={engine} className="flex items-center justify-between gap-2">
                              <span className="text-white/45 text-xs flex items-center gap-1">
                                {meta?.emoji && <span className="text-sm leading-none">{meta.emoji}</span>}
                                {meta?.label ?? engine}
                              </span>
                              <DeltaChip value={delta} />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-white/25 text-xs">No changes</p>
                    )}
                  </div>

                  {/* Keyword movers */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <BarChart3 className="w-3.5 h-3.5 text-white/25" />
                      <span className="text-white/30 text-xs">Keyword movers</span>
                    </div>
                    {topMovers.length > 0 ? (
                      <div className="space-y-1.5">
                        {topMovers.map((k) => (
                          <div key={k.query} className="flex items-center justify-between gap-2">
                            <span className="text-white/50 text-xs truncate flex-1">{k.query}</span>
                            <span className={`text-xs font-mono font-semibold flex-shrink-0 ${
                              k.change > 0 ? "text-green-400" : k.change < 0 ? "text-red-400" : "text-white/30"
                            }`}>
                              {k.change > 0 ? "+" : ""}{k.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/25 text-xs">No movement</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
