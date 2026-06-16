export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { Globe, Users, Zap, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react"
import { AddCompetitorButton } from "./AddCompetitorButton"
import { DeleteCompetitorButton } from "./DeleteCompetitorButton"

export const metadata = { title: "Competitors" }

interface CompetitorCrawlData {
  pagesFound: number
  schemaTypes: string[]
  estimatedPostingFrequency: string
  keyTopics: string[]
  strengths: string[]
  weaknesses: string[]
  aiSummary: string
}

interface CompetitorRow {
  id: string
  url: string
  name: string | null
  crawlData: CompetitorCrawlData | null
  analyzedAt: Date | null
  createdAt: Date
}

function displayDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, "") }
  catch { return url }
}

function formatDate(date: Date | null): string {
  if (!date) return "Never"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
}

const FREQ_META: Record<string, { label: string; badge: string; score: number }> = {
  Daily:   { label: "Posts Daily",   badge: "bg-green-500/10 border-green-500/20 text-green-400",   score: 100 },
  Weekly:  { label: "Posts Weekly",  badge: "bg-blue-500/10 border-blue-500/20 text-blue-400",     score: 70  },
  Monthly: { label: "Posts Monthly", badge: "bg-amber-500/10 border-amber-500/20 text-amber-400",  score: 40  },
  Rarely:  { label: "Posts Rarely",  badge: "bg-red-500/10 border-red-500/20 text-red-400",        score: 15  },
}

function CompetitorCard({ competitor }: { competitor: CompetitorRow }) {
  const data = competitor.crawlData
  const domain = displayDomain(competitor.url)
  const name   = competitor.name ?? domain
  const freq   = FREQ_META[data?.estimatedPostingFrequency ?? ""] ?? FREQ_META.Monthly

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/[0.08] bg-gradient-to-br from-fg/[0.03] to-transparent">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-4 border-b border-line/[0.06]">
        <div className="flex items-center gap-3">
          {/* Domain avatar */}
          <div className="w-10 h-10 rounded-xl bg-fg/[0.06] border border-line/[0.08] flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-fg/40" />
          </div>
          <div className="min-w-0">
            <h3 className="text-fg font-semibold text-base truncate">{name}</h3>
            <a
              href={competitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg/35 text-xs hover:text-fg/60 transition-colors truncate block"
            >
              {domain}
            </a>
          </div>
        </div>
        <DeleteCompetitorButton id={competitor.id} />
      </div>

      {data ? (
        <div className="p-5 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-fg font-bold text-xl font-mono">{data.pagesFound}</p>
              <p className="text-fg/35 text-xs mt-0.5">Pages</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-fg font-bold text-xl font-mono">{data.schemaTypes.length}</p>
              <p className="text-fg/35 text-xs mt-0.5">Schema types</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center flex flex-col items-center justify-center gap-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${freq.badge}`}>
                {data.estimatedPostingFrequency}
              </span>
              <p className="text-fg/35 text-[10px]">Posting</p>
            </div>
          </div>

          {/* Key topics */}
          {data.keyTopics.length > 0 && (
            <div>
              <p className="text-fg/30 text-xs font-semibold uppercase tracking-wider mb-2">Key Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {data.keyTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-lg bg-fg/[0.04] border border-line/[0.07] text-fg/60 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths / Weaknesses */}
          {(data.strengths.length > 0 || data.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.strengths.length > 0 && (
                <div className="bg-green-500/[0.05] border border-green-500/[0.12] rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <p className="text-green-400 text-xs font-semibold">Their strengths</p>
                  </div>
                  <ul className="space-y-1.5">
                    {data.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-xs text-fg/65">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-green-400/60 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.weaknesses.length > 0 && (
                <div className="bg-red-500/[0.05] border border-red-500/[0.12] rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-red-400 text-xs font-semibold">Their weaknesses</p>
                  </div>
                  <ul className="space-y-1.5">
                    {data.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-xs text-fg/65">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400/60 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          {data.aiSummary && (
            <div className="bg-fg/[0.02] border border-line/[0.06] rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3 h-3 text-brand-orange" />
                <span className="text-brand-orange text-xs font-semibold">alphaa's take</span>
              </div>
              <p className="text-fg/60 text-sm leading-relaxed">{data.aiSummary}</p>
            </div>
          )}

          <p className="text-fg/20 text-xs">Last analyzed: {formatDate(competitor.analyzedAt)}</p>
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 rounded-full border-2 border-brand-orange border-t-transparent animate-spin flex-shrink-0" />
            <p className="text-fg/40 text-sm">Analysis in progress…</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default async function CompetitorsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: { competitors: { orderBy: { createdAt: "desc" } } },
  })

  const competitors = (user?.competitors ?? []) as unknown as CompetitorRow[]

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-fg font-bold text-2xl">Competitors</h1>
          <p className="text-fg/40 text-sm mt-1">
            {competitors.length > 0
              ? `Tracking ${competitors.length} competitor${competitors.length !== 1 ? "s" : ""} — alphaa watches their moves`
              : "Track competitors and find opportunities to outrank them"}
          </p>
        </div>
        {competitors.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fg/[0.04] border border-line/[0.08] text-fg/35 text-xs">
            <Users className="w-3 h-3" />
            {competitors.length} tracked
          </div>
        )}
      </div>

      {/* ── Add Competitor ─────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-orange" />
          <p className="text-fg font-semibold text-sm">Add a Competitor</p>
        </div>
        <AddCompetitorButton />
        <p className="text-fg/25 text-xs mt-2.5 leading-relaxed">
          alphaa crawls up to 20 pages and uses AI to identify their strengths, weaknesses, posting frequency, and content topics.
        </p>
      </GlassCard>

      {/* ── Competitors / Empty state ───────────────── */}
      {competitors.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-line/[0.08] bg-gradient-to-br from-fg/[0.03] to-transparent p-10">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-fg/[0.05] border border-line/[0.08] flex items-center justify-center">
              <Users className="w-7 h-7 text-fg/25" />
            </div>
            <div className="max-w-sm">
              <h2 className="text-fg font-semibold text-lg">No competitors yet</h2>
              <p className="text-fg/40 text-sm mt-1 leading-relaxed">
                Add a competitor's website above. alphaa will analyze what makes them successful — and find your opportunities.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} />
          ))}
        </div>
      )}
    </div>
  )
}
