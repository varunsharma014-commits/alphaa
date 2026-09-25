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
}

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
