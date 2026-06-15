export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { MonoNumber } from "@/components/common/MonoNumber"
import { IssueCard } from "@/components/scan/IssueCard"
import { formatDate } from "@/lib/utils"
import GenerateSchemaButton from "./GenerateSchemaButton"
import CopyButton from "./CopyButton"
import type { AuditIssue } from "@/types/audit"
import type { SchemaItem } from "@/lib/schema-generator"

export const metadata = { title: "Schema Markup & Audit" }

type CrawlIssue = {
  severity: "critical" | "warning" | "improvement"
  message: string
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

  // Combined issue counts
  const allIssues = [...allCrawlIssues, ...auditIssues]
  const criticalCount = allIssues.filter(
    (i) => (i as { severity: string }).severity === "critical"
  ).length
  const warningCount = allIssues.filter(
    (i) => (i as { severity: string }).severity === "warning"
  ).length
  const passedCount = allIssues.filter(
    (i) => (i as { severity: string }).severity === "improvement" || (i as { severity: string }).severity === "info"
  ).length

  const totalIssueCount = criticalCount + warningCount + passedCount
  const hasCritical = criticalCount > 0
  const heroGradient = hasCritical
    ? "from-red-500/[0.12] border-red-500/20"
    : warningCount > 0
    ? "from-amber-500/[0.12] border-amber-500/20"
    : "from-green-500/[0.12] border-green-500/20"
  const heroOrb = hasCritical
    ? "bg-red-500/15"
    : warningCount > 0
    ? "bg-amber-500/15"
    : "bg-green-500/15"

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ── Issue Summary Hero ───────────────────────────────── */}
      {(latestCrawl || latestAudit) && (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${heroGradient} via-transparent to-transparent p-6 md:p-8`}>
          <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full ${heroOrb} blur-3xl pointer-events-none`} />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-white font-semibold text-2xl">Site Audit</h1>
                <p className="text-white/40 text-sm mt-0.5">
                  {latestCrawl
                    ? `Last crawled ${formatDate(latestCrawl.crawledAt)} · runs automatically weekly`
                    : "AI visibility and schema audit"}
                </p>
              </div>
              <GenerateSchemaButton />
            </div>

            {/* 3 big numbers */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-black/20 rounded-2xl p-5 text-center">
                <p className="text-4xl font-bold font-mono text-red-400">{criticalCount}</p>
                <p className="text-white/50 text-xs mt-1">Critical</p>
                <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: totalIssueCount > 0 ? `${(criticalCount / totalIssueCount) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div className="bg-black/20 rounded-2xl p-5 text-center">
                <p className="text-4xl font-bold font-mono text-amber-400">{warningCount}</p>
                <p className="text-white/50 text-xs mt-1">Warnings</p>
                <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: totalIssueCount > 0 ? `${(warningCount / totalIssueCount) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div className="bg-black/20 rounded-2xl p-5 text-center">
                <p className="text-4xl font-bold font-mono text-green-400">{passedCount}</p>
                <p className="text-white/50 text-xs mt-1">Improvements</p>
                <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-green-400"
                    style={{ width: totalIssueCount > 0 ? `${(passedCount / totalIssueCount) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>

            {totalIssueCount > 0 && (
              <p className="text-white/30 text-xs mt-4 text-center">
                {totalIssueCount} total issues found across crawl and AI audit
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── No audit state ───────────────────────────────────── */}
      {!latestCrawl && !latestAudit && (
        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.08] via-transparent to-transparent p-8">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#FF6B1A]/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-5 py-6">
            <span className="text-5xl">🔍</span>
            <div className="space-y-2 max-w-sm">
              <h1 className="text-white font-semibold text-xl">No audit data yet</h1>
              <p className="text-white/50 text-sm leading-relaxed">
                Generate schema markup to get started. A full site crawl runs automatically
                in the background.
              </p>
            </div>
            <GenerateSchemaButton prominent />
          </div>
        </div>
      )}

      {/* ── Crawl Issues by category ─────────────────────────── */}
      {allCrawlIssues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-xl flex items-center gap-2">
            Website Issues
            <span className="text-white/30 font-normal text-sm">
              ({allCrawlIssues.length})
            </span>
          </h2>

          {/* Critical */}
          {allCrawlIssues.filter((i) => i.severity === "critical").length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                  Critical ({allCrawlIssues.filter((i) => i.severity === "critical").length})
                </p>
              </div>
              {allCrawlIssues
                .filter((i) => i.severity === "critical")
                .map((issue, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    <p className="text-white/70 text-sm leading-relaxed">{issue.message}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Warning */}
          {allCrawlIssues.filter((i) => i.severity === "warning").length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  Warnings ({allCrawlIssues.filter((i) => i.severity === "warning").length})
                </p>
              </div>
              {allCrawlIssues
                .filter((i) => i.severity === "warning")
                .map((issue, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-amber-500/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-white/70 text-sm leading-relaxed">{issue.message}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Improvement */}
          {allCrawlIssues.filter((i) => i.severity === "improvement").length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
                  Improvements ({allCrawlIssues.filter((i) => i.severity === "improvement").length})
                </p>
              </div>
              {allCrawlIssues
                .filter((i) => i.severity === "improvement")
                .map((issue, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-blue-500/20 rounded-xl p-4 flex items-start gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <p className="text-white/70 text-sm leading-relaxed">{issue.message}</p>
                  </div>
                ))}
            </div>
          )}

          {/* No issues state */}
          {allCrawlIssues.length === 0 && latestCrawl && (
            <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.10] via-transparent to-transparent p-8">
              <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-green-500/15 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col items-center text-center gap-3 py-4">
                <span className="text-5xl">✅</span>
                <div className="space-y-1.5">
                  <h3 className="text-white font-semibold text-lg">Everything looks good!</h3>
                  <p className="text-white/50 text-sm">No crawl issues found. Your site is clean.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI Audit Issues ───────────────────────────────────── */}
      {auditIssues.length > 0 && (
        <div className="space-y-4">
          <div className="border-t border-white/[0.06] pt-6">
            <h2 className="text-white font-semibold text-xl">AI Visibility Issues</h2>
            <p className="text-white/40 text-sm mt-0.5">
              From your latest visibility audit · {auditIssues.length} issues
            </p>
          </div>

          {/* Critical audit issues */}
          {auditIssues.filter((i) => i.severity === "critical").length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                  Critical ({auditIssues.filter((i) => i.severity === "critical").length})
                </p>
              </div>
              {auditIssues
                .filter((i) => i.severity === "critical")
                .map((issue, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-red-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{issue.title}</p>
                        <p className="text-white/50 text-xs mt-1 leading-relaxed">{issue.description}</p>
                        {issue.fix && (
                          <p className="text-green-400 text-xs mt-2 leading-relaxed">
                            Fix: {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Warning audit issues */}
          {auditIssues.filter((i) => i.severity === "warning").length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  Warnings ({auditIssues.filter((i) => i.severity === "warning").length})
                </p>
              </div>
              {auditIssues
                .filter((i) => i.severity === "warning")
                .map((issue, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-amber-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{issue.title}</p>
                        <p className="text-white/50 text-xs mt-1 leading-relaxed">{issue.description}</p>
                        {issue.fix && (
                          <p className="text-green-400 text-xs mt-2 leading-relaxed">
                            Fix: {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Info / improvement audit issues */}
          {auditIssues.filter((i) => i.severity === "info").length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
                  Info ({auditIssues.filter((i) => i.severity === "info").length})
                </p>
              </div>
              {auditIssues
                .filter((i) => i.severity === "info")
                .map((issue, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-blue-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{issue.title}</p>
                        <p className="text-white/50 text-xs mt-1 leading-relaxed">{issue.description}</p>
                        {issue.fix && (
                          <p className="text-green-400 text-xs mt-2 leading-relaxed">
                            Fix: {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Crawl Stats row ───────────────────────────────────── */}
      {latestCrawl && (
        <div className="grid grid-cols-4 gap-3">
          <GlassCard className="text-center py-4">
            <MonoNumber className="text-white text-2xl font-medium block">
              {latestCrawl.pagesScanned}
            </MonoNumber>
            <span className="text-white/50 text-xs">Pages scanned</span>
          </GlassCard>
          <GlassCard className="text-center py-4">
            <MonoNumber className="text-white text-2xl font-medium block">
              {allCrawlIssues.filter((i) => i.severity === "critical").length}
            </MonoNumber>
            <span className="text-white/50 text-xs">Critical issues</span>
          </GlassCard>
          <GlassCard className="text-center py-4">
            <MonoNumber className="text-white text-2xl font-medium block">
              {latestCrawl.schemaFound?.length ?? 0}
            </MonoNumber>
            <span className="text-white/50 text-xs">Schema found</span>
          </GlassCard>
          <GlassCard className="text-center py-4">
            <MonoNumber className="text-white text-2xl font-medium block">
              {latestCrawl.schemaMissing?.length ?? 0}
            </MonoNumber>
            <span className="text-white/50 text-xs">Schema missing</span>
          </GlassCard>
        </div>
      )}

      {/* ── Schema Markup section ───────────────────────────── */}
      <div className="space-y-4">
        <div className="border-t border-white/[0.06] pt-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold text-xl">Schema Markup</h2>
            <p className="text-white/40 text-sm mt-0.5">
              JSON-LD structured data — helps Google and AI understand your business
            </p>
          </div>
          {latestSchema && <GenerateSchemaButton />}
        </div>

        {!latestSchema ? (
          <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.08] via-transparent to-transparent p-8">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#FF6B1A]/10 blur-3xl pointer-events-none" />
            <div className="relative flex flex-col items-center text-center gap-5 py-6">
              <span className="text-5xl">🏷️</span>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-white font-semibold text-lg">No schema markup yet</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Generate JSON-LD structured data for your website. Paste it into your pages to help
                  Google and AI engines understand your business.
                </p>
              </div>
              <GenerateSchemaButton prominent />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/30 text-xs">
              Generated {formatDate(latestSchema.generatedAt)} · {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
            </p>
            {schemas.map((schema, i) => {
              const jsonStr = JSON.stringify(schema.jsonLd, null, 2)
              return (
                <div
                  key={i}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#FF6B1A]/20 text-[#FF6B1A] border border-[#FF6B1A]/30 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {schema.type}
                      </span>
                      <span className="text-white/30 text-xs font-mono">{schema.pageUrl}</span>
                    </div>
                    <CopyButton text={`<script type="application/ld+json">\n${jsonStr}\n</script>`} />
                  </div>
                  <pre className="bg-black/30 rounded-xl p-4 text-xs text-white/60 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                    {jsonStr}
                  </pre>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
