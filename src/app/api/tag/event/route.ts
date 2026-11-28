export const dynamic = "force-dynamic"

import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { getAgentSettings } from "@/lib/agent/settings"
import { EVENT_KINDS, recordEvent, sendCapi, verifyTestToken, type EventKind } from "@/lib/tracking-events"
import { adClick, cleanClick } from "@/lib/roas/rules"
import { recordSiteLead } from "@/lib/roas/leads"

// Beacon from the Alphaa tag / WordPress plugin when a lead event fires on an owner's site
// (navigator.sendBeacon, text/plain, so no CORS preflight). Public by nature: it runs in
// visitors' browsers. It only counts for Pro and Growth accounts with tracking on, caps volume per IP
// and per account, and stores only the kind of event and a count per day, plus, for a lead that came
// from an ad click, one row with the click ids + UTM (lib/roas/leads.ts) so it can be marked won. The visitor's IP and
// browser string are passed to Meta's Conversions API when the owner set it up, never stored.

const PER_IP_PER_HOUR = 40
const PER_ACCOUNT_PER_DAY = 5_000
const ipHits = new Map<string, { n: number; reset: number }>()
const accountHits = new Map<string, { n: number; day: string }>()
const accounts = new Map<string, { at: number; ok: boolean }>()

function allowIp(ip: string): boolean {
  const now = Date.now()
  const h = ipHits.get(ip)
  if (!h || h.reset < now) {
    if (ipHits.size > 50_000) ipHits.clear()
    ipHits.set(ip, { n: 1, reset: now + 3_600_000 })
    return true
  }
  h.n++
  return h.n <= PER_IP_PER_HOUR
}

function allowAccount(id: string): boolean {
  const day = new Date().toISOString().slice(0, 10)
  const h = accountHits.get(id)
  if (!h || h.day !== day) { accountHits.set(id, { n: 1, day }); return true }
  h.n++
  return h.n <= PER_ACCOUNT_PER_DAY
}

const cors = { "access-control-allow-origin": "*" }
const done = () => new Response(null, { status: 204, headers: cors })

export async function POST(req: Request) {
  let data: { id?: string; k?: string; eid?: string; u?: string; gpc?: number; t?: string; c?: unknown }
  try {
    data = JSON.parse((await req.text()).slice(0, 4_000))
  } catch {
    return done()
  }
  const id = String(data.id ?? "")
  const kind = String(data.k ?? "") as EventKind
  if (!/^[a-z0-9]{10,40}$/i.test(id) || !EVENT_KINDS.includes(kind)) return done()
  const eid = /^[a-z0-9]{6,40}$/i.test(String(data.eid ?? "")) ? String(data.eid) : ""
  if (kind === "test" && !verifyTestToken(id, String(data.t ?? ""))) return done()

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || ""
  if (!allowIp(ip || "unknown") || !allowAccount(id)) return done()

  // Known Pro or Growth account with tracking on? Cached 5 minutes so a busy site doesn't hit the DB per tap.
  const cached = accounts.get(id)
  let ok = cached && cached.at > Date.now() - 300_000 ? cached.ok : null
  const settings = await getAgentSettings(id).catch(() => null)
  if (ok === null) {
    const user = await db.user.findUnique({ where: { id }, select: { plan: true, email: true } }).catch(() => null)
    ok = !!user && hasPro(user) && !!settings?.tracking?.on
    if (accounts.size > 20_000) accounts.clear()
    accounts.set(id, { at: Date.now(), ok })
  }
  if (!ok || !settings?.tracking) return done()

  // Page address without query or fragment (they can carry personal details).
  let url: string | undefined
  try {
    const u = new URL(String(data.u ?? ""))
    if (u.protocol === "https:" || u.protocol === "http:") url = `${u.origin}${u.pathname}`.slice(0, 500)
  } catch {}

  // The ad click the visitor arrived with (click ids + UTM, for ROAS). Never kept for GPC browsers.
  const click = data.gpc === 1 || kind === "test" ? null : cleanClick(data.c)
  // The visitor asked not to be tracked (Global Privacy Control): count it, don't send it to Meta.
  const capi = data.gpc === 1 || !eid ? null : await sendCapi(settings.tracking, { kind, eid, url, ip: ip || null, ua: req.headers.get("user-agent")?.slice(0, 400) ?? null, fbc: click?.click.fbc ?? null })
  await recordEvent(id, kind, { eid, capi }).catch((err) => console.error("[tag/event]", err instanceof Error ? err.message : err))
  if (click && adClick(click.click, click.utm)) await recordSiteLead(id, { kind, page: url, click: click.click, utm: click.utm, eid }).catch((err) => console.error("[tag/event] lead", err instanceof Error ? err.message : err))
  return done()
}

export function OPTIONS(): Response {
  return new Response(null, { headers: { ...cors, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type" } })
}
