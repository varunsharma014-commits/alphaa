export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { authorized } from "@/lib/cron/users"
import { db } from "@/lib/db"
import type { AgentSettings } from "@/lib/agent/settings"
import { webflow } from "@/lib/connector/webflow"
import { forgetRevokedWebflow } from "@/lib/connector/connection"

// Daily: Webflow sends apps no uninstall event, so check every stored Webflow connection once with
// one cheap read. A 401 means the owner uninstalled Alphaa or revoked its access in Webflow: the
// token is deleted (forgetRevokedWebflow) and never used again. Other errors are left alone
// (Webflow down, rate limit). `?dryRun=1` only counts.
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1"
  const rows = await db.mockActivity.findMany({
    where: { type: "agent_settings", metadata: { path: ["site", "platform"], equals: "webflow" } },
    select: { userId: true, metadata: true },
  })
  let ok = 0, removed = 0, failed = 0
  for (const row of rows) {
    const site = (row.metadata as AgentSettings | null)?.site
    if (!site || site.platform !== "webflow") continue
    if (dryRun) { ok++; continue }
    try {
      await webflow.ping(site)
      ok++
    } catch (e) {
      if (await forgetRevokedWebflow(row.userId, e)) removed++
      else failed++
    }
  }
  return NextResponse.json({ connections: rows.length, ok, removed, failed, dryRun })
}
