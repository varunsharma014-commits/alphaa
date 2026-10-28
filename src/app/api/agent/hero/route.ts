export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { getHero } from "@/lib/agent/hero"
import { buildRecap } from "@/lib/agent/recap"

// The briefing's top number. Loaded after paint: it calls Google Analytics
// (and, once per account, writes the customer-value estimate).
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // First week of a month: last month's recap rides along.
  const withRecap = new Date().getUTCDate() <= 7 && Date.now() - user.createdAt.getTime() > 20 * 86_400_000
  const [hero, recap] = await Promise.all([
    Promise.race([getHero(user.id), new Promise<null>((r) => setTimeout(() => r(null), 20_000))]),
    withRecap ? buildRecap(user.id).catch(() => null) : Promise.resolve(null),
  ])
  return hero ? NextResponse.json({ ...hero, recap: recap && recap.jobs > 0 ? recap : null }) : NextResponse.json({ error: "Timed out" }, { status: 504 })
}
