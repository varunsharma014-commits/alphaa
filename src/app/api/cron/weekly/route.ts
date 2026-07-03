export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { sendEmail } from "@/lib/resend"
import { logActivity } from "@/lib/activity"
import WeeklyReportEmail from "@/emails/WeeklyReportEmail"
import React from "react"

type AiSearchStatus = {
  chatgpt?: string
  perplexity?: string
  google_ai?: string
  gemini?: string
}

type VisibilityDelta = Record<string, number>

type KeywordMover = {
  query: string
  positionBefore: number
  positionAfter: number
  change: number
}

function statusToScore(status: string): number {
  if (status === "frequently") return 2
  if (status === "occasionally") return 1
  return 0
}

function computeVisibilityDelta(
  older: AiSearchStatus | null,
  newer: AiSearchStatus | null
): VisibilityDelta {
  const engines = ["chatgpt", "perplexity", "google_ai", "gemini"] as const
  const delta: VisibilityDelta = {}
  for (const engine of engines) {
    const before = statusToScore((older as Record<string, string>)?.[engine] ?? "not_appearing")
    const after = statusToScore((newer as Record<string, string>)?.[engine] ?? "not_appearing")
    delta[engine] = after - before
  }
  return delta
}

async function processUser(
  user: { id: string; email: string; businessName: string | null; city: string | null }
): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // 1. Last two audits for visibility delta
  const audits = await db.audit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { aiSearchStatus: true, createdAt: true },
  })

  const newerAudit = audits[0] ?? null
  const olderAudit = audits[1] ?? null

  const visibilityDelta = computeVisibilityDelta(
    olderAudit?.aiSearchStatus as AiSearchStatus | null,
    newerAudit?.aiSearchStatus as AiSearchStatus | null
  )

  // 2. GBP posts published last 7 days
  const postsPublished = await db.gbpPost.count({
    where: {
      userId: user.id,
      status: "posted",
      postedAt: { gte: sevenDaysAgo },
    },
  })

  // 3. New reviews last 7 days
  const reviewsNew = await db.gmbReview.count({
    where: {
      userId: user.id,
      publishedAt: { gte: sevenDaysAgo },
    },
  })

  // 4. Keyword movers — compare last 2 rankings per query
  const allRankings = await db.keywordRanking.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    select: { query: true, position: true, date: true },
  })

  // Group by query, keep last 2 per query
  const byQuery = new Map<string, { position: number; date: Date }[]>()
  for (const r of allRankings) {
    if (!byQuery.has(r.query)) byQuery.set(r.query, [])
    const arr = byQuery.get(r.query)!
    if (arr.length < 2) arr.push({ position: r.position, date: r.date })
  }

  const movers: KeywordMover[] = []
  for (const [query, records] of byQuery.entries()) {
    if (records.length < 2) continue
    const positionBefore = records[1].position
    const positionAfter = records[0].position
    // Lower position = better ranking, so improvement = negative change
    const change = positionBefore - positionAfter
    movers.push({ query, positionBefore, positionAfter, change })
  }

  // Sort by absolute movement, pick top 5
  movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  const keywordMovers = movers.slice(0, 5)

  // 5. Generate Claude summary
  const businessName = user.businessName ?? "your business"
  const city = user.city ?? ""

  let summary = ""
  try {
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write a 2-3 sentence weekly progress summary for ${businessName}${city ? ` in ${city}` : ""}.
Data:
- Posts published this week: ${postsPublished}
- New reviews this week: ${reviewsNew}
- Keyword movers (top): ${keywordMovers.slice(0, 3).map(k => `"${k.query}" moved ${k.change > 0 ? "+" : ""}${k.change} positions`).join(", ") || "none"}
- Visibility changes: ${Object.entries(visibilityDelta).map(([e, d]) => `${e}: ${d > 0 ? "+" : ""}${d}`).join(", ")}

Write in a positive, encouraging tone. Be specific. No lists, just flowing prose. 2-3 sentences max.`,
        },
      ],
    })
    const block = msg.content[0]
    summary = block.type === "text" ? block.text : ""
  } catch (err) {
    console.error(`[weekly-cron] Claude error for user ${user.id}:`, err)
    summary = `This week, ${businessName} published ${postsPublished} post${postsPublished !== 1 ? "s" : ""} and received ${reviewsNew} new review${reviewsNew !== 1 ? "s" : ""}.`
  }

  // 6. Save WeeklyReport
  const report = await db.weeklyReport.create({
    data: {
      userId: user.id,
      postsPublished,
      reviewsNew,
      visibilityDelta,
      keywordMovers,
      summary,
      emailSent: false,
    },
  })

  await logActivity(
    user.id,
    "weekly_report",
    "Your weekly report is ready",
    summary ? `${summary.slice(0, 120)}${summary.length > 120 ? "…" : ""}` : undefined
  )

  // 7. Send email
  try {
    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports`
    await sendEmail({
      to: user.email,
      subject: `Your weekly Alphaa report — ${businessName}`,
      react: React.createElement(WeeklyReportEmail, {
        businessName,
        summary,
        postsPublished,
        reviewsNew,
        visibilityDelta,
        keywordMovers,
        reportUrl,
      }),
    })

    await db.weeklyReport.update({
      where: { id: report.id },
      data: { emailSent: true },
    })
  } catch (err) {
    console.error(`[weekly-cron] Email error for user ${user.id}:`, err)
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await db.user.findMany({
    where: {
      subscriptionStatus: { in: ["active", "trialing"] },
      email: { not: "" },
    },
    select: { id: true, email: true, businessName: true, city: true },
  })

  let processed = 0
  const errors: { userId: string; error: string }[] = []

  for (const user of users) {
    try {
      await processUser(user)
      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[weekly-cron] Failed for user ${user.id}:`, message)
      errors.push({ userId: user.id, error: message })
    }
  }

  return NextResponse.json({ processed, errors })
}
