// Pure rules for Facebook + Instagram ads (no database, no network), so they're easy to test:
// special ad categories, the claim check on ad copy, and the weekly tuning decisions.
import type { Goal, SpecialCategory } from "./graph"
import type { PlannedAd, TuneAction } from "./store"

/** Numbers in a text, as the insights check reads them (lib/insights.ts `numbers`). */
export const numbers = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, ""))

const CA = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "NU", "YT"])
const US = new Set(["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"])
export function countryOf(state: string | null | undefined): string | null {
  const s = (state ?? "").trim().toUpperCase()
  return CA.has(s) ? "CA" : US.has(s) ? "US" : null
}

// Meta's special ad categories: these businesses must declare one (and get broader targeting).
export function specialFor(businessType: string | null | undefined): SpecialCategory {
  const t = (businessType ?? "").toLowerCase()
  if (/real estate|realtor|realty|property|properties|apartment|rental|landlord|home ?builder|mortgage broker|housing/.test(t)) return "HOUSING"
  if (/recruit|staffing|employment|hiring agency|job board|headhunt/.test(t)) return "EMPLOYMENT"
  if (/loan|lend|credit|mortgage|bank|insurance|invest|wealth|financial|financ|tax prep|accountan|bookkeep|debt/.test(t)) return "FINANCIAL_PRODUCTS_SERVICES"
  return "NONE"
}

export const BANNED = /\b(best|#1|number one|no\.? ?1|leading|top[- ]rated|cheapest|lowest price|guarantee[ds]?|world[- ]class|award[- ]winning)\b|#1/i

export function clean(s: string, max: number): string {
  return s.replace(/\s+/g, " ").replace(/[—–]/g, ",").trim().slice(0, max)
}

/** Drops any ad that makes a claim we can't stand behind. Exported for tests. */
export function checkAds(ads: { primaryText: string; headline: string; description: string; imageHeadline: string }[], factText: string): PlannedAd[] {
  const allowed = new Set(numbers(factText))
  return ads.flatMap((a) => {
    const all = `${a.primaryText} ${a.headline} ${a.description} ${a.imageHeadline}`
    if (BANNED.test(all)) return []
    if (numbers(all).some((n) => !allowed.has(n))) return []
    if (/\[|\]/.test(all)) return []
    const out = { primaryText: clean(a.primaryText, 300), headline: clean(a.headline, 60), description: clean(a.description, 60), imageHeadline: clean(a.imageHeadline, 40) }
    if (!out.primaryText || !out.headline) return []
    return [out]
  }).slice(0, 3)
}


export const PAUSE_AFTER_DAYS_OF_BUDGET = 2
const SHIFT = 0.2
const MIN_DAILY = 1

export type TuneInput = {
  currency: string
  capDaily: number | null
  campaigns: { rowId: string; name: string; adSetId: string; dailyBudget: number; goal: Goal; ads: { adId: string; spend: number; results: number }[] }[]
}

const r2 = (n: number) => Math.round(n * 100) / 100
const money = (n: number, cur: string) => `${r2(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} ${cur}`
const unit = (g: Goal, n: number) => (g === "OUTCOME_LEADS" ? (n === 1 ? "lead" : "leads") : n === 1 ? "click" : "clicks")

/** Pure: what to change, and the plain-English summary. Every number comes from the input. */
export function decideTuning(t: TuneInput): { actions: TuneAction[]; summary: string[] } {
  const actions: TuneAction[] = []
  const summary: string[] = []
  for (const c of t.campaigns) {
    const spend = c.ads.reduce((s, a) => s + a.spend, 0)
    const results = c.ads.reduce((s, a) => s + a.results, 0)
    summary.push(`“${c.name}”: ${money(spend, t.currency)} spent, ${results} ${unit(c.goal, results)}${results ? `, ${money(spend / results, t.currency)} each` : ""}.`)
    const limit = c.dailyBudget * PAUSE_AFTER_DAYS_OF_BUDGET
    const losers = c.ads.filter((a) => a.results === 0 && a.spend >= limit)
    const keep = c.ads.length - losers.length
    // Never pause every ad: if they all lost, leave the campaign for the owner to decide.
    if (keep >= 1) for (const a of losers) actions.push({ kind: "pause_ad", campaignRowId: c.rowId, adId: a.adId, spend: r2(a.spend), results: 0, why: `It spent ${money(a.spend, t.currency)} with no ${unit(c.goal, 2)}, while the other ads in it did better.` })
  }

  const budgets = new Map(t.campaigns.map((c) => [c.rowId, c.dailyBudget]))
  const scored = t.campaigns.map((c) => {
    const spend = c.ads.reduce((s, a) => s + a.spend, 0)
    const results = c.ads.reduce((s, a) => s + a.results, 0)
    return { c, spend, results, cpr: results ? spend / results : Infinity }
  }).filter((x) => x.spend > 0)
  if (scored.length >= 2) {
    const best = scored.filter((x) => x.results > 0).sort((a, b) => a.cpr - b.cpr)[0]
    const worst = [...scored].sort((a, b) => b.cpr - a.cpr)[0]
    if (best && worst && best.c.rowId !== worst.c.rowId && best.c.goal === worst.c.goal && worst.spend >= worst.c.dailyBudget && best.cpr * 1.5 < worst.cpr) {
      const move = r2(Math.max(MIN_DAILY, worst.c.dailyBudget * SHIFT))
      if (worst.c.dailyBudget - move >= MIN_DAILY) {
        budgets.set(worst.c.rowId, r2(worst.c.dailyBudget - move))
        budgets.set(best.c.rowId, r2(best.c.dailyBudget + move))
      }
    }
  }
  // Inside the cap, always.
  const total = [...budgets.values()].reduce((s, b) => s + b, 0)
  if (t.capDaily !== null && total > t.capDaily + 0.001) {
    const k = t.capDaily / total
    for (const [id, b] of budgets) budgets.set(id, Math.max(MIN_DAILY, Math.floor(b * k * 100) / 100))
  }
  for (const c of t.campaigns) {
    const to = budgets.get(c.rowId)!
    if (Math.abs(to - c.dailyBudget) < 0.01) continue
    const s = scored.find((x) => x.c.rowId === c.rowId)
    const why = t.capDaily !== null && total > t.capDaily + 0.001
      ? `Keeps you inside your budget of ${money(t.capDaily, t.currency)} a day.`
      : to > c.dailyBudget
        ? `It gets ${unit(c.goal, 2)} for less${s && s.results ? ` (${money(s.cpr, t.currency)} each)` : ""}.`
        : `It costs more per result${s && s.results ? ` (${money(s.cpr, t.currency)} each)` : s ? ` (${money(s.spend, t.currency)} with none)` : ""}.`
    actions.push({ kind: "budget", campaignRowId: c.rowId, adSetId: c.adSetId, from: c.dailyBudget, to, why })
  }
  return { actions, summary }
}

