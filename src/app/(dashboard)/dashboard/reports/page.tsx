export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import {
  Mail, CheckCircle2, TrendingUp, TrendingDown, Minus,
  FileText, ArrowRight,
} from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"

export const metadata = { title: "Reports" }

type KeywordMover = {
  query: string
  positionBefore: number
  positionAfter: number
  change: number
}

type VisibilityDelta = Record<string, number>

const ENGINE_META: Record<string, { label: string }> = {
  chatgpt:    { label: "ChatGPT" },
  perplexity: { label: "Perplexity" },
  google_ai:  { label: "Google AI" },
  gemini:     { label: "Gemini" },
}

function formatWeek(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function DeltaText({ value }: { value: number }) {
  if (value > 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#22c55e", fontSize: "11px", fontWeight: 500 }}>
      <TrendingUp size={12} />+{value}
    </span>
  )
  if (value < 0) return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#dc2626", fontSize: "11px", fontWeight: 500 }}>
      <TrendingDown size={12} />{value}
    </span>
  )
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#555555", fontSize: "11px" }}>
      <Minus size={12} />no change
    </span>
  )
}

export default async function ReportsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    select: { id: true, businessName: true, email: true },
  })

  const reports = user
    ? await db.weeklyReport.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>

      <AutopilotBar message="Reports are generated and emailed to you automatically every Monday morning" />

      {/* ── Page heading ─────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>Weekly reports</h1>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "4px" }}>
          Every Monday morning, alphaa sends you a plain-English summary of the week. No login needed.
        </p>
      </div>

      {/* ── Empty state ───────────────────────────── */}
      {reports.length === 0 && (
        <DsCard>
          <EmptyState
            icon={Mail}
            title="Your first report arrives Monday"
            body="Every Monday alphaa emails you a summary: posts published, reviews received, keywords moved, AI visibility changes. Everything in plain English — no login required to read it."
            sub={`Reports delivered to: ${user?.email ?? "your inbox"}`}
          />
        </DsCard>
      )}

      {/* ── Report list ───────────────────────────── */}
      {reports.length > 0 && (
        <>
          <SectionDivider>YOUR WEEKLY SUMMARIES</SectionDivider>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reports.map((report, idx) => {
              const visibilityDelta = (report.visibilityDelta ?? {}) as VisibilityDelta
              const keywordMovers   = Array.isArray(report.keywordMovers) ? (report.keywordMovers as KeywordMover[]) : []
              const topMovers       = keywordMovers.slice(0, 4)
              const isLatest        = idx === 0

              return (
                <DsCard key={report.id}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={14} color="#888888" />
                        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                          Week of {formatWeek(report.createdAt)}
                        </h3>
                        {isLatest && <StatusPill variant="info">Latest</StatusPill>}
                      </div>
                      {report.summary && (
                        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "6px", maxWidth: "560px" }}>
                          {report.summary}
                        </p>
                      )}
                    </div>
                    {report.emailSent && (
                      <StatusPill variant="found">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Mail size={11} /> Emailed to you
                        </span>
                      </StatusPill>
                    )}
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "8px",
                      marginTop: "14px",
                    }}
                  >
                    <StatBox value={report.postsPublished} label="Posts published" tone="default" />
                    <StatBox value={report.reviewsNew} label="New reviews" tone="default" />
                  </div>

                  {/* AI visibility */}
                  {Object.keys(visibilityDelta).length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444", marginBottom: "8px" }}>
                        AI visibility this week
                      </p>
                      <div
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #222222",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {Object.entries(visibilityDelta).map(([engine, delta]) => {
                          const meta = ENGINE_META[engine]
                          return (
                            <div key={engine} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                              <span style={{ fontSize: "13px", color: "#888888" }}>{meta?.label ?? engine}</span>
                              <DeltaText value={delta} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Keyword movers */}
                  {topMovers.length > 0 && (
                    <div style={{ marginTop: "14px" }}>
                      <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444", marginBottom: "8px" }}>
                        Keywords on the move
                      </p>
                      <div
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #222222",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {topMovers.map((k) => (
                          <div key={k.query} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                            <span style={{ fontSize: "13px", color: "#888888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {k.query}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 500,
                                flexShrink: 0,
                                color: k.change > 0 ? "#22c55e" : k.change < 0 ? "#dc2626" : "#555555",
                              }}
                            >
                              {k.change > 0 ? "+" : ""}{k.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "0.5px solid #222222" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#555555" }}>
                      <CheckCircle2 size={12} color="#22c55e" />
                      Generated automatically — nothing needed from you
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: 500, color: "#e05a2b" }}>
                      View report <ArrowRight size={13} />
                    </span>
                  </div>
                </DsCard>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
