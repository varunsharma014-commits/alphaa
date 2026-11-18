export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { gadsAuthUrl, gadsAvailable, signGadsState } from "@/lib/gads/oauth"

const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

// "Connect Google Ads": Google's own sign-in, asking only for the Google Ads scope (incremental
// auth). Growth only, and only while gated (GOOGLE_ADS_ENABLED=1 or a founder), because the
// scope isn't verified by Google yet. Redirects use NEXT_PUBLIC_APP_URL, never req.url.
export async function GET() {
  const back = new URL("/dashboard?ask=ads", APP())
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", APP()))
  if (!hasGrowth(user) || !gadsAvailable(user)) return NextResponse.redirect(back)
  return NextResponse.redirect(gadsAuthUrl(signGadsState(user.id)))
}
