export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { workItems } from "@/lib/agent/worklog"

// New steps since `since` (ISO), for the live work log in the dashboard chat.
export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const raw = new URL(req.url).searchParams.get("since")
  const t = raw ? Date.parse(raw) : NaN
  // At most a day back, so a stale tab doesn't pull in a week of history.
  const since = new Date(Number.isFinite(t) ? Math.max(t, Date.now() - 86_400_000) : Date.now())
  const items = await workItems(user.id, since, 30)
  return NextResponse.json({ items: items.reverse(), now: new Date().toISOString() })
}
