import { NextRequest, NextResponse } from "next/server"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SITE_COOKIE, sitePrefix } from "@/lib/sites"

export const dynamic = "force-dynamic"

// POST /api/sites/switch { id }: open another of the owner's websites. The first website
// (the login's own row) clears the cookie; an extra website must belong to this login.
export async function POST(req: NextRequest) {
  const { userId } = await realAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const row = await db.user.findFirst({
    where: { id, OR: [{ clerkId: userId }, { clerkId: { startsWith: sitePrefix(userId) } }] },
    select: { id: true, clerkId: true, onboardingCompleted: true },
  })
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const res = NextResponse.json({ ok: true, next: row.onboardingCompleted ? "/dashboard" : "/onboarding" })
  if (row.clerkId === userId) res.cookies.delete(SITE_COOKIE)
  else res.cookies.set(SITE_COOKIE, row.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 })
  return res
}
