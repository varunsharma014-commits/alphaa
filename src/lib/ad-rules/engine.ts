// The owner's own ad rules, as pure code (no database, no network), so every decision is
// testable: "Pause an ad if cost per lead is over $30 after $60 spent", "Raise the budget 20% if
// cost per lead is under $20 for 7 days", "Tell me if click rate falls below 0.8%".
//
// Hard rules, whatever the owner writes:
//  - every rule has a minimum-data guard (spend and/or impressions in its window) and judges
//    nothing below it; ROAS is "unavailable" unless the platform's own sale values are the
//    brand's tracked ROAS source (lib/roas: Meta purchases, Google conversion values);
//  - only running campaigns and ads are judged (never a paused or ended one);
//  - at most one change per ad / campaign per day (pause or budget), and one note per rule per
//    target per week;
//  - a budget raise never goes above the monthly limit (`autopilot.adBudget`, as a daily amount
//    across every running campaign); without a limit, or without Growth + current Autopilot
//    consent, a budget change becomes a note to the owner instead;
//  - protective actions run first: pause, then a budget cut, then a raise, then notes.
// Every number in a sentence comes from the input.

export type RuleMetric = "spend" | "cpl" | "ctr" | "cpc" | "conversions" | "frequency" | "roas"
export type RuleOp = "gt" | "lt"
export type RuleLevel = "ad" | "campaign"
export type RuleActionKind = "pause" | "notify" | "budget"
export type RuleWindow = 7 | 14 | 30
export type RulePlatform = "all" | "meta" | "google"

export type AdRule = {
  id: string
  on: boolean
  level: RuleLevel
  platform: RulePlatform
  /** null = every campaign; else a campaign key ("meta:<row id>" | "google:<resource name>"). */
  campaign: string | null
  metric: RuleMetric
  op: RuleOp
  value: number
  days: RuleWindow
  /** Minimum data in the window before the rule judges anything. */
  minSpend: number
  minImpressions: number
  action: RuleActionKind
  /** Budget change in percent, -50..50 (not 0). Budget rules only. */
  budgetPct?: number
  createdAt: string
  preset?: string | null
}

export type Stats = { spend: number; impressions: number; clicks: number; conversions: number; frequency: number | null; revenue: number | null }

export type RuleTarget = {
  /** "meta:ad:<adId>" | "meta:campaign:<rowId>" | "google:campaign:<resourceName>" */
  key: string
  platform: "meta" | "google"
  level: RuleLevel
  /** The campaign key this target belongs to (a campaign's own key for campaign targets). */
  campaign: string
  name: string
  status: "active" | "paused" | "ended"
  /** Days since it was turned on, null when unknown. */
  liveDays: number | null
  currency: string
  windows: Partial<Record<RuleWindow, Stats>>
  /** Campaign targets: the daily budget I can change (null = not changeable). */
  dailyBudget?: number | null
}

export type RuleContext = {
  /** The owner's monthly limit as a daily amount across all campaigns; null = no limit set. */
  capDaily: number | null
  /** What every running campaign is set to spend a day now. */
  committedDaily: number
  /** Growth + current Autopilot consent: budget changes allowed. */
  canChangeBudget: boolean
  /** Target keys (and campaign keys) changed in the last 24 hours. */
  actedToday: Set<string>
  /** "<ruleId>|<targetKey>" noted in the last 7 days. */
  notedThisWeek: Set<string>
}

export type RuleAction = {
  ruleId: string
  targetKey: string
  platform: "meta" | "google"
  level: RuleLevel
  campaign: string
  kind: RuleActionKind
  /** Budget: from / to (daily). */
  from?: number
  to?: number
  /** What the number was. */
  measured: number | null
  /** Plain English: what I saw and what I did. */
  why: string
  /** A budget change I couldn't make became a note: why. */
  heldBack?: string
}

export type CheckResult = "met" | "not_met" | "not_enough_data" | "not_running" | "done_today" | "noted_this_week" | "unavailable" | "not_in_scope"
export type RuleCheck = { ruleId: string; targetKey: string; result: CheckResult; measured: number | null }

/** Floors on the minimum-data guard: a rule must wait for at least one of them. */
export const GUARD_FLOOR = { spend: 10, impressions: 500 } as const
/** A raise needs real results, not one lucky lead. */
export const RAISE_MIN_CONVERSIONS = 3
export const BUDGET_PCT_MAX = 50
export const MIN_DAILY = 1
export const WINDOWS: RuleWindow[] = [7, 14, 30]
export const MAX_RULES = 20

export const METRIC_LABEL: Record<RuleMetric, string> = {
  spend: "spend",
  cpl: "cost per lead",
  ctr: "click rate",
  cpc: "cost per click",
  conversions: "leads",
  frequency: "frequency",
  roas: "return on ad spend",
}
const IS_MONEY: Record<RuleMetric, boolean> = { spend: true, cpl: true, cpc: true, ctr: false, conversions: false, frequency: false, roas: false }

const r2 = (n: number) => Math.round(n * 100) / 100
const floor2 = (n: number) => Math.floor(n * 100 + 1e-9) / 100

export function fmtMoney(n: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n)
  } catch {
    return `${r2(n)} ${currency}`
  }
}
export function fmtMetric(m: RuleMetric, v: number, currency = "USD"): string {
  if (IS_MONEY[m]) return fmtMoney(v, currency)
  if (m === "ctr") return `${r2(v).toLocaleString("en-US")}%`
  if (m === "roas") return `${r2(v).toLocaleString("en-US")}x`
  if (m === "frequency") return `${r2(v).toLocaleString("en-US")}`
  return Math.round(v).toLocaleString("en-US")
}

/**
 * The metric's value. Cost per lead with spend and no leads is Infinity (it's above any limit),
 * the same for cost per click with no clicks; a rate with nothing to divide by is null.
 */
export function metricValue(m: RuleMetric, s: Stats): number | null {
  switch (m) {
    case "spend": return s.spend
    case "conversions": return s.conversions
    case "cpl": return s.conversions > 0 ? s.spend / s.conversions : s.spend > 0 ? Infinity : null
    case "cpc": return s.clicks > 0 ? s.spend / s.clicks : s.spend > 0 ? Infinity : null
    case "ctr": return s.impressions > 0 ? (s.clicks / s.impressions) * 100 : null
    case "frequency": return s.frequency
    case "roas": return s.revenue != null && s.spend > 0 ? s.revenue / s.spend : null
  }
}

/** Is this metric measured for the platform at all? (ROAS needs revenue; frequency is Meta's.) */
export function metricAvailable(m: RuleMetric, s: Stats): boolean {
  if (m === "roas") return s.revenue != null
  if (m === "frequency") return s.frequency != null
  return true
}

/** Owner input → a clean rule, or the sentence that says what's wrong. */
export function validateRule(input: Partial<AdRule>, now = new Date()): { ok: true; rule: AdRule } | { ok: false; error: string } {
  const metric = input.metric
  if (!metric || !(metric in METRIC_LABEL)) return { ok: false, error: "Pick what I should watch." }
  const op = input.op === "lt" ? "lt" : input.op === "gt" ? "gt" : null
  if (!op) return { ok: false, error: "Pick over or under." }
  const value = Number(input.value)
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000) return { ok: false, error: "Give me a number for the limit." }
  if (metric === "conversions" && op === "gt") return { ok: false, error: "A rule on leads works as “fewer than”, for example no leads after a spend." }
  if (metric === "ctr" && value > 100) return { ok: false, error: "A click rate is a percentage, under 100." }
  const level = input.level === "ad" ? "ad" : "campaign"
  const platform: RulePlatform = input.platform === "meta" || input.platform === "google" ? input.platform : "all"
  if (level === "ad" && platform === "google") return { ok: false, error: "On Google I judge the whole campaign. Pick “a campaign” for Google." }
  if (metric === "frequency" && platform === "google") return { ok: false, error: "Google doesn’t report frequency. Use it for Facebook & Instagram." }
  const days = (WINDOWS as number[]).includes(Number(input.days)) ? (Number(input.days) as RuleWindow) : 7
  const action: RuleActionKind = input.action === "pause" || input.action === "budget" ? input.action : "notify"
  if (action === "budget" && level !== "campaign") return { ok: false, error: "Budgets live on the campaign. Pick “a campaign” for a budget rule." }
  let budgetPct: number | undefined
  if (action === "budget") {
    budgetPct = Math.round(Number(input.budgetPct))
    if (!Number.isFinite(budgetPct) || budgetPct === 0 || Math.abs(budgetPct) > BUDGET_PCT_MAX) return { ok: false, error: `Change the budget by 1% to ${BUDGET_PCT_MAX}%, up or down.` }
  }
  const minSpend = Math.max(0, r2(Number(input.minSpend) || 0))
  const minImpressions = Math.max(0, Math.round(Number(input.minImpressions) || 0))
  if (minSpend < GUARD_FLOOR.spend && minImpressions < GUARD_FLOOR.impressions) {
    return { ok: false, error: `Let me wait for enough data first: at least ${GUARD_FLOOR.spend} spent or ${GUARD_FLOOR.impressions.toLocaleString("en-US")} impressions.` }
  }
  if ((metric === "ctr" || metric === "frequency") && minImpressions < GUARD_FLOOR.impressions) {
    return { ok: false, error: `A ${METRIC_LABEL[metric]} rule needs at least ${GUARD_FLOOR.impressions.toLocaleString("en-US")} impressions before I judge it.` }
  }
  const id = typeof input.id === "string" && /^[\w-]{4,40}$/.test(input.id) ? input.id : `r${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return {
    ok: true,
    rule: {
      id, on: input.on !== false, level, platform,
      campaign: typeof input.campaign === "string" && input.campaign.length <= 200 && /^(meta|google):/.test(input.campaign) ? input.campaign : null,
      metric, op, value: r2(value), days, minSpend, minImpressions, action,
      ...(budgetPct !== undefined ? { budgetPct } : {}),
      createdAt: typeof input.createdAt === "string" ? input.createdAt : now.toISOString(),
      preset: typeof input.preset === "string" ? input.preset.slice(0, 40) : null,
    },
  }
}

/** "Pause an ad when its cost per lead is over $30, once it has spent $60 (last 30 days)." */
export function describeRule(r: AdRule, currency = "USD"): string {
  const what = r.level === "ad" ? "an ad" : "a campaign"
  const where = r.platform === "meta" ? " on Facebook & Instagram" : r.platform === "google" ? " on Google" : ""
  const cond = r.metric === "conversions" && r.value <= 1
    ? "it has no leads"
    : `its ${METRIC_LABEL[r.metric]} is ${r.op === "gt" ? "over" : "under"} ${fmtMetric(r.metric, r.value, currency)}`
  const verb = r.action === "pause" ? `Pause ${what}` : r.action === "budget" ? `${(r.budgetPct ?? 0) > 0 ? "Raise" : "Lower"} ${what}’s daily budget ${Math.abs(r.budgetPct ?? 0)}%` : `Tell me about ${what}`
  const guard = [r.minSpend > 0 ? `it has spent ${fmtMoney(r.minSpend, currency)}` : null, r.minImpressions > 0 ? `${r.minImpressions.toLocaleString("en-US")} people saw it` : null].filter(Boolean).join(" and ")
  return `${verb}${where} when ${cond}, once ${guard} (last ${r.days} days).`
}

/** Starting points the owner edits (numbers are theirs to change; nothing is claimed about results). */
export const PRESETS: { key: string; label: string; rule: Omit<AdRule, "id" | "createdAt" | "on" | "campaign"> }[] = [
  { key: "cpl-pause", label: "Pause an ad if each lead costs too much", rule: { level: "ad", platform: "all", metric: "cpl", op: "gt", value: 30, days: 30, minSpend: 60, minImpressions: 0, action: "pause", preset: "cpl-pause" } },
  { key: "no-leads", label: "Pause a campaign that spends with no leads", rule: { level: "campaign", platform: "all", metric: "conversions", op: "lt", value: 1, days: 30, minSpend: 100, minImpressions: 0, action: "pause", preset: "no-leads" } },
  { key: "raise-winner", label: "Raise the budget when leads are cheap", rule: { level: "campaign", platform: "all", metric: "cpl", op: "lt", value: 20, days: 7, minSpend: 50, minImpressions: 0, action: "budget", budgetPct: 20, preset: "raise-winner" } },
  { key: "ctr-alert", label: "Tell me when the click rate drops", rule: { level: "ad", platform: "all", metric: "ctr", op: "lt", value: 0.8, days: 7, minSpend: 0, minImpressions: 1000, action: "notify", preset: "ctr-alert" } },
  { key: "frequency-alert", label: "Tell me when people see an ad too often", rule: { level: "ad", platform: "meta", metric: "frequency", op: "gt", value: 4, days: 7, minSpend: 0, minImpressions: 2000, action: "notify", preset: "frequency-alert" } },
]

const PRIORITY: Record<string, number> = { pause: 0, cut: 1, raise: 2, notify: 3 }
const prio = (r: AdRule) => (r.action === "budget" ? ((r.budgetPct ?? 0) < 0 ? PRIORITY.cut : PRIORITY.raise) : PRIORITY[r.action])

function inScope(r: AdRule, t: RuleTarget): boolean {
  if (r.level !== t.level) return false
  if (r.platform !== "all" && r.platform !== t.platform) return false
  if (r.campaign && r.campaign !== t.campaign) return false
  return true
}

function evidence(r: AdRule, s: Stats, cur: string): string {
  const parts = [`${fmtMoney(r2(s.spend), cur)} spent`]
  if (r.metric === "ctr" || r.metric === "frequency") parts.push(`${s.impressions.toLocaleString("en-US")} impressions`)
  if (r.metric === "ctr" || r.metric === "cpc") parts.push(`${s.clicks.toLocaleString("en-US")} ${s.clicks === 1 ? "click" : "clicks"}`)
  if (r.metric === "cpl" || r.metric === "conversions") parts.push(`${s.conversions.toLocaleString("en-US")} ${s.conversions === 1 ? "lead" : "leads"}`)
  return parts.join(", ")
}

/** Pure: which rules fire on which targets, and what I'd do. */
export function evaluateRules(rules: AdRule[], targets: RuleTarget[], ctx: RuleContext): { actions: RuleAction[]; checks: RuleCheck[] } {
  const actions: RuleAction[] = []
  const checks: RuleCheck[] = []
  const acted = new Set(ctx.actedToday)
  let committed = ctx.committedDaily
  const pausedCampaigns = new Set<string>()
  // Protective first; within the same action, campaigns before their ads (a paused campaign covers them).
  const lvl = (r: AdRule) => (r.level === "campaign" ? 0 : 1)
  const ordered = rules.filter((r) => r.on).map((r, i) => ({ r, i })).sort((a, b) => prio(a.r) - prio(b.r) || lvl(a.r) - lvl(b.r) || a.i - b.i).map((x) => x.r)

  for (const r of ordered) {
    for (const t of targets) {
      if (!inScope(r, t)) continue
      const check = (result: CheckResult, measured: number | null = null) => checks.push({ ruleId: r.id, targetKey: t.key, result, measured })
      if (t.status !== "active" || pausedCampaigns.has(t.campaign)) { check("not_running"); continue }
      const s = t.windows[r.days]
      if (!s) { check("not_enough_data"); continue }
      if (!metricAvailable(r.metric, s)) { check("unavailable"); continue }
      if (s.spend < r.minSpend || s.impressions < r.minImpressions) { check("not_enough_data"); continue }
      const v = metricValue(r.metric, s)
      if (v === null) { check("not_enough_data"); continue }
      const met = r.op === "gt" ? v > r.value : v < r.value
      if (!met) { check("not_met", v); continue }

      const cur = t.currency
      const shown = Number.isFinite(v) ? fmtMetric(r.metric, v, cur) : null
      const saw = r.metric === "conversions"
        ? `${fmtMoney(r2(s.spend), cur)} spent and ${s.conversions === 0 ? "no leads" : `only ${s.conversions} ${s.conversions === 1 ? "lead" : "leads"}`} in the last ${r.days} days`
        : shown
          ? `its ${METRIC_LABEL[r.metric]} was ${shown} over the last ${r.days} days (${evidence(r, s, cur)})`
          : `it spent ${fmtMoney(r2(s.spend), cur)} with no ${r.metric === "cpl" ? "leads" : "clicks"} in the last ${r.days} days`
      const limit = r.metric === "conversions" ? "" : ` Your rule: ${r.op === "gt" ? "over" : "under"} ${fmtMetric(r.metric, r.value, cur)}.`
      const base = { ruleId: r.id, targetKey: t.key, platform: t.platform, level: t.level, campaign: t.campaign, measured: Number.isFinite(v) ? r2(v) : null }
      const note = (heldBack?: string) => {
        const k = `${r.id}|${t.key}`
        if (ctx.notedThisWeek.has(k)) { check("noted_this_week", base.measured); return }
        ctx.notedThisWeek.add(k)
        check("met", base.measured)
        actions.push({ ...base, kind: "notify", why: `${t.name}: ${saw}.${limit}${heldBack ? ` ${heldBack}` : " I changed nothing."}`, ...(heldBack ? { heldBack } : {}) })
      }

      if (r.action === "notify") { note(); continue }
      if (acted.has(t.key) || (t.level === "ad" && acted.has(`campaign:${t.campaign}`))) { check("done_today", base.measured); continue }

      if (r.action === "pause") {
        acted.add(t.key)
        if (t.level === "campaign") { pausedCampaigns.add(t.campaign); acted.add(`campaign:${t.campaign}`) }
        check("met", base.measured)
        actions.push({ ...base, kind: "pause", why: `${t.name}: ${saw}.${limit} I paused it.` })
        continue
      }

      // Budget change.
      const pct = r.budgetPct ?? 0
      const daily = t.dailyBudget ?? null
      if (daily === null) { note("I can’t change this one’s budget, so I only noted it."); continue }
      if (!ctx.canChangeBudget) { note("Budget changes need Autopilot on, so I didn’t change it."); continue }
      if (pct > 0) {
        if (s.conversions < RAISE_MIN_CONVERSIONS) { check("not_enough_data", base.measured); continue }
        if (t.liveDays === null || t.liveDays < r.days) { check("not_enough_data", base.measured); continue }
        if (ctx.capDaily === null) { note("Set a monthly limit first, then I can raise budgets inside it."); continue }
        const room = floor2(ctx.capDaily - committed)
        const want = r2(daily * (1 + pct / 100))
        const to = Math.min(want, floor2(daily + Math.max(0, room)))
        if (to < daily + 0.01) { note(`I’d raise it, but your monthly limit is already used by what’s running (${fmtMoney(r2(ctx.capDaily), cur)} a day).`); continue }
        committed = r2(committed + (to - daily))
        acted.add(t.key); acted.add(`campaign:${t.campaign}`)
        check("met", base.measured)
        const capped = to < want ? ` That’s as far as your monthly limit allows.` : ""
        actions.push({ ...base, kind: "budget", from: daily, to, why: `${t.name}: ${saw}.${limit} I raised its daily budget from ${fmtMoney(daily, cur)} to ${fmtMoney(to, cur)}.${capped}` })
      } else {
        const to = Math.max(MIN_DAILY, r2(daily * (1 + pct / 100)))
        if (to > daily - 0.01) { note("It’s already at the smallest budget I set."); continue }
        committed = r2(committed - (daily - to))
        acted.add(t.key); acted.add(`campaign:${t.campaign}`)
        check("met", base.measured)
        actions.push({ ...base, kind: "budget", from: daily, to, why: `${t.name}: ${saw}.${limit} I lowered its daily budget from ${fmtMoney(daily, cur)} to ${fmtMoney(to, cur)}.` })
      }
    }
  }
  return { actions, checks }
}
