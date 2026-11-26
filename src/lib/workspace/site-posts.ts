// Website posts that go out on schedule (Research → "Draft it" → "Add to Going out soon").
// A post_draft row gets metadata.status "scheduled" + scheduledFor; the 10-minute cron
// (/api/cron/site-posts) publishes due ones through the same path as a manual approval
// (approveSitePost), only while the owner's Autopilot is on and the site is connected.
// Stop = back to "ready"; nothing else ever reaches this state.
import { db } from "@/lib/db"
import { approveSitePost } from "@/lib/approvals"
import { getAgentSettings } from "@/lib/agent/settings"
import { consentCurrent } from "@/lib/auto-approve-text"

export const STOP_WINDOW_MS = 72 * 3_600_000 // the "up to 3 days" to stop it

type Meta = { title?: string; markdown?: string; status?: string; scheduledFor?: string; scheduleError?: string; imageId?: string | null; excerpt?: string }

export async function scheduledSitePosts(userId: string) {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "post_draft", metadata: { path: ["status"], equals: "scheduled" } }, orderBy: { createdAt: "desc" }, take: 20 })
  return rows.map((r) => ({ id: r.id, m: r.metadata as Meta })).filter((r) => r.m.scheduledFor)
}

export async function scheduleSitePost(userId: string, draftId: string): Promise<{ ok: true; at: string } | { ok: false; error: string }> {
  const [row, s] = await Promise.all([db.mockActivity.findFirst({ where: { id: draftId, userId, type: "post_draft" } }), getAgentSettings(userId)])
  if (!row) return { ok: false, error: "That draft isn’t here any more." }
  if (!s.autoApprove || !consentCurrent(s)) return { ok: false, error: "Autopilot is off, so this waits for your OK. Use Publish instead." }
  if (!s.wp && !s.site) return { ok: false, error: "Connect your website first, so I can publish it there." }
  const m = row.metadata as Meta
  if (m.status === "published") return { ok: false, error: "It’s already live." }
  if (/\[[^\]]{2,}\]/.test(m.markdown ?? "")) return { ok: false, error: "This draft still has [bracketed] facts only you know. Fill them in first." }
  const at = new Date(Date.now() + STOP_WINDOW_MS).toISOString()
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), status: "scheduled", scheduledFor: at, scheduleError: null } } })
  return { ok: true, at }
}

export async function holdSitePost(userId: string, id: string, op: "stop" | "undo"): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const row = await db.mockActivity.findFirst({ where: { id, userId, type: "post_draft" } })
  if (!row) return { ok: false, error: "That post isn’t here any more." }
  const m = row.metadata as Meta
  if (op === "stop") {
    if (m.status !== "scheduled") return { ok: false, error: m.status === "published" ? "It already went out." : "It isn’t scheduled." }
    await db.mockActivity.update({ where: { id }, data: { metadata: { ...(row.metadata as object), status: "ready" } } })
    return { ok: true, status: "ready" }
  }
  if (m.status !== "ready") return { ok: false, error: "It isn’t on hold." }
  const at = m.scheduledFor && Date.parse(m.scheduledFor) > Date.now() ? m.scheduledFor : new Date(Date.now() + 5 * 60_000).toISOString()
  await db.mockActivity.update({ where: { id }, data: { metadata: { ...(row.metadata as object), status: "scheduled", scheduledFor: at } } })
  return { ok: true, status: "scheduled" }
}

/** Cron: publish what's due. Autopilot turned off since = it stays scheduled (and stoppable). */
export async function publishDueSitePosts(): Promise<{ due: number; published: number; failed: number }> {
  const rows = await db.mockActivity.findMany({ where: { type: "post_draft", metadata: { path: ["status"], equals: "scheduled" } }, take: 200 })
  const due = rows.filter((r) => { const t = (r.metadata as Meta).scheduledFor; return !!t && Date.parse(t) <= Date.now() })
  let published = 0, failed = 0
  for (const r of due.slice(0, 40)) {
    if (!r.userId) continue
    const s = await getAgentSettings(r.userId)
    if (!s.autoApprove || !consentCurrent(s)) continue
    const res = await approveSitePost(r.userId, r.id).catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "failed" }))
    if (res.ok) published++
    else {
      failed++
      // Back to a draft with the reason, so it isn't retried every 10 minutes.
      const cur = await db.mockActivity.findUnique({ where: { id: r.id } })
      if (cur && (cur.metadata as Meta).status === "scheduled") await db.mockActivity.update({ where: { id: r.id }, data: { metadata: { ...(cur.metadata as object), status: "ready", scheduleError: "error" in res ? res.error : "failed" } } })
    }
  }
  return { due: due.length, published, failed }
}
