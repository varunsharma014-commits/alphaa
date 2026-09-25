export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { wpCall } from "@/lib/connector/wordpress"
import { currentUser } from "@/lib/connector/user"

const body = z.object({ changeId: z.string().min(3).max(80) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const s = await getAgentSettings(user.id)
  if (!s.wp) return NextResponse.json({ error: "Your website isn’t connected." }, { status: 400 })
  try {
    await wpCall(user.id, s.wp, "undo", { id: input.changeId })
  } catch (err) {
    return NextResponse.json({ error: `Couldn’t undo it: ${err instanceof Error ? err.message : err}` }, { status: 502 })
  }
  const rows = await db.mockActivity.findMany({ where: { userId: user.id, type: "site_change" }, orderBy: { createdAt: "desc" }, take: 100 })
  const row = rows.find((r) => (r.metadata as { changeId?: string } | null)?.changeId === input.changeId)
  if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...(row.metadata as object), undone: true } } })
  return NextResponse.json({ ok: true })
}
