// Leads from ads, and the ones the owner marked won (with the amount), for ROAS on lead businesses.
//
//   ad_site_lead     one per website lead event that came from an ad click (kind, page, click ids,
//                    UTM, never anything about the visitor). Only kept when the visitor's browser
//                    didn't send Global Privacy Control. Capped per brand per day.
//   meta_ads_lead    the instant-form leads (lib/metaads/store.ts), unchanged; `won` is added.
//
// `won` = { amount, currency, at, valueFrom, uploads } on the lead's own row. Owner entries only.
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { listCampaigns, listLeads, LEAD } from "@/lib/metaads/store"
import type { EventKind } from "@/lib/tracking-events"
import { inWindow, platformOf, type Click, type Utm } from "./rules"

export const SITE_LEAD = "ad_site_lead"
const PER_DAY = 300

export type UploadResult = { ok: boolean; mode: "live" | "dry_run"; at: string; error?: string; skipped?: string }
export type Won = { amount: number; currency: string; at: string; valueFrom: "owner" | "customer_value"; uploads?: { google?: UploadResult; meta?: UploadResult } }
export type SiteLead = { kind: EventKind; at: string; page?: string; click: Click; utm: Utm; eid?: string; won?: Won | null }

const day = () => new Date().toISOString().slice(0, 10)
const perDay = new Map<string, { day: string; n: number }>()

/** Called from /api/tag/event for a lead event that carried ad click info (never for GPC visitors or tests). */
export async function recordSiteLead(userId: string, l: Omit<SiteLead, "at" | "won">): Promise<void> {
  const h = perDay.get(userId)
  if (h && h.day === day() && h.n >= PER_DAY) return
  perDay.set(userId, h && h.day === day() ? { day: h.day, n: h.n + 1 } : { day: day(), n: 1 })
  if (perDay.size > 20_000) perDay.clear()
  // Title goes to the work log: the kind of lead only.
  await db.mockActivity.create({ data: { userId, type: SITE_LEAD, title: "Lead from an ad click on your website", metadata: { ...l, at: new Date().toISOString() } as object } })
}

export type AdLead = {
  /** "m:<rowId>" (Meta form) or "s:<rowId>" (website). */
  ref: string
  platform: "meta" | "google" | null
  at: string
  title: string
  detail: string
  won: Won | null
  /** For uploads (server only reads these; the page never shows ids). */
  click?: Click
  leadId?: string | null
  campaignRowId?: string | null
  adId?: string | null
  currency: string | null
}

const KIND: Record<string, string> = { phone: "Phone tap", email: "Email tap", form: "Form sent", hubspot: "HubSpot form sent", typeform: "Typeform sent", calendly: "Calendly booking" }

/** Meta campaign names I built (for UTM matching) and their currency. */
export async function myMetaCampaigns(userId: string): Promise<{ names: string[]; byRow: Map<string, { name: string; currency: string; campaignId?: string | null }> }> {
  const all = await listCampaigns(userId, 50).catch(() => [])
  const built = all.filter((c) => c.built?.campaignId)
  return { names: built.map((c) => c.name), byRow: new Map(built.map((c) => [c.id, { name: c.name, currency: c.currency, campaignId: c.built?.campaignId }])) }
}

/** Ad leads from the last `days` days, newest first: Meta form leads + website leads from ad clicks. */
export async function listAdLeads(userId: string, days = 30, take = 60): Promise<AdLead[]> {
  const [meta, site, mine, gacc] = await Promise.all([
    listLeads(userId, { take, sinceDays: days }).catch(() => []),
    db.mockActivity.findMany({ where: { userId, type: SITE_LEAD, createdAt: { gte: new Date(Date.now() - days * 86_400_000) } }, orderBy: { createdAt: "desc" }, take }),
    myMetaCampaigns(userId),
    import("@/lib/gads/store").then((m) => m.getGadsAccount(userId)).catch(() => null),
  ])
  const out: AdLead[] = []
  for (const l of meta) {
    const c = mine.byRow.get(l.campaignRowId)
    const who = l.contact.name || l.contact.email || l.contact.phone || "Someone"
    out.push({
      ref: `m:${l.id}`, platform: "meta", at: l.createdTime, title: `${who} filled in your ad form`,
      detail: c ? `Facebook & Instagram · ${c.name}` : "Facebook & Instagram",
      won: ((l as unknown as { won?: Won | null }).won) ?? null,
      leadId: l.leadId, campaignRowId: l.campaignRowId, adId: l.adId ?? null, currency: c?.currency ?? null,
    })
  }
  for (const r of site) {
    const m = r.metadata as unknown as SiteLead
    const p = platformOf(m.click, m.utm, mine.names)
    const from = p === "google" ? "Google ad" : p === "meta" ? "Facebook & Instagram ad" : m.utm?.source ? `${m.utm.source} link` : "an ad link"
    out.push({
      ref: `s:${r.id}`, platform: p, at: m.at, title: `${KIND[m.kind] ?? "Lead"}${m.page ? ` on ${safePath(m.page)}` : ""}`,
      detail: `From a ${from}${m.utm?.campaign ? ` · ${m.utm.campaign}` : ""}`,
      won: m.won ?? null, click: m.click,
      currency: p === "google" ? gacc?.currency ?? null : p === "meta" ? [...mine.byRow.values()][0]?.currency ?? null : null,
    })
  }
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, take)
}

const safePath = (u: string) => { try { return new URL(u).pathname } catch { return u.slice(0, 80) } }

async function rowFor(userId: string, ref: string) {
  const [k, id] = ref.split(":")
  if (!id || (k !== "m" && k !== "s")) return null
  const row = await db.mockActivity.findFirst({ where: { id, userId, type: k === "m" ? LEAD : SITE_LEAD } })
  return row ? { row, kind: k as "m" | "s" } : null
}

/** Mark a lead won with the owner's amount (or clear it with amount null). Returns the lead's new won. */
export async function setWon(userId: string, ref: string, o: { amount: number | null; currency: string; valueFrom: "owner" | "customer_value" }): Promise<Won | null> {
  const hit = await rowFor(userId, ref)
  if (!hit) throw new Error("I can’t find that lead.")
  const meta = (hit.row.metadata ?? {}) as Record<string, unknown>
  const won: Won | null = o.amount && o.amount > 0 ? { amount: Math.round(o.amount * 100) / 100, currency: o.currency, at: new Date().toISOString(), valueFrom: o.valueFrom } : null
  await db.mockActivity.update({ where: { id: hit.row.id }, data: { metadata: { ...meta, won } as object } })
  return won
}

export async function saveUploads(userId: string, ref: string, uploads: Won["uploads"]): Promise<void> {
  const hit = await rowFor(userId, ref)
  const meta = (hit?.row.metadata ?? {}) as Record<string, unknown> & { won?: Won | null }
  if (!hit || !meta.won) return
  await db.mockActivity.update({ where: { id: hit.row.id }, data: { metadata: { ...meta, won: { ...meta.won, uploads: { ...meta.won.uploads, ...uploads } } } as object } })
}

export type WonTotals = { revenue: number; count: number; byCampaignRow: Map<string, { revenue: number; count: number }>; byAd: Map<string, { revenue: number; count: number }> }
const emptyTotals = (): WonTotals => ({ revenue: 0, count: 0, byCampaignRow: new Map(), byAd: new Map() })

/**
 * Won revenue per platform for leads created in the window (last `days` days, not today), only
 * in that platform's currency. Meta form leads carry their campaign and ad.
 */
export async function wonTotals(userId: string, days: 7 | 30, currencies: { meta?: string | null; google?: string | null }): Promise<{ meta: WonTotals; google: WonTotals }> {
  const leads = await listAdLeads(userId, days + 1, 500)
  const out = { meta: emptyTotals(), google: emptyTotals() }
  for (const l of leads) {
    if (!l.won || !l.platform || l.won.currency !== currencies[l.platform]) continue
    if (!inWindow(l.at, days)) continue
    const t = out[l.platform]
    t.revenue += l.won.amount; t.count++
    const add = (m: Map<string, { revenue: number; count: number }>, k: string | null | undefined) => {
      if (!k) return
      const cur = m.get(k) ?? { revenue: 0, count: 0 }
      m.set(k, { revenue: cur.revenue + l.won!.amount, count: cur.count + 1 })
    }
    add(t.byCampaignRow, l.campaignRowId)
    add(t.byAd, l.adId)
  }
  return out
}

/** The owner's typical customer value, for the "Mark won" default. */
export async function defaultWonValue(userId: string): Promise<number | null> {
  const s = await getAgentSettings(userId)
  return s.customerValue?.amount ?? null
}
