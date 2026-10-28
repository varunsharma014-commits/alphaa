export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { activeUsers, authorized } from "@/lib/cron/users"
import { runCheck, type CheckKind } from "@/lib/checks/run"
import { db } from "@/lib/db"
import { checkSite } from "@/lib/site-check"

// Weekly background checks: security, social profiles, directory details +
// outside ratings, Bing Webmaster stats, and a fresh read of the website the
// way AI does (feeds the "Your setup" ticks: robots.txt, llms.txt, schema,
// sitemap, HTTPS). Runs in the background.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await activeUsers()
  const kinds: CheckKind[] = ["security", "profiles", "listings", "bing"]
  void (async () => {
    for (const u of users) {
      for (const k of kinds) await runCheck(u.id, k).catch((err) => console.error(`[cron/checks] ${u.id} ${k}`, err instanceof Error ? err.message : err))
      await readSite(u.id).catch((err) => console.error(`[cron/checks] ${u.id} site`, err instanceof Error ? err.message : err))
    }
  })()
  return NextResponse.json({ started: users.length })
}

/** Same read as /api/agent/site-check, stored the same way (MockActivity "site_check"). */
async function readSite(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, city: true } })
  if (!user?.websiteUrl) return
  const check = await Promise.race([
    checkSite(user.websiteUrl, { isLocal: !!user.city?.trim(), city: user.city ?? "" }),
    new Promise<null>((r) => setTimeout(() => r(null), 45_000)),
  ])
  if (!check) return
  await db.mockActivity.create({
    data: { userId, type: "site_check", title: `Read ${check.domain} the way AI does — ${check.passed} of ${check.total} checks pass`, metadata: check as unknown as object },
  })
}
