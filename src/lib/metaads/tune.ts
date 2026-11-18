// Weekly tuning of my Facebook + Instagram campaigns from the last 7 days of real results:
//  - pause an ad that spent 2x its campaign's daily budget with no result (never the last one running)
//  - move 20% of daily budget from a clearly worse campaign to a better one (total unchanged)
//  - if the owner lowered their cap, scale budgets down to fit; never above it
// autopilot.ads "budget" = I apply it and report; "each" (default) = I propose and wait for a tap.
import { db } from "@/lib/db"
import { countUsage } from "@/lib/usage"
import { getAgentSettings } from "@/lib/agent/settings"
import { insights, resultsOf, setDailyBudget, setStatus, type InsightRow } from "./graph"
import { decToken, getAccess, getTune, listCampaigns, logChange, saveCampaign, saveTune, type TuneAction, type TunePass } from "./store"
import { decideTuning, type TuneInput } from "./rules"
export { decideTuning, PAUSE_AFTER_DAYS_OF_BUDGET } from "./rules"
import { dailyFromMonthly, metaMonthlyCap } from "./plan"

/** The weekly pass for one brand (cron). Returns the stored pass, or null when nothing ran. */
export async function weeklyTune(userId: string): Promise<TunePass | null> {
  const access = await getAccess(userId)
  if (!access) return null
  const live = (await listCampaigns(userId, 50)).filter((c) => c.status === "active" && c.built?.campaignId)
  if (!live.length) return null
  const token = decToken(access)
  const input: TuneInput = { currency: live[0].currency, capDaily: null, campaigns: [] }
  const cap = await metaMonthlyCap(userId)
  input.capDaily = cap !== null ? dailyFromMonthly(cap) : null
  for (const c of live) {
    const rows: InsightRow[] = await insights(token, c.built!.campaignId!, "ad", 7).catch(() => [])
    const ads = (c.built?.ads ?? []).map((a) => {
      const r = rows.filter((x) => x.ad_id === a.adId)
      return { adId: a.adId, spend: r.reduce((s, x) => s + Number(x.spend ?? 0), 0), results: r.reduce((s, x) => s + resultsOf(x, c.plan.goal), 0) }
    })
    input.campaigns.push({ rowId: c.id, name: c.name, adSetId: c.built!.adSetId!, dailyBudget: c.plan.dailyBudget, goal: c.plan.goal, ads })
  }
  const { actions, summary } = decideTuning(input)
  const mode = (await getAgentSettings(userId)).autopilot?.ads === "budget" ? "budget" : "each"
  const pass = await saveTune(userId, { at: new Date().toISOString(), status: actions.length ? "proposed" : "nothing", mode, actions, summary, currency: input.currency })
  if (actions.length && mode === "budget") return applyTune(userId, pass.id, "autopilot")
  return pass
}

/** Apply a stored pass (owner tap, or autopilot "budget"). */
export async function applyTune(userId: string, id: string, by: "owner" | "autopilot"): Promise<TunePass | null> {
  const [pass, access] = await Promise.all([getTune(userId, id), getAccess(userId)])
  if (!pass || pass.status !== "proposed" || !access) return pass
  const token = decToken(access)
  const campaigns = await listCampaigns(userId, 50)
  // Re-check the cap at apply time: the owner may have lowered it since.
  const cap = await metaMonthlyCap(userId)
  const capDaily = cap !== null ? dailyFromMonthly(cap) : null
  const after = new Map(campaigns.filter((c) => c.status === "active").map((c) => [c.id, c.plan.dailyBudget]))
  for (const a of pass.actions) if (a.kind === "budget") after.set(a.campaignRowId, a.to)
  if (capDaily !== null && [...after.values()].reduce((s, b) => s + b, 0) > capDaily + 0.001) {
    pass.status = "dismissed"
    pass.summary = [...pass.summary, "I didn’t make these changes: they would go over your budget now."]
    return saveTune(userId, pass)
  }
  const done: TuneAction[] = []
  for (const a of pass.actions) {
    const c = campaigns.find((x) => x.id === a.campaignRowId)
    if (!c) continue
    try {
      if (a.kind === "pause_ad") {
        await setStatus(token, a.adId, "PAUSED")
        await logChange(userId, { campaignRowId: c.id, objectId: a.adId, what: `paused an ad in “${c.name}”`, why: a.why, by, before: "active", after: "paused" })
      } else {
        await setDailyBudget(token, a.adSetId, a.to, c.currency)
        c.plan.dailyBudget = a.to
        await saveCampaign(userId, c)
        await logChange(userId, { campaignRowId: c.id, objectId: a.adSetId, what: `changed the daily budget of “${c.name}” from ${a.from} to ${a.to} ${c.currency}`, why: a.why, by, before: a.from, after: a.to })
      }
      countUsage(userId, "ads_op")
      done.push(a)
    } catch (err) {
      console.error("[metaads] tune", err instanceof Error ? err.message : "failed")
    }
  }
  pass.status = "applied"
  pass.actions = done
  return saveTune(userId, pass)
}

export async function dismissTune(userId: string, id: string): Promise<TunePass | null> {
  const pass = await getTune(userId, id)
  if (!pass || pass.status !== "proposed") return pass
  pass.status = "dismissed"
  return saveTune(userId, pass)
}

/** Brands with a Meta campaign in these states (the cron's list). */
export async function brandsWithCampaigns(statuses: ("active" | "paused")[]): Promise<string[]> {
  const rows = await db.mockActivity.findMany({ where: { type: "meta_ads_campaign", OR: statuses.map((s) => ({ metadata: { path: ["status"], equals: s } })) }, select: { userId: true }, take: 2000 })
  return Array.from(new Set(rows.map((r) => r.userId)))
}
