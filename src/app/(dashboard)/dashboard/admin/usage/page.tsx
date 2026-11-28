export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isAdmin } from "@/lib/billing"
import { ownerClerkId, realEmail } from "@/lib/sites"
import { aiPrices, SEARCH_USD as SEARCH_USD_PRICE, usageCost } from "@/lib/ai-prices"
import { countsAmount, limitsFor, periodStart, dayKey, QUOTA_KINDS, PERIODS, type QuotaKind, type Period } from "@/lib/quota-rules"
import { aiDailyBudget, flush } from "@/lib/usage"
import { isComped } from "@/lib/billing"
import { replay, type LedgerEntry } from "@/lib/credit-rules"

// Admins only (isAdmin, not the comp list): what Alphaa did for each brand in the last 30 days, the AI it used, and what
// that cost by feature, plus usage vs plan quota today / this month (lib/quota-rules.ts; 80%+ highlighted).
// Cost is an estimate from list prices (lib/ai-prices.ts; AI_PRICES_JSON overrides without a deploy).
// Calls with no brand (public scans) come from "usage_house" rows and show as their own line.
const SEARCH_USD = SEARCH_USD_PRICE

const TYPES: [string, string][] = [
  ["post_draft", "Blog posts"],
  ["draft_written", "Other drafts"],
  ["social_published", "Social posts out"],
  ["review_reply", "Review replies"],
  ["week_run", "Week runs"],
  ["question_scan", "AI checks"],
]

type Tok = { in: number; out: number; cacheRead?: number; cacheWrite?: number }
type UsageMeta = {
  date?: string
  counts?: Record<string, number>
  calls?: number
  searches?: number
  tokens?: Record<string, Tok>
  features?: Record<string, { calls: number; searches: number; tokens: Record<string, Tok> }>
}
type Agg = { calls: number; tin: number; tout: number; searches: number; cost: number; unpriced: boolean }
const blank = (): Agg => ({ calls: 0, tin: 0, tout: 0, searches: 0, cost: 0, unpriced: false })

export default async function UsagePage() {
  const { userId } = await realAuth()
  if (!userId) notFound()
  const me = await db.user.findUnique({ where: { clerkId: userId }, select: { email: true } })
  if (!me || !isAdmin(me.email)) notFound() // never the comp/reviewer logins

  await flush().catch(() => undefined) // the last 30s of calls, so today's numbers are current
  const since = new Date(Math.min(Date.now() - 30 * 86_400_000, periodStart("month").getTime() - 86_400_000))
  const [users, acts, usage, gbp] = await Promise.all([
    db.user.findMany({
      where: { OR: [{ stripeSubscriptionId: { not: null } }, { plan: { not: "none" } }, { mockActivity: { some: { createdAt: { gte: since } } } }] },
      select: { id: true, clerkId: true, email: true, businessName: true, websiteUrl: true, plan: true, subscriptionStatus: true },
      take: 500,
    }),
    db.mockActivity.groupBy({ by: ["userId", "type"], where: { createdAt: { gte: since }, type: { in: TYPES.map(([t]) => t) } }, _count: { _all: true } }),
    db.mockActivity.findMany({ where: { type: { in: ["usage_day", "usage_house"] }, createdAt: { gte: since } }, select: { userId: true, type: true, metadata: true } }),
    db.gbpPost.groupBy({ by: ["userId"], where: { status: "posted", postedAt: { gte: since } }, _count: { _all: true } }),
  ])
  const prices = aiPrices()
  const tokCost = (model: string, t: Tok): number | null => {
    const p = prices[model]
    if (!p) return null
    const readX = /(opus|sonnet)-5-5$/.test(model) ? 0.05 : 0.1
    return (t.in * p[0] + (t.cacheWrite ?? 0) * p[0] * 1.25 + (t.cacheRead ?? 0) * p[0] * readX + t.out * p[1]) / 1e6
  }
  const addTokens = (a: Agg, tokens: Record<string, Tok> | undefined) => {
    for (const [model, t] of Object.entries(tokens ?? {})) {
      a.tin += t.in + (t.cacheRead ?? 0) + (t.cacheWrite ?? 0)
      a.tout += t.out
      const c = tokCost(model, t)
      if (c === null) a.unpriced = true
      else a.cost += c
    }
  }

  const count = new Map<string, number>()
  for (const a of acts) count.set(`${a.userId}|${a.type}`, a._count._all)
  const gbpBy = new Map(gbp.map((g) => [g.userId, g._count._all]))
  const ai = new Map<string, Agg>()
  const house = blank()
  const byFeature = new Map<string, Agg>()
  const cutoff30 = dayKey(new Date(Date.now() - 30 * 86_400_000))
  for (const u of usage) {
    const m = u.metadata as UsageMeta | null
    if ((m?.date ?? "") < cutoff30) continue // rows kept only for "this month" below
    const isHouse = u.type === "usage_house"
    const cur = isHouse ? house : ai.get(u.userId) ?? blank()
    cur.calls += m?.calls ?? 0
    cur.searches += m?.searches ?? 0
    cur.cost += (m?.searches ?? 0) * SEARCH_USD
    addTokens(cur, m?.tokens)
    if (!isHouse) ai.set(u.userId, cur)
    for (const [f, v] of Object.entries(m?.features ?? {})) {
      const fa = byFeature.get(f) ?? blank()
      fa.calls += v.calls
      fa.searches += v.searches
      fa.cost += v.searches * SEARCH_USD
      addTokens(fa, v.tokens)
      byFeature.set(f, fa)
    }
  }
  const features = [...byFeature.entries()].sort((a, b) => b[1].cost - a[1].cost)
  const total = [...ai.values(), house].reduce((s, a) => s + a.cost, 0)
  const money = (a: Agg | undefined) => (!a || (!a.calls && !a.searches) ? "—" : `$${a.cost.toFixed(2)}${a.unpriced ? "+" : ""}`)

  const rows = users.map((u) => ({ u, a: ai.get(u.id) })).sort((x, y) => (y.a?.cost ?? 0) - (x.a?.cost ?? 0) || (y.a?.tin ?? 0) - (x.a?.tin ?? 0))
  const brandsPerLogin = new Map<string, number>()
  for (const { u } of rows) brandsPerLogin.set(ownerClerkId(u.clerkId), (brandsPerLogin.get(ownerClerkId(u.clerkId)) ?? 0) + 1)
  // Usage vs plan quota: today / this week / this month (UTC)
  const starts: Record<Period, string> = { day: dayKey(periodStart("day")), week: dayKey(periodStart("week")), month: dayKey(periodStart("month")) }
  type Q = Record<Period, Partial<Record<QuotaKind, number>>>
  const quotaUse = new Map<string, Q>()
  let platformToday = 0
  for (const u of usage) {
    const m = u.metadata as UsageMeta | null
    const date = m?.date ?? ""
    if (date < starts.month && date < starts.week) continue
    const cost = usageCost(m?.tokens, m?.searches ?? 0)
    if (date === starts.day) platformToday += cost
    if (u.type === "usage_house") continue
    const q = quotaUse.get(u.userId) ?? { day: {}, week: {}, month: {} }
    for (const p of PERIODS) {
      if (date < starts[p]) continue
      const add = (k: QuotaKind, v: number) => { if (v) q[p][k] = (q[p][k] ?? 0) + v }
      add("ai_cost_usd", cost)
      add("search", (m?.searches ?? 0) + (m?.counts?.search ?? 0))
      for (const k of QUOTA_KINDS) if (k !== "ai_cost_usd" && k !== "search") add(k, countsAmount(m?.counts, k))
    }
    quotaUse.set(u.userId, q)
  }
  const byId = new Map(users.map((u) => [u.id, u]))
  type Flag = { kind: QuotaKind; period: Period; used: number; limit: number; pct: number }
  const quotaRows = [...quotaUse.entries()].map(([id, q]) => {
    const u = byId.get(id)
    const plan = isComped(u?.email) ? "growth" : u?.plan ?? "none" // comped: measured against Growth, never blocked
    const flags: Flag[] = []
    for (const k of QUOTA_KINDS) {
      const lim = limitsFor(plan, k)
      for (const p of PERIODS) {
        const limit = lim[p]
        const used = q[p][k] ?? 0
        if (limit === undefined || !used) continue
        const pct = limit > 0 ? used / limit : 1
        if (pct >= 0.5) flags.push({ kind: k, period: p, used, limit, pct })
      }
    }
    flags.sort((x, y) => y.pct - x.pct)
    const ai = limitsFor(plan, "ai_cost_usd")
    return { id, u, plan, flags, aiDay: q.day.ai_cost_usd ?? 0, aiMonth: q.month.ai_cost_usd ?? 0, aiDayCap: ai.day ?? null, aiMonthCap: ai.month ?? null, comped: isComped(u?.email) }
  }).sort((x, y) => y.aiMonth - x.aiMonth)
  const budget = aiDailyBudget()
  const KIND_LABEL: Partial<Record<QuotaKind, string>> = { ai_cost_usd: "AI spend", data_usd: "data spend (DataForSEO)", search: "searches" }
  const fmt = (k: QuotaKind, v: number) => (k.endsWith("_usd") ? `$${v.toFixed(2)}` : Math.round(v).toLocaleString("en-US"))
  const hot = (pct: number) => (pct >= 1 ? "#fde2e1" : pct >= 0.8 ? "#fff4d6" : undefined)

  // Usage credits: every brand with a ledger, balance now, purchases and spend (lib/credits.ts).
  const ledgerRows = await db.mockActivity.findMany({ where: { type: "credit_ledger" }, orderBy: { createdAt: "asc" }, select: { userId: true, metadata: true }, take: 20000 })
  const byBrandLedger = new Map<string, LedgerEntry[]>()
  for (const r of ledgerRows) byBrandLedger.set(r.userId, [...(byBrandLedger.get(r.userId) ?? []), r.metadata as LedgerEntry])
  const missing = [...byBrandLedger.keys()].filter((id) => !users.some((u) => u.id === id))
  const extraUsers = missing.length ? await db.user.findMany({ where: { id: { in: missing } }, select: { id: true, email: true, businessName: true, websiteUrl: true } }) : []
  const nameOf = (id: string) => { const u = users.find((x) => x.id === id) ?? extraUsers.find((x) => x.id === id); return u ? `${u.businessName || u.websiteUrl || id} · ${realEmail(u.email)}` : id }
  const cutoff30iso = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const creditRows = [...byBrandLedger.entries()].map(([id, es]) => {
    const r = replay(es)
    const buys = es.filter((e): e is Extract<LedgerEntry, { t: "purchase" }> => e.t === "purchase")
    const spend30 = es.filter((e) => e.t === "spend" && e.at >= cutoff30iso).reduce((a, e) => a + e.credits, 0)
    const byAction = new Map<string, number>()
    for (const e of es) if (e.t === "spend" && e.at >= cutoff30iso) byAction.set(e.action, (byAction.get(e.action) ?? 0) + e.credits)
    const refunded = es.filter((e) => e.t === "refund").reduce((a, e) => a + e.credits, 0)
    return { id, balance: r.balance, bought: buys.reduce((a, e) => a + e.credits, 0), paid: buys.reduce((a, e) => a + (e.amount ?? 0), 0) / 100, purchases: buys.length, spend30, refunded, expired: r.expired, top: [...byAction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3) }
  }).sort((a, b) => b.spend30 - a.spend30 || b.balance - a.balance)

  const n = (v: number | undefined) => (v ?? 0).toLocaleString("en-US")
  const th = { textAlign: "left" as const, padding: "8px 10px", fontSize: 12, color: "#6e6e73", borderBottom: "1px solid #d2d2d7", whiteSpace: "nowrap" as const }
  const td = { padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #eee", verticalAlign: "top" as const, fontVariantNumeric: "tabular-nums" as const }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Usage by brand · last 30 days</h1>
      <p style={{ color: "#6e6e73", fontSize: 14, margin: "6px 0 18px" }}>
        {rows.length} brands. Estimated AI cost, 30 days: <b style={{ color: "#1d1d1f" }}>${total.toFixed(2)}</b> at list prices (compare with the Anthropic Console).
        Metering by brand started 2026-11-17; calls with no brand, features and web searches on 2026-11-20. &quot;+&quot; means a model with no price set.
      </p>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 6px" }}>Usage vs plan quota · today and this month (UTC)</h2>
      <p style={{ color: "#6e6e73", fontSize: 13, margin: "0 0 10px" }}>
        Platform AI spend today: <b style={{ color: "#1d1d1f", background: hot(platformToday / budget) }}>${platformToday.toFixed(2)}</b> of the ${budget} daily budget (AI_DAILY_BUDGET_USD; non-essential crons pause at 100%).
        Limits from lib/quota-rules.ts, QUOTAS_JSON overrides. Yellow = 80%+, red = at or over. Comped accounts are tracked, never blocked. Counts started 2026-11-27.
      </p>
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Brand</th>
              <th style={th}>Plan</th>
              <th style={th}>AI today / ceiling</th>
              <th style={th}>AI this month / ceiling</th>
              <th style={th}>Closest to a limit (50%+)</th>
            </tr>
          </thead>
          <tbody>
            {quotaRows.length ? quotaRows.map((r) => (
              <tr key={r.id}>
                <td style={td}><b>{r.u?.businessName || r.u?.websiteUrl || r.id}</b>{r.u ? <><br /><span style={{ color: "#6e6e73" }}>{realEmail(r.u.email)}</span></> : null}</td>
                <td style={td}>{r.comped ? `${r.u?.plan ?? "none"} (comped, Growth limits)` : r.plan}</td>
                <td style={{ ...td, background: r.aiDayCap ? hot(r.aiDay / r.aiDayCap) : undefined }}>${r.aiDay.toFixed(2)}{r.aiDayCap !== null ? ` / $${r.aiDayCap}` : ""}</td>
                <td style={{ ...td, background: r.aiMonthCap ? hot(r.aiMonth / r.aiMonthCap) : undefined }}>${r.aiMonth.toFixed(2)}{r.aiMonthCap !== null ? ` / $${r.aiMonthCap}` : ""}</td>
                <td style={td}>
                  {r.flags.length ? r.flags.slice(0, 5).map((f) => (
                    <div key={`${f.kind}${f.period}`} style={{ background: hot(f.pct), padding: "1px 4px", borderRadius: 4 }}>{KIND_LABEL[f.kind] ?? f.kind} · {fmt(f.kind, f.used)} of {fmt(f.kind, f.limit)} {f.period === "day" ? "today" : `this ${f.period}`}</div>
                  )) : <span style={{ color: "#6e6e73" }}>All under 50%</span>}
                </td>
              </tr>
            )) : (
              <tr><td style={td} colSpan={5}>No usage recorded this month yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 8px" }}>Top spenders and work done · last 30 days</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Brand</th>
              <th style={th}>Plan</th>
              <th style={th}>Brands on login</th>
              {TYPES.map(([, l]) => <th key={l} style={th}>{l}</th>)}
              <th style={th}>Google posts out</th>
              <th style={th}>AI calls</th>
              <th style={th}>Tokens in / out</th>
              <th style={th}>Web searches</th>
              <th style={th}>Est. AI cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, a }) => (
              <tr key={u.id}>
                <td style={td}><b>{u.businessName || u.websiteUrl || "—"}</b><br /><span style={{ color: "#6e6e73" }}>{realEmail(u.email)}</span></td>
                <td style={td}>{u.plan}{u.subscriptionStatus !== "active" ? ` (${u.subscriptionStatus})` : ""}</td>
                <td style={td}>{brandsPerLogin.get(ownerClerkId(u.clerkId))}</td>
                {TYPES.map(([t]) => <td key={t} style={td}>{n(count.get(`${u.id}|${t}`))}</td>)}
                <td style={td}>{n(gbpBy.get(u.id))}</td>
                <td style={td}>{n(a?.calls)}</td>
                <td style={td}>{n(a?.tin)} / {n(a?.tout)}</td>
                <td style={td}>{n(a?.searches)}</td>
                <td style={td}>{money(a)}</td>
              </tr>
            ))}
            <tr>
              <td style={td}><b>No brand</b><br /><span style={{ color: "#6e6e73" }}>Public scans from /start, work before a brand is picked</span></td>
              <td style={td} colSpan={TYPES.length + 3} />
              <td style={td}>{n(house.calls)}</td>
              <td style={td}>{n(house.tin)} / {n(house.tout)}</td>
              <td style={td}>{n(house.searches)}</td>
              <td style={td}>{money(house)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "28px 0 8px" }}>Usage credits</h2>
      <p style={{ color: "#6e6e73", fontSize: 13, margin: "0 0 10px" }}>Packs 50/$25, 120/$50, 300/$100 (one-time, 12-month expiry). Spent only after the plan quota runs out, in an owner&apos;s own request. &quot;Paid&quot; is in the purchase currency&apos;s main unit.</p>
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 1000 }}>
          <thead>
            <tr>
              <th style={th}>Brand</th>
              <th style={th}>Balance</th>
              <th style={th}>Purchases</th>
              <th style={th}>Credits bought / paid</th>
              <th style={th}>Spent, 30 days</th>
              <th style={th}>Spent on</th>
              <th style={th}>Refunded / expired</th>
            </tr>
          </thead>
          <tbody>
            {creditRows.length ? creditRows.map((c) => (
              <tr key={c.id}>
                <td style={td}>{nameOf(c.id)}</td>
                <td style={td}>{c.balance.toLocaleString("en-US")}</td>
                <td style={td}>{c.purchases}</td>
                <td style={td}>{c.bought.toLocaleString("en-US")} / {c.paid.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                <td style={td}>{c.spend30.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                <td style={td}>{c.top.length ? c.top.map(([a, v]) => `${a} ${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}`).join(", ") : "—"}</td>
                <td style={td}>{c.refunded.toLocaleString("en-US")} / {c.expired.toLocaleString("en-US")}</td>
              </tr>
            )) : (
              <tr><td style={td} colSpan={7}>No credits bought yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "28px 0 8px" }}>AI cost by feature · last 30 days</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 760 }}>
          <thead>
            <tr>
              <th style={th}>Feature</th>
              <th style={th}>AI calls</th>
              <th style={th}>Tokens in / out</th>
              <th style={th}>Web searches</th>
              <th style={th}>Est. cost</th>
            </tr>
          </thead>
          <tbody>
            {features.length ? (
              features.map(([f, a]) => (
                <tr key={f}>
                  <td style={td}>{f}</td>
                  <td style={td}>{n(a.calls)}</td>
                  <td style={td}>{n(a.tin)} / {n(a.tout)}</td>
                  <td style={td}>{n(a.searches)}</td>
                  <td style={td}>{money(a)}</td>
                </tr>
              ))
            ) : (
              <tr><td style={td} colSpan={5}>No feature data yet (recording started 2026-11-20).</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
