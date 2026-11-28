// Real activity ledger — every automated action alphaa takes writes a row here
// so the dashboard "what alphaa did for you" feed shows real work, not demos.
// Reuses the existing MockActivity model (no schema change).
//
// Logging is strictly best-effort: a failed activity write must NEVER break
// the operation that triggered it, so everything is swallowed after logging.
//
// Audit trail (teams, 2026-11-28): a row written in a signed-in request on a brand that has a
// team carries `metadata.actor` { clerkId, email, role, name } = who did it (the ledger shows
// "by Sam"). Single-owner brands and crons write exactly what they wrote before.

import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { ctxActor } from "@/lib/usage"

const teamCache = new Map<string, { team: boolean; at: number }>()
async function brandHasTeam(userId: string): Promise<boolean> {
  const hit = teamCache.get(userId)
  if (hit && Date.now() - hit.at < 60_000) return hit.team
  const team = (await db.teamMember.count({ where: { brandId: userId, status: { in: ["invited", "active"] } } }).catch(() => 0)) > 0
  teamCache.set(userId, { team, at: Date.now() })
  return team
}

/** The actor stamp for this request, when the brand has a team (or the actor is a member). */
export async function auditActor(userId: string): Promise<{ clerkId: string; email: string | null; role: string; name: string | null } | null> {
  const a = ctxActor()
  if (!a) return null
  if (a.role === "owner" && !(await brandHasTeam(userId))) return null
  return { clerkId: a.clerkId, email: a.email ?? null, role: a.role, name: a.name ?? null }
}

export async function logActivity(
  userId: string,
  type: string,
  title: string,
  description?: string,
  metadata?: object,
): Promise<void> {
  try {
    let meta = metadata as Record<string, unknown> | undefined
    if (!meta || !("actor" in meta)) {
      const actor = await auditActor(userId).catch(() => null)
      if (actor) meta = { ...(meta ?? {}), actor }
    }
    await db.mockActivity.create({
      data: {
        userId,
        type,
        title,
        description: description ?? null,
        metadata: (meta as Prisma.InputJsonValue) ?? undefined,
      },
    })
  } catch (err) {
    console.error(`[activity] Failed to log "${type}" for user ${userId}:`, err)
  }
}
