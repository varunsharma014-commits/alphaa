export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { hasPaidPlan, isComped } from "@/lib/billing"
import { makeFromIdea, makeFromNiche } from "@/lib/workspace/make"

const body = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("niche"), id: z.string().min(4).max(40) }),
  z.object({ kind: z.literal("idea"), title: z.string().min(3).max(200), format: z.enum(["blog", "google", "social"]) }),
])

// One write per brand at a time (a double tap answers with the same promise).
const running = new Map<string, Promise<unknown>>()

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPaidPlan(user) && !isComped(user.email)) return NextResponse.json({ error: "This comes with every paid plan." }, { status: 403 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  const key = `${user.id}:${input.kind === "niche" ? input.id : input.title}`
  try {
    const p = running.get(key) ?? (input.kind === "niche" ? makeFromNiche(user, input.id) : makeFromIdea(user, input))
    running.set(key, p)
    const made = await p.finally(() => running.delete(key))
    if (!made) return NextResponse.json({ error: "That post isn’t in this week’s list any more." }, { status: 404 })
    return NextResponse.json(made)
  } catch (err) {
    console.error("[workspace/make]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
  }
}
