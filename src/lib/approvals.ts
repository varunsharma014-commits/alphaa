// The owner's one-tap approvals, shared by the dashboard briefing, the API
// routes and the no-login links in the weekly briefing email. Each function
// takes our internal user id and checks the item belongs to that user.

import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { postReviewReply, resolveAccessToken } from "@/lib/gmb"
import { postToGmb, containsPlaceholders } from "@/lib/gbp-poster"
import { logActivity } from "@/lib/activity"
import { pushChange } from "@/lib/connector/push"

export type ApprovalKind = "review" | "gbp" | "post"
export type ApprovalResult = { ok: true; url?: string | null } | { ok: false; error: string }

/** Review replies are written ahead of time (overnight) and kept here until approved. */
export const REVIEW_DRAFT = "review_draft"

export async function savedReviewDraft(userId: string, reviewId: string): Promise<string | null> {
  const row = await db.mockActivity.findFirst({
    where: { userId, type: REVIEW_DRAFT, metadata: { path: ["reviewId"], equals: reviewId } },
    orderBy: { createdAt: "desc" },
  })
  return (row?.metadata as { text?: string } | null)?.text ?? null
}

/** Write (and keep) a reply to a Google review. Nothing is posted. */
export async function draftReviewReply(userId: string, reviewId: string): Promise<string | null> {
  const [user, review] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true } }),
    db.gmbReview.findUnique({ where: { id: reviewId }, select: { userId: true, authorName: true, rating: true, comment: true } }),
  ])
  if (!user || !review || review.userId !== userId) return null
  const businessName = user.businessName ?? "our business"
  const prompt = `You are a professional, warm business owner responding to a Google review for ${businessName} (${user.businessType ?? "business"}).

Review from ${review.authorName} (${review.rating}/5 stars):
"${review.comment ?? "(No written comment)"}"

Write a professional, genuine, and warm reply from the business owner.
- If it's a positive review (4-5 stars): thank them warmly, mention something specific from their comment if possible, invite them back.
- If it's a neutral review (3 stars): thank them for the feedback, acknowledge any concerns, show commitment to improvement.
- If it's a negative review (1-2 stars): apologize sincerely, take responsibility, offer to make it right, provide a way to contact you.

Keep it 2-4 sentences. Sound human, not robotic. Do not use markdown. Return only the reply text.`
  const message = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 512, messages: [{ role: "user", content: prompt }] })
  const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : ""
  if (!text) return null
  await db.mockActivity.create({
    data: { userId, type: REVIEW_DRAFT, title: `Wrote a reply to ${review.authorName}’s review`, metadata: { reviewId, text } },
  })
  return text
}

/** Post the owner-approved reply to Google, then save it on the review. */
export async function approveReviewReply(userId: string, reviewId: string, rawText?: string): Promise<ApprovalResult> {
  const review = await db.gmbReview.findUnique({ where: { id: reviewId }, select: { id: true, userId: true, reviewId: true, reply: true } })
  if (!review || review.userId !== userId) return { ok: false, error: "That review isn’t here any more." }
  if (review.reply) return { ok: true }
  const text = (rawText ?? (await savedReviewDraft(userId, reviewId)) ?? "").trim()
  if (!text) return { ok: false, error: "There’s no reply to post yet." }
  if (text.length > 4000) return { ok: false, error: "Google allows replies up to 4,000 characters." }
  const integration = await db.integration.findUnique({ where: { userId } })
  if (!integration?.gmbAccountId || !integration.gmbLocationId) return { ok: false, error: "Your Google listing isn’t connected." }
  const result = await postReviewReply(integration, review.reviewId, text)
  if (!result.success) return { ok: false, error: "Google didn’t accept the reply. Nothing was posted." }
  await db.gmbReview.update({ where: { id: review.id }, data: { reply: text } })
  await logActivity(userId, "review_reply", "Reply posted to a Google review", text.length > 60 ? `${text.slice(0, 60)}…` : text)
  return { ok: true }
}

/** Publish a drafted Google Business Profile update (optionally with the owner's edits). */
export async function approveGbpPost(userId: string, postId: string, text?: string): Promise<ApprovalResult> {
  const post = await db.gbpPost.findUnique({ where: { id: postId }, select: { id: true, userId: true, content: true, postType: true, status: true } })
  if (!post || post.userId !== userId) return { ok: false, error: "That post isn’t here any more." }
  if (post.status === "posted") return { ok: true }
  const content = text?.trim() || post.content
  if (containsPlaceholders(content)) return { ok: false, error: "It still has a [placeholder] in it. Tap Edit and fill it in first." }
  const integration = await db.integration.findUnique({ where: { userId } })
  if (!integration?.gmbAccountId || !integration.gmbLocationId) return { ok: false, error: "Your Google listing isn’t connected." }
  if (content !== post.content) await db.gbpPost.update({ where: { id: post.id }, data: { content } })
  const accessToken = await resolveAccessToken(integration)
  const result = await postToGmb(accessToken, integration.gmbAccountId, integration.gmbLocationId, content, post.postType)
  if (!result.success) {
    await db.gbpPost.update({ where: { id: post.id }, data: { status: "failed" } })
    return { ok: false, error: result.error ?? "Google didn’t accept the post. Nothing was published." }
  }
  await db.gbpPost.update({ where: { id: post.id }, data: { status: "posted", gmbPostId: result.gmbPostId ?? null, postedAt: new Date() } })
  await logActivity(userId, "gbp_post", "Published a post to your Google Business Profile", content.length > 80 ? `${content.slice(0, 80)}…` : content)
  return { ok: true }
}

/** Publish a drafted website post (a post_draft row) to the connected site. */
export async function approveSitePost(userId: string, draftId: string, text?: string): Promise<ApprovalResult> {
  const [user, draft] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.mockActivity.findFirst({ where: { id: draftId, userId, type: "post_draft" } }),
  ])
  if (!user || !draft) return { ok: false, error: "That post isn’t here any more." }
  const m = (draft.metadata ?? {}) as { title?: string; markdown?: string; status?: string; url?: string }
  if (m.status === "published") return { ok: true, url: m.url ?? null }
  const res = await pushChange(user, { op: "post", title: m.title, text: text?.trim() || m.markdown || "", draftId })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) return { ok: false, error: data.error ?? "Your site didn’t accept it. Nothing changed." }
  return { ok: true, url: data.url }
}

export async function approve(userId: string, kind: ApprovalKind, id: string, text?: string): Promise<ApprovalResult> {
  if (kind === "review") return approveReviewReply(userId, id, text)
  if (kind === "gbp") return approveGbpPost(userId, id, text)
  return approveSitePost(userId, id, text)
}

/** What the owner is approving, for the no-login approval page. */
export async function approvalPreview(userId: string, kind: ApprovalKind, id: string): Promise<{ title: string; text: string; done: boolean } | null> {
  if (kind === "review") {
    const r = await db.gmbReview.findUnique({ where: { id }, select: { userId: true, authorName: true, rating: true, reply: true } })
    if (!r || r.userId !== userId) return null
    const text = r.reply ?? (await savedReviewDraft(userId, id))
    return text ? { title: `Your reply to ${r.authorName}’s ${r.rating}-star review`, text, done: !!r.reply } : null
  }
  if (kind === "gbp") {
    const p = await db.gbpPost.findUnique({ where: { id }, select: { userId: true, content: true, status: true } })
    return p && p.userId === userId ? { title: "An update for your Google listing", text: p.content, done: p.status === "posted" } : null
  }
  const d = await db.mockActivity.findFirst({ where: { id, userId, type: "post_draft" } })
  const m = (d?.metadata ?? {}) as { title?: string; markdown?: string; status?: string }
  return d ? { title: `A new post for your website: “${m.title ?? "New post"}”`, text: m.markdown ?? "", done: m.status === "published" } : null
}
