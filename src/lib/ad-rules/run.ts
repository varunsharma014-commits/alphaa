// The owner's ad rules against real numbers (DB + Meta/Google reads), then the changes. The
// decisions are pure (engine.ts); this file only gathers numbers and applies what it decided.
// Runs once a day per brand (/api/cron/ad-rules, deduped by settings `adRulesRun`), or as a dry
// run from the Ads page ("Check my rules now" never changes anything).
// Every change: counted as `ad_change` (lib/quotas.ts), logged as an `ads_change` row with a
// rule mark (Ads → What I changed + Briefing ledger) and undoable from there.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { hasGrowth } from "@/lib/billing"
import { consentCurrent } from "@/lib/auto-approve-text"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { checkQuota } from "@/lib/quotas"
import { checkAdAccount } from "@/lib/ad-accounts"
import { adStatuses, insightsRange, setDailyBudget, setStatus, type InsightRow } from "@/lib/metaads/graph"
import { decToken, getAccess, getCampaign, listCampaigns, liveCampaigns, logChange as metaLog, saveCampaign, type MetaCampaign } from "@/lib/metaads/store"
import { setLive } from "@/lib/metaads/ops"
import { forget } from "@/lib/metaads/report"
import { metaMonthlyCommitment } from "@/lib/metaads/plan"
import { gadsAvailable } from "@/lib/gads/oauth"
import { gadsFor } from "@/lib/gads/client"
import { budgetAmountOp, campaignStatusOp, fromMicros } from "@/lib/gads/api"
import { campaignIdOf } from "@/lib/gads/report"
import { setCampaignStatus } from "@/lib/gads/create"
import { getGadsAccount, logChange as gadsLog, saveGadsAccount } from "@/lib/gads/store"
import { dailyFromMonthly, monthlyFromDaily } from "@/lib/gads/rules"
import { metaPurchase } from "@/lib/roas/rules"
import { trackedOwnValues } from "@/lib/ad-report/revenue"
import { describeRule, evaluateRules, fmtMoney, type AdRule, type RuleAction, type RuleActionKind, type RuleCheck, type RuleTarget, type RuleWindow, type Stats } from "./engine"

export type RuleUndo =
  | { kind: "meta_ad"; rowId: string; adId: string }
  | { kind: "meta_campaign"; rowId: string }
  | { kind: "meta_budget"; rowId: string; adSetId: string; to: number }
  | { kind: "google_campaign" }
  | { kind: "google_budget"; to: number }
/** Stored on the ads_change row of every rule action. */
export type RuleMark = { ruleId: string; key: string; targetKey: string; action: RuleActionKind; undo: RuleUndo | null; undoneAt?: string | null }

const DAY = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const leadsOf = (r: InsightRow) => Number(r.actions?.find((a) => a.action_type === "lead")?.value ?? 0)
const statsOf = (rows: InsightRow[], frequency: number | null, tracked = false): Stats => ({
  spend: rows.reduce((s, r) => s + Number(r.spend ?? 0), 0),
  impressions: rows.reduce((s, r) => s + Number(r.impressions ?? 0), 0),
  // Link clicks: what CTR and CPC are judged on (same as the Ads page KPIs).
  clicks: rows.reduce((s, r) => s + Number(r.inline_link_clicks ?? 0), 0),
  conversions: rows.reduce((s, r) => s + leadsOf(r), 0),
  frequency,
  // Sale values only when Meta purchases are the brand's tracked ROAS source (lib/roas); else ROAS stays unavailable.
  revenue: tracked ? rows.reduce((s, r) => s + metaPurchase(r).value, 0) : null,
})
const liveDaysOf = (at?: string | null) => (at ? Math.floor((Date.now() - Date.parse(at)) / DAY) : null)
const newKey = () => `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

type Gathered = { targets: RuleTarget[]; meta: MetaCampaign[]; errors: string[] }

/** Real numbers for every campaign (and Meta ad) in scope of the rules, per window they use. */
async function gather(user: User, rules: AdRule[]): Promise<Gathered> {
  const windows = Array.from(new Set(rules.map((r) => r.days))) as RuleWindow[]
  const wantMeta = rules.some((r) => r.platform !== "google")
  const wantGoogle = rules.some((r) => r.platform !== "meta" && r.level === "campaign")
  const targets: RuleTarget[] = []
  const errors: string[] = []
  const until = iso(new Date(Date.now() - DAY))
  const own = await trackedOwnValues(user)
  const sinceFor = (d: RuleWindow) => iso(new Date(Date.now() - d * DAY))

  let meta: MetaCampaign[] = []
  const access = wantMeta ? await getAccess(user.id).catch(() => null) : null
  if (access) {
    meta = liveCampaigns(await listCampaigns(user.id, 50))
    const token = decToken(access)
    for (const c of meta) {
      const ended = !!c.promoted?.endsAt && Date.parse(c.promoted.endsAt) < Date.now()
      const status: RuleTarget["status"] = c.status !== "active" ? "paused" : ended ? "ended" : "active"
      const ck = `meta:${c.id}`
      const campaignTarget: RuleTarget = { key: `meta:campaign:${c.id}`, platform: "meta", level: "campaign", campaign: ck, name: `“${c.name}”`, status, liveDays: liveDaysOf(c.enabledAt), currency: c.currency, windows: {}, dailyBudget: c.built?.adSetId ? c.plan.dailyBudget : null }
      targets.push(campaignTarget)
      if (status !== "active") continue // never judge a paused or ended campaign: no reads either
      try {
        const st = await adStatuses(token, c.built!.campaignId!)
        const ads = (c.built?.ads ?? []).map((a, i) => ({ a, i, t: { key: `meta:ad:${a.adId}`, platform: "meta" as const, level: "ad" as const, campaign: ck, name: `Ad ${i + 1}${c.plan.ads[i]?.headline ? ` (“${c.plan.ads[i].headline}”)` : ""} in “${c.name}”`, status: (st.get(a.adId) === "ACTIVE" ? "active" : "paused") as RuleTarget["status"], liveDays: liveDaysOf(c.enabledAt), currency: c.currency, windows: {} as RuleTarget["windows"] } }))
        for (const d of windows) {
          const [camp, adRows] = await Promise.all([insightsRange(token, c.built!.campaignId!, "campaign", sinceFor(d), until), insightsRange(token, c.built!.campaignId!, "ad", sinceFor(d), until)])
          campaignTarget.windows[d] = statsOf(camp, camp[0]?.frequency != null ? Number(camp[0].frequency) : null, own.meta)
          for (const x of ads) {
            const mine = adRows.filter((r) => r.ad_id === x.a.adId)
            x.t.windows[d] = statsOf(mine, mine[0]?.frequency != null ? Number(mine[0].frequency) : null, own.meta)
          }
        }
        targets.push(...ads.map((x) => x.t))
      } catch (err) {
        errors.push(`Meta: ${err instanceof Error ? err.message.slice(0, 160) : "couldn’t read results"}`)
        campaignTarget.windows = {} // no numbers = no decisions
      }
    }
  }

  const gacc = wantGoogle && gadsAvailable(user) ? await getGadsAccount(user.id).catch(() => null) : null
  if (gacc?.customerId && gacc.campaign) {
    const c = gacc.campaign
    const t: RuleTarget = { key: `google:campaign:${c.resourceName}`, platform: "google", level: "campaign", campaign: `google:${c.resourceName}`, name: `Google campaign “${c.name}”`, status: c.status === "ENABLED" ? "active" : "paused", liveDays: liveDaysOf(c.enabledAt), currency: gacc.currency ?? "USD", windows: {}, dailyBudget: c.daily }
    targets.push(t)
    const cid = campaignIdOf(c.resourceName)
    if (t.status === "active" && cid) {
      try {
        const g = await gadsFor(user.id)
        type Row = { campaign?: { status?: string }; metrics?: { costMicros?: string; clicks?: string; impressions?: string; conversions?: number; conversionsValue?: number } }
        for (const d of windows) {
          const rows = await g.search<Row>(`SELECT campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.conversions_value FROM campaign WHERE campaign.id = ${cid} AND segments.date DURING LAST_${d}_DAYS`)
          // Google is the source of truth for status: never act on a campaign the owner paused there.
          if (rows.some((r) => r.campaign?.status && r.campaign.status !== "ENABLED")) t.status = "paused"
          t.windows[d] = { spend: rows.reduce((s, r) => s + fromMicros(r.metrics?.costMicros), 0), impressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions ?? 0), 0), clicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks ?? 0), 0), conversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions ?? 0), 0), frequency: null, revenue: own.google ? rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue ?? 0), 0) : null }
        }
      } catch (err) {
        errors.push(`Google: ${err instanceof Error ? err.message.slice(0, 160) : "couldn’t read results"}`)
        t.windows = {}
      }
    }
  }
  return { targets, meta, errors }
}

/** Changes in the last 24h (any source) and rule notes in the last 7 days, as engine keys. */
async function history(userId: string): Promise<{ acted: Set<string>; noted: Set<string> }> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "ads_change", createdAt: { gte: new Date(Date.now() - 7 * DAY) } }, select: { metadata: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 })
  const acted = new Set<string>()
  const noted = new Set<string>()
  for (const r of rows) {
    const m = (r.metadata ?? {}) as { platform?: string; objectId?: string; campaignRowId?: string; kind?: string; op?: string; resources?: string[]; rule?: RuleMark }
    const today = Date.now() - r.createdAt.getTime() < DAY
    if (m.rule?.action === "notify") { noted.add(`${m.rule.ruleId}|${m.rule.targetKey}`); continue }
    if (!today || m.kind === "fatigue") continue
    if (m.rule) acted.add(m.rule.targetKey)
    if (m.platform === "meta") {
      if (m.objectId) acted.add(`meta:ad:${m.objectId}`)
      if (m.campaignRowId && /budget|paused “|turned on/.test(String((r.metadata as { what?: string }).what ?? ""))) acted.add(`meta:campaign:${m.campaignRowId}`)
    } else if (m.op && m.op !== "note" && m.resources?.[0]?.includes("/campaigns/")) acted.add(`google:campaign:${m.resources[0]}`)
    else if (m.op === "budget" || m.op === "lower_budget") for (const res of m.resources ?? []) acted.add(`google:budget:${res}`)
  }
  return { acted, noted }
}

export type RunResult = { ran: boolean; reason?: string; actions: RuleAction[]; checks: RuleCheck[]; done: number; errors: string[] }

/**
 * Evaluate the brand's rules. `dryRun` = decide only (nothing changes, nothing is logged).
 * Without `force`, a brand checked in the last 20 hours is skipped (the cron's per-brand dedupe).
 */
export async function runAdRules(user: User, opts: { dryRun?: boolean; force?: boolean } = {}): Promise<RunResult> {
  const empty = (reason: string): RunResult => ({ ran: false, reason, actions: [], checks: [], done: 0, errors: [] })
  if (!hasGrowth(user)) return empty("Ad rules come with the Growth plan.")
  const settings = await getAgentSettings(user.id)
  const rules = (settings.adRules ?? []).filter((r) => r.on)
  if (!rules.length) return empty("No rules turned on.")
  if (!opts.dryRun && !opts.force && settings.adRulesRun?.at && Date.now() - Date.parse(settings.adRulesRun.at) < 20 * 3_600_000) return empty("Checked in the last 20 hours.")
  if (!opts.dryRun) await saveAgentSettings(user.id, { adRulesRun: { at: new Date().toISOString() } })

  const { targets, meta, errors } = await gather(user, rules)
  const { acted, noted } = await history(user.id)
  // Google budget changes are keyed by the budget resource in history; map them to the campaign.
  const gacc = targets.some((t) => t.platform === "google") ? await getGadsAccount(user.id).catch(() => null) : null
  if (gacc?.campaign && acted.has(`google:budget:${gacc.campaign.budget}`)) acted.add(`google:campaign:${gacc.campaign.resourceName}`)

  const cap = settings.autopilot?.adBudget ?? null
  const committed = meta.filter((c) => c.status === "active").reduce((s, c) => s + c.plan.dailyBudget, 0) + (gacc?.campaign?.status === "ENABLED" ? gacc.campaign.daily : 0)
  const { actions, checks } = evaluateRules(rules, targets, {
    capDaily: cap && cap > 0 ? dailyFromMonthly(cap) : null,
    committedDaily: Math.round(committed * 100) / 100,
    canChangeBudget: hasGrowth(user) && consentCurrent(settings),
    actedToday: acted,
    notedThisWeek: noted,
  })
  if (opts.dryRun) return { ran: true, actions, checks, done: 0, errors }

  let done = 0
  for (const a of actions) {
    try {
      if (await apply(user, a, meta)) done++
    } catch (err) {
      errors.push(err instanceof Error ? err.message.slice(0, 200) : "A change didn’t go through.")
      console.error("[ad-rules] apply", a.kind, a.targetKey, err instanceof Error ? err.message : err)
    }
  }
  if (done) forget(user.id)
  return { ran: true, actions, checks, done, errors }
}

async function apply(user: User, a: RuleAction, meta: MetaCampaign[]): Promise<boolean> {
  const mark = (undo: RuleUndo | null): RuleMark => ({ ruleId: a.ruleId, key: newKey(), targetKey: a.targetKey, action: a.kind, undo })
  if (a.kind !== "notify") {
    const q = await checkQuota(user, "ad_change", { credits: false })
    if (!q.allowed) throw new Error(q.message ?? "Out of ad changes for today.")
  }
  if (a.platform === "meta") {
    const rowId = a.campaign.slice("meta:".length)
    const c = meta.find((x) => x.id === rowId)
    const access = await getAccess(user.id)
    if (!c || !access) return false
    const token = decToken(access)
    if (a.kind === "notify") {
      await metaLog(user.id, { campaignRowId: c.id, objectId: a.level === "ad" ? a.targetKey.split(":").pop() : undefined, what: `noticed something in “${c.name}”`, why: a.why, by: "autopilot", kind: "rule", rule: mark(null) })
      return true
    }
    if (a.kind === "pause" && a.level === "ad") {
      const adId = a.targetKey.split(":").pop()!
      await setStatus(token, adId, "PAUSED")
      await metaLog(user.id, { campaignRowId: c.id, objectId: adId, what: `paused an ad in “${c.name}” (your rule)`, why: a.why, by: "autopilot", before: "active", after: "paused", kind: "rule", rule: mark({ kind: "meta_ad", rowId: c.id, adId }) })
      return true
    }
    if (a.kind === "pause") {
      await setStatus(token, c.built!.campaignId!, "PAUSED")
      c.status = "paused"
      await saveCampaign(user.id, c)
      await metaLog(user.id, { campaignRowId: c.id, objectId: c.built!.campaignId!, what: `paused “${c.name}” (your rule)`, why: a.why, by: "autopilot", before: "active", after: "paused", kind: "rule", rule: mark({ kind: "meta_campaign", rowId: c.id }) })
      return true
    }
    if (a.kind === "budget" && a.to != null && a.from != null && c.built?.adSetId) {
      await setDailyBudget(token, c.built.adSetId, a.to, c.currency)
      c.plan.dailyBudget = a.to
      await saveCampaign(user.id, c)
      await metaLog(user.id, { campaignRowId: c.id, objectId: c.built.adSetId, what: `changed the daily budget of “${c.name}” from ${a.from} to ${a.to} ${c.currency} (your rule)`, why: a.why, by: "autopilot", before: a.from, after: a.to, kind: "rule", rule: mark({ kind: "meta_budget", rowId: c.id, adSetId: c.built.adSetId, to: a.from }) })
      return true
    }
    return false
  }

  // Google (campaign level only).
  if (a.kind === "notify") {
    const acc = await getGadsAccount(user.id)
    await gadsLog(user.id, a.why, { op: "note", customerId: acc?.customerId ?? "", resources: acc?.campaign ? [acc.campaign.resourceName] : [], ops: 0, undo: null, by: "agent", rule: mark(null) })
    return true
  }
  const g = await gadsFor(user.id)
  const c = g.account.campaign
  if (!c || `google:${c.resourceName}` !== a.campaign) return false
  if (a.kind === "pause") {
    await g.mutate("campaigns", [campaignStatusOp(c.resourceName, "PAUSED")])
    await saveGadsAccount(user.id, { campaign: { ...c, status: "PAUSED" } })
    // op "pause" + customerId keep the ad-account allowance right (lib/ad-accounts.ts).
    await gadsLog(user.id, a.why, { op: "pause", customerId: g.customerId, resources: [c.resourceName], ops: 1, undo: null, by: "agent", rule: mark({ kind: "google_campaign" }) })
    return true
  }
  if (a.kind === "budget" && a.to != null && a.from != null) {
    await g.mutate("campaignBudgets", [budgetAmountOp(c.budget, a.to)])
    await saveGadsAccount(user.id, { campaign: { ...c, daily: a.to } })
    await gadsLog(user.id, a.why, { op: "budget", customerId: g.customerId, resources: [c.budget], ops: 1, undo: null, by: "agent", rule: mark({ kind: "google_budget", to: a.from }) })
    return true
  }
  return false
}

/** Undo one rule change from "What I changed" (the owner's tap). */
export async function undoRuleChange(user: User, key: string): Promise<{ ok: true; said: string } | { ok: false; error: string; status?: number }> {
  if (!/^k[a-z0-9]{6,30}$/.test(key)) return { ok: false, error: "That change isn’t there any more." }
  const row = await db.mockActivity.findFirst({ where: { userId: user.id, type: "ads_change", metadata: { path: ["rule", "key"], equals: key } } })
  const m = row?.metadata as ({ rule?: RuleMark } & Record<string, unknown>) | null
  const r = m?.rule
  if (!row || !r?.undo) return { ok: false, error: "There’s nothing to undo there." }
  if (r.undoneAt) return { ok: false, error: "Already undone." }
  const q = await checkQuota(user, "ad_change")
  if (!q.allowed) return { ok: false, error: q.message ?? "Out of ad changes for today.", status: 429 }
  const u = r.undo
  const settings = await getAgentSettings(user.id)
  const cap = settings.autopilot?.adBudget ?? null
  let said = "Undone."

  if (u.kind === "meta_ad") {
    const [access, c] = await Promise.all([getAccess(user.id), getCampaign(user.id, u.rowId)])
    if (!access || !c) return { ok: false, error: "Reconnect Facebook & Instagram first." }
    await setStatus(decToken(access), u.adId, "ACTIVE")
    await metaLog(user.id, { campaignRowId: c.id, objectId: u.adId, what: `turned an ad in “${c.name}” back on`, why: "You tapped Undo.", by: "owner", before: "paused", after: "active" })
    said = c.status === "active" ? "Undone. The ad is running again." : "Undone. The ad is back on, and runs when its campaign is on."
  } else if (u.kind === "meta_campaign") {
    const c = await getCampaign(user.id, u.rowId)
    if (!c) return { ok: false, error: "That campaign isn’t there any more." }
    const allowed = await checkAdAccount(user, "meta", c.adAccountId)
    if (!allowed.ok) return { ok: false, error: allowed.message, status: 402 }
    const res = await setLive(user.id, c.id, true)
    if (!res.ok) return { ok: false, error: res.error, status: 409 }
    said = res.said
  } else if (u.kind === "meta_budget") {
    const [access, c] = await Promise.all([getAccess(user.id), getCampaign(user.id, u.rowId)])
    if (!access || !c) return { ok: false, error: "Reconnect Facebook & Instagram first." }
    if (u.to > c.plan.dailyBudget && cap) {
      const others = liveCampaigns(await listCampaigns(user.id, 50)).filter((x) => x.id !== c.id && x.status === "active").reduce((s, x) => s + x.plan.dailyBudget, 0)
      const g = await getGadsAccount(user.id).catch(() => null)
      const google = g?.campaign?.status === "ENABLED" ? g.campaign.daily : 0
      if (others + google + u.to > dailyFromMonthly(cap) + 0.001) return { ok: false, error: "Putting it back would go over your monthly limit. Raise the limit first.", status: 409 }
    }
    await setDailyBudget(decToken(access), u.adSetId, u.to, c.currency)
    const from = c.plan.dailyBudget
    c.plan.dailyBudget = u.to
    await saveCampaign(user.id, c)
    await metaLog(user.id, { campaignRowId: c.id, objectId: u.adSetId, what: `put the daily budget of “${c.name}” back from ${from} to ${u.to} ${c.currency}`, why: "You tapped Undo.", by: "owner", before: from, after: u.to })
    said = `Undone. It’s back to ${fmtMoney(u.to, c.currency)} a day.`
  } else if (u.kind === "google_campaign") {
    const acc = await getGadsAccount(user.id)
    const allowed = acc?.customerId ? await checkAdAccount(user, "google", acc.customerId) : { ok: true as const }
    if (!allowed.ok) return { ok: false, error: allowed.message, status: 402 }
    await setCampaignStatus(user.id, "ENABLED", "owner")
    said = "Undone. Your Google campaign is on again."
  } else {
    const g = await gadsFor(user.id)
    const c = g.account.campaign
    if (!c) return { ok: false, error: "That campaign isn’t connected any more." }
    if (u.to > c.daily && cap) {
      const room = cap - (await metaMonthlyCommitment(user.id).catch(() => 0))
      if (monthlyFromDaily(u.to) > room + 0.01) return { ok: false, error: "Putting it back would go over your monthly limit. Raise the limit first.", status: 409 }
    }
    await g.mutate("campaignBudgets", [budgetAmountOp(c.budget, u.to)])
    await saveGadsAccount(user.id, { campaign: { ...c, daily: u.to } })
    await gadsLog(user.id, `Put your Google daily budget back from ${fmtMoney(c.daily, g.account.currency ?? "USD")} to ${fmtMoney(u.to, g.account.currency ?? "USD")}`, { op: "budget", customerId: g.customerId, resources: [c.budget], ops: 1, undo: null, by: "owner" })
    said = `Undone. It’s back to ${fmtMoney(u.to, g.account.currency ?? "USD")} a day.`
  }
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...m, rule: { ...r, undoneAt: new Date().toISOString() } } as object } })
  forget(user.id)
  return { ok: true, said }
}

/** For the Ads page: rule sentences + the campaigns a rule can be scoped to. */
export async function rulesView(user: User) {
  const s = await getAgentSettings(user.id)
  const [meta, gacc] = await Promise.all([listCampaigns(user.id, 50).catch(() => []), gadsAvailable(user) ? getGadsAccount(user.id).catch(() => null) : null])
  const currency = meta[0]?.currency ?? gacc?.currency ?? "USD"
  const campaigns = [
    ...liveCampaigns(meta).map((c) => ({ key: `meta:${c.id}`, label: `${c.name} (Facebook & Instagram)`, platform: "meta" as const })),
    ...(gacc?.campaign ? [{ key: `google:${gacc.campaign.resourceName}`, label: `${gacc.campaign.name} (Google)`, platform: "google" as const }] : []),
  ]
  return {
    rules: (s.adRules ?? []).map((r) => ({ ...r, text: describeRule(r, currency) })),
    lastRun: s.adRulesRun?.at ?? null,
    currency,
    campaigns,
    canChangeBudget: hasGrowth(user) && consentCurrent(s),
    hasLimit: !!(s.autopilot?.adBudget && s.autopilot.adBudget > 0),
    googleOn: gadsAvailable(user),
  }
}
