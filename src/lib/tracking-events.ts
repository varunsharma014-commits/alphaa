// Growth: what the tracking on an owner's site actually fires.
//
// The Alphaa tag and the WordPress plugin (1.4.0+) send a tiny beacon to /api/tag/event for every
// lead event (phone tap, email tap, form send) and for the self-test. We keep one MockActivity row
// per account per day ("tracking_event") with merged counters: the kind of lead and how many, never
// anything about the visitor. When the owner saved a Meta Conversions API token, the same event is
// also sent to Meta from our server with the browser's event id, so Meta counts it once.
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { decryptSecret } from "@/lib/checks/bing-webmaster"
import type { Tracking } from "@/lib/tracking"

export const EVENT_KINDS = ["phone", "email", "form", "hubspot", "typeform", "calendly", "test"] as const
export type EventKind = (typeof EVENT_KINDS)[number]
export const META_GRAPH = "https://graph.facebook.com/v21.0"

export type CapiResult = { ok: boolean; received?: number; error?: string; test?: boolean }

export type EventDay = {
  day: string // YYYY-MM-DD (UTC)
  counts: Partial<Record<EventKind, number>>
  capi?: { sent: number; failed: number; lastError?: string }
  /** The last self-test beacon that arrived this day. */
  lastTest?: { at: string; eid: string; capi?: CapiResult }
}

const TYPE = "tracking_event"
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10)

// ── Self-test tokens: "<expiry base36>.<sig>", bound to the account id the tag sends ──────────
function secret(): string | null {
  const s = process.env.CONNECTOR_SECRET || process.env.CRON_SECRET || process.env.CLERK_SECRET_KEY
  return s && s.length >= 16 ? s : null
}
const sig = (k: string, userId: string, exp: string) => createHmac("sha256", k).update(`trk-test:${userId}:${exp}`).digest("base64url").slice(0, 16)

export const TEST_TTL_MS = 2 * 3_600_000

export function makeTestToken(userId: string): { token: string; exp: number } | null {
  const k = secret()
  if (!k) return null
  const exp = Date.now() + TEST_TTL_MS
  const e = exp.toString(36)
  return { token: `${e}.${sig(k, userId, e)}`, exp }
}

export function verifyTestToken(userId: string, token: string): boolean {
  const k = secret()
  const [e, mac] = (token || "").split(".")
  if (!k || !e || !mac) return false
  const want = Buffer.from(sig(k, userId, e))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return false
  const exp = parseInt(e, 36)
  return Number.isFinite(exp) && exp > Date.now()
}

// ── Per-day counters ──────────────────────────────────────────────────────────────────────────
// One replica (see cron-scheduler), so an in-process queue per account keeps read-merge-write safe.
const chains = new Map<string, Promise<unknown>>()
function serial<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve()
  const next = prev.catch(() => {}).then(fn)
  chains.set(key, next)
  void next.finally(() => { if (chains.get(key) === next) chains.delete(key) })
  return next
}

export function recordEvent(userId: string, kind: EventKind, extra: { eid?: string; capi?: CapiResult | null } = {}): Promise<void> {
  return serial(userId, async () => {
    const day = dayKey()
    const row = await db.mockActivity.findFirst({ where: { userId, type: TYPE, metadata: { path: ["day"], equals: day } }, orderBy: { createdAt: "desc" } })
    const cur: EventDay = (row?.metadata as EventDay | null) ?? { day, counts: {} }
    const next: EventDay = { ...cur, counts: { ...cur.counts, [kind]: (cur.counts[kind] ?? 0) + 1 } }
    if (extra.capi) {
      const c = next.capi ?? { sent: 0, failed: 0 }
      next.capi = extra.capi.ok ? { ...c, sent: c.sent + 1 } : { ...c, failed: c.failed + 1, lastError: extra.capi.error?.slice(0, 200) }
    }
    if (kind === "test") next.lastTest = { at: new Date().toISOString(), eid: extra.eid ?? "", capi: extra.capi ?? undefined }
    if (row) await db.mockActivity.update({ where: { id: row.id }, data: { metadata: next as object } })
    else await db.mockActivity.create({ data: { userId, type: TYPE, title: "Lead events from your website", metadata: next as object } })
  })
}

/** The last `days` days of counters, newest first. */
export async function eventDays(userId: string, days = 30): Promise<EventDay[]> {
  const rows = await db.mockActivity.findMany({
    where: { userId, type: TYPE, createdAt: { gte: new Date(Date.now() - (days + 1) * 86_400_000) } },
    orderBy: { createdAt: "desc" },
    take: days + 2,
  })
  return rows.map((r) => r.metadata as EventDay).filter((d) => d && typeof d.day === "string")
}

export function sumCounts(days: EventDay[]): Partial<Record<EventKind, number>> {
  const out: Partial<Record<EventKind, number>> = {}
  for (const d of days) for (const k of EVENT_KINDS) if (d.counts?.[k]) out[k] = (out[k] ?? 0) + (d.counts[k] ?? 0)
  return out
}

/** The newest test beacon at or after `since`. */
export function testSince(days: EventDay[], since: string): EventDay["lastTest"] | null {
  for (const d of days) if (d.lastTest && d.lastTest.at >= since) return d.lastTest
  return null
}

// ── Meta Conversions API ──────────────────────────────────────────────────────────────────────
const META_NAME: Record<EventKind, string> = { phone: "Contact", email: "Contact", form: "Lead", hubspot: "Lead", typeform: "Lead", calendly: "Lead", test: "AlphaaTest" }

/**
 * Send one event the browser also sent (same event_id, so Meta keeps one). We only have the
 * visitor's IP and browser string (Meta needs one identifier for website events); nothing is
 * hashed because we hold no email or phone. The self-test never sends a real conversion: with the
 * owner's Test Events code it's a Lead that only shows under Test events, otherwise a custom AlphaaTest.
 */
export async function sendCapi(t: Tracking, ev: { kind: EventKind; eid: string; url?: string; ip?: string | null; ua?: string | null }): Promise<CapiResult | null> {
  if (!t.capi?.token || !t.capi.pixel) return null
  let token: string
  try {
    token = decryptSecret(t.capi.token)
  } catch {
    return { ok: false, error: "The saved Meta token can’t be read. Paste it again." }
  }
  const test = ev.kind === "test"
  const body = {
    data: [{
      event_name: test && t.capi.testCode ? "Lead" : META_NAME[ev.kind],
      event_time: Math.floor(Date.now() / 1000),
      event_id: ev.eid,
      action_source: "website",
      ...(ev.url ? { event_source_url: ev.url } : {}),
      user_data: { ...(ev.ip ? { client_ip_address: ev.ip } : {}), ...(ev.ua ? { client_user_agent: ev.ua } : {}) },
      custom_data: { method: ev.kind },
    }],
    ...(test && t.capi.testCode ? { test_event_code: t.capi.testCode } : {}),
  }
  try {
    const res = await fetch(`${META_GRAPH}/${encodeURIComponent(t.capi.pixel)}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    })
    const j = (await res.json().catch(() => ({}))) as { events_received?: number; error?: { message?: string } }
    if (!res.ok) return { ok: false, error: j.error?.message?.slice(0, 200) ?? `Meta answered ${res.status}`, test }
    return { ok: (j.events_received ?? 0) > 0, received: j.events_received ?? 0, test }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 200) : "Meta didn’t answer", test }
  }
}

/** Check a pasted token can send to this pixel (reads the pixel's name; sends nothing). */
export async function checkCapiToken(pixel: string, token: string): Promise<{ ok: true; name?: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${META_GRAPH}/${encodeURIComponent(pixel)}?fields=id,name&access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(8_000) })
    const j = (await res.json().catch(() => ({}))) as { id?: string; name?: string; error?: { message?: string } }
    if (!res.ok || j.id !== pixel) return { ok: false, error: j.error?.message ?? "Meta didn’t accept that token for this pixel." }
    return { ok: true, name: j.name }
  } catch {
    return { ok: false, error: "I couldn’t reach Meta just now. Try again in a minute." }
  }
}
