// Facebook + Instagram ads storage. MockActivity rows, no schema change:
//   meta_ads_account   one per brand: the business token (encrypted), ad accounts, pixels, the owner's picks
//   meta_ads_campaign  one per campaign I proposed or built (plan, ids on Meta, status)
//   meta_ads_lead      one per lead: ids + name/email/phone ENCRYPTED, never logged
//   meta_ads_tune      a weekly tuning pass (what I changed or propose, with the numbers)
//   ads_change         every change I make on an ad platform (shared with Google Ads: platform "meta" | "google")
import { db } from "@/lib/db"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import type { AdAccount, Built, GeoCity, Goal, Pixel, SpecialCategory } from "./graph"

export const ACCESS = "meta_ads_account"
export const CAMPAIGN = "meta_ads_campaign"
export const LEAD = "meta_ads_lead"
export const TUNE = "meta_ads_tune"
export const CHANGE = "ads_change"

export type Picks = { adAccountId?: string; pageId?: string; pageName?: string; igUserId?: string | null; igName?: string | null; pixelId?: string | null }
export type MetaAdsAccess = {
  id: string
  tokenEnc: string
  adAccounts: AdAccount[]
  pixels: Record<string, Pixel[]>
  picks: Picks
  status: "active" | "expired"
  connectedAt: string
  note?: string | null
}

export type PlannedAd = { primaryText: string; headline: string; description: string; imageHeadline: string; imageId?: string | null }
export type MetaPlan = {
  goal: Goal
  why: string
  keys: string[]
  special: SpecialCategory
  city: GeoCity | null
  cityLabel: string | null
  country: string | null
  radiusMiles: number
  dailyBudget: number
  budgetSource: "autopilot" | "suggested"
  monthlyCap: number | null
  ads: PlannedAd[]
}
export type CampaignStatus = "proposed" | "building" | "paused" | "active" | "failed" | "dismissed"
export type MetaCampaign = {
  id: string
  status: CampaignStatus
  name: string
  adAccountId: string
  currency: string
  pageId: string
  plan: MetaPlan
  privacyUrl?: string | null
  built?: Partial<Built>
  error?: string | null
  createdAt: string
  approvedAt?: string | null
  enabledAt?: string | null
  lastLeadPollAt?: string | null
}

const enc = (s: string) => encryptSecret(s)
export const decToken = (a: Pick<MetaAdsAccess, "tokenEnc">) => decryptSecret(a.tokenEnc)

// ── Access ──────────────────────────────────────────────────────────────────
export async function getAccess(userId: string): Promise<MetaAdsAccess | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: ACCESS }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<MetaAdsAccess, "id">), id: r.id } : null
}

export async function saveAccess(userId: string, a: { token: string; adAccounts: AdAccount[]; pixels: Record<string, Pixel[]> }): Promise<MetaAdsAccess> {
  const cur = await getAccess(userId)
  // Keep the owner's picks when the same accounts come back.
  const keep = cur?.picks ?? {}
  const picks: Picks = keep.adAccountId && a.adAccounts.some((x) => x.id === keep.adAccountId) ? keep : a.adAccounts.length === 1 ? { ...keep, adAccountId: a.adAccounts[0].id } : {}
  if (picks.adAccountId && picks.pixelId && !(a.pixels[picks.adAccountId] ?? []).some((p) => p.id === picks.pixelId)) picks.pixelId = null
  const meta = { tokenEnc: enc(a.token), adAccounts: a.adAccounts, pixels: a.pixels, picks, status: "active" as const, connectedAt: new Date().toISOString(), note: null }
  if (cur) {
    await db.mockActivity.update({ where: { id: cur.id }, data: { metadata: meta as object } })
    return { ...meta, id: cur.id }
  }
  const row = await db.mockActivity.create({ data: { userId, type: ACCESS, title: "Facebook & Instagram ads connected", metadata: meta as object } })
  return { ...meta, id: row.id }
}

export async function patchAccess(userId: string, patch: Partial<Omit<MetaAdsAccess, "id">>): Promise<MetaAdsAccess | null> {
  const cur = await getAccess(userId)
  if (!cur) return null
  const { id, ...rest } = { ...cur, ...patch }
  await db.mockActivity.update({ where: { id }, data: { metadata: rest as object } })
  return { ...rest, id }
}

export async function removeAccess(userId: string): Promise<boolean> {
  const r = await db.mockActivity.deleteMany({ where: { userId, type: ACCESS } })
  return r.count > 0
}

// ── Campaigns ───────────────────────────────────────────────────────────────
export async function listCampaigns(userId: string, take = 20): Promise<MetaCampaign[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: CAMPAIGN }, orderBy: { createdAt: "desc" }, take })
  return rows.map((r) => ({ ...(r.metadata as Omit<MetaCampaign, "id">), id: r.id }))
}
export async function getCampaign(userId: string, id: string): Promise<MetaCampaign | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: CAMPAIGN } })
  return r ? { ...(r.metadata as Omit<MetaCampaign, "id">), id: r.id } : null
}
export async function createCampaign(userId: string, c: Omit<MetaCampaign, "id">): Promise<MetaCampaign> {
  const row = await db.mockActivity.create({ data: { userId, type: CAMPAIGN, title: `Planned a Facebook & Instagram campaign: “${c.name}”`, metadata: c as object } })
  return { ...c, id: row.id }
}
export async function saveCampaign(userId: string, c: MetaCampaign): Promise<void> {
  const { id, ...rest } = c
  await db.mockActivity.updateMany({ where: { id, userId, type: CAMPAIGN }, data: { metadata: rest as object } })
}
/** Campaigns that exist on Meta (built, paused or running). */
export const liveCampaigns = (list: MetaCampaign[]) => list.filter((c) => (c.status === "paused" || c.status === "active") && c.built?.campaignId)

// ── Change log ──────────────────────────────────────────────────────────────
export type AdsChange = { platform: "meta"; campaignRowId?: string; objectId?: string; what: string; why: string; by: "owner" | "autopilot"; before?: string | number | null; after?: string | number | null; at: string }
export async function logChange(userId: string, c: Omit<AdsChange, "platform" | "at">): Promise<void> {
  const row: AdsChange = { platform: "meta", ...c, at: new Date().toISOString() }
  await db.mockActivity.create({ data: { userId, type: CHANGE, title: `Meta ads: ${c.what}`.slice(0, 190), metadata: row as object } })
}
export async function recentChanges(userId: string, take = 10): Promise<AdsChange[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: CHANGE, metadata: { path: ["platform"], equals: "meta" } }, orderBy: { createdAt: "desc" }, take })
  return rows.map((r) => r.metadata as AdsChange)
}

// ── Leads ───────────────────────────────────────────────────────────────────
export type StoredLead = { id: string; leadId: string; campaignRowId: string; formId: string; adId?: string | null; createdTime: string; seenAt?: string | null; contactEnc: string }
export type Contact = { name?: string; email?: string; phone?: string }

export async function knownLeadIds(userId: string, campaignRowId: string): Promise<Set<string>> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: LEAD, metadata: { path: ["campaignRowId"], equals: campaignRowId } }, select: { metadata: true }, take: 2000 })
  return new Set(rows.map((r) => (r.metadata as { leadId: string }).leadId))
}
export async function addLead(userId: string, l: Omit<StoredLead, "id" | "contactEnc"> & { contact: Contact }): Promise<void> {
  const { contact, ...rest } = l
  // The title is shown in the work log: no name, email or phone in it.
  await db.mockActivity.create({ data: { userId, type: LEAD, title: "New lead from your Facebook & Instagram ad", metadata: { ...rest, contactEnc: enc(JSON.stringify(contact)) } as object } })
}
export async function listLeads(userId: string, o: { take?: number; sinceDays?: number } = {}): Promise<(StoredLead & { contact: Contact })[]> {
  const rows = await db.mockActivity.findMany({
    where: { userId, type: LEAD, ...(o.sinceDays ? { createdAt: { gte: new Date(Date.now() - o.sinceDays * 86_400_000) } } : {}) },
    orderBy: { createdAt: "desc" },
    take: o.take ?? 20,
  })
  return rows.map((r) => {
    const m = r.metadata as Omit<StoredLead, "id">
    let contact: Contact = {}
    try { contact = JSON.parse(decryptSecret(m.contactEnc)) as Contact } catch { contact = {} }
    return { ...m, id: r.id, contact }
  })
}
export async function countLeads(userId: string, sinceDays: number): Promise<number> {
  return db.mockActivity.count({ where: { userId, type: LEAD, createdAt: { gte: new Date(Date.now() - sinceDays * 86_400_000) } } })
}
export async function markLeadsSeen(userId: string): Promise<void> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: LEAD, createdAt: { gte: new Date(Date.now() - 60 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 200 })
  const at = new Date().toISOString()
  for (const r of rows) if (!(r.metadata as { seenAt?: string | null }).seenAt) await db.mockActivity.update({ where: { id: r.id }, data: { metadata: { ...(r.metadata as object), seenAt: at } } })
}

// ── Tuning passes ───────────────────────────────────────────────────────────
export type TuneAction =
  | { kind: "pause_ad"; campaignRowId: string; adId: string; spend: number; results: number; why: string }
  | { kind: "budget"; campaignRowId: string; adSetId: string; from: number; to: number; why: string }
export type TunePass = { id: string; at: string; status: "proposed" | "applied" | "dismissed" | "nothing"; mode: "each" | "budget"; actions: TuneAction[]; summary: string[]; currency: string }

export async function latestTune(userId: string): Promise<TunePass | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: TUNE }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<TunePass, "id">), id: r.id } : null
}
export async function getTune(userId: string, id: string): Promise<TunePass | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: TUNE } })
  return r ? { ...(r.metadata as Omit<TunePass, "id">), id: r.id } : null
}
export async function saveTune(userId: string, t: Omit<TunePass, "id"> & { id?: string }): Promise<TunePass> {
  const { id, ...rest } = t
  if (id) {
    await db.mockActivity.updateMany({ where: { id, userId, type: TUNE }, data: { metadata: rest as object } })
    return { ...rest, id }
  }
  const row = await db.mockActivity.create({ data: { userId, type: TUNE, title: "Checked your Facebook & Instagram ads for the week", metadata: rest as object } })
  return { ...rest, id: row.id }
}
