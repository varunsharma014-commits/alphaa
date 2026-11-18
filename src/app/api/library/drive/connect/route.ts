export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { driveAuthUrl, driveConfigured, signDriveState } from "@/lib/library/drive"

// "Add from Google Drive", first time: Google's own consent screen for drive.file only
// (we see just the files the owner picks). Redirects use NEXT_PUBLIC_APP_URL, never req.url.
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", APP()))
  if (!driveConfigured()) return NextResponse.redirect(new URL("/dashboard?ask=voice", APP()))
  return NextResponse.redirect(driveAuthUrl(signDriveState(user.id)))
}
