import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { postReviewReply } from "@/lib/gmb"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Approve-before-post flow. One route, two explicit actions:
//   { action: "generate" }           → Claude drafts a reply and returns it.
//                                      Nothing is saved and nothing is posted.
//   { action: "post", text: string } → posts the owner-approved (possibly
//                                      edited) text to the Google review, then
//                                      persists it on the GmbReview row.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await db.user.findUnique({
      where: { clerkId },
      select: { id: true, businessName: true, businessType: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const review = await db.gmbReview.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        reviewId: true,
        authorName: true,
        rating: true,
        comment: true,
      },
    })

    if (!review || review.userId !== user.id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Guarded JSON body read — action decides the step.
    let body: unknown = null
    try {
      body = await request.json()
    } catch {
      body = null
    }
    const action =
      body !== null &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      typeof (body as { action?: unknown }).action === "string"
        ? (body as { action: string }).action
        : null

    if (action === "generate") {
      return generateDraft(user, review)
    }

    if (action === "post") {
      const rawText = (body as { text?: unknown }).text
      const text = typeof rawText === "string" ? rawText.trim() : ""
      return postApprovedReply(user.id, review, text)
    }

    return NextResponse.json(
      { error: 'Invalid action — expected "generate" or "post"' },
      { status: 400 }
    )
  } catch (err) {
    console.error("[GBP] review reply error:", err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

// Step 1 — draft only. The draft is returned to the UI for the owner to read
// and edit; it is intentionally NOT written to the database and NOT posted.
async function generateDraft(
  user: { businessName: string | null; businessType: string | null },
  review: { authorName: string; rating: number; comment: string | null }
) {
  const stars = "⭐".repeat(review.rating)
  const businessName = user.businessName ?? "our business"
  const businessType = user.businessType ?? "business"

  const prompt = `You are a professional, warm business owner responding to a Google review for ${businessName} (${businessType}).

Review from ${review.authorName} (${stars} — ${review.rating}/5 stars):
"${review.comment ?? "(No written comment)"}"

Write a professional, genuine, and warm reply from the business owner.
- If it's a positive review (4-5 stars): thank them warmly, mention something specific from their comment if possible, invite them back.
- If it's a neutral review (3 stars): thank them for the feedback, acknowledge any concerns, show commitment to improvement.
- If it's a negative review (1-2 stars): apologize sincerely, take responsibility, offer to make it right, provide a way to contact you.

Keep it 2-4 sentences. Sound human, not robotic. Do not use markdown. Return only the reply text.`

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  })

  const reply =
    message.content[0].type === "text" ? message.content[0].text.trim() : ""

  if (!reply) {
    return NextResponse.json(
      { error: "Could not write a draft this time. Please try again." },
      { status: 500 }
    )
  }

  return NextResponse.json({ reply })
}

// Step 2 — post the owner-approved text to Google, then save it.
// The GmbReview.reply column is only written after Google accepts the reply.
async function postApprovedReply(
  userId: string,
  review: { id: string; reviewId: string },
  text: string
) {
  if (!text) {
    return NextResponse.json(
      { error: "Reply text is required" },
      { status: 400 }
    )
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: "Reply is too long — Google allows up to 4,000 characters." },
      { status: 400 }
    )
  }

  const integration = await db.integration.findUnique({
    where: { userId },
  })

  if (!integration) {
    return NextResponse.json(
      {
        error:
          "Google account not connected. Connect Google in Settings → Integrations first.",
      },
      { status: 400 }
    )
  }
  if (!integration.gmbAccountId || !integration.gmbLocationId) {
    return NextResponse.json(
      {
        error:
          "No Google Business Profile location selected. Pick your location in Settings → Integrations first.",
      },
      { status: 400 }
    )
  }

  const result = await postReviewReply(integration, review.reviewId, text)

  if (!result.success) {
    return NextResponse.json(
      {
        error:
          "Google did not accept the reply. Please try again — or reply directly on your Google listing.",
      },
      { status: 502 }
    )
  }

  const updated = await db.gmbReview.update({
    where: { id: review.id },
    data: { reply: text },
  })

  await logActivity(
    userId,
    "review_reply",
    "Reply posted to a Google review",
    text.length > 60 ? `${text.slice(0, 60)}…` : text
  )

  return NextResponse.json({ success: true, reply: updated.reply })
}
