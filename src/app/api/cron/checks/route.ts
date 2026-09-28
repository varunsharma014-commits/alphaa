export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { activeUsers, authorized } from "@/lib/cron/users"
import { runCheck, type CheckKind } from "@/lib/checks/run"

// Weekly background checks: security, social profiles, directory details +
// outside ratings, and Bing Webmaster stats. Runs in the background.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await activeUsers()
  const kinds: CheckKind[] = ["security", "profiles", "listings", "bing"]
  void (async () => {
    for (const u of users) {
      for (const k of kinds) await runCheck(u.id, k).catch((err) => console.error(`[cron/checks] ${u.id} ${k}`, err instanceof Error ? err.message : err))
    }
  })()
  return NextResponse.json({ started: users.length })
}
