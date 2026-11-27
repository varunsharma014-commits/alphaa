export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { buildSnapshot, snapshotOf, startBrand } from "@/lib/scan-snapshot"
import { publicHit } from "@/lib/quotas"

// Public (under /api/scan/**): brand / content / competitors cards for a /start scan.
// Called once as the scan starts (warms the brand read; answers { ready: false }) and once
// when it's done (the cards). Cached on the lead.
const body = z.object({ scanId: z.string().min(10).max(64) })

export async function POST(req: NextRequest) {
  let scanId: string
  try {
    ;({ scanId } = body.parse(await req.json()))
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const lead = await db.scanLead.findUnique({ where: { id: scanId }, select: { ogData: true, visibilityScore: true, businessUrl: true, businessName: true } })
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const have = snapshotOf(lead.ogData)
  if (have) return NextResponse.json({ ready: true, snapshot: have })
  const cap = await publicHit("snapshot", req)
  if (!cap.ok) return NextResponse.json({ error: cap.error, quota: true }, { status: 429 })
  if (lead.visibilityScore == null) {
    if (lead.businessUrl) void startBrand(scanId, lead.businessUrl, lead.businessName)
    return NextResponse.json({ ready: false })
  }
  const snapshot = await buildSnapshot(scanId)
  if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ready: true, snapshot })
}
