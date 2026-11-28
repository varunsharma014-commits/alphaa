export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activeUsers, authorized } from "@/lib/cron/users"
import { asUser } from "@/lib/usage"
import { refreshBacklinks } from "@/lib/backlinks/run"
import { refreshKeywordData } from "@/lib/keywords/view"

// Monthly SEO data (1st 10:00 UTC, re-hit hourly until the 3rd ends by lib/cron-scheduler.ts):
// "Who links to you" (lib/backlinks/run.ts) and the keyword numbers behind Research → Keywords
// (lib/keywords/view.ts). Per-brand dedupe: one backlinks snapshot per calendar month, keyword
// data is cached 30 days, so a re-hit after a deploy only finishes the unfinished brands. Paid
// plans + comped only (DataForSEO is paid; every call on the brand's data_usd quota).
let running = false

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (running) return NextResponse.json({ skipped: "already running" })
  running = true
  const users = await activeUsers().catch(() => [])
  void (async () => {
    const tally: Record<string, number> = {}
    try {
      for (const u of users) {
        if (!u.websiteUrl) continue
        asUser(u.id)
        const user = await db.user.findUnique({ where: { id: u.id } })
        if (!user) continue
        const b = await refreshBacklinks(user, "cron").catch((err) => {
          console.error(`[cron/backlinks] ${u.id}`, err instanceof Error ? err.message : err)
          return { snapshot: null, skipped: "failed" }
        })
        const key = b.snapshot ? "done" : b.skipped ?? "skipped"
        tally[key] = (tally[key] ?? 0) + 1
        if (b.skipped === "plan") continue
        const k = await refreshKeywordData(user).catch((err) => { console.error(`[cron/backlinks] keywords ${u.id}`, err instanceof Error ? err.message : err); return null })
        if (k) tally.keywords = (tally.keywords ?? 0) + 1
      }
      console.log("[cron/backlinks]", JSON.stringify(tally))
    } finally {
      running = false
    }
  })()
  return NextResponse.json({ started: users.length })
}
