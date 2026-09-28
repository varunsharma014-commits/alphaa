export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { connectionStatus } from "@/lib/connector/connection"
import { platformAvailability } from "@/lib/connector/availability"

// GET /api/connect/status: which website is connected (wordpress / webflow /
// shopify / wix / none), its name and address, when, and whether a live ping works.
// Also which platforms can be connected at all right now.
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const status = await connectionStatus(user.id)
  return NextResponse.json({ ...status, available: platformAvailability() })
}
