// Originality check, the pure part (client-safe, no I/O; tested by scripts/test-originality.ts).
// lib/originality.ts runs it: the self-built provider compares a draft with every page I read for
// its brief (8-word shingles) and searches ~5 distinctive sentences as exact phrases on Google.
//
// Rules (owner decision 2026-11-28, start values):
//   - Blocked: overlap with ANY single source above 15% of the draft, or 2+ verbatim runs of 25+
//     words (across all sources; a web-matched sentence of 25+ words counts as one run).
//   - Otherwise advisory: matches are shown, publishing goes on.
//   - Headings, link URLs and image alt text are not compared (question headings are meant to
//     match what people ask). Quotes are allowed when attributed: a quoted span or a blockquote
//     with a link, "according to", "said/says/writes" or a "— Name" line is left out.
//   - Texts under MIN_WORDS words aren't checked (nothing meaningful to compare).

export const SHINGLE = 8
export const BLOCK_SOURCE_PCT = 15
export const BLOCK_RUN_WORDS = 25
export const BLOCK_RUNS = 2
export const MIN_WORDS = 120
export const WEB_SENTENCES = 5

export type OriginalitySource = { url: string; title: string | null; kind: "brief" | "web" }
export type OriginalityPassage = {
  /** The matching words as they read in the draft. */
  text: string
  words: number
  /** The draft sentences that hold it (what "Rewrite these lines" rewrites). */
  sentences: string[]
  url: string
  title: string | null
  via: "page" | "web"
}
export type SourceOverlap = { url: string; title: string | null; kind: OriginalitySource["kind"]; pct: number; words: number; longestRun: number; runs25: number }
export type WebSentence = { key: string; sentence: string; matches: { url: string; title: string | null; via: "snippet" | "page" }[] }

export type OriginalityResult = {
  v: 1
  provider: string
  at: string
  /** Hash of the checked text (lib/originality-rules.ts textHash): stale when the draft changed. */
  hash: string
  words: number
  /** 0-100: share of the draft's words that match no source. */
  original: number
  sources: SourceOverlap[]
  passages: OriginalityPassage[]
  runs25: number
  blocked: boolean
  reason: string | null
  /** What was compared: pages read (and not readable), sentences searched. */
  read: { url: string; ok: boolean }[]
  web: { ran: boolean; note: string | null; sentences: WebSentence[] }
  tooShort?: boolean
}

// ── text → comparable units ────────────────────────────────────────────────────────────────
const STOP = new Set("a an and are as at be been but by can do does for from had has have he her his i if in into is it its me my no not of on or our she so than that the their them then there these they this to too us was we were what when where which who why will with you your".split(" "))

export function norm(s: string): string {
  return s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”«»]/g, '"').replace(/'/g, "").replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim()
}
export const tokens = (s: string): string[] => (norm(s) ? norm(s).split(" ") : [])

const ATTRIB = /\]\(https?:\/\/|https?:\/\/|\baccording to\b|\b(said|says|writes|wrote|explains|notes)\b|\bsource:|^\s*[—–]\s*\S/i
const QUOTED = /[“"]([^”"\n]{20,})[”"]/g

/** Markdown → sentences in reading order (headings, tables' rules, images left out; links → their text). */
export function units(markdown: string): string[] {
  const out: string[] = []
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n")
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (/^\s*#{1,6}\s/.test(line) || /^\s*\|?\s*:?-{3,}/.test(line) || !line.trim()) continue
    // A blockquote with an attribution (in it, or on the next line) is a quote: skip it.
    if (/^\s*>/.test(line)) {
      const block: string[] = []
      let j = i
      while (j < lines.length && /^\s*>/.test(lines[j])) block.push(lines[j++])
      const next = lines[j] ?? ""
      const byLine = (l: string) => /^\s*(?:[—–]|--)\s*[A-Z]/.test(l.replace(/^\s*>\s?/, ""))
      if (ATTRIB.test(block.join(" ")) || block.some(byLine) || byLine(next)) { i = j - 1; continue }
      line = line.replace(/^\s*>\s?(\[!\w+\]\s*)?/, "")
    }
    line = line
      .replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, " ")
      .replace(/^\s*([-*+]|\d{1,3}[.)])\s+/, "")
      .replace(/\|/g, " . ")
    // An attributed quote inside a sentence: the quoted words are left out, the rest stays.
    if (ATTRIB.test(line)) line = line.replace(QUOTED, " ")
    line = line.replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, "$1").replace(/[*_`]+/g, "")
    for (const s of line.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)) if (s.trim()) out.push(s.trim())
  }
  return out
}

/** The draft as a token stream; unitOf[i] = which sentence token i is in. */
export function draftTokens(markdown: string): { toks: string[]; raw: string[]; unitOf: number[]; units: string[] } {
  const us = units(markdown)
  const toks: string[] = [], raw: string[] = [], unitOf: number[] = []
  us.forEach((u, k) => {
    for (const w of u.split(/\s+/)) {
      const t = norm(w)
      if (!t) continue
      t.split(" ").forEach((part, j) => { toks.push(part); raw.push(j === 0 ? w : ""); unitOf.push(k) })
    }
  })
  return { toks, raw, unitOf, units: us }
}

/** FNV-1a over the normalized words: the same text (spacing/punctuation aside) = the same hash. Client-safe. */
export function textHash(s: string): string {
  let h = 0x811c9dc5
  const t = norm(s)
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return `${t.length.toString(36)}-${h.toString(36)}`
}

const meaningful = (ws: string[]) => ws.filter((w) => !STOP.has(w) && w.length > 2).length >= 2

/** Every 8-word shingle of a text (as a joined key). Shingles of only stop words are skipped. */
export function shingles(toks: string[], n = SHINGLE): Set<string> {
  const out = new Set<string>()
  for (let i = 0; i + n <= toks.length; i++) {
    const w = toks.slice(i, i + n)
    if (meaningful(w)) out.add(w.join(" "))
  }
  return out
}

/** Contiguous true stretches of a coverage array: [start, end) pairs. */
export function runsOf(cov: boolean[]): [number, number][] {
  const out: [number, number][] = []
  let s = -1
  for (let i = 0; i <= cov.length; i++) {
    if (i < cov.length && cov[i]) { if (s < 0) s = i }
    else if (s >= 0) { out.push([s, i]); s = -1 }
  }
  return out
}

// ── the comparison ─────────────────────────────────────────────────────────────────────────
export type SourceText = { url: string; title: string | null; text: string }

/**
 * Compares the draft with the source pages and folds in the web matches. Pure: the caller fetched
 * the pages and ran the searches.
 */
export function compare(markdown: string, sources: SourceText[], web: WebSentence[], o: { provider: string; at?: string; read?: { url: string; ok: boolean }[]; webRan?: boolean; webNote?: string | null } = { provider: "self" }): OriginalityResult {
  const d = draftTokens(markdown)
  const n = d.toks.length
  const base = { v: 1 as const, provider: o.provider, at: o.at ?? new Date().toISOString(), hash: textHash(markdown), words: n, read: o.read ?? sources.map((s) => ({ url: s.url, ok: true })), web: { ran: !!o.webRan, note: o.webNote ?? null, sentences: web } }
  if (n < MIN_WORDS) return { ...base, original: 100, sources: [], passages: [], runs25: 0, blocked: false, reason: null, tooShort: true }

  const union = new Array<boolean>(n).fill(false)
  const overlaps: SourceOverlap[] = []
  const passages: OriginalityPassage[] = []
  const passageOf = (a: number, b: number, url: string, title: string | null, via: "page" | "web"): OriginalityPassage => {
    const us = [...new Set(d.unitOf.slice(a, b))].map((k) => d.units[k])
    return { text: d.raw.slice(a, b).filter(Boolean).join(" ").replace(/\s+/g, " ").slice(0, 600), words: b - a, sentences: us, url, title, via }
  }
  let runs25 = 0

  for (const src of sources) {
    const st = tokens(src.text)
    if (st.length < SHINGLE) continue
    const set = shingles(st)
    const cov = new Array<boolean>(n).fill(false)
    for (let i = 0; i + SHINGLE <= n; i++) {
      if (set.has(d.toks.slice(i, i + SHINGLE).join(" "))) for (let k = i; k < i + SHINGLE; k++) cov[k] = true
    }
    const covered = cov.filter(Boolean).length
    if (!covered) continue
    const runs = runsOf(cov)
    const longest = Math.max(...runs.map(([a, b]) => b - a))
    const r25 = runs.filter(([a, b]) => b - a >= BLOCK_RUN_WORDS).length
    runs25 += r25
    cov.forEach((c, i) => { if (c) union[i] = true })
    overlaps.push({ url: src.url, title: src.title, kind: "brief", pct: Math.round((covered / n) * 1000) / 10, words: covered, longestRun: longest, runs25: r25 })
    for (const [a, b] of runs) passages.push(passageOf(a, b, src.url, src.title, "page"))
  }

  // Web: a sentence found word for word on another page covers that sentence's words.
  const webBy = new Map<string, { title: string | null; words: number; runs25: number; longest: number }>()
  for (const ws of web) {
    if (!ws.matches.length) continue
    const st = tokens(ws.sentence)
    if (!st.length) continue
    // Where it sits in the draft.
    let at = -1
    for (let i = 0; i + st.length <= n; i++) {
      let ok = true
      for (let k = 0; k < st.length; k++) if (d.toks[i + k] !== st[k]) { ok = false; break }
      if (ok) { at = i; break }
    }
    if (at < 0) continue // edited away since the search
    for (let k = at; k < at + st.length; k++) union[k] = true
    const long = st.length >= BLOCK_RUN_WORDS
    if (long) runs25++
    for (const m of ws.matches.slice(0, 2)) {
      const cur = webBy.get(m.url) ?? { title: m.title, words: 0, runs25: 0, longest: 0 }
      cur.words += st.length
      cur.longest = Math.max(cur.longest, st.length)
      if (long) cur.runs25++
      webBy.set(m.url, cur)
      passages.push(passageOf(at, at + st.length, m.url, m.title, "web"))
    }
  }
  for (const [url, w] of webBy) overlaps.push({ url, title: w.title, kind: "web", pct: Math.round((w.words / n) * 1000) / 10, words: w.words, longestRun: w.longest, runs25: w.runs25 })

  overlaps.sort((a, b) => b.pct - a.pct)
  passages.sort((a, b) => b.words - a.words)
  const covered = union.filter(Boolean).length
  const original = Math.max(0, Math.min(100, Math.round(100 - (covered / n) * 100)))
  const top = overlaps[0]
  const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "") } catch { return u } }
  let reason: string | null = null
  if (top && top.pct > BLOCK_SOURCE_PCT) reason = `${Math.round(top.pct)}% of it matches one page (${host(top.url)}). I hold anything over ${BLOCK_SOURCE_PCT}%.`
  else if (runs25 >= BLOCK_RUNS) reason = `${runs25} passages of ${BLOCK_RUN_WORDS}+ words match other pages word for word.`
  return { ...base, original, sources: overlaps, passages: dedupePassages(passages).slice(0, 20), runs25, blocked: !!reason, reason }
}

function dedupePassages(ps: OriginalityPassage[]): OriginalityPassage[] {
  const seen = new Set<string>()
  return ps.filter((p) => { const k = `${p.url}|${norm(p.text).slice(0, 120)}`; if (seen.has(k)) return false; seen.add(k); return true })
}

// ── web check: which sentences to search ──────────────────────────────────────────────────
const COMMONISH = new Set("about after again against also always another around because before being below between both business businesses called come could customer customers different during each every first found going great help helps important information know later little local long looking made make makes many might more most much need needs never number often other people place really right same should since small something still such sure take them thing things think those though through time today under until very want ways well while within without work works would years".split(" "))

/**
 * Up to `max` sentences worth an exact-phrase search: 12-32 words, not a question, no link, not
 * naming the business, most uncommon words first, at most 2 from one section.
 */
export function pickSentences(markdown: string, o: { max?: number; exclude?: string[] } = {}): string[] {
  const max = o.max ?? WEB_SENTENCES
  const ex = (o.exclude ?? []).map((e) => norm(e)).filter((e) => e.length >= 3)
  const sections: { sec: number; s: string }[] = []
  let sec = 0
  for (const line of markdown.split("\n")) {
    if (/^\s*#{1,6}\s/.test(line)) { sec++; continue }
    if (/\]\(|https?:\/\//.test(line) || /^\s*>/.test(line) || /\[[^\]]{2,}\]/.test(line)) continue
    for (const s of units(line)) sections.push({ sec, s })
  }
  const scored = sections
    .map((x) => {
      const t = tokens(x.s)
      const rare = t.filter((w) => w.length >= 6 && !STOP.has(w) && !COMMONISH.has(w)).length
      return { ...x, n: t.length, score: rare + Math.min(t.length, 28) / 10 }
    })
    .filter((x) => x.n >= 12 && x.n <= 32 && !/\?\s*$/.test(x.s) && !ex.some((e) => norm(x.s).includes(e)))
    .sort((a, b) => b.score - a.score)
  const out: string[] = []
  const per = new Map<number, number>()
  for (const x of scored) {
    if (out.length >= max) break
    if ((per.get(x.sec) ?? 0) >= 2) continue
    per.set(x.sec, (per.get(x.sec) ?? 0) + 1)
    out.push(x.s.replace(/[*_`]+/g, "").trim())
  }
  return out
}

/** Longest run of words two texts share, in order (for "does this snippet hold the sentence?"). */
export function longestShared(a: string[], b: string[]): number {
  let best = 0
  const prev = new Array<number>(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i++) {
    let diag = 0
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = a[i - 1] === b[j - 1] ? diag + 1 : 0
      if (prev[j] > best) best = prev[j]
      diag = tmp
    }
  }
  return best
}

/** A search snippet or page text holds the sentence: 10+ words in a row (or nearly all of a short one). */
export function holdsSentence(sentence: string, text: string): boolean {
  const s = tokens(sentence)
  if (!s.length) return false
  const t = tokens(text)
  if (!t.length) return false
  const need = Math.min(10, Math.max(6, s.length - 2))
  return longestShared(s, t) >= need
}

/** The search query for one sentence: the words in quotes, at most 32 (Google's limit). */
export function phraseQuery(sentence: string): string {
  return `"${sentence.replace(/["“”]/g, "").split(/\s+/).slice(0, 32).join(" ")}"`
}

export const sentenceKey = (s: string) => textHash(s)

/** Replace whole sentences in a text (first occurrence of each). Returns the new text and which ones were found. */
export function replaceSentences(text: string, edits: { from: string; to: string }[]): { text: string; done: number; missed: string[] } {
  let out = text
  let done = 0
  const missed: string[] = []
  for (const e of edits) {
    const i = out.indexOf(e.from)
    if (i >= 0 && e.to.trim()) { out = out.slice(0, i) + e.to.trim() + out.slice(i + e.from.length); done++ }
    else missed.push(e.from)
  }
  return { text: out, done, missed }
}

/** The sentence a units() sentence came from, as it is written in the Markdown (links and bold kept), if findable. */
export function sourceSentence(markdown: string, unit: string): string | null {
  if (markdown.includes(unit)) return unit
  // Rebuild a loose pattern: the unit's words with any markup between them.
  const words = unit.split(/\s+/).filter(Boolean).slice(0, 60)
  if (words.length < 3) return null
  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(words.map(esc).join(String.raw`[\s*_\x60\[\]]*(?:\]\([^)\s]*\))?[\s*_\x60\[\]]*`))
  const m = markdown.match(re)
  return m ? m[0] : null
}

/** Owner-facing one-liner. */
export function summaryLine(r: OriginalityResult): string {
  if (r.tooShort) return "Too short to check yet."
  if (r.blocked) return r.reason ?? "Held: too close to another page."
  if (!r.passages.length) return r.web.ran ? "No matching passages on the pages I read or on Google." : "No matching passages on the pages I read."
  return `${r.passages.length} short passage${r.passages.length === 1 ? "" : "s"} match other pages. Fine to publish, worth a look.`
}
