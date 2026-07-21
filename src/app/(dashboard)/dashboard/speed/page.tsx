export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import Link from "next/link"
import { ReCrawlButton } from "./ReCrawlButton"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { Gauge, Settings } from "lucide-react"
import { fetchPageSpeed } from "@/lib/pagespeed"

export const metadata = { title: "Page speed" }

// PageSpeed API types
type PageSpeedAudit = {
  id: string
  title: string
  description: string
  score: number | null
  displayValue?: string
  numericValue?: number
}

type PageSpeedResult = {
  lighthouseResult: {
    categories: {
      performance: { score: number }
    }
    audits: Record<string, PageSpeedAudit>
  }
}

type CrawlIssue = {
  severity: "critical" | "warning" | "improvement"
  url?: string
  message?: string
  type?: string
  [key: string]: unknown
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

export default async function SpeedPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    select: { id: true, websiteUrl: true },
  })

  if (!user?.websiteUrl) {
    return (
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        <AutopilotBar message="alphaa checks your site speed automatically once it knows your website address" />
        <div style={{ marginBottom: "18px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>Page speed</h1>
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "4px", lineHeight: 1.6 }}>
            alphaa checks how fast your site feels to visitors every week.
          </p>
        </div>
        <EmptyState
          icon={Settings}
          title="alphaa will track your site speed once we know your website"
          body="Add your website address in your business details and alphaa will start checking how fast your site loads for visitors — automatically, every week."
          sub="It only takes a moment to set up."
        >
          <Link
            href="/dashboard/settings/business"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--ds-accent)",
              color: "var(--ds-text)",
              fontSize: "13px",
              fontWeight: 500,
              padding: "8px 18px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            <Settings size={15} />
            Add my website address
          </Link>
        </EmptyState>
      </div>
    )
  }

  // Fetch PageSpeed data server-side — never leak raw errors to the user.
  // Shared helper handles protocol normalization, the 25s Lighthouse budget,
  // the optional PAGESPEED_API_KEY, and 6h caching.
  const pageSpeed = (user.websiteUrl ? await fetchPageSpeed(user.websiteUrl) : null) as PageSpeedResult | null
  let speedAvailable = pageSpeed !== null

  // Latest crawl result
  const crawlResult = await db.crawlResult.findFirst({
    where: { userId: user.id },
    orderBy: { crawledAt: "desc" },
  })

  let audits: Record<string, PageSpeedAudit> = {}
  let perfPct: number | null = null
  try {
    audits = pageSpeed?.lighthouseResult?.audits ?? {}
    const perfScore = pageSpeed?.lighthouseResult?.categories?.performance?.score ?? null
    perfPct = perfScore !== null ? Math.round(perfScore * 100) : null
  } catch {
    speedAvailable = false
  }

  const issues = Array.isArray(crawlResult?.issues) ? (crawlResult.issues as CrawlIssue[]) : []
  const criticalCount = issues.filter((i) => i.severity === "critical").length
  const warningCount = issues.filter((i) => i.severity === "warning").length

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <AutopilotBar
        message={
          crawlResult
            ? "alphaa checks your site every week and explains anything it finds in plain English"
            : "alphaa's first website check is on its way — results appear here automatically"
        }
      />

      {/* Header */}
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
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>Page speed</h1>
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", marginTop: "4px", lineHeight: 1.6 }}>
            alphaa checks how fast your site feels to visitors every week.
          </p>
        </div>
        <ReCrawlButton />
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "8px" }}>
        <StatBox
          value={crawlResult ? crawlResult.pagesScanned : "—"}
          label="Pages checked"
          tone="default"
        />
        <StatBox
          value={crawlResult ? criticalCount : "—"}
          label="Serious issues"
          tone={criticalCount > 0 ? "danger" : "success"}
        />
        <StatBox
          value={crawlResult ? warningCount : "—"}
          label="Smaller issues"
          tone={warningCount > 0 ? "warning" : "success"}
        />
      </div>

      {/* Page speed */}
      <SectionDivider>PAGE SPEED</SectionDivider>
      {speedAvailable && Object.keys(audits).length > 0 ? (
        <DsCard>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Gauge size={15} color="var(--ds-accent)" />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-text)" }}>
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
                    background: "var(--ds-surface)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--ds-text-mute)", marginBottom: "4px" }}>
                    {cwvFriendlyName(id)}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)", lineHeight: 1.1 }}>
                    {audit.displayValue ?? "—"}
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <StatusPill variant={status.variant}>{status.label}</StatusPill>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "8px", lineHeight: 1.5 }}>
                    {cwvSubtitle(id)}
                  </div>
                </div>
              )
            })}
          </div>
        </DsCard>
      ) : (
        <DsCard>
          <div style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6 }}>
            We couldn&apos;t get speed data from Google this time — it happens when their
            PageSpeed service is busy. Reload this page in a minute to try again; alphaa
            also re-checks automatically every week.
          </div>
        </DsCard>
      )}
    </div>
  )
}
