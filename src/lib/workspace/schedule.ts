// The ONE action at the end of a "ready" sheet. Autopilot on = "Add to Going out soon": scheduled
// after the stop window (72h), stoppable from the Briefing. Autopilot off = "Schedule": the owner's
// tap is the approval, so it goes on the schedule now (social: in 5 minutes; Google: the next
// gbp-posts run; website: published now through approveSitePost).
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { consentCurrent } from "@/lib/auto-approve-text"
import { getPost, savePost } from "@/lib/social/store"
import { approveSitePost } from "@/lib/approvals"
import { scheduleSitePost, STOP_WINDOW_MS } from "./site-posts"
import { ownerBannedHit } from "@/lib/owner-edit-check"

/** The gbp-posts cron publishes due posts Mon/Tue/Thu/Fri at 13:00 UTC (lib/cron-scheduler.ts). */
export function nextGbpRun(after: Date): Date {
  for (let i = 0; i < 8; i++) {
    const d = new Date(after)
    d.setUTCDate(d.getUTCDate() + i)
    d.setUTCHours(13, 0, 0, 0)
    if (d > after && [1, 2, 4, 5].includes(d.getUTCDay())) return d
  }
  return new Date(after.getTime() + 86_400_000)
}

export async function scheduleMade(userId: string, kind: "social" | "gbp" | "site", id: string, window: boolean): Promise<{ ok: true; at: string | null; url?: string | null } | { ok: false; error: string; quota?: boolean; banned?: string }> {
  const s = await getAgentSettings(userId)
  if (window && !(s.autoApprove && consentCurrent(s))) return { ok: false, error: "Autopilot is off, so this waits for your OK. Use Schedule instead." }
  const base = window ? new Date(Date.now() + STOP_WINDOW_MS) : new Date(Date.now() + 5 * 60_000)
  if (kind === "social") {
    const p = await getPost(userId, id)
    if (!p) return { ok: false, error: "That post isn’t here any more." }
    if (!p.accountIds.length) return { ok: false, error: "Connect a social account first, then I can post it." }
    // The owner's own edits: their banned words are flagged before it's scheduled (they can confirm).
    const hit = await ownerBannedHit(userId, [p.text, p.title])
    if (hit) return { ok: false, error: hit.message, banned: hit.word }
    // A planned day (the week run sets one) is kept when it's later than the earliest allowed time.
    const planned = p.scheduledFor && Date.parse(p.scheduledFor) > base.getTime() ? p.scheduledFor : null
    p.status = "scheduled"
    p.scheduledFor = planned ?? base.toISOString()
    // Autopilot's stop window (content calendar rules), or the owner's own OK.
    if (window) p.stopUntil = base.toISOString()
    else p.ownerOk = true
    await savePost(userId, p)
    return { ok: true, at: p.scheduledFor }
  }
  if (kind === "gbp") {
    const integ = await db.integration.findUnique({ where: { userId }, select: { gmbAccountId: true, gmbLocationId: true } })
    if (!integ?.gmbAccountId || !integ.gmbLocationId) return { ok: false, error: "Connect your Google listing first." }
    const g = await db.gbpPost.findFirst({ where: { id, userId } })
    if (!g) return { ok: false, error: "That update isn’t here any more." }
    if (/\[[^\]]{2,}\]/.test(g.content)) return { ok: false, error: "It still has [bracketed] facts only you know. Fill them in first." }
    const hit = await ownerBannedHit(userId, [g.content])
    if (hit) return { ok: false, error: hit.message, banned: hit.word }
    const at = nextGbpRun(base)
    await db.gbpPost.update({ where: { id: g.id }, data: { status: "scheduled", scheduledFor: at } })
    // The owner's tap is their OK for this one (the content calendar won't ask again when it moves).
    if (!window) await saveAgentSettings(userId, { calendar: { ...(s.calendar ?? {}), okGbp: [...(s.calendar?.okGbp ?? []), g.id].slice(-300) } })
    return { ok: true, at: at.toISOString() }
  }
  if (window) {
    const r = await scheduleSitePost(userId, id)
    return r.ok ? { ok: true, at: r.at } : r
  }
  const r = await approveSitePost(userId, id)
  return r.ok ? { ok: true, at: null, url: r.url ?? null } : { ok: false, error: r.error, quota: r.quota, banned: r.banned }
}
