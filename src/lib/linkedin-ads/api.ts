// LinkedIn Advertising API (Sponsored Content from an existing company Page post). Hidden until
// LinkedIn grants the Advertising API to our app AND `LINKEDIN_ADS=1` (scopes r_ads + rw_ads).
// Pure request builders + one fetch helper (injectable, so tests never call LinkedIn).
//
// Checked on learn.microsoft.com (LinkedIn Marketing API, version 202611), 2026-11-28:
// - Campaign group: POST /rest/adAccounts/{id}/adCampaignGroups { account, name, runSchedule.start,
//   status ACTIVE|DRAFT, totalBudget? }; id in the x-restli-id header.
// - Campaign: POST /rest/adAccounts/{id}/adCampaigns { account, campaignGroup, associatedEntity
//   (the organization), type SPONSORED_UPDATES, format STANDARD_UPDATE, objectiveType ENGAGEMENT,
//   costType, dailyBudget {amount, currencyCode}, runSchedule {start, end}, locale, status PAUSED,
//   offsiteDeliveryEnabled (required), politicalIntent (required; NOT_POLITICAL only when the
//   advertiser confirmed it), targetingCriteria (locations + interfaceLocales) }.
// - Creative: POST /rest/adAccounts/{id}/creatives { campaign, content.reference (share or ugcPost
//   URN), intendedStatus }. The parent campaign's PAUSED overrides an ACTIVE creative.
// - Update: POST /rest/adAccounts/{id}/adCampaigns/{cid} { patch: { $set: {...} } } with
//   X-RestLi-Method: PARTIAL_UPDATE.
// - Headers: LinkedIn-Version YYYYMM, X-Restli-Protocol-Version 2.0.0.
// - Permissions: rw_ads (r_ads to read); the member needs an ad-account role (CAMPAIGN_MANAGER or
//   above) and the Page role ADMINISTRATOR or DIRECT_SPONSORED_CONTENT_POSTER to sponsor its posts.
// Not verified live (no access yet): bidding fields (costType CPM + optimizationTargetType
// MAX_IMPRESSION, unitCost left to its auto-bid default). Check them on the first test account.

export const LI_ADS_VERSION = () => process.env.LINKEDIN_ADS_VERSION || "202611"
export const LI_ADS_SCOPES = ["r_ads", "rw_ads", "r_ads_reporting"] as const
export const LI = "https://api.linkedin.com/rest"

/** On when LinkedIn approved the Advertising API and the env flag + client keys are set. */
export function linkedinAdsOn(): boolean {
  return process.env.LINKEDIN_ADS === "1" && !!(process.env.LINKEDIN_ADS_CLIENT_ID || process.env.LINKEDIN_CLIENT_ID) && !!(process.env.LINKEDIN_ADS_CLIENT_SECRET || process.env.LINKEDIN_CLIENT_SECRET)
}
/** A token can manage ads only with both scopes. */
export const hasAdsScopes = (scope: string | null | undefined) => {
  const s = new Set((scope ?? "").split(/[\s,]+/))
  return s.has("rw_ads") && s.has("r_ads")
}

export const accountUrn = (id: string) => `urn:li:sponsoredAccount:${id.replace(/\D/g, "")}`
export const idOf = (urn: string) => urn.split(":").pop() ?? urn

export type LiPromoSpec = {
  adAccountId: string // numeric
  currency: string
  name: string
  orgUrn: string // urn:li:organization:123
  postUrn: string // urn:li:share:… | urn:li:ugcPost:…
  dailyBudget: number
  days: number
  geoUrns: string[] // urn:li:geo:…
  /** The owner ticked "This isn't political advertising". */
  notPolitical: boolean
  startMs: number
}

const money = (n: number, currency: string) => ({ amount: (Math.round(n * 100) / 100).toFixed(2), currencyCode: currency })

/** Pure: the three create bodies. The campaign is PAUSED; the creative waits under it. */
export function liPromoRequests(s: LiPromoSpec) {
  if (!/^urn:li:(share|ugcPost):\d+$/.test(s.postUrn)) throw new Error("LinkedIn can only sponsor a company Page post.")
  if (!/^urn:li:organization:\d+$/.test(s.orgUrn)) throw new Error("That post isn’t from a company Page.")
  if (!s.geoUrns.length) throw new Error("I need your city to show it to people near you.")
  const account = accountUrn(s.adAccountId)
  const end = s.startMs + s.days * 86_400_000
  return {
    group: { account, name: s.name.slice(0, 190), runSchedule: { start: s.startMs, end }, status: "ACTIVE" },
    campaign: (groupUrn: string) => ({
      account, campaignGroup: groupUrn, associatedEntity: s.orgUrn, name: s.name.slice(0, 190),
      type: "SPONSORED_UPDATES", format: "STANDARD_UPDATE", objectiveType: "ENGAGEMENT",
      costType: "CPM", optimizationTargetType: "MAX_IMPRESSION",
      dailyBudget: money(s.dailyBudget, s.currency),
      runSchedule: { start: s.startMs, end },
      locale: { country: "US", language: "en" },
      status: "PAUSED", offsiteDeliveryEnabled: false, audienceExpansionEnabled: false,
      politicalIntent: s.notPolitical ? "NOT_POLITICAL" : "NOT_DECLARED",
      targetingCriteria: { include: { and: [
        { or: { "urn:li:adTargetingFacet:locations": s.geoUrns } },
        { or: { "urn:li:adTargetingFacet:interfaceLocales": ["urn:li:locale:en_US"] } },
      ] } },
    }),
    creative: (campaignUrn: string) => ({ campaign: campaignUrn, content: { reference: s.postUrn }, intendedStatus: "ACTIVE" }),
  }
}

/** Pure: the patch that turns a campaign on (and restarts its days from now) or pauses it. */
export function liStatusPatch(on: boolean, o: { startMs?: number; days?: number } = {}) {
  const set: Record<string, unknown> = { status: on ? "ACTIVE" : "PAUSED" }
  if (on && o.startMs && o.days) set.runSchedule = { start: o.startMs, end: o.startMs + o.days * 86_400_000 }
  return { patch: { $set: set } }
}

export type LiFetch = (url: string, init: RequestInit) => Promise<Response>

/** One LinkedIn REST call. Returns the JSON body (or {}) and the x-restli-id header. The token never reaches a log. */
export async function liCall(token: string, path: string, o: { method?: "GET" | "POST"; body?: unknown; restliMethod?: string; fetchImpl?: LiFetch } = {}): Promise<{ data: Record<string, unknown>; id: string | null }> {
  const f = o.fetchImpl ?? fetch
  const r = await f(`${LI}/${path.replace(/^\//, "")}`, {
    method: o.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, "LinkedIn-Version": LI_ADS_VERSION(), "X-Restli-Protocol-Version": "2.0.0", ...(o.body ? { "Content-Type": "application/json" } : {}), ...(o.restliMethod ? { "X-RestLi-Method": o.restliMethod } : {}) },
    ...(o.body ? { body: JSON.stringify(o.body) } : {}),
    signal: AbortSignal.timeout(20_000),
  })
  const text = await r.text()
  if (!r.ok) {
    let msg = text.slice(0, 200)
    try { msg = String((JSON.parse(text) as { message?: string }).message ?? msg) } catch { /* plain text */ }
    throw new Error(`LinkedIn ${r.status}: ${msg}`)
  }
  let data: Record<string, unknown> = {}
  try { data = text ? (JSON.parse(text) as Record<string, unknown>) : {} } catch { data = {} }
  return { data, id: r.headers.get("x-restli-id") }
}
