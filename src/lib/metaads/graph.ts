// Meta Marketing API calls for Facebook + Instagram ads. No database here, so the whole
// create/tune sequence can be tested with a mocked global fetch.
//
// Checked on developers.facebook.com, 2026-11-18:
// - Graph/Marketing API v27.0 is current (introduced 2026-11-04).
// - Campaign: POST /act_{id}/campaigns  name, objective OUTCOME_LEADS|OUTCOME_TRAFFIC, status PAUSED,
//   special_ad_categories (required array; NONE | HOUSING | EMPLOYMENT | FINANCIAL_PRODUCTS_SERVICES …),
//   special_ad_category_country (required when a category is set). Budget lives on the ad set.
// - Ad set: POST /act_{id}/adsets  daily_budget (minor units), billing_event IMPRESSIONS,
//   optimization_goal LEAD_GENERATION (+ promoted_object.page_id, destination_type ON_AD) or
//   LINK_CLICKS, targeting incl. targeting_automation.advantage_audience (explicit 0/1 since v23).
// - Images: POST /act_{id}/adimages  bytes=<base64> → { images: { <name>: { hash, url } } }.
// - Creative: object_story_spec { page_id, instagram_user_id (instagram_actor_id is deprecated),
//   link_data { image_hash, link, message, name, description, call_to_action } }.
//   Lead ads: call_to_action.value.lead_gen_form_id; link may only be the fb.me link.
// - Lead form: POST /{page_id}/leadgen_forms with a Page token (questions FULL_NAME/EMAIL/PHONE).
// - Leads: GET /{form_id}/leads fields created_time,id,ad_id,form_id,field_data, filtering time_created.
// - Special ad categories: ages 18-65+, no gender choice, ≥15 mi / 25 km radius (US/CA), no zips.
// Checked 2026-11-28 (Ad Campaign Group ODAX mapping table + Ad reference):
// - OUTCOME_LEADS · ON_AD · LEAD_GENERATION → promoted_object { page_id } (instant form).
// - OUTCOME_LEADS · website · OFFSITE_CONVERSIONS → promoted_object { pixel_id, custom_event_type: "LEAD" }.
// - OUTCOME_TRAFFIC · website · LINK_CLICKS (or LANDING_PAGE_VIEWS) → no promoted_object for web.
// - Ads: tracking_specs [{ "action.type": ["offsite_conversion"], fb_pixel: [pixel_id] }] logs the
//   pixel's website events against the ad (any objective), so the chosen pixel is always linked.
import { api } from "@/lib/social/oauth"

export const GRAPH_VERSION = "v27.0"
export const G = `https://graph.facebook.com/${GRAPH_VERSION}`

/** One Graph call. The token never goes into an error or a log line. */
export async function graph<T>(path: string, token: string, o: { method?: "GET" | "POST" | "DELETE"; params?: Record<string, unknown> } = {}): Promise<T> {
  const method = o.method ?? "GET"
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o.params ?? {})) if (v !== undefined && v !== null) p.set(k, typeof v === "string" ? v : JSON.stringify(v))
  p.set("access_token", token)
  const url = path.startsWith("http") ? path : `${G}/${path.replace(/^\//, "")}`
  // A paging "next" link already has a query string (and the token); add ours after it.
  if (method === "GET" && url.includes("?")) {
    const u = new URL(url)
    for (const [k, v] of p) u.searchParams.set(k, v)
    return api<T>(u.toString())
  }
  return method === "GET" ? api<T>(`${url}?${p}`) : api<T>(url, { method, body: p })
}

// ── Accounts ────────────────────────────────────────────────────────────────
export type AdAccount = { id: string; name: string; account_status: number; currency: string; timezone_name: string }
export type Pixel = { id: string; name: string }

const AD_FIELDS = "id,name,account_status,currency,timezone_name"
const clean = (a: AdAccount): AdAccount => ({ id: a.id, name: a.name, account_status: a.account_status, currency: a.currency, timezone_name: a.timezone_name })

/**
 * Ad accounts this token can use. Facebook Login for Business gives a business-integration
 * system-user token, which lists ad accounts under /me/assigned_ad_accounts (/me/adaccounts
 * answers "(#200) Missing Permissions" for it, seen 2026-11-18). A plain user token uses
 * /me/adaccounts. Last resort: the businesses' owned and client ad accounts.
 */
export async function listAdAccounts(token: string): Promise<AdAccount[]> {
  const errors: string[] = []
  for (const edge of ["me/assigned_ad_accounts", "me/adaccounts"]) {
    try {
      const r = await graph<{ data?: AdAccount[] }>(edge, token, { params: { fields: AD_FIELDS, limit: "50" } })
      if (r.data?.length) return r.data.map(clean)
    } catch (err) {
      errors.push(`${edge}: ${err instanceof Error ? err.message : err}`)
    }
  }
  try {
    const biz = await graph<{ data?: { id: string }[] }>("me/businesses", token, { params: { fields: "id", limit: "10" } })
    const out = new Map<string, AdAccount>()
    for (const b of biz.data ?? []) {
      for (const edge of ["owned_ad_accounts", "client_ad_accounts"]) {
        const r = await graph<{ data?: AdAccount[] }>(`${b.id}/${edge}`, token, { params: { fields: AD_FIELDS, limit: "50" } }).catch(() => ({ data: [] as AdAccount[] }))
        for (const a of r.data ?? []) out.set(a.id, clean(a))
      }
    }
    if (out.size) return [...out.values()]
  } catch (err) {
    errors.push(`me/businesses: ${err instanceof Error ? err.message : err}`)
  }
  if (errors.length) console.error("[metaads] ad accounts:", errors.join(" | "))
  return []
}

export async function listPixels(token: string, adAccountId: string): Promise<Pixel[]> {
  const r = await graph<{ data?: Pixel[] }>(`${adAccountId}/adspixels`, token, { params: { fields: "id,name", limit: "25" } })
  return (r.data ?? []).map((p) => ({ id: p.id, name: p.name }))
}

// Meta budgets are in the currency's smallest unit. Most currencies have 2 decimals; these have none.
// (List from Meta's currency table; an unknown currency is treated as 2-decimal.)
const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP", "VND", "PYG", "ISK", "TWD", "HUF", "COP", "CRC", "IDR"])
export const toMinor = (amount: number, currency: string) => Math.round(amount * (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100))
export const fromMinor = (minor: number | string, currency: string) => Number(minor) / (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100)

/** account_status 1 = ACTIVE. Everything else (disabled, unsettled, in review, closed) can't run ads. */
export const accountUsable = (a: Pick<AdAccount, "account_status">) => a.account_status === 1

// ── Location ────────────────────────────────────────────────────────────────
export type GeoCity = { key: string; name: string; region?: string; country_code?: string }
export async function findCity(token: string, city: string, country: string | null): Promise<GeoCity | null> {
  const r = await graph<{ data?: GeoCity[] }>("search", token, { params: { type: "adgeolocation", location_types: ["city"], q: city, ...(country ? { country_code: country } : {}), limit: "5" } })
  const want = city.trim().toLowerCase()
  const list = r.data ?? []
  return list.find((c) => c.name?.toLowerCase() === want) ?? list[0] ?? null
}

// ── Build a paused campaign ─────────────────────────────────────────────────
export type Goal = "OUTCOME_LEADS" | "OUTCOME_TRAFFIC"
/** Where a leads campaign collects the lead: Meta's instant form, or the website (counted by the pixel's Lead event). */
export type LeadsOn = "form" | "website"
export type SpecialCategory = "NONE" | "HOUSING" | "EMPLOYMENT" | "FINANCIAL_PRODUCTS_SERVICES"
export type AdCopy = { primaryText: string; headline: string; description: string }

export type CampaignSpec = {
  adAccountId: string // "act_123"
  currency: string
  name: string
  goal: Goal
  special: SpecialCategory
  country: string | null // "US" / "CA"
  dailyBudget: number // major units
  pageId: string
  pageToken: string | null // for the lead form
  igUserId?: string | null
  pixelId?: string | null
  /** Leads goal only. "website" needs pixelId + website; default "form". */
  leadsOn?: LeadsOn
  website: string | null // https://… (traffic, website leads)
  privacyUrl?: string | null // lead form
  city: GeoCity | null
  radiusMiles: number
  ads: (AdCopy & { jpegB64: string })[]
}

export type Built = {
  campaignId: string
  adSetId: string
  formId?: string
  ads: { adId: string; creativeId: string; imageHash: string }[]
}

export type Delivery = {
  optimization_goal: "LEAD_GENERATION" | "OFFSITE_CONVERSIONS" | "LINK_CLICKS"
  destination_type: "ON_AD" | "WEBSITE"
  promoted_object?: { page_id: string } | { pixel_id: string; custom_event_type: "LEAD" }
  /** An instant form has to be created first. */
  form: boolean
}

/**
 * Pure: the ad set's optimisation, destination and promoted object for a spec (ODAX mapping table).
 * Website leads need the pixel (it reports the Lead event Meta optimises for) and a website.
 */
export function deliveryFor(s: Pick<CampaignSpec, "goal" | "pageId" | "pixelId" | "leadsOn" | "website">): Delivery {
  if (s.goal === "OUTCOME_TRAFFIC") return { optimization_goal: "LINK_CLICKS", destination_type: "WEBSITE", form: false }
  if (s.leadsOn === "website") {
    if (!s.pixelId) throw new Error("Website leads need your Meta Pixel. Pick it first, or use the Facebook form.")
    if (!s.website) throw new Error("Website leads need your website on your profile.")
    return { optimization_goal: "OFFSITE_CONVERSIONS", destination_type: "WEBSITE", promoted_object: { pixel_id: s.pixelId, custom_event_type: "LEAD" }, form: false }
  }
  return { optimization_goal: "LEAD_GENERATION", destination_type: "ON_AD", promoted_object: { page_id: s.pageId }, form: true }
}

/** Pure: links the ad to the pixel so website events are attributed to it. Null without a pixel. */
export const trackingSpecs = (pixelId: string | null | undefined) =>
  pixelId ? [{ "action.type": ["offsite_conversion"], fb_pixel: [pixelId] }] : null

/** Everything Meta needs, created PAUSED: lead form (leads goal), campaign, ad set, images, creatives, ads. */
export async function buildPaused(token: string, s: CampaignSpec, onStep?: (what: string, id: string) => Promise<void> | void): Promise<Built> {
  const special = s.special !== "NONE"
  const step = async (what: string, id: string) => { if (onStep) await onStep(what, id) }

  const delivery = deliveryFor(s)
  const tracking = trackingSpecs(s.pixelId)
  let formId: string | undefined
  if (delivery.form) {
    if (!s.privacyUrl) throw new Error("A lead form needs your privacy policy link.")
    const f = await graph<{ id: string }>(`${s.pageId}/leadgen_forms`, s.pageToken || token, {
      method: "POST",
      params: {
        name: `${s.name} form`.slice(0, 100),
        questions: [{ type: "FULL_NAME", key: "full_name" }, { type: "EMAIL", key: "email" }, { type: "PHONE", key: "phone" }],
        privacy_policy: { url: s.privacyUrl, link_text: "Privacy policy" },
        ...(s.website ? { follow_up_action_url: s.website } : {}),
        locale: "en_US",
      },
    })
    formId = f.id
    await step("lead_form", f.id)
  }

  const campaign = await graph<{ id: string }>(`${s.adAccountId}/campaigns`, token, {
    method: "POST",
    params: {
      name: s.name.slice(0, 200),
      objective: s.goal,
      status: "PAUSED",
      buying_type: "AUCTION",
      special_ad_categories: special ? [s.special] : [],
      ...(special && s.country ? { special_ad_category_country: [s.country] } : {}),
      is_adset_budget_sharing_enabled: false,
    },
  })
  await step("campaign", campaign.id)

  // Local audience: the business's city with a radius (≥15 miles for special categories), 18+.
  const radius = Math.max(special ? 15 : 5, Math.min(50, Math.round(s.radiusMiles)))
  const geo = s.city
    ? { cities: [{ key: s.city.key, radius, distance_unit: "mile" }] }
    : s.country ? { countries: [s.country] } : null
  if (!geo) throw new Error("I need your city to target people near you.")
  const targeting: Record<string, unknown> = {
    geo_locations: geo,
    age_min: 18,
    ...(special ? { age_max: 65 } : {}),
    targeting_automation: { advantage_audience: 0 },
  }
  const adSet = await graph<{ id: string }>(`${s.adAccountId}/adsets`, token, {
    method: "POST",
    params: {
      name: `${s.name} · nearby`.slice(0, 200),
      campaign_id: campaign.id,
      daily_budget: String(toMinor(s.dailyBudget, s.currency)),
      billing_event: "IMPRESSIONS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      optimization_goal: delivery.optimization_goal,
      destination_type: delivery.destination_type,
      ...(delivery.promoted_object ? { promoted_object: delivery.promoted_object } : {}),
      targeting,
      status: "PAUSED",
    },
  })
  await step("ad_set", adSet.id)

  const ads: Built["ads"] = []
  for (let i = 0; i < s.ads.length; i++) {
    const a = s.ads[i]
    const up = await graph<{ images?: Record<string, { hash: string }> }>(`${s.adAccountId}/adimages`, token, { method: "POST", params: { bytes: a.jpegB64, name: `alphaa-${Date.now()}-${i}.jpg` } })
    const hash = Object.values(up.images ?? {})[0]?.hash
    if (!hash) throw new Error("Meta didn’t accept the ad image.")
    const link = delivery.form ? "http://fb.me/" : s.website!
    const cta = delivery.form
      ? { type: "SIGN_UP", value: { lead_gen_form_id: formId } }
      : { type: s.goal === "OUTCOME_LEADS" ? "SIGN_UP" : "LEARN_MORE", value: { link: s.website } }
    const creative = await graph<{ id: string }>(`${s.adAccountId}/adcreatives`, token, {
      method: "POST",
      params: {
        name: `${s.name} · ad ${i + 1}`.slice(0, 100),
        object_story_spec: {
          page_id: s.pageId,
          ...(s.igUserId ? { instagram_user_id: s.igUserId } : {}),
          link_data: { image_hash: hash, link, message: a.primaryText, name: a.headline, description: a.description, call_to_action: cta },
        },
      },
    })
    await step("creative", creative.id)
    const ad = await graph<{ id: string }>(`${s.adAccountId}/ads`, token, {
      method: "POST",
      params: {
        name: `${s.name} · ad ${i + 1}`.slice(0, 100),
        adset_id: adSet.id,
        creative: { creative_id: creative.id },
        ...(tracking ? { tracking_specs: tracking } : {}),
        status: "PAUSED",
      },
    })
    await step("ad", ad.id)
    ads.push({ adId: ad.id, creativeId: creative.id, imageHash: hash })
  }
  return { campaignId: campaign.id, adSetId: adSet.id, formId, ads }
}

export const setStatus = (token: string, objectId: string, status: "ACTIVE" | "PAUSED") =>
  graph<{ success?: boolean }>(objectId, token, { method: "POST", params: { status } })

export const setDailyBudget = (token: string, adSetId: string, amount: number, currency: string) =>
  graph<{ success?: boolean }>(adSetId, token, { method: "POST", params: { daily_budget: String(toMinor(amount, currency)) } })

// ── Results ─────────────────────────────────────────────────────────────────
type Action = { action_type: string; value: string }
export type InsightRow = {
  ad_id?: string; adset_id?: string; campaign_id?: string; date_start?: string
  spend?: string; impressions?: string; clicks?: string; inline_link_clicks?: string; reach?: string; frequency?: string
  actions?: Action[]
}
/** clicks = all clicks; linkClicks = clicks to the website or form (what CTR/CPC are judged on). */
export type Totals = { spend: number; impressions: number; clicks: number; linkClicks: number; results: number }

/** "lead" = every lead (instant form + pixel); traffic campaigns count link clicks. */
export function resultsOf(row: InsightRow, goal: Goal): number {
  const want = goal === "OUTCOME_LEADS" ? "lead" : "link_click"
  return Number(row.actions?.find((a) => a.action_type === want)?.value ?? 0)
}
export function totalsOf(rows: InsightRow[], goal: Goal): Totals {
  return rows.reduce((t, r) => ({
    spend: t.spend + Number(r.spend ?? 0), impressions: t.impressions + Number(r.impressions ?? 0), clicks: t.clicks + Number(r.clicks ?? 0),
    linkClicks: t.linkClicks + Number(r.inline_link_clicks ?? 0), results: t.results + resultsOf(r, goal),
  }), { spend: 0, impressions: 0, clicks: 0, linkClicks: 0, results: 0 })
}

const INSIGHT_FIELDS = "campaign_id,adset_id,ad_id,spend,impressions,clicks,inline_link_clicks,reach,frequency,actions"

export async function insights(token: string, objectId: string, level: "campaign" | "adset" | "ad", days: 7 | 30): Promise<InsightRow[]> {
  const r = await graph<{ data?: InsightRow[] }>(`${objectId}/insights`, token, {
    params: { level, date_preset: days === 7 ? "last_7d" : "last_30d", fields: INSIGHT_FIELDS, limit: "100" },
  })
  return r.data ?? []
}

/** One row per ad per day (time_increment=1) from `since` (YYYY-MM-DD) to today, for creative fatigue. Follows paging up to 2,000 rows. */
export async function dailyAdInsights(token: string, campaignId: string, since: string, until = new Date().toISOString().slice(0, 10)): Promise<InsightRow[]> {
  const out: InsightRow[] = []
  let next: string | null = `${campaignId}/insights`
  let params: Record<string, unknown> | undefined = { level: "ad", time_range: { since, until }, time_increment: "1", fields: "ad_id,date_start,spend,impressions,inline_link_clicks,actions", limit: "500" }
  for (let page = 0; next && page < 4; page++) {
    const r: { data?: InsightRow[]; paging?: { next?: string } } = await graph(next, token, { params })
    out.push(...(r.data ?? []))
    next = r.paging?.next ?? null
    params = undefined // the next link carries every parameter
  }
  return out
}

/** Frequency (impressions per person) per ad over the window. Reach can't be summed across days, so it's its own call. */
export async function adFrequency(token: string, campaignId: string, days: 7 | 30 = 30): Promise<Map<string, number>> {
  const rows = await insights(token, campaignId, "ad", days)
  return new Map(rows.filter((r) => r.ad_id).map((r) => [r.ad_id!, Number(r.frequency ?? 0)]))
}

// ── Leads ───────────────────────────────────────────────────────────────────
export type RawLead = { id: string; created_time: string; ad_id?: string; form_id?: string; field_data?: { name: string; values: string[] }[] }
export async function leadsSince(token: string, formId: string, sinceUnix: number): Promise<RawLead[]> {
  const r = await graph<{ data?: RawLead[] }>(`${formId}/leads`, token, {
    params: { fields: "created_time,id,ad_id,form_id,field_data", limit: "100", ...(sinceUnix ? { filtering: [{ field: "time_created", operator: "GREATER_THAN", value: sinceUnix }] } : {}) },
  })
  return r.data ?? []
}

/** Only name, email and phone, and only what the form actually sent. */
export function leadContact(l: RawLead): { name?: string; email?: string; phone?: string } {
  const get = (...names: string[]) => l.field_data?.find((f) => names.includes(f.name))?.values?.[0]?.trim().slice(0, 200) || undefined
  return { name: get("full_name", "name"), email: get("email"), phone: get("phone_number", "phone") }
}
