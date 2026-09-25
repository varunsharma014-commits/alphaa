export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { connectionKey } from "@/lib/connector/keys"
import { getAgentSettings } from "@/lib/agent/settings"
import { wpCall, type WpStatus } from "@/lib/connector/wordpress"
import { currentUser } from "@/lib/connector/user"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  if (!s.wp) return NextResponse.json({ connected: false, key: connectionKey(user.id) })
  try {
    const status = await wpCall<WpStatus>(user.id, s.wp, "status")
    return NextResponse.json({ connected: true, reachable: true, siteUrl: s.wp.siteUrl, status })
  } catch (err) {
    return NextResponse.json({ connected: true, reachable: false, siteUrl: s.wp.siteUrl, key: connectionKey(user.id), error: err instanceof Error ? err.message : String(err) })
  }
}
