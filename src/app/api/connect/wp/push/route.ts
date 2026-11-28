export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { pushBody, pushChange, type PushInput } from "@/lib/connector/push"
import { markPublished, textToPublish } from "@/lib/draft-versions"
import { bannedBody, ownerBannedHit } from "@/lib/owner-edit-check"
import { requireCan } from "@/lib/team/actor"

// Publishes one approved change to the owner's site (logic in lib/connector/push.ts,
// shared with approvals from the briefing email).
export async function POST(req: Request) {
  { const denied = await requireCan("publish"); if (denied) return denied } // teams (lib/team)
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: PushInput
  try {
    input = pushBody.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  // A blog post from a saved draft publishes the saved text (lib/draft-versions.ts): text sent
  // with it (an inline edit, "Publish without them") is saved first, then kept as a version.
  const draftId = input.op === "post" ? input.draftId : undefined
  if (draftId) {
    const pub = await textToPublish(user.id, draftId, input.text)
    if (!pub.ok) return NextResponse.json({ error: pub.error }, { status: 404 })
    // The owner's own edits: their banned words are flagged before it goes out (they can confirm).
    const hit = await ownerBannedHit(user.id, [pub.title, pub.markdown])
    if (hit) return NextResponse.json(...bannedBody(hit))
    const res = await pushChange(user, { ...input, text: pub.markdown, title: pub.title })
    if (res.ok) await markPublished(user.id, draftId, "owner").catch(() => {})
    return res
  }
  return pushChange(user, input)
}
