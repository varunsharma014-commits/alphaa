// Ads: real results from the owner's connected Meta and Google Ads accounts (only campaigns I
// built on Meta; the whole account on Google), the monthly limit they set, the campaigns and the
// changes I made. No forecasts: "what if" numbers would be made up.
import type { User } from "@prisma/client"
import { getAgentSettings } from "@/lib/agent/settings"
import { metaReport } from "@/lib/metaads/report"
import { getAccess, listCampaigns as metaCampaigns, recentChanges as metaChanges } from "@/lib/metaads/store"
import { getGadsAccount, recentChanges as gadsChanges } from "@/lib/gads/store"
import { gadsFor } from "@/lib/gads/client"
import { adsReport } from "@/lib/gads/report"
import { lastReadyStrategy } from "@/lib/ad-strategy/generate"
import { imageUrl } from "@/lib/images"
import type { Chip } from "@/lib/agent/types"
import { ART, ago, cached, money, n, within } from "./common"

export type ResultBox = { platform: string; spend: string; clicks: string; leads: string | null; perLead: string | null; extra: string | null; days: number }
export type AdCard = { id: string; platform: string; name: string; status: string; pc: "g" | "n" | "b" | "a"; head: string; text: string; daily: string | null; image: string | null; art: string }
export type ChangeRow = { text: string; by: string; when: string; platform: string }

export type AdsData = {
  metaConnected: boolean
  googleConnected: boolean
  results: ResultBox[]
  budget: number | null
  campaigns: AdCard[]
  changes: ChangeRow[]
  plan: { at: string; angles: { name: string; why: string }[]; split: { platform: string; monthly: string | null }[] } | null
  budgetChip: Chip
}

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

  const meta = access ? await within(metaReport(user.id), 8000, null) : null
  if (meta) {
    const w = meta.d30
    results.push({
      platform: "Facebook & Instagram", days: 30,
      spend: money(w.spend, meta.currency), clicks: n(w.clicks),
      leads: n(w.leads), perLead: w.costPerLead != null ? money(w.costPerLead, meta.currency) : null,
      extra: `${meta.campaigns} campaign${meta.campaigns === 1 ? "" : "s"} I built`,
    })
  }
  if (gacc?.customerId) {
    const g = await cached(`ws:gads:${user.id}`, 15 * 60_000, () => within(gadsFor(user.id).then(adsReport), 8000, null).catch(() => null))
    if (g) {
      const a = g.account[1]
      const cur = gacc.currency ?? "USD"
      results.push({
        platform: "Google Ads", days: 30,
        spend: money(a.cost, cur), clicks: n(a.clicks),
        leads: n(a.conversions), perLead: a.conversions ? money(a.cost / a.conversions, cur) : null,
        extra: gacc.customerName ? `Account: ${gacc.customerName}` : null,
      })
    }
  }

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
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 12).map(({ at: _at, ...r }) => r)

  const cur = plan?.testing?.currency ?? "USD"
  return {
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
