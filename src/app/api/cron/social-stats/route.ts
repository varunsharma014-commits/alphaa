export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { refreshPostStats } from "@/lib/social/stats"

// Daily (04:00 UTC): refreshes post stats for every brand with a connected LinkedIn company Page,
// Facebook Page or Instagram account, and saves today's follower counts (lib/social/meta-stats.ts).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const [li, meta] = await Promise.all([
    db.mockActivity.findMany({ where: { type: "social_account", metadata: { path: ["extra", "kind"], equals: "organization" } }, select: { userId: true }, distinct: ["userId"], take: 500 }),
    db.mockActivity.findMany({ where: { type: "social_account", OR: [{ metadata: { path: ["platform"], equals: "facebook" } }, { metadata: { path: ["platform"], equals: "instagram" } }] }, select: { userId: true }, distinct: ["userId"], take: 500 }),
  ])
  const rows = [...new Map([...li, ...meta].map((r) => [r.userId, r])).values()]
  let updated = 0, failed = 0
  for (const r of rows) {
    try { updated += await refreshPostStats(r.userId) } catch { failed++ }
  }
  return NextResponse.json({ brands: rows.length, updated, failed })
}
