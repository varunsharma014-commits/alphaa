// Legacy key: the "claude" engine is stored as google_ai.
const ENGINE_NAMES: Record<string, string> = { chatgpt: "ChatGPT", gemini: "Gemini", perplexity: "Perplexity", google_ai: "Claude", claude: "Claude" }

export const dynamic = "force-dynamic"
export const maxDuration = 300

import { briefingMembers } from "@/lib/team/store"
import { can } from "@/lib/team/permissions"
import { asUser } from "@/lib/usage"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { sendEmail } from "@/lib/resend"
import { mailingAddress, sendMarketingEmail } from "@/lib/marketing-email"
import { isEmailSuppressed, unsubscribeLinks } from "@/lib/unsubscribe"
import { logActivity } from "@/lib/activity"
import BriefingEmail from "@/emails/BriefingEmail"
import { briefingEmailProps } from "@/lib/agent/briefing-email"
import { compedEmailWhere } from "@/lib/billing"
import React from "react"

const anthropic = claudeFor("weekly-briefing")

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
  user: { id: string; email: string; businessName: string | null; city: string | null; fullName: string | null }
): Promise<void> {
  asUser(user.id)
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
    // Round to 1 decimal — GSC positions are long floats and the raw delta
    // (-2.214285714285708) was rendered straight into the customer report.
    const change = Math.round((positionBefore - positionAfter) * 10) / 10
    movers.push({ query, positionBefore, positionAfter, change })
  }

  // Sort by absolute movement, pick top 5
  movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  const keywordMovers = movers.slice(0, 5)

  // 4b. What the agent actually did / is waiting on (real rows only) — feeds
  // the "I asked ChatGPT about you this week. I did X. Y needs your OK." tone.
  // Every channel, not only Google: social posts, review replies, customer emails and ad changes
  // the agent logged this week (activity ledger rows; real rows only).
  const ledger = (type: string) => db.mockActivity.count({ where: { userId: user.id, type, createdAt: { gte: sevenDaysAgo } } })
  const [socialPosted, repliesPosted, emailsSent, adChanges] = await Promise.all([
    ledger("social_published"), ledger("review_reply"), ledger("email_campaign_sent"), ledger("ads_change"),
  ])

  const [checksThisWeek, latestAuditEngines, draftsWaiting, reviewsUnanswered] = await Promise.all([
    db.audit.count({ where: { userId: user.id, createdAt: { gte: sevenDaysAgo } } }),
    newerAudit
      ? db.audit.findFirst({
          where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
          orderBy: { createdAt: "desc" },
          select: { aiEngineResults: { select: { engine: true, appeared: true } } },
        })
      : Promise.resolve(null),
    db.gbpPost.count({ where: { userId: user.id, status: "draft" } }),
    db.gmbReview.count({ where: { userId: user.id, reply: null, publishedAt: { gte: sevenDaysAgo } } }),
  ])
  const engineLabel = (e: string) => ENGINE_NAMES[e] ?? e
  const namedThisWeek = latestAuditEngines
    ? [...new Set(latestAuditEngines.aiEngineResults.filter((r) => r.appeared).map((r) => engineLabel(r.engine)))]
    : []
  const askedThisWeek = latestAuditEngines
    ? [...new Set(latestAuditEngines.aiEngineResults.map((r) => engineLabel(r.engine)))]
    : []

  // 5. Generate the weekly note (factual, first person — see rules in the prompt)
  const businessName = user.businessName ?? "your business"
  const city = user.city ?? ""

  let summary = ""
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are Alphaa, an AI agent working for ${businessName}${city ? ` in ${city}` : ""}. Write the owner's weekly note: 2-3 short sentences, first person ("I"), plain English.
Data (the only facts you may use):
- Google updates I published this week: ${postsPublished}
- Social posts I published this week: ${socialPosted}
- Review replies I posted this week: ${repliesPosted}
- Customer emails I sent this week: ${emailsSent}
- Ad changes I made this week: ${adChanges}
- New Google reviews this week: ${reviewsNew}
- Google search movers: ${keywordMovers.slice(0, 3).filter(k => k.change !== 0).map(k => `"${k.query}" moved ${k.change > 0 ? "up" : "down"} ${Math.abs(k.change)}`).join(", ") || "none"}
- AI checks I ran this week: ${checksThisWeek > 0 ? `${checksThisWeek} (asked ${askedThisWeek.join(", ") || "the AIs"}; named the business: ${namedThisWeek.join(", ") || "none"})` : "none this week"}
- Google post drafts waiting for the owner's OK: ${draftsWaiting}
- New reviews this week without a reply yet: ${reviewsUnanswered}
- Change in AI assistants naming the business: ${Object.entries(visibilityDelta).map(([e, d]) => `${ENGINE_NAMES[e] ?? e}: ${d > 0 ? "started naming it" : d < 0 ? "stopped naming it" : "no change"}`).join(", ")}

Shape: what you checked, then what you did, then what needs the owner's OK. Example of the tone (do not copy its facts): "I asked ChatGPT about you this week. I published two Google updates. One draft needs your OK." Only say you asked an AI if "AI checks I ran this week" is not "none". Only mention drafts or reviews waiting if their count is above 0.
Rules: state only what the data shows. If nothing changed, say so plainly and say what you'll do next week. Never describe results as "steady", "strong" or "holding firm" and never imply the business is being recommended unless the data says an AI started naming it. Name engines only as ChatGPT, Gemini, Claude or Perplexity. No hype, no exclamation marks, no lists, no em-dashes.`,
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

  // 7. Send email — as "Alphaa AI Agent", with the marketing footer and a
  // one-click List-Unsubscribe. Anyone who unsubscribed gets no report email
  // (the report itself is still saved and shows in the dashboard).
  try {
    if (await isEmailSuppressed(user.email)) {
      console.log(`[weekly-cron] ${user.id} unsubscribed — report saved, no email`)
      return
    }
    // The email is the owner's briefing (headline, one-tap approvals, the
    // week's work), the same three answers as the dashboard.
    const props = await briefingEmailProps(user.id, user.fullName?.trim().split(/\s+/)[0] || null)
    if (!props) return
    const unsub = unsubscribeLinks(`u_${user.id}`, user.email)
    const react = React.createElement(BriefingEmail, { ...props, footer: { address: mailingAddress(), unsubscribeUrl: unsub?.pageUrl ?? null } })
    const waiting = props.inbox.length
    const subject = `${props.lights.filter((l) => l.light === "yes").length} of 4 AIs recommend you${waiting ? ` · ${waiting} ${waiting === 1 ? "thing needs" : "things need"} your OK` : ""}`
    if (unsub) {
      await sendMarketingEmail({ to: user.email, subject, react, unsub })
    } else {
      await sendEmail({ to: user.email, subject, react })
    }

    await db.weeklyReport.update({
      where: { id: report.id },
      data: { emailSent: true },
    })
  } catch (err) {
    console.error(`[weekly-cron] Email error for user ${user.id}:`, err)
  }

  // Teams: members who opted in get their own copy (lib/team). Approve links name the member,
  // so /approve uses their current role. Emails about the brand otherwise still go to the owner.
  try {
    for (const m of await briefingMembers(user.id)) {
      if (await isEmailSuppressed(m.email)) continue
      const props = await briefingEmailProps(user.id, m.name?.trim().split(/\s+/)[0] || null, { id: m.id, canApprove: can(m.role, "review") })
      if (!props) break
      const unsub = unsubscribeLinks(`u_${user.id}`, m.email)
      const react = React.createElement(BriefingEmail, { ...props, footer: { address: mailingAddress(), unsubscribeUrl: unsub?.pageUrl ?? null } })
      const name = user.businessName?.trim() || "your brand"
      const subject = `${name}: ${props.lights.filter((l) => l.light === "yes").length} of 4 AIs recommend it${props.inbox.length ? ` · ${props.inbox.length} waiting` : ""}`
      if (unsub) await sendMarketingEmail({ to: m.email, subject, react, unsub })
      else await sendEmail({ to: m.email, subject, react })
    }
  } catch (err) {
    console.error(`[weekly-cron] Member briefing error for ${user.id}:`, err)
  }
}

// One run at a time in this process (the scheduler re-hits this route hourly as a catch-up).
let running = false

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  try {
    // Paying brands plus comped ones (founder accounts and their extra websites). Comped brands have
    // no Stripe subscription, so the old filter skipped them: no report after the week of Sep 28.
    const users = await db.user.findMany({
      where: {
        email: { not: "" },
        OR: [
          { subscriptionStatus: { in: ["active", "trialing"] }, stripeSubscriptionId: { not: null } },
          { AND: [{ onboardingCompleted: true }, { OR: compedEmailWhere() }] },
        ],
      },
      select: { id: true, email: true, businessName: true, city: true, fullName: true },
    })

    // Per-brand dedupe: a brand with a report from the last 5 days is done for this week. This is what
    // makes the hourly catch-up safe (a deploy kills the in-process scheduler, so Monday 13:00 UTC
    // alone missed whole weeks); without it a re-hit would email the briefing twice.
    const done = new Set(
      (await db.weeklyReport.findMany({
        where: { userId: { in: users.map((u) => u.id) }, createdAt: { gte: new Date(Date.now() - 5 * 86_400_000) } },
        select: { userId: true },
      })).map((r) => r.userId)
    )

    let processed = 0
    let skipped = 0
    const errors: { userId: string; error: string }[] = []

    for (const user of users) {
      if (done.has(user.id)) { skipped++; continue }
      try {
        await processUser(user)
        processed++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[weekly-cron] Failed for user ${user.id}:`, message)
        errors.push({ userId: user.id, error: message })
      }
    }

    return NextResponse.json({ processed, skipped, errors })
  } finally {
    running = false
  }
}
