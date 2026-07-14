export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { Globe, Users, Zap, AlertCircle, CheckCircle2, TrendingUp, Search } from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { DsCard } from "@/components/dashboard/DsCard"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { AddCompetitorButton } from "./AddCompetitorButton"
import { FindCompetitorsButton } from "./FindCompetitorsButton"
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

// crawlData is JSON (possibly null). Auto-discovered competitors carry a
// top-level { source: "auto_discovered" }. Read it defensively — never crash.
function isAutoDiscovered(crawlData: unknown): boolean {
  if (typeof crawlData !== "object" || crawlData === null) return false
  const source = (crawlData as Record<string, unknown>).source
  return typeof source === "string" && source === "auto_discovered"
}

function formatDate(date: Date | null): string {
  if (!date) return "Never"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
}

const FREQ_META: Record<string, { variant: "found" | "info" | "warning" | "error" | "neutral" }> = {
  Daily:   { variant: "found"   },
  Weekly:  { variant: "info"    },
  Monthly: { variant: "warning" },
  Rarely:  { variant: "error"   },
}

function CompetitorCard({ competitor }: { competitor: CompetitorRow }) {
  const data = competitor.crawlData
  const domain = displayDomain(competitor.url)
  const name   = competitor.name ?? domain
  const autoDiscovered = isAutoDiscovered(competitor.crawlData)

  // crawlData is a Json column — read every field defensively so a partial
  // record (e.g. an auto-discovered row that hasn't been analyzed yet) can
  // never crash the page.
  const strengths  = Array.isArray(data?.strengths)  ? data.strengths.filter((s): s is string => typeof s === "string")  : []
  const weaknesses = Array.isArray(data?.weaknesses) ? data.weaknesses.filter((w): w is string => typeof w === "string") : []
  const keyTopics  = Array.isArray(data?.keyTopics)  ? data.keyTopics.filter((t): t is string => typeof t === "string")  : []
  const schemaCount = Array.isArray(data?.schemaTypes) ? data.schemaTypes.length : 0
  const pagesFound  = typeof data?.pagesFound === "number" ? data.pagesFound : null
  const postingFreq = typeof data?.estimatedPostingFrequency === "string" ? data.estimatedPostingFrequency : null
  const aiSummary   = typeof data?.aiSummary === "string" ? data.aiSummary : null
  const freq        = FREQ_META[postingFreq ?? ""] ?? FREQ_META.Monthly

  // A crawlData object that only carries bookkeeping (e.g. { source }) means
  // the analysis hasn't run yet — show the honest in-progress state.
  const analyzed = Boolean(
    data && (pagesFound !== null || aiSummary || strengths.length > 0 || keyTopics.length > 0)
  )

  return (
    <div
      className="overflow-hidden rounded-[10px]"
      style={{ background: "#161616", border: ".5px solid #222" }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between gap-3"
        style={{ padding: "1rem 1.25rem", borderBottom: ".5px solid #222" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Domain avatar */}
          <div
            className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
            style={{ background: "#1a1a1a", border: ".5px solid #2a2a2a" }}
          >
            <Globe className="w-5 h-5" style={{ color: "#555" }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate" style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{name}</h3>
            <a
              href={competitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate block transition-colors hover:text-white"
              style={{ color: "#555", fontSize: 11 }}
            >
              {domain}
            </a>
            <div style={{ marginTop: 6 }}>
              {autoDiscovered ? (
                <StatusPill variant="neutral">Auto-discovered by alphaa</StatusPill>
              ) : (
                <StatusPill variant="neutral">Added by you</StatusPill>
              )}
            </div>
          </div>
        </div>
        <DeleteCompetitorButton id={competitor.id} />
      </div>

      {analyzed ? (
        <div className="space-y-5" style={{ padding: "1.25rem" }}>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[8px] p-3 text-center" style={{ background: "#1a1a1a", border: ".5px solid #222" }}>
              <p style={{ color: "#fff", fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{pagesFound ?? "—"}</p>
              <p style={{ color: "#555", fontSize: 11, marginTop: 2 }}>Pages reviewed</p>
            </div>
            <div className="rounded-[8px] p-3 text-center" style={{ background: "#1a1a1a", border: ".5px solid #222" }}>
              <p style={{ color: "#fff", fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{schemaCount}</p>
              <p style={{ color: "#555", fontSize: 11, marginTop: 2 }}>Search-friendly signals</p>
            </div>
            <div className="rounded-[8px] p-3 text-center flex flex-col items-center justify-center gap-1.5" style={{ background: "#1a1a1a", border: ".5px solid #222" }}>
              <StatusPill variant={freq.variant}>{postingFreq ?? "Unknown"}</StatusPill>
              <p style={{ color: "#555", fontSize: 10 }}>How often they post</p>
            </div>
          </div>

          {/* Key topics */}
          {keyTopics.length > 0 && (
            <div>
              <p style={{ color: "#444", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>What they write about</p>
              <div className="flex flex-wrap gap-1.5">
                {keyTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-[8px]"
                    style={{ background: "#1a1a1a", border: ".5px solid #2a2a2a", color: "#888", fontSize: 11 }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths / Weaknesses */}
          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {strengths.length > 0 && (
                <div className="rounded-[8px] p-4" style={{ background: "#0d2218", border: ".5px solid #14532d" }}>
                  <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                    <p style={{ color: "#22c55e", fontSize: 11, fontWeight: 500 }}>What's working for them</p>
                  </div>
                  <ul className="space-y-1.5">
                    {strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2" style={{ color: "#888", fontSize: 11, lineHeight: 1.6 }}>
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#22c55e" }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="rounded-[8px] p-4" style={{ background: "#1a0808", border: ".5px solid #7f1d1d" }}>
                  <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                    <p style={{ color: "#f87171", fontSize: 11, fontWeight: 500 }}>Gaps you can win on</p>
                  </div>
                  <ul className="space-y-1.5">
                    {weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2" style={{ color: "#888", fontSize: 11, lineHeight: 1.6 }}>
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#dc2626" }} />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          {aiSummary && (
            <div className="rounded-[8px] px-4 py-3" style={{ background: "#1a1a1a", border: ".5px solid #2a2a2a" }}>
              <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                <Zap className="w-3 h-3" style={{ color: "#e05a2b" }} />
                <span style={{ color: "#e05a2b", fontSize: 11, fontWeight: 500 }}>alphaa&apos;s take</span>
              </div>
              <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>{aiSummary}</p>
            </div>
          )}

          <p style={{ color: "#444", fontSize: 11 }}>Last refreshed automatically: {formatDate(competitor.analyzedAt)}</p>
        </div>
      ) : (
        <div style={{ padding: "1.25rem" }}>
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 rounded-full animate-spin flex-shrink-0" style={{ border: "2px solid #e05a2b", borderTopColor: "transparent" }} />
            <p style={{ color: "#888", fontSize: 13 }}>alphaa is analyzing this competitor for you — sit tight.</p>
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
  const city = user?.city ?? null

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <AutopilotBar message="alphaa crawls competitor sites weekly and updates their profile automatically" />

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 500 }}>Competitor intel</h1>
          <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
            See what is working for your competitors — so you can do it better.
          </p>
        </div>
        {competitors.length > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: "#161616", border: ".5px solid #222", color: "#888", fontSize: 11 }}
          >
            <Users className="w-3 h-3" />
            {competitors.length} tracked on autopilot
          </div>
        )}
      </div>

      {/* ── Competitors / Discovery state ───────────── */}
      {competitors.length === 0 ? (
        <DsCard>
          <EmptyState
            icon={Search}
            title={city ? `alphaa is finding your competitors in ${city}…` : "alphaa is finding your competitors…"}
            body="We're analyzing who ranks above you — this takes about 2 minutes."
            sub="You don't have to do anything. Want to kick it off right now?"
          >
            <FindCompetitorsButton city={city} />
          </EmptyState>
        </DsCard>
      ) : (
        <div className="space-y-4">
          <SectionDivider>Competitors on autopilot</SectionDivider>
          {competitors.map((c) => (
            <CompetitorCard key={c.id} competitor={c} />
          ))}
        </div>
      )}

      {/* ── Manual tracking (secondary, collapsed) ──── */}
      <details className="rounded-[10px]" style={{ background: "#161616", border: ".5px solid #222" }}>
        <summary
          className="flex items-center gap-2 cursor-pointer select-none list-none"
          style={{ padding: "0.85rem 1.25rem", color: "#888", fontSize: 13, fontWeight: 500 }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: "#e05a2b" }} />
          Track a specific competitor
        </summary>
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          <AddCompetitorButton />
          <p style={{ color: "#555", fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
            alphaa crawls up to 20 pages and identifies their strengths, content topics, and posting frequency — updated automatically every week.
          </p>
        </div>
      </details>
    </div>
  )
}
