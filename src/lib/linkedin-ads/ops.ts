// LinkedIn Ads for one brand: the connection (MockActivity `li_ads_account`, token AES-GCM
// encrypted, scopes, ad accounts), promoted company Page posts (`li_ads_campaign`) and the owner's
// taps. Everything is built PAUSED; only the owner's "Turn it on" goes live, inside the monthly
// limit and the ad-account allowance. Hidden until linkedinAdsOn() (lib/linkedin-ads/api.ts).
import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { decryptSecret, encryptSecret } from "@/lib/checks/bing-webmaster"
import { getAgentSettings } from "@/lib/agent/settings"
import { checkQuota } from "@/lib/quotas"
import { tallyUsage } from "@/lib/usage"
import { adAccountAllowance, adAccountsInUse } from "@/lib/ad-accounts"
import { dailyFromMonthly, monthlyFromDaily } from "@/lib/gads/rules"
import { metaMonthlyCommitment } from "@/lib/metaads/plan"
import { getGadsAccount } from "@/lib/gads/store"
import { promotablePosts } from "@/lib/promote/posts"
import { hasAdsScopes, idOf, liCall, linkedinAdsOn, liPromoRequests, liStatusPatch, LI_ADS_SCOPES } from "./api"

const ACC = "li_ads_account"
const CAMP = "li_ads_campaign"
const APP = () => process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
const CLIENT_ID = () => process.env.LINKEDIN_ADS_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID || ""
const CLIENT_SECRET = () => process.env.LINKEDIN_ADS_CLIENT_SECRET || process.env.LINKEDIN_CLIENT_SECRET || ""
export const liAdsRedirect = () => `${APP()}/api/linkedin-ads/callback`

export type LiAdAccount = { id: string; name: string; currency: string; status: string; reference?: string | null }
export type LiAdsAccess = { id: string; tokenEnc: string; scope: string; expiresAt: string | null; accounts: LiAdAccount[]; pick?: string | null; connectedAt: string }
export type LiPromo = { id: string; status: "paused" | "active" | "failed"; name: string; adAccountId: string; currency: string; daily: number; days: number; postUrn: string; socialPostId: string; groupUrn?: string; campaignUrn?: string; creativeUrn?: string; endsAt?: string | null; error?: string | null; createdAt: string }

// ── OAuth (its own state: who is connecting + when, HMAC-signed) ─────────────
const stateKey = () => process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
export function liAdsState(userId: string): string {
  const body = Buffer.from(JSON.stringify({ u: userId, n: randomBytes(8).toString("hex"), t: Date.now() })).toString("base64url")
  return `${body}.${createHmac("sha256", stateKey()).update(`liads:${body}`).digest("base64url")}`
}
export function readLiAdsState(raw: string | null): { u: string } | null {
  const [body, sig] = (raw ?? "").split(".")
  if (!body || !sig) return null
  const want = createHmac("sha256", stateKey()).update(`liads:${body}`).digest("base64url")
  if (want.length !== sig.length || !timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as { u: string; t: number }
    return Date.now() - s.t < 60 * 60_000 ? { u: s.u } : null
  } catch { return null }
}
export const liAdsAuthUrl = (state: string) => `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({ response_type: "code", client_id: CLIENT_ID(), redirect_uri: liAdsRedirect(), state, scope: LI_ADS_SCOPES.join(" ") })}`

export async function connectLiAds(userId: string, code: string): Promise<LiAdsAccess> {
  const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: liAdsRedirect(), client_id: CLIENT_ID(), client_secret: CLIENT_SECRET() }), signal: AbortSignal.timeout(20_000) })
  const t = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; scope?: string; error_description?: string }
  if (!r.ok || !t.access_token) throw new Error(t.error_description ?? "LinkedIn didn’t give me access.")
  const scope = t.scope ?? ""
  if (!hasAdsScopes(scope)) throw new Error("LinkedIn didn’t grant ads access (r_ads and rw_ads) to this login.")
  const res = await liCall(t.access_token, "adAccounts?q=search&search=(status:(values:List(ACTIVE)))")
  const accounts: LiAdAccount[] = ((res.data.elements as { id: number; name?: string; currency?: string; status?: string; reference?: string }[] | undefined) ?? []).map((a) => ({ id: String(a.id), name: a.name ?? `Ad account ${a.id}`, currency: a.currency ?? "USD", status: a.status ?? "ACTIVE", reference: a.reference ?? null }))
  const meta = { tokenEnc: encryptSecret(t.access_token), scope, expiresAt: t.expires_in ? new Date(Date.now() + t.expires_in * 1000).toISOString() : null, accounts, pick: accounts.length === 1 ? accounts[0].id : null, connectedAt: new Date().toISOString() }
  await db.mockActivity.deleteMany({ where: { userId, type: ACC } })
  const row = await db.mockActivity.create({ data: { userId, type: ACC, title: "LinkedIn Ads connected", metadata: meta as object } })
  return { ...meta, id: row.id }
}

export async function getLiAds(userId: string): Promise<LiAdsAccess | null> {
  const r = await db.mockActivity.findFirst({ where: { userId, type: ACC }, orderBy: { createdAt: "desc" } })
  return r ? { ...(r.metadata as Omit<LiAdsAccess, "id">), id: r.id } : null
}
export async function pickLiAccount(userId: string, id: string): Promise<boolean> {
  const a = await getLiAds(userId)
  if (!a || !a.accounts.some((x) => x.id === id)) return false
  const { id: rowId, ...rest } = a
  await db.mockActivity.update({ where: { id: rowId }, data: { metadata: { ...rest, pick: id } as object } })
  return true
}
/** Usable: flag on, token not expired, both ads scopes. */
export const liAdsUsable = (a: LiAdsAccess | null) => !!a && linkedinAdsOn() && hasAdsScopes(a.scope) && (!a.expiresAt || Date.parse(a.expiresAt) > Date.now())

export async function listPromos(userId: string): Promise<LiPromo[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: CAMP }, orderBy: { createdAt: "desc" }, take: 20 })
  return rows.map((r) => ({ ...(r.metadata as Omit<LiPromo, "id">), id: r.id }))
}
async function savePromo(userId: string, p: LiPromo) {
  const { id, ...rest } = p
  await db.mockActivity.updateMany({ where: { id, userId, type: CAMP }, data: { metadata: rest as object } })
}
async function logLi(userId: string, title: string, meta: Record<string, unknown>) {
  await db.mockActivity.create({ data: { userId, type: "ads_change", title, metadata: { platform: "linkedin", ...meta } as object } })
}

/** Daily room under the monthly limit after Google, Meta and LinkedIn spend that's on. Null = no limit. */
async function liRoom(userId: string, exceptId?: string): Promise<number | null> {
  const cap = (await getAgentSettings(userId)).autopilot?.adBudget ?? null
  if (!cap || cap <= 0) return null
  const [meta, g, promos] = await Promise.all([metaMonthlyCommitment(userId).catch(() => 0), getGadsAccount(userId).catch(() => null), listPromos(userId)])
  const google = g?.campaign?.status === "ENABLED" ? monthlyFromDaily(g.campaign.daily) : 0
  const li = monthlyFromDaily(promos.filter((p) => p.status === "active" && p.id !== exceptId).reduce((s, p) => s + p.daily, 0))
  return dailyFromMonthly(Math.max(0, cap - meta - google - li))
}

/** LinkedIn counts toward the total ad-account allowance like Google and Meta. */
async function allowanceOk(user: User, accountId: string): Promise<string | null> {
  const allowance = await adAccountAllowance(user)
  if (allowance === Infinity) return null
  if (allowance === 0) return "LinkedIn Ads come with the Growth plan."
  const used = new Set(await adAccountsInUse(user.id))
  const live = (await listPromos(user.id)).filter((p) => p.status === "active").map((p) => `linkedin:${p.adAccountId}`)
  for (const l of live) used.add(l)
  used.add(`linkedin:${accountId}`)
  return used.size > allowance ? `Your plan covers ${allowance === 1 ? "1 ad account" : `${allowance} ad accounts`} in total, and LinkedIn would be one more.` : null
}

export type LiResult = { ok: true; said: string } | { ok: false; error: string; status?: number }

/** Build a Sponsored Content campaign from a company Page post, PAUSED. */
export async function promoteOnLinkedIn(user: User, o: { socialPostId: string; accountId: string; daily: number; days: number; notPolitical: boolean }): Promise<LiResult> {
  const a = await getLiAds(user.id)
  if (!liAdsUsable(a) || !a) return { ok: false, error: "LinkedIn Ads aren’t connected.", status: 409 }
  const acct = a.accounts.find((x) => x.id === a.pick)
  if (!acct) return { ok: false, error: "Pick your LinkedIn ad account first.", status: 409 }
  if (!user.city?.trim()) return { ok: false, error: "Add your city first, so I only show it to people near you.", status: 409 }
  if (![3, 7, 14].includes(o.days)) return { ok: false, error: "Pick 3, 7 or 14 days." }
  const daily = Math.round(o.daily * 100) / 100
  // LinkedIn's own floor for a daily budget is 10 in the account currency.
  if (!(daily >= 10) || daily > 100_000) return { ok: false, error: "LinkedIn needs at least 10 a day." }
  const room = await liRoom(user.id)
  if (room !== null && daily > room + 0.001) return { ok: false, error: `That’s over your monthly limit. The most I can add a day is ${Math.max(0, Math.floor(room * 100) / 100)} ${acct.currency}.`, status: 409 }
  const pick = (await promotablePosts(user.id)).find((p) => p.socialPostId === o.socialPostId && p.accountId === o.accountId && p.platform === "linkedin")
  if (!pick) return { ok: false, error: "I can’t find that company Page post any more.", status: 404 }
  const acc = await db.mockActivity.findFirst({ where: { id: o.accountId, userId: user.id, type: "social_account" }, select: { metadata: true } })
  const orgUrn = (acc?.metadata as { extra?: { author?: string } } | null)?.extra?.author ?? ""
  if (acct.reference && acct.reference !== orgUrn) return { ok: false, error: "That ad account belongs to a different company Page.", status: 409 }
  const block = await allowanceOk(user, acct.id)
  if (block) return { ok: false, error: block, status: 402 }
  const q = await checkQuota(user, "ad_change")
  if (!q.allowed) return { ok: false, error: q.message ?? "Out of ad changes for today.", status: 429 }

  const token = decryptSecret(a.tokenEnc)
  const geo = await liCall(token, `adTargetingEntities?q=typeahead&facet=${encodeURIComponent("urn:li:adTargetingFacet:locations")}&query=${encodeURIComponent(user.city)}`).catch(() => null)
  const geoUrns = ((geo?.data.elements as { urn?: string }[] | undefined) ?? []).map((e) => e.urn).filter((u): u is string => !!u).slice(0, 1)
  const name = `${(user.businessName ?? "Alphaa").slice(0, 50)} · promoted post · ${new Date().toISOString().slice(0, 10)}`
  let req: ReturnType<typeof liPromoRequests>
  try { req = liPromoRequests({ adAccountId: acct.id, currency: acct.currency, name, orgUrn, postUrn: pick.externalId, dailyBudget: daily, days: o.days, geoUrns, notPolitical: o.notPolitical, startMs: Date.now() }) } catch (err) { return { ok: false, error: err instanceof Error ? err.message : "That post can’t be promoted.", status: 409 } }
  const row = await db.mockActivity.create({ data: { userId: user.id, type: CAMP, title: `Promoted LinkedIn post: ${name}`.slice(0, 190), metadata: { status: "paused", name, adAccountId: acct.id, currency: acct.currency, daily, days: o.days, postUrn: pick.externalId, socialPostId: pick.socialPostId, createdAt: new Date().toISOString() } as object } })
  const p: LiPromo = { id: row.id, status: "paused", name, adAccountId: acct.id, currency: acct.currency, daily, days: o.days, postUrn: pick.externalId, socialPostId: pick.socialPostId, createdAt: new Date().toISOString() }
  try {
    const g = await liCall(token, `adAccounts/${acct.id}/adCampaignGroups`, { method: "POST", body: req.group })
    p.groupUrn = g.id ? (g.id.startsWith("urn:") ? g.id : `urn:li:sponsoredCampaignGroup:${g.id}`) : undefined
    if (!p.groupUrn) throw new Error("LinkedIn didn’t return the campaign group.")
    const c = await liCall(token, `adAccounts/${acct.id}/adCampaigns`, { method: "POST", body: req.campaign(p.groupUrn) })
    p.campaignUrn = c.id ? (c.id.startsWith("urn:") ? c.id : `urn:li:sponsoredCampaign:${c.id}`) : undefined
    if (!p.campaignUrn) throw new Error("LinkedIn didn’t return the campaign.")
    const cr = await liCall(token, `adAccounts/${acct.id}/creatives`, { method: "POST", body: req.creative(p.campaignUrn) })
    p.creativeUrn = cr.id ?? undefined
    tallyUsage(user.id, "ads_op", 3)
    await savePromo(user.id, p)
    await logLi(user.id, `Built a LinkedIn promotion of your company Page post (paused, ${daily} ${acct.currency} a day for ${o.days} days)`, { by: "owner", op: "create", accountId: acct.id })
    return { ok: true, said: `It’s built and paused on LinkedIn at ${daily} ${acct.currency} a day for ${o.days} days. Nothing is spending. Turn it on when you’re ready.` }
  } catch (err) {
    p.status = "failed"; p.error = err instanceof Error ? err.message.slice(0, 200) : "LinkedIn said no"
    await savePromo(user.id, p)
    return { ok: false, error: `LinkedIn didn’t accept it: ${p.error}`, status: 502 }
  }
}

/** The owner's tap: on (restarts its days from now, cap + allowance checked) or pause (never blocked). */
export async function setLiPromo(user: User, id: string, on: boolean): Promise<LiResult> {
  const a = await getLiAds(user.id)
  const p = (await listPromos(user.id)).find((x) => x.id === id)
  if (!a || !p?.campaignUrn) return { ok: false, error: "That promotion isn’t built.", status: 409 }
  if (on) {
    if (!liAdsUsable(a)) return { ok: false, error: "Reconnect LinkedIn Ads first.", status: 409 }
    const room = await liRoom(user.id, p.id)
    if (room !== null && p.daily > room + 0.001) return { ok: false, error: "Turning this on would go over your monthly limit.", status: 409 }
    const block = await allowanceOk(user, p.adAccountId)
    if (block) return { ok: false, error: block, status: 402 }
    const q = await checkQuota(user, "ad_change")
    if (!q.allowed) return { ok: false, error: q.message ?? "Out of ad changes for today.", status: 429 }
  }
  const now = Date.now()
  await liCall(decryptSecret(a.tokenEnc), `adAccounts/${p.adAccountId}/adCampaigns/${idOf(p.campaignUrn)}`, { method: "POST", restliMethod: "PARTIAL_UPDATE", body: liStatusPatch(on, { startMs: now, days: p.days }) })
  tallyUsage(user.id, "ads_op")
  p.status = on ? "active" : "paused"
  if (on) p.endsAt = new Date(now + p.days * 86_400_000).toISOString()
  await savePromo(user.id, p)
  await logLi(user.id, on ? `Turned on your LinkedIn promotion “${p.name}”` : `Paused your LinkedIn promotion “${p.name}”`, { by: "owner", op: on ? "enable" : "pause", accountId: p.adAccountId })
  return { ok: true, said: on ? `It’s on until ${new Date(now + p.days * 86_400_000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. LinkedIn reviews it first.` : "Paused. It stops spending right away." }
}
