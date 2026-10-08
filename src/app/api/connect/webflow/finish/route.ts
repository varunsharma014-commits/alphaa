import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { attachWebflow, openPending, WF_PENDING_COOKIE } from "@/lib/connector/webflow-attach"

export const dynamic = "force-dynamic"

const app = (path: string) => new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString()

// Second half of a signed-out Webflow install: the callback already exchanged the code and
// parked the token in an encrypted cookie; after sign-up / sign-in we attach it here.
export async function GET(request: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.redirect(app(`/login?redirect_url=${encodeURIComponent("/api/connect/webflow/finish")}`))

  const token = openPending(request.cookies.get(WF_PENDING_COOKIE)?.value)
  const done = (path: string) => {
    const res = NextResponse.redirect(app(path))
    res.cookies.set(WF_PENDING_COOKIE, "", { path: "/api/connect/webflow", maxAge: 0 })
    return res
  }
  if (!token) return done(`/dashboard/t/site?connect_error=${encodeURIComponent("That Webflow connection expired. Connect Webflow again from Settings → Website connection.")}`)

  try {
    const err = await attachWebflow(user, token)
    if (err) return done(`/dashboard/t/site?connect_error=${encodeURIComponent(err)}`)
    return done("/dashboard/t/site?connected=webflow")
  } catch (e) {
    console.error("[Webflow Finish]", e)
    return done(`/dashboard/t/site?connect_error=${encodeURIComponent("Couldn’t finish connecting Webflow.")}`)
  }
}
