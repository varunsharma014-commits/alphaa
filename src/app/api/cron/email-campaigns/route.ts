export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { compedEmailWhere } from "@/lib/billing"
import { runAsUser } from "@/lib/usage"
import { logActivity } from "@/lib/activity"
import { getAgentSettings } from "@/lib/agent/settings"
import { createCampaign, getContacts, listCampaigns } from "@/lib/email-campaigns/store"
import { writeCampaign } from "@/lib/email-campaigns/write"
import { resumeStuckSends, sendBlocker, startSend } from "@/lib/email-campaigns/send"

// Daily (15:00 UTC): resumes any send a restart interrupted, and once every 4 weeks writes the
// month's customer email for each Growth brand that has a list and a mailing address. With
// autopilot email "auto" it goes out straight away (same limits as a manual send); otherwise it
// waits as a draft in the Email thread. `?dryRun=1` lists who is due.
const EVERY_DAYS = 28
let running = false

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const resumed = await resumeStuckSends()
  const owners = await db.mockActivity.findMany({ where: { type: "email_contacts" }, select: { userId: true }, distinct: ["userId"], take: 1000 })
  const users = await db.user.findMany({
    where: { id: { in: owners.map((o) => o.userId) }, OR: [{ plan: { contains: "growth", mode: "insensitive" }, subscriptionStatus: "active" }, ...compedEmailWhere()] },
    select: { id: true },
  })
  const due: { id: string; auto: boolean }[] = []
  for (const u of users) {
    const [s, contacts, recent] = await Promise.all([getAgentSettings(u.id), getContacts(u.id), listCampaigns(u.id, 5)])
    if (!contacts.length || !s.emailOutreach?.address) continue
    if (recent.some((r) => Date.now() - r.createdAt.getTime() < EVERY_DAYS * 86_400_000)) continue
    due.push({ id: u.id, auto: s.autopilot?.email === "auto" })
  }
  if (req.nextUrl.searchParams.get("dryRun") === "1") return NextResponse.json({ resumed, due })
  if (running) return NextResponse.json({ resumed, skipped: "already running" })
  running = true
  void (async () => {
    for (const u of due) {
      await runAsUser(u.id, async () => {
        const avoid = (await listCampaigns(u.id, 6)).filter((r) => r.c.status === "sent").map((r) => r.c.subject)
        const c = await writeCampaign(u.id, { avoid })
        const row = await createCampaign(u.id, { v: 1, status: "draft", auto: true, ...c })
        if (u.auto && !(await sendBlocker(u.id))) {
          await startSend(u.id, row.id)
        } else {
          await logActivity(u.id, "email_campaign_draft", `Wrote this month’s email to your customers: “${c.subject}”`, "", { campaignId: row.id })
        }
      }).catch((e) => console.error("[email-campaigns] brand", u.id, e instanceof Error ? e.message : e))
    }
  })().finally(() => { running = false })
  return NextResponse.json({ resumed, started: due.length })
}
