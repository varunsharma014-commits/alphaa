// Pure: totals, KPIs and the short plain-English summary for the shareable ad report. Every
// number in a sentence comes from the rows passed in; nothing is compared with anything we don't
// have (no "better than last month" without last month's numbers, no ROAS without revenue).
import { kpisOf, type Kpis } from "@/lib/ads-kpis"
import { fmtMoney } from "@/lib/ad-rules/engine"

export type ReportRow = {
  platform: "Facebook & Instagram" | "Google" | "LinkedIn"
  name: string
  status: string
  currency: string
  spend: number
  impressions: number
  clicks: number
  /** Leads / conversions the platform counted. */
  conversions: number
  /** Revenue from conversion values, null when not tracked. */
  revenue: number | null
}
export type Totals = { spend: number; impressions: number; clicks: number; conversions: number; revenue: number | null }
export type ReportKpis = Kpis & { roas: number | null }

const r2 = (n: number) => Math.round(n * 100) / 100

/** Sums rows of ONE currency. Revenue is only summed when every row with spend has it. */
export function totalsOf(rows: ReportRow[]): Totals {
  const t = rows.reduce((a, r) => ({ spend: a.spend + r.spend, impressions: a.impressions + r.impressions, clicks: a.clicks + r.clicks, conversions: a.conversions + r.conversions }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 })
  const paid = rows.filter((r) => r.spend > 0)
  const revenue = paid.length && paid.every((r) => r.revenue != null) ? paid.reduce((s, r) => s + (r.revenue ?? 0), 0) : null
  return { spend: r2(t.spend), impressions: t.impressions, clicks: t.clicks, conversions: r2(t.conversions), revenue: revenue === null ? null : r2(revenue) }
}

export function reportKpis(t: Totals): ReportKpis {
  return { ...kpisOf(t), roas: t.revenue != null && t.spend > 0 ? r2(t.revenue / t.spend) : null }
}

const count = (n: number, one: string, many: string) => `${Math.round(n).toLocaleString("en-US")} ${Math.round(n) === 1 ? one : many}`

/** A few sentences, first person, no dashes, every number from the rows. */
/** `period` is already phrased: "In November 2026" or "From Nov 1, 2026 to Nov 7, 2026" (lib/ad-report/token.ts periodPhrase). */
export function summarize(o: { period: string; rows: ReportRow[]; changes: number; currencies: string[] }): string[] {
  const out: string[] = []
  const paid = o.rows.filter((r) => r.spend > 0)
  if (!paid.length) return [`${o.period}, your ads didn’t spend anything.${o.changes ? ` I made ${count(o.changes, "change", "changes")}, listed below.` : ""}`]
  if (o.currencies.length > 1) {
    out.push(`Your ad accounts bill in ${o.currencies.join(" and ")}, so I show each platform on its own instead of adding them up.`)
  } else {
    const cur = o.currencies[0] ?? "USD"
    const t = totalsOf(o.rows)
    const k = reportKpis(t)
    out.push(t.conversions > 0
      ? `${o.period}, your ads spent ${fmtMoney(t.spend, cur)} and brought ${count(t.conversions, "lead", "leads")}, ${fmtMoney(r2(t.spend / t.conversions), cur)} each.`
      : `${o.period}, your ads spent ${fmtMoney(t.spend, cur)} and brought no leads that the ad platforms counted.`)
    if (t.impressions > 0 && k.ctr !== null) out.push(`People clicked ${k.ctr.toLocaleString("en-US")}% of the times they saw an ad: ${count(t.clicks, "click", "clicks")} from ${count(t.impressions, "view", "views")}${k.cpc !== null ? `, ${fmtMoney(k.cpc, cur)} a click` : ""}.`)
    if (k.roas !== null && t.revenue !== null) out.push(`Sales the ad platforms tracked were worth ${fmtMoney(t.revenue, cur)}, ${k.roas.toLocaleString("en-US")} times what the ads cost.`)
  }
  const withLeads = paid.filter((r) => r.conversions > 0)
  if (withLeads.length >= 2) {
    const best = [...withLeads].sort((a, b) => a.spend / a.conversions - b.spend / b.conversions)[0]
    out.push(`“${best.name}” brought leads for the least: ${fmtMoney(r2(best.spend / best.conversions), best.currency)} each.`)
  }
  const none = paid.filter((r) => r.conversions === 0 && r.spend >= 1)
  if (none.length && withLeads.length) out.push(`${none.length === 1 ? `“${none[0].name}” spent ${fmtMoney(r2(none[0].spend), none[0].currency)} with no leads.` : `${none.length} campaigns spent with no leads.`}`)
  if (o.changes) out.push(`I made ${count(o.changes, "change", "changes")} to your ads in this period. Each one is listed below.`)
  return out
}
