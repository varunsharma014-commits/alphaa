// ROAS for the Ads page: the numbers from lib/roas/sources.ts, formatted, with every figure's
// source in words. Tracked (real sales) and estimated (customer value) are separate fields.
import type { User } from "@prisma/client"
import { getAgentSettings } from "@/lib/agent/settings"
import { getCustomerValue } from "@/lib/customer-value"
import { getGadsAccount } from "@/lib/gads/store"
import type { MetaReport } from "@/lib/metaads/report"
import { listAdLeads } from "@/lib/roas/leads"
import { getRoas, type GadsReport } from "@/lib/roas/sources"
import { uploadMode } from "@/lib/roas/uploads"
import { fmtRoas, PLATFORM_LABEL, SALE_WORD, SOURCE_LABEL, type PlatformRoas } from "@/lib/roas/rules"
import { money, n, within } from "./common"

export type RoasPlatformView = {
  platform: string
  roas: string
  revenue: string | null
  perSale: string | null
  saleWord: string
  source: string | null
  others: string[]
  estimate: { roas: string; revenue: string; text: string } | null
}
export type RoasCampaignView = { name: string; platform: string; spend: string; leads: string; revenue: string; roas: string }
export type RoasWindowView = {
  days: 7 | 30
  /** Tracked ROAS across platforms with a tracked source ("—" when none). */
  roas: string
  revenue: string | null
  perSale: string | null
  saleWord: string
  /** "From purchases Meta tracked on your website." */
  label: string | null
  /** A platform that spent with no sales source, said plainly. */
  gap: string | null
  /** Shown only when there's no tracked ROAS: from the owner's customer value, labelled. */
  estimate: { roas: string; text: string } | null
  platforms: RoasPlatformView[]
  campaigns: RoasCampaignView[]
}
export type LeadView = { ref: string; platform: string; when: string; title: string; detail: string; won: { amount: string; raw: number; atValue: boolean; sent: string | null } | null }
export type RoasView = {
  windows: Record<7 | 30, RoasWindowView>
  next: string | null
  leads: LeadView[]
  defaultValue: number | null
  currency: string
  uploads: { google: boolean; meta: boolean; googleAction: string | null; test: boolean; canGoogle: boolean; canMeta: boolean }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function platformView(p: PlatformRoas): RoasPlatformView {
  const word = p.source ? SALE_WORD[p.source] : "sale"
  return {
    platform: PLATFORM_LABEL[p.platform],
    roas: fmtRoas(p.roas),
    revenue: p.revenue !== null ? money(p.revenue, p.currency) : null,
    perSale: p.perSale !== null ? money(p.perSale, p.currency) : null,
    saleWord: word,
    source: p.source ? `From ${SOURCE_LABEL[p.source]}.` : null,
    others: p.others.map((o) => `${cap(SOURCE_LABEL[o.source])}: ${money(o.revenue, p.currency)}${o.tracked ? "" : " (an estimate)"}${o.count ? ` from ${n(o.count)} ${SALE_WORD[o.source]}${o.count === 1 ? "" : "s"}` : ""}.`),
    estimate: p.estimate && p.estimate.roas !== null
      ? { roas: fmtRoas(p.estimate.roas), revenue: money(p.estimate.revenue, p.currency), text: `Counts each of the ${n(p.estimate.leads)} lead${p.estimate.leads === 1 ? "" : "s"} as one customer worth ${money(p.estimate.value, p.currency)} (${p.estimate.valueSource === "owner" ? "your number" : "my estimate"}).${p.estimate.breakEven !== null ? p.estimate.breakEven >= 1 ? ` The ads pay for themselves if 1 in ${n(p.estimate.breakEven)} leads becomes a customer.` : " Right now a lead costs more than a customer is worth." : ""}` }
      : null,
  }
}

export async function getRoasView(user: User, pre: { meta: MetaReport | null; gads: GadsReport | null; live: boolean }): Promise<RoasView | null> {
  // My customer-value estimate (one Haiku call, saved once) only once ads are live.
  if (pre.live) await within(getCustomerValue(user.id), 6000, null)
  const [r, s, leads, gacc] = await Promise.all([
    within(getRoas(user, { meta: pre.meta, gads: pre.gads }), 12_000, null),
    getAgentSettings(user.id),
    listAdLeads(user.id, 30, 40).catch(() => []),
    getGadsAccount(user.id).catch(() => null),
  ])
  if (!r) return null
  const currency = pre.meta?.currency ?? gacc?.currency ?? "USD"
  const windows = {} as Record<7 | 30, RoasWindowView>
  for (const days of [7, 30] as const) {
    const w = r.windows[days]
    const o = w.overall
    const word = o.sources.length === 1 ? SALE_WORD[o.sources[0]] : "sale"
    const est = o.roas === null ? w.platforms.find((p) => p.estimate && p.estimate.roas !== null) : null
    windows[days] = {
      days,
      roas: fmtRoas(o.roas),
      revenue: o.revenue !== null && o.currency ? money(o.revenue, o.currency) : null,
      perSale: o.perSale !== null && o.currency ? money(o.perSale, o.currency) : null,
      saleWord: word,
      label: o.sources.length ? `From ${Array.from(new Set(o.sources)).map((x) => SOURCE_LABEL[x]).join(" and ")}.` : null,
      gap: o.roas !== null && o.uncovered.length ? `${o.uncovered.map((p) => PLATFORM_LABEL[p]).join(" and ")} ${o.uncovered.length === 1 ? "isn’t" : "aren’t"} included: no sales are tracked there yet.` : null,
      estimate: est?.estimate && est.estimate.roas !== null ? { roas: fmtRoas(est.estimate.roas), text: `${PLATFORM_LABEL[est.platform]}: ${platformView(est).estimate!.text}` } : null,
      platforms: w.platforms.map(platformView),
      campaigns: w.platforms.flatMap((p) => p.campaigns.map((c) => ({
        name: c.name, platform: PLATFORM_LABEL[c.platform], spend: money(c.spend, p.currency), leads: n(c.leads),
        revenue: c.revenue !== null ? money(c.revenue, p.currency) : "—", roas: fmtRoas(c.roas),
      }))),
    }
  }
  const up = s.roas?.uploads
  const fmtSent = (w: NonNullable<(typeof leads)[number]["won"]>) => {
    const parts: string[] = []
    for (const [k, v] of Object.entries(w.uploads ?? {})) {
      if (!v) continue
      const who = k === "google" ? "Google" : "Meta"
      parts.push(v.skipped ? `${who}: ${v.skipped}` : v.ok ? (v.mode === "live" ? `Sent to ${who}` : `${who}: checked, test mode`) : `${who} said: ${v.error ?? "no"}`)
    }
    return parts.length ? parts.join(" · ") : null
  }
  return {
    windows,
    next: r.next,
    leads: leads.map((l) => ({
      ref: l.ref, platform: l.platform === "meta" ? "Facebook & Instagram" : l.platform === "google" ? "Google" : "Ad link",
      when: new Date(l.at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), title: l.title, detail: l.detail,
      won: l.won ? { amount: money(l.won.amount, l.won.currency), raw: l.won.amount, atValue: l.won.valueFrom === "customer_value", sent: fmtSent(l.won) } : null,
    })),
    defaultValue: r.customerValue?.amount ?? null,
    currency,
    uploads: { google: !!up?.google, meta: !!up?.meta, googleAction: up?.googleActionName ?? null, test: uploadMode() !== "live", canGoogle: !!gacc?.customerId, canMeta: !!(s.tracking?.capi?.token && s.tracking.capi.pixel) },
  }
}
