"use client"

import { DataTable, PageHeader, Pill, StatRow, StatTile, Tabs, useTabParam, type Column } from "@/components/workspace/ui"
import "./settings.css"

// Admins only (founders): usage by brand, quota pressure, credits and AI cost by feature.
// Every number is computed on the server from the usage ledger (admin/usage/page.tsx).
type Flag = { text: string; pct: number }
type QuotaRow = { id: string; name: string; email: string | null; plan: string; aiDay: number; aiDayCap: number | null; aiMonth: number; aiMonthCap: number | null; flags: Flag[] }
type WorkRow = { id: string; name: string; email: string; plan: string; brandsOnLogin: number | null; counts: Record<string, number>; gbp: number | null; calls: number; tin: number; tout: number; searches: number; cost: number | null; unpriced: boolean }
type CreditRow = { id: string; name: string; balance: number; purchases: number; bought: number; paid: number; spend30: number; top: string; refunded: number; expired: number }
type FeatureRow = { id: string; calls: number; tin: number; tout: number; searches: number; cost: number | null; unpriced: boolean }
export type UsageData = {
  total: number
  brands: number
  platformToday: number
  budget: number
  hotBrands: number
  quotas: QuotaRow[]
  types: { key: string; label: string }[]
  work: WorkRow[]
  credits: CreditRow[]
  features: FeatureRow[]
}

const TABS = ["quota", "work", "credits", "features"] as const
type Tab = (typeof TABS)[number]
const n = (v: number | null | undefined) => (v == null ? "·" : v.toLocaleString("en-US", { maximumFractionDigits: 1 }))
const usd = (v: number) => `$${v.toFixed(2)}`
const cost = (c: number | null, unpriced: boolean) => (c == null ? "·" : `${usd(c)}${unpriced ? "+" : ""}`)
const heat = (pct: number) => (pct >= 1 ? "bad" : pct >= 0.8 ? "warn" : "")
function Heat({ value, cap }: { value: number; cap: number | null }) {
  const h = cap ? heat(value / cap) : ""
  return <span className={`xs-heat ${h}`.trim()}>{usd(value)}{cap !== null ? ` / $${cap}` : ""}</span>
}
const who = (name: string, email: string | null) => <span className="xs-cell"><b>{name}</b>{email && <span>{email}</span>}</span>

export function AdminUsageView({ data }: { data: UsageData }) {
  const [tab, setTab] = useTabParam(TABS, "quota")
  const todayPct = data.budget ? data.platformToday / data.budget : 0

  const quotaCols: Column<QuotaRow>[] = [
    { key: "brand", label: "Brand", value: (r) => r.name, render: (r) => who(r.name, r.email), sortable: true },
    { key: "plan", label: "Plan", value: (r) => r.plan, sortable: true },
    { key: "day", label: "AI today", num: true, value: (r) => r.aiDay, render: (r) => <Heat value={r.aiDay} cap={r.aiDayCap} />, sortable: true },
    { key: "month", label: "AI this month", num: true, value: (r) => r.aiMonth, render: (r) => <Heat value={r.aiMonth} cap={r.aiMonthCap} />, sortable: true },
    { key: "flags", label: "Closest to a limit (50%+)", render: (r) => r.flags.length ? <span className="xs-flags">{r.flags.map((f) => <span key={f.text} className={`xs-heat ${heat(f.pct)}`.trim()}>{f.text}</span>)}</span> : <span className="xs-missing">All under 50%</span> },
  ]
  const workCols: Column<WorkRow>[] = [
    { key: "brand", label: "Brand", value: (r) => r.name, render: (r) => who(r.name, r.email), sortable: true },
    { key: "plan", label: "Plan", value: (r) => r.plan, sortable: true },
    { key: "logins", label: "Brands on login", num: true, value: (r) => r.brandsOnLogin, render: (r) => n(r.brandsOnLogin), hideOnCards: true },
    ...data.types.map((t): Column<WorkRow> => ({ key: t.key, label: t.label, num: true, value: (r) => r.counts[t.key] ?? null, render: (r) => n(r.counts[t.key]), sortable: true, hideOnCards: true })),
    { key: "gbp", label: "Google posts out", num: true, value: (r) => r.gbp, render: (r) => n(r.gbp), sortable: true, hideOnCards: true },
    { key: "calls", label: "AI calls", num: true, value: (r) => r.calls, render: (r) => n(r.calls), sortable: true },
    { key: "tok", label: "Tokens in / out", num: true, value: (r) => r.tin, render: (r) => `${n(r.tin)} / ${n(r.tout)}`, hideOnCards: true },
    { key: "search", label: "Web searches", num: true, value: (r) => r.searches, render: (r) => n(r.searches), sortable: true },
    { key: "cost", label: "Est. AI cost", num: true, value: (r) => r.cost, render: (r) => cost(r.cost, r.unpriced), sortable: true },
  ]
  const creditCols: Column<CreditRow>[] = [
    { key: "brand", label: "Brand", value: (r) => r.name, sortable: true },
    { key: "bal", label: "Balance", num: true, value: (r) => r.balance, render: (r) => n(r.balance), sortable: true },
    { key: "buys", label: "Purchases", num: true, value: (r) => r.purchases, sortable: true },
    { key: "bought", label: "Bought / paid", num: true, value: (r) => r.bought, render: (r) => `${n(r.bought)} / ${n(r.paid)}` },
    { key: "spend", label: "Spent, 30 days", num: true, value: (r) => r.spend30, render: (r) => n(r.spend30), sortable: true },
    { key: "on", label: "Spent on", render: (r) => r.top || "·", hideOnCards: true },
    { key: "ref", label: "Refunded / expired", num: true, render: (r) => `${n(r.refunded)} / ${n(r.expired)}`, hideOnCards: true },
  ]
  const featureCols: Column<FeatureRow>[] = [
    { key: "f", label: "Feature", value: (r) => r.id, sortable: true },
    { key: "calls", label: "AI calls", num: true, value: (r) => r.calls, render: (r) => n(r.calls), sortable: true },
    { key: "tok", label: "Tokens in / out", num: true, value: (r) => r.tin, render: (r) => `${n(r.tin)} / ${n(r.tout)}`, hideOnCards: true },
    { key: "search", label: "Web searches", num: true, value: (r) => r.searches, render: (r) => n(r.searches), sortable: true },
    { key: "cost", label: "Est. cost", num: true, value: (r) => r.cost, render: (r) => cost(r.cost, r.unpriced), sortable: true },
  ]

  return (
    <div className="xs-page wide">
      <PageHeader
        title="Usage"
        sub="What each brand used in the last 30 days, and how close it is to its plan limits."
        pill={<Pill tone="info">Admin only</Pill>}
        tabs={<Tabs label="Usage sections" value={tab} onChange={setTab} tabs={[
          { key: "quota", label: "Limits", count: data.hotBrands || undefined },
          { key: "work", label: "By brand" },
          { key: "credits", label: "Credits", count: data.credits.length || undefined },
          { key: "features", label: "By feature" },
        ]} />}
      />
      <div className="xs-stack">
        <StatRow>
          <StatTile label="AI cost, 30 days" value={usd(data.total)} hint="Estimate at list prices" />
          <StatTile label="AI spend today" value={usd(data.platformToday)} hint={`of the $${data.budget} daily budget`} delta={todayPct >= 0.8 ? { text: `${Math.round(todayPct * 100)}%`, dir: "up", good: false } : null} />
          <StatTile label="Brands" value={data.brands.toLocaleString("en-US")} />
          <StatTile label="Brands at 80%+" value={data.hotBrands.toLocaleString("en-US")} hint="Of any limit, today or this month" />
        </StatRow>

        {tab === "quota" && <DataTable label="Usage vs plan limits" columns={quotaCols} rows={data.quotas} rowKey={(r) => r.id} stickyFirst maxHeight={640} empty={<p className="xs-mute">No usage recorded this month yet.</p>} />}
        {tab === "work" && <DataTable label="Work done and AI cost by brand" columns={workCols} rows={data.work} rowKey={(r) => r.id} stickyFirst maxHeight={640} defaultSort={{ key: "cost", dir: "desc" }} />}
        {tab === "credits" && <DataTable label="Usage credits" columns={creditCols} rows={data.credits} rowKey={(r) => r.id} stickyFirst empty={<p className="xs-mute">No credits bought yet.</p>} />}
        {tab === "features" && <DataTable label="AI cost by feature" columns={featureCols} rows={data.features} rowKey={(r) => r.id} stickyFirst empty={<p className="xs-mute">No feature data yet. Recording started on November 20, 2026.</p>} />}

        <details className="xs-notes">
          <summary>How these numbers are counted</summary>
          <ul>
            <li>Cost is an estimate from list prices (<code>lib/ai-prices.ts</code>, <code>AI_PRICES_JSON</code> overrides). Compare with the Anthropic Console. A “+” means a model with no price set.</li>
            <li>Metering by brand started on November 17, 2026; calls with no brand, features and web searches on November 20; quota counts on November 27.</li>
            <li>Limits come from <code>lib/quota-rules.ts</code> (<code>QUOTAS_JSON</code> overrides). Amber is 80% or more, red is at or over. Comped accounts are measured against Growth and never blocked.</li>
            <li>The platform daily budget is <code>AI_DAILY_BUDGET_USD</code>. At 100%, non-essential crons pause.</li>
            <li>Credit packs: 50 for $25, 120 for $50, 300 for $100, one time, 12-month expiry. Spent only after the plan quota runs out, in an owner’s own request. “Paid” is in the purchase currency.</li>
            <li>Days are UTC.</li>
          </ul>
        </details>
      </div>
    </div>
  )
}
