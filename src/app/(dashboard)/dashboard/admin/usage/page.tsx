export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { realAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { FOUNDER_EMAILS } from "@/lib/billing"
import { ownerClerkId, realEmail } from "@/lib/sites"

// Founders only: what Alphaa did for each brand in the last 30 days, and the AI it used.
// AI cost is an estimate from AI_PRICES_JSON ({"model": [inputPerMTok, outputPerMTok]}), so it
// stays right when prices change, without a deploy. Without it only tokens are shown.
const TYPES: [string, string][] = [
  ["post_draft", "Blog posts"],
  ["draft_written", "Other drafts"],
  ["social_published", "Social posts out"],
  ["review_reply", "Review replies"],
  ["week_run", "Week runs"],
  ["question_scan", "AI checks"],
]

export default async function UsagePage() {
  const { userId } = await realAuth()
  if (!userId) notFound()
  const me = await db.user.findUnique({ where: { clerkId: userId }, select: { email: true } })
  if (!me || !FOUNDER_EMAILS.includes(realEmail(me.email))) notFound()

  const since = new Date(Date.now() - 30 * 86_400_000)
  const [users, acts, usage, gbp] = await Promise.all([
    db.user.findMany({
      where: { OR: [{ stripeSubscriptionId: { not: null } }, { plan: { not: "none" } }, { mockActivity: { some: { createdAt: { gte: since } } } }] },
      select: { id: true, clerkId: true, email: true, businessName: true, websiteUrl: true, plan: true, subscriptionStatus: true },
      take: 500,
    }),
    db.mockActivity.groupBy({ by: ["userId", "type"], where: { createdAt: { gte: since }, type: { in: TYPES.map(([t]) => t) } }, _count: { _all: true } }),
    db.mockActivity.findMany({ where: { type: "usage_day", createdAt: { gte: since } }, select: { userId: true, metadata: true } }),
    db.gbpPost.groupBy({ by: ["userId"], where: { status: "posted", postedAt: { gte: since } }, _count: { _all: true } }),
  ])
  let prices: Record<string, [number, number]> = {}
  try {
    prices = JSON.parse(process.env.AI_PRICES_JSON || "{}")
  } catch {
    prices = {}
  }

  const count = new Map<string, number>()
  for (const a of acts) count.set(`${a.userId}|${a.type}`, a._count._all)
  const gbpBy = new Map(gbp.map((g) => [g.userId, g._count._all]))
  const ai = new Map<string, { calls: number; tin: number; tout: number; cost: number | null }>()
  for (const u of usage) {
    const m = u.metadata as { calls?: number; tokens?: Record<string, { in: number; out: number }> } | null
    const cur = ai.get(u.userId) ?? { calls: 0, tin: 0, tout: 0, cost: 0 }
    cur.calls += m?.calls ?? 0
    for (const [model, t] of Object.entries(m?.tokens ?? {})) {
      cur.tin += t.in
      cur.tout += t.out
      const p = prices[model]
      cur.cost = cur.cost === null || !p ? null : cur.cost + (t.in * p[0] + t.out * p[1]) / 1e6
    }
    ai.set(u.userId, cur)
  }
  const rows = users.map((u) => ({ u, a: ai.get(u.id) })).sort((x, y) => (y.a?.tin ?? 0) + (y.a?.tout ?? 0) - ((x.a?.tin ?? 0) + (x.a?.tout ?? 0)))
  const brandsPerLogin = new Map<string, number>()
  for (const { u } of rows) brandsPerLogin.set(ownerClerkId(u.clerkId), (brandsPerLogin.get(ownerClerkId(u.clerkId)) ?? 0) + 1)
  const n = (v: number | undefined) => (v ?? 0).toLocaleString("en-US")
  const th = { textAlign: "left" as const, padding: "8px 10px", fontSize: 12, color: "#6e6e73", borderBottom: "1px solid #d2d2d7", whiteSpace: "nowrap" as const }
  const td = { padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #eee", verticalAlign: "top" as const, fontVariantNumeric: "tabular-nums" as const }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Usage by brand · last 30 days</h1>
      <p style={{ color: "#6e6e73", fontSize: 14, margin: "6px 0 18px" }}>
        {rows.length} brands. AI metering started 2026-11-17, so earlier days show no tokens.{" "}
        {Object.keys(prices).length ? "Cost is an estimate from AI_PRICES_JSON." : "Set AI_PRICES_JSON on Railway to show estimated AI cost."}
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
                <td style={td}>{a?.cost == null ? "—" : `$${a.cost.toFixed(2)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
