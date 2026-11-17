// What we do for each brand, and what it costs us in AI.
// Every Anthropic call is metered at the client (lib/claude.ts installs the meter) and
// attributed to the brand being worked on: a request sets it in currentUser(), crons set it
// per account with asUser(). Counts are kept per brand per day in a MockActivity row
// ("usage_day"), flushed every 30 seconds so calls never wait on a database write.
import { AsyncLocalStorage } from "async_hooks"

type Ctx = { userId: string }
const als = new AsyncLocalStorage<Ctx>()

/** Attribute everything that follows in this async flow to this brand. */
export function asUser(userId: string): void {
  als.enterWith({ userId })
}
export function runAsUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return als.run({ userId }, fn)
}

type Day = { calls: number; tokens: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }>; counts: Record<string, number> }
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

type U = { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }
function recordTokens(model: string, u: U | undefined) {
  const ctx = als.getStore()
  if (!ctx || !u) return
  const d = slot(ctx.userId)
  d.calls++
  const t = (d.tokens[model] ??= { in: 0, out: 0, cacheRead: 0, cacheWrite: 0 })
  t.in += u.input_tokens ?? 0
  t.out += u.output_tokens ?? 0
  t.cacheRead += u.cache_read_input_tokens ?? 0
  t.cacheWrite += u.cache_creation_input_tokens ?? 0
  schedule()
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
    const [userId, date] = key.split("|")
    try {
      const row = await db.mockActivity.findFirst({ where: { userId, type: "usage_day", metadata: { path: ["date"], equals: date } } })
      const cur = (row?.metadata as (Day & { date: string }) | null) ?? { date, calls: 0, tokens: {}, counts: {} }
      cur.calls += add.calls
      for (const [m, t] of Object.entries(add.tokens)) {
        const c = (cur.tokens[m] ??= { in: 0, out: 0, cacheRead: 0, cacheWrite: 0 })
        c.in += t.in; c.out += t.out; c.cacheRead += t.cacheRead; c.cacheWrite += t.cacheWrite
      }
      for (const [k, n] of Object.entries(add.counts)) cur.counts[k] = (cur.counts[k] ?? 0) + n
      if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: cur as object } })
      else await db.mockActivity.create({ data: { userId, type: "usage_day", title: `Usage ${date}`, metadata: cur as object } })
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
      p.then((r) => recordTokens(body.model ?? "unknown", (r as { usage?: U } | null)?.usage), () => undefined)
    }
    return p
  }
}
