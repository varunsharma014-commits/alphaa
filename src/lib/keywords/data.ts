// Keyword data for one brand: volume, competition, bids and monthly trend from Google's Keyword
// Planner (free, Alphaa's own Google Ads connection, lib/keywords/planner.ts), difficulty and
// search intent from DataForSEO Labs (paid, live only, every call on the brand's data_usd quota
// through lib/dataforseo.ts). Cached 30 days per keyword + place in ONE MockActivity row per brand
// ("keyword_data", metadata { items: { "<geo>|<keyword>": KeywordMetric } }).
//
// Places: Keyword Planner uses the brand's city when Google knows it, else its country. Labs
// difficulty is per country (Labs has no city data). Language: English (French for a brand whose
// voice is set to French).
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { countryFor, COUNTRY_LOCATION, type Country } from "@/lib/dataforseo-parse"
import { dataforseoConfigured, runTask, apiDenied } from "@/lib/dataforseo"
import { getAgentSettings } from "@/lib/agent/settings"
import { fromMicros } from "@/lib/gads/api"
import { plannerConnection, plannerGeo, plannerHistorical } from "./planner"
import { forDifficulty, normKeyword, parseDifficulty, parseIntent, plannerOk, volumeFrom, type KeywordMetric } from "./rules"

export const KW_TYPE = "keyword_data"
const TTL = 30 * 86_400_000
const MAX_ITEMS = 1500
/** Per Labs call (each call costs about $0.01 + $0.0001 per keyword). */
export const LABS_BATCH = 200

type Store = { items: Record<string, KeywordMetric> }
export type Place = { geoKey: string; country: Country; city: string | null; language: "en" | "fr" }

export async function placeOf(user: Pick<User, "id" | "city" | "state" | "websiteUrl">): Promise<Place> {
  const country = countryFor({ city: user.city, state: user.state, websiteUrl: user.websiteUrl })
  const s = await getAgentSettings(user.id).catch(() => ({} as Awaited<ReturnType<typeof getAgentSettings>>))
  const language = /french|fran/i.test(s.voice?.style?.language ?? "") ? "fr" : "en"
  const city = user.city?.trim() || null
  return { geoKey: `${country}:${(city ?? "").toLowerCase()}:${language}`, country, city, language }
}

async function load(userId: string): Promise<{ id: string | null; store: Store }> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: KW_TYPE }, orderBy: { createdAt: "desc" }, select: { id: true, metadata: true } })
  const m = (row?.metadata ?? {}) as Partial<Store>
  const items = m.items && typeof m.items === "object" ? m.items : {}
  // Ranges are re-derived from Google's raw numbers on every read (the rule can change; the numbers don't).
  for (const it of Object.values(items)) if (it.volume) it.volume = volumeFrom(it.volume.avg, it.volume.monthly ?? [])
  return { id: row?.id ?? null, store: { items } }
}

async function save(userId: string, id: string | null, store: Store): Promise<void> {
  const entries = Object.entries(store.items)
  if (entries.length > MAX_ITEMS) {
    entries.sort((a, b) => Date.parse(b[1].volumeAt ?? b[1].difficultyAt ?? "0") - Date.parse(a[1].volumeAt ?? a[1].difficultyAt ?? "0"))
    store.items = Object.fromEntries(entries.slice(0, MAX_ITEMS))
  }
  if (id) await db.mockActivity.update({ where: { id }, data: { metadata: store as object } })
  else await db.mockActivity.create({ data: { userId, type: KW_TYPE, title: "Keyword data", metadata: store as object } })
}

const fresh = (at: string | undefined) => !!at && Date.now() - Date.parse(at) < TTL
const blank = (keyword: string): KeywordMetric => ({ keyword, volume: null, competition: null, bidLow: null, bidHigh: null, currency: null, difficulty: null, intent: null, intentP: null })

/** Cached metrics only (no calls): for pages that must render fast. */
export async function cachedMetrics(user: Pick<User, "id" | "city" | "state" | "websiteUrl">, keywords: string[]): Promise<Map<string, KeywordMetric>> {
  const [place, { store }] = await Promise.all([placeOf(user), load(user.id)])
  const out = new Map<string, KeywordMetric>()
  for (const k of keywords.map(normKeyword)) { const m = store.items[`${place.geoKey}|${k}`]; if (m) out.set(k, m) }
  return out
}

const inflight = new Map<string, Promise<unknown>>()

export type FetchOpts = {
  /** Also measure difficulty + intent (paid). Default true. */
  labs?: boolean
  /** Max keywords sent to Labs in this run (cost control). Default LABS_BATCH. */
  labsMax?: number
}
export type FetchNote = { planner: "ok" | "none" | "error"; plannerError?: string; labs: "ok" | "off" | "denied" | "failed" | "skipped"; costUsd: number }

/**
 * Metrics for these keywords, fetching what's missing or older than 30 days. Never throws: a
 * failed source leaves those fields null (the UI says "not measured").
 */
export async function keywordMetrics(user: Pick<User, "id" | "city" | "state" | "websiteUrl">, keywords: string[], opts: FetchOpts = {}): Promise<{ metrics: Map<string, KeywordMetric>; note: FetchNote }> {
  // One run per brand at a time: a second caller waits for the first, then reads the cache.
  const prev = inflight.get(user.id)
  if (prev) await prev.catch(() => null)
  const run = fetchMissing(user, keywords, opts)
  inflight.set(user.id, run)
  try { return await run } finally { if (inflight.get(user.id) === run) inflight.delete(user.id) }
}

async function fetchMissing(user: Pick<User, "id" | "city" | "state" | "websiteUrl">, keywords: string[], opts: FetchOpts): Promise<{ metrics: Map<string, KeywordMetric>; note: FetchNote }> {
  const place = await placeOf(user)
  const { id, store } = await load(user.id)
  const list = [...new Set(keywords.map(normKeyword).filter(plannerOk))]
  const key = (k: string) => `${place.geoKey}|${k}`
  const get = (k: string) => (store.items[key(k)] ??= blank(k))
  const note: FetchNote = { planner: "ok", labs: "skipped", costUsd: 0 }
  let dirty = false

  // 1) Volume (free).
  const needVol = list.filter((k) => !fresh(store.items[key(k)]?.volumeAt))
  if (needVol.length) {
    try {
      const c = await plannerConnection()
      if (!c) note.planner = "none"
      else {
        const geo = await plannerGeo(c, place.city, place.country === "us" || place.country === "ca" ? (place.country.toUpperCase() as "US" | "CA") : null)
        const geoTargets = geo.length ? geo : [`geoTargetConstants/${COUNTRY_LOCATION[place.country]}`]
        const lang = place.language === "fr" ? "languageConstants/1002" : "languageConstants/1000"
        const rows = await plannerHistorical(c, needVol, geoTargets, lang)
        const currency = (await import("@/lib/gads/store").then((m) => m.getGadsAccount(c.userId)).catch(() => null))?.currency ?? null
        const now = new Date().toISOString()
        const seen = new Set<string>()
        for (const r of rows) {
          // Google answers per keyword and may merge close variants into one row.
          for (const t of [r.text, ...r.closeVariants].map(normKeyword)) {
            if (!needVol.includes(t) || seen.has(t)) continue
            seen.add(t)
            Object.assign(get(t), {
              volume: volumeFrom(r.avgMonthlySearches, r.monthly.map((m) => m.searches)),
              competition: r.competition === "LOW" || r.competition === "MEDIUM" || r.competition === "HIGH" ? r.competition : null,
              bidLow: r.lowBidMicros !== null ? Math.round(fromMicros(r.lowBidMicros) * 100) / 100 : null,
              bidHigh: r.highBidMicros !== null ? Math.round(fromMicros(r.highBidMicros) * 100) / 100 : null,
              currency,
              volumeAt: now,
            })
          }
        }
        // Asked and not in the answer = Google has no data: remember that too (volume stays null).
        for (const k of needVol) if (!seen.has(k)) get(k).volumeAt = now
        dirty = true
      }
    } catch (err) {
      note.planner = "error"
      note.plannerError = err instanceof Error ? err.message.slice(0, 200) : "failed"
      console.error("[keywords] planner", note.plannerError)
    }
  }

  // 2) Difficulty + intent (paid): only keywords with search volume, biggest first.
  if (opts.labs !== false && dataforseoConfigured()) {
    if (apiDenied("dataforseo_labs")) note.labs = "denied"
    else {
      const max = Math.min(LABS_BATCH, opts.labsMax ?? LABS_BATCH)
      const items = list.map((k) => store.items[key(k)]).filter(Boolean) as KeywordMetric[]
      const stale = items.filter((m) => !fresh(m.difficultyAt)).map((m) => ({ ...m, difficulty: null }))
      const dk = forDifficulty(stale, max)
      const ik = items.filter((m) => !fresh(m.intentAt) && dk.includes(m.keyword)).map((m) => m.keyword)
      if (dk.length) {
        const now = new Date().toISOString()
        const [d, i] = await Promise.all([
          runTask("kwDifficulty", { keywords: dk, location_code: COUNTRY_LOCATION[place.country], language_code: place.language }, { estUsd: 0.01 + dk.length * 0.0001, timeoutMs: 60_000 }),
          ik.length ? runTask("searchIntent", { keywords: ik, language_code: place.language }, { estUsd: 0.01 + ik.length * 0.0001, timeoutMs: 60_000 }) : Promise.resolve(null),
        ])
        note.costUsd = (d.cost ?? 0) + (i?.cost ?? 0)
        if (d.ok) {
          const map = parseDifficulty(d.result)
          // Labs has no number for very rare phrases: keep null but don't ask again for 30 days.
          for (const k of dk) { const m = get(k); m.difficulty = map.get(k) ?? null; m.difficultyAt = now }
          dirty = true
        }
        if (i?.ok) {
          const map = parseIntent(i.result)
          for (const k of ik) { const m = get(k); const v = map.get(k); m.intent = v?.intent ?? null; m.intentP = v?.p ?? null; m.intentAt = now }
          dirty = true
        }
        note.labs = d.ok ? "ok" : apiDenied("dataforseo_labs") ? "denied" : "failed"
      }
    }
  } else if (opts.labs !== false) note.labs = "off"

  if (dirty) await save(user.id, id, store).catch((e) => console.error("[keywords] save", e instanceof Error ? e.message : e))
  const metrics = new Map<string, KeywordMetric>()
  for (const k of list) { const m = store.items[key(k)]; if (m) metrics.set(k, m) }
  return { metrics, note }
}

/** Planner keyword ideas around some seed phrases (free). Used for brief targets. */
export async function keywordIdeas(user: Pick<User, "id" | "city" | "state" | "websiteUrl">, seeds: string[], max = 40): Promise<string[]> {
  try {
    const c = await plannerConnection()
    if (!c) return []
    const place = await placeOf(user)
    const geo = await plannerGeo(c, place.city, place.country === "us" || place.country === "ca" ? (place.country.toUpperCase() as "US" | "CA") : null)
    const api = await import("@/lib/gads/api")
    const ideas = await api.generateKeywordIdeas(c.customerId, api.keywordIdeasBody({ keywords: seeds.map(normKeyword).filter(plannerOk).slice(0, 20), language: place.language === "fr" ? "languageConstants/1002" : "languageConstants/1000", geoTargets: geo, pageSize: Math.min(200, max * 3) }), { token: c.token, loginCustomerId: c.loginCustomerId })
    return ideas.filter((i) => (i.avgMonthlySearches ?? 0) > 0).sort((a, b) => (b.avgMonthlySearches ?? 0) - (a.avgMonthlySearches ?? 0)).slice(0, max).map((i) => normKeyword(i.text))
  } catch (err) {
    console.error("[keywords] ideas", err instanceof Error ? err.message : err)
    return []
  }
}
