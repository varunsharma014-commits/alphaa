export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { gadsAvailable, readGadsState } from "@/lib/gads/oauth"
import { connectGads } from "@/lib/gads/connect"
import { setNote } from "@/lib/gads/store"

const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"

// Google sends the owner back here with a code: exchange it, save the refresh token
// (encrypted) and the ad accounts they can reach, then back to the Ads thread.
export async function GET(req: NextRequest) {
  const back = new URL("/dashboard?ask=ads", APP())
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", APP()))
  if (!hasGrowth(user) || !gadsAvailable(user)) return NextResponse.redirect(back)
  const u = req.nextUrl.searchParams
  const note = async (text: string) => {
    await setNote(user.id, text)
    return NextResponse.redirect(back)
  }
  // The state must be signed by us, under 60 minutes old, and this signed-in brand's own.
  const state = readGadsState(u.get("state"))
  if (!state || state.u !== user.id) return note("That Google Ads connection expired. Try again.")
  if (u.get("error")) return note(`Google Ads wasn’t connected: ${(u.get("error_description") ?? u.get("error") ?? "").slice(0, 200)}.`)
  const code = u.get("code")
  if (!code) return note("Google didn’t send a code back. Try again.")
  try {
    const acc = await connectGads(user.id, code)
    const n = acc.choices?.length ?? 0
    return note(acc.customerId ? `Connected Google Ads: ${acc.customerName}.` : n ? "Connected Google Ads. Pick the ad account to use." : "Connected, but I couldn’t find an ad account on that Google login.")
  } catch (err) {
    console.error("[gads/callback]", err instanceof Error ? err.message : err)
    return note(`Google Ads didn’t connect: ${err instanceof Error ? err.message.slice(0, 200) : "something went wrong"}`)
  }
}
