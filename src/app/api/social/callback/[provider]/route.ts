export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { saveAgentSettings } from "@/lib/agent/settings"
import { isConnectProvider, PROVIDER_NAME } from "@/lib/social/types"
import { PKCE_COOKIE, readState, redirectUri } from "@/lib/social/oauth"
import { upsertAccount } from "@/lib/social/store"
import { meta } from "@/lib/social/providers/meta"
import { linkedin, linkedinPages } from "@/lib/social/providers/linkedin"
import { tiktok } from "@/lib/social/providers/tiktok"
import { x } from "@/lib/social/providers/x"

const P = { meta, linkedin, linkedin_pages: linkedinPages, tiktok, x }

// The platform sends the owner back here with a code: exchange it, save the accounts.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider
  const back = new URL("/dashboard?ask=social", process.env.NEXT_PUBLIC_APP_URL || req.url)
  if (!isConnectProvider(provider)) return NextResponse.redirect(back)
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || req.url))
  const u = req.nextUrl.searchParams
  const state = readState(u.get("state"), provider)
  const note = async (text: string) => { await saveAgentSettings(user.id, { socialNote: text }); const r = NextResponse.redirect(back); r.cookies.delete(PKCE_COOKIE); return r }
  // The state must be this signed-in owner's own (no cross-account connects).
  if (!state || state.u !== user.id) return note(`That ${PROVIDER_NAME[provider]} connection expired. Try again.`)
  if (u.get("error")) return note(`${PROVIDER_NAME[provider]} wasn’t connected: ${u.get("error_description") ?? u.get("error")}.`)
  const code = u.get("code")
  if (!code) return note(`${PROVIDER_NAME[provider]} didn’t send a code back. Try again.`)
  try {
    const accounts = await P[provider].connect({ code, redirectUri: redirectUri(provider), verifier: req.cookies.get(PKCE_COOKIE)?.value, userId: user.id })
    for (const a of accounts) await upsertAccount(user.id, a)
    return note(`Connected ${accounts.map((a) => a.name).join(", ")}.`)
  } catch (err) {
    console.error("[social/callback]", provider, err instanceof Error ? err.message : err)
    return note(`${PROVIDER_NAME[provider]} didn’t connect: ${err instanceof Error ? err.message : "something went wrong"}`)
  }
}
