import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { webflowExchange } from "@/lib/connector/webflow"
import { attachWebflow, sealPending, WF_PENDING_COOKIE, WF_PENDING_MAX_AGE } from "@/lib/connector/webflow-attach"
import { platformAvailability } from "@/lib/connector/availability"

export const dynamic = "force-dynamic"

const app = (path: string) => new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString()
const back = (params: Record<string, string>) => {
  const u = new URL("/dashboard/t/site", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return NextResponse.redirect(u.toString())
}
const fail = (msg: string) => back({ connect_error: msg })

// Webflow sends the owner back here with ?code&state, or ?error=access_denied when they
// cancel. Every failure lands back in the dashboard thread with a plain message.
export async function GET(request: NextRequest) {
  if (!platformAvailability().webflow) return back({ connect: "webflow-unavailable" })
  const sp = request.nextUrl.searchParams
  const code = sp.get("code")
  const state = sp.get("state")
  const oauthError = sp.get("error")

  if (oauthError) {
    return fail(oauthError === "access_denied" ? "You cancelled the Webflow connection, so nothing was connected." : `Webflow said: ${(sp.get("error_description") || oauthError).slice(0, 200)}`)
  }
  if (!code) return fail("Webflow didn’t send back a sign-in code. Try connecting again.")

  // Installs started on Webflow's side (the app's Install button, the Marketplace) come back
  // with a code but no state of ours: accept those for whoever is signed in. When we did send
  // a state, it must match the signed-in account.
  let stateUserId: string | null = null
  if (state) {
    try {
      stateUserId = (JSON.parse(Buffer.from(state, "base64url").toString()) as { userId?: string }).userId ?? null
    } catch {
      stateUserId = null
    }
  }

  const user = await currentUser()
  if (!user) {
    // Signed out (typical for installs started on Webflow): exchange the short-lived code now,
    // hold the token in an encrypted cookie, and attach it after sign-up / sign-in — so the
    // owner authorizes Webflow exactly once.
    try {
      const { accessToken } = await webflowExchange(code)
      const res = NextResponse.redirect(app(`/signup?redirect_url=${encodeURIComponent("/api/connect/webflow/finish")}`))
      res.cookies.set(WF_PENDING_COOKIE, sealPending(accessToken), {
        httpOnly: true, secure: true, sameSite: "lax", path: "/api/connect/webflow", maxAge: WF_PENDING_MAX_AGE,
      })
      return res
    } catch (e) {
      console.error("[Webflow Callback] exchange (signed out)", e)
      return fail("Couldn’t finish connecting Webflow. Sign in and try again.")
    }
  }
  if (state && stateUserId !== user.id) return fail("That Webflow sign-in didn’t match your account. Try connecting again.")

  try {
    const { accessToken } = await webflowExchange(code)
    const err = await attachWebflow(user, accessToken)
    if (err) return fail(err)
    return back({ connected: "webflow" })
  } catch (e) {
    console.error("[Webflow Callback]", e)
    return fail(e instanceof Error ? e.message.slice(0, 300) : "Couldn’t finish connecting Webflow.")
  }
}
