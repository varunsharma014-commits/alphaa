import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { approveReviewReply, draftReviewReply, savedReviewDraft } from "@/lib/approvals"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Approve-before-post flow. One route, two explicit actions:
//   { action: "generate" }           → the reply written overnight, or a new
//                                      one (kept for later). Nothing is posted.
//   { action: "post", text: string } → posts the owner-approved (possibly
//                                      edited) text to the Google review.
// Logic lives in lib/approvals.ts (shared with the briefing email links).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = (await request.json().catch(() => null)) as { action?: unknown; text?: unknown } | null
  try {
    if (body?.action === "generate") {
      const reply = (await savedReviewDraft(user.id, id)) ?? (await draftReviewReply(user.id, id))
      if (!reply) return NextResponse.json({ error: "Could not write a draft this time. Please try again." }, { status: 500 })
      return NextResponse.json({ reply })
    }
    if (body?.action === "post") {
      const text = typeof body.text === "string" ? body.text.trim() : ""
      if (!text) return NextResponse.json({ error: "Reply text is required" }, { status: 400 })
      const r = await approveReviewReply(user.id, id, text)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
      return NextResponse.json({ success: true, reply: text })
    }
    return NextResponse.json({ error: 'Invalid action — expected "generate" or "post"' }, { status: 400 })
  } catch (err) {
    console.error("[GBP] review reply error:", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
