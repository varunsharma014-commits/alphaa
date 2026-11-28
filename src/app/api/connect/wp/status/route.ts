export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { connectionKey } from "@/lib/connector/keys"
import { getAgentSettings } from "@/lib/agent/settings"
import { wpCall, type WpStatus } from "@/lib/connector/wordpress"
import { currentUser } from "@/lib/connector/user"
import { getActor } from "@/lib/team/actor"
import { can } from "@/lib/team/permissions"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  // The plugin key connects a website to this brand: owner and admins only (lib/team).
  const key = can(await getActor(), "connect") ? connectionKey(user.id) : null
  if (!s.wp) return NextResponse.json({ connected: false, key })
  try {
    const status = await wpCall<WpStatus>(user.id, s.wp, "status")
    return NextResponse.json({ connected: true, reachable: true, siteUrl: s.wp.siteUrl, status })
  } catch (err) {
    return NextResponse.json({ connected: true, reachable: false, siteUrl: s.wp.siteUrl, key, error: err instanceof Error ? err.message : String(err) })
  }
}
