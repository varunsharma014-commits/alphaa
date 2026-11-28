// Pure: turns what each source returned into one PlatformWindow per ad platform (lib/roas/rules.ts
// picks the source). No database or network, so the matching is unit-tested.
import { cleanClick, inWindow, platformOf, ga4Platform, type Click, type Utm, type CampaignWindow, type GadsValueKind, type PlatformWindow, type Reading, type SourceId } from "./rules"

export type MetaIn = { currency: string; spend: number; leads: number; purchases: number; purchaseValue: number; campaigns: { rowId: string; name: string; spend: number; leads: number; purchases: number; purchaseValue: number }[] }
export type GoogleIn = { currency: string; spend: number; conversions: number; value: number; valueKind: GadsValueKind; campaigns: { id: string; name: string; spend: number; conversions: number; value: number }[] }
export type Ga4In = { currency: string | null; rows: { sourceMedium: string; campaign: string; revenue: number; purchases: number }[] }
export type OrderIn = { at: string; total: number; currency: string; click: import("./rules").Click; utm: import("./rules").Utm }
export type WonIn = { revenue: number; count: number; byCampaignRow: Map<string, { revenue: number; count: number }> }

export type AssembleIn = {
  days: 7 | 30
  meta: MetaIn | null
  google: GoogleIn | null
  ga4: Ga4In | null
  /** Orders from the last 31 days; filtered to the window here. Null = no store connected. */
  orders: OrderIn[] | null
  orderSource?: "woocommerce" | "shopify"
  won: { meta: WonIn | null; google: WonIn | null }
  now?: number
}

type Sum = { revenue: number; count: number }
const add = (m: Map<string, Sum>, k: string, revenue: number, count: number) => {
  const c = m.get(k) ?? { revenue: 0, count: 0 }
  m.set(k, { revenue: c.revenue + revenue, count: c.count + count })
}
const key = (s: string) => s.trim().toLowerCase()

export function assemble(i: AssembleIn): PlatformWindow[] {
  const metaNames = (i.meta?.campaigns ?? []).map((c) => c.name)
  // GA4 and store revenue, per platform and per campaign name, in each platform's currency only.
  const ga = { meta: { t: { revenue: 0, count: 0 }, by: new Map<string, Sum>() }, google: { t: { revenue: 0, count: 0 }, by: new Map<string, Sum>() } }
  for (const r of i.ga4?.rows ?? []) {
    const p = ga4Platform(r.sourceMedium, r.campaign, metaNames)
    if (!p) continue
    const cur = p === "meta" ? i.meta?.currency : i.google?.currency
    if (!cur || (i.ga4?.currency && i.ga4.currency !== cur)) continue
    ga[p].t.revenue += r.revenue; ga[p].t.count += r.purchases
    add(ga[p].by, key(r.campaign), r.revenue, r.purchases)
  }
  const st = { meta: { t: { revenue: 0, count: 0 }, by: new Map<string, Sum>() }, google: { t: { revenue: 0, count: 0 }, by: new Map<string, Sum>() } }
  for (const o of i.orders ?? []) {
    if (!inWindow(o.at, i.days, i.now)) continue
    const p = platformOf(o.click, o.utm, metaNames)
    if (!p) continue
    if (o.currency !== (p === "meta" ? i.meta?.currency : i.google?.currency)) continue
    st[p].t.revenue += o.total; st[p].t.count += 1
    if (o.utm.campaign) add(st[p].by, key(o.utm.campaign), o.total, 1)
  }
  const store: SourceId = i.orderSource ?? "woocommerce"
  const r = (source: SourceId, s: Sum, tracked = true): Reading => ({ source, revenue: Math.round(s.revenue * 100) / 100, count: s.count, tracked })
  const out: PlatformWindow[] = []

  if (i.meta) {
    const m = i.meta
    const readings: Reading[] = [r("meta_purchases", { revenue: m.purchaseValue, count: m.purchases })]
    if (i.orders) readings.push(r(store, st.meta.t))
    if (i.ga4) readings.push(r("ga4", ga.meta.t))
    if (i.won.meta) readings.push(r("won_leads", i.won.meta))
    const campaigns: CampaignWindow[] = m.campaigns.map((c) => ({
      id: c.rowId, name: c.name, platform: "meta", spend: c.spend, leads: c.leads,
      revenue: {
        meta_purchases: { revenue: c.purchaseValue, count: c.purchases },
        ...(st.meta.by.get(key(c.name)) ? { [store]: st.meta.by.get(key(c.name)) } : {}),
        ...(ga.meta.by.get(key(c.name)) ? { ga4: ga.meta.by.get(key(c.name)) } : {}),
        ...(i.won.meta?.byCampaignRow.get(c.rowId) ? { won_leads: i.won.meta.byCampaignRow.get(c.rowId) } : {}),
      },
    }))
    out.push({ platform: "meta", days: i.days, spend: m.spend, currency: m.currency, leads: m.leads, readings, campaigns })
  }

  if (i.google) {
    const g = i.google
    const readings: Reading[] = []
    // Only real sale values count as tracked; a fixed value per conversion is the owner's estimate.
    if (g.valueKind === "real") readings.push(r("google_values", { revenue: g.value, count: g.conversions }))
    if (g.valueKind === "fixed") readings.push(r("google_fixed_values", { revenue: g.value, count: g.conversions }, false))
    if (i.orders) readings.push(r(store, st.google.t))
    if (i.ga4) readings.push(r("ga4", ga.google.t))
    if (i.won.google) readings.push(r("won_leads", i.won.google))
    const campaigns: CampaignWindow[] = g.campaigns.map((c) => ({
      id: c.id, name: c.name, platform: "google", spend: c.spend, leads: c.conversions,
      revenue: {
        ...(g.valueKind === "real" ? { google_values: { revenue: c.value, count: c.conversions } } : {}),
        ...(st.google.by.get(key(c.name)) ? { [store]: st.google.by.get(key(c.name)) } : {}),
        ...(ga.google.by.get(key(c.name)) ? { ga4: ga.google.by.get(key(c.name)) } : {}),
      },
    }))
    out.push({ platform: "google", days: i.days, spend: g.spend, currency: g.currency, leads: g.conversions, readings, campaigns })
  }
  return out
}

// ── WooCommerce: the plugin's "orders" answer (wordpress/alphaa-connector 1.6.0) ──────────────
export type WooOrder = { id: string; at: string; total: number; currency: string; click: Click; utm: Utm }
export type WooResult =
  | { state: "ok"; currency: string | null; all: { count: number; total: number }; orders: WooOrder[] }
  | { state: "no_woo" | "old_plugin" | "no_wp" | "failed" }

export type WooRaw = { ok?: boolean; woo?: boolean; currency?: string; all?: { count?: number; total?: number }; orders?: { id?: unknown; at?: unknown; total?: unknown; currency?: unknown; click?: unknown }[] }

/** Pure: the plugin's answer → typed orders (bad rows dropped). Exported for tests. */
export function parseOrders(r: WooRaw): WooResult {
  if (!r?.woo) return { state: "no_woo" }
  const orders: WooOrder[] = []
  for (const o of (r.orders ?? []).slice(0, 1000)) {
    const total = Number(o.total), at = String(o.at ?? ""), currency = String(o.currency ?? r.currency ?? "").toUpperCase()
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(Date.parse(at)) || !/^[A-Z]{3}$/.test(currency)) continue
    const c = cleanClick(o.click)
    orders.push({ id: String(o.id ?? "").slice(0, 40), at, total: Math.round(total * 100) / 100, currency, click: c?.click ?? {}, utm: c?.utm ?? {} })
  }
  return { state: "ok", currency: r.currency ? String(r.currency).toUpperCase() : null, all: { count: Number(r.all?.count ?? 0) || 0, total: Number(r.all?.total ?? 0) || 0 }, orders }
}

