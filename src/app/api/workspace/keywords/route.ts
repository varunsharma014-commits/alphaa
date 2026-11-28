export const dynamic = "force-dynamic"
export const maxDuration = 60

// Research → Keywords (lib/keywords/view.ts). GET = the view from cached numbers (starts a background
// refresh when numbers are missing, max once a day). POST { op: "refresh" } = refresh now (same daily
// limit); { op: "pin" | "unpin", keyword } = "Add to topic plan" (used by the next Topic plan build).
import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { keywordsView, pinKeyword } from "@/lib/keywords/view"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ view: await keywordsView(user) })
}

const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("refresh") }),
  z.object({ op: z.enum(["pin", "unpin"]), keyword: z.string().trim().min(2).max(120) }),
])

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let b: z.infer<typeof body>
  try { b = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That doesn’t look right." }, { status: 400 }) }
  if (b.op === "refresh") {
    const view = await keywordsView(user, { refresh: true })
    return NextResponse.json({ view, started: view.refreshing })
  }
  const n = await pinKeyword(user.id, b.keyword, b.op === "pin")
  return NextResponse.json({ pins: n, view: await keywordsView(user) })
}
