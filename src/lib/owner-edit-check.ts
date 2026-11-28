// The owner's own edits are checked against their banned words when they approve or publish
// (social, Google update, website/blog, email, review reply). The writers already follow the rules
// (lib/guardrails.ts enforce), but text the owner changed afterwards was never re-checked.
// It's a warning, not a block: the answer is a 409 { error, banned, confirmBanned: true }; the
// dashboard (components/workspace/BannedWordConfirm.tsx) asks "Publish it anyway?" and sends the
// same request again with the header below. Crons and background work are never asked (nobody to
// answer; their text was written under the rules).
import { bannedEditMessage, bannedInEdit, getGuardrails } from "@/lib/guardrails"

export const OK_BANNED_HEADER = "x-alphaa-ok-banned"

export type BannedHit = { word: string; message: string }

/** Is this an owner's request that hasn't confirmed yet? Null outside a request or in a cron call. */
async function ownerAsking(): Promise<boolean> {
  try {
    const { headers } = await import("next/headers")
    const h = await headers()
    if (process.env.CRON_SECRET && h.get("authorization") === `Bearer ${process.env.CRON_SECRET}`) return false
    return h.get(OK_BANNED_HEADER) !== "1"
  } catch {
    return false // not in a request (scripts, timers)
  }
}

/** The banned word in text the owner is publishing, unless they already said "publish anyway". */
export async function ownerBannedHit(userId: string, texts: (string | null | undefined)[]): Promise<BannedHit | null> {
  if (!(await ownerAsking())) return null
  const g = await getGuardrails(userId).catch(() => null)
  const word = bannedInEdit(texts, g)
  return word ? { word, message: bannedEditMessage(word) } : null
}

/** The JSON + status for a route that got a BannedHit. */
export const bannedBody = (hit: BannedHit) => [{ error: hit.message, banned: hit.word, confirmBanned: true }, { status: 409 }] as const
