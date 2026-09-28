import { db } from "@/lib/db"

// Per-user agent settings, kept as JSON on a single MockActivity row
// (type "agent_settings") — the schema has no migrations directory.
export type AgentSettings = {
  webPersonEmail?: string
  /** WordPress connector, set when the plugin checks in with its key. */
  wp?: { siteUrl: string; restUrl: string; version: string; connectedAt: string; lastSeenAt?: string }
  bingPlacesDone?: string // ISO date the owner said it's done
  appleConnectDone?: string
  reviewLink?: string // owner-supplied fallback when Google doesn't return one
  /** Customer questions tracked weekly across the four AIs. */
  questions?: string[]
  /** Extra locations (Pro: up to 3 including the main one). */
  locations?: Location[]
  /** Social/review profile URLs the owner confirmed or added. */
  profiles?: string[]
  /** Bing Webmaster Tools API key, encrypted (see lib/checks/bing-webmaster). */
  bingKeyEnc?: string
  bingSite?: string
  /** Webflow / Shopify / Wix connection (WordPress uses `wp`). */
  site?: import("@/lib/connector/types").SiteConnection
  /** Pro: publish blog posts without asking (only drafts with no [placeholders]). */
  autoPublishPosts?: boolean
}

export type Location = { id: string; name: string; street: string; city: string; state?: string; zip?: string; phone?: string; hours?: string }

const TYPE = "agent_settings"

export async function getAgentSettings(userId: string): Promise<AgentSettings> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: TYPE }, orderBy: { createdAt: "desc" } })
  return (row?.metadata as AgentSettings | null) ?? {}
}

export async function saveAgentSettings(userId: string, patch: Partial<AgentSettings>): Promise<AgentSettings> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: TYPE }, orderBy: { createdAt: "desc" } })
  const next = { ...((row?.metadata as AgentSettings | null) ?? {}), ...patch }
  for (const k of Object.keys(next) as (keyof AgentSettings)[]) if (next[k] === undefined) delete next[k]
  if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: next as object } })
  else await db.mockActivity.create({ data: { userId, type: TYPE, title: "Agent settings", metadata: next as object } })
  return next
}

/** Pro and Full Service cover 3 locations in total (the main business + 2). */
export const maxExtraLocations = (plan: string) => (/pro|full/i.test(plan) ? 2 : 0)
