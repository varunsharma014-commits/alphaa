export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextResponse } from "next/server"
import { currentUser } from "@/lib/connector/user"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { PLATFORM_NAME } from "@/lib/connector/platforms"
import type { SiteCheck } from "@/lib/site-check"

// One line per thing an owner can understand at a glance. ok: true = green
// tick, false = red cross (with what fixes it), null = not checked yet.
type Health = { label: string; ok: boolean | null; fix?: { topic: string } | { href: string } }

// The agent's "memory" panel: what it knows about the business right now
// (setup checklist, connections, work done). Results live on the main
// briefing now (lib/agent/hero.ts).

// Ledger rows that are bookkeeping, not work an owner would recognise.
const NOISE = ["sandbox_query", "agent_settings", "question_scan_started", "ai_visit", "email_sent", "keywords_synced"]

const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [settings, integration, work, siteRow, llmsPush] = await Promise.all([
    getAgentSettings(user.id),
    db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationName: true, gmbLocationId: true, gscSiteUrl: true, gaPropertyId: true, gaPropertyName: true } }),
    db.mockActivity.findMany({
      where: { userId: user.id, type: { notIn: NOISE } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, description: true, createdAt: true },
    }),
    db.mockActivity.findFirst({ where: { userId: user.id, type: "site_check" }, orderBy: { createdAt: "desc" }, select: { metadata: true } }),
    db.mockActivity.findFirst({ where: { userId: user.id, type: "site_change", metadata: { path: ["op"], equals: "llms" } }, orderBy: { createdAt: "desc" }, select: { metadata: true } }),
  ])

  // Site checks come from the latest read of the site (lib/site-check.ts).
  const checks = ((siteRow?.metadata as unknown as SiteCheck | null)?.checks ?? [])
  const check = (...keys: string[]): boolean | null => {
    const found = checks.filter((c) => keys.includes(c.key))
    if (!found.length || found.some((c) => c.ok === null)) return found.some((c) => c.ok === false) ? false : null
    return found.every((c) => c.ok === true)
  }
  const llmsLive = llmsPush && !(llmsPush.metadata as { undone?: boolean } | null)?.undone
  const siteFix = { topic: "site" }
  const connect = { href: "/dashboard/settings/integrations" }
  const health: Health[] = [
    { label: "Website connected", ok: !!(settings.wp || settings.site), fix: { href: "/dashboard/settings/website" } },
    { label: "Google Business Profile", ok: !!integration?.gmbLocationId, fix: connect },
    { label: "Google Search Console", ok: !!integration?.gscSiteUrl, fix: connect },
    { label: "Google Analytics", ok: !!integration?.gaPropertyId, fix: connect },
    { label: "AI bots allowed (robots.txt)", ok: check("aibots", "robots"), fix: siteFix },
    { label: "AI info file (llms.txt)", ok: llmsLive ? true : check("llms"), fix: siteFix },
    { label: "Business details code (schema)", ok: check("schema"), fix: siteFix },
    { label: "Sitemap", ok: check("sitemap"), fix: siteFix },
    { label: "Secure site (HTTPS)", ok: check("https"), fix: siteFix },
    { label: "Bing connected", ok: !!(settings.bingKeyEnc && settings.bingSite), fix: { topic: "listings" } },
  ]

  const website = settings.wp
    ? { platform: "WordPress", site: host(settings.wp.siteUrl) }
    : settings.site
      ? { platform: PLATFORM_NAME[settings.site.platform], site: settings.site.label || host(settings.site.siteUrl) }
      : null

  return NextResponse.json({
    google: integration
      ? {
          profile: integration.gmbLocationName ?? null,
          searchConsole: integration.gscSiteUrl ? integration.gscSiteUrl.replace(/^sc-domain:/, "") : null,
          analytics: integration.gaPropertyName ?? (integration.gaPropertyId ? "Connected" : null),
        }
      : null,
    website,
    health,
    work: work.map((w) => ({ id: w.id, title: w.title, detail: w.description, at: w.createdAt.toISOString() })),
  })
}
