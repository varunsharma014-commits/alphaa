import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
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
        authorName: true,
        rating: true,
        comment: true,
      },
    })

    if (!review || review.userId !== user.id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

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
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const reply =
      message.content[0].type === "text" ? message.content[0].text.trim() : ""

    const updated = await db.gmbReview.update({
      where: { id },
      data: { reply },
    })

    return NextResponse.json({ reply: updated.reply })
  } catch (err) {
    console.error("[GBP] generate reply error:", err)
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    )
  }
}
