export const dynamic = "force-dynamic"

// Tracking & Setup → "Speed for real visitors" + "Structured data" (components/workspace/SiteVitals.tsx).
// GET = the newest results; POST { op: "run" } = check now (in the background; one per 20 min).
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/connector/user"
import { CWV_TYPE } from "@/lib/seo/cwv-run"
import { SCHEMA_AUDIT } from "@/lib/schema/audit"
import { getSiteVitals, OWNER_COOLDOWN_MS, runSiteVitals } from "@/lib/seo/site-vitals"

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getSiteVitals(user))
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { op?: string }
  if (body.op !== "run") return NextResponse.json({ error: "Unknown request." }, { status: 400 })
  if (!user.websiteUrl?.trim()) return NextResponse.json({ error: "Add your website address first, then I can check it." }, { status: 400 })
  const recent = await db.mockActivity.findFirst({ where: { userId: user.id, type: { in: [CWV_TYPE, SCHEMA_AUDIT] }, createdAt: { gte: new Date(Date.now() - OWNER_COOLDOWN_MS) }, metadata: { path: ["reason"], equals: "owner" } }, select: { createdAt: true } })
  if (recent) return NextResponse.json({ error: "I checked a few minutes ago. Give it 20 minutes, Google’s data doesn’t change faster than that." }, { status: 429 })
  void runSiteVitals(user, "owner").catch((e) => console.error("[vitals] run", e instanceof Error ? e.message : e))
  return NextResponse.json({ started: true })
}
