export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { linkedinAdsOn } from "@/lib/linkedin-ads/api"
import { connectLiAds, readLiAdsState } from "@/lib/linkedin-ads/ops"

// LinkedIn sends the owner back here: the state must be this signed-in owner's own.
export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || req.url
  const back = (msg: string) => NextResponse.redirect(new URL(`/dashboard/ads?tab=p&note=${encodeURIComponent(msg)}`, base))
  if (!linkedinAdsOn()) return back("LinkedIn Ads are opening soon.")
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", base))
  const u = req.nextUrl.searchParams
  const state = readLiAdsState(u.get("state"))
  if (!state || state.u !== user.id) return back("That LinkedIn connection expired. Try again.")
  if (u.get("error")) return back("LinkedIn Ads weren’t connected.")
  const code = u.get("code")
  if (!code) return back("LinkedIn didn’t send a code back. Try again.")
  try {
    const a = await connectLiAds(user.id, code)
    return back(a.accounts.length ? `Connected LinkedIn Ads (${a.accounts.length} ad account${a.accounts.length === 1 ? "" : "s"}).` : "Connected, but I don’t see an active LinkedIn ad account on this login.")
  } catch (err) {
    console.error("[linkedin-ads/callback]", err instanceof Error ? err.message : err)
    return back(err instanceof Error ? err.message.slice(0, 160) : "LinkedIn Ads didn’t connect.")
  }
}
