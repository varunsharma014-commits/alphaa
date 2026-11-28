export const dynamic = "force-dynamic"
export const maxDuration = 300

import { cronAllowed } from "@/lib/quotas"
import { NextResponse } from "next/server"
import { activeUsers, authorized } from "@/lib/cron/users"
import { runCheck } from "@/lib/checks/run"
import { db } from "@/lib/db"
import { checkSite } from "@/lib/site-check"
import { asUser } from "@/lib/usage"
import { CHECK_STEPS, dueSteps, type CheckStep } from "@/lib/checks/due"

// Weekly background checks (Tue 09:00 UTC, re-hit hourly until Wednesday ends by
// lib/cron-scheduler.ts): security, social profiles, directory details + outside ratings, Bing
// Webmaster stats, and a fresh read of the website the way AI does (feeds the "Your setup" ticks:
// robots.txt, llms.txt, schema, sitemap, HTTPS). Dedupe is per brand AND per check kind: a kind
// stored in the last 5 days is skipped, so a run a deploy cut off resumes where it stopped. Kinds
// that store nothing (no website, no Bing key) are tried once per process per week.
let running = false
const tried = new Set<string>()

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Platform AI budget (AI_DAILY_BUDGET_USD) reached today: this cron makes new AI work, so it waits (lib/quotas.ts).
  if (!(await cronAllowed("checks"))) return NextResponse.json({ skipped: "platform AI budget reached for today" })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  const users = await activeUsers().catch(() => [])
  const week = weekKey(new Date())
  void (async () => {
    let ran = 0
    try {
      for (const u of users) {
        asUser(u.id)
        const rows = await db.mockActivity.findMany({
          where: { userId: u.id, type: { in: CHECK_STEPS.map(typeOf) }, createdAt: { gte: new Date(Date.now() - 5 * 86_400_000) } },
          select: { type: true },
        })
        const due = dueSteps(rows.map((r) => r.type)).filter((k) => !tried.has(`${u.id}|${k}|${week}`))
        for (const k of due) {
          tried.add(`${u.id}|${k}|${week}`)
          ran++
          if (k === "site") await readSite(u.id).catch((err) => console.error(`[cron/checks] ${u.id} site`, err instanceof Error ? err.message : err))
          else await runCheck(u.id, k).catch((err) => console.error(`[cron/checks] ${u.id} ${k}`, err instanceof Error ? err.message : err))
        }
      }
      console.log(`[cron/checks] ${ran} checks run for ${users.length} brands`)
    } finally {
      running = false
      if (tried.size > 20_000) tried.clear()
    }
  })()
  return NextResponse.json({ started: users.length })
}

const typeOf = (k: CheckStep) => (k === "site" ? "site_check" : `check_${k}`)
const weekKey = (d: Date) => `${d.getUTCFullYear()}-${Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / (7 * 86_400_000))}`

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
