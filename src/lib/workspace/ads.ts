// Ads: real results from the owner's connected Meta and Google Ads accounts (only campaigns I
// built on Meta; the whole account on Google), the monthly limit they set, the campaigns and the
// changes I made. No forecasts: "what if" numbers would be made up.
import { checkQuota } from "@/lib/quotas"
import type { User } from "@prisma/client"
import { getAgentSettings } from "@/lib/agent/settings"
import { metaReport } from "@/lib/metaads/report"
import { getAccess, listCampaigns as metaCampaigns, recentChanges as metaChanges } from "@/lib/metaads/store"
import { getGadsAccount, recentChanges as gadsChanges } from "@/lib/gads/store"
import { gadsKpis } from "@/lib/gads/report"
import { gadsReportCached } from "@/lib/roas/sources"
import { getRoasView, type RoasView } from "./ads-roas"
import { metaFatigue } from "@/lib/metaads/fatigue"
import { pct, type Kpis } from "@/lib/ads-kpis"
import { lastReadyStrategy, latestStrategy, startStrategy, strategyRunning } from "@/lib/ad-strategy/generate"
import { relevantCompetitors } from "@/lib/competitor-relevance"
import { latestTune } from "@/lib/gads/store"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { runAsUser } from "@/lib/usage"
import { imageUrl } from "@/lib/images"
import type { Chip } from "@/lib/agent/types"
import { ART, ago, money, n, within } from "./common"

/** One window of real numbers. Rates are null when there's nothing to divide by. */
export type KpiWindow = { days: 7 | 30; spend: string; impressions: string; clicks: string; ctr: string | null; cpc: string | null; cpm: string | null; convRate: string | null; leads: string; perLead: string | null }
export type ResultBox = { platform: string; spend: string; clicks: string; leads: string | null; perLead: string | null; extra: string | null; days: number; windows: KpiWindow[] }
/** A Meta ad the fatigue check flagged (lib/metaads/fatigue.ts). */
export type TiredCard = { campaign: string; label: string; headline: string; why: string; reason: "ctr" | "cpa" }
export type AdCard = { id: string; platform: string; name: string; status: string; pc: "g" | "n" | "b" | "a"; head: string; text: string; daily: string | null; image: string | null; art: string }
export type ChangeRow = { text: string; by: string; when: string; platform: string; undo?: Record<string, string> | null }
export type FirstAd = { platform: "Facebook & Instagram" | "Google search" | "LinkedIn"; headline: string; primary: string; image: string | null; audience: string; inPlanOnly?: boolean }
export type WatchedAd = { page: string; text: string; days: number | null; url: string; format: string }

export type AdsData = {
  metaConnected: boolean
  googleConnected: boolean
  results: ResultBox[]
  budget: number | null
  campaigns: AdCard[]
  changes: ChangeRow[]
  plan: { at: string; angles: { name: string; why: string }[]; split: { platform: string; monthly: string | null }[] } | null
  budgetChip: Chip
  /** A campaign is running on Meta or Google. */
  live: boolean
  /** Ready-to-launch previews from the ad plan (lib/ad-strategy statics). */
  firstAds: FirstAd[]
  planState: "ready" | "running" | "none"
  /** For the limit slider: the plan's own inputs to testingPlan(). */
  planInputs: { b2b: boolean; local: boolean; currency: string }
  /** Competitors' active ads from the plan's Ad Library pull (only real competitors). */
  watching: WatchedAd[]
  beatIt: string[]
  /** At least 7 days since a campaign of mine started spending. */
  sevenDays: boolean
  /** A report fetch that should have worked didn't. */
  fetchFailed: string | null
  /** Meta ads that look tired against their own first week. */
  tired: TiredCard[]
  /** Return on ad spend, tracked vs estimated kept apart (lib/roas). Null when no ad account is connected. */
  roas: RoasView | null
}

const kw = (days: 7 | 30, t: { spend: number; impressions: number; clicks: number; conversions: number }, k: Kpis, cur: string): KpiWindow => ({
  days, spend: money(t.spend, cur), impressions: n(t.impressions), clicks: n(t.clicks),
  ctr: pct(k.ctr), cpc: k.cpc != null ? money(k.cpc, cur) : null, cpm: k.cpm != null ? money(k.cpm, cur) : null,
  convRate: t.conversions ? pct(k.convRate) : null, leads: n(t.conversions), perLead: k.costPerConversion != null ? money(k.costPerConversion, cur) : null,
})

export async function getAdsData(user: User): Promise<AdsData> {
  const [settings, access, gacc, mCamps, mChanges, gChanges, plan] = await Promise.all([
    getAgentSettings(user.id),
    getAccess(user.id).catch(() => null),
    getGadsAccount(user.id).catch(() => null),
    metaCampaigns(user.id, 20).catch(() => []),
    metaChanges(user.id, 10).catch(() => []),
    gadsChanges(user.id, 10).catch(() => []),
    lastReadyStrategy(user.id).catch(() => null),
  ])
  const budget = settings.autopilot?.adBudget ?? null
  const results: ResultBox[] = []

  const liveMeta = mCamps.some((c) => c.status === "active" && c.built?.campaignId)
  const meta = access ? await within(metaReport(user.id), 8000, null) : null
  let fetchFailed: string | null = access && liveMeta && !meta ? "Couldn’t reach Meta just now. I’ll retry." : null
  if (meta) {
    const w = meta.d30
    results.push({
      platform: "Facebook & Instagram", days: 30,
      spend: money(w.spend, meta.currency), clicks: n(w.linkClicks ?? w.clicks),
      leads: n(w.leads), perLead: w.costPerLead != null ? money(w.costPerLead, meta.currency) : null,
      extra: `${meta.campaigns} campaign${meta.campaigns === 1 ? "" : "s"} I built`,
      // Link clicks: what CTR, CPC and conversion rate are judged on.
      windows: ([[7, meta.d7], [30, meta.d30]] as const).map(([d, x]) => kw(d, { spend: x.spend, impressions: x.impressions, clicks: x.linkClicks ?? x.clicks, conversions: x.leads }, x.kpis, meta.currency)),
    })
  }
  let g: Awaited<ReturnType<typeof gadsReportCached>> = null
  if (gacc?.customerId) {
    g = await gadsReportCached(user.id)
    if (!g) fetchFailed = fetchFailed ?? "Couldn’t reach Google Ads just now. I’ll retry."
    if (g) {
      const a = g.account[1]
      const cur = gacc.currency ?? "USD"
      results.push({
        platform: "Google Ads", days: 30,
        spend: money(a.cost, cur), clicks: n(a.clicks),
        leads: n(a.conversions), perLead: a.conversions ? money(a.cost / a.conversions, cur) : null,
        extra: gacc.customerName ? `Account: ${gacc.customerName}` : null,
        windows: ([[7, g.account[0]], [30, g.account[1]]] as const).map(([d, x]) => kw(d, { spend: x.cost, impressions: x.impressions, clicks: x.clicks, conversions: x.conversions }, gadsKpis(x), cur)),
      })
    }
  }

  // Tired Meta ads (own first week vs this week). Notes new ones in the change log; never acts.
  const fatigue = liveMeta ? await within(metaFatigue(user.id), 8000, null) : null
  const tired: TiredCard[] = (fatigue?.ads ?? []).map((a) => ({ campaign: a.campaignName, label: a.label, headline: a.headline, why: a.why, reason: a.reason }))

  const campaigns: AdCard[] = []
  for (const c of mCamps.filter((x) => x.status !== "dismissed")) {
    const ad = c.plan.ads[0]
    campaigns.push({
      id: c.id, platform: "Facebook & Instagram", name: c.name,
      status: c.status === "active" ? "Running" : c.status === "paused" ? "Paused" : c.status === "proposed" ? "Proposed" : c.status === "building" ? "Building" : "Didn’t build",
      pc: c.status === "active" ? "g" : c.status === "proposed" ? "b" : c.status === "failed" ? "a" : "n",
      head: ad?.headline ?? c.name, text: ad?.primaryText ?? c.plan.why,
      daily: c.plan.dailyBudget ? `${money(c.plan.dailyBudget, c.currency)} a day` : null,
      image: ad?.imageId ? imageUrl(ad.imageId) : null, art: ART.social,
    })
  }
  if (gacc?.campaign) {
    const c = gacc.campaign
    campaigns.push({
      id: c.resourceName, platform: "Google search", name: c.name, status: c.status === "ENABLED" ? "Running" : "Paused", pc: c.status === "ENABLED" ? "g" : "n",
      head: c.name, text: `${c.adGroups.length} ad group${c.adGroups.length === 1 ? "" : "s"}, built ${ago(c.createdAt)}.`,
      daily: `${money(c.daily, gacc.currency ?? "USD")} a day`, image: null, art: ART.google,
    })
  }

  const changes: ChangeRow[] = [
    ...mChanges.map((c) => ({ text: `${c.what}${c.why ? `. ${c.why}` : ""}`, by: c.by === "owner" ? "You" : "Me", when: ago(c.at), at: c.at, platform: "Meta" })),
    ...gChanges.map((c) => ({ text: c.title, by: (c.metadata as { by?: string } | null)?.by === "owner" ? "You" : "Me", when: ago(c.createdAt.toISOString()), at: c.createdAt.toISOString(), platform: "Google" })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 12).map(({ at: _at, ...r }): ChangeRow => ({ ...r, undo: null }))

  // Undo where the code has one: a Google campaign pause/enable, and the latest applied tune-up.
  const tune = await latestTune(user.id).catch(() => null)
  const gRows = gChanges.map((c) => {
    const m = (c.metadata ?? {}) as { undo?: string | null; op?: string }
    // Only the latest applied tune-up can be undone (lib/gads/create.ts undoTune), so only its change rows get the button.
    const undo: Record<string, string> | null = m.undo === "pause" ? { op: "pause" } : m.undo === "enable" ? { op: "enable" } : (m.undo === "remove_negatives" || m.undo === "enable_keywords") && tune?.status === "applied" && Date.parse(tune.at) <= c.createdAt.getTime() ? { op: "tune_undo", id: tune.id } : null
    return { id: c.id, undo }
  })
  for (const r of changes) {
    const g = gChanges.find((c) => c.title === r.text && r.platform === "Google")
    if (g) r.undo = gRows.find((x) => x.id === g.id)?.undo ?? null
  }

  // First ads: launch-ready previews from the plan (every line already passed the claims check).
  let planState: AdsData["planState"] = plan ? "ready" : strategyRunning(user.id) ? "running" : "none"
  if (!plan) {
    const latest = await latestStrategy(user.id).catch(() => null)
    if (latest?.status === "running" && Date.now() - Date.parse(latest.at) < 15 * 60_000) planState = "running"
    else if (hasPro(user) && (await checkQuota(user, "ad_plan", { record: false, credits: false })).allowed && startStrategy(user.id)) planState = "running"
  }
  const audience = plan?.business ? (plan.business.local ? `People near ${plan.business.markets}` : `People in ${plan.business.markets}`) : ""
  const firstAds: FirstAd[] = []
  for (const m of (plan?.statics?.meta ?? []).slice(0, 2)) firstAds.push({ platform: "Facebook & Instagram", headline: m.headline, primary: m.primary, image: m.imageId ? imageUrl(m.imageId) : null, audience })
  const gs = plan?.statics?.google
  if (gs?.headlines?.length) firstAds.push({ platform: "Google search", headline: gs.headlines.slice(0, 3).join(" | "), primary: gs.descriptions?.[0] ?? "", image: null, audience: plan?.business?.local ? `Searches near ${plan.business.markets}` : `Searches in ${plan?.business?.markets ?? "your market"}` })
  if (plan?.testing?.platforms.some((p) => p.platform === "LinkedIn") && plan.statics?.linkedin?.[0]) firstAds.push({ platform: "LinkedIn", headline: plan.statics.linkedin[0].headline, primary: plan.statics.linkedin[0].intro, image: null, audience: `Decision makers in ${plan.business?.markets ?? "your market"}`, inPlanOnly: true })

  // Competitor ads I'm watching: only pages that belong to a real competitor (shared gate).
  const comps = await relevantCompetitors(user, await db.competitor.findMany({ where: { userId: user.id }, take: 30, select: { url: true, name: true, crawlData: true } })).catch(() => [])
  const key = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "")
  const names = comps.flatMap((c) => [key(c.name ?? ""), key((c.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0]) ?? "")]).filter((k) => k.length >= 3)
  const watching: WatchedAd[] = (plan?.competitors?.ads ?? []).filter((a) => { const k = key(a.page); return names.some((nm) => k === nm || k.includes(nm) || nm.includes(k)) })
    .slice(0, 6).map((a) => ({ page: a.page, text: (a.title || a.text).slice(0, 220), days: a.daysRunning, url: a.url, format: a.format }))
  const firstSpend = [...mCamps.map((c) => c.enabledAt), gacc?.campaign?.enabledAt].filter((x): x is string => !!x).sort()[0]
  const sevenDays = !!firstSpend && Date.now() - Date.parse(firstSpend) >= 7 * 86_400_000

  const cur = plan?.testing?.currency ?? "USD"
  const live = liveMeta || gacc?.campaign?.status === "ENABLED"
  const roas = access || gacc?.customerId ? await getRoasView(user, { meta, gads: g, live }).catch(() => null) : null
  return {
    roas,
    live,
    firstAds, planState,
    planInputs: { b2b: !!plan?.business?.b2b, local: plan?.business?.local ?? true, currency: cur },
    watching, beatIt: (plan?.competitors?.gaps ?? []).slice(0, 3), sevenDays, fetchFailed, tired,
    metaConnected: !!access,
    googleConnected: !!gacc?.customerId,
    results,
    budget,
    campaigns,
    changes,
    plan: plan ? {
      at: plan.at,
      angles: (plan.angles ?? []).slice(0, 3),
      split: (plan.testing?.platforms ?? []).map((p) => ({ platform: p.platform, monthly: p.monthly != null ? `${money(p.monthly, cur)} a month` : null })),
    } : null,
    budgetChip: {
      label: budget ? "Change my limit" : "Set my monthly limit",
      action: { type: "agent-op", endpoint: "autopilot", body: { op: "budget" }, form: {
        text: "What’s the most you want to spend on ads each month, across Google and Meta together?",
        fields: [{ name: "amount", label: "Monthly ad budget", type: "text", placeholder: "500", value: budget ? String(budget) : "", required: true }],
        cta: "Save my budget",
        fine: "A number in the currency you pay Google and Meta in. I never go over it.",
      } },
    },
  }
}
