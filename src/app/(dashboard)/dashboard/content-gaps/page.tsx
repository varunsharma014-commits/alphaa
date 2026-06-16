export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Lightbulb, Search } from "lucide-react"
import AnalyzeGapsButton from "./AnalyzeGapsButton"
import AddToCalendarButton from "./AddToCalendarButton"
import type { GapItem } from "@/lib/content-gaps"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import type { PillVariant } from "@/components/dashboard/StatusPill"

export const metadata = { title: "Content ideas" }

const PRIORITY_META: Record<
  GapItem["priority"],
  { label: string; pill: PillVariant; accent: string }
> = {
  high:   { label: "High opportunity", pill: "found",   accent: "#22c55e" },
  medium: { label: "Medium",           pill: "warning", accent: "#f59e0b" },
  low:    { label: "Lower priority",   pill: "neutral", accent: "#3b3b3b" },
}

const PRIORITY_ORDER: GapItem["priority"][] = ["high", "medium", "low"]

export default async function ContentGapsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/sign-in")

  const latestGap = await db.contentGap.findFirst({
    where: { userId: user.id },
    orderBy: { analyzedAt: "desc" },
  })

  const gaps = Array.isArray(latestGap?.gaps)
    ? (latestGap.gaps as unknown as GapItem[])
    : []

  const hasGaps = gaps.length > 0

  // Sort gaps high → medium → low for presentation.
  const sortedGaps = [...gaps].sort(
    (a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  )

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

      {!hasGaps ? (
        /* ── Auto-analyzing / loading state (no input) ─────────── */
        <DsCard style={{ padding: 0 }}>
          <EmptyState
            icon={Lightbulb}
            title="alphaa is analyzing your competitors' content…"
            body="We'll have your content gaps ready in a few minutes — topics your competitors rank for that you're missing, with suggested titles and outlines ready to use."
          />
        </DsCard>
      ) : (
        <>
          {/* ── Hero heading ───────────────────────── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "18px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "#1a1a1a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Lightbulb size={17} color="#e05a2b" />
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#ffffff", lineHeight: 1.45, marginTop: "4px" }}>
              alphaa found {gaps.length} content gap{gaps.length !== 1 ? "s" : ""} — topics your competitors rank for that you&apos;re missing.
            </h2>
          </div>

          {/* ── Gap cards ──────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {sortedGaps.map((gap, i) => {
              const meta = PRIORITY_META[gap.priority] ?? PRIORITY_META.medium
              const outline = Array.isArray(gap.suggestedOutline)
                ? gap.suggestedOutline.slice(0, 2)
                : []
              return (
                <DsCard key={i} accent={meta.accent}>
                  {/* Priority pill */}
                  <div style={{ marginBottom: "10px" }}>
                    <StatusPill variant={meta.pill}>{meta.label}</StatusPill>
                  </div>

                  {/* Suggested title */}
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", lineHeight: 1.4, marginBottom: "8px" }}>
                    {gap.suggestedTitle}
                  </h3>

                  {/* First 1–2 outline lines */}
                  {outline.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
                      {outline.map((point, j) => (
                        <p key={j} style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>
                          {point}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Generic competitor line (no fabricated counts) */}
                  <p style={{ fontSize: "11px", color: "#555555", lineHeight: 1.6, marginBottom: "14px" }}>
                    Your competitors rank for this — you don&apos;t yet.
                  </p>

                  {/* Add to calendar */}
                  <AddToCalendarButton title={gap.suggestedTitle} />
                </DsCard>
              )
            })}
          </div>

          {/* ── Secondary: analyze a specific competitor ─── */}
          <SectionDivider>More</SectionDivider>
          <DsCard>
            <details>
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#cccccc",
                  listStyle: "none",
                }}
              >
                <Search size={14} color="#888888" />
                Analyze a specific competitor
              </summary>
              <div style={{ marginTop: "14px" }}>
                <AnalyzeGapsButton />
                <p style={{ fontSize: "11px", color: "#555555", marginTop: "8px", lineHeight: 1.6 }}>
                  Paste a competitor&apos;s website and alphaa will find the topics they rank for that you are missing.
                </p>
              </div>
            </details>
          </DsCard>
        </>
      )}
    </div>
  )
}
