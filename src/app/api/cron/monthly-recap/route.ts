export const dynamic = "force-dynamic"
export const maxDuration = 300

import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mailingAddress, sendMarketingEmail } from "@/lib/marketing-email"
import { isEmailSuppressed, unsubscribeLinks } from "@/lib/unsubscribe"
import { logActivity } from "@/lib/activity"
import { buildRecap, lastMonth } from "@/lib/agent/recap"
import { PLAN_PRICES } from "@/lib/constants"
import MonthlyRecapEmail from "@/emails/MonthlyRecapEmail"

// 1st of the month, 18:00 UTC: "Your October with Alphaa" to every paying
// account (same audience as the weekly briefing). Once per account per month
// (MockActivity email_sent, emailKey "recap-YYYY-MM"). ?dryRun=1 sends nothing.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1"
  const range = lastMonth()
  const key = `recap-${range.start.toISOString().slice(0, 7)}`
  const users = await db.user.findMany({
    where: { subscriptionStatus: { in: ["active", "trialing"] }, stripeSubscriptionId: { not: null }, email: { not: "" } },
    select: { id: true, email: true, fullName: true, plan: true },
  })
  const out: { userId: string; sent: boolean; reason?: string }[] = []
  for (const u of users) {
    try {
      const done = await db.mockActivity.findFirst({ where: { userId: u.id, type: "email_sent", metadata: { path: ["emailKey"], equals: key } } })
      if (done) { out.push({ userId: u.id, sent: false, reason: "already sent" }); continue }
      if (await isEmailSuppressed(u.email)) { out.push({ userId: u.id, sent: false, reason: "unsubscribed" }); continue }
      const recap = await buildRecap(u.id, range)
      if (!recap || recap.jobs === 0) { out.push({ userId: u.id, sent: false, reason: "nothing to report" }); continue }
      const unsub = unsubscribeLinks(`u_${u.id}`, u.email)
      if (!unsub) { out.push({ userId: u.id, sent: false, reason: "no signing key" }); continue }
      if (dryRun) { out.push({ userId: u.id, sent: false, reason: "dry run" }); continue }
      const price = /full/i.test(u.plan) ? PLAN_PRICES.fullservice.monthly : /pro/i.test(u.plan) ? PLAN_PRICES.pro.monthly : PLAN_PRICES.starter.monthly
      const react = React.createElement(MonthlyRecapEmail, {
        firstName: u.fullName?.trim().split(/\s+/)[0] || null,
        recap,
        paysFor: recap.value ? Math.floor(recap.value / price) : null,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/briefing`,
        footer: { address: mailingAddress(), unsubscribeUrl: unsub.pageUrl },
      })
      await sendMarketingEmail({ to: u.email, subject: `Your ${recap.month} with Alphaa: ${recap.jobs} jobs done for you`, react, unsub })
      await logActivity(u.id, "email_sent", `We emailed your ${recap.month} recap`, undefined, { emailKey: key })
      out.push({ userId: u.id, sent: true })
    } catch (err) {
      out.push({ userId: u.id, sent: false, reason: err instanceof Error ? err.message : String(err) })
    }
  }
  return NextResponse.json({ month: key, results: out })
}
