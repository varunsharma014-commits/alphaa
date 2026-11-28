import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/how-it-works",
  "/services(.*)",
  "/about",
  "/author(.*)",
  "/compare(.*)",
  "/integrations(.*)",
  "/for(.*)",
  "/blog(.*)",
  "/case-studies(.*)",
  "/scan(.*)",
  "/start(.*)",
  "/preview", // dev-only agent UI preview; 404s in production
  "/w(.*)",
  "/og", // social preview cards
  "/impressum",
  "/uk(.*)", "/de(.*)", "/fr(.*)", "/it(.*)", "/ae(.*)", // local market pages
  "/refer",
  "/login(.*)",
  "/signup(.*)",
  "/terms",
  "/privacy",
  "/accessibility",
  "/unsubscribe",
  "/api/unsubscribe",
  "/approve", // briefing-email approvals: a signed one-item token, no login
  "/team/accept", // team invites: the page sends signed-out people to /signup or /login itself
  "/api/agent/approve", // checks the token or the Clerk session itself
  "/llms/(.*)",
  "/tag.js",
  "/api/tag/(.*)",
  "/api/scan(.*)",
  "/api/webhooks/(.*)",
  "/api/webhooks/shopify(.*)", // app/uninstalled + GDPR topics (HMAC-verified); also covered by the line above
  "/api/cron/(.*)",
  "/api/integrations/sync",
  "/api/connect/wp/hello",
  "/api/connect/visit",
  "/api/img/(.*)",
  "/api/asset/(.*)", // brand library videos for Meta to pull: HMAC-signed, short expiry (lib/library/open.ts)
  "/api/connect/shopify/callback",
  "/api/connect/webflow/callback",
  // start/finish check the session themselves and send signed-out owners to our /login or
  // /signup with redirect_url, so an install never detours through the hosted Clerk portal.
  "/api/connect/webflow/start",
  "/api/connect/webflow/finish",
  "/api/connect/shopify/start",
  "/api/connect/wix/start",
  "/api/connect/wix/callback",
])

const isAuthRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // One canonical host: www.alphaa.app → alphaa.app, path and query kept.
  const host = req.headers.get("host") ?? ""
  if (host.startsWith("www.")) {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${host.slice(4)}`)
    return NextResponse.redirect(url, 301)
  }

  // Remember which market page someone came through, so checkout can charge
  // that market's currency (see /api/stripe/checkout).
  const seg = req.nextUrl.pathname.split("/")[1]
  const market = seg === "ae" && req.nextUrl.pathname.startsWith("/ae/ar") ? "ar" : seg
  const marketPage = ["uk", "de", "fr", "it", "ae", "ar"].includes(market)

  // Team gate (lib/auth.ts): every request carries its method + path, set HERE so a client can
  // never choose it. Members whose role can't make this request get no brand in auth().
  const forward = new Headers(req.headers)
  forward.set("x-alphaa-route", `${req.method} ${req.nextUrl.pathname}`)
  const next = () => NextResponse.next({ request: { headers: forward } })

  const { userId } = await auth()

  // Already signed in → bounce away from login/signup to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  if (marketPage) {
    const res = next()
    res.cookies.set("alphaa_market", market, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" })
    return res
  }

  // The market is set by how someone arrives. A fresh visit (typed URL, search, ad, email) to
  // an English page resets it, so a /ae visit months ago doesn't price today's US visit in AED.
  // Clicks inside the site keep it (/ae → /start must still charge AED), and app, auth and
  // API paths never touch it (Stripe/OAuth returns land there from other hosts).
  if (req.cookies.get("alphaa_market") && req.method === "GET" && req.headers.get("sec-fetch-dest") === "document") {
    const p = req.nextUrl.pathname
    const appPath = /^\/(api|dashboard|onboarding|login|signup|approve|unsubscribe|start-trial)(\/|$)/.test(p)
    let internal = false
    try {
      internal = new URL(req.headers.get("referer") ?? "").host.replace(/^www\./, "") === host.replace(/^www\./, "")
    } catch {
      internal = false
    }
    if (!appPath && !internal) {
      const res = next()
      res.cookies.set("alphaa_market", "", { path: "/", maxAge: 0, sameSite: "lax" })
      return res
    }
  }
  return next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
}
