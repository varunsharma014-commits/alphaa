// Usage credits (Varun, 2026-11-27): one credit balance per brand, bought in one-time packs, spent
// automatically when a plan quota runs out (only if the owner keeps "Use credits when I run out"
// on, which turns on with their first purchase). Pure: no database (scripts/test-quotas.ts).
// lib/credits.ts stores the ledger (MockActivity "credit_ledger") and wires it into lib/quotas.ts.
//
// Rules:
//   - Plan quota first, credits only after it's used up.
//   - Each pack expires 12 months after purchase; spends take from the pack that expires first.
//   - The daily AI cost ceiling and the platform budget stay hard limits. Credits spent today raise
//     that brand's daily (and monthly) AI ceiling by $1 per 10 credits; never the platform budget.
//   - A refund removes what is left of that pack (part of it for a partial refund).
import type { QuotaKind } from "@/lib/quota-rules"

export type CreditPack = { credits: number; usd: number; local: { eur: number; gbp: number; aed: number } }
/** Packs (one-time Stripe payments). Local amounts mirror the plan prices' ratios (prices.ts). */
export const CREDIT_PACKS: CreditPack[] = [
  { credits: 50, usd: 25, local: { eur: 25, gbp: 20, aed: 95 } },
  { credits: 120, usd: 50, local: { eur: 49, gbp: 40, aed: 185 } },
  { credits: 300, usd: 100, local: { eur: 99, gbp: 79, aed: 369 } },
]
export const packFor = (credits: number) => CREDIT_PACKS.find((p) => p.credits === credits) ?? null
export const CREDIT_EXPIRY_MONTHS = 12
/** AI ceiling raise: +$1 a day per this many credits spent that day. */
export const CREDITS_PER_AI_DOLLAR = 10

/**
 * Credits per unit of each quota kind once the plan's quota is used up. The first 12 are Varun's
 * numbers; the rest are ours (marked). A kind missing here can't be extended with credits.
 * QUOTAS_JSON {"credits": {"content_piece:blog": 4}} overrides.
 */
export const BASE_CREDIT_COSTS: Partial<Record<QuotaKind, number>> = {
  "content_piece:blog": 5,
  "content_piece:social": 1,
  "content_piece:gbp": 1,
  "content_piece:email": 3,
  "content_piece:review": 0.5,
  ad_plan: 10,
  week_run: 8,
  topic_plan: 2,
  image_gen: 1,
  sandbox_question: 0.2,
  engine_check: 0.1,
  search: 0.2,
  scan: 2,
  // Ours, so every "I've run out" can offer "Buy more":
  "content_piece:draft": 1,
  "publish:social": 0.5,
  "publish:gbp": 0.5,
  "publish:site": 1,
  email_send: 0.01, // per recipient: a 2,000-person send = 20 credits
  ad_change: 0.5,
  apify_usd: 4, // per $1 of scraping
  ai_cost_usd: CREDITS_PER_AI_DOLLAR, // per $1 of extra AI headroom today
}

export function creditCost(kind: QuotaKind, raw = process.env.QUOTAS_JSON): number | null {
  let o: unknown = null
  try {
    o = (JSON.parse(raw || "{}") as { credits?: Record<string, unknown> }).credits?.[kind]
  } catch {
    o = null
  }
  if (typeof o === "number" && Number.isFinite(o) && o >= 0) return o
  return BASE_CREDIT_COSTS[kind] ?? null
}

// ── Ledger ─────────────────────────────────────────────────────────────────

export type LedgerEntry =
  | { t: "purchase"; credits: number; at: string; expiresAt: string; sessionId: string; paymentIntent?: string | null; amount?: number; currency?: string }
  /** credits < 0 gives a spend back (the work failed). */
  | { t: "spend"; credits: number; at: string; action: string; n?: number }
  | { t: "refund"; credits: number; at: string; sessionId: string; chargeId: string; amountRefunded: number }

export type Lot = { sessionId: string; bought: number; left: number; at: string; expiresAt: string; refunded: number }

export function expiryFor(at: Date): Date {
  const d = new Date(at)
  d.setUTCMonth(d.getUTCMonth() + CREDIT_EXPIRY_MONTHS)
  return d
}

const r2 = (x: number) => Math.round(x * 1e6) / 1e6

/** Replays the ledger in time order: lots left after spends (soonest-expiring first), refunds and expiry. */
export function replay(entries: LedgerEntry[], now = new Date()): { balance: number; lots: Lot[]; spentToday: number; spentMonth: number; expired: number } {
  const sorted = [...entries].sort((a, b) => a.at.localeCompare(b.at))
  const lots: Lot[] = []
  const taken: { lot: Lot; n: number }[] = [] // consumption history, for give-backs
  const today = now.toISOString().slice(0, 10)
  const month = today.slice(0, 7)
  let spentToday = 0
  let spentMonth = 0
  for (const e of sorted) {
    const at = new Date(e.at)
    if (e.t === "purchase") {
      if (lots.some((l) => l.sessionId === e.sessionId)) continue // idempotent
      lots.push({ sessionId: e.sessionId, bought: e.credits, left: e.credits, at: e.at, expiresAt: e.expiresAt, refunded: 0 })
      continue
    }
    if (e.t === "refund") {
      const lot = lots.find((l) => l.sessionId === e.sessionId)
      if (!lot) continue
      const n = Math.min(lot.left, e.credits)
      lot.left = r2(lot.left - n)
      lot.refunded = r2(lot.refunded + n)
      continue
    }
    // spend
    if (e.at.slice(0, 10) === today) spentToday += e.credits
    if (e.at.slice(0, 7) === month) spentMonth += e.credits
    if (e.credits >= 0) {
      let need = e.credits
      const live = lots.filter((l) => l.left > 0 && new Date(l.expiresAt) > at).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
      for (const l of live) {
        if (need <= 0) break
        const n = Math.min(l.left, need)
        l.left = r2(l.left - n)
        need = r2(need - n)
        taken.push({ lot: l, n })
      }
    } else {
      // A give-back returns to the packs it came from, newest consumption first.
      let back = -e.credits
      for (let i = taken.length - 1; i >= 0 && back > 0; i--) {
        const t = taken[i]
        const n = Math.min(t.n, back)
        t.lot.left = r2(t.lot.left + n)
        t.n = r2(t.n - n)
        back = r2(back - n)
        if (t.n <= 0) taken.splice(i, 1)
      }
    }
  }
  let balance = 0
  let expired = 0
  for (const l of lots) {
    if (new Date(l.expiresAt) <= now) expired = r2(expired + l.left)
    else balance = r2(balance + l.left)
  }
  return { balance, lots, spentToday: r2(spentToday), spentMonth: r2(spentMonth), expired }
}

/** The purchase entry for a paid Checkout Session, or null if that session was already credited. */
export function grantEntry(entries: LedgerEntry[], p: { sessionId: string; credits: number; paymentIntent?: string | null; amount?: number; currency?: string; at?: Date }): LedgerEntry | null {
  if (entries.some((e) => e.t === "purchase" && e.sessionId === p.sessionId)) return null
  if (!(p.credits > 0)) return null
  const at = p.at ?? new Date()
  return { t: "purchase", credits: p.credits, at: at.toISOString(), expiresAt: expiryFor(at).toISOString(), sessionId: p.sessionId, paymentIntent: p.paymentIntent ?? null, amount: p.amount, currency: p.currency }
}

/**
 * The refund entry for a charge (charge.refunded fires again on each partial refund, with the
 * running total). Removes the pack's unspent credits in proportion to the money refunded (all of
 * what's left on a full refund). Null when nothing changes (already handled / nothing left).
 */
export function refundEntry(entries: LedgerEntry[], p: { paymentIntent: string; chargeId: string; amount: number; amountRefunded: number; at?: Date }): LedgerEntry | null {
  const purchase = entries.find((e): e is Extract<LedgerEntry, { t: "purchase" }> => e.t === "purchase" && !!e.paymentIntent && e.paymentIntent === p.paymentIntent)
  if (!purchase || !(p.amount > 0)) return null
  if (entries.some((e) => e.t === "refund" && e.chargeId === p.chargeId && e.amountRefunded >= p.amountRefunded)) return null
  const at = p.at ?? new Date()
  const { lots } = replay(entries, at)
  const lot = lots.find((l) => l.sessionId === purchase.sessionId)
  if (!lot || lot.left <= 0) return null
  const full = p.amountRefunded >= p.amount
  const target = full ? Infinity : r2(purchase.credits * (p.amountRefunded / p.amount))
  const n = Math.min(lot.left, r2(target - lot.refunded))
  if (!(n > 0)) return null
  return { t: "refund", credits: n, at: at.toISOString(), sessionId: purchase.sessionId, chargeId: p.chargeId, amountRefunded: p.amountRefunded }
}

/** Extra daily AI headroom from credits spent today: +$1 per 10 credits. */
export const aiHeadroom = (creditsSpent: number) => Math.max(0, creditsSpent) / CREDITS_PER_AI_DOLLAR

export function buyLine(cost: number | null): string {
  return cost === null ? "" : " Buy more credits to keep going now."
}
