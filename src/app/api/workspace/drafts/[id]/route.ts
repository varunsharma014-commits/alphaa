export const dynamic = "force-dynamic"

// The draft editor's API (lib/draft-versions.ts). GET = the saved draft + its versions;
// PUT = save (autosave, or checkpoint "save" for a manual "Save version").
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getDraft, listRevisions, saveDraftText, MAX_DRAFT_CHARS } from "@/lib/draft-versions"
import { getActor } from "@/lib/team/actor"
import { can } from "@/lib/team/permissions"
import { holdSitePost } from "@/lib/workspace/site-posts"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const [draft, revisions] = await Promise.all([getDraft(user.id, id), listRevisions(user.id, id)])
  if (!draft) return NextResponse.json({ error: "That draft isn’t here any more." }, { status: 404 })
  return NextResponse.json({ draft, revisions })
}

const body = z.object({
  markdown: z.string().max(MAX_DRAFT_CHARS + 1000),
  title: z.string().max(300).optional(),
  baseRev: z.number().int().min(0).optional(),
  checkpoint: z.literal("save").optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const r = await saveDraftText(user.id, id, { markdown: input.markdown, title: input.title, baseRev: input.baseRev, by: "owner", checkpoint: input.checkpoint })
  if (!r.ok) return NextResponse.json({ error: r.error, current: r.current ?? null }, { status: r.status })
  // Teams: Autopilot only covers Alphaa's own work. A reviewer's or creator's edit to a scheduled
  // post takes it off the schedule, so the edited text waits for a publisher (lib/team/review.ts).
  if (r.draft.status === "scheduled" && !can(await getActor(), "publish")) {
    await holdSitePost(user.id, id, "stop").catch(() => null)
    r.draft.status = "draft"
  }
  return NextResponse.json({ ok: true, draft: r.draft, revisionId: r.revisionId, ...(input.checkpoint ? { revisions: await listRevisions(user.id, id) } : {}) })
}
