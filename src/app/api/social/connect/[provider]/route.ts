export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { hasGrowth } from "@/lib/billing"
import { isConnectProvider, providerConfigured } from "@/lib/social/types"
import { PKCE_COOKIE, pkce, redirectUri, signState } from "@/lib/social/oauth"
import { meta } from "@/lib/social/providers/meta"
import { linkedin } from "@/lib/social/providers/linkedin"
import { tiktok } from "@/lib/social/providers/tiktok"
import { x } from "@/lib/social/providers/x"

const P = { meta, linkedin, tiktok, x }

// Sends the owner to the platform's own login to connect their account.
export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider
  const back = new URL("/dashboard?ask=social", req.url)
  if (!isConnectProvider(provider)) return NextResponse.redirect(back)
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))
  if (!hasGrowth(user) || !providerConfigured(provider)) return NextResponse.redirect(back)
  const state = signState(user.id, provider)
  const p = P[provider]
  if (p.usesPkce) {
    const { verifier, challenge } = pkce()
    const res = NextResponse.redirect(p.authUrl({ state, redirectUri: redirectUri(provider), challenge }))
    res.cookies.set(PKCE_COOKIE, verifier, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 1200, path: "/api/social" })
    return res
  }
  return NextResponse.redirect(p.authUrl({ state, redirectUri: redirectUri(provider) }))
}
