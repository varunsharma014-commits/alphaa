export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import { undoChange } from "@/lib/connector/publish"
import { currentUser } from "@/lib/connector/user"

const body = z.object({ changeId: z.string().min(3).max(200) })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  try {
    await undoChange(user.id, input.changeId)
  } catch (err) {
    return NextResponse.json({ error: `Couldn’t undo it: ${err instanceof Error ? err.message : err}` }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
