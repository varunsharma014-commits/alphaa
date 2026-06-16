export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import GenerateSchemaButton from "./GenerateSchemaButton"
import CopyButton from "./CopyButton"
import type { AuditIssue } from "@/types/audit"
import type { SchemaItem } from "@/lib/schema-generator"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { humanizeIssue } from "@/lib/humanize"
import { CheckCircle2, Gauge, Wrench, Code2 } from "lucide-react"

export const metadata = { title: "Website health" }

type CrawlIssue = {
  severity: "critical" | "warning" | "improvement"
  message?: string
  type?: string
  code?: string
  [key: string]: unknown
}

// PageSpeed API types
type PageSpeedAudit = {
  id: string
  title: string
  description: string
  score: number | null
  displayValue?: string
}

type PageSpeedResult = {
  lighthouseResult: {
    categories: { performance: { score: number } }
    audits: Record<string, PageSpeedAudit>
  }
}

const CWV_AUDIT_IDS = [
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
] as const

function cwvFriendlyName(id: string): string {
  if (id === "largest-contentful-paint") return "Page load speed"
  if (id === "total-blocking-time") return "Responsiveness"
  if (id === "cumulative-layout-shift") return "Layout stability"
  return id
}

function cwvSubtitle(id: string): string {
  if (id === "largest-contentful-paint") return "How fast the main content appears"
  if (id === "total-blocking-time") return "How quickly your page reacts to taps"
  if (id === "cumulative-layout-shift") return "How steady the page is while loading"
  return ""
}

// Plain-English label + tone for a Core Web Vital value.
function cwvStatus(id: string, displayValue: string | undefined): {
  label: string
  variant: "found" | "warning" | "error"
} {
  const val = parseFloat(displayValue ?? "")
  if (Number.isNaN(val)) return { label: "Checking", variant: "warning" }
  if (id === "largest-contentful-paint") {
    if (val <= 2.5) return { label: "Good", variant: "found" }
    if (val <= 4) return { label: "Could be faster", variant: "warning" }
    return { label: "Needs work", variant: "error" }
  }
  if (id === "total-blocking-time") {
    if (val <= 100) return { label: "Good", variant: "found" }
    if (val <= 300) return { label: "Could be faster", variant: "warning" }
    return { label: "Needs work", variant: "error" }
  }
  if (id === "cumulative-layout-shift") {
    if (val <= 0.1) return { label: "Good", variant: "found" }
    if (val <= 0.25) return { label: "Could be steadier", variant: "warning" }
    return { label: "Needs work", variant: "error" }
  }
  return { label: "Checking", variant: "warning" }
}

const SEV_DOT: Record<string, string> = {
  critical: "#dc2626",
  warning: "#f59e0b",
  improvement: "#3b82f6",
}

// Map an issue to a plain-English line. Prefer humanizing a code; otherwise use
// the human-written message already stored on the issue.
function issueText(issue: CrawlIssue): string {
  const code = issue.code ?? issue.type
  if (code && typeof code === "string") {
    const humanized = humanizeIssue(code)
    // humanizeIssue returns a generic fallback for unknown codes — in that case
    // prefer the stored message if we have one.
    if (issue.message && humanized.startsWith("A technical issue")) return issue.message
    return humanized
  }
  return issue.message ?? "A technical issue was found on your site — alphaa is working on a fix"
}

export default async function AuditPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/sign-in")

  // Fetch latest schema markup
  const latestSchema = await db.schemaMarkup.findFirst({
    where: { userId: user.id },
    orderBy: { generatedAt: "desc" },
  })
  const schemas = (latestSchema?.schemas as unknown as SchemaItem[]) ?? []

  // Fetch latest crawl result
  const latestCrawl = await db.crawlResult.findFirst({
    where: { userId: user.id },
    orderBy: { crawledAt: "desc" },
  })
  const crawlIssues = (latestCrawl?.issues as unknown as CrawlIssue[]) ?? []
  const metaIssues = (latestCrawl?.metaIssues as unknown as CrawlIssue[]) ?? []
  const allCrawlIssues = [...crawlIssues, ...metaIssues]

  // Fetch latest audit issues
  const latestAudit = await db.audit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  const auditIssues = (latestAudit?.issues as unknown as AuditIssue[]) ?? []

  // Combined plain-English issue list (crawl + AI audit), sorted by severity.
  const sevRank: Record<string, number> = { critical: 0, warning: 1, improvement: 2 }
  const combinedIssues: { severity: string; text: string }[] = [
    ...allCrawlIssues.map((i) => ({ severity: i.severity, text: issueText(i) })),
    ...auditIssues.map((i) => ({ severity: i.severity, text: i.headline })),
  ].sort((a, b) => (sevRank[a.severity] ?? 1) - (sevRank[b.severity] ?? 1))

  // Stat-row numbers (plain English).
  const pagesChecked = latestCrawl?.pagesScanned ?? 0
  const brokenLinks = allCrawlIssues.filter((i) => i.severity === "critical").length
  const missingDescriptions = allCrawlIssues.filter((i) => i.severity === "warning").length
  const issuesFixed = auditIssues.filter((i) => i.fix_summary).length

  // PageSpeed data — fetched safely, never leaks raw errors to the user.
  let pageSpeed: PageSpeedResult | null = null
  let speedAvailable = false
  try {
    if (user.websiteUrl) {
      const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
        user.websiteUrl
      )}&strategy=mobile`
      const psRes = await fetch(psUrl, { cache: "no-store" })
      if (psRes.ok) {
        pageSpeed = (await psRes.json()) as PageSpeedResult
        speedAvailable = true
      }
    }
  } catch {
    speedAvailable = false
  }

  let audits: Record<string, PageSpeedAudit> = {}
  let perfPct: number | null = null
  try {
    audits = pageSpeed?.lighthouseResult?.audits ?? {}
    const perfScore = pageSpeed?.lighthouseResult?.categories?.performance?.score ?? null
    perfPct = perfScore !== null ? Math.round(perfScore * 100) : null
  } catch {
    speedAvailable = false
  }

  const hasAnyData = Boolean(latestCrawl || latestAudit)

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <AutopilotBar message="alphaa crawled your site today and flagged issues in plain English below" />

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>Website health</h1>
          <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px", lineHeight: 1.6 }}>
            alphaa checks your site every week and flags anything that could hurt your visibility.
            {latestCrawl ? ` Last checked ${formatDate(latestCrawl.crawledAt)}.` : ""}
          </p>
        </div>
        <GenerateSchemaButton />
      </div>

      {/* ── Stat row ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "8px" }}>
        <StatBox value={pagesChecked} label="Pages checked" tone="default" />
        <StatBox
          value={brokenLinks}
          label="Broken links"
          tone={brokenLinks > 0 ? "danger" : "success"}
        />
        <StatBox
          value={missingDescriptions}
          label="Missing descriptions"
          tone={missingDescriptions > 0 ? "warning" : "success"}
        />
        <StatBox value={issuesFixed} label="Issues fixed this month" tone="success" />
      </div>

      {/* ── Page speed ──────────────────────────────────────── */}
      <SectionDivider>PAGE SPEED</SectionDivider>
      {speedAvailable && Object.keys(audits).length > 0 ? (
        <DsCard>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <Gauge size={15} color="#e05a2b" />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
              How fast your site feels to visitors
            </span>
            {perfPct !== null && (
              <StatusPill variant={perfPct >= 70 ? "found" : perfPct >= 50 ? "warning" : "error"}>
                {perfPct >= 70 ? "Fast" : perfPct >= 50 ? "Okay" : "Slow"} · {perfPct}/100
              </StatusPill>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {CWV_AUDIT_IDS.map((id) => {
              const audit = audits[id]
              if (!audit) return null
              const status = cwvStatus(id, audit.displayValue)
              return (
                <div
                  key={id}
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #222222",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#888888", marginBottom: "4px" }}>
                    {cwvFriendlyName(id)}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff", lineHeight: 1.1 }}>
                    {audit.displayValue ?? "—"}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <StatusPill variant={status.variant}>{status.label}</StatusPill>
                  </div>
                  <div style={{ fontSize: "11px", color: "#555555", marginTop: "8px", lineHeight: 1.5 }}>
                    {cwvSubtitle(id)}
                  </div>
                </div>
              )
            })}
          </div>
        </DsCard>
      ) : (
        <DsCard>
          <div style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>
            Speed data updates shortly — we check this weekly and you will see it here next time.
          </div>
        </DsCard>
      )}

      {/* ── Issues list ─────────────────────────────────────── */}
      <SectionDivider>WHAT WE FOUND</SectionDivider>
      {combinedIssues.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {combinedIssues.map((issue, i) => {
            // "Improvement"/"warning" crawl + AI items are handled automatically by
            // alphaa. Critical items may need owner input.
            const automatic = issue.severity !== "critical"
            return (
              <DsCard key={i}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: SEV_DOT[issue.severity] ?? "#f59e0b",
                      flexShrink: 0,
                      marginTop: "5px",
                    }}
                  />
                  <p style={{ flex: 1, fontSize: "13px", color: "#cccccc", lineHeight: 1.6 }}>
                    {issue.text}
                  </p>
                  {automatic ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#22c55e",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      <Wrench size={12} color="#22c55e" />
                      alphaa fixing
                    </span>
                  ) : (
                    <a
                      href="/dashboard/settings"
                      style={{
                        background: "#e05a2b",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "5px 12px",
                        borderRadius: "8px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        textDecoration: "none",
                      }}
                    >
                      Action needed
                    </a>
                  )}
                </div>
              </DsCard>
            )
          })}
        </div>
      ) : hasAnyData ? (
        <DsCard>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                Your site is in great shape
              </div>
              <div style={{ fontSize: "13px", color: "#888888", marginTop: "2px", lineHeight: 1.6 }}>
                alphaa checked every page and found nothing that needs your attention.
              </div>
            </div>
          </div>
        </DsCard>
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="alphaa will check your whole site for you"
          body="The first crawl runs automatically in the background — there is nothing you need to do. Your results will appear here within a day."
          sub="We re-check your site every week and flag anything new."
        />
      )}

      {/* ── Schema markup ───────────────────────────────────── */}
      <SectionDivider>STRUCTURED DATA</SectionDivider>
      {!latestSchema ? (
        <EmptyState
          icon={Code2}
          title="alphaa generates structured data so Google and AI understand your business"
          body="This is the behind-the-scenes code that helps search engines and AI assistants describe your business correctly. alphaa can create it for you."
          sub="Most sites benefit from this — it only takes a moment."
        >
          <GenerateSchemaButton prominent />
        </EmptyState>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "11px", color: "#555555" }}>
            Generated {formatDate(latestSchema.generatedAt)} · {schemas.length} item
            {schemas.length !== 1 ? "s" : ""} ready to use
          </p>
          {schemas.map((schema, i) => {
            const jsonStr = JSON.stringify(schema.jsonLd, null, 2)
            return (
              <DsCard key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <StatusPill variant="info">{schema.type}</StatusPill>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#555555",
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {schema.pageUrl}
                    </span>
                  </div>
                  <CopyButton text={`<script type="application/ld+json">\n${jsonStr}\n</script>`} />
                </div>
                <pre
                  style={{
                    background: "#0a0a0a",
                    border: "1px solid #222222",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "11px",
                    color: "#888888",
                    fontFamily: "monospace",
                    overflowX: "auto",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {jsonStr}
                </pre>
              </DsCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
