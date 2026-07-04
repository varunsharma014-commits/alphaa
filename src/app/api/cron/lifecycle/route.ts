import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { sendConnectGoogleNudgeEmail, sendWeekOneRecapEmail } from "@/lib/email"

// Lifecycle / activation emails, fired daily by src/lib/cron-scheduler.ts.
//
// Three sends, all deduped via the MockActivity ledger (type "email_sent",
// metadata.emailKey identifies which email):
//   connect-nudge-1  — onboarded, no Google connection, signed up 1-3 days ago
//   connect-nudge-2  — still not connected, signed up 4-6 days ago
//   week-one-recap   — connected, signed up 7-10 days ago (real activity recap)
//
// Eligibility windows are bounded on both sides so old users are never
// backfilled. Per-user try/catch — one failure never aborts the loop.

export const dynamic = "force-dynamic"
export const maxDuration = 300

const DAY = 24 * 60 * 60 * 1000

type EmailKey = "connect-nudge-1" | "connect-nudge-2" | "week-one-recap"

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = Date.now()

  // One query covers every window: onboarded users created 1-10 days ago.
  const users = await db.user.findMany({
    where: {
      onboardingCompleted: true,
      createdAt: { gte: new Date(now - 10 * DAY), lte: new Date(now - 1 * DAY) },
    },
    include: { integration: true },
  })

  // Send-log lookup: every prior lifecycle send for these users, keyed by
  // "<userId>:<emailKey>" from the activity ledger.
  const userIds = users.map((u) => u.id)
  const priorSends = userIds.length
    ? await db.mockActivity.findMany({
        where: { userId: { in: userIds }, type: "email_sent" },
        select: { userId: true, metadata: true },
      })
    : []
  const alreadySent = new Set(
    priorSends.map((row) => {
      const key = (row.metadata as { emailKey?: string } | null)?.emailKey ?? ""
      return `${row.userId}:${key}`
    }),
  )

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const user of users) {
    try {
      const ageDays = (now - user.createdAt.getTime()) / DAY
      const connected = Boolean(
        user.integration &&
          (user.integration.gscSiteUrl ||
            user.integration.gmbLocationId ||
            user.integration.gaPropertyId),
      )

      // Pick at most one email for this user today.
      let emailKey: EmailKey | null = null
      if (!connected && ageDays >= 1 && ageDays < 3) emailKey = "connect-nudge-1"
      else if (!connected && ageDays >= 4 && ageDays < 6) emailKey = "connect-nudge-2"
      else if (connected && ageDays >= 7 && ageDays < 10) emailKey = "week-one-recap"

      if (!emailKey || alreadySent.has(`${user.id}:${emailKey}`)) {
        skipped++
        continue
      }

      if (!process.env.RESEND_API_KEY) {
        console.log(`[lifecycle] RESEND_API_KEY unset — skipping ${emailKey} for ${user.id}`)
        skipped++
        continue
      }

      const firstName = user.fullName?.split(" ")[0] || undefined
      const businessName = user.businessName || "your business"

      if (emailKey === "week-one-recap") {
        // Real numbers from the activity ledger (last 7 days) + latest audit.
        const since = new Date(now - 7 * DAY)
        const [grouped, firstKeywordSync, latestAudit] = await Promise.all([
          db.mockActivity.groupBy({
            by: ["type"],
            where: { userId: user.id, createdAt: { gte: since } },
            _count: { type: true },
          }),
          // keywords_synced is logged once ever (first sync), possibly >7d ago.
          db.mockActivity.findFirst({
            where: { userId: user.id, type: "keywords_synced" },
            select: { id: true },
          }),
          db.audit.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: { visibilityScore: true },
          }),
        ])
        const countOf = (type: string) =>
          grouped.find((g) => g.type === type)?._count.type ?? 0

        await sendWeekOneRecapEmail(user.email, {
          firstName,
          businessName,
          postsPublished: countOf("gbp_post"),
          competitorRuns: countOf("competitors"),
          contentGapRuns: countOf("content_gaps"),
          keywordTrackingOn: Boolean(firstKeywordSync),
          newReviewAlerts: countOf("reviews"),
          visibilityScore: latestAudit?.visibilityScore ?? null,
        })
        await logActivity(
          user.id,
          "email_sent",
          "We emailed your week-one recap",
          "A summary of what alphaa did in your first week",
          { emailKey },
        )
      } else {
        await sendConnectGoogleNudgeEmail(user.email, {
          firstName,
          businessName,
          isSecondNudge: emailKey === "connect-nudge-2",
        })
        await logActivity(
          user.id,
          "email_sent",
          "We sent you a setup reminder",
          "Connect Google to switch on autopilot",
          { emailKey },
        )
      }

      sent++
      console.log(`[lifecycle] sent ${emailKey} to ${user.id}`)
    } catch (err) {
      failed++
      console.error(`[lifecycle] failed for user ${user.id}:`, err)
    }
  }

  console.log(`[lifecycle] done — ${sent} sent, ${skipped} skipped, ${failed} failed, ${users.length} candidates`)
  return NextResponse.json({ success: true, candidates: users.length, sent, skipped, failed })
}
