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
  high:   { label: "High opportunity", pill: "found",   accent: "var(--ds-ok)" },
  medium: { label: "Medium",           pill: "warning", accent: "var(--ds-warn)" },
  low:    { label: "Lower priority",   pill: "neutral", accent: "var(--ds-border-3)" },
}

const PRIORITY_ORDER: GapItem["priority"][] = ["high", "medium", "low"]

// ContentGap.gaps is an untyped Json array holding two different item shapes:
// the original idea items (GapItem) and drafts written from the Competitors
// page (WinGapItem — identified by a `draft` string). Read both defensively so
// a stray or partial item can never crash this page.
type DraftItem = {
  gap: string
  title: string
  format: string
  targetQuestion: string
  draft: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function asDraftItem(v: unknown): DraftItem | null {
  if (!isRecord(v)) return null
  if (typeof v.draft !== "string" || !v.draft.trim()) return null
  return {
    gap: typeof v.gap === "string" ? v.gap : "",
    title: typeof v.title === "string" && v.title.trim() ? v.title : "Untitled draft",
    format: typeof v.format === "string" ? v.format : "Blog post",
    targetQuestion: typeof v.targetQuestion === "string" ? v.targetQuestion : "",
    draft: v.draft,
  }
}

function asIdeaItem(v: unknown): GapItem | null {
  if (!isRecord(v)) return null
  if (typeof v.draft === "string") return null // it's a draft, not an idea
  if (typeof v.suggestedTitle !== "string" || !v.suggestedTitle.trim()) return null
  return {
    topic: typeof v.topic === "string" ? v.topic : "",
    priority: (["high", "medium", "low"].includes(String(v.priority))
      ? v.priority
      : "medium") as GapItem["priority"],
    suggestedTitle: v.suggestedTitle,
    suggestedOutline: Array.isArray(v.suggestedOutline)
      ? v.suggestedOutline.filter((o): o is string => typeof o === "string")
      : [],
    estimatedImpact: typeof v.estimatedImpact === "string" ? v.estimatedImpact : "",
  }
}

export default async function ContentGapsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  const records = await db.contentGap.findMany({
    where: { userId: user.id },
    orderBy: { analyzedAt: "desc" },
  })

  const latestGap = records[0]

  // Ideas come from the most recent analysis run.
  const gaps: GapItem[] = (Array.isArray(latestGap?.gaps) ? (latestGap.gaps as unknown[]) : [])
    .map(asIdeaItem)
    .filter((g): g is GapItem => g !== null)

  // Drafts written from the Competitors page can live on any row (one row per
  // competitor URL), so collect them across every record.
  const drafts: DraftItem[] = records.flatMap((r) =>
    (Array.isArray(r.gaps) ? (r.gaps as unknown[]) : [])
      .map(asDraftItem)
      .filter((d): d is DraftItem => d !== null)
  )

  const hasGaps = gaps.length > 0 || drafts.length > 0

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
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>Content ideas</h1>
        <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "4px" }}>
          Topics your competitors rank for that you are missing. alphaa finds the gaps.
        </p>
      </div>

      {!hasGaps ? (
        /* ── No ideas yet — say what will appear + offer the one available action ── */
        <>
          <DsCard style={{ padding: 0 }}>
            <EmptyState
              icon={Lightbulb}
              title="Your content ideas will appear here"
              body="As alphaa studies your competitors, it lists the topics they rank for that you're missing — each with a ready-to-use title. This happens automatically once alphaa finds your competitors."
              sub="Nothing to do — but if you want ideas right now, point alphaa at a competitor below."
            />
          </DsCard>
          <SectionDivider>GET IDEAS NOW</SectionDivider>
          <DsCard>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ds-text-strong)", marginBottom: "10px" }}>
              Know a competitor? Paste their website and alphaa finds your gaps in about a minute.
            </p>
            <AnalyzeGapsButton />
          </DsCard>
        </>
      ) : (
        <>
          {/* ── Hero heading ───────────────────────── */}
          {gaps.length > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "18px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--ds-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lightbulb size={17} color="var(--ds-accent)" />
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ds-text)", lineHeight: 1.45, marginTop: "4px" }}>
                alphaa found {gaps.length} content gap{gaps.length !== 1 ? "s" : ""} — topics your competitors rank for that you&apos;re missing.
              </h2>
            </div>
          )}

          {/* ── Drafts written to win a competitor gap ── */}
          {drafts.length > 0 && (
            <>
              <SectionDivider>Drafts alphaa wrote for you</SectionDivider>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "8px" }}>
                {drafts.map((d, i) => (
                  <DsCard key={`draft-${i}`} accent="var(--ds-accent)">
                    <div style={{ marginBottom: "10px" }}>
                      <StatusPill variant="info">{d.format}</StatusPill>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ds-text)", lineHeight: 1.4, marginBottom: "8px" }}>
                      {d.title}
                    </h3>
                    {d.targetQuestion && (
                      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginBottom: "8px" }}>
                        Answers the customer question: &quot;{d.targetQuestion}&quot;
                      </p>
                    )}
                    <details>
                      <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 500, color: "var(--ds-accent)", listStyle: "none" }}>
                        Read the draft
                      </summary>
                      <pre
                        style={{
                          fontSize: "12px",
                          color: "var(--ds-text-mute)",
                          lineHeight: 1.7,
                          marginTop: "10px",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          fontFamily: "inherit",
                          background: "var(--ds-surface)",
                          border: ".5px solid var(--ds-border)",
                          borderRadius: "8px",
                          padding: "10px",
                        }}
                      >
                        {d.draft}
                      </pre>
                    </details>
                    <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", lineHeight: 1.6, marginTop: "12px" }}>
                      alphaa can&apos;t publish to your website. Copy this into your site, or send it to
                      whoever manages your website. Fill in anything in [square brackets] first.
                    </p>
                  </DsCard>
                ))}
              </div>
            </>
          )}

          {/* ── Gap cards ──────────────────────────── */}
          {gaps.length > 0 && <SectionDivider>Content ideas</SectionDivider>}
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
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ds-text)", lineHeight: 1.4, marginBottom: "8px" }}>
                    {gap.suggestedTitle}
                  </h3>

                  {/* First 1–2 outline lines */}
                  {outline.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
                      {outline.map((point, j) => (
                        <p key={j} style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6 }}>
                          {point}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Generic competitor line (no fabricated counts) */}
                  <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", lineHeight: 1.6, marginBottom: "14px" }}>
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
                  color: "var(--ds-text-strong)",
                  listStyle: "none",
                }}
              >
                <Search size={14} color="var(--ds-text-mute)" />
                Analyze a specific competitor
              </summary>
              <div style={{ marginTop: "14px" }}>
                <AnalyzeGapsButton />
                <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "8px", lineHeight: 1.6 }}>
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
