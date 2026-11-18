export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { hasPro } from "@/lib/billing"
import { CANVA_PKCE_COOKIE, canvaAuthUrl, canvaConfigured, canvaPkce, signCanvaState, type CanvaBack } from "@/lib/canva/client"

// Sends the owner to Canva's own login to connect their account (OAuth 2 + PKCE S256).
export async function GET(req: NextRequest) {
  const back: CanvaBack = req.nextUrl.searchParams.get("back") === "channels" ? "channels" : "voice"
  const home = new URL(`/dashboard?ask=${back}`, process.env.NEXT_PUBLIC_APP_URL || req.url)
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || req.url))
  if (!canvaConfigured() || !hasPro(user)) return NextResponse.redirect(home)
  const { verifier, challenge } = canvaPkce()
  const res = NextResponse.redirect(canvaAuthUrl(signCanvaState(user.id, back), challenge))
  res.cookies.set(CANVA_PKCE_COOKIE, verifier, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600, path: "/api/canva" })
  return res
}
