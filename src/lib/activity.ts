// Real activity ledger — every automated action alphaa takes writes a row here
// so the dashboard "what alphaa did for you" feed shows real work, not demos.
// Reuses the existing MockActivity model (no schema change).
//
// Logging is strictly best-effort: a failed activity write must NEVER break
// the operation that triggered it, so everything is swallowed after logging.

import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function logActivity(
  userId: string,
  type: string,
  title: string,
  description?: string,
  metadata?: object,
): Promise<void> {
  try {
    await db.mockActivity.create({
      data: {
        userId,
        type,
        title,
        description: description ?? null,
        metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
      },
    })
  } catch (err) {
    console.error(`[activity] Failed to log "${type}" for user ${userId}:`, err)
  }
}
