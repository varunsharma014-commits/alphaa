import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/how-it-works",
  "/case-studies(.*)",
  "/scan(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/terms",
  "/privacy",
  "/llms/(.*)",
  "/tag.js",
  "/api/tag/(.*)",
  "/api/scan(.*)",
  "/api/webhooks/(.*)",
  "/api/cron/(.*)",
])

const isAuthRoute = createRouteMatcher(["/login(.*)", "/signup(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Already signed in → bounce away from login/signup to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
