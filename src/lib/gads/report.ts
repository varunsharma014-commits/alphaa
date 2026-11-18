// Spend, clicks, conversions and cost per lead, straight from Google Ads (GAQL), for the
// "Ads" thread. Every number shown comes from these rows.
import { fromMicros } from "./api"
import type { Gads } from "./client"

export type AdsTotals = { days: number; cost: number; clicks: number; impressions: number; conversions: number }
type Row = { metrics?: { costMicros?: string; clicks?: string; impressions?: string; conversions?: number } }

const sum = (rows: Row[], days: number): AdsTotals => rows.reduce<AdsTotals>((t, r) => ({
  days,
  cost: t.cost + fromMicros(r.metrics?.costMicros),
  clicks: t.clicks + Number(r.metrics?.clicks ?? 0),
  impressions: t.impressions + Number(r.metrics?.impressions ?? 0),
  conversions: t.conversions + Number(r.metrics?.conversions ?? 0),
}), { days, cost: 0, clicks: 0, impressions: 0, conversions: 0 })

const Q = (during: string, campaignId?: string | null) =>
  campaignId
    ? `SELECT metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE campaign.id = ${campaignId} AND segments.date DURING ${during}`
    : `SELECT metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM customer WHERE segments.date DURING ${during}`

export const campaignIdOf = (resourceName?: string | null) => resourceName?.split("/").pop()?.replace(/\D/g, "") || null

/** Last 7 and 30 days, for the whole account (what the owner pays for), plus the campaign I built if any. */
export async function adsReport(g: Gads): Promise<{ account: [AdsTotals, AdsTotals]; campaign: [AdsTotals, AdsTotals] | null }> {
  const cid = campaignIdOf(g.account.campaign?.resourceName)
  const [a7, a30, c7, c30] = await Promise.all([
    g.search<Row>(Q("LAST_7_DAYS")),
    g.search<Row>(Q("LAST_30_DAYS")),
    cid ? g.search<Row>(Q("LAST_7_DAYS", cid)) : Promise.resolve(null),
    cid ? g.search<Row>(Q("LAST_30_DAYS", cid)) : Promise.resolve(null),
  ])
  return { account: [sum(a7, 7), sum(a30, 30)], campaign: c7 && c30 ? [sum(c7, 7), sum(c30, 30)] : null }
}
