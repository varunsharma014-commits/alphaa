// Usage credits: storage + wiring (rules in lib/credit-rules.ts). Ledger = one MockActivity row
// per entry, type "credit_ledger" (purchase / spend / refund; never shown in the work log).
// Settings `credits { autoUse, at }` = "Use credits when I run out" (on after the first purchase
// unless the owner turned it off). Comped accounts never need credits (quotas let them through).
import { db } from "@/lib/db"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { grantEntry, refundEntry, replay, CREDITS_PER_AI_DOLLAR, type LedgerEntry } from "@/lib/credit-rules"
import type { QuotaKind } from "@/lib/quota-rules"

export const CREDIT_LEDGER = "credit_ledger"

export async function ledger(userId: string): Promise<LedgerEntry[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: CREDIT_LEDGER }, orderBy: { createdAt: "asc" }, select: { metadata: true }, take: 5000 })
  return rows.map((r) => r.metadata as LedgerEntry)
}

async function add(userId: string, e: LedgerEntry, title: string): Promise<void> {
  await db.mockActivity.create({ data: { userId, type: CREDIT_LEDGER, title: title.slice(0, 190), metadata: e as object } })
}

export async function creditState(userId: string, now = new Date()) {
  const [entries, s] = await Promise.all([ledger(userId), getAgentSettings(userId)])
  const r = replay(entries, now)
  return { ...r, autoUse: !!s.credits?.autoUse, bought: entries.some((e) => e.t === "purchase") }
}

// Serialize writes per brand (spends also run inside the quota limiter's lock).
const locks = new Map<string, Promise<unknown>>()
function locked<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(userId) ?? Promise.resolve()
  const p = prev.catch(() => undefined).then(fn)
  locks.set(userId, p)
  void p.finally(() => { if (locks.get(userId) === p) locks.delete(userId) }).catch(() => undefined)
  return p
}

/** Record a spend (negative = give back). Also raises today's AI ceiling in the meter. */
export async function spendCredits(userId: string, credits: number, kind: QuotaKind | string, n = 1): Promise<void> {
  await add(userId, { t: "spend", credits, at: new Date().toISOString(), action: kind, n }, credits >= 0 ? `Used ${credits} credits` : `Gave back ${-credits} credits`)
  const { noteCreditsSpent } = await import("@/lib/usage")
  noteCreditsSpent(userId, credits)
}

/** Credit a paid Checkout Session once (idempotent by session id). Turns auto-use on the first time. */
export async function grantCredits(p: { userId: string; sessionId: string; credits: number; paymentIntent?: string | null; amount?: number; currency?: string }): Promise<boolean> {
  return locked(p.userId, async () => {
    const e = grantEntry(await ledger(p.userId), p)
    if (!e) return false
    await add(p.userId, e, `Bought ${p.credits} credits`)
    const s = await getAgentSettings(p.userId)
    if (s.credits?.autoUse === undefined) await saveAgentSettings(p.userId, { credits: { autoUse: true, at: new Date().toISOString() } })
    return true
  })
}

/** charge.refunded: remove the pack's unspent credits (all for a full refund, a share for a partial). */
export async function refundCredits(p: { paymentIntent: string; chargeId: string; amount: number; amountRefunded: number }): Promise<{ userId: string; credits: number } | null> {
  const row = await db.mockActivity.findFirst({ where: { type: CREDIT_LEDGER, metadata: { path: ["paymentIntent"], equals: p.paymentIntent } }, select: { userId: true } })
  if (!row) return null
  return locked(row.userId, async () => {
    const e = refundEntry(await ledger(row.userId), p)
    if (!e) return null
    await add(row.userId, e, `Refund removed ${e.credits} credits`)
    return { userId: row.userId, credits: e.credits }
  })
}

export async function setAutoUse(userId: string, on: boolean): Promise<void> {
  await saveAgentSettings(userId, { credits: { autoUse: on, at: new Date().toISOString() } })
}

/** Credits spent today / this month (for the meter's AI ceiling raise). */
export async function creditsSpent(userId: string): Promise<{ day: number; month: number }> {
  const r = replay(await ledger(userId))
  return { day: r.spentToday, month: r.spentMonth }
}

/**
 * The brand hit its daily/monthly AI ceiling during an owner's own request: spend 10 credits for
 * +$1 of headroom today, if auto-use is on and the balance covers it. The quota limiter's lock
 * isn't held here, so a per-brand one keeps parallel calls from each buying.
 */
const buying = new Map<string, Promise<boolean>>()
export function buyAiHeadroom(userId: string): Promise<boolean> {
  const cur = buying.get(userId)
  if (cur) return cur
  const p = locked(userId, async () => {
    const st = await creditState(userId)
    if (!st.autoUse || st.balance + 1e-9 < CREDITS_PER_AI_DOLLAR) return false
    await spendCredits(userId, CREDITS_PER_AI_DOLLAR, "ai_cost_usd", 1)
    return true
  }).finally(() => buying.delete(userId))
  buying.set(userId, p)
  return p
}
