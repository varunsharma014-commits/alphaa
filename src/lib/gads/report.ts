// Spend, impressions, clicks, conversions and cost per lead (KPIs via gadsKpis), straight from Google Ads (GAQL), for the
// "Ads" thread. Every number shown comes from these rows.
import { kpisOf, type Kpis } from "@/lib/ads-kpis"
import { fromMicros } from "./api"
import type { Gads } from "./client"

/** value = metrics.conversions_value, allValue = metrics.all_conversions_value (for ROAS, lib/roas). */
export type AdsTotals = { days: number; cost: number; clicks: number; impressions: number; conversions: number; value?: number; allValue?: number }
/** CTR, CPC, CPM, conversion rate (conversions ÷ clicks) and cost per conversion, from the same rows. */
export const gadsKpis = (t: AdsTotals): Kpis => kpisOf({ spend: t.cost, impressions: t.impressions, clicks: t.clicks, conversions: t.conversions })
type Metrics = { costMicros?: string; clicks?: string; impressions?: string; conversions?: number; conversionsValue?: number; allConversionsValue?: number; valuePerConversion?: number }
type Row = { metrics?: Metrics }

export const sumRows = (rows: Row[], days: number): AdsTotals => rows.reduce<AdsTotals>((t, r) => ({
  days,
  cost: t.cost + fromMicros(r.metrics?.costMicros),
  clicks: t.clicks + Number(r.metrics?.clicks ?? 0),
  impressions: t.impressions + Number(r.metrics?.impressions ?? 0),
  conversions: t.conversions + Number(r.metrics?.conversions ?? 0),
  value: (t.value ?? 0) + Number(r.metrics?.conversionsValue ?? 0),
  allValue: (t.allValue ?? 0) + Number(r.metrics?.allConversionsValue ?? 0),
}), { days, cost: 0, clicks: 0, impressions: 0, conversions: 0, value: 0, allValue: 0 })
const sum = sumRows

const FIELDS = "metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.conversions_value, metrics.all_conversions_value"
const Q = (during: string, campaignId?: string | null) =>
  campaignId
    ? `SELECT ${FIELDS} FROM campaign WHERE campaign.id = ${campaignId} AND segments.date DURING ${during}`
    : `SELECT ${FIELDS} FROM customer WHERE segments.date DURING ${during}`

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

// ── ROAS reads (lib/roas/sources.ts) ─────────────────────────────────────────
export type CampaignRow = AdsTotals & { id: string; name: string; status: string; valuePerConversion: number | null }
type CRow = Row & { campaign?: { id?: string; name?: string; status?: string } }

/** Every campaign that spent in the window, with conversion values (metrics.value_per_conversion as Google reports it). */
export async function campaignRows(g: Gads, days: 7 | 30): Promise<CampaignRow[]> {
  const rows = await g.search<CRow>(`SELECT campaign.id, campaign.name, campaign.status, ${FIELDS}, metrics.value_per_conversion FROM campaign WHERE segments.date DURING LAST_${days}_DAYS AND metrics.cost_micros > 0`)
  const by = new Map<string, CRow[]>()
  for (const r of rows) { const id = String(r.campaign?.id ?? ""); if (id) by.set(id, [...(by.get(id) ?? []), r]) }
  return [...by.entries()].map(([id, rs]) => {
    const t = sum(rs, days)
    return { ...t, id, name: rs[0].campaign?.name ?? `Campaign ${id}`, status: rs[0].campaign?.status ?? "UNKNOWN", valuePerConversion: t.conversions > 0 ? Math.round(((t.value ?? 0) / t.conversions) * 100) / 100 : null }
  })
}

type ARow = { conversionAction?: { resourceName?: string; name?: string; type?: string; category?: string; includeInConversionsMetric?: boolean; valueSettings?: { defaultValue?: number; alwaysUseDefaultValue?: boolean } } }
export type ConversionActionInfo = { resourceName: string; name: string; type: string; category: string; includeInConversionsMetric: boolean; defaultValue: number; alwaysUseDefaultValue: boolean }

/** Enabled conversion actions with their value settings: tells real sale values from fixed ones (lib/roas/rules.ts gadsValueKind). */
export async function conversionActions(g: Gads): Promise<ConversionActionInfo[]> {
  const rows = await g.search<ARow>("SELECT conversion_action.resource_name, conversion_action.name, conversion_action.type, conversion_action.category, conversion_action.include_in_conversions_metric, conversion_action.value_settings.default_value, conversion_action.value_settings.always_use_default_value FROM conversion_action WHERE conversion_action.status = 'ENABLED'")
  return rows.filter((r) => r.conversionAction?.resourceName).map((r) => {
    const a = r.conversionAction!
    return { resourceName: a.resourceName!, name: a.name ?? "", type: a.type ?? "", category: a.category ?? "", includeInConversionsMetric: a.includeInConversionsMetric !== false, defaultValue: Number(a.valueSettings?.defaultValue ?? 0), alwaysUseDefaultValue: a.valueSettings?.alwaysUseDefaultValue === true }
  })
}
