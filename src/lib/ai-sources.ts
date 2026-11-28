// Where AI answers come from (2026-11-28). Pure helpers, no DB or network, so they can be
// tested against recorded API responses (scripts/test-ai-citations.ts):
//   - parse the pages each engine cites out of its raw API response
//   - classify a cited page: the owner's site, a competitor, a directory/review site, ...
//   - rank the businesses an answer names (by where they first appear)
//   - competitor share of voice per week from stored question scans
//   - Google AI Overview parsing (re-exported from lib/dataforseo-parse.ts)

export type CitedSource = {
  url: string
  title: string | null
  /** true = the answer quotes/links it; false = the engine read it but didn't cite it. */
  cited: boolean
}

export type SourceKind = "own" | "competitor" | "directory" | "social" | "forum" | "media" | "reference" | "other"

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  own: "Your site",
  competitor: "Competitor",
  directory: "Directory & reviews",
  social: "Social",
  forum: "Forum",
  media: "News & media",
  reference: "Reference",
  other: "Blog / other site",
}

const MAX_SOURCES = 8

export const hostOfUrl = (url: string): string | null => {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

/** Drop tracking params the engines append (`?utm_source=openai`) and the #fragment. */
export function cleanUrl(url: string): string {
  try {
    const u = new URL(url)
    for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k)) u.searchParams.delete(k)
    u.hash = ""
    return u.toString().replace(/\?$/, "")
  } catch {
    return url
  }
}

function dedupe(list: CitedSource[]): CitedSource[] {
  const seen = new Map<string, CitedSource>()
  for (const s of list) {
    if (!/^https?:\/\//i.test(s.url)) continue
    const url = cleanUrl(s.url)
    const k = url.replace(/\/$/, "").toLowerCase()
    const prev = seen.get(k)
    if (prev) { prev.cited = prev.cited || s.cited; prev.title = prev.title || s.title; continue }
    seen.set(k, { url, title: s.title?.trim() || null, cited: s.cited })
  }
  // Cited pages first, then the ones only read.
  return [...seen.values()].sort((a, b) => Number(b.cited) - Number(a.cited)).slice(0, MAX_SOURCES)
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

/** Claude (Messages API + web_search): text-block citations are cited; search results are read. */
export function claudeSources(content: unknown): CitedSource[] {
  const out: CitedSource[] = []
  for (const b of arr(content)) {
    if (!isObj(b)) continue
    if (b.type === "text") {
      for (const c of arr(b.citations)) if (isObj(c) && str(c.url)) out.push({ url: str(c.url)!, title: str(c.title), cited: true })
    } else if (b.type === "web_search_tool_result") {
      for (const r of arr(b.content)) if (isObj(r) && r.type === "web_search_result" && str(r.url)) out.push({ url: str(r.url)!, title: str(r.title), cited: false })
    }
  }
  return dedupe(out)
}

/** ChatGPT (Responses API + web_search_preview): url_citation annotations on the output text. */
export function openaiSources(res: unknown): CitedSource[] {
  const out: CitedSource[] = []
  for (const item of arr(isObj(res) ? res.output : null)) {
    if (!isObj(item)) continue
    for (const c of arr(item.content)) {
      if (!isObj(c)) continue
      for (const a of arr(c.annotations)) if (isObj(a) && a.type === "url_citation" && str(a.url)) out.push({ url: str(a.url)!, title: str(a.title), cited: true })
    }
  }
  return dedupe(out)
}

/**
 * Gemini (Google Search grounding): groundingChunks[].web {uri, title}. The uri is a Google
 * redirect (vertexaisearch.cloud.google.com/grounding-api-redirect/...) and the title is the
 * site's domain; `resolved` maps a redirect to its real page when it could be followed.
 * Chunks referenced by groundingSupports are cited; the rest were only read.
 */
export function geminiSources(candidate: unknown, resolved: Record<string, string> = {}): CitedSource[] {
  const gm = isObj(candidate) && isObj(candidate.groundingMetadata) ? candidate.groundingMetadata : null
  if (!gm) return []
  const used = new Set<number>()
  for (const s of arr(gm.groundingSupports)) if (isObj(s)) for (const i of arr(s.groundingChunkIndices)) if (typeof i === "number") used.add(i)
  const out: CitedSource[] = []
  arr(gm.groundingChunks).forEach((c, i) => {
    const web = isObj(c) && isObj(c.web) ? c.web : null
    const uri = web ? str(web.uri) : null
    const title = web ? str(web.title) : null
    if (!uri) return
    const real = resolved[uri] ?? (isGeminiRedirect(uri) ? (title && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(title) ? `https://${title}/` : null) : uri)
    if (!real) return
    out.push({ url: real, title: resolved[uri] || !title || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(title) ? null : title, cited: used.size ? used.has(i) : true })
  })
  return dedupe(out)
}

export const isGeminiRedirect = (uri: string) => /^https:\/\/vertexaisearch\.cloud\.google\.com\/grounding-api-redirect\//.test(uri)

/** Perplexity (sonar): search_results [{title, url}] — or the bare `citations` URL list. */
export function perplexitySources(completion: unknown): CitedSource[] {
  if (!isObj(completion)) return []
  const out: CitedSource[] = []
  const results = arr(completion.search_results)
  if (results.length) {
    for (const r of results) if (isObj(r) && str(r.url)) out.push({ url: str(r.url)!, title: str(r.title), cited: true })
  } else {
    for (const u of arr(completion.citations)) if (str(u)) out.push({ url: str(u)!, title: null, cited: true })
  }
  return dedupe(out)
}

/** Links written into the answer text itself (markdown or bare), for answers without structured citations. */
export function inlineSources(text: string): CitedSource[] {
  const out: CitedSource[] = []
  for (const m of text.matchAll(/\[([^\]]{1,160})\]\((https?:\/\/[^\s)]+)\)/g)) out.push({ url: m[2], title: m[1], cited: true })
  for (const m of text.matchAll(/(?<![(\w])https?:\/\/[^\s)\]>"']+/g)) out.push({ url: m[0].replace(/[.,;:]+$/, ""), title: null, cited: true })
  return dedupe(out)
}

// ── Classifying a cited page ───────────────────────────────────────────────────────────────────

// Same matching rule as competitor-relevance blockedHost: "yelp." = a label (yelp.com, yelp.ca,
// foo.yelp.com); "x.com" = that domain and its subdomains only.
const GROUPS: [Exclude<SourceKind, "own" | "competitor" | "other">, string[]][] = [
  ["directory", [
    "yelp.", "yellowpages.", "yellow.", "bbb.org", "angi.", "angieslist.", "thumbtack.", "houzz.", "homeadvisor.", "nextdoor.",
    "mapquest.", "foursquare.", "tripadvisor.", "manta.", "chamberofcommerce.", "superpages.", "citysearch.", "local.com",
    "merchantcircle.", "healthgrades.", "zocdoc.", "avvo.", "findlaw.", "justia.", "clutch.co", "g2.com", "capterra.", "trustpilot.",
    "sitejabber.", "glassdoor.", "crunchbase.", "producthunt.", "goodfirms.", "designrush.", "upcity.", "expertise.com",
    "sortlist.", "bark.com", "opentable.", "booking.", "expedia.", "groupon.", "getapp.", "softwareadvice.", "opencare.",
    "whatclinic.", "ratemds.", "vitals.com", "webmd.", "threebestrated.", "birdeye.", "porch.", "bizbuysell.", "lawyers.com",
    "martindale.", "superlawyers.", "realtor.com", "zillow.", "apartments.com", "theknot.", "weddingwire.", "alignable.",
    "cylex.", "hotfrog.", "brownbook.", "n49.", "411.ca", "canpages.", "yably.", "clinicfinder.", "trustradius.", "saasworthy.",
  ]],
  ["social", ["facebook.", "instagram.", "linkedin.", "twitter.", "x.com", "tiktok.", "pinterest.", "youtube.", "youtu.be", "vimeo.", "threads.net", "snapchat."]],
  ["forum", ["reddit.", "quora.", "stackexchange.", "stackoverflow.", "tripadvisor.com/showtopic"]],
  ["media", [
    "nytimes.", "forbes.", "cnn.", "bbc.", "theguardian.", "wsj.", "bloomberg.", "reuters.", "businessinsider.", "techcrunch.", "inc.com",
    "entrepreneur.com", "huffpost.", "usatoday.", "cbc.ca", "ctvnews.", "globalnews.", "theverge.", "wired.", "fastcompany.", "cnbc.",
    "blogto.", "timeout.", "eater.", "thestar.com", "nationalpost.", "torontolife.", "latimes.", "washingtonpost.", "axios.", "cnet.",
  ]],
  ["reference", ["wikipedia.", "fandom.", "wikihow.", "britannica.", "imdb.", ".gov", ".edu"]],
]

function matches(host: string, p: string): boolean {
  if (p.startsWith(".")) return host.endsWith(p) || host.includes(`${p}.`)
  return p.endsWith(".") ? host.startsWith(p) || host.includes(`.${p}`) : host === p || host.endsWith(`.${p}`)
}

/** Same site, ignoring "www." and subdomains (blog.acme.com counts as acme.com). */
export function sameSite(a: string, b: string): boolean {
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`)
}

export function classifySource(url: string, ctx: { ownHost: string | null; competitorHosts: string[] }): SourceKind {
  const host = hostOfUrl(url)
  if (!host) return "other"
  if (ctx.ownHost && sameSite(host, ctx.ownHost)) return "own"
  if (ctx.competitorHosts.some((c) => c && sameSite(host, c))) return "competitor"
  // A Google Maps listing is a directory entry, not "Google".
  if (/^(maps\.)?google\.[a-z.]+$/.test(host) && /\/maps\b/.test(url)) return "directory"
  for (const [kind, parts] of GROUPS) if (parts.some((p) => matches(host, p))) return kind
  return "other"
}

/** "Google Maps" for a maps link, else the host. */
export function sourceSite(url: string): string {
  const host = hostOfUrl(url) ?? url
  return /^(maps\.)?google\.[a-z.]+$/.test(host) && /\/maps\b/.test(url) ? "Google Maps" : host
}

// ── Who an answer names, in order ───────────────────────────────────────────────────────────────

const squashed = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

/** Index of the first mention of `name` in `text` (case/spacing-insensitive), or -1. */
export function firstIndex(text: string, name: string): number {
  const n = name.trim()
  if (!n) return -1
  const lower = text.toLowerCase()
  const esc = n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const exact = lower.search(new RegExp(`(^|[^a-z0-9])${esc}(?![a-z0-9])`))
  if (exact !== -1) return exact === 0 && lower.startsWith(n.toLowerCase()) ? 0 : exact + 1
  const sq = squashed(n)
  if (sq.length < 5) return -1
  // Spacing-insensitive fallback ("Growth Turbine" for "GrowthTurbine").
  let s = ""
  const map: number[] = []
  for (let i = 0; i < text.length; i++) if (/[a-z0-9]/i.test(text[i])) { s += text[i].toLowerCase(); map.push(i) }
  const k = s.indexOf(sq)
  return k === -1 ? -1 : map[k]
}

/**
 * Rank the businesses an answer names by where each first appears (1 = named first). The owner's
 * own rank is included when it's named. Names not found in the text keep the extractor's order
 * after the found ones.
 */
export function rankNames(response: string, names: string[], ownName: string | null): { ranks: { name: string; rank: number }[]; ownRank: number | null } {
  const items = names.map((name, i) => ({ name, idx: firstIndex(response, name), i, own: false }))
  const ownIdx = ownName ? firstIndex(response, ownName) : -1
  if (ownName && ownIdx !== -1) items.push({ name: ownName, idx: ownIdx, i: -1, own: true })
  items.sort((a, b) => (a.idx === -1 ? 1e9 + a.i : a.idx) - (b.idx === -1 ? 1e9 + b.i : b.idx))
  let ownRank: number | null = null
  const ranks: { name: string; rank: number }[] = []
  items.forEach((x, k) => { if (x.own) ownRank = k + 1; else ranks.push({ name: x.name, rank: k + 1 }) })
  return { ranks, ownRank }
}

// ── Stance (sentiment) when the brand is named ───────────────────────────────────────────────────

export type Tone = "positive" | "neutral" | "negative" | "mixed"
export type Stance = { tone: Tone; quote: string }
const TONES: Tone[] = ["positive", "neutral", "negative", "mixed"]

const flat = (s: string) => s.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim().toLowerCase()

/** The quote must be in the answer word for word (formatting aside); otherwise use the fallback sentence. */
export function validStance(raw: unknown, answer: string, fallbackQuote: string | null): Stance | null {
  if (!isObj(raw)) return null
  const tone = TONES.find((t) => t === raw.tone)
  if (!tone) return null
  const q = str(raw.quote)
  const quote = q && q.length >= 12 && flat(answer).includes(flat(q)) ? q.replace(/\s+/g, " ").slice(0, 300) : fallbackQuote?.replace(/\s+/g, " ").trim().slice(0, 300) || null
  return quote ? { tone, quote } : null
}

export const TONE_LABEL: Record<Tone, string> = { positive: "Positive", neutral: "Neutral", negative: "Negative", mixed: "Mixed" }

// ── Google AI Overviews (DataForSEO results page `ai_overview` item, lib/dataforseo-parse.ts) ──

export { parseAiOverview, type AiOverview } from "@/lib/dataforseo-parse"

// ── Competitor share of voice per week ──────────────────────────────────────────────────────────

type ScanEngine = { appeared: boolean; status: string; named?: string[] }
export type ScanLike = { at: string; questions: { engines: Partial<Record<string, ScanEngine | undefined>> }[] }
export type SovSeries = { key: string; name: string; own: boolean; points: { week: string; share: number | null; count: number }[] }
export type SovData = { weeks: { week: string; answers: number }[]; series: SovSeries[] }

/** Monday (UTC) of the week a date falls in, as YYYY-MM-DD. */
export function weekOf(iso: string): string {
  const d = new Date(iso)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}

/**
 * Group rival name variants ("Otterly.AI", "Otterly AI", "OtterlyAI"; "Semrush" and "Semrush AI
 * Visibility Toolkit") under one key. Shorter keys win: a name whose squashed form starts with an
 * existing 5+ character key joins it.
 */
export function rivalKeys(names: string[]): Map<string, string> {
  const keys = [...new Set(names.map(squashed).filter((k) => k.length >= 2))].sort((a, b) => a.length - b.length)
  const canon = new Map<string, string>()
  const roots: string[] = []
  for (const k of keys) {
    const root = roots.find((r) => r.length >= 5 && k.startsWith(r))
    if (root) canon.set(k, root)
    else { canon.set(k, k); roots.push(k) }
  }
  const out = new Map<string, string>()
  for (const n of names) out.set(n, canon.get(squashed(n)) ?? squashed(n))
  return out
}

/**
 * Per week (newest scan of each week): the share of answers that named the owner, and each of the
 * top `top` rivals (by total answers naming them, among names `keep` accepts). Only weeks with at
 * least one answer count. Shares are 0-100.
 */
export function shareOfVoice(scans: ScanLike[], opts: { ownName: string; keep: (name: string) => boolean; top?: number }): SovData {
  const byWeek = new Map<string, ScanLike>()
  for (const s of [...scans].sort((a, b) => a.at.localeCompare(b.at))) byWeek.set(weekOf(s.at), s)
  const weeks = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  const allNames: string[] = []
  for (const [, s] of weeks) for (const q of s.questions ?? []) for (const e of Object.values(q.engines ?? {})) for (const n of e?.named ?? []) if (opts.keep(n)) allNames.push(n.trim())
  const keyOf = rivalKeys(allNames)
  const ownKey = squashed(opts.ownName)

  const perWeek = weeks.map(([week, s]) => {
    let answers = 0, own = 0
    const rivals = new Map<string, number>()
    for (const q of s.questions ?? []) for (const e of Object.values(q.engines ?? {})) {
      if (!e || e.status === "error" || e.status === "not_configured") continue
      answers++
      if (e.appeared) own++
      const seen = new Set<string>()
      for (const n of e.named ?? []) {
        if (!opts.keep(n)) continue
        const k = keyOf.get(n.trim()) ?? squashed(n)
        if (!k || k === ownKey || seen.has(k)) continue
        seen.add(k)
        rivals.set(k, (rivals.get(k) ?? 0) + 1)
      }
    }
    return { week, answers, own, rivals }
  }).filter((w) => w.answers > 0)

  const total = new Map<string, number>()
  for (const w of perWeek) for (const [k, c] of w.rivals) total.set(k, (total.get(k) ?? 0) + c)
  const topKeys = [...total.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, opts.top ?? 4).map(([k]) => k)
  // Display name = the variant written most often.
  const variants = new Map<string, Map<string, number>>()
  for (const n of allNames) { const k = keyOf.get(n) ?? squashed(n); const m = variants.get(k) ?? new Map(); m.set(n, (m.get(n) ?? 0) + 1); variants.set(k, m) }
  const nameOf = (k: string) => [...(variants.get(k)?.entries() ?? [])].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0]?.[0] ?? k

  const pct = (c: number, n: number) => (n ? Math.round((c / n) * 1000) / 10 : null)
  const series: SovSeries[] = [
    { key: ownKey || "you", name: opts.ownName, own: true, points: perWeek.map((w) => ({ week: w.week, share: pct(w.own, w.answers), count: w.own })) },
    ...topKeys.map((k) => ({ key: k, name: nameOf(k), own: false, points: perWeek.map((w) => ({ week: w.week, share: pct(w.rivals.get(k) ?? 0, w.answers), count: w.rivals.get(k) ?? 0 })) })),
  ]
  return { weeks: perWeek.map((w) => ({ week: w.week, answers: w.answers })), series }
}

/** AI assistants and platforms aren't competitors, even when an answer names them. */
export const PLATFORM_NAME = /^(chatgpt|openai|gpt-?\d.*|gemini|google( ai| ai overviews| ai mode| business profile| my business| maps| search| search console)?|claude|anthropic|perplexity( ai)?|copilot|microsoft copilot|bing( places| webmaster tools)?|yelp|reddit|facebook|instagram|linkedin|youtube|tiktok|nextdoor|quora|wikipedia)$/i
