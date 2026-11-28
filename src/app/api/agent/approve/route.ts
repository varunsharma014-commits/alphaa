export const dynamic = "force-dynamic"
export const maxDuration = 60

import { isQuotaError, quotaBody } from "@/lib/quotas"
import { usageCtx } from "@/lib/usage"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { approve, draftReviewReply, savedReviewDraft, REVIEW_DRAFT, type ApprovalKind } from "@/lib/approvals"
import { readApproveToken } from "@/lib/approve-token"
import { GuardrailError } from "@/lib/guardrails"
import { saveDraftText } from "@/lib/draft-versions"
import { holdSitePost } from "@/lib/workspace/site-posts"
import { getActor, type Actor } from "@/lib/team/actor"
import { goLive, type ReviewKind } from "@/lib/team/review"
import { goLiveMode, isMemberRole } from "@/lib/team/permissions"

// One-tap approvals from the briefing. Signed in: any of the brand's items, by the person's role
// on the brand (lib/team/review.ts: publishers publish, reviewers approve for a publisher,
// creators send for review). From the email: a signed token that names exactly one item (no
// login); an owner's link publishes, a member's link uses that member's CURRENT role.
const body = z.object({
  kind: z.enum(["review", "gbp", "post"]),
  id: z.string().min(1).max(40),
  action: z.enum(["publish", "draft"]).default("publish"),
  text: z.string().max(30_000).optional(),
  t: z.string().max(600).optional(),
})

const REVIEW_KIND: Record<ApprovalKind, ReviewKind> = { review: "review", gbp: "gbp", post: "site" }

export async function POST(req: Request) {
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  let userId: string | null = null
  let actor: Actor | null = null
  if (input.t) {
    const c = readApproveToken(input.t)
    if (!c || c.k !== input.kind || c.i !== input.id) return NextResponse.json({ error: "This link has expired. Open Alphaa to approve it." }, { status: 401 })
    userId = c.u
    // No session on this path: tell the audit trail who acted (lib/activity.ts).
    usageCtx().actor = { clerkId: "", role: "owner" }
    if (c.m) {
      // A member's link: only while they're still an active member, with today's role.
      const m = await db.teamMember.findFirst({ where: { id: c.m, brandId: c.u, status: "active" }, select: { id: true, clerkId: true, role: true, email: true, name: true } })
      if (!m || !m.clerkId || !isMemberRole(m.role)) return NextResponse.json({ error: "This link no longer works. Open Alphaa to see what’s waiting." }, { status: 401 })
      actor = { clerkId: m.clerkId, role: m.role, brandClerkId: "", memberId: m.id, email: m.email, name: m.name }
      if (goLiveMode(m.role) !== "publish" && goLiveMode(m.role) !== "approve") return NextResponse.json({ error: "Your role can’t approve from email. Open Alphaa to see what’s waiting.", role: true }, { status: 403 })
      usageCtx().actor = { clerkId: m.clerkId, role: m.role, email: m.email, name: m.name, memberId: m.id }
    }
  } else {
    userId = (await currentUser())?.id ?? null
    actor = await getActor()
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    if (input.action === "draft") {
      if (input.kind !== "review") return NextResponse.json({ error: "Bad request" }, { status: 400 })
      const text = (await savedReviewDraft(userId, input.id)) ?? (await draftReviewReply(userId, input.id))
      return text ? NextResponse.json({ text }) : NextResponse.json({ error: "I couldn’t write it just now. Try again in a minute." }, { status: 502 })
    }
    // Team members who can't publish: the item is marked (approved / sent for review), not published.
    if (actor && actor.role !== "owner") {
      const own = await itemBelongs(userId, input.kind, input.id)
      if (!own) return NextResponse.json({ error: "That isn’t here any more." }, { status: 404 })
      if (input.text?.trim() && goLiveMode(actor.role) !== "publish") await keepEdit(userId, input.kind, input.id, input.text.trim())
      const held = await goLive(userId, REVIEW_KIND[input.kind], input.id, actor)
      if (held) return held
    }
    const r = await approve(userId, input.kind, input.id, input.text)
    if (!r.ok && r.banned) return NextResponse.json({ error: r.error, banned: r.banned, confirmBanned: true }, { status: 409 })
    return r.ok ? NextResponse.json({ ok: true, url: r.url ?? null }) : NextResponse.json({ error: r.error, ...(r.quota ? { quota: true, buy: true } : {}) }, { status: r.quota ? 429 : 400 })
  } catch (err) {
    if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
    if (err instanceof GuardrailError) return NextResponse.json({ error: err.message, guardrail: true }, { status: 409 })
    console.error("[approve]", err)
    return NextResponse.json({ error: "Something went wrong. Nothing was published." }, { status: 500 })
  }
}

/** A reviewer's or creator's edits are kept on the draft, so the publisher sees what they approved. */
async function keepEdit(userId: string, kind: ApprovalKind, id: string, text: string): Promise<void> {
  if (kind === "gbp") {
    // An edited update that was scheduled comes off the schedule: the new text waits for a publisher.
    await db.gbpPost.updateMany({ where: { id, userId, status: { not: "posted" } }, data: { content: text.slice(0, 1500), status: "draft" } })
  } else if (kind === "review") {
    await db.mockActivity.create({ data: { userId, type: REVIEW_DRAFT, title: "Edited a review reply", metadata: { reviewId: id, text: text.slice(0, 4000) } } })
  } else {
    const r = await saveDraftText(userId, id, { markdown: text, by: "owner" }).catch(() => null)
    if (r?.ok && r.draft.status === "scheduled") await holdSitePost(userId, id, "stop").catch(() => null)
  }
}

/** The item is this brand's (so a member can't mark another brand's ids). */
async function itemBelongs(userId: string, kind: ApprovalKind, id: string): Promise<boolean> {
  if (kind === "review") return !!(await db.gmbReview.findFirst({ where: { id, userId }, select: { id: true } }))
  if (kind === "gbp") return !!(await db.gbpPost.findFirst({ where: { id, userId }, select: { id: true } }))
  return !!(await db.mockActivity.findFirst({ where: { id, userId, type: "post_draft" }, select: { id: true } }))
}
