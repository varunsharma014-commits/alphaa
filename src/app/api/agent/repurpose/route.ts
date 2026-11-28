export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { once } from "@/lib/draft-dedupe"
import { isQuotaError, quotaBody } from "@/lib/quotas"
import { repurposePost, RepurposeError } from "@/lib/repurpose"
import { repurposeMessages } from "@/lib/agent/repurpose-narration"

// "Repurpose": one finished blog post → social, LinkedIn, Google update, email and video script
// drafts (lib/repurpose.ts). Answers { result, messages } so it works from a page button and as
// a chat agent-op chip. A second tap returns the first run's drafts.
const body = z.object({ draftId: z.string().min(5).max(40), again: z.boolean().optional() })

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  try {
    const result = await once(`repurpose:${user.id}:${input.draftId}`, () => repurposePost(user, input.draftId, { again: input.again }))
    return NextResponse.json({ result, messages: repurposeMessages(result) })
  } catch (err) {
    if (err instanceof RepurposeError) return NextResponse.json({ error: err.message }, { status: 400 })
    if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
    console.error("[agent/repurpose]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t do that just now. Try again in a minute." }, { status: 502 })
  }
}
