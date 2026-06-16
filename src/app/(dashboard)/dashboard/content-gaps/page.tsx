export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Lightbulb, TrendingUp } from "lucide-react"
import AnalyzeGapsButton from "./AnalyzeGapsButton"
import type { GapItem } from "@/lib/content-gaps"
import { formatDate } from "@/lib/utils"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { StatBox } from "@/components/dashboard/StatBox"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"

export const metadata = { title: "Content ideas" }

const PRIORITY_META = {
  high:   { label: "High priority",   accent: "#dc2626", pill: "error"   as const, divider: "Worth doing first" },
  medium: { label: "Medium priority", accent: "#f59e0b", pill: "warning" as const, divider: "Good to cover next" },
  low:    { label: "Low priority",    accent: "#3b82f6", pill: "info"    as const, divider: "Nice to have" },
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

  return (
    <div style={{ maxWidth: "896px", margin: "0 auto" }}>
      <AutopilotBar message="alphaa checks what your competitors rank for and finds your gaps automatically" />

      {/* ── Page header ──────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>Content ideas</h1>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "4px" }}>
          Topics your competitors rank for that you are missing. alphaa finds the gaps.
        </p>
      </div>

      {!latestGap ? (
        /* ── Empty state ─────────────────────────── */
        <DsCard style={{ padding: 0 }}>
          <EmptyState
            icon={Lightbulb}
            title="alphaa will find content topics your competitors rank for"
            body="Paste a competitor's website and alphaa surfaces the topics they show up for that you are missing — with suggested titles and outlines ready to use."
          >
            <div style={{ width: "100%", maxWidth: "560px", marginTop: "6px" }}>
              <AnalyzeGapsButton prominent />
            </div>
          </EmptyState>
        </DsCard>
      ) : (
        <>
          {/* ── Results summary ─────────────────────── */}
          <DsCard style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Lightbulb size={15} color="#e05a2b" />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                    alphaa found {gaps.length} topic{gaps.length !== 1 ? "s" : ""} for you
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "#555555", lineHeight: 1.6 }}>
                  Compared against <span style={{ color: "#888888" }}>{latestGap.competitorUrl}</span> · {formatDate(latestGap.analyzedAt)}
                </p>
              </div>
              <StatusPill variant="found">Up to date</StatusPill>
            </div>

            {/* Priority breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "16px" }}>
              <StatBox value={highGaps.length}   label="High priority"   tone="danger" />
              <StatBox value={mediumGaps.length} label="Medium priority" tone="warning" />
              <StatBox value={lowGaps.length}    label="Low priority"    tone="default" />
            </div>

            {latestGap.summary && (
              <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "16px", paddingTop: "16px", borderTop: "0.5px solid #222222" }}>
                {latestGap.summary}
              </p>
            )}
          </DsCard>

          {/* ── Re-check against another competitor ─── */}
          <DsCard style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#444444", marginBottom: "8px" }}>
              Find topics your competitors rank for
            </p>
            <AnalyzeGapsButton />
            <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px", lineHeight: 1.6 }}>
              alphaa will find topics they rank for that you are missing — with suggested titles and outlines ready to use.
            </p>
          </DsCard>

          {/* ── Gap groups ──────────────────────────── */}
          {([
            { priority: "high",   items: highGaps   },
            { priority: "medium", items: mediumGaps },
            { priority: "low",    items: lowGaps    },
          ] as const).map(({ priority, items }) => {
            if (items.length === 0) return null
            const meta = PRIORITY_META[priority]
            return (
              <div key={priority}>
                <SectionDivider>{meta.label}</SectionDivider>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map((gap, i) => (
                    <DsCard key={i} accent={meta.accent}>
                      {/* Topic + priority */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                        <StatusPill variant={meta.pill}>{meta.label}</StatusPill>
                        {gap.topic && (
                          <span style={{ fontSize: "11px", color: "#555555" }}>{gap.topic}</span>
                        )}
                      </div>

                      {/* Suggested title */}
                      <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff", lineHeight: 1.4, marginBottom: "12px" }}>
                        {gap.suggestedTitle}
                      </h3>

                      {/* Outline */}
                      {gap.suggestedOutline.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                          {gap.suggestedOutline.map((point, j) => (
                            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                              <span style={{ fontSize: "11px", color: "#444444", marginTop: "2px", flexShrink: 0 }}>{j + 1}.</span>
                              <span style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>{point}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Impact */}
                      {gap.estimatedImpact && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "12px", borderTop: "0.5px solid #222222" }}>
                          <TrendingUp size={13} color="#555555" />
                          <span style={{ fontSize: "11px", color: "#555555" }}>{gap.estimatedImpact}</span>
                        </div>
                      )}
                    </DsCard>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
