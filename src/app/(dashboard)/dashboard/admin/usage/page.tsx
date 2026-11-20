export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isAdmin } from "@/lib/billing"
import { ownerClerkId, realEmail } from "@/lib/sites"

// Admins only (isAdmin, not the comp list): what Alphaa did for each brand in the last 30 days, the AI it used, and what
// that cost by feature. Cost is an estimate from list prices (PRICES below, $/MTok), which
// AI_PRICES_JSON ({"model": [inputPerMTok, outputPerMTok]}) overrides without a deploy. Cache
// writes bill 1.25x input, cache reads 0.1x (0.05x on Opus/Sonnet 5.5), web searches $0.01 each.
// Calls with no brand (public scans) come from "usage_house" rows and show as their own line.
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-opus-5": [5, 25],
  "claude-sonnet-5": [2, 10],
  "claude-opus-4-8": [5, 25],
  "claude-sonnet-4-6": [3, 15],
  "claude-haiku-4-5": [1, 5],
}
const SEARCH_USD = 0.01

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

  const since = new Date(Date.now() - 30 * 86_400_000)
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
  let prices: Record<string, [number, number]> = { ...PRICES }
  try {
    prices = { ...PRICES, ...JSON.parse(process.env.AI_PRICES_JSON || "{}") }
  } catch {
    prices = { ...PRICES }
  }
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
  for (const u of usage) {
    const m = u.metadata as UsageMeta | null
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
