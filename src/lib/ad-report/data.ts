// The numbers behind a shareable ad report (/w/ads/<token>) for one date range: spend, results,
// CPL, CTR, CPC (ROAS only when revenue is tracked), a per-campaign table, top ads and what I
// changed. Read-only calls: Meta insights for the campaigns I built, Google Ads for the whole
// account (what the owner pays for). Cached 30 minutes per link so a shared page can't hammer the APIs.
import { db } from "@/lib/db"
import { cached } from "@/lib/workspace/common"
import { decToken, getAccess, listCampaigns } from "@/lib/metaads/store"
import { insightsRange, type InsightRow } from "@/lib/metaads/graph"
import { getGadsAccount } from "@/lib/gads/store"
import { gadsFor } from "@/lib/gads/client"
import { fromMicros, gaqlString } from "@/lib/gads/api"
import { gadsAvailable } from "@/lib/gads/oauth"
import { periodPhrase, type ReportLink } from "./token"
import { metaPurchase } from "@/lib/roas/rules"
import { trackedOwnValues } from "./revenue"
import { reportKpis, summarize, totalsOf, type ReportKpis, type ReportRow, type Totals } from "./summary"

export type TopAd = { platform: ReportRow["platform"]; campaign: string; label: string; currency: string; spend: number; impressions: number; clicks: number; conversions: number }
export type ChangeLine = { at: string; text: string; by: "You" | "Me" }
export type AdReport = {
  business: string
  range: { from: string; to: string; label: string; period: string }
  currencies: string[]
  /** Only when every row is in one currency. */
  totals: Totals | null
  kpis: ReportKpis | null
  rows: ReportRow[]
  topAds: TopAd[]
  changes: ChangeLine[]
  summary: string[]
  /** What I couldn't read (shown, never hidden). */
  gaps: string[]
  at: string
}

const leadsOf = (r: InsightRow) => Number(r.actions?.find((a) => a.action_type === "lead")?.value ?? 0)
const sumRows = (rows: InsightRow[]) => ({
  spend: rows.reduce((s, r) => s + Number(r.spend ?? 0), 0),
  impressions: rows.reduce((s, r) => s + Number(r.impressions ?? 0), 0),
  clicks: rows.reduce((s, r) => s + Number(r.inline_link_clicks ?? 0), 0),
  conversions: rows.reduce((s, r) => s + leadsOf(r), 0),
})
const r2 = (n: number) => Math.round(n * 100) / 100

async function build(userId: string, link: Pick<ReportLink, "from" | "to" | "label">): Promise<AdReport> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, businessName: true, email: true } })
  const rows: ReportRow[] = []
  const topAds: TopAd[] = []
  const gaps: string[] = []
  const own = user ? await trackedOwnValues(user) : { meta: false, google: false }

  // Facebook & Instagram: campaigns I built that ran (on or since paused).
  const access = await getAccess(userId).catch(() => null)
  if (access) {
    const camps = (await listCampaigns(userId, 50)).filter((c) => c.built?.campaignId && c.enabledAt && (c.status === "active" || c.status === "paused"))
    const token = decToken(access)
    for (const c of camps) {
      try {
        const [camp, ads] = await Promise.all([insightsRange(token, c.built!.campaignId!, "campaign", link.from, link.to), insightsRange(token, c.built!.campaignId!, "ad", link.from, link.to)])
        const t = sumRows(camp)
        if (!t.spend && !t.impressions) continue
        rows.push({ platform: "Facebook & Instagram", name: c.name, status: c.status === "active" ? "Running" : "Paused", currency: c.currency, ...t, conversions: t.conversions, revenue: own.meta ? r2(camp.reduce((s, r) => s + metaPurchase(r).value, 0)) : null, spend: r2(t.spend) })
        for (const a of ads) {
          const i = (c.built?.ads ?? []).findIndex((x) => x.adId === a.ad_id)
          const x = sumRows([a])
          if (!x.spend) continue
          topAds.push({ platform: "Facebook & Instagram", campaign: c.name, label: (i >= 0 ? c.plan.ads[i]?.headline : null) || a.ad_name || "Ad", currency: c.currency, ...x, spend: r2(x.spend) })
        }
      } catch {
        gaps.push(`I couldn’t read “${c.name}” from Meta just now.`)
      }
    }
  }

  // Google Ads: the whole account, per campaign, plus its ads.
  const gacc = await getGadsAccount(userId).catch(() => null)
  if (gacc?.customerId && user && gadsAvailable(user)) {
    try {
      const g = await gadsFor(userId)
      const between = `segments.date BETWEEN ${gaqlString(link.from)} AND ${gaqlString(link.to)}`
      type CRow = { campaign?: { name?: string; status?: string }; metrics?: { costMicros?: string; clicks?: string; impressions?: string; conversions?: number; conversionsValue?: number } }
      type ARow = CRow & { adGroupAd?: { ad?: { id?: string; responsiveSearchAd?: { headlines?: { text?: string }[] } } } }
      const [cr, ar] = await Promise.all([
        g.search<CRow>(`SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.conversions_value FROM campaign WHERE ${between} AND metrics.impressions > 0`),
        g.search<ARow>(`SELECT campaign.name, ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM ad_group_ad WHERE ${between} AND metrics.impressions > 0`),
      ])
      const cur = gacc.currency ?? "USD"
      const byName = new Map<string, ReportRow>()
      for (const r of cr) {
        const name = r.campaign?.name ?? "Campaign"
        const row = byName.get(name) ?? { platform: "Google" as const, name, status: r.campaign?.status === "ENABLED" ? "Running" : "Paused", currency: cur, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: own.google ? 0 : null }
        if (row.revenue !== null) row.revenue = r2(row.revenue + Number(r.metrics?.conversionsValue ?? 0))
        row.spend = r2(row.spend + fromMicros(r.metrics?.costMicros)); row.impressions += Number(r.metrics?.impressions ?? 0); row.clicks += Number(r.metrics?.clicks ?? 0); row.conversions = r2(row.conversions + Number(r.metrics?.conversions ?? 0))
        byName.set(name, row)
      }
      rows.push(...byName.values())
      const byAd = new Map<string, TopAd>()
      for (const r of ar) {
        const id = r.adGroupAd?.ad?.id ?? ""
        const t = byAd.get(id) ?? { platform: "Google" as const, campaign: r.campaign?.name ?? "", label: (r.adGroupAd?.ad?.responsiveSearchAd?.headlines ?? []).map((h) => h.text).filter(Boolean).slice(0, 2).join(" | ") || "Search ad", currency: cur, spend: 0, impressions: 0, clicks: 0, conversions: 0 }
        t.spend = r2(t.spend + fromMicros(r.metrics?.costMicros)); t.impressions += Number(r.metrics?.impressions ?? 0); t.clicks += Number(r.metrics?.clicks ?? 0); t.conversions = r2(t.conversions + Number(r.metrics?.conversions ?? 0))
        byAd.set(id, t)
      }
      topAds.push(...[...byAd.values()].filter((t) => t.spend > 0))
    } catch {
      gaps.push("I couldn’t read Google Ads just now.")
    }
  }

  // What changed in the range (both platforms), newest first.
  const end = new Date(Date.parse(`${link.to}T00:00:00Z`) + 86_400_000)
  const ch = await db.mockActivity.findMany({ where: { userId, type: "ads_change", createdAt: { gte: new Date(`${link.from}T00:00:00Z`), lt: end } }, orderBy: { createdAt: "desc" }, take: 60, select: { title: true, createdAt: true, metadata: true } })
  const changes: ChangeLine[] = ch.map((c) => {
    const m = (c.metadata ?? {}) as { platform?: string; what?: string; why?: string; by?: string; kind?: string }
    const text = m.platform === "meta" ? `Facebook & Instagram: ${m.what ?? ""}${m.why ? `. ${m.why}` : ""}` : m.platform === "linkedin" ? `LinkedIn: ${c.title}` : `Google: ${c.title}`
    return { at: c.createdAt.toISOString(), text: text.replace(/\s+/g, " ").trim(), by: m.by === "owner" ? "You" as const : "Me" as const }
  })

  const currencies = Array.from(new Set(rows.filter((r) => r.spend > 0).map((r) => r.currency)))
  const one = currencies.length <= 1
  const totals = one ? totalsOf(rows) : null
  const period = periodPhrase(link)
  const ranked = topAds.sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks || a.spend - b.spend).slice(0, 5)
  return {
    business: user?.businessName?.trim() || "Your business",
    range: { from: link.from, to: link.to, label: link.label, period },
    currencies,
    totals,
    kpis: totals ? reportKpis(totals) : null,
    rows: rows.sort((a, b) => b.spend - a.spend),
    topAds: ranked,
    changes,
    summary: summarize({ period, rows, changes: changes.length, currencies }),
    gaps,
    at: new Date().toISOString(),
  }
}

export function adReportFor(userId: string, link: Pick<ReportLink, "id" | "from" | "to" | "label">): Promise<AdReport> {
  return cached(`adreport:${userId}:${link.id}:${link.from}:${link.to}`, 30 * 60_000, () => build(userId, link))
}
