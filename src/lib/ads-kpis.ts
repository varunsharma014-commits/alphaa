// Pure ad KPIs from totals the platforms already return (no database, no network). Shared by the
// Google and Meta reports and the Ads page. A rate is null when its denominator is 0, never a guess.
// No ROAS: neither platform gets conversion values from us, so it would be made up.

export type KpiInput = { spend: number; impressions: number; clicks: number; conversions: number }
export type Kpis = {
  /** clicks ÷ impressions, as a percentage (0-100). */
  ctr: number | null
  /** spend ÷ clicks. */
  cpc: number | null
  /** spend per 1,000 impressions. */
  cpm: number | null
  /** conversions ÷ clicks, as a percentage (0-100). */
  convRate: number | null
  /** spend ÷ conversions. */
  costPerConversion: number | null
}

const div = (a: number, b: number) => (b > 0 && Number.isFinite(a) ? a / b : null)
const r = (n: number | null, dp: number) => (n === null ? null : Math.round(n * 10 ** dp) / 10 ** dp)

export function kpisOf(t: KpiInput): Kpis {
  const ctr = div(t.clicks, t.impressions)
  const conv = div(t.conversions, t.clicks)
  return {
    ctr: r(ctr === null ? null : ctr * 100, 2),
    cpc: r(div(t.spend, t.clicks), 2),
    cpm: r(((x) => (x === null ? null : x * 1000))(div(t.spend, t.impressions)), 2),
    convRate: r(conv === null ? null : conv * 100, 2),
    costPerConversion: r(div(t.spend, t.conversions), 2),
  }
}

/** "1.23%" or null. */
export const pct = (n: number | null) => (n === null ? null : `${n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 2 : 1 })}%`)
