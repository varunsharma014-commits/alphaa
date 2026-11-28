// ROAS for one brand: reads every revenue source it has (Meta purchase values, Google Ads
// conversion values, GA4 purchase revenue, WooCommerce orders, won leads), assembles one window per
// platform (lib/roas/assemble.ts) and lets lib/roas/rules.ts pick one source each. Read-only calls
// only; nothing here changes an ad account. Cached 15 minutes per brand.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { getAgentSettings } from "@/lib/agent/settings"
import { metaReport, type MetaReport } from "@/lib/metaads/report"
import { getAccess } from "@/lib/metaads/store"
import { getGadsAccount } from "@/lib/gads/store"
import { gadsFor } from "@/lib/gads/client"
import { adsReport, campaignRows, conversionActions, type AdsTotals } from "@/lib/gads/report"
import { getAdRevenue } from "@/lib/ga"
import { cached, within } from "@/lib/workspace/common"
import { assemble } from "./assemble"
import { wonTotals } from "./leads"
import { wooOrders, type WooResult } from "./woo"
import { gadsValueKind, overallRoas, platformRoas, type GadsValueKind, type OverallRoas, type PlatformRoas, type SourceId } from "./rules"

export type GadsReport = Awaited<ReturnType<typeof adsReport>>
/** The Ads page's Google report, shared so the page and ROAS make one set of calls. */
export const gadsReportCached = (userId: string) =>
  cached(`ws:gads:${userId}`, 15 * 60_000, () => within(gadsFor(userId).then(adsReport), 8000, null).catch(() => null))

type GadsRoas = { c7: Awaited<ReturnType<typeof campaignRows>>; c30: Awaited<ReturnType<typeof campaignRows>>; actions: Awaited<ReturnType<typeof conversionActions>> }
const gadsRoasCached = (userId: string) =>
  cached(`roas:gads:${userId}`, 15 * 60_000, () => within(gadsFor(userId).then(async (g) => {
    const [c7, c30, actions] = await Promise.all([campaignRows(g, 7), campaignRows(g, 30), conversionActions(g)])
    return { c7, c30, actions } as GadsRoas
  }), 9000, null).catch(() => null))

export type SourceState = { id: SourceId; state: "data" | "connected" | "missing" | "update" | "unavailable"; text: string }
export type RoasWindow = { days: 7 | 30; platforms: PlatformRoas[]; overall: OverallRoas }
export type Roas = {
  windows: Record<7 | 30, RoasWindow>
  sources: SourceState[]
  customerValue: { amount: number; source: "owner" | "estimate" } | null
  googleValues: GadsValueKind | null
  /** The one next step to see real ROAS, in plain words (null when tracked ROAS is showing). */
  next: string | null
  at: string
}

const memo = new Map<string, { at: number; r: Promise<Roas> }>()
export async function getRoas(user: Pick<User, "id">, pre: { meta?: MetaReport | null; gads?: GadsReport | null } = {}): Promise<Roas> {
  const hit = memo.get(user.id)
  if (hit && Date.now() - hit.at < 15 * 60_000) return hit.r
  const r = build(user.id, pre)
  memo.set(user.id, { at: Date.now(), r })
  r.catch(() => memo.delete(user.id))
  if (memo.size > 2000) memo.clear()
  return r
}

async function build(userId: string, pre: { meta?: MetaReport | null; gads?: GadsReport | null }): Promise<Roas> {
  const [s, access, gacc, integ] = await Promise.all([
    getAgentSettings(userId),
    getAccess(userId).catch(() => null),
    getGadsAccount(userId).catch(() => null),
    db.integration.findUnique({ where: { userId } }).catch(() => null),
  ])
  const meta = pre.meta !== undefined ? pre.meta : access ? await within(metaReport(userId), 8000, null) : null
  const googleOn = !!gacc?.customerId
  const [gads, groas] = googleOn
    ? await Promise.all([pre.gads !== undefined ? Promise.resolve(pre.gads) : gadsReportCached(userId), gadsRoasCached(userId)])
    : [null, null]
  const gaOn = !!integ?.gaPropertyId
  const [ga7, ga30, woo] = await Promise.all([
    gaOn && (meta || gads) ? cached(`roas:ga:7:${userId}`, 60 * 60_000, () => within(getAdRevenue(integ!, 7), 8000, null)) : Promise.resolve(null),
    gaOn && (meta || gads) ? cached(`roas:ga:30:${userId}`, 60 * 60_000, () => within(getAdRevenue(integ!, 30), 8000, null)) : Promise.resolve(null),
    meta || gads ? within(wooOrders(userId, s.wp), 12000, { state: "failed" } as WooResult) : Promise.resolve({ state: "no_wp" } as WooResult),
  ])
  const gCur = gacc?.currency ?? "USD"
  const [won7, won30] = await Promise.all([
    wonTotals(userId, 7, { meta: meta?.currency ?? null, google: gCur }),
    wonTotals(userId, 30, { meta: meta?.currency ?? null, google: gCur }),
  ]).catch(() => [null, null])

  const totalsFor = (t: AdsTotals) => ({ spend: t.cost, conversions: t.conversions, value: t.value ?? 0 })
  const actions = groas?.actions ?? []
  const googleValues = gads ? gadsValueKind(actions.map((a) => ({ ...a })), { conversions: gads.account[1].conversions, value: gads.account[1].value ?? 0 }) : null
  const cv = s.customerValue ? { amount: s.customerValue.amount, source: s.customerValue.source } : null
  const windows = {} as Record<7 | 30, RoasWindow>
  for (const days of [7, 30] as const) {
    const mw = meta ? (days === 7 ? meta.d7 : meta.d30) : null
    const gw = gads ? gads.account[days === 7 ? 0 : 1] : null
    const won = days === 7 ? won7 : won30
    const ga = days === 7 ? ga7 : ga30
    const platforms = assemble({
      days,
      meta: mw && meta ? { currency: meta.currency, spend: mw.spend, leads: mw.leads, purchases: mw.purchases, purchaseValue: mw.purchaseValue, campaigns: mw.byCampaign } : null,
      google: gw && googleValues ? { currency: gCur, ...totalsFor(gw), valueKind: googleValues, campaigns: (days === 7 ? groas?.c7 : groas?.c30)?.map((c) => ({ id: c.id, name: c.name, spend: c.cost, conversions: c.conversions, value: c.value ?? 0 })) ?? [] } : null,
      ga4: ga ?? null,
      orders: woo.state === "ok" ? woo.orders : null,
      orderSource: "woocommerce",
      won: { meta: won?.meta ?? null, google: won?.google ?? null },
    }).map((w) => platformRoas(w, cv))
    windows[days] = { days, platforms, overall: overallRoas(platforms, days) }
  }

  // What's connected, for labels and the Tracking & Setup row.
  const w30 = windows[30]
  const has = (id: SourceId) => w30.platforms.some((p) => p.source === id || p.others.some((o) => o.source === id && (o.revenue > 0 || o.count > 0)))
  const sources: SourceState[] = []
  if (access) sources.push(has("meta_purchases")
    ? { id: "meta_purchases", state: "data", text: "Meta reports purchase values from your website." }
    : { id: "meta_purchases", state: access.picks.pixelId ? "connected" : "missing", text: access.picks.pixelId ? "Your Meta Pixel is linked, but it hasn’t sent a purchase with a value in 30 days." : "Pick your Meta Pixel so purchases on your website count." })
  if (googleOn) sources.push(googleValues === "real" && has("google_values")
    ? { id: "google_values", state: "data", text: "Google Ads reports sale values from your conversion tracking." }
    : googleValues === "fixed"
      ? { id: "google_fixed_values", state: "connected", text: "Google Ads uses a fixed value per conversion that you set, so I show it as an estimate." }
      : { id: "google_values", state: googleValues === "none" ? "missing" : "connected", text: googleValues === "none" ? "Google Ads has no conversion tracking yet." : "Google Ads counts conversions but gets no sale values." })
  sources.push(gaOn ? (has("ga4") ? { id: "ga4", state: "data", text: "Google Analytics ties purchases to your ads." } : { id: "ga4", state: "connected", text: "Google Analytics is connected, but shows no purchases from your ads in 30 days." }) : { id: "ga4", state: "missing", text: "Connect Google Analytics to see purchases from your ads." })
  if (s.wp) {
    if (woo.state === "ok") sources.push(has("woocommerce") ? { id: "woocommerce", state: "data", text: "Your WooCommerce orders from ad clicks are counted." } : { id: "woocommerce", state: "connected", text: "WooCommerce is connected. No orders from ad clicks in 30 days yet." })
    else if (woo.state === "old_plugin") sources.push({ id: "woocommerce", state: "update", text: "Update the Alphaa plugin to 1.6.0 so I can read your WooCommerce order totals (if you sell online)." })
    else if (woo.state === "failed") sources.push({ id: "woocommerce", state: "connected", text: "I couldn’t read your WooCommerce orders just now." })
  }
  if (s.site?.platform === "shopify") sources.push({ id: "shopify", state: "unavailable", text: "Shopify orders need extra access that’s waiting on Shopify’s review. Google Analytics covers it meanwhile." })
  sources.push(has("won_leads") ? { id: "won_leads", state: "data", text: "Leads you marked as won are counted." } : { id: "won_leads", state: "connected", text: "Mark a lead as won when it becomes a customer, and I count the sale." })

  const tracked = windows[30].overall.roas !== null || windows[7].overall.roas !== null
  const next = tracked ? null
    : !gaOn ? "Connect Google Analytics, or mark leads as won when they buy, and I’ll show what your ads earn."
    : "Mark a lead as won when it becomes a customer, and I’ll show what your ads earn."
  return { windows, sources, customerValue: cv, googleValues, next, at: new Date().toISOString() }
}

/** The cached result if it's ready, else null (and it starts loading in the background). For the shell's badge. */
export async function peekRoas(user: Pick<User, "id">): Promise<Roas | null> {
  const hit = memo.get(user.id)
  if (!hit || Date.now() - hit.at >= 15 * 60_000) { void getRoas(user).catch(() => null); return null }
  return within(hit.r, 50, null)
}

/** Forget the cached numbers (after the owner marks a lead won). */
export const forgetRoas = (userId: string) => { memo.delete(userId) }

/** One line for the weekly email / Briefing: tracked ROAS over 7 days, else null. Every number from getRoas. */
export function roasLine(r: Roas, days: 7 | 30 = 7): string | null {
  const o = r.windows[days].overall
  if (o.roas === null || o.revenue === null || !o.currency) return null
  const money = (x: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: o.currency!, maximumFractionDigits: x >= 100 ? 0 : 2 }).format(x)
  const per = Math.round(o.roas * 100) / 100
  const covers = o.covers.map((p) => (p === "meta" ? "Facebook & Instagram" : p === "google" ? "Google" : "LinkedIn")).join(" and ")
  return `Your ${covers} ads brought in ${money(o.revenue)} from ${money(o.spend)} spent in the last ${days} days: ${money(per)} back for every ${money(1)}.`
}

/** The weekly email's ROAS line (Growth, an ad account connected, tracked sales in the last 7 days), else null. */
export async function roasEmailLine(userId: string): Promise<string | null> {
  const { hasGrowth } = await import("@/lib/billing")
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, plan: true, email: true } })
  if (!user || !hasGrowth(user)) return null
  const [meta, gacc] = await Promise.all([getAccess(userId).catch(() => null), getGadsAccount(userId).catch(() => null)])
  if (!meta && !gacc?.customerId) return null
  const r = await within(getRoas(user), 20_000, null)
  return r ? roasLine(r, 7) : null
}
