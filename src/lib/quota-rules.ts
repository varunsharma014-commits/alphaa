// Plan quotas: how much work each plan includes per day / week / month, and the pure logic that
// decides whether one more piece of work is allowed. No database here (scripts/test-quotas.ts
// tests it with an in-memory store); lib/quotas.ts wires it to the usage ledger (lib/usage.ts).
//
// Numbers come from what each plan promises on /pricing (lib/plan-features.ts) plus a margin
// for regenerations and the owner's own extras. Quotas protect COST; plan gates (lib/billing.ts
// hasPro / hasGrowth) decide which FEATURES a plan has, so a kind outside a plan still gets a
// small number here rather than 0 (the feature gate says no first).
//
// Override any number without a deploy: QUOTAS_JSON on Railway, e.g.
//   {"pro":{"content_piece:blog":{"month":12}},"*":{"sandbox_question":{"day":80}},"public":{"scan_ip_day":10}}
// "*" applies to every plan. A field set to null removes that period's limit.
// Comped / founder accounts are tracked against Growth's numbers but never blocked (logged).

export const QUOTA_KINDS = [
  "ai_cost_usd", // Anthropic tokens × list price + web searches (lib/ai-prices.ts), metered per call
  "search", // web searches: Claude's web_search tool (auto-counted) + Apify Google results pages
  "apify_usd", // Apify actor runs, counted at each run's charge cap
  "image_gen", // OpenAI-made pictures (AI image style, blog images)
  "scan", // full visibility scans of a brand (dashboard + the weekly re-scan)
  "engine_check", // one question put to one AI engine (ChatGPT / Gemini / Perplexity / Claude check)
  "sandbox_question", // live questions in the AI sandbox / chat
  "content_piece:blog",
  "content_piece:gbp",
  "content_piece:social",
  "content_piece:email",
  "content_piece:review", // review replies written
  "content_piece:draft", // everything else written on request (meta, location pages, chat drafts)
  "publish:social", // one social post going out (any number of its platforms)
  "publish:gbp",
  "publish:site", // a post published to the owner's website
  "email_send", // recipients of the owner's email campaigns
  "ad_plan",
  "ad_change", // writes to Google Ads / Meta ads accounts
  "week_run",
] as const
export type QuotaKind = (typeof QUOTA_KINDS)[number]
export type Period = "day" | "week" | "month"
export const PERIODS: Period[] = ["day", "week", "month"]
export type Limits = Partial<Record<Period, number>>
export type PlanKey = "none" | "starter" | "pro" | "growth"
type Table = Record<PlanKey, Record<QuotaKind, Limits>>

// Base table. Reasoning per row in CLAUDE.md "Usage + quotas".
const STARTER: Record<QuotaKind, Limits> = {
  ai_cost_usd: { day: 1, month: 10 },
  search: { day: 20, month: 120 },
  apify_usd: { day: 0.5, month: 1 },
  image_gen: { day: 3, month: 8 },
  scan: { day: 3, month: 15 },
  engine_check: { day: 150, month: 1000 },
  sandbox_question: { day: 20 },
  "content_piece:blog": { month: 4 }, // 2 a month promised + 2 regenerations
  "content_piece:gbp": { week: 2, month: 4 }, // not in Starter (Pro feature); small cap only
  "content_piece:social": { week: 2, month: 4 }, // not in Starter
  "content_piece:email": { month: 2 }, // not in Starter
  "content_piece:review": { day: 3, month: 10 }, // not in Starter
  "content_piece:draft": { day: 10, month: 30 },
  "publish:social": { day: 1, month: 4 },
  "publish:gbp": { day: 1, month: 4 },
  "publish:site": { day: 2, month: 4 },
  email_send: { day: 0, month: 0 }, // email is Pro and up
  ad_plan: { month: 1 },
  ad_change: { day: 5 },
  week_run: { week: 2, month: 6 },
}
const PRO: Record<QuotaKind, Limits> = {
  ai_cost_usd: { day: 4, month: 40 },
  search: { day: 60, month: 400 },
  apify_usd: { day: 2, month: 8 },
  image_gen: { day: 6, month: 40 },
  scan: { day: 5, month: 30 },
  engine_check: { day: 320, month: 2500 },
  sandbox_question: { day: 50 },
  "content_piece:blog": { month: 8 }, // 4 a month + 4 regenerations
  "content_piece:gbp": { week: 6, month: 26 }, // 4 a week + 2 regenerations
  "content_piece:social": { week: 10, month: 30 }, // 3 a week + drafts/regenerations
  "content_piece:email": { month: 8 }, // 1 send per 7 days + regenerations
  "content_piece:review": { day: 10, month: 150 }, // review-drafts cron writes up to 5 a night
  "content_piece:draft": { day: 30, month: 100 },
  "publish:social": { day: 3, week: 7 }, // 3 a week written; the owner's own extras on top
  "publish:gbp": { day: 2, week: 6 }, // 4 a week + 2
  "publish:site": { day: 3, month: 10 },
  email_send: { day: 2000, month: 10000 }, // list cap 2,000, one send per 7 days
  ad_plan: { month: 2 },
  ad_change: { day: 10 },
  week_run: { week: 3, month: 12 },
}
const GROWTH: Record<QuotaKind, Limits> = {
  ...PRO,
  ai_cost_usd: { day: 8, month: 80 },
  search: { day: 100, month: 600 },
  apify_usd: { day: 3, month: 15 },
  image_gen: { day: 8, month: 60 },
  ad_plan: { month: 4 },
  ad_change: { day: 30 }, // per ad account in the allowance (quotas.ts multiplies)
}
const NONE: Record<QuotaKind, Limits> = {
  // No plan: the first 14 days after signup (crons still work for them) and anyone who cancelled.
  ...STARTER,
  ai_cost_usd: { day: 0.5, month: 3 },
  search: { day: 10, month: 40 },
  apify_usd: { day: 0.25, month: 0.5 },
  image_gen: { day: 1, month: 2 },
  scan: { day: 2, month: 4 },
  engine_check: { day: 60, month: 200 },
  sandbox_question: { day: 5 },
  "content_piece:blog": { month: 3 },
  "content_piece:draft": { day: 5, month: 10 },
  "publish:site": { day: 1, month: 3 },
  week_run: { week: 1, month: 2 },
}
export const BASE_QUOTAS: Table = { none: NONE, starter: STARTER, pro: PRO, growth: GROWTH }

/** Public (no login) endpoints: per visitor IP and across everyone, per UTC day. */
export const BASE_PUBLIC = {
  scan_ip_day: 5, // POST /api/scan (full free scan: Claude + 4 engines + SERP)
  scan_global_day: 300,
  identify_ip_day: 30, // POST /api/scan/identify (one Haiku/Sonnet call)
  identify_global_day: 1500,
  quickfix_ip_day: 10, // POST /api/scan/quick-fix
  quickfix_global_day: 500,
}
export type PublicKey = keyof typeof BASE_PUBLIC

export function planKey(plan: string | null | undefined): PlanKey {
  const p = (plan ?? "").toLowerCase()
  if (/growth/.test(p)) return "growth"
  if (/pro|full/.test(p)) return "pro"
  if (/starter/.test(p)) return "starter"
  return "none"
}

type Override = Partial<Record<PlanKey | "*", Partial<Record<QuotaKind, Partial<Record<Period, number | null>>>>>> & { public?: Partial<Record<PublicKey, number>> }
let parsed: { raw: string | undefined; o: Override } | null = null
function overrides(raw = process.env.QUOTAS_JSON): Override {
  if (parsed && parsed.raw === raw) return parsed.o
  let o: Override = {}
  try {
    const j = JSON.parse(raw || "{}")
    o = j && typeof j === "object" && !Array.isArray(j) ? (j as Override) : {}
  } catch {
    console.error("[quotas] QUOTAS_JSON is not valid JSON; using the built-in numbers")
    o = {}
  }
  parsed = { raw, o }
  return o
}

/** The limits for one plan and kind, after QUOTAS_JSON ("*" first, then the plan). */
export function limitsFor(plan: string | null | undefined, kind: QuotaKind, raw?: string): Limits {
  const key = planKey(plan)
  const out: Limits = { ...BASE_QUOTAS[key][kind] }
  const o = overrides(raw)
  for (const layer of [o["*"]?.[kind], o[key]?.[kind]]) {
    if (!layer || typeof layer !== "object") continue
    for (const p of PERIODS) {
      if (!(p in layer)) continue
      const v = layer[p]
      if (v === null) delete out[p]
      else if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[p] = v
    }
  }
  return out
}

export function publicLimit(k: PublicKey, raw?: string): number {
  const v = overrides(raw).public?.[k]
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : BASE_PUBLIC[k]
}

/** Start of the period that contains `now` (UTC): today, this Monday, the 1st of this month. */
export function periodStart(period: Period, now = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (period === "week") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  if (period === "month") d.setUTCDate(1)
  return d
}
export const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export type Subject = { userId: string; plan: string; comped?: boolean; /** Growth ad accounts included (ad_change scales with it). */ adAccounts?: number }
export type Decision = {
  allowed: boolean
  kind: QuotaKind
  /** The period that ran out (or is closest to), and its numbers. */
  period: Period | null
  limit: number | null
  used: number
  remaining: number | null
  /** True when over the limit but let through (comped / founder accounts). */
  bypassed?: boolean
  /** First-person words for the owner when not allowed. */
  message?: string
  /** Credits spent to let this through after the plan quota ran out (lib/credit-rules.ts). */
  credits?: number
  /** Only looking (record: false): allowed because credits would cover it. */
  wouldUseCredits?: boolean
  /** Not allowed, but credits can extend it: what it would cost and what the brand has. Shows "Buy more". */
  buy?: { need: number; balance: number; autoUse: boolean }
}

/** Thrown when a brand is out of a quota. `message` is first-person, safe to show the owner. */
export class QuotaError extends Error {
  readonly quota = true
  constructor(readonly decision: Decision) {
    super(decision.message ?? "I've done all the work your plan covers for now.")
    this.name = "QuotaError"
  }
}
export const isQuotaError = (e: unknown): e is QuotaError => e instanceof Error && (e as { quota?: unknown }).quota === true

/** Pure decision: `used` per period vs the limits, for `n` more. */
export function decide(kind: QuotaKind, limits: Limits, used: Partial<Record<Period, number>>, n: number, s: Pick<Subject, "plan" | "comped">, now = new Date()): Decision {
  let worst: { period: Period; limit: number; used: number; left: number } | null = null
  let blocked: { period: Period; limit: number; used: number } | null = null
  for (const p of PERIODS) {
    const limit = limits[p]
    if (limit === undefined) continue
    const u = used[p] ?? 0
    const left = limit - u
    if (!worst || left < worst.left) worst = { period: p, limit, used: u, left }
    if (u + n > limit + 1e-9 && !blocked) blocked = { period: p, limit, used: u }
  }
  const remaining = worst ? Math.max(0, worst.left - (blocked ? 0 : n)) : null
  if (!blocked) return { allowed: true, kind, period: worst?.period ?? null, limit: worst?.limit ?? null, used: worst?.used ?? 0, remaining }
  const base = { kind, period: blocked.period, limit: blocked.limit, used: blocked.used, remaining: Math.max(0, blocked.limit - blocked.used) }
  if (s.comped) return { ...base, allowed: true, bypassed: true }
  return { ...base, allowed: false, message: quotaMessage(kind, blocked.period, blocked.limit, s.plan, now) }
}

const NOUN: Record<QuotaKind, [string, string]> = {
  ai_cost_usd: ["", ""],
  search: ["web search", "web searches"],
  apify_usd: ["", ""],
  image_gen: ["picture", "pictures"],
  scan: ["full AI check", "full AI checks"],
  engine_check: ["AI check", "AI checks"],
  sandbox_question: ["live question", "live questions"],
  "content_piece:blog": ["blog post", "blog posts"],
  "content_piece:gbp": ["Google post", "Google posts"],
  "content_piece:social": ["social post", "social posts"],
  "content_piece:email": ["customer email", "customer emails"],
  "content_piece:review": ["review reply", "review replies"],
  "content_piece:draft": ["draft", "drafts"],
  "publish:social": ["social post", "social posts"],
  "publish:gbp": ["Google post", "Google posts"],
  "publish:site": ["website post", "website posts"],
  email_send: ["email", "emails"],
  ad_plan: ["ad plan", "ad plans"],
  ad_change: ["ad change", "ad changes"],
  week_run: ["weekly plan", "weekly plans"],
}

function reopens(period: Period, now: Date): string {
  if (period === "day") return "tomorrow"
  if (period === "week") return "on Monday"
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return `on ${next.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}`
}
const PERIOD_WORD: Record<Period, string> = { day: "today", week: "this week", month: "this month" }

/** The next plan up has more of this kind, so suggesting an upgrade is honest. */
function upgradeHint(kind: QuotaKind, period: Period, plan: string): string {
  const order: PlanKey[] = ["none", "starter", "pro", "growth"]
  const at = order.indexOf(planKey(plan))
  const mine = limitsFor(plan, kind)[period] ?? Infinity
  for (const next of order.slice(at + 1)) {
    if ((limitsFor(next, kind)[period] ?? Infinity) > mine) return next === "starter" ? ", or pick a plan to get more" : `, or move to ${next === "pro" ? "Pro" : "Growth"} for more`
  }
  return ""
}

/** "I've written your 6 Google posts for this week. More opens on Monday, or move to Growth for more." */
export function quotaMessage(kind: QuotaKind, period: Period, limit: number, plan: string, now = new Date()): string {
  const when = reopens(period, now)
  const hint = upgradeHint(kind, period, plan)
  if (kind === "ai_cost_usd" || kind === "apify_usd") {
    return `I've done all the work your plan covers ${PERIOD_WORD[period]}, so I'm pausing new writing and research until ${when.replace(/^on /, "")}${hint}. Everything already made is safe.`
  }
  const [one, many] = NOUN[kind]
  const n = limit === 1 ? `1 ${one}` : `${limit.toLocaleString("en-US")} ${many}`
  if (limit === 0) return `Your plan doesn't include ${many} yet${hint || ". Email hi@alphaa.app if you need it"}.`
  const verb = kind.startsWith("publish:") || kind === "email_send" ? "sent out" : kind.startsWith("content_piece") || kind === "image_gen" ? "made" : kind === "ad_change" ? "made" : "run"
  return `I've ${verb} your ${n} for ${PERIOD_WORD[period]}. More opens ${when}${hint}.`
}

// ── The limiter: count + decide + record, one brand at a time ─────────────────

export type UsageStore = {
  /** Usage of `kind` for this brand since `since` (inclusive), including what was just recorded. */
  used(userId: string, kind: QuotaKind, since: Date): Promise<number>
  /** Record `n` more, synchronously visible to the next used() call. */
  add(userId: string, kind: QuotaKind, n: number): void
}

/** Where credits come from (lib/credits.ts in the app, an in-memory ledger in the tests). */
export type CreditProvider = {
  /** The brand's live balance and whether it lets credits be used when a quota runs out. */
  state(userId: string, now: Date): Promise<{ balance: number; autoUse: boolean }>
  /** Record a spend (inside the limiter's lock, so two requests can't spend the same credits). */
  spend(userId: string, credits: number, kind: QuotaKind, n: number): Promise<void>
}

/**
 * check(): counts every limited period, decides, and records the use when allowed, all inside a
 * per-brand lock, so a burst of parallel requests can't all slip past the last free slot. Over the
 * plan quota, credits (if a provider is given, the call allows them and the owner keeps auto-use
 * on) pay for it at creditCost(kind) per unit: plan quota first, then credits.
 */
export function createLimiter(store: UsageStore, credits?: CreditProvider, costOf: (k: QuotaKind) => number | null = () => null) {
  const locks = new Map<string, Promise<unknown>>()
  async function locked<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(key) ?? Promise.resolve()
    let release!: () => void
    const mine = new Promise<void>((r) => (release = r))
    const chain = prev.then(() => mine)
    locks.set(key, chain)
    await prev.catch(() => undefined)
    try {
      return await fn()
    } finally {
      release()
      if (locks.get(key) === chain) locks.delete(key)
    }
  }
  async function usedBy(s: Subject, kind: QuotaKind, limits: Limits, now: Date) {
    const used: Partial<Record<Period, number>> = {}
    for (const p of PERIODS) if (limits[p] !== undefined) used[p] = await store.used(s.userId, kind, periodStart(p, now))
    return used
  }
  return {
    async check(s: Subject, kind: QuotaKind, opts: { n?: number; record?: boolean; now?: Date; limits?: Limits; useCredits?: boolean } = {}): Promise<Decision> {
      const n = opts.n ?? 1
      const now = opts.now ?? new Date()
      const limits = opts.limits ?? limitsFor(s.plan, kind)
      return locked(s.userId, async () => {
        let d = decide(kind, limits, await usedBy(s, kind, limits, now), n, s, now)
        const cost = costOf(kind)
        if (!d.allowed && credits && cost !== null && cost > 0) {
          const need = Math.round(cost * n * 1e6) / 1e6
          const st = await credits.state(s.userId, now)
          if (opts.useCredits !== false && st.autoUse && st.balance + 1e-9 >= need) {
            if (opts.record === false) return { ...d, allowed: true, message: undefined, wouldUseCredits: true }
            await credits.spend(s.userId, need, kind, n)
            store.add(s.userId, kind, n)
            return { ...d, allowed: true, message: undefined, credits: need, remaining: 0 }
          }
          const why = st.balance + 1e-9 >= need && !st.autoUse
            ? ` You have ${fmtCredits(st.balance)} credits: turn on "Use credits when I run out" in Your rules and I'll use them.`
            : opts.useCredits === false ? "" : " Buy more credits to keep going now."
          d = { ...d, message: `${d.message ?? ""}${why}`, buy: { need, balance: st.balance, autoUse: st.autoUse } }
          return d
        }
        if (d.allowed && opts.record !== false) store.add(s.userId, kind, n)
        else if (d.allowed && d.remaining !== null) d.remaining += n // only looking: nothing was used
        if (d.bypassed) console.warn(`[quotas] comped account over ${kind} (${d.period} ${d.used}/${d.limit}), allowed`, s.userId)
        return d
      })
    },
    /** Usage vs limits without recording anything (dashboards). */
    async peek(s: Subject, kind: QuotaKind, now = new Date()) {
      const limits = limitsFor(s.plan, kind)
      const used = await usedBy(s, kind, limits, now)
      return { limits, used }
    },
  }
}

export const fmtCredits = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US")

/** A public-endpoint counter (per UTC day, in memory): per-IP and global caps. */
export function createPublicCounter() {
  let day = ""
  const counts = new Map<string, number>()
  return {
    hit(name: "scan" | "identify" | "quickfix", ip: string, now = new Date(), raw?: string): { ok: boolean; reason?: "ip" | "global" } {
      const k = dayKey(now)
      if (k !== day) { day = k; counts.clear() }
      const ipKey = `${name}|ip|${ip}`
      const gKey = `${name}|all`
      const ipCap = publicLimit(`${name}_ip_day` as PublicKey, raw)
      const gCap = publicLimit(`${name}_global_day` as PublicKey, raw)
      if ((counts.get(gKey) ?? 0) >= gCap) return { ok: false, reason: "global" }
      if (ip !== "unknown" && (counts.get(ipKey) ?? 0) >= ipCap) return { ok: false, reason: "ip" }
      counts.set(gKey, (counts.get(gKey) ?? 0) + 1)
      counts.set(ipKey, (counts.get(ipKey) ?? 0) + 1)
      return { ok: true }
    },
  }
}
