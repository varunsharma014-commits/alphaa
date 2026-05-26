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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Schema Markup section ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white font-semibold text-2xl">Schema Markup</h1>
            <p className="text-white/50 text-sm mt-0.5">
              JSON-LD structured data for your website — helps Google and AI understand your business.
            </p>
          </div>
          {latestSchema && <GenerateSchemaButton />}
        </div>

        {!latestSchema ? (
          <GlassCard>
            <div className="text-center py-10 space-y-4">
              <p className="text-4xl">🏷️</p>
              <div>
                <h2 className="text-white font-semibold text-lg">No schema markup yet</h2>
                <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
                  Generate JSON-LD structured data for your website. Paste it into your pages to help
                  Google and AI engines understand your business.
                </p>
              </div>
              <GenerateSchemaButton prominent />
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            <p className="text-white/30 text-xs">
              Generated {formatDate(latestSchema.generatedAt)} · {schemas.length} schema{schemas.length !== 1 ? "s" : ""}
            </p>
            {schemas.map((schema, i) => {
              const jsonStr = JSON.stringify(schema.jsonLd, null, 2)
              return (
                <GlassCard key={i}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {schema.type}
                        </span>
                        <span className="text-white/40 text-xs font-mono">{schema.pageUrl}</span>
                      </div>
                      <CopyButton text={`<script type="application/ld+json">\n${jsonStr}\n</script>`} />
                    </div>
                    <pre className="bg-black/30 rounded-xl p-4 text-xs text-white/60 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                      {jsonStr}
                    </pre>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* ── Website Audit section ────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-white font-semibold text-xl">Website Audit</h2>
          <p className="text-white/50 text-sm mt-0.5">
            {latestCrawl
              ? `Last crawled ${formatDate(latestCrawl.crawledAt)} · Runs automatically weekly`
              : "No crawl run yet"}
          </p>
        </div>

        {latestCrawl ? (
          <>
            {/* Stats row */}
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

            {/* Schema found/missing lists */}
            {(latestCrawl.schemaFound?.length > 0 || latestCrawl.schemaMissing?.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {latestCrawl.schemaFound?.length > 0 && (
                  <GlassCard>
                    <p className="text-green-400 text-xs font-medium mb-2">Schema found</p>
                    <ul className="space-y-1">
                      {latestCrawl.schemaFound.map((s, i) => (
                        <li key={i} className="text-white/50 text-xs font-mono">{s}</li>
                      ))}
                    </ul>
                  </GlassCard>
                )}
                {latestCrawl.schemaMissing?.length > 0 && (
                  <GlassCard>
                    <p className="text-amber-400 text-xs font-medium mb-2">Schema missing</p>
                    <ul className="space-y-1">
                      {latestCrawl.schemaMissing.map((s, i) => (
                        <li key={i} className="text-white/50 text-xs font-mono">{s}</li>
                      ))}
                    </ul>
                  </GlassCard>
                )}
              </div>
            )}

            {/* Crawl issues */}
            {allCrawlIssues.length > 0 ? (
              <div className="space-y-2">
                <p className="text-white/50 text-xs">Crawl issues ({allCrawlIssues.length})</p>
                {allCrawlIssues.map((issue, i) => {
                  const colorMap = {
                    critical: "text-red-400 bg-red-500/10 border-red-500/20",
                    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                    improvement: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                  }
                  const style = colorMap[issue.severity] ?? colorMap.warning
                  return (
                    <div key={i} className={`glass-card rounded-xl px-4 py-3 border ${style.split(" ").slice(2).join(" ")}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium uppercase tracking-wide ${style.split(" ")[0]}`}>
                          {issue.severity}
                        </span>
                        <span className="text-white/60 text-sm">{issue.message}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <GlassCard className="text-center py-6">
                <p className="text-white/50 text-sm">No crawl issues found. Your site looks clean!</p>
              </GlassCard>
            )}
          </>
        ) : (
          <GlassCard className="text-center py-8">
            <p className="text-white/50 text-sm">No crawl data yet. A site crawl runs automatically.</p>
          </GlassCard>
        )}
      </div>

      {/* ── AI Audit Issues section ───────────────────────────── */}
      {auditIssues.length > 0 && (
        <div className="space-y-4">
          <div className="border-t border-white/5 pt-4">
            <h2 className="text-white font-semibold text-xl">AI Visibility Issues</h2>
            <p className="text-white/50 text-sm mt-0.5">
              From your latest visibility audit · {auditIssues.length} issues
            </p>
          </div>
          <div className="space-y-3">
            {auditIssues.map((issue, i) => (
              <IssueCard key={i} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
