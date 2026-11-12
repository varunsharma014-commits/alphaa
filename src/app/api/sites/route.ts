import { NextRequest, NextResponse } from "next/server"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isComped } from "@/lib/billing"
import { MAX_SITES, SITE_COOKIE, isSiteClerkId, listSites, newSiteIdentity, sitePrefix } from "@/lib/sites"

export const dynamic = "force-dynamic"

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 }

// GET /api/sites: the owner's websites and which one is open.
export async function GET(req: NextRequest) {
  const { userId } = await realAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Comped logins (founder, app review) count as paid; the tagged email never leaves the server.
  // `billed` = a real live subscription (blocks removal); `paid` also counts comped logins.
  const sites = (await listSites(userId)).map(({ email, ...s }) => ({ ...s, billed: s.paid, paid: s.paid || isComped(email) }))
  const cookie = req.cookies.get(SITE_COOKIE)?.value
  const activeId = sites.find((s) => s.id === cookie)?.id ?? sites[0]?.id ?? null
  return NextResponse.json({ sites, activeId, max: MAX_SITES })
}

// POST /api/sites: add a website. It opens straight away and goes through setup + its own plan.
export async function POST() {
  const { userId } = await realAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const owner = await db.user.findUnique({ where: { clerkId: userId }, select: { clerkId: true, email: true, fullName: true } })
  if (!owner) return NextResponse.json({ error: "Finish setting up your first website first." }, { status: 409 })
  const count = await db.user.count({ where: { clerkId: { startsWith: sitePrefix(userId) } } })
  if (count + 1 >= MAX_SITES) return NextResponse.json({ error: `You can have up to ${MAX_SITES} websites. Write to hi@alphaa.app for more.` }, { status: 409 })

  const id = newSiteIdentity(owner)
  const site = await db.user.create({
    data: { clerkId: id.clerkId, email: id.email, fullName: owner.fullName, subscriptionStatus: "none" },
    select: { id: true },
  })
  const res = NextResponse.json({ id: site.id, next: "/onboarding" })
  res.cookies.set(SITE_COOKIE, site.id, cookieOpts)
  return res
}

// DELETE /api/sites?id=: remove an extra website that has no live plan (e.g. setup abandoned).
export async function DELETE(req: NextRequest) {
  const { userId } = await realAuth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const id = req.nextUrl.searchParams.get("id") ?? ""
  const row = await db.user.findFirst({ where: { id, clerkId: { startsWith: sitePrefix(userId) } }, select: { id: true, clerkId: true, stripeSubscriptionId: true, subscriptionStatus: true } })
  if (!row || !isSiteClerkId(row.clerkId)) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (row.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(row.subscriptionStatus)) {
    return NextResponse.json({ error: "Cancel this website's plan first (Agent preferences → Billing)." }, { status: 409 })
  }
  await db.user.delete({ where: { id: row.id } })
  const res = NextResponse.json({ ok: true })
  if (req.cookies.get(SITE_COOKIE)?.value === row.id) res.cookies.delete(SITE_COOKIE)
  return res
}
