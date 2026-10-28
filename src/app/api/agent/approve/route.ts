export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { approve, draftReviewReply, savedReviewDraft } from "@/lib/approvals"
import { readApproveToken } from "@/lib/approve-token"

// One-tap approvals from the briefing. Signed in: any of the owner's items.
// From the email: a signed token that names exactly one item (no login).
const body = z.object({
  kind: z.enum(["review", "gbp", "post"]),
  id: z.string().min(1).max(40),
  action: z.enum(["publish", "draft"]).default("publish"),
  text: z.string().max(30_000).optional(),
  t: z.string().max(600).optional(),
})

export async function POST(req: Request) {
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  let userId: string | null = null
  if (input.t) {
    const c = readApproveToken(input.t)
    if (!c || c.k !== input.kind || c.i !== input.id) return NextResponse.json({ error: "This link has expired. Open Alphaa to approve it." }, { status: 401 })
    userId = c.u
  } else {
    userId = (await currentUser())?.id ?? null
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    if (input.action === "draft") {
      if (input.kind !== "review") return NextResponse.json({ error: "Bad request" }, { status: 400 })
      const text = (await savedReviewDraft(userId, input.id)) ?? (await draftReviewReply(userId, input.id))
      return text ? NextResponse.json({ text }) : NextResponse.json({ error: "I couldn’t write it just now. Try again in a minute." }, { status: 502 })
    }
    const r = await approve(userId, input.kind, input.id, input.text)
    return r.ok ? NextResponse.json({ ok: true, url: r.url ?? null }) : NextResponse.json({ error: r.error }, { status: 400 })
  } catch (err) {
    console.error("[approve]", err)
    return NextResponse.json({ error: "Something went wrong. Nothing was published." }, { status: 500 })
  }
}
