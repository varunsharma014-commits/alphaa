import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { webflowExchange } from "@/lib/connector/webflow"
import { attachWebflow, sealPending, WF_PENDING_COOKIE, WF_PENDING_MAX_AGE, WF_STATE_COOKIE } from "@/lib/connector/webflow-attach"
import { platformAvailability } from "@/lib/connector/availability"

export const dynamic = "force-dynamic"

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const app = (path: string) => new URL(path, BASE).toString()
const clearState = (res: NextResponse) => {
  res.cookies.set(WF_STATE_COOKIE, "", { path: "/api/connect/webflow", maxAge: 0 }) // one use
  return res
}
const back = (params: Record<string, string>) => {
  const u = new URL("/dashboard?ask=site", BASE)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return clearState(NextResponse.redirect(u.toString()))
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)

/** Signed-out owners (installs from the Marketplace) have no dashboard to land in: a plain page. */
function page(title: string, msg: string): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · Alphaa</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#faf8f5;color:#111114;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
main{max-width:440px;background:#fff;border:1px solid #ece7e0;border-radius:20px;padding:32px}h1{font-size:22px;margin:0 0 10px}p{line-height:1.5;color:#45454d;margin:0 0 22px}
a{display:inline-block;border-radius:999px;padding:11px 18px;font-weight:600;text-decoration:none;margin:0 8px 8px 0}.p{background:#111114;color:#fff}.g{border:1px solid #d9d3ca;color:#111114}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(msg)}</p><a class="p" href="/api/connect/webflow/start">Try again</a><a class="g" href="/">Back to alphaa.app</a></main></body></html>`
  return clearState(new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }))
}

// Webflow sends the owner back here with ?code&state, or ?error=access_denied when they cancel.
// Signed-in failures land back in the dashboard thread with a plain message; signed-out ones get
// a plain page with "Try again".
export async function GET(request: NextRequest) {
  if (!platformAvailability().webflow) return back({ connect: "webflow-unavailable" })
  const sp = request.nextUrl.searchParams
  const code = sp.get("code")
  const state = sp.get("state")
  const oauthError = sp.get("error")
  const user = await currentUser()
  const fail = (msg: string) => (user ? back({ connect_error: msg }) : page("Webflow isn’t connected", msg))

  if (oauthError) {
    return oauthError === "access_denied"
      ? fail("You cancelled the Webflow connection, so nothing was connected and Alphaa has no access to your site.")
      : fail(`Webflow said: ${(sp.get("error_description") || oauthError).slice(0, 200)}`)
  }
  if (!code) return fail("Webflow didn’t send back a sign-in code. Try connecting again.")

  // Verify the state before touching the code: it must carry the nonce this browser was given when
  // it started the authorization (cookie set by /api/connect/webflow/start), and, when it names an
  // Alphaa account, that account must be the one signed in. Installs started from Webflow's own
  // Install button come back with no state of ours: those are accepted for the browser's session.
  let stateUserId: string | null = null
  if (state) {
    let nonce: string | null = null
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString()) as { userId?: string; nonce?: string }
      stateUserId = parsed.userId ?? null
      nonce = parsed.nonce ?? null
    } catch {
      nonce = null
    }
    const expected = request.cookies.get(WF_STATE_COOKIE)?.value
    if (!nonce || !expected || nonce !== expected) return fail("That Webflow sign-in link expired or didn’t start here. Connect Webflow again.")
    if (stateUserId && user && stateUserId !== user.id) return fail("That Webflow sign-in didn’t match your account. Try connecting again.")
  }

  if (!user) {
    // Signed out (typical for Marketplace installs): exchange the short-lived code now, hold the
    // token encrypted until they sign up or sign in, then /finish attaches it — one authorization.
    try {
      const { accessToken } = await webflowExchange(code)
      const res = clearState(NextResponse.redirect(app(`/signup?redirect_url=${encodeURIComponent("/api/connect/webflow/finish")}`)))
      res.cookies.set(WF_PENDING_COOKIE, sealPending(accessToken), {
        httpOnly: true, secure: true, sameSite: "lax", path: "/api/connect/webflow", maxAge: WF_PENDING_MAX_AGE,
      })
      return res
    } catch (e) {
      console.error("[Webflow Callback] exchange (signed out)", e instanceof Error ? e.message : "error")
      return fail("Couldn’t finish connecting Webflow. Try again.")
    }
  }

  try {
    const { accessToken } = await webflowExchange(code)
    const err = await attachWebflow(user, accessToken)
    if (err) return fail(err)
    return back({ connected: "webflow" })
  } catch (e) {
    console.error("[Webflow Callback]", e instanceof Error ? e.message : "error")
    return fail(e instanceof Error ? e.message.slice(0, 300) : "Couldn’t finish connecting Webflow.")
  }
}
