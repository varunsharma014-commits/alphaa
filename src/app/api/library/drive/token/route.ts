export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { driveAccessToken, driveConfigured, pickerConfig } from "@/lib/library/drive"

// For the Google Picker in the owner's own browser: a short-lived drive.file access token minted
// from their saved grant, plus the Picker's browser API key and app id (our Cloud project number).
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!driveConfigured()) return NextResponse.json({ error: "Google Drive is coming soon." }, { status: 409 })
  const t = await driveAccessToken(user.id)
  if (!t) return NextResponse.json({ error: "Connect Google Drive first.", connect: "/api/library/drive/connect" }, { status: 409 })
  return NextResponse.json({ token: t.token, expiresIn: t.expiresIn, ...pickerConfig() }, { headers: { "Cache-Control": "no-store" } })
}
