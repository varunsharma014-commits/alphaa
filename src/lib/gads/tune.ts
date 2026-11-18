// Weekly tune-up of the campaign I built (cron /api/cron/ads-tune, Growth + connected):
// block searches that cost money and never brought a lead, pause keywords that spend with no
// leads, and bring the budget back under the owner's cap if they lowered it. Real numbers
// only. autopilot.ads "budget" = I act (inside the cap), "each" (default) = I propose and the
// owner taps Apply. I never raise a budget and never turn a campaign on.
import { metaMonthlyCommitment } from "@/lib/metaads/plan"
import { getAgentSettings } from "@/lib/agent/settings"
import { budgetAmountOp, fromMicros, keywordStatusOp, negativeKeywordOp } from "./api"
import { gadsFor, type Gads } from "./client"
import { createTune, getTune, latestTune, logChange, saveGadsAccount, saveTune, type Tune, type TuneAction } from "./store"
import { campaignIdOf } from "./report"
import { money } from "./plan"
import { dailyFromMonthly, decideTuning, monthlyFromDaily, type KeywordRow, type TermRow } from "./rules"

const DAYS = 30

type TermR = { searchTermView?: { searchTerm?: string; status?: string }; metrics?: { costMicros?: string; clicks?: string; conversions?: number } }
type KwR = { adGroupCriterion?: { resourceName?: string; status?: string; keyword?: { text?: string } }; metrics?: { costMicros?: string; clicks?: string; conversions?: number } }

async function gather(g: Gads, cid: string) {
  const [terms, kws, conv, tot] = await Promise.all([
    g.search<TermR>(`SELECT search_term_view.search_term, search_term_view.status, metrics.cost_micros, metrics.clicks, metrics.conversions FROM search_term_view WHERE campaign.id = ${cid} AND segments.date DURING LAST_30_DAYS AND metrics.cost_micros > 0`),
    g.search<KwR>(`SELECT ad_group_criterion.resource_name, ad_group_criterion.status, ad_group_criterion.keyword.text, metrics.cost_micros, metrics.clicks, metrics.conversions FROM keyword_view WHERE campaign.id = ${cid} AND segments.date DURING LAST_30_DAYS`),
    g.search<{ conversionAction?: { id?: string } }>("SELECT conversion_action.id FROM conversion_action WHERE conversion_action.status = 'ENABLED'"),
    g.search<{ metrics?: { costMicros?: string; clicks?: string; conversions?: number } }>(`SELECT metrics.cost_micros, metrics.clicks, metrics.conversions FROM campaign WHERE campaign.id = ${cid} AND segments.date DURING LAST_30_DAYS`),
  ])
  // search_term_view has a row per ad group; merge them by search term.
  const byTerm = new Map<string, TermRow>()
  for (const r of terms) {
    const term = r.searchTermView?.searchTerm
    if (!term) continue
    const cur = byTerm.get(term) ?? { term, status: r.searchTermView?.status ?? "NONE", cost: 0, clicks: 0, conversions: 0 }
    cur.cost += fromMicros(r.metrics?.costMicros); cur.clicks += Number(r.metrics?.clicks ?? 0); cur.conversions += Number(r.metrics?.conversions ?? 0)
    byTerm.set(term, cur)
  }
  const keywords: KeywordRow[] = kws.filter((r) => r.adGroupCriterion?.resourceName && r.adGroupCriterion.keyword?.text).map((r) => ({
    criterion: r.adGroupCriterion!.resourceName!, text: r.adGroupCriterion!.keyword!.text!, status: r.adGroupCriterion!.status ?? "UNKNOWN",
    cost: fromMicros(r.metrics?.costMicros), clicks: Number(r.metrics?.clicks ?? 0), conversions: Number(r.metrics?.conversions ?? 0),
  }))
  const window = tot.reduce((t, r) => ({ days: DAYS, cost: t.cost + fromMicros(r.metrics?.costMicros), clicks: t.clicks + Number(r.metrics?.clicks ?? 0), conversions: t.conversions + Number(r.metrics?.conversions ?? 0) }), { days: DAYS, cost: 0, clicks: 0, conversions: 0 })
  return { terms: Array.from(byTerm.values()), keywords, tracking: conv.length > 0, window }
}

/** One tune-up pass. Skips if the last pass was under 6 days ago. */
export async function runTune(userId: string, opts: { force?: boolean } = {}): Promise<Tune | null> {
  const last = await latestTune(userId)
  if (!opts.force && last && Date.now() - Date.parse(last.at) < 6 * 86_400_000) return null
  const g = await gadsFor(userId)
  const c = g.account.campaign
  const cid = campaignIdOf(c?.resourceName)
  if (!c || !cid) return null
  const s = await getAgentSettings(userId)
  // One monthly cap covers Google and Meta: leave out what live Meta campaigns are set to spend.
  const cap = s.autopilot?.adBudget != null ? Math.max(0, s.autopilot.adBudget - (await metaMonthlyCommitment(userId).catch(() => 0))) : null
  const mode = s.autopilot?.ads ?? "each"
  const cur = g.account.currency ?? "USD"
  const data = await gather(g, cid)

  const actions: TuneAction[] = decideTuning({ daily: c.daily, tracking: data.tracking, terms: data.terms, keywords: data.keywords }).map((d) =>
    d.kind === "negative"
      ? { ...d, why: `“${d.term}” cost ${money(d.cost, cur)} over ${d.clicks} clicks in ${DAYS} days and brought no leads.` }
      : { ...d, why: `“${d.text}” cost ${money(d.cost, cur)} over ${d.clicks} clicks in ${DAYS} days and brought no leads.` })
  // The owner lowered their cap below what the campaign spends: bring it back under (never up).
  if (cap && monthlyFromDaily(c.daily) > cap + 0.01) {
    const to = dailyFromMonthly(cap)
    actions.push({ kind: "lower_budget", from: c.daily, to, why: `Your monthly cap is ${money(cap, cur)}, so the most I can spend is ${money(to, cur)} a day.` })
  }

  const t = await createTune(userId, { at: new Date().toISOString(), status: actions.length ? "proposed" : "nothing", campaign: c.resourceName, currency: cur, window: data.window, tracking: data.tracking, actions })
  if (actions.length && mode === "budget") return applyTune(userId, t.id, "agent")
  return t
}

/** Make the changes in a tune-up (the owner's tap, or autopilot "budget"). */
export async function applyTune(userId: string, tuneId: string, by: "owner" | "agent" = "owner"): Promise<Tune> {
  const t = await getTune(userId, tuneId)
  if (!t || t.status !== "proposed") throw new Error("That tune-up isn’t waiting any more.")
  const g = await gadsFor(userId)
  const c = g.account.campaign
  if (!c || c.resourceName !== t.campaign) throw new Error("That campaign isn’t connected any more.")
  const created: string[] = []
  try {
    const neg = t.actions.flatMap((a) => (a.kind === "negative" ? [a] : []))
    if (neg.length) {
      const names = await g.mutate("campaignCriteria", neg.map((a) => negativeKeywordOp(c.resourceName, a.term, "EXACT")))
      created.push(...names.filter(Boolean))
      await logChange(userId, `Stopped your ads showing for ${neg.length} ${neg.length === 1 ? "search" : "searches"} that cost money and brought no leads`, { op: "add_negatives", customerId: g.customerId, resources: names, ops: neg.length, undo: "remove_negatives", by, detail: neg.map((a) => a.term).join(", ").slice(0, 400) })
    }
    const pause = t.actions.flatMap((a) => (a.kind === "pause_keyword" ? [a] : []))
    if (pause.length) {
      await g.mutate("adGroupCriteria", pause.map((a) => keywordStatusOp(a.criterion, "PAUSED")))
      await logChange(userId, `Paused ${pause.length} ${pause.length === 1 ? "keyword" : "keywords"} that spent with no leads`, { op: "pause_keywords", customerId: g.customerId, resources: pause.map((a) => a.criterion), ops: pause.length, undo: "enable_keywords", by, detail: pause.map((a) => a.text).join(", ").slice(0, 400) })
    }
    const low = t.actions.find((a): a is Extract<TuneAction, { kind: "lower_budget" }> => a.kind === "lower_budget")
    if (low && low.to < c.daily) {
      await g.mutate("campaignBudgets", [budgetAmountOp(c.budget, low.to)])
      await saveGadsAccount(userId, { campaign: { ...c, daily: low.to } })
      await logChange(userId, `Lowered your daily ad budget from ${money(low.from, t.currency)} to ${money(low.to, t.currency)} to stay inside your cap`, { op: "lower_budget", customerId: g.customerId, resources: [c.budget], ops: 1, undo: null, by })
    }
    const done = { ...t, status: "applied" as const, created }
    await saveTune(userId, done)
    return done
  } catch (err) {
    const failed = { ...t, status: "failed" as const, created, error: err instanceof Error ? err.message.slice(0, 300) : "failed" }
    await saveTune(userId, failed)
    return failed
  }
}
