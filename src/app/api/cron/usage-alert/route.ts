export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authorized } from "@/lib/cron/users"
import { ADMIN_EMAILS, isComped } from "@/lib/billing"
import { aiDailyBudget, flush } from "@/lib/usage"
import { usageCost, type Tok } from "@/lib/ai-prices"
import { limitsFor } from "@/lib/quota-rules"
import { resend } from "@/lib/resend"
import { fromAs } from "@/lib/email-sender"

// Hourly: email the founders (ADMIN_EMAILS, never the comp/reviewer list) when a brand passes 80%
// of its daily AI ceiling or the platform passes 80% of AI_DAILY_BUDGET_USD. At most one email per
// UTC day (MockActivity "usage_alert" on the founder account). ?dryRun=1 shows what it would send.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await flush().catch(() => undefined)
  const day = new Date().toISOString().slice(0, 10)
  const rows = await db.mockActivity.findMany({
    where: { type: { in: ["usage_day", "usage_house"] }, createdAt: { gte: new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000) } },
    select: { userId: true, type: true, metadata: true },
  })
  let platform = 0
  const byBrand = new Map<string, number>()
  for (const r of rows) {
    const m = r.metadata as { date?: string; tokens?: Record<string, Tok>; searches?: number } | null
    if (m?.date !== day) continue
    const c = usageCost(m.tokens, m.searches ?? 0)
    platform += c
    if (r.type === "usage_day") byBrand.set(r.userId, (byBrand.get(r.userId) ?? 0) + c)
  }
  const users = byBrand.size
    ? await db.user.findMany({ where: { id: { in: [...byBrand.keys()] } }, select: { id: true, plan: true, email: true, businessName: true, websiteUrl: true } })
    : []
  const hot: string[] = []
  for (const u of users) {
    const cap = limitsFor(u.plan, "ai_cost_usd").day
    const spent = byBrand.get(u.id) ?? 0
    if (cap && spent >= 0.8 * cap) {
      hot.push(`${u.businessName || u.websiteUrl || u.id} (${u.plan}${isComped(u.email) ? ", comped: not blocked" : ""}): $${spent.toFixed(2)} of its $${cap} daily AI ceiling${spent >= cap && !isComped(u.email) ? " (AI paused for this brand until tomorrow)" : ""}`)
    }
  }
  const budget = aiDailyBudget()
  const platformHot = platform >= 0.8 * budget
  if (!hot.length && !platformHot) return NextResponse.json({ ok: true, platform: +platform.toFixed(2), alert: false })

  const founder = await db.user.findFirst({ where: { email: ADMIN_EMAILS[0] }, select: { id: true } })
  if (!founder) return NextResponse.json({ ok: false, error: "no founder account" })
  const sent = await db.mockActivity.findFirst({ where: { userId: founder.id, type: "usage_alert", metadata: { path: ["date"], equals: day } }, select: { id: true } })
  const text = [
    `Alphaa AI usage, ${day} (UTC), as of ${new Date().toISOString().slice(11, 16)}:`,
    "",
    `Platform: $${platform.toFixed(2)} of the $${budget} daily budget (AI_DAILY_BUDGET_USD)${platform >= budget ? ". Non-essential crons are paused until tomorrow." : "."}`,
    ...(hot.length ? ["", "Brands at 80%+ of their daily AI ceiling:", ...hot.map((h) => `- ${h}`)] : []),
    "",
    `Details: ${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/dashboard/admin/usage`,
    "Raise a limit without a deploy: QUOTAS_JSON or AI_DAILY_BUDGET_USD on Railway.",
  ].join("\n")
  if (new URL(req.url).searchParams.get("dryRun") === "1") return NextResponse.json({ alert: true, alreadySent: !!sent, text })
  if (sent) return NextResponse.json({ ok: true, alert: true, alreadySent: true })
  try {
    const { error } = await resend.emails.send({ from: fromAs("Alphaa"), to: ADMIN_EMAILS, subject: `Alphaa AI usage at 80%+ (${day})`, text })
    if (error) throw new Error(error.message)
  } catch (e) {
    console.error("[usage-alert] send", e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, error: "send failed" }, { status: 502 })
  }
  await db.mockActivity.create({ data: { userId: founder.id, type: "usage_alert", title: "Usage alert sent", metadata: { date: day, platform, brands: hot.length } } })
  return NextResponse.json({ ok: true, alert: true, sent: true })
}
