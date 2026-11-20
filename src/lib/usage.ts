// What we do for each brand, and what it costs us in AI.
// Every Anthropic call is metered at the client (lib/claude.ts installs the meter) and
// attributed to the brand being worked on: a request sets it in currentUser(), crons set it
// per account with asUser(). Counts are kept per brand per day in a MockActivity row
// ("usage_day"), flushed every 30 seconds so calls never wait on a database write.
// Calls with no brand (public scans from /start, cron work before a brand is chosen) are kept
// too, in a "usage_house" row on the founder account, so the totals match the Anthropic bill.
// Each call also records its feature (claudeFor("scan") in lib/claude.ts) and web searches.
import { AsyncLocalStorage } from "async_hooks"

// userId = the brand's User row id (exact). clerkId = set by auth() for any signed-in request,
// resolved to the brand at flush time, so routes that never call currentUser() still count.
type Ctx = { userId?: string; clerkId?: string }
const als = new AsyncLocalStorage<Ctx>()
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
const today = () => new Date().toISOString().slice(0, 10)
function slot(userId: string): Day {
  const k = `${userId}|${today()}`
  let d = pending.get(k)
  if (!d) { d = { calls: 0, tokens: {}, counts: {} }; pending.set(k, d) }
  return d
}

/** Count something done for a brand (a post published, a week run…). */
export function countUsage(userId: string, what: string, n = 1): void {
  const d = slot(userId)
  d.counts[what] = (d.counts[what] ?? 0) + n
  schedule()
}

type U = { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null; server_tool_use?: { web_search_requests?: number | null } | null }
const addTok = (t: Tok, u: U) => {
  t.in += u.input_tokens ?? 0
  t.out += u.output_tokens ?? 0
  t.cacheRead += u.cache_read_input_tokens ?? 0
  t.cacheWrite += u.cache_creation_input_tokens ?? 0
}
const emptyTok = (): Tok => ({ in: 0, out: 0, cacheRead: 0, cacheWrite: 0 })
function recordTokens(model: string, u: U | undefined, feature: string) {
  if (!u) return
  const ctx = als.getStore()
  const d = slot(ctx?.userId ?? (ctx?.clerkId ? `clerk:${ctx.clerkId}` : HOUSE))
  const searches = u.server_tool_use?.web_search_requests ?? 0
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

export async function flush(): Promise<void> {
  if (!pending.size) return
  const batch = Array.from(pending.entries())
  pending.clear()
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
    }
  }
}

/** Wraps client.messages.create (parse goes through it) to record token usage. */
export function installUsageMeter(client: { messages: { create: unknown } }): void {
  const m = client.messages as unknown as { create: (...a: unknown[]) => unknown }
  const orig = m.create.bind(client.messages)
  m.create = (...args: unknown[]) => {
    const p = orig(...args) as Promise<unknown> & { then: Promise<unknown>["then"] }
    const body = args[0] as { model?: string; stream?: boolean } | undefined
    if (body && !body.stream) {
      const feature = featureAls.getStore() ?? "untagged"
      p.then((r) => recordTokens(body.model ?? "unknown", (r as { usage?: U } | null)?.usage, feature), () => undefined)
    }
    return p
  }
}
