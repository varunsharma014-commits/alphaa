import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/how-it-works",
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
  "/unsubscribe",
  "/api/unsubscribe",
  "/approve", // briefing-email approvals: a signed one-item token, no login
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

  const { userId } = await auth()

  // Already signed in → bounce away from login/signup to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  if (marketPage) {
    const res = NextResponse.next()
    res.cookies.set("alphaa_market", market, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax" })
    return res
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
}
