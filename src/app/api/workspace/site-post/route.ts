export const dynamic = "force-dynamic"
export const maxDuration = 60

// Research → "Draft it": Autopilot on = "Add to Going out soon" (publishes after the stop window);
// Autopilot off = "Publish" through the usual approval path (approveSitePost).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { approveSitePost } from "@/lib/approvals"
import { scheduleSitePost } from "@/lib/workspace/site-posts"
import { goLive } from "@/lib/team/review"

const body = z.object({ op: z.enum(["schedule", "publish"]), draftId: z.string().min(5).max(40) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const held = await goLive(user.id, "site", input.draftId)
  if (held) return held
  if (input.op === "schedule") {
    const r = await scheduleSitePost(user.id, input.draftId)
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error }, { status: 409 })
  }
  const r = await approveSitePost(user.id, input.draftId)
  if (!r.ok && r.banned) return NextResponse.json({ error: r.error, banned: r.banned, confirmBanned: true }, { status: 409 })
  return r.ok ? NextResponse.json({ ok: true, url: r.url ?? null }) : NextResponse.json({ error: r.error ?? "Your site didn’t accept it. Nothing changed.", ...(r.quota ? { quota: true, buy: true } : {}), ...(r.held ? { held: true } : {}) }, { status: r.quota ? 429 : 409 })
}
