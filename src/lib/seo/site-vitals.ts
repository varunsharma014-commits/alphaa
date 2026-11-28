// Site vitals = Core Web Vitals (lib/seo/cwv-run.ts) + the structured data audit (lib/schema/audit.ts).
// Weekly from /api/cron/site-vitals (Thu 06:00 UTC + hourly catch-up through Friday, per-brand
// dedupe: a brand checked in the last 6 days is skipped) and on demand from Tracking & Setup.
// Kept apart from the site-check cron on purpose (its own lib + cron hit).
import { filterSuggestions, isOnlineBusiness } from "@/lib/schema/suggest"
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { CWV_TYPE, cwvLastFail, cwvRunning, latestCwv, psiKey, runCwv, type CwvCheck } from "@/lib/seo/cwv-run"
import { latestSchemaAudit, runSchemaAudit, schemaAuditRunning, SCHEMA_AUDIT, type SchemaAudit } from "@/lib/schema/audit"
import { WEBFLOW_SCOPES } from "@/lib/connector/webflow"
import { SHOPIFY_SCOPES } from "@/lib/connector/shopify"
import { trustedSchemas, type SchemaItem } from "@/lib/schema-generator"

export const WEEK_DEDUPE_MS = 6 * 86_400_000
export const OWNER_COOLDOWN_MS = 20 * 60_000

export async function runSiteVitals(user: User, reason: "weekly" | "owner"): Promise<{ cwv: CwvCheck | null; schema: SchemaAudit | null }> {
  const [cwv, schema] = await Promise.all([
    runCwv(user, reason).catch((e) => { console.error(`[site-vitals] cwv ${user.id}`, e instanceof Error ? e.message : e); return null }),
    runSchemaAudit(user, reason).catch((e) => { console.error(`[site-vitals] schema ${user.id}`, e instanceof Error ? e.message : e); return null }),
  ])
  return { cwv, schema }
}

/** Checked recently enough that the weekly run skips this brand. */
export async function checkedRecently(userId: string, ms = WEEK_DEDUPE_MS): Promise<boolean> {
  const since = new Date(Date.now() - ms)
  const types = psiKey() ? [CWV_TYPE] : [SCHEMA_AUDIT]
  return !!(await db.mockActivity.findFirst({ where: { userId, type: { in: types }, createdAt: { gte: since } }, select: { id: true } }))
}

// ── installing structured data, per platform, with the scopes we have TODAY ────────────────────
export type InstallOption = { auto: boolean; platform: string; how: string; posts: string }

/**
 * What each connection can do without new app permissions (Shopify + Webflow apps are in review).
 * Webflow: site custom code needs `custom_code:write`; Shopify: theme code needs `write_themes`;
 * Wix: site-wide code needs an embedded-script extension. None are granted, so those sites get
 * copy-paste + "Send it to my web person". Posts we publish carry Article/FAQ markup on WordPress
 * (plugin) and Wix (the post's SEO tags).
 */
export function installOption(s: Pick<AgentSettings, "wp" | "site">): InstallOption {
  if (s.wp) return { auto: true, platform: "WordPress", how: "I add it to your site through the Alphaa plugin, and you can undo it.", posts: "Posts I publish carry their own article and FAQ markup." }
  const p = s.site?.platform
  if (p === "webflow") {
    const can = WEBFLOW_SCOPES.includes("custom_code:write")
    return { auto: false, platform: "Webflow", how: can ? "Webflow can take it through the app." : "Webflow only lets apps add code to your site with a custom code permission my app doesn’t have yet. Paste it in Site settings, Custom code, Head code, or send it to your web person.", posts: "Webflow blog posts can’t carry extra code from an app, so posts go out without it." }
  }
  if (p === "shopify") {
    const can = SHOPIFY_SCOPES.split(",").includes("write_themes")
    return { auto: false, platform: "Shopify", how: can ? "Shopify can take it through the app." : "Shopify only lets apps change your theme with a theme permission my app doesn’t ask for. Paste it in Online Store, Themes, Edit code, theme.liquid, just before </head>, or send it to your web person.", posts: "Your Shopify theme adds its own product and article markup." }
  }
  if (p === "wix") return { auto: false, platform: "Wix", how: "Wix only lets apps add code to every page with an embedded script extension my app doesn’t have. Paste it in Settings, Custom code, Head, or send it to your web person.", posts: "Blog posts I publish on Wix already carry their article and FAQ markup." }
  return { auto: false, platform: "your website", how: "Paste it in your site’s header, or send it to your web person. Connect WordPress and I add it myself.", posts: "Connect your site and posts I publish carry their own markup where the platform allows." }
}

export type SiteVitals = {
  site: string | null
  keyMissing: boolean
  running: boolean
  cwv: CwvCheck | null
  cwvPrev: CwvCheck | null
  cwvFail: { at: string; errors: string[] } | null
  schema: SchemaAudit | null
  generated: { at: string; items: SchemaItem[] } | null
  install: InstallOption
  webPersonEmail: string | null
}

export async function getSiteVitals(user: User): Promise<SiteVitals> {
  const [settings, cwv, cwvPrev, schema, gen] = await Promise.all([
    getAgentSettings(user.id),
    latestCwv(user.id),
    latestCwv(user.id, 1),
    latestSchemaAudit(user.id),
    db.schemaMarkup.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } }),
  ])
  return {
    site: user.websiteUrl,
    keyMissing: !psiKey(),
    running: cwvRunning(user.id) || schemaAuditRunning(user.id),
    cwv,
    cwvPrev,
    cwvFail: cwvLastFail(user.id),
    schema,
    // Only blocks for pages that exist and types those pages don't have yet; an online business is
    // never offered LocalBusiness (older AI-made records offered /product and /faq pages that weren't there).
    generated: gen && trustedSchemas(gen.schemas).length
      ? {
          at: gen.generatedAt.toISOString(),
          items: filterSuggestions(trustedSchemas(gen.schemas), {
            pages: (schema?.pages ?? []).filter((p) => p.status != null && p.status < 400).map((p) => p.url),
            existing: (schema?.pages ?? []).map((p) => ({ url: p.url, types: p.types })),
            online: isOnlineBusiness(user.businessType),
          }),
        }
      : null,
    install: installOption(settings),
    webPersonEmail: settings.webPersonEmail ?? null,
  }
}

/** For the Briefing: what turned poor / newly disagrees, from the newest run if it's under 8 days old. */
export async function getSiteAlerts(userId: string): Promise<{ text: string; href: string }[]> {
  const since = Date.now() - 8 * 86_400_000
  const [cwv, schema] = await Promise.all([latestCwv(userId), latestSchemaAudit(userId)])
  const out: { text: string; href: string }[] = []
  if (cwv && new Date(cwv.at).getTime() >= since) {
    for (const a of cwv.alerts.slice(0, 3)) {
      let path = "/"
      try { path = new URL(a.url).pathname } catch {}
      out.push({ text: path === "/" ? a.text : `${path}: ${a.text}`, href: "/dashboard/tracking#vitals" })
    }
  }
  if (schema && new Date(schema.at).getTime() >= since) for (const t of schema.alerts.slice(0, 2)) out.push({ text: t, href: "/dashboard/tracking#structured-data" })
  return out
}
