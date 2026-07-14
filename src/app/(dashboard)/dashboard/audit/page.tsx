export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import GenerateSchemaButton from "./GenerateSchemaButton"
import CopyButton from "./CopyButton"
import { DownloadLlmsButton } from "./DownloadLlmsButton"
import type { AuditIssue } from "@/types/audit"
import type { SchemaItem } from "@/lib/schema-generator"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { humanizeIssue } from "@/lib/humanize"
import { CheckCircle2, Gauge, Wrench, Code2, AlertCircle } from "lucide-react"

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
  if (!clerkId) redirect("/login")

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  // Fetch latest schema markup
  const latestSchema = await db.schemaMarkup.findFirst({
    where: { userId: user.id },
    orderBy: { generatedAt: "desc" },
  })
  const schemas = Array.isArray(latestSchema?.schemas)
    ? (latestSchema.schemas as unknown as SchemaItem[])
    : []

  // Fetch latest crawl result
  const latestCrawl = await db.crawlResult.findFirst({
    where: { userId: user.id },
    orderBy: { crawledAt: "desc" },
  })
  const crawlIssues = Array.isArray(latestCrawl?.issues)
    ? (latestCrawl.issues as unknown as CrawlIssue[])
    : []
  const metaIssues = Array.isArray(latestCrawl?.metaIssues)
    ? (latestCrawl.metaIssues as unknown as CrawlIssue[])
    : []
  const allCrawlIssues = [...crawlIssues, ...metaIssues]

  // Fetch latest audit issues
  const latestAudit = await db.audit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  const auditIssues = Array.isArray(latestAudit?.issues)
    ? (latestAudit.issues as unknown as AuditIssue[])
    : []

  // AI-crawler blocks (robots.txt audit) get their own prominent card above
  // everything else — the most impactful AEO finding.
  const aiCrawlerBlocks = allCrawlIssues.filter((i) => i.type === "ai_crawler_blocked")
  const regularCrawlIssues = allCrawlIssues.filter((i) => i.type !== "ai_crawler_blocked")

  // Combined plain-English issue list (crawl + AI audit), sorted by severity.
  const sevRank: Record<string, number> = { critical: 0, warning: 1, improvement: 2 }
  const combinedIssues: { severity: string; text: string }[] = [
    ...regularCrawlIssues.map((i) => ({ severity: i.severity, text: issueText(i) })),
    ...auditIssues.map((i) => ({ severity: i.severity, text: i.headline })),
  ].sort((a, b) => (sevRank[a.severity] ?? 1) - (sevRank[b.severity] ?? 1))

  // Stat-row numbers (plain English).
  const pagesChecked = latestCrawl?.pagesScanned ?? 0
  const brokenLinks = regularCrawlIssues.filter((i) => i.severity === "critical").length
  const missingDescriptions = regularCrawlIssues.filter((i) => i.severity === "warning").length
  const issuesFixed = auditIssues.filter((i) => i.fix_summary).length

  // PageSpeed data — fetched safely, never leaks raw errors to the user.
  let pageSpeed: PageSpeedResult | null = null
  let speedAvailable = false
  try {
    if (user.websiteUrl) {
      const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
        user.websiteUrl
      )}&strategy=mobile`
      const psRes = await fetch(psUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) })
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

  // llms.txt — alphaa auto-generates this from the user's business profile.
  const llmsTxt = generateLlmsTxt(user)

  // One-line snippet that auto-injects (and keeps updated) the business schema.
  const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const tagSnippet = `<script async src="${appBase}/tag.js?id=${user.id}"></script>`

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <AutopilotBar
        message={
          latestCrawl
            ? "alphaa checks your site every week and explains anything it finds in plain English"
            : "alphaa's first website check is on its way — everything it finds appears here in plain English"
        }
      />

      {/* ── AI crawler blocks — most critical, shown first ──── */}
      {aiCrawlerBlocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
          {aiCrawlerBlocks.map((issue, i) => {
            const engine = String(issue.engine ?? "an AI engine")
            return (
              <DsCard key={`ai-block-${i}`} accent="#dc2626" style={{ background: "#1a0808" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                      Your website is blocking {engine} from reading your content
                    </p>
                    <p style={{ fontSize: "13px", color: "#d6b8b8", lineHeight: 1.6, marginTop: "4px" }}>
                      This means {engine} literally cannot see your website — which is why you don&apos;t appear in its results.
                    </p>
                    <details style={{ marginTop: "10px" }}>
                      <summary style={{ cursor: "pointer", color: "#e05a2b", fontSize: "13px", fontWeight: 500 }}>
                        Show me how to fix this →
                      </summary>
                      <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "8px" }}>
                        {String(issue.fix ?? "")}
                      </p>
                    </details>
                  </div>
                </div>
              </DsCard>
            )
          })}
        </div>
      )}

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
          label="Serious issues"
          tone={brokenLinks > 0 ? "danger" : "success"}
        />
        <StatBox
          value={missingDescriptions}
          label="Smaller issues"
          tone={missingDescriptions > 0 ? "warning" : "success"}
        />
        <StatBox
          value={issuesFixed}
          label="Issues alphaa has a fix for"
          tone={issuesFixed > 0 ? "success" : "muted"}
        />
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
                      href="mailto:hi@alphaa.app?subject=Help%20with%20a%20website%20issue"
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
                      Ask us how to fix it
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

      {/* ── llms.txt — AI instructions ───────────────────────── */}
      <SectionDivider>AI INSTRUCTIONS (LLMS.TXT)</SectionDivider>
      <DsCard>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
            llms.txt — tells AI engines who you are
          </span>
          <StatusPill variant="found">Generated</StatusPill>
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "#555555",
            fontFamily: "monospace",
            marginBottom: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Hosted at: alphaa.app/llms/{user.id}
        </p>
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
            wordBreak: "break-word",
          }}
        >
          {llmsTxt}
        </pre>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
          <DownloadLlmsButton content={llmsTxt} />
          <span style={{ fontSize: "11px", color: "#555555", lineHeight: 1.6 }}>
            alphaa keeps this updated automatically. To add it to your own site, download it and
            upload to yourdomain.com/llms.txt.
          </span>
        </div>
      </DsCard>

      {/* ── Auto-update snippet (schema injection) ──────────────── */}
      <SectionDivider>AUTO-UPDATE (ONE-LINE SNIPPET)</SectionDivider>
      <DsCard>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
            Hands-off schema — paste once, alphaa keeps it current
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginBottom: "12px" }}>
          Add this one line before your site&apos;s &lt;/head&gt; tag. alphaa then keeps your
          structured data up to date automatically — no re-pasting when your details change.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            background: "#0a0a0a",
            border: "1px solid #222222",
            borderRadius: "8px",
            padding: "10px 12px",
          }}
        >
          <code style={{ fontSize: "11px", color: "#888888", fontFamily: "monospace", overflowX: "auto", whiteSpace: "nowrap" }}>
            {tagSnippet}
          </code>
          <CopyButton text={tagSnippet} />
        </div>
        <p style={{ fontSize: "11px", color: "#555555", marginTop: "10px", lineHeight: 1.6 }}>
          Prefer maximum coverage? The copy-paste schema above is read by every crawler; the snippet
          is read by AI/search engines that run JavaScript. Use whichever fits your site — or both.
        </p>
      </DsCard>
    </div>
  )
}
