// Google Ads storage, as MockActivity rows (no schema change):
//   gads_account  one per brand: the encrypted refresh token, the chosen ad account, the campaign I built
//   gads_plan     the campaign I proposed (waits for the owner's approval)
//   gads_tune     a weekly tuning pass: what I changed or propose to change, and why
//   ads_change    every write I made to the owner's Google Ads account (the audit log; shown in the ledger)
// Tokens are AES-256-GCM encrypted (encryptSecret) and never logged.
import { db } from "@/lib/db"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import type { AdPlan } from "./plan-types"

const ACC = "gads_account"
const PLAN = "gads_plan"
const TUNE = "gads_tune"
export const ADS_CHANGE = "ads_change"

export const enc = (s: string) => encryptSecret(s)
export const dec = (s: string) => decryptSecret(s)

export type GadsChoice = { id: string; name: string; currency: string; test: boolean }
export type GadsCampaign = {
  resourceName: string
  budget: string
  adGroups: string[]
  name: string
  status: "PAUSED" | "ENABLED"
  daily: number
  createdAt: string
  enabledAt?: string
  planId: string
}
export type GadsAccount = {
  id: string
  refreshEnc: string
  scope: string
  connectedAt: string
  status: "active" | "expired"
  customerId?: string
  customerName?: string
  currency?: string
  timeZone?: string
  test?: boolean
  choices?: GadsChoice[]
  campaign?: GadsCampaign
}

export async function getGadsAccount(userId: string): Promise<GadsAccount | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: ACC }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<GadsAccount, "id">), id: r.id } : null
}

export async function saveGadsAccount(userId: string, patch: Partial<Omit<GadsAccount, "id">>): Promise<GadsAccount> {
  const cur = await getGadsAccount(userId)
  const { id: _id, ...base } = cur ?? ({ id: "", refreshEnc: "", scope: "", connectedAt: new Date().toISOString(), status: "active" } as GadsAccount)
  void _id
  const next = { ...base, ...patch }
  for (const k of Object.keys(next) as (keyof typeof next)[]) if (next[k] === undefined) delete next[k]
  if (cur) {
    await db.mockActivity.update({ where: { id: cur.id }, data: { metadata: next as object } })
    return { ...next, id: cur.id }
  }
  const row = await db.mockActivity.create({ data: { userId, type: ACC, title: "Connected Google Ads", metadata: next as object } })
  return { ...next, id: row.id }
}

/** A one-time message for the Ads thread (connect results), kept even when no account row exists yet. */
export async function setNote(userId: string, text: string): Promise<void> {
  await db.mockActivity.deleteMany({ where: { userId, type: "gads_note" } })
  await db.mockActivity.create({ data: { userId, type: "gads_note", title: text.slice(0, 300) } })
}
export async function takeNote(userId: string): Promise<string | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: "gads_note" }, orderBy: { createdAt: "desc" } })
  if (!r) return null
  await db.mockActivity.deleteMany({ where: { userId, type: "gads_note" } })
  return r.title
}

export async function removeGadsAccount(userId: string): Promise<void> {
  await db.mockActivity.deleteMany({ where: { userId, type: ACC } })
}

// ── Plans ──────────────────────────────────────────────────────────────────

export async function latestPlan(userId: string): Promise<AdPlan | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: PLAN }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<AdPlan, "id">), id: r.id } : null
}
export async function getPlan(userId: string, id: string): Promise<AdPlan | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: PLAN } })
  return r ? { ...(r.metadata as Omit<AdPlan, "id">), id: r.id } : null
}
export async function createPlan(userId: string, p: Omit<AdPlan, "id">): Promise<AdPlan> {
  const row = await db.mockActivity.create({ data: { userId, type: PLAN, title: `Google Ads plan: ${p.campaignName}`, metadata: p as object } })
  return { ...p, id: row.id }
}
export async function savePlan(userId: string, p: AdPlan): Promise<void> {
  const { id, ...rest } = p
  await db.mockActivity.updateMany({ where: { id, userId, type: PLAN }, data: { metadata: rest as object } })
}

// ── Weekly tuning ────────────────────────────────────────────────────────────

export type TuneAction =
  | { kind: "negative"; term: string; cost: number; clicks: number; why: string }
  | { kind: "pause_keyword"; criterion: string; text: string; cost: number; clicks: number; why: string }
  | { kind: "lower_budget"; from: number; to: number; why: string }
export type Tune = {
  id: string
  at: string
  status: "proposed" | "applied" | "skipped" | "undone" | "nothing" | "failed"
  campaign: string
  currency: string
  /** Real numbers from Google Ads for the window the rules looked at. */
  window: { days: number; cost: number; clicks: number; conversions: number }
  tracking: boolean
  actions: TuneAction[]
  /** Resource names I created (negatives), so they can be undone. */
  created?: string[]
  error?: string
}

export async function latestTune(userId: string): Promise<Tune | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: TUNE }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<Tune, "id">), id: r.id } : null
}
export async function getTune(userId: string, id: string): Promise<Tune | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: TUNE } })
  return r ? { ...(r.metadata as Omit<Tune, "id">), id: r.id } : null
}
export async function createTune(userId: string, t: Omit<Tune, "id">): Promise<Tune> {
  const row = await db.mockActivity.create({ data: { userId, type: TUNE, title: "Google Ads weekly tune-up", metadata: t as object } })
  return { ...t, id: row.id }
}
export async function saveTune(userId: string, t: Tune): Promise<void> {
  const { id, ...rest } = t
  await db.mockActivity.updateMany({ where: { id, userId, type: TUNE }, data: { metadata: rest as object } })
}

// ── Change log ───────────────────────────────────────────────────────────────

export type AdsChange = {
  op: "create_campaign" | "enable" | "pause" | "add_negatives" | "pause_keywords" | "lower_budget" | "undo_negatives" | "budget" | "note"
  customerId: string
  resources: string[]
  ops: number
  /** How to undo it from the Ads thread, if it can be undone. */
  undo?: "pause" | "enable" | "remove_negatives" | "enable_keywords" | null
  detail?: string
  by: "owner" | "agent"
  /** Set when one of the owner's ad rules made this change (lib/ad-rules). */
  rule?: import("@/lib/ad-rules/run").RuleMark
}

export async function logChange(userId: string, title: string, c: AdsChange): Promise<void> {
  await db.mockActivity.create({ data: { userId, type: ADS_CHANGE, title, metadata: c as object } })
}

export async function recentChanges(userId: string, take = 8) {
  // Rows without a platform are Google's (the original format); Meta and LinkedIn rows carry theirs.
  return db.mockActivity.findMany({ where: { userId, type: ADS_CHANGE, NOT: [{ metadata: { path: ["platform"], equals: "meta" } }, { metadata: { path: ["platform"], equals: "linkedin" } }] }, orderBy: { createdAt: "desc" }, take, select: { id: true, title: true, createdAt: true, metadata: true } })
}
