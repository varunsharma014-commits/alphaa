export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { currentUser as clerkUser } from "@clerk/nextjs/server"
import { z } from "zod"
import { realAuth } from "@/lib/auth"
import { SITE_COOKIE } from "@/lib/sites"
import { acceptInvite } from "@/lib/team/store"

// POST /api/team/accept { t }: the invitee, signed in with Clerk, accepts. The login must have a
// VERIFIED email equal to the invited address (lib/team/store.ts acceptInvite). On success the
// brand opens (alphaa_site cookie); lib/auth.ts re-checks the membership on every request.
const body = z.object({ t: z.string().min(20).max(800) })

export async function POST(req: Request) {
  const { userId } = await realAuth()
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  let input: z.infer<typeof body>
  try { input = body.parse(await req.json()) } catch { return NextResponse.json({ error: "That link doesn’t look right." }, { status: 400 }) }
  const cu = await clerkUser()
  if (!cu || cu.id !== userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  const verifiedEmails = cu.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress)
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || null
  const r = await acceptInvite(input.t, { id: userId, verifiedEmails, name })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  const res = NextResponse.json({ ok: true, next: "/dashboard" })
  res.cookies.set(SITE_COOKIE, r.brandId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 })
  return res
}
