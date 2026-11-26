export const dynamic = "force-dynamic"

// "Going out soon": Stop holds a scheduled post (back to a draft, nothing goes out); Undo puts it
// back on the schedule at its time (or in 5 minutes if that time has passed). Social posts use
// the same store as /api/agent/social; Google listing updates are GbpPost rows the gbp-posts cron
// publishes when status = "scheduled".
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { getPost, savePost } from "@/lib/social/store"

const body = z.object({ kind: z.enum(["social", "gbp"]), id: z.string().min(5).max(40), op: z.enum(["stop", "undo"]) })
const soon = () => new Date(Date.now() + 5 * 60_000)

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }

  if (input.kind === "social") {
    if (!hasPro(user)) return NextResponse.json({ error: "Social media comes with the Pro plan." }, { status: 403 })
    const p = await getPost(user.id, input.id)
    if (!p) return NextResponse.json({ error: "That post isn’t here any more." }, { status: 404 })
    if (input.op === "stop") {
      if (p.status !== "scheduled") return NextResponse.json({ error: p.status === "published" ? "It already went out." : "It isn’t scheduled." }, { status: 409 })
      p.status = "draft"
    } else {
      if (p.status !== "draft") return NextResponse.json({ error: "It isn’t on hold." }, { status: 409 })
      p.status = "scheduled"
      if (!p.scheduledFor || Date.parse(p.scheduledFor) < Date.now()) p.scheduledFor = soon().toISOString()
    }
    await savePost(user.id, p)
    return NextResponse.json({ ok: true, status: p.status, scheduledFor: p.scheduledFor })
  }

  const g = await db.gbpPost.findFirst({ where: { id: input.id, userId: user.id }, select: { id: true, status: true, scheduledFor: true } })
  if (!g) return NextResponse.json({ error: "That update isn’t here any more." }, { status: 404 })
  if (input.op === "stop") {
    if (g.status !== "scheduled") return NextResponse.json({ error: g.status === "posted" ? "It already went out." : "It isn’t scheduled." }, { status: 409 })
    // Updating only where it's still scheduled, so a cron run that just published it wins.
    const r = await db.gbpPost.updateMany({ where: { id: g.id, status: "scheduled" }, data: { status: "draft" } })
    if (!r.count) return NextResponse.json({ error: "It already went out." }, { status: 409 })
    return NextResponse.json({ ok: true, status: "draft" })
  }
  if (g.status !== "draft") return NextResponse.json({ error: "It isn’t on hold." }, { status: 409 })
  const at = g.scheduledFor && g.scheduledFor > new Date() ? g.scheduledFor : soon()
  await db.gbpPost.update({ where: { id: g.id }, data: { status: "scheduled", scheduledFor: at } })
  return NextResponse.json({ ok: true, status: "scheduled", scheduledFor: at.toISOString() })
}
