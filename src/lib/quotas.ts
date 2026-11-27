// Plan quotas, wired to the usage ledger (lib/usage.ts usage_day rows + in-memory counts).
//   checkQuota(user, kind)      → allowed / remaining, and records the use when allowed
//   requireQuota(user, kind)    → the same, throws QuotaError (first-person message) when not
//   quotaHere(kind)             → for library code that only knows the brand from the request context
//   countUsage(userId, kind, p) → re-exported from lib/usage.ts
//   cronAllowed(name)           → false while the platform is over AI_DAILY_BUDGET_USD (non-essential crons)
// The numbers and the decision logic live in lib/quota-rules.ts (QUOTAS_JSON overrides them).
// Comped / founder accounts are counted but never blocked.
import { db } from "@/lib/db"
import { isComped } from "@/lib/billing"
import { currentBrandId, tallyUsage, usedSince, platformSpendToday, aiDailyBudget, countUsage, flush, ownerRequest } from "@/lib/usage"
import { creditCost } from "@/lib/credit-rules"
import { createLimiter, createPublicCounter, isQuotaError, limitsFor, QuotaError, type Decision, type Limits, type QuotaKind, type Subject } from "@/lib/quota-rules"

export { countUsage, isQuotaError, QuotaError }
export type { QuotaKind, Decision }

// Credits spent per (brand, kind) in the last minutes, so refundQuota can give them back when the work fails.
const recentSpends = new Map<string, { credits: number; at: number }[]>()
const limiter = createLimiter(
  {
    used: (userId, kind, since) => usedSince(userId, kind, since),
    add: (userId, kind, n) => tallyUsage(userId, kind, n),
  },
  {
    async state(userId, now) {
      const { creditState } = await import("@/lib/credits")
      const st = await creditState(userId, now)
      return { balance: st.balance, autoUse: st.autoUse }
    },
    async spend(userId, credits, kind, n) {
      const { spendCredits } = await import("@/lib/credits")
      await spendCredits(userId, credits, kind, n)
      const k = `${userId}|${kind}`
      const list = (recentSpends.get(k) ?? []).filter((x) => Date.now() - x.at < 15 * 60_000)
      list.push({ credits, at: Date.now() })
      recentSpends.set(k, list)
    },
  },
  (kind) => creditCost(kind),
)

type U = { id: string; plan: string; email?: string | null }
const subjects = new Map<string, { s: Subject; at: number }>()

async function subjectOf(user: U | string): Promise<Subject | null> {
  const id = typeof user === "string" ? user : user.id
  const hit = subjects.get(id)
  if (typeof user !== "string") {
    const comped = isComped(user.email)
    // Comped / founder accounts are measured against Growth's numbers (and never blocked).
    const s: Subject = { userId: user.id, plan: comped ? "growth" : user.plan, comped }
    subjects.set(id, { s, at: Date.now() })
    return s
  }
  if (hit && Date.now() - hit.at < 60_000) return hit.s
  const u = await db.user.findUnique({ where: { id }, select: { id: true, plan: true, email: true } })
  if (!u) return null
  const comped = isComped(u.email)
  const s: Subject = { userId: u.id, plan: comped ? "growth" : u.plan, comped }
  subjects.set(id, { s, at: Date.now() })
  return s
}

async function limitsOf(s: Subject, kind: QuotaKind): Promise<Limits> {
  const base = limitsFor(s.plan, kind)
  if (kind !== "ad_change" || !/growth/i.test(s.plan)) return base
  // Growth: ad changes scale with the ad accounts in the allowance.
  const { getAgentSettings } = await import("@/lib/agent/settings")
  const accounts = 1 + Math.max(0, (await getAgentSettings(s.userId)).billing?.extraAdAccounts ?? 0)
  const out: Limits = {}
  for (const [p, v] of Object.entries(base)) out[p as keyof Limits] = (v as number) * accounts
  return out
}

/**
 * Is there room for `n` more of `kind` for this brand? Records the use when allowed (pass
 * `record: false` to only look). A user row is preferred (no lookup); an id works too.
 */
export async function checkQuota(user: U | string, kind: QuotaKind, opts: { n?: number; record?: boolean; credits?: boolean } = {}): Promise<Decision> {
  const s = await subjectOf(user)
  if (!s) return { allowed: true, kind, period: null, limit: null, used: 0, remaining: null }
  // Credits pay for work past the plan quota only when the owner asked for it: their own request
  // (auth()/currentUser() context), or `credits: true` from a path the owner started. Crons and
  // background work never spend credits (`credits: false` forces that).
  const useCredits = opts.credits ?? ownerRequest()
  try {
    return await limiter.check(s, kind, { n: opts.n, record: opts.record, useCredits, limits: await limitsOf(s, kind) })
  } catch (err) {
    // Never fail work because the ledger couldn't be read; log it loudly instead.
    console.error("[quotas] check failed, allowing", kind, err instanceof Error ? err.message : err)
    return { allowed: true, kind, period: null, limit: null, used: 0, remaining: null }
  }
}

/** checkQuota, throwing a QuotaError (first-person message for the owner) when there's no room. */
export async function requireQuota(user: U | string, kind: QuotaKind, n = 1, credits?: boolean): Promise<Decision> {
  const d = await checkQuota(user, kind, { n, credits })
  if (!d.allowed) throw new QuotaError(d)
  return d
}

/** Give back a use recorded by checkQuota when the work itself failed (and the credits it cost, if any). */
export function refundQuota(userId: string, kind: QuotaKind, n = 1): void {
  tallyUsage(userId, kind, -n)
  const k = `${userId}|${kind}`
  const last = (recentSpends.get(k) ?? []).filter((x) => Date.now() - x.at < 15 * 60_000).pop()
  if (!last) return
  recentSpends.set(k, (recentSpends.get(k) ?? []).filter((x) => x !== last))
  void import("@/lib/credits").then((c) => c.spendCredits(userId, -last.credits, kind, -n)).catch((e) => console.error("[quotas] credit give-back", e instanceof Error ? e.message : e))
}

/**
 * For library code (writers, image makers, Apify runs) that only knows the brand from the
 * request/cron context (auth(), currentUser(), asUser()). No brand (public pages) = allowed here;
 * public endpoints have their own per-IP caps (publicHit).
 */
export async function quotaHere(kind: QuotaKind, n = 1): Promise<Decision & { userId: string | null }> {
  const userId = await currentBrandId()
  if (!userId) return { allowed: true, kind, period: null, limit: null, used: 0, remaining: null, userId: null }
  return { ...(await checkQuota(userId, kind, { n })), userId }
}
export async function requireQuotaHere(kind: QuotaKind, n = 1): Promise<string | null> {
  const d = await quotaHere(kind, n)
  if (!d.allowed) throw new QuotaError(d)
  return d.userId
}

/** Run `fn` inside one quota use; the use is given back when `fn` throws. */
export async function withQuota<T>(user: U | string, kind: QuotaKind, fn: () => Promise<T>, n = 1): Promise<T> {
  await requireQuota(user, kind, n)
  try {
    return await fn()
  } catch (err) {
    refundQuota(typeof user === "string" ? user : user.id, kind, n)
    throw err
  }
}

/** withQuota for library code that only knows the brand from the request/cron context. */
export async function withQuotaHere<T>(kind: QuotaKind, fn: () => Promise<T>, n = 1): Promise<T> {
  const userId = await requireQuotaHere(kind, n)
  try {
    return await fn()
  } catch (err) {
    if (userId) refundQuota(userId, kind, n)
    throw err
  }
}

/** JSON body + status for a route that hit a quota: { error, quota: true }, 429. */
export function quotaBody(e: QuotaError | Decision): [{ error: string; quota: true; kind: string; period: string | null; buy: boolean }, { status: number }] {
  const d = e instanceof QuotaError ? e.decision : e
  // buy: the dashboard shows a "Buy more" button with the credit packs (components/workspace/CreditsSheet).
  return [{ error: d.message ?? "I've done all the work your plan covers for now.", quota: true, kind: d.kind, period: d.period, buy: !!d.buy || creditCost(d.kind) !== null }, { status: 429 }]
}

// ── Platform budget: crons ───────────────────────────────────────────────────

/** Crons that only finish or send work already made (or use no AI). They run whatever the budget. */
const ESSENTIAL_CRONS = new Set(["social-publish", "site-posts", "email-campaigns", "social-stats", "seo-sync", "tracking-health", "lifecycle", "guarantee", "meta-ads", "monthly-recap", "weekly", "usage-alert"])

/** False (and logged) when a non-essential cron should skip because the platform passed AI_DAILY_BUDGET_USD. */
export async function cronAllowed(name: string): Promise<boolean> {
  if (ESSENTIAL_CRONS.has(name)) return true
  await flush().catch(() => undefined)
  const spent = await platformSpendToday()
  const budget = aiDailyBudget()
  if (spent < budget) return true
  console.warn(`[quotas] platform AI spend today $${spent.toFixed(2)} >= AI_DAILY_BUDGET_USD $${budget}: skipping cron ${name}`)
  return false
}

// ── Public endpoints (no login) ─────────────────────────────────────────────

const publicCounter = createPublicCounter()
export function ipOf(req: Request): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim().slice(0, 64)
}
/**
 * Per-IP and global daily caps for the free scan and its helpers (lib/quota-rules BASE_PUBLIC,
 * QUOTAS_JSON "public"). Signed-in people skip the per-IP cap (offices share an IP; the founder tests).
 */
export async function publicHit(name: "scan" | "identify" | "quickfix" | "teaser" | "snapshot", req: Request): Promise<{ ok: true } | { ok: false; error: string }> {
  let signedIn = false
  try {
    const { realAuth } = await import("@/lib/auth")
    signedIn = !!(await realAuth()).userId
  } catch {
    signedIn = false
  }
  const r = publicCounter.hit(name, signedIn ? "unknown" : ipOf(req))
  if (r.ok) return { ok: true }
  if (name === "scan") console.warn(`[quotas] public scan cap hit (${r.reason})`)
  return {
    ok: false,
    error: r.reason === "ip"
      ? "You've run a lot of free checks today. Come back tomorrow, or sign up and I'll keep checking for you every week."
      : "I'm checking a lot of businesses today. Try again tomorrow, or email hi@alphaa.app and I'll run yours by hand.",
  }
}

// ── Owner view: "This month" (Your rules) ───────────────────────────────────

export type UsageLine = { label: string; used: number; included: number | null; per: "this month" | "this week" | "today" }

/** What the owner's plan included and what was used: real ledger counts only, no money. */
export async function ownerUsage(user: U): Promise<{ lines: UsageLine[]; since: string }> {
  const pro = /pro|full|growth/i.test(user.plan) || isComped(user.email)
  const plan = isComped(user.email) ? "growth" : user.plan
  const rows: [QuotaKind | QuotaKind[], string, "month" | "week" | "day", boolean][] = [
    ["content_piece:blog", "Blog posts written", "month", true],
    ["content_piece:social", "Social posts written", "month", pro],
    ["content_piece:gbp", "Google posts written", "month", pro],
    [["publish:social", "publish:gbp", "publish:site"], "Posts published", "month", true],
    ["engine_check", "AI checks run", "month", true],
    ["search", "Web searches", "month", true],
    ["sandbox_question", "Live questions asked", "day", true],
    ["email_send", "Emails sent to your customers", "month", pro],
  ]
  const lines: UsageLine[] = []
  for (const [kinds, label, period, show] of rows) {
    if (!show) continue
    const list = Array.isArray(kinds) ? kinds : [kinds]
    let used = 0
    for (const k of list) used += await countUsage(user.id, k, period)
    // A total is "included" only when every part has a limit for that period.
    const lims = list.map((k) => limitsFor(plan, k)[period])
    const included = lims.every((l) => typeof l === "number") ? (lims as number[]).reduce((a, b) => a + b, 0) : null
    lines.push({ label, used: Math.round(used), included, per: period === "day" ? "today" : period === "week" ? "this week" : "this month" })
  }
  return { lines, since: "2026-11-27" }
}
