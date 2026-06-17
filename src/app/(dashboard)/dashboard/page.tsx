import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { ScoreRing } from "@/components/common/ScoreRing"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { timeOfDayGreeting } from "@/lib/humanize"
import {
  CheckCircle2, AlertCircle,
  TrendingUp, Star, FileText, Bot,
} from "lucide-react"

export const metadata = { title: "Dashboard — alphaa" }

async function getDashboardData(userId: string) {
  return db.user.findUnique({
    where: { clerkId: userId },
    include: {
      audits:       { orderBy: { createdAt: "desc" }, take: 1 },
      mockActivity: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  })
}

const AI_ENGINES = [
  { name: "ChatGPT",    icon: "🤖", status: "appearing" as const },
  { name: "Google AI",  icon: "🌐", status: "appearing" as const },
  { name: "Perplexity", icon: "🔍", status: "partial"   as const },
  { name: "Gemini",     icon: "✨", status: "missing"   as const },
] as const

type EngineStatus = "appearing" | "partial" | "missing"

const ENGINE_STATUS: Record<EngineStatus, { label: string; variant: "found" | "warning" | "error" }> = {
  appearing: { label: "Recommending you", variant: "found"   },
  partial:   { label: "Sometimes",        variant: "warning" },
  missing:   { label: "Not yet",          variant: "error"   },
}

// Completed work cards — driven by mockActivity when present, otherwise a
// representative weekly summary. (Presentation only — no data logic changed.)
const WORK_CARDS = [
  { icon: CheckCircle2, color: "#22c55e", bg: "#0d2218", border: "#14532d", title: "3 Google posts published for you", subtitle: "Written in your voice, posted by alphaa" },
  { icon: Bot,          color: "#22c55e", bg: "#0d2218", border: "#14532d", title: "You appeared on ChatGPT for the first time", subtitle: "alphaa got you mentioned when people search" },
  { icon: Star,         color: "#f59e0b", bg: "#1a1200", border: "#78350f", title: "2 new reviews this week", subtitle: "Average 4.8 stars across your profile" },
  { icon: TrendingUp,   color: "#22c55e", bg: "#0d2218", border: "#14532d", title: "You moved up on 5 keywords", subtitle: "alphaa is climbing your search rankings" },
  { icon: FileText,     color: "#22c55e", bg: "#0d2218", border: "#14532d", title: "alphaa fixed 4 website issues", subtitle: "Quietly improved behind the scenes" },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  const data = await getDashboardData(userId!)

  const score       = data?.audits?.[0]?.visibilityScore ?? 48
  const scoreChange = 4
  const firstName   = data?.fullName?.split(" ")[0] ?? ""

  // First-run = no audit has ever run AND no activity recorded yet.
  const isFirstRun = !data?.audits?.length && !data?.mockActivity?.length

  // Build the "what alphaa did" list from real activity when available,
  // falling back to the representative weekly summary.
  const activity = data?.mockActivity?.length
    ? data.mockActivity.map((a: { id: string; title: string; description: string | null }) => ({
        key: a.id,
        icon: CheckCircle2, color: "#22c55e", bg: "#0d2218", border: "#14532d",
        title: a.title, subtitle: a.description ?? "Done for you by alphaa — nothing for you to do",
      }))
    : WORK_CARDS.map((c, i) => ({ key: String(i), ...c }))

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>

      {/* Autopilot bar — always first */}
      <AutopilotBar message="alphaa is running on autopilot — next action scheduled this week" />

      {/* ── Header row ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff", lineHeight: 1.2 }}>
            Good {timeOfDayGreeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p style={{ fontSize: "12px", color: "#555555", marginTop: "4px" }}>
            alphaa worked while you slept. Here is your update.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 500, color: "#ffffff", lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444", marginTop: "4px" }}>presence score</div>
            <div style={{ fontSize: "11px", color: "#22c55e", marginTop: "3px" }}>↑ +{scoreChange} pts this week</div>
          </div>
          <ScoreRing score={score} size={64} />
        </div>
      </div>

      {isFirstRun ? (
        /* ── First-run: getting started checklist ───── */
        <>
          <SectionDivider>GETTING STARTED — 3 STEPS TO GO LIVE</SectionDivider>
          <DsCard>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#0d2218", border: "1px solid #14532d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>Your business details</p>
                  <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>Saved — alphaa knows who you are.</p>
                </div>
                <StatusPill variant="found">Done</StatusPill>
              </div>

              <div style={{ height: "1px", background: "#222222" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", color: "#888888", fontWeight: 500 }}>2</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>Connect Google (1 click)</p>
                  <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>This lets alphaa post and track results for you.</p>
                </div>
                <a href="/dashboard/settings" style={{ background: "#e05a2b", color: "#ffffff", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
                  Connect Google →
                </a>
              </div>

              <div style={{ height: "1px", background: "#222222" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", color: "#888888", fontWeight: 500 }}>3</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>alphaa starts working</p>
                  <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>Automatic after step 2 — you do not need to do anything.</p>
                </div>
                <StatusPill variant="neutral">Automatic</StatusPill>
              </div>

            </div>
          </DsCard>
          <p style={{ fontSize: "11px", color: "#555555", marginTop: "10px", textAlign: "center" }}>
            Most businesses get their first AI mention within 11 days of completing setup.
          </p>
        </>
      ) : (
        /* ── Normal: weekly progress ─────────────────── */
        <>
          {/* Needs attention */}
          <DsCard accent="#f59e0b" style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>2 reviews are waiting for a reply</p>
                <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>
                  alphaa wrote the replies — tap to approve in 30 seconds.
                </p>
              </div>
              <a href="/dashboard/reviews" style={{ background: "#e05a2b", color: "#ffffff", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
                Review replies →
              </a>
            </div>
          </DsCard>

          <SectionDivider>WHAT ALPHAA DID THIS WEEK</SectionDivider>
          <DsCard style={{ padding: 0 }}>
            {activity.map((a, i) => (
              <div
                key={a.key}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  padding: "14px 1.25rem",
                  borderBottom: i < activity.length - 1 ? "0.5px solid #222222" : "none",
                }}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: a.bg, border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <a.icon size={16} color={a.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", lineHeight: 1.4 }}>{a.title}</p>
                  <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "2px" }}>{a.subtitle}</p>
                </div>
              </div>
            ))}
          </DsCard>

          <SectionDivider>WHERE PEOPLE FIND YOU</SectionDivider>
          <DsCard style={{ padding: 0 }}>
            {AI_ENGINES.map((e, i) => {
              const s = ENGINE_STATUS[e.status]
              return (
                <div
                  key={e.name}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 1.25rem",
                    borderBottom: i < AI_ENGINES.length - 1 ? "0.5px solid #222222" : "none",
                  }}
                >
                  <span style={{ fontSize: "16px", width: "22px", textAlign: "center", flexShrink: 0 }}>{e.icon}</span>
                  <span style={{ fontSize: "14px", color: "#ffffff", flex: 1 }}>{e.name}</span>
                  <StatusPill variant={s.variant}>{s.label}</StatusPill>
                </div>
              )
            })}
          </DsCard>
          <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px" }}>
            alphaa is working to improve this every week.
          </p>
        </>
      )}

    </div>
  )
}
