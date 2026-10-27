import { NextRequest, NextResponse } from "next/server"
import React from "react"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { FOUNDER_EMAILS, hasPaidPlan } from "@/lib/billing"
import { mailingAddress, sendMarketingEmail } from "@/lib/marketing-email"
import { isEmailSuppressed, unsubscribeLinks, type UnsubLinks } from "@/lib/unsubscribe"
import NurtureEmail from "@/emails/NurtureEmail"
import { buildAccountDossier } from "@/lib/personal/research"
import { bodyWords, copyToText, writePersonalEmail, type WriteResult } from "@/lib/personal/writer"
import { buildConvertFallback, convertBrief, convertDueStep, LAST_CONVERT_DAY, type ConvertDay } from "@/lib/personal/briefs"
import { mapPool, spacedQueue } from "@/lib/personal/pool"

// "Signed up, hasn't paid" conversion emails, fired daily by src/lib/cron-scheduler.ts.
// (There are no Stripe trials: these are onboarded accounts with no paid plan.)
//
// Steps on days 1, 3, 5, 8, 12, 17, 24, 31, 45 after signup. One step per run,
// never resent: each send logs a MockActivity "email_sent" row with
// metadata.emailKey "convert-dN" (same ledger as /api/cron/lifecycle) plus the
// fact keys it used, so a fact is never repeated. Missed steps are skipped.
// Never two emails within 20h to one account across lifecycle + convert.
//
// Copy is written for THAT business by lib/personal (fact dossier + Claude +
// validator); lib/personal/briefs.ts buildConvertFallback() is the fallback.
// CTA → the billing page (it already sends Shopify merchants to Shopify).
//
// Eligible: onboardingCompleted, no paid plan, not a founder/comp account,
// created 1-45 days ago, not unsubscribed anywhere. Marketing email: needs
// COMPANY_MAILING_ADDRESS and carries the signed unsubscribe footer/headers.
// ?dryRun=1 sends and writes nothing; the first ?limit=N (default 3, max 10)
// due accounts get their personal copy written (API calls; nothing stored).

export const dynamic = "force-dynamic"
export const maxDuration = 300

const DAY = 24 * 60 * 60 * 1000
const HOURS_20 = 20 * 60 * 60 * 1000
const MAX_SENDS_PER_RUN = 50
const SEND_GAP_MS = 600
const CONCURRENCY = 3

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1"
  const previewLimit = Math.min(10, Math.max(0, Number(req.nextUrl.searchParams.get("limit") ?? 3) || 0))

  const address = mailingAddress()
  if (!address) {
    console.log("[convert] COMPANY_MAILING_ADDRESS is not set: sending nothing")
    return NextResponse.json({ success: true, sent: 0, reason: "COMPANY_MAILING_ADDRESS unset" })
  }
  if (!dryRun && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)) {
    console.log("[convert] Resend not configured: sending nothing")
    return NextResponse.json({ success: true, sent: 0, reason: "Resend not configured" })
  }

  const now = Date.now()
  const users = await db.user.findMany({
    where: {
      onboardingCompleted: true,
      createdAt: { gte: new Date(now - (LAST_CONVERT_DAY + 2) * DAY), lte: new Date(now - 1 * DAY) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, createdAt: true, subscriptionStatus: true, stripeSubscriptionId: true },
  })
  const candidates = users.filter((u) => u.email.includes("@") && !hasPaidPlan(u) && !FOUNDER_EMAILS.includes(u.email.trim().toLowerCase()))

  const ids = candidates.map((u) => u.id)
  const ledger = ids.length
    ? await db.mockActivity.findMany({ where: { userId: { in: ids }, type: "email_sent" }, select: { userId: true, metadata: true, createdAt: true } })
    : []

  let sent = 0
  let skipped = 0
  let failed = 0
  let personal = 0
  let costUsd = 0
  const preview: { userId: string; day: number; subject: string; words: number; personal?: boolean; text?: string; errors?: string[] }[] = []

  type Job = { user: (typeof candidates)[number]; day: ConvertDay; used: string[]; unsub: UnsubLinks }
  const jobs: Job[] = []
  for (const user of candidates) {
    if (jobs.length >= MAX_SENDS_PER_RUN) break
    try {
      const rows = ledger.filter((r) => r.userId === user.id)
      // Never two emails within 20h (lifecycle nudges/recaps count too).
      if (rows.some((r) => now - r.createdAt.getTime() < HOURS_20)) { skipped++; continue }
      const meta = rows.map((r) => (r.metadata ?? {}) as { emailKey?: unknown; factKeys?: unknown })
      const sentDays = meta.map((m) => (typeof m.emailKey === "string" ? m.emailKey.match(/^convert-d(\d+)$/)?.[1] : undefined)).filter(Boolean).map(Number)
      const lastStep = sentDays.length ? Math.max(...sentDays) : 0
      const day = convertDueStep((now - user.createdAt.getTime()) / DAY, lastStep)
      if (!day) { skipped++; continue }
      if (await isEmailSuppressed(user.email)) { skipped++; continue }
      const unsub = unsubscribeLinks(`u_${user.id}`, user.email)
      if (!unsub) { console.log("[convert] no signing key: sending nothing"); break }
      const used = meta.flatMap((m) => (Array.isArray(m.factKeys) ? m.factKeys.filter((k): k is string => typeof k === "string") : []))
      jobs.push({ user, day, used, unsub })
    } catch (err) {
      failed++
      console.error(`[convert] gate check failed for user ${user.id}:`, err)
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
  const send = spacedQueue(SEND_GAP_MS)
  await mapPool(jobs, CONCURRENCY, async ({ user, day, used, unsub }, i) => {
    try {
      const utm = `utm_source=email&utm_medium=lifecycle&utm_campaign=account-convert&utm_content=day${day}`
      const cta = { label: day === 45 ? "Pick up where we left off" : "Start your plan", href: `${base}/dashboard/settings/billing?${utm}` }

      if (dryRun && i >= previewLimit) {
        preview.push({ userId: user.id, day, subject: "(not written: over ?limit)", words: 0 })
        return
      }

      const dossier = await buildAccountDossier(user.id, { rotation: day, forceFreshAnswer: day === 3, noCache: dryRun })
      if (!dossier) { skipped++; return }
      const fallback = buildConvertFallback(day, dossier, cta)
      const written: WriteResult = await writePersonalEmail({
        dossier, brief: convertBrief(day, dossier), usedKeys: used, cta, fallback, label: `user:${user.id}:convert-d${day}`,
      })
      const copy = written.copy
      costUsd += written.usage.costUsd
      if (written.personal) personal++

      if (dryRun) {
        preview.push({
          userId: user.id, day, subject: copy.subject, words: bodyWords(copy), personal: written.personal,
          text: copyToText(copy), errors: written.errors.length ? written.errors : undefined,
        })
        return
      }

      // Re-check right before sending: a lifecycle send or another run may have landed meanwhile.
      const recent = await db.mockActivity.findFirst({
        where: { userId: user.id, type: "email_sent", createdAt: { gte: new Date(Date.now() - HOURS_20) } },
        select: { id: true },
      })
      if (recent) { skipped++; return }

      await send(() => sendMarketingEmail({
        to: user.email.trim(),
        subject: copy.subject,
        unsub,
        react: React.createElement(NurtureEmail, {
          preview: copy.preview,
          blocks: copy.blocks,
          cta: copy.cta,
          after: copy.after,
          footer: { reason: "You’re getting this because you created an Alphaa account.", address, unsubscribeUrl: unsub.pageUrl },
        }),
      }))
      await logActivity(user.id, "email_sent", "We emailed you what we found", copy.subject, {
        emailKey: `convert-d${day}`, factKeys: written.factKeys, personal: written.personal,
      })

      sent++
      console.log(`[convert] sent day ${day} to user ${user.id} (${written.personal ? "personal" : "template"})`)
    } catch (err) {
      failed++
      console.error(`[convert] failed for user ${user.id}:`, err)
    }
  })

  console.log(`[convert] done: ${sent} sent (${personal} personal), ${skipped} skipped, ${failed} failed, ${candidates.length} candidates, ~$${costUsd.toFixed(2)} writer cost${dryRun ? " (dry run)" : ""}`)
  return NextResponse.json({
    success: true, dryRun, candidates: candidates.length, due: jobs.length, sent, personal, skipped, failed,
    writerCostUsd: Number(costUsd.toFixed(3)), ...(dryRun ? { preview } : {}),
  })
}
