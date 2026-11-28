// Salient terms: the words and two-word phrases that the pages already ranking for a topic keep
// using (pure code, TF-IDF-ish, no paid NLP API; client-safe).
//
// Score per term = Σ over pages of log(1 + count) × (1 + heading bonus), × a document-frequency
// boost (a term several top pages share matters more than one page's pet word), with everyday
// English and web boilerplate removed as the "background" (that's the IDF part with few pages).

export type Term = { term: string; /** Stemmed key used for matching. */ key: string; weight: number; /** How many of the pages use it. */ pages: number; inHeadings: boolean }
export type TermDoc = { text: string; headings?: string[] }

// Everyday English + web boilerplate: never "salient".
const STOP = new Set(`a about above across after again against all almost alone along already also although always am among an and another any anybody anyone anything anyway anywhere are around as ask asked at away back be became because become becomes been before behind being below best better between big both but by call came can cannot could did do does doing done down during each either else enough even ever every everyone everything far few find first for found from full further get gets getting give given go goes going gone good got great had has have having he her here hers herself him himself his how however i if in into is it its itself just keep kind know large last later least less let like likely long look made make makes making many may me might more most much must my myself near need needs never new next no nobody none nor not nothing now of off often old on once one only onto or other others our ours out over own part per perhaps put rather really right said same say see seem seems several shall she should show side since so some someone something sometimes soon still such sure take than that the their theirs them themselves then there these they thing things think this those though through thus to together too took toward under until up upon us use used uses using very want wants was way ways we well went were what whatever when where whether which while who whole whom whose why will with within without would yes yet you your yours yourself yourselves
also able across actually already etc via vs per ok okay lot lots bit day days week weeks month months year years time times today yesterday tomorrow people person thing stuff
click here read more learn menu home page pages site website contact us email phone call subscribe newsletter cookie cookies privacy policy terms conditions rights reserved copyright share facebook twitter instagram linkedin youtube tiktok pinterest login log sign signup account cart checkout search skip content main navigation toggle close open previous next post posts blog article articles comment comments reply author posted updated related tags tag category categories image images photo photos video loading javascript browser edit retrieved references wikipedia`.split(/\s+/))

/** Light English stemmer for matching (plural/-ing/-ed), not for display. */
export function stem(w: string): string {
  if (w.length <= 3) return w
  if (/ies$/.test(w) && w.length > 4) return w.slice(0, -3) + "y"
  if (/(ss|us|is)$/.test(w)) return w
  if (/(sh|ch|x|z)es$/.test(w)) return w.slice(0, -2)
  if (/s$/.test(w)) return w.slice(0, -1)
  if (/ing$/.test(w) && w.length > 5) return w.slice(0, -3)
  if (/ed$/.test(w) && w.length > 5) return w.slice(0, -2)
  return w
}

export function tokens(s: string): string[] {
  return s.toLowerCase().replace(/['’]s\b/g, "").replace(/[^a-z0-9\s-]/g, " ").split(/[\s-]+/).filter(Boolean)
}
const useful = (w: string) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)

/** Unigrams and bigrams (no stopword inside), as stemmed keys → surface forms. */
function grams(text: string): { key: string; surface: string }[] {
  const ws = tokens(text)
  const out: { key: string; surface: string }[] = []
  for (let i = 0; i < ws.length; i++) {
    const w = ws[i]
    if (!useful(w)) continue
    out.push({ key: stem(w), surface: w })
    const n = ws[i + 1]
    if (n && useful(n)) out.push({ key: `${stem(w)} ${stem(n)}`, surface: `${w} ${n}` })
  }
  return out
}

/** Stemmed keys present in a text (for "does the draft use this term?"). */
export function keysIn(text: string): Set<string> {
  return new Set(grams(text).map((g) => g.key))
}

/**
 * Top terms across the pages. `exclude` = words never to suggest (brand names, the competitor's
 * name, the owner's city is fine to keep). Needs at least one page with 150+ words.
 */
export function salientTerms(docs: TermDoc[], opts: { exclude?: string[]; max?: number } = {}): Term[] {
  const usable = docs.filter((d) => tokens(d.text).length >= 150 || (d.headings?.length ?? 0) >= 3)
  if (!usable.length) return []
  const ex = new Set((opts.exclude ?? []).flatMap((x) => tokens(x)).map(stem))
  const stats = new Map<string, { score: number; pages: number; surfaces: Map<string, number>; heading: boolean; total: number }>()
  for (const d of usable) {
    const counts = new Map<string, { n: number; surfaces: Map<string, number> }>()
    for (const g of grams(d.text)) {
      const c = counts.get(g.key) ?? { n: 0, surfaces: new Map() }
      c.n++
      c.surfaces.set(g.surface, (c.surfaces.get(g.surface) ?? 0) + 1)
      counts.set(g.key, c)
    }
    const headKeys = keysIn((d.headings ?? []).join(" . "))
    for (const [key, c] of counts) {
      const s = stats.get(key) ?? { score: 0, pages: 0, surfaces: new Map(), heading: false, total: 0 }
      const inHead = headKeys.has(key)
      s.score += Math.log(1 + c.n) * (inHead ? 1.6 : 1)
      s.pages++
      s.total += c.n
      s.heading = s.heading || inHead
      for (const [sf, n] of c.surfaces) s.surfaces.set(sf, (s.surfaces.get(sf) ?? 0) + n)
      stats.set(key, s)
    }
  }
  const many = usable.length > 1
  const list: Term[] = []
  for (const [key, s] of stats) {
    const parts = key.split(" ")
    if (parts.some((p) => ex.has(p))) continue
    const bigram = parts.length === 2
    // Rare words are noise: a unigram needs 3+ uses (or a heading), a phrase 2+.
    if (!s.heading && s.total < (bigram ? 2 : 3)) continue
    if (many && s.pages < 2 && !s.heading && s.total < (bigram ? 3 : 5)) continue
    const dfBoost = many ? Math.pow(s.pages / usable.length, 0.5) * (1 + (s.pages - 1) * 0.5) : 1
    const weight = s.score * dfBoost * (bigram ? 1.4 : 1)
    const surface = [...s.surfaces.entries()].sort((a, b) => b[1] - a[1])[0][0]
    list.push({ term: surface, key, weight: Math.round(weight * 100) / 100, pages: s.pages, inHeadings: s.heading })
  }
  list.sort((a, b) => b.weight - a.weight)
  // A phrase covers its own words: drop a single word that mostly appears inside a stronger phrase.
  const out: Term[] = []
  for (const t of list) {
    if (out.length >= (opts.max ?? 25)) break
    if (!t.key.includes(" ") && out.some((o) => o.key.includes(" ") && o.key.split(" ").includes(t.key) && o.weight >= t.weight * 0.6)) continue
    if (out.some((o) => o.key === t.key)) continue
    out.push(t)
  }
  return out
}
