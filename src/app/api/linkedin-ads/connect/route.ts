export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { linkedinAdsOn } from "@/lib/linkedin-ads/api"
import { liAdsAuthUrl, liAdsState } from "@/lib/linkedin-ads/ops"

// Start the LinkedIn Ads login (scopes r_ads, rw_ads, r_ads_reporting). 404 until LINKEDIN_ADS=1.
export async function GET() {
  if (!linkedinAdsOn()) return NextResponse.json({ error: "LinkedIn Ads are opening soon." }, { status: 404 })
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"))
  if (!hasGrowth(user)) return NextResponse.json({ error: "LinkedIn Ads come with the Growth plan." }, { status: 403 })
  return NextResponse.redirect(liAdsAuthUrl(liAdsState(user.id)))
}
