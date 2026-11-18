export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { saveImageSettings } from "@/lib/post-images"
import { CANVA_PKCE_COOKIE, connectCanva, readCanvaState } from "@/lib/canva/client"

// Canva sends the owner back here with a code: exchange it (with the PKCE verifier), save the tokens encrypted.
export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || req.url))
  const u = req.nextUrl.searchParams
  const state = readCanvaState(u.get("state"))
  const back = new URL(`/dashboard?ask=${state?.b ?? "voice"}`, process.env.NEXT_PUBLIC_APP_URL || req.url)
  const note = async (text: string) => {
    await saveImageSettings(user.id, { canvaNote: text })
    const r = NextResponse.redirect(back)
    r.cookies.set(CANVA_PKCE_COOKIE, "", { path: "/api/canva", maxAge: 0 })
    return r
  }
  // The state must be this signed-in owner's own (no cross-account connects).
  if (!state || state.u !== user.id) return note("That Canva connection expired. Try again.")
  if (u.get("error")) return note(`Canva wasn’t connected: ${(u.get("error_description") ?? u.get("error") ?? "").slice(0, 200)}.`)
  const code = u.get("code")
  const verifier = req.cookies.get(CANVA_PKCE_COOKIE)?.value
  if (!code || !verifier) return note("Canva didn’t send a code back. Try again.")
  try {
    const acc = await connectCanva(user.id, code, verifier)
    return note(`Connected Canva${acc.name ? ` (${acc.name})` : ""}.`)
  } catch (err) {
    console.error("[canva/callback]", err instanceof Error ? err.message : err)
    return note(`Canva didn’t connect: ${err instanceof Error ? err.message.slice(0, 200) : "something went wrong"}`)
  }
}
