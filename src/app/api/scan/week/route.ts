export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { demoOf, publicWeek, startDemoWeek } from "@/lib/demo-week"

// Public (under /api/scan/**): the visitor's first week of marketing, behind their email.
// POST { scanId } starts it (one per email); GET ?id= polls it.
const body = z.object({ scanId: z.string().min(10).max(64) })

function ipOf(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64)
}

export async function POST(req: NextRequest) {
  let scanId: string
  try {
    ;({ scanId } = body.parse(await req.json()))
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  const r = await startDemoWeek(scanId, ipOf(req))
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ id: r.leadId, again: !!r.again })
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id") ?? ""
  if (id.length < 10 || id.length > 64) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const lead = await db.scanLead.findUnique({ where: { id }, select: { ogData: true } })
  const w = demoOf(lead?.ogData)
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ week: publicWeek(id, w) })
}
