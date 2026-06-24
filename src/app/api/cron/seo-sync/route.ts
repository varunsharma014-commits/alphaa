import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Automated daily GSC + GA pull. Iterates every connected account and triggers
// the existing /api/integrations/sync logic via its internal-user-id header, so
// keyword rankings + analytics snapshots refresh on their own — no manual sync.
// Protected by Bearer CRON_SECRET (same as the other crons). Scheduled from
// src/lib/cron-scheduler.ts.

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Connected = has a GSC site or a GA property selected.
  const integrations = await db.integration.findMany({
    where: {
      OR: [{ gscSiteUrl: { not: null } }, { gaPropertyId: { not: null } }],
    },
    select: { userId: true },
  })

  const base = `http://127.0.0.1:${process.env.PORT || 3000}`
  let ok = 0
  let failed = 0

  // Sequential to stay well under memory/rate limits; the set is small.
  for (const { userId } of integrations) {
    try {
      const res = await fetch(`${base}/api/integrations/sync`, {
        method: "POST",
        headers: { "x-internal-user-id": userId },
      })
      if (res.ok) ok++
      else {
        failed++
        console.error(`[seo-sync] sync failed for ${userId}: ${res.status}`)
      }
    } catch (err) {
      failed++
      console.error(`[seo-sync] sync threw for ${userId}:`, err)
    }
  }

  console.log(`[seo-sync] done — ${ok} ok, ${failed} failed, ${integrations.length} total`)
  return NextResponse.json({ success: true, accounts: integrations.length, ok, failed })
}
