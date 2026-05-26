export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { Globe, Users } from "lucide-react"
import { AddCompetitorButton } from "./AddCompetitorButton"
import { DeleteCompetitorButton } from "./DeleteCompetitorButton"

export const metadata = { title: "Competitor Analysis" }

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frequencyBadge(freq: string) {
  const map: Record<string, { bg: string; text: string }> = {
    Daily: { bg: "bg-green-500/10 border-green-500/20", text: "text-green-400" },
    Weekly: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400" },
    Monthly: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400" },
    Rarely: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400" },
  }
  const style = map[freq] ?? map.Monthly
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${style.bg} ${style.text}`}
    >
      {freq}
    </span>
  )
}

function formatDate(date: Date | null): string {
  if (!date) return "Never"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

function displayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

// ─── Competitor Card ──────────────────────────────────────────────────────────

function CompetitorCard({ competitor }: { competitor: CompetitorRow }) {
  const data = competitor.crawlData
  const domain = displayDomain(competitor.url)
  const name = competitor.name ?? domain

  return (
    <GlassCard className="space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted flex-shrink-0" />
            <h3 className="text-white font-semibold text-base truncate">{name}</h3>
          </div>
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted text-xs hover:text-white/70 transition-colors mt-0.5 block truncate"
          >
            {competitor.url}
          </a>
        </div>
        <DeleteCompetitorButton id={competitor.id} />
      </div>

      {data ? (
        <>
          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted text-xs">Pages:</span>
              <span className="text-white font-mono text-xs font-medium">{data.pagesFound}</span>
            </div>
            {data.schemaTypes.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted text-xs">Schema:</span>
                <span className="text-white/80 text-xs">{data.schemaTypes.slice(0, 3).join(", ")}{data.schemaTypes.length > 3 ? ` +${data.schemaTypes.length - 3}` : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted text-xs">Posting:</span>
              {frequencyBadge(data.estimatedPostingFrequency)}
            </div>
          </div>

          {/* Key topics */}
          {data.keyTopics.length > 0 && (
            <div>
              <p className="text-muted text-xs mb-1.5">Key Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {data.keyTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-white/70 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths + Weaknesses */}
          {(data.strengths.length > 0 || data.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.strengths.length > 0 && (
                <div>
                  <p className="text-muted text-xs mb-1.5">Strengths</p>
                  <ul className="space-y-1">
                    {data.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-xs text-white/80">
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.weaknesses.length > 0 && (
                <div>
                  <p className="text-muted text-xs mb-1.5">Weaknesses</p>
                  <ul className="space-y-1">
                    {data.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-xs text-white/80">
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
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
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <p className="text-white/70 text-xs leading-relaxed">{data.aiSummary}</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted text-sm">No analysis data yet.</p>
      )}

      {/* Footer */}
      <p className="text-white/25 text-xs">
        Last analyzed: {formatDate(competitor.analyzedAt)}
      </p>
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CompetitorsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: {
      competitors: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  const competitors = (user?.competitors ?? []) as unknown as CompetitorRow[]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">Competitor Analysis</h1>
          <p className="text-muted text-sm mt-1">
            Track your competitors&apos; online presence and find opportunities to outrank them.
          </p>
        </div>
        {competitors.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-muted text-xs">
            <Users className="w-3 h-3" />
            {competitors.length} competitor{competitors.length !== 1 ? "s" : ""} tracked
          </div>
        )}
      </div>

      {/* Add competitor form */}
      <GlassCard>
        <p className="text-white font-medium text-sm mb-3">Add a Competitor</p>
        <AddCompetitorButton />
        <p className="text-white/25 text-xs mt-2">
          Alphaa will crawl up to 20 pages and use AI to summarize their strengths, weaknesses, and content strategy.
        </p>
      </GlassCard>

      {/* Competitor list or empty state */}
      {competitors.length === 0 ? (
        <GlassCard className="flex flex-col items-center text-center py-12 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-muted" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h2 className="text-white font-semibold text-lg">No competitors tracked yet</h2>
            <p className="text-muted text-sm leading-relaxed">
              Track your competitors&apos; online presence. Add their website above to see how they compare — pages, topics, posting frequency, and where they fall short.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {competitors.map((competitor) => (
            <CompetitorCard key={competitor.id} competitor={competitor} />
          ))}
        </div>
      )}
    </div>
  )
}
