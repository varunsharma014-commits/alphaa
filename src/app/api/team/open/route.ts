export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SITE_COOKIE } from "@/lib/sites"

// GET /api/team/open?id=<brandId>: opens a brand this login is an ACTIVE member of and goes to
// the dashboard. Used when a member signs in on a new device with no brand open and their own
// login has no finished brand (the dashboard layout sends them here instead of to onboarding).
export async function GET(req: NextRequest) {
  const { userId } = await realAuth()
  if (!userId) return NextResponse.redirect(new URL("/login", req.url))
  const id = req.nextUrl.searchParams.get("id") ?? ""
  const m = id ? await db.teamMember.findFirst({ where: { brandId: id, clerkId: userId, status: "active" }, select: { brandId: true } }) : null
  const res = NextResponse.redirect(new URL(m ? "/dashboard" : "/onboarding", req.url))
  if (m) res.cookies.set(SITE_COOKIE, m.brandId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 })
  return res
}
