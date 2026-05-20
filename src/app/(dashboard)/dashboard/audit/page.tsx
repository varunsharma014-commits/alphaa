import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { IssueCard } from "@/components/scan/IssueCard"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { MonoNumber } from "@/components/common/MonoNumber"
import { formatDate } from "@/lib/utils"
import type { AuditIssue } from "@/types/audit"

export const metadata = { title: "Technical Audit" }

export default async function AuditPage() {
  const { userId } = await auth()
  const user = await db.user.findUnique({
    where: { clerkId: userId! },
    include: { audits: { orderBy: { createdAt: "desc" }, take: 1 } },
  })
  const audit = user?.audits?.[0]
  const issues = (audit?.issues as unknown as AuditIssue[]) ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-2xl">Technical Audit</h1>
          <p className="text-muted text-sm mt-0.5">
            {audit ? `Last run ${formatDate(audit.createdAt)} · Runs automatically weekly` : "No audit run yet"}
          </p>
        </div>
        <OrangePillButton href="/api/audit" size="sm">Run new audit</OrangePillButton>
      </div>

      {audit && (
        <div className="grid grid-cols-3 gap-4">
          <GlassCard className="text-center">
            <MonoNumber className="text-white text-3xl font-medium block">{audit.visibilityScore}</MonoNumber>
            <span className="text-muted text-xs">Visibility score</span>
          </GlassCard>
          <GlassCard className="text-center">
            <MonoNumber className="text-white text-3xl font-medium block">{issues.filter((i) => i.severity === "critical").length}</MonoNumber>
            <span className="text-muted text-xs">Critical issues</span>
          </GlassCard>
          <GlassCard className="text-center">
            <MonoNumber className="text-white text-3xl font-medium block">{issues.length}</MonoNumber>
            <span className="text-muted text-xs">Total issues</span>
          </GlassCard>
        </div>
      )}

      {issues.length > 0 ? (
        <div className="space-y-3">
          {issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <p className="text-muted text-sm">Run your first audit to see issues.</p>
        </GlassCard>
      )}
    </div>
  )
}
