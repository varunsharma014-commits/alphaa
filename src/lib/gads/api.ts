// Google Ads REST API (v26), called directly. Pure: no database, no env, no usage counting,
// so the request builders can be tested with a mocked fetch (scripts/test-gads.ts).
//
// Checked against Google's own sources on 2026-11-18 (googleapis/googleapis v26 protos and
// developers.google.com/google-ads/api):
// - Base URL https://googleads.googleapis.com, latest major version v26 (v26.2, 2026-11-11).
// - Auth: `Authorization: Bearer <OAuth access token>`. The `developer-token` header is no
//   longer used: access levels belong to the Google Cloud project that owns the OAuth client
//   ("optional and ignored", and a future major version will reject it), so we never send it.
// - `login-customer-id` only when acting through a manager account. We skip manager accounts,
//   so it's optional here.
// - REST bodies are the proto messages in lowerCamelCase JSON; int64 values go as strings.
export const GADS_VERSION = "v26"
export const GADS_BASE = `https://googleads.googleapis.com/${GADS_VERSION}`

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export class GadsError extends Error {
  status: number
  /** Google's error codes, e.g. ["authorizationError:USER_PERMISSION_DENIED"]. */
  codes: string[]
  constructor(message: string, status: number, codes: string[] = []) {
    super(message)
    this.status = status
    this.codes = codes
  }
}

type GoogleErrorBody = {
  error?: {
    code?: number
    message?: string
    status?: string
    details?: { errors?: { errorCode?: Record<string, string>; message?: string }[] }[]
  }
}

/** The owner-readable message and the codes from a Google Ads error response. */
export function parseGadsError(status: number, data: unknown): GadsError {
  const e = (Array.isArray(data) ? (data[0] as GoogleErrorBody) : (data as GoogleErrorBody | null))?.error
  const inner = (e?.details ?? []).flatMap((d) => d.errors ?? [])
  const codes = inner.flatMap((x) => Object.entries(x.errorCode ?? {}).map(([k, v]) => `${k}:${v}`))
  const msg = inner.map((x) => x.message).filter(Boolean).join(" ") || e?.message || `Google Ads answered HTTP ${status}`
  return new GadsError(String(msg).slice(0, 400), status, codes)
}

export type CallOpts = { token: string; loginCustomerId?: string | null; fetchImpl?: FetchLike }

export async function gadsCall<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }, o: CallOpts): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${o.token}` }
  if (init.body !== undefined) headers["Content-Type"] = "application/json"
  if (o.loginCustomerId) headers["login-customer-id"] = digits(o.loginCustomerId)
  const r = await (o.fetchImpl ?? fetch)(`${GADS_BASE}${path}`, {
    method: init.method,
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(60_000),
  })
  const text = await r.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!r.ok) throw parseGadsError(r.status, data)
  return data as T
}

export const digits = (id: string) => id.replace(/\D/g, "")
export const micros = (amount: number) => String(Math.round(amount * 1_000_000))
export const fromMicros = (m: string | number | undefined | null) => (m == null ? 0 : Number(m) / 1_000_000)
/** GAQL string literal. */
export const gaqlString = (s: string) => `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`

// ── Reads ──────────────────────────────────────────────────────────────────

/** GET /v26/customers:listAccessibleCustomers → customer ids the signed-in Google user can reach directly. */
export async function listAccessibleCustomers(o: CallOpts): Promise<string[]> {
  const r = await gadsCall<{ resourceNames?: string[] }>("/customers:listAccessibleCustomers", { method: "GET" }, o)
  return (r.resourceNames ?? []).map((n) => n.split("/")[1]).filter(Boolean)
}

/** POST /v26/customers/{id}/googleAds:searchStream (GAQL). The REST stream is a JSON array of batches. */
export async function searchStream<Row = Record<string, unknown>>(customerId: string, query: string, o: CallOpts): Promise<Row[]> {
  const r = await gadsCall<{ results?: Row[] }[] | { results?: Row[] }>(`/customers/${digits(customerId)}/googleAds:searchStream`, { method: "POST", body: { query } }, o)
  const batches = Array.isArray(r) ? r : [r]
  return batches.flatMap((b) => b?.results ?? [])
}

export type CustomerInfo = { id: string; name: string; currency: string; timeZone: string; manager: boolean; test: boolean; status: string }

export async function customerInfo(customerId: string, o: CallOpts): Promise<CustomerInfo | null> {
  type R = { customer?: { id?: string; descriptiveName?: string; currencyCode?: string; timeZone?: string; manager?: boolean; testAccount?: boolean; status?: string } }
  const rows = await searchStream<R>(customerId, "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.manager, customer.test_account, customer.status FROM customer LIMIT 1", o)
  const c = rows[0]?.customer
  if (!c) return null
  return { id: String(c.id ?? digits(customerId)), name: c.descriptiveName || `Account ${digits(customerId)}`, currency: c.currencyCode ?? "USD", timeZone: c.timeZone ?? "", manager: !!c.manager, test: !!c.testAccount, status: c.status ?? "UNKNOWN" }
}

export type KeywordIdea = { text: string; avgMonthlySearches: number | null; competition: string | null; lowBidMicros: number | null; highBidMicros: number | null }

/** generateKeywordIdeas request body (KeywordPlanIdeaService.GenerateKeywordIdeas). */
export function keywordIdeasBody(o: { keywords: string[]; url?: string | null; language?: string | null; geoTargets: string[]; pageSize?: number }) {
  const seed = o.url
    ? { keywordAndUrlSeed: { url: o.url, keywords: o.keywords.slice(0, 20) } }
    : { keywordSeed: { keywords: o.keywords.slice(0, 20) } }
  return {
    ...(o.language ? { language: o.language } : {}),
    geoTargetConstants: o.geoTargets,
    includeAdultKeywords: false,
    keywordPlanNetwork: "GOOGLE_SEARCH",
    pageSize: o.pageSize ?? 200,
    ...seed,
  }
}

/** POST /v26/customers/{id}:generateKeywordIdeas */
export async function generateKeywordIdeas(customerId: string, body: ReturnType<typeof keywordIdeasBody>, o: CallOpts): Promise<KeywordIdea[]> {
  type R = { results?: { text?: string; keywordIdeaMetrics?: { avgMonthlySearches?: string; competition?: string; lowTopOfPageBidMicros?: string; highTopOfPageBidMicros?: string } }[] }
  const r = await gadsCall<R>(`/customers/${digits(customerId)}:generateKeywordIdeas`, { method: "POST", body }, o)
  const n = (v?: string) => (v == null ? null : Number(v))
  return (r.results ?? []).filter((x) => x.text).map((x) => ({
    text: x.text!,
    avgMonthlySearches: n(x.keywordIdeaMetrics?.avgMonthlySearches),
    competition: x.keywordIdeaMetrics?.competition ?? null,
    lowBidMicros: n(x.keywordIdeaMetrics?.lowTopOfPageBidMicros),
    highBidMicros: n(x.keywordIdeaMetrics?.highTopOfPageBidMicros),
  }))
}

/** POST /v26/geoTargetConstants:suggest → the geo target constant for a city ("geoTargetConstants/1014221"). */
export async function suggestGeoTarget(city: string, countryCode: string | null, o: CallOpts): Promise<string | null> {
  type R = { geoTargetConstantSuggestions?: { geoTargetConstant?: { resourceName?: string; targetType?: string; countryCode?: string } }[] }
  const r = await gadsCall<R>("/geoTargetConstants:suggest", { method: "POST", body: { locale: "en", ...(countryCode ? { countryCode } : {}), locationNames: { names: [city] } } }, o)
  const list = (r.geoTargetConstantSuggestions ?? []).map((s) => s.geoTargetConstant).filter((g) => g?.resourceName)
  return (list.find((g) => g!.targetType === "City") ?? list[0])?.resourceName ?? null
}

// ── Writes ─────────────────────────────────────────────────────────────────

export type MutateService = "campaignBudgets" | "campaigns" | "adGroups" | "adGroupCriteria" | "adGroupAds" | "campaignCriteria"
export type Operation = { create?: object; update?: object; updateMask?: string; remove?: string }

/** POST /v26/customers/{id}/{service}:mutate → the resource names, in operation order. */
export async function mutate(customerId: string, service: MutateService, operations: Operation[], o: CallOpts & { validateOnly?: boolean }): Promise<string[]> {
  const r = await gadsCall<{ results?: { resourceName?: string }[] }>(`/customers/${digits(customerId)}/${service}:mutate`, { method: "POST", body: { operations, ...(o.validateOnly ? { validateOnly: true } : {}) } }, o)
  return (r.results ?? []).map((x) => x.resourceName ?? "")
}

/** One entry of googleAds:mutate (MutateOperation): the operation under its service's key. */
export type MutateOperation =
  | { campaignBudgetOperation: Operation }
  | { campaignOperation: Operation }
  | { campaignCriterionOperation: Operation }
  | { adGroupOperation: Operation }
  | { adGroupCriterionOperation: Operation }
  | { adGroupAdOperation: Operation }

/** POST /v26/customers/{id}/googleAds:mutate: atomic (all or nothing), temp ids (-1, -2…) allowed. */
export async function mutateAll(customerId: string, ops: MutateOperation[], o: CallOpts & { validateOnly?: boolean }): Promise<string[]> {
  type R = { mutateOperationResponses?: Record<string, { resourceName?: string }>[] }
  const r = await gadsCall<R>(`/customers/${digits(customerId)}/googleAds:mutate`, { method: "POST", body: { mutateOperations: ops, ...(o.validateOnly ? { validateOnly: true } : {}) } }, o)
  return (r.mutateOperationResponses ?? []).map((x) => Object.values(x)[0]?.resourceName ?? "")
}

// ── Request builders (proto field names, lowerCamelCase) ──────────────────────

export type Match = "EXACT" | "PHRASE"
export type CampaignSpec = {
  customerId: string
  name: string
  dailyBudget: number
  bidding: "clicks" | "conversions"
  finalUrl: string
  location: { cityName?: string; provinceCode?: string; postalCode?: string; countryCode?: string; streetAddress?: string; radius: number; units: "MILES" | "KILOMETERS" }
  language?: string | null // "languageConstants/1000"
  negatives: string[]
  adGroups: { name: string; keywords: { text: string; match: Match }[]; ad: { headlines: string[]; descriptions: string[]; path1?: string; path2?: string } }[]
}

/** Every operation to create one Search campaign, PAUSED, in a single atomic googleAds:mutate. */
export function buildCampaignOps(s: CampaignSpec): MutateOperation[] {
  const c = digits(s.customerId)
  let tmp = 0
  const next = () => --tmp
  const budget = `customers/${c}/campaignBudgets/${next()}`
  const campaign = `customers/${c}/campaigns/${next()}`
  const groups = s.adGroups.map(() => `customers/${c}/adGroups/${next()}`)
  const ops: MutateOperation[] = []

  ops.push({ campaignBudgetOperation: { create: { resourceName: budget, name: `${s.name} budget`, amountMicros: micros(s.dailyBudget), deliveryMethod: "STANDARD", explicitlyShared: false } } })
  ops.push({ campaignOperation: { create: {
    resourceName: campaign,
    name: s.name,
    status: "PAUSED",
    advertisingChannelType: "SEARCH",
    campaignBudget: budget,
    networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetContentNetwork: false, targetPartnerSearchNetwork: false },
    geoTargetTypeSetting: { positiveGeoTargetType: "PRESENCE" },
    containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
    ...(s.bidding === "conversions" ? { maximizeConversions: {} } : { targetSpend: {} }),
  } } })

  const { radius, units, ...address } = s.location
  const addr = Object.fromEntries(Object.entries(address).filter(([, v]) => !!v))
  ops.push({ campaignCriterionOperation: { create: { campaign, proximity: { address: addr, radius, radiusUnits: units } } } })
  if (s.language) ops.push({ campaignCriterionOperation: { create: { campaign, language: { languageConstant: s.language } } } })
  for (const n of dedupe(s.negatives)) ops.push({ campaignCriterionOperation: { create: { campaign, negative: true, keyword: { text: n, matchType: "PHRASE" } } } })

  s.adGroups.forEach((g, i) => ops.push({ adGroupOperation: { create: { resourceName: groups[i], name: g.name, campaign, status: "ENABLED", type: "SEARCH_STANDARD" } } }))
  s.adGroups.forEach((g, i) => {
    const seen = new Set<string>()
    for (const k of g.keywords) {
      const key = `${k.match}:${k.text.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      ops.push({ adGroupCriterionOperation: { create: { adGroup: groups[i], status: "ENABLED", keyword: { text: k.text, matchType: k.match } } } })
    }
  })
  s.adGroups.forEach((g, i) => ops.push({ adGroupAdOperation: { create: {
    adGroup: groups[i],
    status: "ENABLED",
    ad: {
      finalUrls: [s.finalUrl],
      responsiveSearchAd: {
        headlines: g.ad.headlines.map((text) => ({ text })),
        descriptions: g.ad.descriptions.map((text) => ({ text })),
        ...(g.ad.path1 ? { path1: g.ad.path1 } : {}),
        ...(g.ad.path2 ? { path2: g.ad.path2 } : {}),
      },
    },
  } } }))
  return ops
}

/** campaigns:mutate update: ENABLED / PAUSED. */
export const campaignStatusOp = (campaign: string, status: "ENABLED" | "PAUSED"): Operation => ({ update: { resourceName: campaign, status }, updateMask: "status" })
/** adGroupCriteria:mutate update: pause one keyword. */
export const keywordStatusOp = (criterion: string, status: "ENABLED" | "PAUSED"): Operation => ({ update: { resourceName: criterion, status }, updateMask: "status" })
/** campaignCriteria:mutate create: a negative keyword on the campaign. */
export const negativeKeywordOp = (campaign: string, text: string, match: Match = "EXACT"): Operation => ({ create: { campaign, negative: true, keyword: { text, matchType: match } } })
/** campaignCriteria:mutate remove (undo a negative I added). */
export const removeOp = (resourceName: string): Operation => ({ remove: resourceName })
/** campaignBudgets:mutate update: lower the daily amount (never used to raise it above the owner's cap). */
export const budgetAmountOp = (budget: string, daily: number): Operation => ({ update: { resourceName: budget, amountMicros: micros(daily) }, updateMask: "amountMicros" }) // FieldMask JSON = lowerCamelCase paths

function dedupe(list: string[]): string[] {
  const seen = new Set<string>()
  return list.map((x) => x.trim()).filter((x) => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()))
}
