import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ScoreRing } from "@/components/common/ScoreRing"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatusPill, type PillVariant } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { SetupHealth } from "@/components/dashboard/SetupHealth"
import { ProgressCard, type AuditPoint, type KeywordDelta } from "@/components/dashboard/ProgressCard"
import { ShareWinButton } from "@/components/dashboard/ShareWinButton"
import { timeOfDayGreeting } from "@/lib/humanize"
import type { LucideIcon } from "lucide-react"
import {
  CheckCircle2, TrendingUp, Star, FileText, Bot, Globe, Sparkles, Search, Clock, PartyPopper,
} from "lucide-react"

export const metadata = { title: "Dashboard — alphaa" }

async function getDashboardData(userId: string) {
  return db.user.findUnique({
    where: { clerkId: userId },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { aiEngineResults: true },
      },
      mockActivity: { orderBy: { createdAt: "desc" }, take: 8 },
      integration: true,
    },
  })
}

// Compare the newest keyword batch against one ~7+ days older (or the oldest
// distinct batch). Returns top improved / declined queries with real positions.
async function getKeywordDeltas(internalUserId: string): Promise<{
  improved: KeywordDelta[]
  declined: KeywordDelta[]
}> {
  const none = { improved: [], declined: [] }
  try {
    const batches = await db.keywordRanking.groupBy({
      by: ["date"],
      where: { userId: internalUserId },
      orderBy: { date: "desc" },
      take: 30,
    })
    if (batches.length < 2) return none
    const latestDate = batches[0].date
    const weekAgo = new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const baseline =
      batches.find((b) => b.date <= weekAgo)?.date ?? batches[batches.length - 1].date
    if (baseline.getTime() === latestDate.getTime()) return none

    const [currRows, prevRows] = await Promise.all([
      db.keywordRanking.findMany({ where: { userId: internalUserId, date: latestDate } }),
      db.keywordRanking.findMany({ where: { userId: internalUserId, date: baseline } }),
    ])
    const prevByQuery = new Map(prevRows.map((r) => [r.query, r.position]))
    const deltas: KeywordDelta[] = []
    for (const row of currRows) {
      const prev = prevByQuery.get(row.query)
      if (prev === undefined) continue
      const prevPos = Math.round(prev)
      const currPos = Math.round(row.position)
      if (prevPos !== currPos) deltas.push({ query: row.query, prev: prevPos, curr: currPos })
    }
    // Lower position = better. Improved = position went down.
    const improved = deltas.filter((d) => d.curr < d.prev).sort((a, b) => (b.prev - b.curr) - (a.prev - a.curr)).slice(0, 3)
    const declined = deltas.filter((d) => d.curr > d.prev).sort((a, b) => (b.curr - b.prev) - (a.curr - a.prev)).slice(0, 2)
    return { improved, declined }
  } catch {
    return none
  }
}

// The four engines alphaa actually scans, mapped to the real audit data.
// aiEngineResults.engine ∈ {chatgpt, claude, gemini, perplexity};
// aiSearchStatus keys are {chatgpt, google_ai (Claude), gemini, perplexity}.
// (Same mapping as /dashboard/visibility/[engine].)
const AI_ENGINES: { name: string; Icon: LucideIcon; engineKey: string; statusKey: string }[] = [
  { name: "ChatGPT",    Icon: Bot,      engineKey: "chatgpt",    statusKey: "chatgpt" },
  { name: "Claude",     Icon: Globe,    engineKey: "claude",     statusKey: "google_ai" },
  { name: "Gemini",     Icon: Sparkles, engineKey: "gemini",     statusKey: "gemini" },
  { name: "Perplexity", Icon: Search,   engineKey: "perplexity", statusKey: "perplexity" },
]

type EngineState = "found" | "partial" | "missing" | "checking"

const ENGINE_PILL: Record<EngineState, { label: string; variant: PillVariant }> = {
  found:    { label: "Recommending you", variant: "found"   },
  partial:  { label: "Sometimes",        variant: "warning" },
  missing:  { label: "Not yet",          variant: "neutral" },
  checking: { label: "Checking…",        variant: "neutral" },
}

// Icon for a real activity row, picked from its type string.
function activityIcon(type: string): { Icon: LucideIcon; color: string; bg: string; border: string } {
  const t = type.toLowerCase()
  if (t.includes("win"))    return { Icon: PartyPopper, color: "#ff6b1a", bg: "#1f1206", border: "#7c3a10" }
  if (t.includes("review")) return { Icon: Star,        color: "#f59e0b", bg: "#1a1200", border: "#78350f" }
  if (t.includes("post"))   return { Icon: FileText,    color: "#22c55e", bg: "#0d2218", border: "#14532d" }
  if (t.includes("keyword") || t.includes("rank")) return { Icon: TrendingUp, color: "#22c55e", bg: "#0d2218", border: "#14532d" }
  if (t.includes("audit") || t.includes("scan") || t.includes("visibility")) return { Icon: Bot, color: "#22c55e", bg: "#0d2218", border: "#14532d" }
  return { Icon: CheckCircle2, color: "#22c55e", bg: "#0d2218", border: "#14532d" }
}

// What alphaa has actually scheduled — shown honestly as "coming up", never as done.
// Cadence mirrors the real crons (audit on signup, GBP posts daily-window,
// weekly visibility check, daily keyword sync).
const SCHEDULED_ITEMS = [
  { title: "First website audit",       when: "running now" },
  { title: "First Google post",         when: "within 24 hours" },
  { title: "Weekly AI visibility check", when: "every Wednesday" },
  { title: "Keyword sync",              when: "daily" },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  const data = await getDashboardData(userId!)

  const firstName = data?.fullName?.split(" ")[0] ?? ""

  // ── Score: only real numbers. No audit → no score, no fake delta. ──
  const audits = Array.isArray(data?.audits) ? data.audits : []
  const latestAudit = audits[0] ?? null
  const prevAudit = audits[1] ?? null
  const score = latestAudit?.visibilityScore ?? null
  const scoreDelta =
    latestAudit && prevAudit ? latestAudit.visibilityScore - prevAudit.visibilityScore : null

  // ── Activity: real ledger rows only. ──
  const activityRows = Array.isArray(data?.mockActivity) ? data.mockActivity : []

  // ── AI engine statuses from the latest audit (guarded JSON). ──
  const aiStatus: Record<string, unknown> =
    latestAudit &&
    typeof latestAudit.aiSearchStatus === "object" &&
    latestAudit.aiSearchStatus !== null &&
    !Array.isArray(latestAudit.aiSearchStatus)
      ? (latestAudit.aiSearchStatus as Record<string, unknown>)
      : {}
  const engineResults = Array.isArray(latestAudit?.aiEngineResults)
    ? latestAudit.aiEngineResults
    : []

  function engineState(engineKey: string, statusKey: string): EngineState {
    if (!latestAudit) return "checking"
    const result = engineResults.find((r) => r.engine === engineKey)
    const raw = aiStatus[statusKey]
    const status = typeof raw === "string" ? raw : null
    if (Boolean(result?.appeared) || status === "frequently" || status === "appeared") return "found"
    if (status === "occasionally") return "partial"
    return "missing"
  }

  // ── Setup health inputs (real Integration row). ──
  const integration = data?.integration ?? null
  const connected = Boolean(integration)

  // ── Progress trends: audits oldest→newest + keyword batch comparison. ──
  const auditPoints: AuditPoint[] = [...audits]
    .reverse()
    .map((a) => ({
      score: a.visibilityScore,
      createdAt: a.createdAt,
      appeared: Array.isArray(a.aiEngineResults)
        ? a.aiEngineResults.filter((r) => Boolean(r.appeared)).length
        : 0,
      total: Array.isArray(a.aiEngineResults) ? a.aiEngineResults.length : 0,
    }))
  const { improved, declined } = data
    ? await getKeywordDeltas(data.id)
    : { improved: [] as KeywordDelta[], declined: [] as KeywordDelta[] }

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>

      {/* Autopilot bar — always first */}
      <AutopilotBar
        message={
          connected
            ? "alphaa is running on autopilot — working for you in the background"
            : "alphaa is ready — connect Google to switch on full autopilot"
        }
      />

      {/* Setup health — is everything connected? */}
      <SetupHealth
        connected={connected}
        hasBusinessProfile={Boolean(integration?.gmbLocationId)}
        hasSearchData={Boolean(integration?.gscSiteUrl)}
        hasAnalytics={Boolean(integration?.gaPropertyId)}
        lastSyncedAt={integration?.lastSyncedAt ?? null}
      />

      {/* ── Header row ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff", lineHeight: 1.2 }}>
            Good {timeOfDayGreeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>
            {activityRows.length > 0
              ? "Here is what alphaa has been doing for you."
              : "alphaa is getting to know your business."}
          </p>
        </div>
        {score !== null ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444", marginTop: "4px" }}>presence score</div>
              {scoreDelta !== null && scoreDelta !== 0 && (
                <div style={{ fontSize: "11px", color: scoreDelta > 0 ? "#22c55e" : "#dc2626", marginTop: "3px" }}>
                  {scoreDelta > 0 ? `↑ +${scoreDelta}` : `↓ ${scoreDelta}`} pts since last check
                </div>
              )}
            </div>
            <ScoreRing score={score} size={64} />
          </div>
        ) : (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "28px", fontWeight: 500, color: "#444444", lineHeight: 1 }}>&mdash;</div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444", marginTop: "4px" }}>presence score</div>
            <div style={{ fontSize: "11px", color: "#555555", marginTop: "3px", maxWidth: "180px" }}>
              First audit running &mdash; your score appears here shortly
            </div>
          </div>
        )}
      </div>

      {/* ── Progress — measured proof it's working ── */}
      <SectionDivider>YOUR PROGRESS</SectionDivider>
      <ProgressCard auditPoints={auditPoints} improved={improved} declined={declined} />

      {/* ── What alphaa did — real activity ledger only ── */}
      {activityRows.length > 0 ? (
        <>
          <SectionDivider>WHAT ALPHAA DID FOR YOU</SectionDivider>
          <DsCard style={{ padding: 0 }}>
            {activityRows.map((a, i) => {
              const style = activityIcon(a.type)
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "14px 1.25rem",
                    borderBottom: i < activityRows.length - 1 ? "0.5px solid #222222" : "none",
                  }}
                >
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: style.bg, border: `1px solid ${style.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <style.Icon size={16} color={style.color} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", lineHeight: 1.4 }}>{a.title}</p>
                    <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>
                      {a.description ?? "Done for you by alphaa — nothing for you to do"}
                    </p>
                    {a.type === "win" && (
                      <div style={{ marginTop: "8px" }}>
                        <ShareWinButton winId={a.id} headline={a.title.replace(/^🎉\s*/u, "")} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "#555555", flexShrink: 0, marginTop: "2px" }}>
                    {a.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )
            })}
          </DsCard>
        </>
      ) : (
        /* Honest Week 1 state — nothing done yet, show what is scheduled */
        <>
          <SectionDivider>WEEK 1 — ALPHAA IS LEARNING YOUR BUSINESS</SectionDivider>
          <DsCard style={{ padding: 0 }}>
            <div style={{ padding: "14px 1.25rem", borderBottom: "0.5px solid #222222" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                Nothing to report yet &mdash; and that&apos;s normal
              </p>
              <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>
                alphaa is learning your business. Every action it takes will show up here, so
                you always know exactly what was done. Here&apos;s what&apos;s coming up:
              </p>
            </div>
            {SCHEDULED_ITEMS.map((item, i) => (
              <div
                key={item.title}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 1.25rem",
                  borderBottom: i < SCHEDULED_ITEMS.length - 1 ? "0.5px solid #222222" : "none",
                }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Clock size={14} color="#888888" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", lineHeight: 1.4 }}>{item.title}</p>
                  <p style={{ fontSize: "12px", color: "#888888", marginTop: "1px" }}>{item.when}</p>
                </div>
                <StatusPill variant="neutral">Scheduled</StatusPill>
              </div>
            ))}
          </DsCard>
          <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px" }}>
            Scheduled means coming up &mdash; not done yet. Completed work appears here as it happens.
          </p>
        </>
      )}

      {/* ── Where people find you — driven by the latest audit ── */}
      <SectionDivider>WHERE PEOPLE FIND YOU</SectionDivider>
      <DsCard style={{ padding: 0 }}>
        {AI_ENGINES.map((e, i) => {
          const state = engineState(e.engineKey, e.statusKey)
          const pill = ENGINE_PILL[state]
          return (
            <div
              key={e.name}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 1.25rem",
                borderBottom: i < AI_ENGINES.length - 1 ? "0.5px solid #222222" : "none",
              }}
            >
              <e.Icon size={16} color={state === "found" ? "#22c55e" : "#888888"} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "14px", color: "#ffffff", flex: 1 }}>{e.name}</span>
              <StatusPill variant={pill.variant}>{pill.label}</StatusPill>
            </div>
          )
        })}
      </DsCard>
      <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px" }}>
        {latestAudit
          ? "Based on your latest visibility check. alphaa re-checks every week."
          : "Your first visibility check is running — results appear here shortly."}
      </p>

    </div>
  )
}
