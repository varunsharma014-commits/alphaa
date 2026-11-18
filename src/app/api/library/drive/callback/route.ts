export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { connectDrive, readDriveState } from "@/lib/library/drive"
import { saveLibrarySettings } from "@/lib/library/store"

// Google sends the owner back here: exchange the code, keep the refresh token encrypted, and
// return to the brand thread, where "Add from Google Drive" now opens the Picker.
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", APP()))
  const q = req.nextUrl.searchParams
  const back = NextResponse.redirect(new URL("/dashboard?ask=voice", APP()))
  const note = async (text: string) => { await saveLibrarySettings(user.id, { note: text }); return back }
  const state = readDriveState(q.get("state"))
  if (!state || state.u !== user.id) return note("That Google Drive connection expired. Try again.")
  if (q.get("error")) return note(q.get("error") === "access_denied" ? "Google Drive wasn’t connected. Nothing changed." : `Google Drive wasn’t connected: ${(q.get("error") ?? "").slice(0, 100)}.`)
  const code = q.get("code")
  if (!code) return note("Google didn’t send a code back. Try again.")
  try {
    await connectDrive(user.id, code)
    return note("Google Drive is connected. I can only see the files you pick. Tap “Add from Google Drive” to choose them.")
  } catch (err) {
    console.error("[drive/callback]", err instanceof Error ? err.message : err)
    return note(`Google Drive didn’t connect: ${err instanceof Error ? err.message.slice(0, 200) : "something went wrong"}`)
  }
}
