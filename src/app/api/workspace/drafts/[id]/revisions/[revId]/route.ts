export const dynamic = "force-dynamic"

// One saved version of a draft: GET = its text (for the diff view); POST = restore it.
import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { getRevision, listRevisions, restoreRevision } from "@/lib/draft-versions"

type Ctx = { params: Promise<{ id: string; revId: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, revId } = await params
  const revision = await getRevision(user.id, id, revId)
  if (!revision) return NextResponse.json({ error: "That version isn’t here any more." }, { status: 404 })
  return NextResponse.json({ revision })
}

export async function POST(_req: Request, { params }: Ctx) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, revId } = await params
  const r = await restoreRevision(user.id, id, revId)
  if (!r.ok) return NextResponse.json({ error: r.error, current: r.current ?? null }, { status: r.status })
  return NextResponse.json({ ok: true, draft: r.draft, revisions: await listRevisions(user.id, id) })
}
