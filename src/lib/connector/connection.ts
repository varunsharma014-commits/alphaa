// The owner's one website connection, whichever platform it's on: what it is,
// whether it still works, and how to remove it. WordPress lives in settings.wp
// (the plugin); Webflow / Shopify / Wix in settings.site (OAuth app tokens).
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings, type AgentSettings } from "@/lib/agent/settings"
import { wpCall, type WpStatus } from "@/lib/connector/wordpress"
import { webflow, webflowRevoke, webflowToken } from "@/lib/connector/webflow"
import { shopify } from "@/lib/connector/shopify"
import { wix } from "@/lib/connector/wix"
import { PLATFORM_NAME } from "@/lib/connector/platforms"
import type { Platform, SiteConnection, SiteConnector } from "@/lib/connector/types"

const CONNECTORS: Record<SiteConnection["platform"], SiteConnector> = { webflow, shopify, wix }

export type ConnectionStatus = {
  platform: Platform | "none"
  siteUrl: string | null
  label: string | null // what the owner recognises: domain or shop name
  connectedAt: string | null
  health: "ok" | "error" | "unknown"
  healthError?: string
}

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "")
  } catch {
    return u
  }
}

/** Current connection plus a cheap live ping (one authenticated read, 20s timeout at most). */
export async function connectionStatus(userId: string, s?: AgentSettings): Promise<ConnectionStatus> {
  s = s ?? (await getAgentSettings(userId))
  if (s.wp) {
    const base = { platform: "wordpress" as const, siteUrl: s.wp.siteUrl, label: host(s.wp.siteUrl), connectedAt: s.wp.connectedAt }
    try {
      await wpCall<WpStatus>(userId, s.wp, "status")
      return { ...base, health: "ok" }
    } catch (e) {
      return { ...base, health: "error", healthError: `WordPress didn’t answer: ${e instanceof Error ? e.message : String(e)}. Check the Alphaa plugin is still active.` }
    }
  }
  if (s.site) {
    const base = { platform: s.site.platform, siteUrl: s.site.siteUrl, label: s.site.label || host(s.site.siteUrl), connectedAt: s.site.connectedAt }
    try {
      await CONNECTORS[s.site.platform].ping(s.site)
      return { ...base, health: "ok" }
    } catch (e) {
      return { ...base, health: "error", healthError: e instanceof Error ? e.message : `${PLATFORM_NAME[s.site.platform]} didn’t answer.` }
    }
  }
  return { platform: "none", siteUrl: null, label: null, connectedAt: null, health: "unknown" }
}

/**
 * Forget the connection and its tokens. Webflow tokens are revoked at Webflow too (best effort).
 * Shopify has no app-side revoke short of uninstalling, which is the merchant's call; Wix tokens
 * are short-lived client-credentials tokens tied to the install. The WordPress plugin holds no
 * token of ours; its key stops working for publishing once we forget the site.
 */
export async function disconnectSite(userId: string): Promise<{ platform: Platform | null; revoked: boolean }> {
  const s = await getAgentSettings(userId)
  const platform: Platform | null = s.wp ? "wordpress" : s.site?.platform ?? null
  if (!platform) return { platform: null, revoked: false }
  let revoked = false
  if (s.site?.platform === "webflow") {
    const token = webflowToken(s.site)
    if (token) revoked = await webflowRevoke(token)
  }
  await saveAgentSettings(userId, { wp: undefined, site: undefined })
  await db.mockActivity.create({
    data: { userId, type: "site_disconnected", title: `Disconnected your ${PLATFORM_NAME[platform]} site`, metadata: { platform, revoked } },
  })
  return { platform, revoked }
}

/** Shopify told us the app was uninstalled (or the shop asked to be erased): drop every connection to that shop. */
export async function clearShopifyShop(shop: string, reason: string): Promise<number> {
  const rows = await db.mockActivity.findMany({
    where: { type: "agent_settings", metadata: { path: ["site", "config", "shop"], equals: shop } },
  })
  let n = 0
  for (const row of rows) {
    const meta = (row.metadata ?? {}) as AgentSettings
    if (meta.site?.platform !== "shopify") continue
    const { site: _drop, ...rest } = meta
    void _drop
    await db.mockActivity.update({ where: { id: row.id }, data: { metadata: rest as object } })
    await db.mockActivity.create({ data: { userId: row.userId, type: "site_disconnected", title: `Your Shopify store ${shop} was disconnected (${reason})`, metadata: { platform: "shopify", shop, reason } } })
    n++
  }
  return n
}
