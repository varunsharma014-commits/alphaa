// Owner-approved writes to Meta: build a proposed campaign (everything PAUSED), turn it on only
// when the owner taps, pause it. Every write is counted (usage "ads_op") and logged (ads_change).
import { db } from "@/lib/db"
import { tallyUsage } from "@/lib/usage"
import { listAccounts } from "@/lib/social/store"
import { dec } from "@/lib/social/store"
import { buildPaused, setStatus, type CampaignSpec } from "./graph"
import { decToken, getAccess, getCampaign, listCampaigns, liveCampaigns, logChange, saveCampaign, type MetaCampaign } from "./store"
import { dailyFromMonthly, metaMonthlyCap } from "./plan"

export type OpResult = { ok: true; said: string; campaign?: MetaCampaign } | { ok: false; error: string }

async function imageB64(userId: string, id: string | null | undefined): Promise<string | null> {
  if (!id) return null
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: "post_image" }, select: { metadata: true } })
  return (r?.metadata as { b64?: string } | null)?.b64 ?? null
}

/** The owner approved the plan (and its daily budget): create it on Meta, paused. */
export async function approveAndBuild(userId: string, id: string, input: { dailyBudget: number; privacyUrl?: string | null }): Promise<OpResult> {
  const [c, access, user] = await Promise.all([getCampaign(userId, id), getAccess(userId), db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true } })])
  if (!c || c.status !== "proposed") return { ok: false, error: "That plan isn’t waiting any more." }
  if (!access) return { ok: false, error: "Reconnect Facebook & Instagram first." }
  const acct = access.adAccounts.find((a) => a.id === c.adAccountId)
  if (!acct) return { ok: false, error: "That ad account isn’t shared with me any more. Reconnect Facebook & Instagram." }
  if (acct.account_status !== 1) return { ok: false, error: "Meta says that ad account can’t run ads right now. Check it in Meta Ads Manager (billing or a review), then try again." }
  const daily = Math.round(input.dailyBudget * 100) / 100
  if (!(daily >= 1) || daily > 100_000) return { ok: false, error: "Give me a daily amount of at least 1." }

  // Never past the owner's monthly cap, counting what's already running.
  const cap = await metaMonthlyCap(userId)
  if (cap !== null) {
    const committed = liveCampaigns(await listCampaigns(userId, 50)).reduce((t, x) => t + x.plan.dailyBudget, 0)
    const room = dailyFromMonthly(cap) - committed
    if (daily > room) return { ok: false, error: `That’s over your monthly budget. The most I can spend a day here is ${Math.max(0, Math.floor(room * 100) / 100).toLocaleString("en-US")} ${acct.currency}. Lower it, or raise your budget in “What I do without asking”.` }
  }

  const page = (await listAccounts(userId)).find((a) => a.platform === "facebook" && a.externalId === c.pageId && a.status === "active")
  const site = user?.websiteUrl?.trim() ? `https://${user.websiteUrl.replace(/^https?:\/\//, "")}` : null
  if (c.plan.goal === "OUTCOME_TRAFFIC" && !site) return { ok: false, error: "Website-visit ads need your website on your profile." }
  const privacyUrl = (input.privacyUrl ?? c.privacyUrl ?? "").trim() || null
  const pixelId = access.picks.pixelId ?? null
  const leadsOn = c.plan.goal === "OUTCOME_LEADS" && c.plan.leadsOn === "website" ? "website" : "form"
  if (leadsOn === "website") {
    if (!pixelId) return { ok: false, error: "Website leads need your Meta Pixel. Pick it above, or switch back to the Facebook form." }
    if (!site) return { ok: false, error: "Website leads need your website on your profile." }
  } else if (c.plan.goal === "OUTCOME_LEADS") {
    if (!privacyUrl || !/^https:\/\/[^\s]+\.[^\s]+/.test(privacyUrl)) return { ok: false, error: "Meta needs a link to your privacy policy (https://…) for the lead form." }
  }

  const ads: CampaignSpec["ads"] = []
  for (const a of c.plan.ads) {
    const b64 = await imageB64(userId, a.imageId)
    if (b64) ads.push({ primaryText: a.primaryText, headline: a.headline, description: a.description, jpegB64: b64 })
  }
  if (!ads.length) return { ok: false, error: "The ad pictures are missing. Ask me for a new plan." }

  c.status = "building"
  c.approvedAt = new Date().toISOString()
  c.privacyUrl = privacyUrl
  c.plan.dailyBudget = daily
  c.built = { ads: [] }
  c.error = null
  await saveCampaign(userId, c)
  await logChange(userId, { campaignRowId: c.id, what: `approved “${c.name}” at ${daily} ${acct.currency} a day`, why: "You approved the plan.", by: "owner", after: daily })

  const token = decToken(access)
  try {
    const built = await buildPaused(token, {
      adAccountId: c.adAccountId, currency: acct.currency, name: c.name, goal: c.plan.goal, special: c.plan.special, country: c.plan.country,
      dailyBudget: daily, pageId: c.pageId, pageToken: page ? dec(page.tokenEnc) : null, igUserId: access.picks.igUserId ?? null, pixelId, leadsOn,
      website: site, privacyUrl, city: c.plan.city, radiusMiles: c.plan.radiusMiles, ads,
    }, async (what, objectId) => {
      tallyUsage(userId, "ads_op")
      if (what === "campaign") c.built = { ...c.built, campaignId: objectId }
      if (what === "ad_set") c.built = { ...c.built, adSetId: objectId }
      if (what === "lead_form") c.built = { ...c.built, formId: objectId }
      await saveCampaign(userId, c)
      await logChange(userId, { campaignRowId: c.id, objectId, what: `created ${what.replace("_", " ")} (paused)`, why: "Built from the plan you approved. Nothing runs until you turn it on.", by: "owner" })
    })
    c.built = built
    c.status = "paused"
    await saveCampaign(userId, c)
    return { ok: true, said: "It’s built and paused on Meta. Nothing is spending yet. Turn it on when you’re ready.", campaign: c }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Meta said no"
    console.error("[metaads] build", msg)
    // A half-built campaign stays paused on Meta; keep what was made so it can be paused/cleaned up.
    c.status = c.built?.campaignId ? "paused" : "failed"
    c.error = msg
    await saveCampaign(userId, c)
    return { ok: false, error: `Meta didn’t accept it: ${msg}` }
  }
}

/** Only ever from the owner's own tap. */
export async function setLive(userId: string, id: string, on: boolean): Promise<OpResult> {
  const [c, access] = await Promise.all([getCampaign(userId, id), getAccess(userId)])
  if (!c?.built?.campaignId || !c.built.adSetId) return { ok: false, error: "That campaign isn’t on Meta yet." }
  if (!access) return { ok: false, error: "Reconnect Facebook & Instagram first." }
  if (on && c.error) return { ok: false, error: "This one didn’t finish building. Ask me for a new plan instead." }
  if (on) {
    const cap = await metaMonthlyCap(userId)
    const others = liveCampaigns(await listCampaigns(userId, 50)).filter((x) => x.id !== c.id && x.status === "active").reduce((t, x) => t + x.plan.dailyBudget, 0)
    if (cap !== null && others + c.plan.dailyBudget > dailyFromMonthly(cap) + 0.001) return { ok: false, error: "Turning this on would go over your monthly budget. Pause another campaign or raise your budget first." }
  }
  const token = decToken(access)
  const status = on ? "ACTIVE" : "PAUSED"
  // Turn on: ads, then ad set, then campaign. Pause: the campaign stops everything under it.
  const ids = on ? [...(c.built.ads ?? []).map((a) => a.adId), c.built.adSetId, c.built.campaignId] : [c.built.campaignId]
  try {
    for (const oid of ids) {
      await setStatus(token, oid, status)
      tallyUsage(userId, "ads_op")
    }
  } catch (err) {
    return { ok: false, error: `Meta didn’t accept that: ${err instanceof Error ? err.message : "error"}` }
  }
  c.status = on ? "active" : "paused"
  if (on) c.enabledAt = new Date().toISOString()
  await saveCampaign(userId, c)
  await logChange(userId, { campaignRowId: c.id, objectId: c.built.campaignId, what: on ? `turned on “${c.name}”` : `paused “${c.name}”`, why: on ? "You tapped Turn it on." : "You tapped Pause.", by: "owner", before: on ? "paused" : "active", after: on ? "active" : "paused" })
  return { ok: true, said: on ? `It’s live. Meta reviews new ads first, usually within a day, then they start showing near you at up to ${c.plan.dailyBudget} ${c.currency} a day.` : "Paused. It stops spending right away.", campaign: c }
}

/** Owner switch on a proposed leads plan: Meta's instant form, or their website (needs the pixel). */
export async function setLeadsOn(userId: string, id: string, on: "form" | "website"): Promise<OpResult> {
  const [c, access] = await Promise.all([getCampaign(userId, id), getAccess(userId)])
  if (!c || c.status !== "proposed") return { ok: false, error: "That plan isn’t waiting any more." }
  if (c.plan.goal !== "OUTCOME_LEADS") return { ok: false, error: "This plan sends people to your website already." }
  if (on === "website" && !access?.picks.pixelId) return { ok: false, error: "Pick your Meta Pixel first: it counts the leads on your website." }
  c.plan.leadsOn = on
  await saveCampaign(userId, c)
  return { ok: true, said: on === "website" ? "Done. The ads send people to your website, and your pixel counts each lead." : "Done. People fill in a short form on Facebook or Instagram.", campaign: c }
}

export async function dismissPlan(userId: string, id: string): Promise<OpResult> {
  const c = await getCampaign(userId, id)
  if (!c || c.status !== "proposed") return { ok: false, error: "That plan isn’t waiting any more." }
  c.status = "dismissed"
  await saveCampaign(userId, c)
  return { ok: true, said: "Dropped it. Ask me any time for a new one." }
}
