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
import { pageTitle } from "@/lib/page-title"
import { AdminUsageView, type UsageData } from "@/components/workspace/settings/AdminUsageView"

export const metadata = { title: pageTitle("Admin usage") }

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

  const brandName = (u: { businessName: string | null; websiteUrl: string | null } | undefined, id: string) => u?.businessName || u?.websiteUrl || id
  const pctMax = (r: (typeof quotaRows)[number]) => Math.max(r.aiDayCap ? r.aiDay / r.aiDayCap : 0, r.aiMonthCap ? r.aiMonth / r.aiMonthCap : 0, ...r.flags.map((f) => f.pct))

  const data: UsageData = {
    total,
    brands: rows.length,
    platformToday,
    budget,
    hotBrands: quotaRows.filter((r) => pctMax(r) >= 0.8).length,
    quotas: quotaRows.map((r) => ({
      id: r.id,
      name: brandName(r.u, r.id),
      email: r.u ? realEmail(r.u.email) : null,
      plan: r.comped ? `${r.u?.plan ?? "none"} (comped, Growth limits)` : r.plan,
      aiDay: r.aiDay, aiDayCap: r.aiDayCap, aiMonth: r.aiMonth, aiMonthCap: r.aiMonthCap,
      flags: r.flags.slice(0, 5).map((f) => ({ text: `${KIND_LABEL[f.kind] ?? f.kind} · ${fmt(f.kind, f.used)} of ${fmt(f.kind, f.limit)} ${f.period === "day" ? "today" : `this ${f.period}`}`, pct: f.pct })),
    })),
    types: TYPES.map(([t, l]) => ({ key: t, label: l })),
    work: [
      ...rows.map(({ u, a }) => ({
        id: u.id,
        name: u.businessName || u.websiteUrl || "Unnamed brand",
        email: realEmail(u.email),
        plan: `${u.plan}${u.subscriptionStatus !== "active" ? ` (${u.subscriptionStatus})` : ""}`,
        brandsOnLogin: brandsPerLogin.get(ownerClerkId(u.clerkId)) ?? 1,
        counts: Object.fromEntries(TYPES.map(([t]) => [t, count.get(`${u.id}|${t}`) ?? 0])),
        gbp: gbpBy.get(u.id) ?? 0,
        calls: a?.calls ?? 0, tin: a?.tin ?? 0, tout: a?.tout ?? 0, searches: a?.searches ?? 0,
        cost: a && (a.calls || a.searches) ? a.cost : null, unpriced: !!a?.unpriced,
      })),
      { id: "_house", name: "No brand", email: "Public scans from /start, work before a brand is picked", plan: "", brandsOnLogin: null, counts: {}, gbp: null, calls: house.calls, tin: house.tin, tout: house.tout, searches: house.searches, cost: house.calls || house.searches ? house.cost : null, unpriced: house.unpriced },
    ],
    credits: creditRows.map((c) => ({ id: c.id, name: nameOf(c.id), balance: c.balance, purchases: c.purchases, bought: c.bought, paid: c.paid, spend30: c.spend30, top: c.top.map(([a, v]) => `${a} ${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}`).join(", "), refunded: c.refunded, expired: c.expired })),
    features: features.map(([f, a]) => ({ id: f, calls: a.calls, tin: a.tin, tout: a.tout, searches: a.searches, cost: a.calls || a.searches ? a.cost : null, unpriced: a.unpriced })),
  }
  return <AdminUsageView data={data} />
}
