export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { checkSite, type SiteCheck } from "@/lib/site-check"

// The agent reads the owner's own site with the same 23 checks as /start and
// keeps the latest result (MockActivity "site_check", JSON metadata — no
// migration). Reused for 24h so opening the thread is instant after the first run.
export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!user.websiteUrl) return NextResponse.json({ error: "No website on file" }, { status: 400 })

  const force = new URL(req.url).searchParams.get("force") === "1"
  const cached = await db.mockActivity.findFirst({ where: { userId: user.id, type: "site_check" }, orderBy: { createdAt: "desc" } })
  if (!force && cached && Date.now() - cached.createdAt.getTime() < 86_400_000 && cached.metadata) {
    return NextResponse.json({ check: cached.metadata as unknown as SiteCheck, at: cached.createdAt, userId: user.id })
  }

  const isLocal = !!(user.city && user.city.trim())
  const check = await Promise.race([
    checkSite(user.websiteUrl, { isLocal, city: user.city ?? "" }),
    new Promise<null>((r) => setTimeout(() => r(null), 45_000)),
  ])
  if (!check) return NextResponse.json({ error: "Your site took too long to answer. I’ll try again shortly." }, { status: 504 })

  const row = await db.mockActivity.create({
    data: {
      userId: user.id,
      type: "site_check",
      title: `Read ${check.domain} the way AI does — ${check.passed} of ${check.total} checks pass`,
      metadata: check as unknown as object,
    },
  })
  return NextResponse.json({ check, at: row.createdAt, userId: user.id })
}
