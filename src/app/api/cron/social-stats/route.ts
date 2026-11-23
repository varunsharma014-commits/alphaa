export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { refreshPostStats } from "@/lib/social/stats"

// Daily (04:00 UTC): refreshes post stats for every brand with a connected LinkedIn company Page.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rows = await db.mockActivity.findMany({ where: { type: "social_account", metadata: { path: ["extra", "kind"], equals: "organization" } }, select: { userId: true }, distinct: ["userId"], take: 500 })
  let updated = 0, failed = 0
  for (const r of rows) {
    try { updated += await refreshPostStats(r.userId) } catch { failed++ }
  }
  return NextResponse.json({ brands: rows.length, updated, failed })
}
