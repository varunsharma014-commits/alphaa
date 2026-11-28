// Rescheduling from the content calendar (drag-and-drop or the date/time picker). Writes the REAL
// time the publishers use: social_post.scheduledFor (/api/cron/social-publish), GbpPost.scheduledFor
// (/api/cron/due + gbp-posts), post_draft metadata.scheduledFor (/api/cron/site-posts) and
// email_campaign scheduledFor (/api/cron/due). Rules in rules.ts: no past times, the Autopilot stop
// window needs the owner's explicit OK to cut short, and a move is the owner's OK when Autopilot is
// off or the item was waiting for them.
import { hasPlaceholders } from "@/lib/brackets" // site posts: Markdown links are not placeholders
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { savePost } from "@/lib/social/store"
import { getCampaign, getContacts, lastSentAt, listCampaigns, SEND_GAP_DAYS, updateCampaign } from "@/lib/email-campaigns/store"
import { logActivity } from "@/lib/activity"
import { decideMove, windowEndFor } from "./rules"
import { autopilotOn, gbpOk, socialRows, type CalKind } from "./items"
import { DEFAULT_TZ, isValidTz, whenLabel } from "./tz"

export type MoveResult =
  | { ok: true; at: string; approved: boolean }
  | { ok: false; error: string; needsOk?: boolean; earliest?: string | null; status?: number }

const BRACKETS = /\[[^\]]{2,}\]/
const DAY = 86_400_000

export async function moveItem(user: User, kind: CalKind, id: string, atIso: string, confirm = false): Promise<MoveResult> {
  const userId = user.id
  const s = await getAgentSettings(userId)
  const tz = isValidTz(s.calendar?.timezone) ? s.calendar!.timezone! : DEFAULT_TZ
  const target = Date.parse(atIso)
  const now = Date.now()
  const auto = autopilotOn(s)
  const label = (t: number) => whenLabel(t, tz)
  const decide = (status: "draft" | "scheduled", ownerOk: boolean, windowEnd: number | null, currentAt: number | null) => {
    // Moving later never shortens the time the owner has to stop it.
    const end = windowEnd != null && currentAt != null ? Math.min(windowEnd, currentAt) : windowEnd
    return decideMove({ now, target, autopilotOn: auto, status, ownerOk, windowEnd: end, confirm }, label)
  }
  const refuse = (d: Exclude<ReturnType<typeof decideMove>, { ok: true }>): MoveResult => ({ ok: false, error: d.message, needsOk: d.reason === "window", earliest: d.earliest ? new Date(d.earliest).toISOString() : null, status: d.reason === "window" ? 409 : 400 })
  const at = new Date(target).toISOString()

  if (kind === "social") {
    if (!hasPro(user)) return { ok: false, error: "Social media comes with the Pro plan.", status: 403 }
    const [p] = await socialRows(userId, 1, id)
    if (!p) return { ok: false, error: "That post isn’t here any more.", status: 404 }
    if (p.status !== "draft" && p.status !== "scheduled") return { ok: false, error: p.status === "published" || p.status === "partial" ? "It already went out." : "It can’t be moved right now.", status: 409 }
    if (!p.accountIds.length) return { ok: false, error: "Connect a social account first, then I can post it.", status: 409 }
    const cur = p.scheduledFor ? Date.parse(p.scheduledFor) : null
    const d = decide(p.status, !!p.ownerOk, p.status === "scheduled" ? windowEndFor(p.stopUntil, p.createdAt) : null, p.status === "scheduled" ? cur : null)
    if (!d.ok) return refuse(d)
    const { createdAt: _c, ...post } = p
    void _c
    await savePost(userId, { ...post, status: "scheduled", scheduledFor: at, ownerOk: d.ownerOk || !!p.ownerOk })
    return { ok: true, at, approved: d.approves }
  }

  if (kind === "gbp") {
    if (!hasPro(user)) return { ok: false, error: "Google listing posts come with the Pro plan.", status: 403 }
    const g = await db.gbpPost.findFirst({ where: { id, userId } })
    if (!g) return { ok: false, error: "That update isn’t here any more.", status: 404 }
    if (g.status !== "draft" && g.status !== "scheduled") return { ok: false, error: g.status === "posted" ? "It already went out." : "It can’t be moved right now.", status: 409 }
    const integ = await db.integration.findUnique({ where: { userId }, select: { gmbAccountId: true, gmbLocationId: true } })
    if (!integ?.gmbAccountId || !integ.gmbLocationId) return { ok: false, error: "Connect your Google listing first.", status: 409 }
    if (BRACKETS.test(g.content)) return { ok: false, error: "It still has [bracketed] facts only you know. Fill them in first.", status: 409 }
    const st = g.status as "draft" | "scheduled"
    const ok = gbpOk(s, g.id)
    const d = decide(st, ok, st === "scheduled" ? windowEndFor(null, g.createdAt) : null, st === "scheduled" ? g.scheduledFor?.getTime() ?? null : null)
    if (!d.ok) return refuse(d)
    // Only while it's still waiting, so a publisher run that just posted it wins.
    const r = await db.gbpPost.updateMany({ where: { id: g.id, status: { in: ["draft", "scheduled"] } }, data: { status: "scheduled", scheduledFor: new Date(target) } })
    if (!r.count) return { ok: false, error: "It already went out.", status: 409 }
    if (d.ownerOk && !ok) {
      const cur = await getAgentSettings(userId)
      await saveAgentSettings(userId, { calendar: { ...(cur.calendar ?? {}), okGbp: [...(cur.calendar?.okGbp ?? []), g.id].slice(-300) } })
    }
    return { ok: true, at, approved: d.approves }
  }

  if (kind === "site") {
    const row = await db.mockActivity.findFirst({ where: { id, userId, type: "post_draft" } })
    if (!row) return { ok: false, error: "That post isn’t here any more.", status: 404 }
    const m = (row.metadata ?? {}) as { status?: string; markdown?: string; scheduledFor?: string; ownerOk?: boolean; stopUntil?: string | null }
    if (m.status === "published") return { ok: false, error: "It’s already live.", status: 409 }
    if (!s.wp && !s.site) return { ok: false, error: "Connect your website first, so I can publish it there.", status: 409 }
    if (hasPlaceholders(m.markdown ?? "")) return { ok: false, error: "This draft still has [bracketed] facts only you know. Fill them in first.", status: 409 }
    const st = m.status === "scheduled" ? "scheduled" : "draft"
    const d = decide(st, !!m.ownerOk, st === "scheduled" ? windowEndFor(m.stopUntil, row.createdAt) : null, st === "scheduled" && m.scheduledFor ? Date.parse(m.scheduledFor) : null)
    if (!d.ok) return refuse(d)
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), status: "scheduled", scheduledFor: at, ownerOk: d.ownerOk || !!m.ownerOk, scheduleError: null } } })
    return { ok: true, at, approved: d.approves }
  }

  // Email: always the owner's OK (nothing emails customers on a schedule without it).
  if (!hasPro(user)) return { ok: false, error: "Email campaigns come with the Pro plan.", status: 403 }
  const row = await getCampaign(userId, id)
  if (!row) return { ok: false, error: "I can’t find that email any more.", status: 404 }
  if (row.c.status !== "draft" && row.c.status !== "scheduled") return { ok: false, error: row.c.status === "sent" ? "That one already went out." : "It can’t be moved right now.", status: 409 }
  if (!s.emailOutreach?.address?.trim()) return { ok: false, error: "I need your business mailing address first. The law requires it on every marketing email.", status: 409 }
  if (!(await getContacts(userId)).length) return { ok: false, error: "Your list is empty. Add your customers first.", status: 409 }
  const d = decideMove({ now, target, autopilotOn: auto, status: "draft", ownerOk: false, windowEnd: null }, label)
  if (!d.ok) return refuse(d)
  // At most one email a week: after the last send, and a week away from any other scheduled one.
  const last = await lastSentAt(userId)
  if (last && target < last.getTime() + SEND_GAP_DAYS * DAY) return { ok: false, error: `I send at most one email a week so your customers stay glad to hear from you. The next one can go from ${label(last.getTime() + SEND_GAP_DAYS * DAY)}.`, status: 409 }
  const clash = (await listCampaigns(userId, 30)).find((r) => r.id !== id && r.c.status === "scheduled" && r.c.scheduledFor && Math.abs(Date.parse(r.c.scheduledFor) - target) < SEND_GAP_DAYS * DAY)
  if (clash) return { ok: false, error: `“${clash.c.subject}” already goes out ${label(Date.parse(clash.c.scheduledFor!))}. I send at most one email a week.`, status: 409 }
  await updateCampaign(id, { status: "scheduled", scheduledFor: at, error: undefined })
  if (row.c.status === "draft") await logActivity(userId, "email_campaign_scheduled", `Scheduled your email “${row.c.subject}” for ${label(target)}`, "", { campaignId: id })
  return { ok: true, at, approved: row.c.status === "draft" }
}

/** Stop a scheduled email (back to a draft) or put a stopped one back at its time. */
export async function holdEmail(userId: string, id: string, op: "stop" | "undo"): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const row = await getCampaign(userId, id)
  if (!row) return { ok: false, error: "I can’t find that email any more." }
  if (op === "stop") {
    if (row.c.status !== "scheduled") return { ok: false, error: row.c.status === "sent" || row.c.status === "sending" ? "It already went out." : "It isn’t scheduled." }
    await updateCampaign(id, { status: "draft" })
    return { ok: true, status: "draft" }
  }
  if (row.c.status !== "draft" || !row.c.scheduledFor) return { ok: false, error: "It isn’t on hold." }
  if (Date.parse(row.c.scheduledFor) < Date.now() + 5 * 60_000) return { ok: false, error: "Its time has passed. Pick a new time on the calendar." }
  await updateCampaign(id, { status: "scheduled" })
  return { ok: true, status: "scheduled" }
}
