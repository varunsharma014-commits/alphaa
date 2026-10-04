import { NextRequest, NextResponse } from "next/server"
import { unsubscribeBySignedLink } from "@/lib/unsubscribe"

// RFC 8058 one-click unsubscribe target (the List-Unsubscribe header points
// here). Mail clients POST "List-Unsubscribe=One-Click" with no cookies; the
// signed s/t query params are the only credential. Public in middleware.
// A GET (someone opening the header URL in a browser) goes to the human page.

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const s = req.nextUrl.searchParams.get("s") ?? ""
  const t = req.nextUrl.searchParams.get("t") ?? ""
  const ok = await unsubscribeBySignedLink(s, t).catch((e) => {
    console.error("[unsubscribe] failed", e)
    return false
  })
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 })
}

export async function GET(req: NextRequest) {
  const url = new URL("/unsubscribe", req.nextUrl.origin)
  url.search = req.nextUrl.search
  return NextResponse.redirect(url)
}
