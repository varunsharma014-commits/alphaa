export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { authorized } from "@/lib/cron/users"
import { applyGuarantee } from "@/lib/guarantee"

// Daily: apply the 90-day AI Visibility Guarantee credit to anyone who
// qualifies. applyGuarantee is idempotent (one credit per customer).
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await db.user.findMany({ where: { subscriptionStatus: "active", stripeSubscriptionId: { not: null } }, select: { id: true } })
  let credited = 0
  for (const u of users) {
    const v = await applyGuarantee(u.id).catch((err) => { console.error(`[cron/guarantee] ${u.id}`, err instanceof Error ? err.message : err); return null })
    if (v?.eligible) credited++
  }
  return NextResponse.json({ checked: users.length, credited })
}
