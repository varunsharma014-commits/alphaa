export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { cachedCheck, runCheck, type CheckKind } from "@/lib/checks/run"

const KINDS: CheckKind[] = ["security", "profiles", "listings", "bing"]

// POST /api/agent/checks?kind=security[&force=1] — cached for a day.
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const q = new URL(req.url).searchParams
  const kind = q.get("kind") as CheckKind
  if (!KINDS.includes(kind)) return NextResponse.json({ error: "Unknown check" }, { status: 400 })
  if (q.get("force") !== "1") {
    const c = await cachedCheck(user.id, kind)
    if (c) return NextResponse.json({ data: c.data, at: c.at })
  }
  const data = await Promise.race([runCheck(user.id, kind), new Promise<null>((r) => setTimeout(() => r(null), 50_000))])
  if (!data) return NextResponse.json({ error: "That check didn’t finish this time. I’ll run it again on my next pass." }, { status: 504 })
  return NextResponse.json({ data, at: new Date() })
}
