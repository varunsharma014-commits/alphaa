export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { publicHit } from "@/lib/quotas"
import { demoTeaser, publicTeaser, teaserOf } from "@/lib/demo-week"

// Public (under /api/scan/**): ONE finished social post with its branded image, shown on /start
// before the email ask (value first). The first week written after the email reuses it.
// One per finished scan (cached on the lead); a cached copy doesn't count against the cap.
const body = z.object({ scanId: z.string().min(10).max(64) })

export async function POST(req: NextRequest) {
  let scanId: string
  try {
    ;({ scanId } = body.parse(await req.json()))
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const lead = await db.scanLead.findUnique({ where: { id: scanId }, select: { ogData: true, visibilityScore: true } })
  if (!lead || lead.visibilityScore == null) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const cached = teaserOf(lead.ogData)
  if (cached) return NextResponse.json({ teaser: publicTeaser(scanId, cached) })
  const cap = await publicHit("teaser", req)
  if (!cap.ok) return NextResponse.json({ error: cap.error, quota: true }, { status: 429 })
  const t = await demoTeaser(scanId)
  if (!t) return NextResponse.json({ error: "Could not write a post" }, { status: 502 })
  return NextResponse.json({ teaser: publicTeaser(scanId, t) })
}
