export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { runVisibilityScan } from "@/lib/visibility-scan"
import { logActivity } from "@/lib/activity"

// Weekly automatic AI-visibility re-scan. Without this, visibility is only
// measured when a user clicks "scan" — so week-over-week progress can never
// be shown. Runs the same scan as /api/dashboard/scan for every paying or
// in-trial user, sequentially, and logs a real activity-feed entry per scan.
//
// Skips anyone whose latest Audit (manual OR cron) is younger than 5 days so
// a Tuesday manual scan doesn't get doubled on Wednesday (Anthropic + engine
// API spend). Protected by the CRON_SECRET bearer token.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = Date.now()
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000)
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000)

  // Paying/trialing subscribers, plus anyone in their first 14 days (trial
  // period — subscriptionStatus may still be the "none" default).
  const users = await db.user.findMany({
    where: {
      onboardingCompleted: true,
      OR: [
        { subscriptionStatus: { in: ["active", "trialing"] } },
        { createdAt: { gte: fourteenDaysAgo } },
      ],
    },
    select: { id: true },
  })

  let scanned = 0
  let skipped = 0
  let failed = 0

  for (const u of users) {
    try {
      // Skip if scanned (via cron or manually) within the last 5 days.
      const lastAudit = await db.audit.findFirst({
        where: { userId: u.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
      if (lastAudit && lastAudit.createdAt >= fiveDaysAgo) {
        skipped++
        continue
      }

      const result = await runVisibilityScan(u.id)
      scanned++

      const engineResults = Array.isArray(result.engineResults) ? result.engineResults : []
      const appeared = engineResults.filter((r) => r.appeared).length
      await logActivity(
        u.id,
        "visibility_scan",
        "alphaa checked the AI engines for you",
        engineResults.length > 0
          ? `You appeared in ${appeared} of ${engineResults.length} checks`
          : `Your visibility score is ${result.visibilityScore}`,
        { auditId: result.auditId, visibilityScore: result.visibilityScore, appeared, checks: engineResults.length },
      )
    } catch (err) {
      failed++
      console.error(`[cron/visibility-scan] Scan failed for user ${u.id}:`, err)
    }
  }

  return NextResponse.json({ eligible: users.length, scanned, skipped, failed })
}
