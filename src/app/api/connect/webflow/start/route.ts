import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { webflowAuthUrl } from "@/lib/connector/webflow"
import { platformAvailability } from "@/lib/connector/availability"
import { WF_STATE_COOKIE, WF_STATE_MAX_AGE } from "@/lib/connector/webflow-attach"

export const dynamic = "force-dynamic"

const app = (path: string) => new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString()

// The app's Install URL (Webflow Marketplace + Settings → Website connection). Goes straight to
// Webflow's authorization screen, as Webflow recommends for Data Client apps. Owners who aren't
// signed in to Alphaa yet authorize first; the callback holds the token while they sign up or sign
// in (/api/connect/webflow/finish), so they authorize Webflow exactly once.
export async function GET() {
  const user = await currentUser()
  if (!platformAvailability().webflow) return NextResponse.redirect(app("/dashboard?ask=site&connect=webflow-unavailable"))
  // A fresh nonce per authorization request, bound to this browser (httpOnly cookie): the callback
  // only exchanges a code whose state carries the same nonce (CSRF protection).
  const nonce = crypto.randomUUID()
  const state = Buffer.from(JSON.stringify({ ...(user ? { userId: user.id } : {}), nonce })).toString("base64url")
  const res = NextResponse.redirect(webflowAuthUrl(state))
  res.cookies.set(WF_STATE_COOKIE, nonce, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/connect/webflow", maxAge: WF_STATE_MAX_AGE })
  return res
}
