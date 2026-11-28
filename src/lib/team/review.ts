// "Nothing goes live without sign-off" for teams. Every route that would publish or schedule
// asks goLive() first:
//   publisher / admin / owner  → go ahead (null), exactly as before teams.
//   reviewer                   → the item is marked "approved, waiting for a publisher"; it stays
//                                 a draft. A publisher, an admin or the owner makes it go live.
//   creator                    → the item is marked "sent for review"; it stays a draft.
// Autopilot only covers work Alphaa makes itself: anything a reviewer or creator sends on waits
// here, whatever the switch says. Marks are MockActivity rows of type "team_review" on the brand
// (metadata { kind, itemId, state, actor }), so the ledger shows "Sam approved …".
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { goLiveMode, TEAM_REVIEW, whoName } from "./permissions"
import { actorStamp, getActor, type Actor, type ActorStamp } from "./actor"

export { TEAM_REVIEW }
export type ReviewKind = "social" | "gbp" | "site" | "review" | "email"
export type ReviewState = "submitted" | "approved"
export type ReviewMark = { state: ReviewState; by: ActorStamp; at: string }

const NOUN: Record<ReviewKind, string> = { social: "a social post", gbp: "a Google update", site: "a website post", review: "a review reply", email: "a customer email" }
export { whoName }

export async function markReview(brandId: string, kind: ReviewKind, itemId: string, state: ReviewState, by: ActorStamp): Promise<void> {
  const who = whoName(by)
  await logActivity(brandId, TEAM_REVIEW, state === "approved" ? `${who} approved ${NOUN[kind]}. It’s waiting for a publisher` : `${who} sent ${NOUN[kind]} for review`, undefined, { kind, itemId, state, actor: by })
}

/** The newest mark per item ("kind:id"), only marks newer than the item's last publish/schedule. */
export async function reviewMarks(brandId: string, since = new Date(Date.now() - 60 * 86_400_000)): Promise<Map<string, ReviewMark>> {
  const rows = await db.mockActivity.findMany({ where: { userId: brandId, type: TEAM_REVIEW, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 300, select: { metadata: true, createdAt: true } })
  const out = new Map<string, ReviewMark>()
  for (const r of rows) {
    const m = (r.metadata ?? {}) as { kind?: string; itemId?: string; state?: string; actor?: ActorStamp }
    if (!m.kind || !m.itemId || !m.actor || (m.state !== "submitted" && m.state !== "approved")) continue
    const k = `${m.kind}:${m.itemId}`
    if (!out.has(k)) out.set(k, { state: m.state, by: m.actor, at: r.createdAt.toISOString() })
  }
  return out
}

/** "Approved by Sam · waiting for a publisher" / "Sent for review by Sam". */
export function markLabel(m: ReviewMark | null | undefined): string | null {
  if (!m) return null
  return m.state === "approved" ? `Approved by ${whoName(m.by)} · waiting for a publisher` : `Sent for review by ${whoName(m.by)}`
}

/** Only this brand's own items can be marked. */
async function itemExists(brandId: string, kind: ReviewKind, id: string): Promise<boolean> {
  if (kind === "gbp") return !!(await db.gbpPost.findFirst({ where: { id, userId: brandId }, select: { id: true } }))
  if (kind === "review") return !!(await db.gmbReview.findFirst({ where: { id, userId: brandId }, select: { id: true } }))
  if (kind === "site") return !!(await db.mockActivity.findFirst({ where: { id, userId: brandId, type: "post_draft" }, select: { id: true } }))
  if (kind === "social") {
    const { getPost } = await import("@/lib/social/store")
    return !!(await getPost(brandId, id).catch(() => null))
  }
  return !!(await db.mockActivity.findFirst({ where: { id, userId: brandId }, select: { id: true } }))
}

export type GoLiveBody ={ ok: true; review: ReviewState; message: string }

/**
 * Call before anything goes live. null = this person may publish: carry on. Otherwise the item
 * was marked and the response says so (200, `review` set), and nothing was published.
 */
export async function goLive(brandId: string, kind: ReviewKind, itemId: string, actor?: Actor | null): Promise<NextResponse | null> {
  const a = actor ?? (await getActor())
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const mode = goLiveMode(a.role)
  if (mode === "publish") return null
  const stamp = await actorStamp(a)
  if (mode === "none" || !stamp) return NextResponse.json({ error: "You can’t send this on.", role: true }, { status: 403 })
  if (!(await itemExists(brandId, kind, itemId))) return NextResponse.json({ error: "That isn’t here any more." }, { status: 404 })
  const state: ReviewState = mode === "approve" ? "approved" : "submitted"
  await markReview(brandId, kind, itemId, state, stamp)
  const message = state === "approved" ? "Approved. A publisher, an admin or the owner puts it live." : "Sent for review. Nothing goes out until a reviewer approves it and a publisher puts it live."
  return NextResponse.json({ ok: true, review: state, message } satisfies GoLiveBody)
}
