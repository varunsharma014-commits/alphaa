import { NextRequest, NextResponse } from "next/server"

// In production with real Clerk keys, replace this file with the full Clerk middleware.
// For local dev without Clerk keys, this passes all requests through.
export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
