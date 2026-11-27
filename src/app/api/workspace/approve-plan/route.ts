export const dynamic = "force-dynamic"
export const maxDuration = 120

// Briefing → "Approve this week's plan" (Autopilot off): the owner's one tap approves every item of
// this week's run that waits for an OK, each through the usual path (lib/workspace/schedule.ts):
// social posts keep their planned day, Google updates go out on the next run, pages publish now.
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { WEEK_RUN, type WeekRun } from "@/lib/agent/week"
import { scheduleMade } from "@/lib/workspace/schedule"

const body = z.object({ runId: z.string().min(5).max(40) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const row = await db.mockActivity.findFirst({ where: { id: input.runId, userId: user.id, type: WEEK_RUN } })
  if (!row) return NextResponse.json({ error: "That plan isn’t here any more." }, { status: 404 })
  const run = row.metadata as WeekRun
  let done = 0
  const problems: string[] = []
  for (const it of run.items ?? []) {
    const target = it.kind === "social" && it.socialId && it.socialStatus === "draft" ? { kind: "social" as const, id: it.socialId }
      : it.kind === "google" && it.postId && it.status === "ready" ? { kind: "gbp" as const, id: it.postId }
        : it.kind === "blog" && it.draftId && it.status === "ready" ? { kind: "site" as const, id: it.draftId }
          : null
    if (!target) continue
    const r = await scheduleMade(user.id, target.kind, target.id, false)
    if (r.ok) {
      done++
      // Keep the run's record in step, so the Briefing doesn't ask again.
      if (target.kind === "social") it.socialStatus = "scheduled"
      it.status = target.kind === "site" ? "published" : "scheduled"
    } else problems.push(`${it.title}: ${r.error}`)
  }
  if (done) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: run as object } })
  return NextResponse.json({ ok: true, done, problems })
}
