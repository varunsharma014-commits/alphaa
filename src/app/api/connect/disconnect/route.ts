export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { disconnectSite } from "@/lib/connector/connection"

// POST /api/connect/disconnect: forget the website connection and its tokens
// (revoking at the platform where it has an endpoint for that).
export async function POST() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const r = await disconnectSite(user.id)
  if (!r.platform) return NextResponse.json({ ok: true, platform: "none" })
  return NextResponse.json({ ok: true, platform: r.platform, revoked: r.revoked })
}
