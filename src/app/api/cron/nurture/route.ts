import { NextRequest, NextResponse } from "next/server"
import React from "react"
import { db } from "@/lib/db"
import { scanResultsUrl } from "@/lib/scan-token"
import { mailingAddress, sendMarketingEmail } from "@/lib/marketing-email"
import { isEmailSuppressed, leadIsUnsubscribed, mergeNurture, unsubscribeLinks } from "@/lib/unsubscribe"
import { buildNurtureCopy, currentStep, dueStep, extractLeadFacts, LAST_NURTURE_DAY, NURTURE_SCHEDULE } from "@/lib/nurture"
import NurtureEmail from "@/emails/NurtureEmail"

// Scan-lead nurture, fired daily by src/lib/cron-scheduler.ts.
//
// Day 0 is the report email (lib/scan-email.ts). This sends a daily burst on
// Days 1-4, then one email a week on Days 11, 18, 25, 32, 39, 46, 53 and 60
// (the last), to people who ran a free check and haven't bought. One sequence
// per email address, anchored on their most recent completed scan. State lives
// in ScanLead.ogData.nurture (merged, never overwritten):
// { step, schedule, lastSentAt, unsubscribed, unsubscribedAt }. Steps stored
// without schedule: 2 are from the old Day 1/3/5/.../90 schedule and are mapped
// by lib/nurture.ts currentStep() so nothing is resent.
//
// Stops for good when: the address unsubscribed (any lead / account), any lead
// for it converted, or an account exists with that email.
//
// Legal gate: without COMPANY_MAILING_ADDRESS this sends NOTHING.
// ?dryRun=1 reports what would be sent without sending or writing.

export const dynamic = "force-dynamic"
export const maxDuration = 300

const DAY = 24 * 60 * 60 * 1000
// Only leads who saw the consent notice at the email field (shipped 2026-10-04).
const CONSENT_SINCE = new Date("2026-10-04T16:00:00Z")
// Day 60 is the last step; a few days of slack for a late run.
const MAX_AGE_DAYS = LAST_NURTURE_DAY + 5
const MAX_SENDS_PER_RUN = 150
// Resend's default limit is 2 requests/second.
const SEND_GAP_MS = 600

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function nurtureState(ogData: unknown): { step: number; lastSentAt: number | null } {
  const n = isRecord(ogData) && isRecord(ogData.nurture) ? ogData.nurture : {}
  const step = currentStep(typeof n.step === "number" ? n.step : 0, n.schedule)
  const last = typeof n.lastSentAt === "string" ? Date.parse(n.lastSentAt) : NaN
  return { step, lastSentAt: Number.isFinite(last) ? last : null }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1"

  const address = mailingAddress()
  if (!address) {
    console.log("[nurture] COMPANY_MAILING_ADDRESS is not set: sending nothing")
    return NextResponse.json({ success: true, sent: 0, reason: "COMPANY_MAILING_ADDRESS unset" })
  }
  if (!dryRun && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)) {
    console.log("[nurture] Resend not configured: sending nothing")
    return NextResponse.json({ success: true, sent: 0, reason: "Resend not configured" })
  }

  const now = Date.now()
  const earliest = new Date(Math.max(CONSENT_SINCE.getTime(), now - MAX_AGE_DAYS * DAY))

  const leads = await db.scanLead.findMany({
    where: {
      email: { not: "" },
      visibilityScore: { not: null },
      createdAt: { gte: earliest, lte: new Date(now - 1 * DAY) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, email: true, businessName: true, businessUrl: true, city: true,
      aiSearchStatus: true, ogData: true, converted: true, userId: true, createdAt: true,
    },
  })

  // One sequence per address: group, newest first.
  const byEmail = new Map<string, typeof leads>()
  for (const l of leads) {
    const e = l.email.trim().toLowerCase()
    if (!e.includes("@")) continue
    const arr = byEmail.get(e) ?? []
    arr.push(l)
    byEmail.set(e, arr)
  }

  let sent = 0
  let skipped = 0
  let failed = 0
  const preview: { leadId: string; day: number; subject: string; words: number }[] = []

  for (const [email, group] of byEmail) {
    if (sent >= MAX_SENDS_PER_RUN) break
    try {
      // Anchor: newest lead whose report email actually went out (Day 0: the
      // automatic send sets reportEmailed, the "email me this report" button sets sentEmail).
      const anchor = group.find((l) => isRecord(l.ogData) && (l.ogData.reportEmailed === true || l.ogData.sentEmail === true))
      if (!anchor) { skipped++; continue }

      // Stop conditions within this window.
      if (group.some((l) => l.converted || l.userId || leadIsUnsubscribed(l.ogData))) { skipped++; continue }

      // Never two nurture emails to one address within ~a day (double runs, re-scans).
      const lastAny = Math.max(0, ...group.map((l) => nurtureState(l.ogData).lastSentAt ?? 0))
      if (lastAny && now - lastAny < 20 * 60 * 60 * 1000) { skipped++; continue }

      const { step } = nurtureState(anchor.ogData)
      const ageDays = (now - anchor.createdAt.getTime()) / DAY
      const day = dueStep(ageDays, step)
      if (!day) { skipped++; continue }

      // Stop conditions across ALL history (older leads, accounts).
      const [user, convertedLead, suppressed] = await Promise.all([
        db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } }),
        db.scanLead.findFirst({
          where: { email: { equals: email, mode: "insensitive" }, OR: [{ converted: true }, { userId: { not: null } }] },
          select: { id: true },
        }),
        isEmailSuppressed(email),
      ])
      if (user || convertedLead || suppressed) { skipped++; continue }

      const unsub = unsubscribeLinks(`l_${anchor.id}`, anchor.email)
      if (!unsub) { console.log("[nurture] no signing key: sending nothing"); break }

      const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
      const utm = `utm_source=email&utm_medium=nurture&utm_campaign=scan-nurture&utm_content=day${day}`
      const facts = extractLeadFacts(anchor)
      const copy = buildNurtureCopy(day, facts, {
        report: `${scanResultsUrl(anchor.id, anchor.email)}&${utm}`,
        signup: `${base}/signup?scan=${anchor.id}&${utm}`,
        start: `${base}/start?${utm}`,
      })

      if (dryRun) {
        const words = copy.blocks
          .map((b) => (b.kind === "bullets" ? b.items.join(" ") : b.text))
          .join(" ").split(/\s+/).filter(Boolean).length
        preview.push({ leadId: anchor.id, day, subject: copy.subject, words })
        continue
      }

      await sendMarketingEmail({
        to: anchor.email.trim(),
        subject: copy.subject,
        unsub,
        react: React.createElement(NurtureEmail, {
          preview: copy.preview,
          blocks: copy.blocks,
          cta: copy.cta,
          after: copy.after,
          footer: { reason: "You’re getting this because you ran a free AI check at alphaa.app.", address, unsubscribeUrl: unsub.pageUrl },
        }),
      })

      // Re-read just before writing so a concurrent ogData change (quick-fix
      // cache, unsubscribe) is merged, not clobbered.
      const fresh = await db.scanLead.findUnique({ where: { id: anchor.id }, select: { ogData: true } })
      await db.scanLead.update({
        where: { id: anchor.id },
        data: { ogData: mergeNurture(fresh?.ogData ?? anchor.ogData, { step: day, schedule: NURTURE_SCHEDULE, lastSentAt: new Date().toISOString() }) },
      })

      sent++
      console.log(`[nurture] sent day ${day} to lead ${anchor.id}`)
      await new Promise((r) => setTimeout(r, SEND_GAP_MS))
    } catch (err) {
      failed++
      console.error(`[nurture] failed for lead group ${group[0]?.id}:`, err)
    }
  }

  console.log(`[nurture] done: ${sent} sent, ${skipped} skipped, ${failed} failed, ${byEmail.size} addresses${dryRun ? " (dry run)" : ""}`)
  return NextResponse.json({ success: true, dryRun, addresses: byEmail.size, sent, skipped, failed, ...(dryRun ? { preview } : {}) })
}
