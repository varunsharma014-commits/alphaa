export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { getRoi, roiLines } from "@/lib/roi"
import { PLATFORM_NAME } from "@/lib/connector/platforms"

// The agent's "memory" panel: what it knows about the business right now
// (results, connections, work done). Loaded after the chat paints, because
// the results call Google and can take a few seconds.

// Ledger rows that are bookkeeping, not work an owner would recognise.
const NOISE = ["sandbox_query", "agent_settings", "question_scan_started", "ai_visit", "email_sent", "keywords_synced"]

const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [settings, integration, work, roi] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationName: true, gscSiteUrl: true, gaPropertyId: true, gaPropertyName: true } }),
    db.mockActivity.findMany({
      where: { userId: user.id, type: { notIn: NOISE } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, description: true, createdAt: true },
    }),
    // Results are a nice-to-have here: never fail the panel over a slow Google call.
    Promise.race([getRoi(user.id).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 12_000))]),
  ])

  const website = settings.wp
    ? { platform: "WordPress", site: host(settings.wp.siteUrl) }
    : settings.site
      ? { platform: PLATFORM_NAME[settings.site.platform], site: settings.site.label || host(settings.site.siteUrl) }
      : null

  return NextResponse.json({
    results: roi ? roiLines(roi).slice(0, 3) : [],
    google: integration
      ? {
          profile: integration.gmbLocationName ?? null,
          searchConsole: integration.gscSiteUrl ? integration.gscSiteUrl.replace(/^sc-domain:/, "") : null,
          analytics: integration.gaPropertyName ?? (integration.gaPropertyId ? "Connected" : null),
        }
      : null,
    website,
    work: work.map((w) => ({ id: w.id, title: w.title, detail: w.description, at: w.createdAt.toISOString() })),
  })
}
