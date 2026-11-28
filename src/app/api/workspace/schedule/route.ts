export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { scheduleMade } from "@/lib/workspace/schedule"

const body = z.object({ kind: z.enum(["social", "gbp", "site"]), id: z.string().min(5).max(40), window: z.boolean() })

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const r = await scheduleMade(user.id, input.kind, input.id, input.window)
  if (!r.ok && r.banned) return NextResponse.json({ error: r.error, banned: r.banned, confirmBanned: true }, { status: 409 })
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.error, ...(r.quota ? { quota: true, buy: true } : {}) }, { status: r.quota ? 429 : 409 })
}
