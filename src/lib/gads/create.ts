// Owner-approved writes to Google Ads. Every call here runs because the owner tapped a
// button (the weekly tune-up is in tune.ts). The campaign is always created PAUSED, and only
// enableCampaign() turns it on: never called by a cron.
import { buildCampaignOps, campaignStatusOp, keywordStatusOp, removeOp } from "./api"
import { gadsFor } from "./client"
import { getTune, logChange, saveGadsAccount, savePlan, saveTune, type GadsCampaign } from "./store"
import type { AdPlan } from "./plan-types"
import { money } from "./plan"

/** Budget + campaign (PAUSED) + location + language + negatives + ad groups + keywords + ads, in one atomic request. */
export async function createFromPlan(userId: string, plan: AdPlan, daily: number): Promise<GadsCampaign> {
  const g = await gadsFor(userId)
  if (g.customerId !== plan.customerId) throw new Error("That plan was for a different ad account. Plan again.")
  if (g.account.campaign) throw new Error("I already built your campaign. I’ll tune that one instead of adding another.")
  const ops = buildCampaignOps({
    customerId: g.customerId,
    name: plan.campaignName,
    dailyBudget: daily,
    bidding: plan.bidding,
    finalUrl: plan.finalUrl,
    location: { cityName: plan.location.cityName, provinceCode: plan.location.provinceCode, postalCode: plan.location.postalCode, countryCode: plan.location.countryCode, radius: plan.location.radius, units: plan.location.units },
    language: plan.language,
    negatives: plan.negatives.flatMap((n) => n.keywords),
    adGroups: plan.adGroups.map((gr) => ({ name: gr.name, keywords: gr.keywords.map((k) => ({ text: k.text, match: k.match })), ad: gr.ad })),
  })
  let names: string[]
  try {
    names = await g.mutateAll(ops)
  } catch (err) {
    await savePlan(userId, { ...plan, status: "failed", error: err instanceof Error ? err.message.slice(0, 300) : "failed" })
    throw err
  }
  const of = (prefix: string) => names.filter((n) => n.includes(`/${prefix}/`))
  const campaign: GadsCampaign = {
    resourceName: of("campaigns")[0],
    budget: of("campaignBudgets")[0],
    adGroups: of("adGroups"),
    name: plan.campaignName,
    status: "PAUSED",
    daily,
    createdAt: new Date().toISOString(),
    planId: plan.id,
  }
  await saveGadsAccount(userId, { campaign })
  await savePlan(userId, { ...plan, status: "created", daily })
  await logChange(userId, `Built your Google Ads campaign “${plan.campaignName}” (paused, ${money(daily, plan.currency)} a day)`, {
    op: "create_campaign", customerId: g.customerId, resources: names.filter(Boolean), ops: ops.length, undo: null, by: "owner",
    detail: `${plan.adGroups.reduce((n, gr) => n + gr.keywords.length, 0)} keywords, ${plan.negatives.reduce((n, x) => n + x.keywords.length, 0)} negatives, ${plan.location.label}`,
  })
  return campaign
}

export async function setCampaignStatus(userId: string, status: "ENABLED" | "PAUSED", by: "owner" | "agent" = "owner"): Promise<void> {
  const g = await gadsFor(userId)
  const c = g.account.campaign
  if (!c) throw new Error("There’s no campaign yet.")
  await g.mutate("campaigns", [campaignStatusOp(c.resourceName, status)])
  await saveGadsAccount(userId, { campaign: { ...c, status, ...(status === "ENABLED" ? { enabledAt: new Date().toISOString() } : {}) } })
  await logChange(userId, status === "ENABLED" ? `Turned on your Google Ads campaign “${c.name}”` : `Paused your Google Ads campaign “${c.name}”`, {
    op: status === "ENABLED" ? "enable" : "pause", customerId: g.customerId, resources: [c.resourceName], ops: 1, undo: status === "ENABLED" ? "pause" : "enable", by,
  })
}

/** Undo a tune-up: remove the negatives it added and turn its paused keywords back on. */
export async function undoTune(userId: string, tuneId: string): Promise<number> {
  const t = await getTune(userId, tuneId)
  if (!t || t.status !== "applied") throw new Error("There’s nothing to undo there.")
  const g = await gadsFor(userId)
  let n = 0
  if (t.created?.length) {
    await g.mutate("campaignCriteria", t.created.map(removeOp))
    n += t.created.length
    await logChange(userId, `Removed ${t.created.length} blocked ${t.created.length === 1 ? "search" : "searches"} I added`, { op: "undo_negatives", customerId: g.customerId, resources: t.created, ops: t.created.length, undo: null, by: "owner" })
  }
  const paused = t.actions.flatMap((a) => (a.kind === "pause_keyword" ? [a.criterion] : []))
  if (paused.length) {
    await g.mutate("adGroupCriteria", paused.map((c) => keywordStatusOp(c, "ENABLED")))
    n += paused.length
    await logChange(userId, `Turned ${paused.length} ${paused.length === 1 ? "keyword" : "keywords"} back on`, { op: "pause_keywords", customerId: g.customerId, resources: paused, ops: paused.length, undo: null, by: "owner", detail: "undo" })
  }
  await saveTune(userId, { ...t, status: "undone" })
  return n
}
