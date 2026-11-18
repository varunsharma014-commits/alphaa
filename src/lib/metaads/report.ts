// Real Facebook + Instagram results for the ads thread: 7 and 30 days of spend, results and cost
// per lead, only for campaigns I built. Cached 15 minutes per brand so opening the thread is cheap.
import { insights, totalsOf, type Totals } from "./graph"
import { countLeads, decToken, getAccess, listCampaigns, liveCampaigns } from "./store"

export type Window = Totals & { leads: number; clicksResults: number; costPerLead: number | null }
export type MetaReport = { currency: string; d7: Window; d30: Window; campaigns: number; at: string }

const cache = new Map<string, { at: number; r: MetaReport | null }>()
const TTL = 15 * 60_000

export async function metaReport(userId: string, opts: { fresh?: boolean } = {}): Promise<MetaReport | null> {
  const hit = cache.get(userId)
  if (!opts.fresh && hit && Date.now() - hit.at < TTL) return hit.r
  const r = await build(userId).catch((err) => {
    console.error("[metaads] report", err instanceof Error ? err.message : "failed")
    return null
  })
  cache.set(userId, { at: Date.now(), r })
  return r
}

async function build(userId: string): Promise<MetaReport | null> {
  const [access, all] = await Promise.all([getAccess(userId), listCampaigns(userId, 50)])
  const live = liveCampaigns(all).filter((c) => c.enabledAt)
  if (!access || !live.length) return null
  const token = decToken(access)
  const out: Record<7 | 30, Window> = { 7: empty(), 30: empty() }
  for (const days of [7, 30] as const) {
    for (const c of live) {
      const rows = await insights(token, c.built!.campaignId!, "campaign", days)
      const t = totalsOf(rows, c.plan.goal)
      const w = out[days]
      w.spend += t.spend; w.impressions += t.impressions; w.clicks += t.clicks
      if (c.plan.goal === "OUTCOME_LEADS") w.leads += t.results
      else w.clicksResults += t.results
      w.results += t.results
    }
    // Leads I collected from the forms count too (Meta's count can lag a day).
    const stored = await countLeads(userId, days)
    out[days].leads = Math.max(out[days].leads, stored)
    out[days].costPerLead = out[days].leads ? Math.round((out[days].spend / out[days].leads) * 100) / 100 : null
  }
  return { currency: live[0].currency, d7: out[7], d30: out[30], campaigns: live.length, at: new Date().toISOString() }
}

const empty = (): Window => ({ spend: 0, impressions: 0, clicks: 0, results: 0, leads: 0, clicksResults: 0, costPerLead: null })

export function forget(userId: string) { cache.delete(userId) }
