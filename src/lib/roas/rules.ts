// Return on ad spend (ROAS): pure rules, no database, no network, safe in client code.
//
// One revenue source per ad platform, best first, never summed across sources (the same sale
// would show up in Meta's purchase value, in GA4 and in the store's orders). Every source is
// labelled, and tracked revenue (real sales) is never mixed with the estimate from the owner's
// customer value. A ROAS is null when there's no spend or no source, never a fake 0.
//
// Platforms are open: LinkedIn (built elsewhere) plugs in by passing a PlatformWindow with
// platform "linkedin" and its own readings; nothing here is Meta- or Google-only except the
// parsers at the bottom.
import { THRESHOLDS } from "@/lib/ad-strategy/playbook"

export type AdPlatform = "meta" | "google" | "linkedin"
export const PLATFORM_LABEL: Record<AdPlatform, string> = { meta: "Facebook & Instagram", google: "Google Ads", linkedin: "LinkedIn" }

export type SourceId =
  | "meta_purchases" // Meta Insights action_values (purchase), from the pixel / Conversions API
  | "google_values" // Google Ads conversions_value from the conversion tag's own values
  | "linkedin_values" // reserved for the LinkedIn ads build
  | "woocommerce" // orders from the WordPress plugin, attributed by click id or UTM
  | "shopify" // reserved: needs read_orders (not in the app's scopes)
  | "ga4" // GA4 purchase revenue by session source / campaign
  | "won_leads" // leads the owner marked won, with the amount they typed
  | "google_fixed_values" // Google Ads conversions_value where every action uses a fixed value the owner set (an estimate)

/** Best first. The first source with revenue wins for a platform; the rest are shown as "other sources". */
export const SOURCE_ORDER: SourceId[] = ["meta_purchases", "google_values", "linkedin_values", "woocommerce", "shopify", "ga4", "won_leads"]

export const SOURCE_LABEL: Record<SourceId, string> = {
  meta_purchases: "purchases Meta tracked on your website",
  google_values: "sale values from your Google Ads conversion tracking",
  linkedin_values: "conversion values LinkedIn tracked",
  woocommerce: "your WooCommerce orders from ad clicks",
  shopify: "your Shopify orders from ad clicks",
  ga4: "purchases Google Analytics tied to these ads",
  won_leads: "leads you marked as won",
  google_fixed_values: "the fixed value per conversion set in your Google Ads account",
}

/** What one sale is called, per source. */
export const SALE_WORD: Record<SourceId, string> = {
  meta_purchases: "purchase", google_values: "conversion", linkedin_values: "conversion", woocommerce: "order", shopify: "order", ga4: "purchase", won_leads: "won lead", google_fixed_values: "conversion",
}

/** One source's reading for one platform and window. tracked = real sale values (not an estimate). */
export type Reading = { source: SourceId; revenue: number; count: number; tracked: boolean }
export type CampaignWindow = { id: string; name: string; platform: AdPlatform; spend: number; leads: number; revenue: Partial<Record<SourceId, { revenue: number; count: number }>> }
export type PlatformWindow = { platform: AdPlatform; days: 7 | 30; spend: number; currency: string; leads: number; readings: Reading[]; campaigns?: CampaignWindow[] }

export type Estimate = { revenue: number; roas: number | null; value: number; valueSource: "owner" | "estimate"; leads: number; breakEven: number | null }
export type PlatformRoas = {
  platform: AdPlatform
  days: 7 | 30
  currency: string
  spend: number
  leads: number
  /** Tracked revenue from the chosen source, or null when no tracked source has data. */
  revenue: number | null
  roas: number | null
  source: SourceId | null
  sales: number | null
  /** spend ÷ sales from the chosen source. */
  perSale: number | null
  /** Other sources that also have data (shown, never added). */
  others: Reading[]
  /** From the owner's customer value: never mixed into revenue/roas. */
  estimate: Estimate | null
  campaigns: { id: string; name: string; platform: AdPlatform; spend: number; leads: number; revenue: number | null; roas: number | null; sales: number | null }[]
}

const r2 = (x: number) => Math.round(x * 100) / 100
export const roasOf = (revenue: number | null | undefined, spend: number): number | null =>
  revenue == null || !Number.isFinite(revenue) || !(spend > 0) ? null : r2(revenue / spend)

/** The best tracked reading with data, in SOURCE_ORDER. */
export function pickSource(readings: Reading[]): Reading | null {
  const usable = readings.filter((r) => r.tracked && (r.revenue > 0 || r.count > 0))
  for (const id of SOURCE_ORDER) {
    const hit = usable.find((r) => r.source === id)
    if (hit) return hit
  }
  return null
}

/**
 * Pays for itself if 1 in N leads becomes a customer: N = customer value ÷ cost per lead, rounded
 * down. Null without leads or spend; 0 = a lead costs more than a customer is worth.
 */
export function breakEvenLeads(spend: number, leads: number, value: number): number | null {
  if (!(spend > 0) || !(leads > 0) || !(value > 0)) return null
  return Math.floor(value / (spend / leads))
}

export function platformRoas(w: PlatformWindow, customerValue?: { amount: number; source: "owner" | "estimate" } | null): PlatformRoas {
  const pick = pickSource(w.readings)
  const others = w.readings.filter((r) => r !== pick && (r.revenue > 0 || r.count > 0))
  const revenue = pick ? r2(pick.revenue) : null
  const est: Estimate | null = customerValue && customerValue.amount > 0 && w.leads > 0 && w.spend > 0
    ? { revenue: r2(w.leads * customerValue.amount), roas: roasOf(w.leads * customerValue.amount, w.spend), value: customerValue.amount, valueSource: customerValue.source, leads: w.leads, breakEven: breakEvenLeads(w.spend, w.leads, customerValue.amount) }
    : null
  return {
    platform: w.platform, days: w.days, currency: w.currency, spend: r2(w.spend), leads: w.leads,
    revenue, roas: roasOf(revenue, w.spend), source: pick?.source ?? null,
    sales: pick ? pick.count : null,
    perSale: pick && pick.count > 0 && w.spend > 0 ? r2(w.spend / pick.count) : null,
    others, estimate: est,
    campaigns: (w.campaigns ?? []).map((c) => {
      // Same source as the platform, so a campaign never mixes sources either.
      const v = pick ? c.revenue[pick.source] : undefined
      return { id: c.id, name: c.name, platform: c.platform, spend: r2(c.spend), leads: c.leads, revenue: v ? r2(v.revenue) : null, roas: v ? roasOf(v.revenue, c.spend) : null, sales: v ? v.count : null }
    }),
  }
}

export type OverallRoas = {
  days: 7 | 30
  /** Spend of the platforms with a tracked source (what the ROAS is over). */
  spend: number
  revenue: number | null
  roas: number | null
  sales: number | null
  perSale: number | null
  covers: AdPlatform[]
  /** Platforms that spent but have no tracked revenue source. */
  uncovered: AdPlatform[]
  /** One currency only; mixed currencies = no overall number. */
  currency: string | null
  sources: SourceId[]
}

/** Across platforms: only platforms with a tracked source, in one currency, so nothing is guessed. */
export function overallRoas(ps: PlatformRoas[], days: 7 | 30): OverallRoas {
  const spent = ps.filter((p) => p.spend > 0)
  const covered = spent.filter((p) => p.revenue !== null)
  const currencies = Array.from(new Set(covered.map((p) => p.currency)))
  const uncovered = spent.filter((p) => p.revenue === null).map((p) => p.platform)
  if (!covered.length || currencies.length !== 1) return { days, spend: 0, revenue: null, roas: null, sales: null, perSale: null, covers: [], uncovered: spent.map((p) => p.platform), currency: currencies.length === 1 ? currencies[0] : null, sources: [] }
  const spend = r2(covered.reduce((a, p) => a + p.spend, 0))
  const revenue = r2(covered.reduce((a, p) => a + (p.revenue ?? 0), 0))
  const sales = covered.reduce((a, p) => a + (p.sales ?? 0), 0)
  return { days, spend, revenue, roas: roasOf(revenue, spend), sales, perSale: sales > 0 ? r2(spend / sales) : null, covers: covered.map((p) => p.platform), uncovered, currency: currencies[0], sources: covered.map((p) => p.source!).filter(Boolean) }
}

/** "3.2x" or "—". */
export const fmtRoas = (x: number | null | undefined) => (x == null ? "—" : `${x.toLocaleString("en-US", { maximumFractionDigits: x < 10 ? 2 : 1 })}x`)

// ── Kill / hold / scale on ROAS (only real revenue, never the estimate) ─────────────────────────
/** Heuristics, labelled as such in the playbook: under 1 = losing money on ad spend alone. */
export const ROAS_MARKS = { judgeSpend: THRESHOLDS.metaJudgeSpend, kill: 1, scale: 2 } as const
export type Grade = "wait" | "kill" | "hold" | "scale"
export function roasGrade(roas: number | null, spend: number): Grade {
  if (roas === null || spend < ROAS_MARKS.judgeSpend) return "wait"
  return roas < ROAS_MARKS.kill ? "kill" : roas < ROAS_MARKS.scale ? "hold" : "scale"
}

// ── Meta Insights: purchase values ────────────────────────────────────────────────────────────
type Action = { action_type: string; value: string }
/**
 * Meta reports the same purchase under several overlapping action types (omni_purchase is the
 * roll-up of website + app + offline + on-Meta). Take the first one present, never a sum.
 */
export const META_PURCHASE_TYPES = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase", "onsite_web_purchase", "onsite_conversion.purchase", "offline_conversion.purchase"] as const
export function metaPurchase(row: { actions?: Action[]; action_values?: Action[] }): { value: number; count: number } {
  const pick = (list: Action[] | undefined) => {
    for (const t of META_PURCHASE_TYPES) {
      const hit = list?.find((a) => a.action_type === t)
      if (hit) return Number(hit.value) || 0
    }
    return 0
  }
  return { value: pick(row.action_values), count: pick(row.actions) }
}

// ── Google Ads: are the conversion values real sale amounts? ─────────────────────────────────
export type ConversionActionRow = { name?: string; category?: string; type?: string; includeInConversionsMetric?: boolean; defaultValue?: number; alwaysUseDefaultValue?: boolean }
export type GadsValueKind = "none" | "real" | "fixed" | "counts"
/**
 * real   = at least one counted action takes the value from the tag (sale amounts can come through),
 * fixed  = every counted action always uses a default value the owner set (an estimate),
 * counts = values are just 1 per conversion, or there's no value at all (not revenue),
 * none   = no counted conversion actions.
 * `totals` are the window's conversions + conversions_value, to catch "1 per conversion".
 */
export function gadsValueKind(actions: ConversionActionRow[], totals: { conversions: number; value: number }): GadsValueKind {
  const counted = actions.filter((a) => a.includeInConversionsMetric !== false)
  if (!counted.length) return "none"
  if (!(totals.value > 0)) return "counts"
  // Every conversion worth exactly 1 (Google's "don't use a value") is a count, not money.
  if (totals.conversions > 0 && Math.abs(totals.value - totals.conversions) < 0.01 && counted.every((a) => (a.defaultValue ?? 1) <= 1)) return "counts"
  if (counted.some((a) => a.alwaysUseDefaultValue === false)) return "real"
  return "fixed"
}

// ── Click ids and attribution ───────────────────────────────────────────────────────────────
export type Click = { gclid?: string; gbraid?: string; wbraid?: string; fbc?: string; fbclid?: string }
export type Utm = { source?: string; medium?: string; campaign?: string }
const ID_RE = /^[A-Za-z0-9._\-]{6,300}$/
const cleanId = (v: unknown) => (typeof v === "string" && ID_RE.test(v) ? v : undefined)
const cleanText = (v: unknown, max = 100) => (typeof v === "string" ? v.replace(/[^\p{L}\p{N} ._\-/|:+()]/gu, "").trim().slice(0, max) || undefined : undefined)

/** Sanitize what a browser sent; drop anything that doesn't look like an id. */
export function cleanClick(raw: unknown): { click: Click; utm: Utm; ts?: number } | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const click: Click = { gclid: cleanId(r.g), gbraid: cleanId(r.b), wbraid: cleanId(r.w), fbclid: cleanId(r.f) }
  const fbc = typeof r.fbc === "string" && /^fb\.\d\.\d{10,16}\.[A-Za-z0-9._\-]{6,300}$/.test(r.fbc) ? r.fbc : undefined
  const ts = Number(r.t)
  if (fbc) click.fbc = fbc
  else if (click.fbclid && Number.isFinite(ts) && ts > 1e12) click.fbc = fbcOf(click.fbclid, ts)
  const utm: Utm = { source: cleanText(r.s)?.toLowerCase(), medium: cleanText(r.m)?.toLowerCase(), campaign: cleanText(r.c, 200) }
  for (const k of Object.keys(click) as (keyof Click)[]) if (!click[k]) delete click[k]
  for (const k of Object.keys(utm) as (keyof Utm)[]) if (!utm[k]) delete utm[k]
  if (!Object.keys(click).length && !Object.keys(utm).length) return null
  return { click, utm, ...(Number.isFinite(ts) && ts > 1e12 ? { ts } : {}) }
}

/** Meta's documented fbc format: fb.<subdomain index>.<creation time ms>.<fbclid>. */
export const fbcOf = (fbclid: string, ms: number) => `fb.1.${Math.floor(ms)}.${fbclid}`

const META_SOURCES = /^(facebook|fb|instagram|ig|meta|messenger|audience_network|an|threads)(\.com)?$|(^|\.)(facebook|instagram)\.com$/
const PAID = /^(cpc|ppc|paid|paid[_\- ]?social|paidsocial|social[_\- ]?paid|cpm|ads?|display|paid[_\- ]?search|sem)$/

const ours = (campaign: string | undefined, metaCampaigns: string[]) => {
  const c = (campaign ?? "").trim().toLowerCase()
  return !!c && metaCampaigns.some((n) => n.trim().toLowerCase() === c)
}

/**
 * Which ad platform a visit came from, or null (organic, unknown, or not mine to count).
 * Google: a Google click id (only ads carry gclid/gbraid/wbraid), or a paid Google UTM; spend is the
 * whole account, so any Google ad counts. Meta: a paid Meta UTM whose campaign is one I built (Meta
 * spend covers only my campaigns, and my website ads carry META_URL_TAGS). An fbclid alone is not
 * enough: Facebook adds it to organic links too.
 */
export function platformOf(click: Click | undefined, utm: Utm | undefined, metaCampaigns: string[]): "google" | "meta" | null {
  if (click?.gclid || click?.gbraid || click?.wbraid) return "google"
  const s = (utm?.source ?? "").toLowerCase(), m = (utm?.medium ?? "").toLowerCase()
  if (!PAID.test(m)) return null
  if (/^(google|adwords|google[_\- ]?ads)$/.test(s)) return "google"
  if (META_SOURCES.test(s) && ours(utm?.campaign, metaCampaigns)) return "meta"
  return null
}

/** A GA4 row (session source / medium + campaign name) → platform, by the same rules as platformOf. */
export function ga4Platform(sourceMedium: string, campaign: string, metaCampaigns: string[]): "google" | "meta" | null {
  const [s = "", m = ""] = sourceMedium.toLowerCase().split("/").map((x) => x.trim())
  return platformOf(undefined, { source: s, medium: m, campaign }, metaCampaigns)
}

/** Meta url_tags for website ads, so GA4 and the store see the campaign by its own name. */
export const META_URL_TAGS = "utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.id}}"

/** Window start (ms) for "last N days, not counting today" in UTC, the platforms' own convention. */
export function windowStart(days: number, now = Date.now()): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - days * 86_400_000
}
export function inWindow(iso: string | null | undefined, days: number, now = Date.now()): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  const d = new Date(now)
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Number.isFinite(t) && t >= windowStart(days, now) && t < today
}

/** Worth keeping as an ad lead: a Google click id, or a paid UTM (Meta matching to my campaigns happens later). */
export const adClick = (click: Click | undefined, utm: Utm | undefined) => !!(click?.gclid || click?.gbraid || click?.wbraid) || PAID.test((utm?.medium ?? "").toLowerCase())

/**
 * Browser code (ES5) shared by the Alphaa tag and the WordPress plugin: remembers the ad click a
 * visitor arrived with (gclid / gbraid / wbraid / fbclid + UTM, 90 days, first-party cookie
 * "alphaa_clk" so a WooCommerce checkout can read it too) and reads Meta's own _fbc cookie. Nothing
 * at all when the browser sends Global Privacy Control. Needs `gpc` in scope; defines `clk()`.
 * The WordPress plugin prints the same code (keep wordpress/alphaa-connector in step).
 */
export const CLICK_CAPTURE_JS = "var clk=(function(){if(gpc)return function(){return null;};var now=Date.now(),q=location.search,c=null;var g=function(n){var m=q.match(new RegExp('[?&]'+n+'=([^&#]{1,300})'));try{return m?decodeURIComponent(m[1]):'';}catch(e){return '';}};var n={g:g('gclid'),b:g('gbraid'),w:g('wbraid'),f:g('fbclid'),s:g('utm_source'),m:g('utm_medium'),c:g('utm_campaign')};try{var raw=(document.cookie.match(/(?:^|; )alphaa_clk=([^;]*)/)||[])[1];c=raw?JSON.parse(decodeURIComponent(raw)):null;}catch(e){c=null;}if(n.g||n.b||n.w||n.f||n.m){c={t:now};for(var k in n)if(n[k])c[k]=String(n[k]).slice(0,300);try{document.cookie='alphaa_clk='+encodeURIComponent(JSON.stringify(c))+'; max-age=7776000; path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch(e){}}if(c&&(!c.t||now-c.t>7776000000))c=null;return function(){var o=c?JSON.parse(JSON.stringify(c)):null;var f=(document.cookie.match(/(?:^|; )_fbc=([^;]{1,300})/)||[])[1];if(f){o=o||{};o.fbc=f;}return o;};})();"
