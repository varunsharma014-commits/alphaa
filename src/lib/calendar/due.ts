// Publishers for calendar times that aren't covered by an existing 10-minute cron:
//   Google listing posts: due GbpPosts (status "scheduled") at their exact time, not only at the
//     13:00 UTC gbp-posts runs. The gbp-posts cron calls the same function (one run at a time).
//   Emails the owner put on the calendar (status "scheduled") go out through the normal send path
//     (startSend: weekly gap, address, opt-outs, quota). If it can't send, it goes back to a draft
//     with the reason and one ledger row, so it isn't retried every 10 minutes.
// Both are run by /api/cron/due every 10 minutes.
import { db } from "@/lib/db"
import { approveGbpPost } from "@/lib/approvals"
import { hasPro } from "@/lib/billing"
import { logActivity } from "@/lib/activity"
import { runAsUser } from "@/lib/usage"

let gbpRun: Promise<{ due: number; posted: number }> | null = null

export function publishDueGbpPosts(): Promise<{ due: number; posted: number }> {
  if (gbpRun) return gbpRun
  gbpRun = (async () => {
    const due = await db.gbpPost.findMany({ where: { status: "scheduled", scheduledFor: { lte: new Date() } }, select: { id: true, userId: true }, take: 200 })
    let posted = 0
    for (const p of due) {
      const r = await approveGbpPost(p.userId, p.id).catch(() => ({ ok: false as const, error: "error" }))
      if (r.ok) posted++
      else await db.gbpPost.updateMany({ where: { id: p.id, status: "scheduled" }, data: { status: "draft" } }).catch(() => null)
    }
    return { due: due.length, posted }
  })().finally(() => { gbpRun = null })
  return gbpRun
}

let emailRun: Promise<{ due: number; started: number; failed: number }> | null = null

export function sendDueEmails(): Promise<{ due: number; started: number; failed: number }> {
  if (emailRun) return emailRun
  emailRun = (async () => {
    const { startSend } = await import("@/lib/email-campaigns/send")
    const { updateCampaign } = await import("@/lib/email-campaigns/store")
    const rows = await db.mockActivity.findMany({ where: { type: "email_campaign", metadata: { path: ["status"], equals: "scheduled" } }, select: { id: true, userId: true, metadata: true }, take: 200 })
    const due = rows.filter((r) => { const t = (r.metadata as { scheduledFor?: string } | null)?.scheduledFor; return !!t && Date.parse(t) <= Date.now() })
    let started = 0, failed = 0
    for (const r of due.slice(0, 40)) {
      const user = await db.user.findUnique({ where: { id: r.userId }, select: { plan: true, email: true } })
      const subject = (r.metadata as { subject?: string } | null)?.subject ?? "your email"
      const fail = async (why: string) => {
        failed++
        await updateCampaign(r.id, { status: "draft", error: why })
        await logActivity(r.userId, "email_campaign_failed", `Your scheduled email “${subject}” didn’t go out`, why, { campaignId: r.id }).catch(() => null)
      }
      if (!user || !hasPro(user)) { await fail("Email campaigns come with the Pro plan."); continue }
      // startSend sets "sending" itself; it only sends from draft/failed states, so it goes back to a draft first.
      await updateCampaign(r.id, { status: "draft" })
      const res = await runAsUser(r.userId, () => startSend(r.userId, r.id)).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "failed" }))
      if (res.ok) started++
      else await fail(res.error)
    }
    return { due: due.length, started, failed }
  })().finally(() => { emailRun = null })
  return emailRun
}
