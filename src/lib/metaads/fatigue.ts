// Creative fatigue for my Facebook + Instagram ads: per-ad daily results since each campaign went
// live, judged by the pure rule in rules.ts (`detectFatigue`). A tired ad becomes one note in the
// change log (ads_change kind "fatigue", once per ad per week), which the Ads page and the Briefing
// show. It never pauses or edits anything: the weekly tune keeps its own rules.
import { adFrequency, dailyAdInsights, resultsOf } from "./graph"
import { decToken, getAccess, listCampaigns, logChange, recentFatigueAdIds } from "./store"
import { detectFatigue, type AdDay, type FatigueFlag, type FatigueInput } from "./rules"
export { detectFatigue, FATIGUE } from "./rules"

export type TiredAd = FatigueFlag & { campaignRowId: string; campaignName: string; headline: string }
export type FatigueReport = { at: string; ads: TiredAd[] }

const cache = new Map<string, { at: number; r: FatigueReport | null }>()
const TTL = 6 * 3_600_000
const MAX_DAYS = 90

/** Tired ads for one brand (cached 6h). New ones are noted in the change log. */
export async function metaFatigue(userId: string, opts: { fresh?: boolean } = {}): Promise<FatigueReport | null> {
  const hit = cache.get(userId)
  if (!opts.fresh && hit && Date.now() - hit.at < TTL) return hit.r
  const r = await build(userId).catch((err) => {
    console.error("[metaads] fatigue", err instanceof Error ? err.message : "failed")
    return null
  })
  cache.set(userId, { at: Date.now(), r })
  return r
}

async function build(userId: string): Promise<FatigueReport | null> {
  const [access, all] = await Promise.all([getAccess(userId), listCampaigns(userId, 50)])
  const live = all.filter((c) => c.status === "active" && c.built?.campaignId && c.enabledAt)
  if (!access || !live.length) return null
  const token = decToken(access)
  const ads: TiredAd[] = []
  for (const c of live) {
    const start = new Date(Math.max(Date.parse(c.enabledAt!), Date.now() - MAX_DAYS * 86_400_000)).toISOString().slice(0, 10)
    const [rows, freq] = await Promise.all([dailyAdInsights(token, c.built!.campaignId!, start), adFrequency(token, c.built!.campaignId!, 30).catch(() => new Map<string, number>())])
    const builtAds = c.built?.ads ?? []
    const input: FatigueInput[] = builtAds.map((a, i) => ({
      adId: a.adId,
      label: `Ad ${i + 1} in “${c.name}”`,
      goal: c.plan.goal,
      frequency: freq.has(a.adId) ? freq.get(a.adId)! : null,
      days: rows.filter((r) => r.ad_id === a.adId && r.date_start).map((r): AdDay => ({
        date: r.date_start!, spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), linkClicks: Number(r.inline_link_clicks ?? 0), results: resultsOf(r, c.plan.goal),
      })),
    }))
    for (const f of detectFatigue(input, c.currency)) {
      const i = builtAds.findIndex((a) => a.adId === f.adId)
      ads.push({ ...f, campaignRowId: c.id, campaignName: c.name, headline: c.plan.ads[i]?.headline ?? "" })
    }
  }
  if (ads.length) {
    const noted = await recentFatigueAdIds(userId, 7)
    for (const a of ads.filter((x) => !noted.has(x.adId))) {
      await logChange(userId, {
        kind: "fatigue", campaignRowId: a.campaignRowId, objectId: a.adId, by: "autopilot",
        what: `noticed ${a.label.replace(/^Ad/, "ad")} is wearing out`,
        why: `${a.why} I’d test a fresh opening hook over the same offer. Nothing was changed.`,
      })
    }
  }
  return { at: new Date().toISOString(), ads }
}

export function forgetFatigue(userId: string) { cache.delete(userId) }
