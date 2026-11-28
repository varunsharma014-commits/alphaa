// What we do for each brand, and what it costs us in AI.
// Every Anthropic call is metered at the client (lib/claude.ts installs the meter) and
// attributed to the brand being worked on: a request sets it in currentUser(), crons set it
// per account with asUser(). Counts are kept per brand per day in a MockActivity row
// ("usage_day"), flushed every 30 seconds so calls never wait on a database write.
// Calls with no brand (public scans from /start, cron work before a brand is chosen) are kept
// too, in a "usage_house" row on the founder account, so the totals match the Anthropic bill.
// Each call also records its feature (claudeFor("scan") in lib/claude.ts) and web searches.
//
// The same rows are the quota ledger (lib/quotas.ts): tallyUsage() adds a count ("content_piece:blog",
// "publish:social"…), countUsage() reads one back for a period (persisted rows + what is still in
// memory, so a burst sees its own uses at once), and every Claude call is costed as it lands so the
// per-brand daily AI ceiling and the platform budget (AI_DAILY_BUDGET_USD) can stop the next call.
import { AsyncLocalStorage } from "async_hooks"
import { usageCost, estimateCallCost, type Tok as PriceTok } from "@/lib/ai-prices"
import { limitsFor, periodStart, dayKey, QuotaError, quotaMessage, type QuotaKind, type Period } from "@/lib/quota-rules"
import { aiHeadroom, CREDITS_PER_AI_DOLLAR } from "@/lib/credit-rules"

// userId = the brand's User row id (exact). clerkId = set by auth() for any signed-in request,
// resolved to the brand at flush time, so routes that never call currentUser() still count.
// actor = who is signed in and their role on the open brand (lib/team), for the audit trail only
// (logActivity, draft versions). Permission checks never read it: they use getActor().
export type CtxActor = { clerkId: string; role: string; email?: string; name?: string | null; memberId?: string }
type Ctx = { userId?: string; clerkId?: string; actor?: CtxActor }
const als = new AsyncLocalStorage<Ctx>()
/** Who is acting in this request (set by auth()), or undefined in crons and public calls. */
export function ctxActor(): CtxActor | undefined {
  return als.getStore()?.actor
}
/** Which feature is calling Claude ("scan", "gbp-post", "week"…), set by claudeFor(). */
const featureAls = new AsyncLocalStorage<string>()
export function withFeature<T>(feature: string, fn: () => T): T {
  return featureAls.run(feature, fn)
}
/** Calls with no brand in context are kept under this key and stored as "usage_house". */
const HOUSE = "_house"

/** Attribute everything that follows in this async flow to this brand. */
export function asUser(userId: string): void {
  als.enterWith({ userId })
}
export function runAsUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return als.run({ userId }, fn)
}
/**
 * The usage context of this request, created if missing. Call it SYNCHRONOUSLY at the start of a
 * helper (before its first await) and fill in the brand later: a store entered after an await
 * inside a helper never reaches the caller, which is why auth()/currentUser() went uncounted.
 */
export function usageCtx(): Ctx {
  let s = als.getStore()
  if (!s) {
    s = {}
    als.enterWith(s)
  }
  return s
}

type Tok = { in: number; out: number; cacheRead: number; cacheWrite: number }
type Day = {
  calls: number
  tokens: Record<string, Tok> // by model
  counts: Record<string, number>
  features?: Record<string, { calls: number; searches: number; tokens: Record<string, Tok> }> // by feature, then model
  searches?: number // web searches (billed per search, on top of tokens)
}
const pending = new Map<string, Day>() // key: userId|YYYY-MM-DD
/** Batches taken by flush() and not yet written: still counted by countUsage(). */
const flushing = new Map<string, Day>()
const today = () => new Date().toISOString().slice(0, 10)
/** The ledger key for the current async flow: the brand, else "clerk:<id>" until resolved, else the house. */
function ctxKey(): string {
  const ctx = als.getStore()
  if (ctx?.userId) return ctx.userId
  if (ctx?.clerkId) return clerkToUser.get(ctx.clerkId) ?? `clerk:${ctx.clerkId}`
  return HOUSE
}
/** The brand this async flow works for (resolving a signed-in Clerk id), or null (public / house work). */
export async function currentBrandId(): Promise<string | null> {
  const ctx = als.getStore()
  if (ctx?.userId) return ctx.userId
  if (ctx?.clerkId) return userForClerk(ctx.clerkId)
  return null
}
function slot(userId: string): Day {
  const k = `${userId}|${today()}`
  let d = pending.get(k)
  if (!d) { d = { calls: 0, tokens: {}, counts: {} }; pending.set(k, d) }
  return d
}

/** Count something done for a brand (a post published, a week run, a quota use…). Negative n refunds. */
export function tallyUsage(userId: string, what: string, n = 1): void {
  const d = slot(userId)
  d.counts[what] = (d.counts[what] ?? 0) + n
  schedule()
}

const dayCost = (d: Pick<Day, "tokens" | "searches">) => usageCost(d.tokens as Record<string, PriceTok>, d.searches ?? 0)
/** One kind's amount in one day's row. */
function amountIn(d: Pick<Day, "tokens" | "searches" | "counts">, kind: QuotaKind | string): number {
  if (kind === "ai_cost_usd") return dayCost(d)
  if (kind === "search") return (d.searches ?? 0) + (d.counts?.search ?? 0) // Claude web searches + Apify SERP pages
  return d.counts?.[kind] ?? 0
}
/** The in-memory (not yet written) entries for a brand, dated `since` or later. */
function memEntries(userId: string, since: string): Day[] {
  const out: Day[] = []
  for (const m of [pending, flushing]) {
    for (const [k, d] of m) {
      const [who, date] = k.split("|")
      if (date < since) continue
      if (who === userId || (who.startsWith("clerk:") && clerkToUser.get(who.slice(6)) === userId)) out.push(d)
    }
  }
  return out
}

/**
 * How much of `kind` a brand used since `since` (a period start from quota-rules periodStart):
 * stored usage_day rows plus what is still in memory. ai_cost_usd is dollars, the rest are counts.
 */
export async function usedSince(userId: string, kind: QuotaKind | string, since: Date): Promise<number> {
  const from = dayKey(since)
  const { db } = await import("@/lib/db")
  const rows = await db.mockActivity.findMany({
    where: { userId, type: "usage_day", createdAt: { gte: new Date(since.getTime() - 86_400_000) } },
    select: { metadata: true },
  })
  let n = 0
  for (const r of rows) {
    const m = r.metadata as (Day & { date?: string }) | null
    if (m?.date && m.date >= from) n += amountIn(m, kind)
  }
  for (const d of memEntries(userId, from)) n += amountIn(d, kind)
  return n
}

/** countUsage(userId, "content_piece:blog", "month"): this period's usage (UTC day / Monday week / calendar month). */
export function countUsage(userId: string, kind: QuotaKind | string, period: Period, now = new Date()): Promise<number> {
  return usedSince(userId, kind, periodStart(period, now))
}

// ── AI cost ceilings ─────────────────────────────────────────────────────────
// Per brand: a daily and monthly dollar ceiling per plan (lib/quota-rules ai_cost_usd). Platform:
// AI_DAILY_BUDGET_USD (default 20) across everyone; crossing it pauses non-essential crons
// (lib/quotas.ts cronAllowed). Costs are added as each call lands; an estimate is held while a
// call is in flight so a burst can't overshoot.
type BrandCost = { day: string; month: string; dayBase: number; monthBase: number; running: number; plan: string; comped: boolean; loadedAt: number; warned?: string; /** Credits spent today / this month: +$1 of AI ceiling per 10 (lib/credit-rules aiHeadroom). */ creditsDay: number; creditsMonth: number }
const brandCost = new Map<string, BrandCost>()
const loadingCost = new Set<string>()
const reserved = new Map<string, number>()
let platform: { day: string; base: number; running: number; loadedAt: number } | null = null
let platformLoading = false
const RELOAD_MS = 10 * 60_000
const monthKey = () => today().slice(0, 7)

export const aiDailyBudget = () => {
  const v = Number(process.env.AI_DAILY_BUDGET_USD)
  return Number.isFinite(v) && v > 0 ? v : 20
}

function memCost(userId: string | null, date: string): number {
  let c = 0
  for (const m of [pending, flushing]) for (const [k, d] of m) {
    const [who, dt] = k.split("|")
    if (dt !== date) continue
    if (userId === null || who === userId || (who.startsWith("clerk:") && clerkToUser.get(who.slice(6)) === userId)) c += dayCost(d)
  }
  return c
}

async function loadBrandCost(userId: string): Promise<void> {
  if (loadingCost.has(userId)) return
  loadingCost.add(userId)
  try {
    const [{ db }, { isComped }] = await Promise.all([import("@/lib/db"), import("@/lib/billing")])
    const u = await db.user.findUnique({ where: { id: userId }, select: { plan: true, email: true } })
    if (!u) return
    const day = today()
    const month = monthKey()
    const rows = await db.mockActivity.findMany({
      where: { userId, type: "usage_day", createdAt: { gte: new Date(Date.parse(`${month}-01T00:00:00Z`) - 86_400_000) } },
      select: { metadata: true },
    })
    let dayBase = 0
    let monthBase = 0
    for (const r of rows) {
      const m = r.metadata as (Day & { date?: string }) | null
      if (!m?.date || !m.date.startsWith(month)) continue
      const c = dayCost(m)
      monthBase += c
      if (m.date === day) dayBase += c
    }
    // What's in memory now isn't in those rows yet; from here on new calls add to `running`.
    let memMonth = 0
    for (const m of [pending, flushing]) for (const [k, d] of m) {
      const [who, dt] = k.split("|")
      if (!dt.startsWith(month)) continue
      if (who === userId || (who.startsWith("clerk:") && clerkToUser.get(who.slice(6)) === userId)) memMonth += dayCost(d)
    }
    const prev = brandCost.get(userId)
    const spent = await import("@/lib/credits").then((c) => c.creditsSpent(userId)).catch(() => ({ day: 0, month: 0 }))
    brandCost.set(userId, { creditsDay: spent.day, creditsMonth: spent.month, day, month, dayBase: dayBase + memCost(userId, day), monthBase: monthBase + memMonth, running: 0, plan: isComped(u.email) ? "growth" : u.plan, comped: isComped(u.email), loadedAt: Date.now(), warned: prev?.warned })
  } catch (err) {
    console.error("[usage] cost load", err instanceof Error ? err.message : err)
  } finally {
    loadingCost.delete(userId)
  }
}

async function loadPlatform(): Promise<void> {
  if (platformLoading) return
  platformLoading = true
  try {
    const { db } = await import("@/lib/db")
    const day = today()
    const rows = await db.mockActivity.findMany({
      where: { type: { in: ["usage_day", "usage_house"] }, createdAt: { gte: new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000) } },
      select: { metadata: true },
    })
    let base = 0
    for (const r of rows) {
      const m = r.metadata as (Day & { date?: string }) | null
      if (m?.date === day) base += dayCost(m)
    }
    platform = { day, base: base + memCost(null, day), running: 0, loadedAt: Date.now() }
  } catch (err) {
    console.error("[usage] platform load", err instanceof Error ? err.message : err)
  } finally {
    platformLoading = false
  }
}

/** Today's AI spend across every brand and the house (dollars), loading it if needed. */
export async function platformSpendToday(): Promise<number> {
  if (!platform || platform.day !== today() || Date.now() - platform.loadedAt > RELOAD_MS) await loadPlatform()
  return platform && platform.day === today() ? platform.base + platform.running : 0
}

function addCost(key: string, c: number) {
  if (!c) return
  if (platform && platform.day === today()) platform.running += c
  const b = brandCost.get(key)
  if (b && b.day === today()) b.running += c
}

/** Sync check before a Claude call: a QuotaError when this brand is over its AI ceiling. */
function aiGate(key: string): QuotaError | null {
  if (key === HOUSE || key.startsWith("clerk:")) {
    if (key.startsWith("clerk:")) void userForClerk(key.slice(6)).then((id) => { if (id) void loadBrandCost(id) })
    return null
  }
  const b = brandCost.get(key)
  const day = today()
  if (!b || b.day !== day || b.month !== monthKey() || Date.now() - b.loadedAt > RELOAD_MS) void loadBrandCost(key)
  if (!b || b.day !== day) return null // first call of the day for this brand: allowed while its numbers load
  const base = limitsFor(b.plan, "ai_cost_usd")
  // Credits spent today raise this brand's AI ceiling ($1 per 10); the platform budget never moves.
  const limits = { day: base.day === undefined ? undefined : base.day + aiHeadroom(b.creditsDay), month: base.month === undefined ? undefined : base.month + aiHeadroom(b.creditsMonth) }
  const held = reserved.get(key) ?? 0
  const spentDay = b.dayBase + b.running + held
  const spentMonth = b.monthBase + b.running + held
  const over: Period | null = limits.day !== undefined && spentDay >= limits.day ? "day" : limits.month !== undefined && spentMonth >= limits.month ? "month" : null
  if (!over) return null
  if (b.comped) {
    if (b.warned !== day) { b.warned = day; console.warn(`[usage] comped brand ${key} is over its ${over} AI ceiling ($${(over === "day" ? spentDay : spentMonth).toFixed(2)}), allowed`) }
    return null
  }
  if (b.warned !== day) { b.warned = day; console.warn(`[usage] brand ${key} hit its ${over} AI ceiling ($${(over === "day" ? spentDay : spentMonth).toFixed(2)}); blocking AI calls`) }
  const limit = limits[over] ?? 0
  return new QuotaError({ allowed: false, kind: "ai_cost_usd", period: over, limit, used: over === "day" ? spentDay : spentMonth, remaining: 0, message: `${quotaMessage("ai_cost_usd", over, limit, b.plan)} Buy more credits to keep going now.`, buy: { need: CREDITS_PER_AI_DOLLAR, balance: 0, autoUse: false } })
}

/** A credit spend (or give-back) for this brand: moves its AI ceiling at once. */
export function noteCreditsSpent(userId: string, credits: number): void {
  const b = brandCost.get(userId)
  if (!b || b.day !== today()) return
  b.creditsDay += credits
  b.creditsMonth += credits
}

/** True inside a signed-in owner's own request (auth()/currentUser()); false in crons and background work. */
export function ownerRequest(): boolean {
  return !!als.getStore()?.clerkId
}

/** Today's and this month's AI spend for a brand, as the ceiling sees it (dashboards). */
export async function brandSpend(userId: string): Promise<{ day: number; month: number }> {
  return { day: await usedSince(userId, "ai_cost_usd", periodStart("day")), month: await usedSince(userId, "ai_cost_usd", periodStart("month")) }
}

type U = { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null; server_tool_use?: { web_search_requests?: number | null } | null }
const addTok = (t: Tok, u: U) => {
  t.in += u.input_tokens ?? 0
  t.out += u.output_tokens ?? 0
  t.cacheRead += u.cache_read_input_tokens ?? 0
  t.cacheWrite += u.cache_creation_input_tokens ?? 0
}
const emptyTok = (): Tok => ({ in: 0, out: 0, cacheRead: 0, cacheWrite: 0 })
function recordTokens(model: string, u: U | undefined, feature: string, key = ctxKey()) {
  if (!u) return
  const d = slot(key)
  const searches = u.server_tool_use?.web_search_requests ?? 0
  const one = emptyTok()
  addTok(one, u)
  addCost(key, usageCost({ [model]: one }, searches))
  d.calls++
  addTok((d.tokens[model] ??= emptyTok()), u)
  const f = ((d.features ??= {})[feature] ??= { calls: 0, searches: 0, tokens: {} })
  f.calls++
  f.searches += searches
  addTok((f.tokens[model] ??= emptyTok()), u)
  if (searches) d.searches = (d.searches ?? 0) + searches
  schedule()
}

const merge = (into: Record<string, Tok>, add: Record<string, Tok>) => {
  for (const [m, t] of Object.entries(add)) {
    const c = (into[m] ??= emptyTok())
    c.in += t.in; c.out += t.out; c.cacheRead += t.cacheRead; c.cacheWrite += t.cacheWrite
  }
}
const clerkToUser = new Map<string, string | null>()
async function userForClerk(clerkId: string): Promise<string | null> {
  if (clerkToUser.has(clerkId)) return clerkToUser.get(clerkId) ?? null
  const { db } = await import("@/lib/db")
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  clerkToUser.set(clerkId, u?.id ?? null)
  return u?.id ?? null
}
let houseUserId: string | null | undefined
async function houseOwner(): Promise<string | null> {
  if (houseUserId !== undefined) return houseUserId
  const [{ db }, { FOUNDER_EMAILS }] = await Promise.all([import("@/lib/db"), import("@/lib/billing")])
  const u = await db.user.findFirst({ where: { email: FOUNDER_EMAILS[0] }, select: { id: true } })
  houseUserId = u?.id ?? null
  return houseUserId
}

let timer: NodeJS.Timeout | null = null
function schedule() {
  if (!timer) timer = setTimeout(() => { timer = null; void flush() }, 30_000)
}

let flushRunning = false
export async function flush(): Promise<void> {
  if (!pending.size) return
  // One flush at a time: a batch stays in `flushing` (still counted) until its row is written.
  if (flushRunning) { schedule(); return }
  flushRunning = true
  const batch = Array.from(pending.entries())
  pending.clear()
  for (const [key, add] of batch) flushing.set(key, add)
  try {
    await writeBatch(batch)
  } finally {
    flushRunning = false
  }
}

async function writeBatch(batch: [string, Day][]): Promise<void> {
  const { db } = await import("@/lib/db")
  for (const [key, add] of batch) {
    const [rawUser, date] = key.split("|")
    try {
      const house = rawUser === HOUSE
      const userId = house ? await houseOwner() : rawUser.startsWith("clerk:") ? await userForClerk(rawUser.slice(6)) : rawUser
      if (!userId) continue
      const type = house ? "usage_house" : "usage_day"
      const row = await db.mockActivity.findFirst({ where: { userId, type, metadata: { path: ["date"], equals: date } } })
      const cur = (row?.metadata as (Day & { date: string }) | null) ?? { date, calls: 0, tokens: {}, counts: {} }
      cur.calls += add.calls
      merge(cur.tokens, add.tokens)
      for (const [k, n] of Object.entries(add.counts)) cur.counts[k] = (cur.counts[k] ?? 0) + n
      for (const [f, v] of Object.entries(add.features ?? {})) {
        const c = ((cur.features ??= {})[f] ??= { calls: 0, searches: 0, tokens: {} })
        c.calls += v.calls
        c.searches += v.searches
        merge(c.tokens, v.tokens)
      }
      if (add.searches) cur.searches = (cur.searches ?? 0) + add.searches
      if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: cur as object } })
      else await db.mockActivity.create({ data: { userId, type, title: `${house ? "Unattributed usage" : "Usage"} ${date}`, metadata: cur as object } })
    } catch (err) {
      console.error("[usage] flush", err instanceof Error ? err.message : err)
    } finally {
      flushing.delete(key)
    }
  }
}

/** Wraps client.messages.create (parse goes through it) to record token usage. */
export function installUsageMeter(client: { messages: { create: unknown } }): void {
  const m = client.messages as unknown as { create: (...a: unknown[]) => unknown }
  const orig = m.create.bind(client.messages)
  m.create = (...args: unknown[]) => {
    const body = args[0] as { model?: string; stream?: boolean; max_tokens?: number; messages?: unknown; system?: unknown } | undefined
    const key = ctxKey()
    // Over this brand's AI ceiling: no call leaves the server (lib/quota-rules ai_cost_usd). In the
    // owner's own request, 10 credits buy $1 more headroom today (auto-use on, balance covers it).
    const block = aiGate(key)
    if (block) {
      if (!ownerRequest() || key === HOUSE || key.startsWith("clerk:")) return Promise.reject(block)
      return import("@/lib/credits").then((c) => c.buyAiHeadroom(key)).catch(() => false).then((bought) => {
        if (bought && !aiGate(key)) return go()
        throw block
      })
    }
    return go()
    function go() {
    let hold = 0
    if (body && key !== HOUSE) {
      let chars = 0
      try { chars = JSON.stringify(body.messages ?? "").length + JSON.stringify(body.system ?? "").length } catch { chars = 0 }
      hold = estimateCallCost(body.model ?? "unknown", body.max_tokens, chars)
      reserved.set(key, (reserved.get(key) ?? 0) + hold)
    }
    const release = () => {
      if (!hold) return
      const left = (reserved.get(key) ?? 0) - hold
      if (left > 1e-9) reserved.set(key, left)
      else reserved.delete(key)
    }
    const p = orig(...args) as Promise<unknown> & { then: Promise<unknown>["then"] }
    const feature = featureAls.getStore() ?? "untagged"
    p.then(
      (r) => {
        release()
        if (body && !body.stream) recordTokens(body.model ?? "unknown", (r as { usage?: U } | null)?.usage, feature, key)
      },
      () => release(),
    )
    return p
    }
  }
}
