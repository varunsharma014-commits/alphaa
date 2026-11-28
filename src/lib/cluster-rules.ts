// Topic clusters, the pure part (client-safe, no I/O; tested by scripts/test-clusters.ts).
// lib/clusters.ts gathers the real inputs, asks Claude for the grouping once, and stores the map.
// Here: the numbered input lists for the prompt, the validation that drops anything not tied to a
// real input, each article's status from the brand's drafts, the next article to write and the
// pillar/sibling link targets for a brief.

export type ClusterInputs = {
  /** The AI customer questions I track, with how often the AIs named the business. */
  questions: { q: string; named: number; asked: number }[]
  /** Search Console queries (90 days, summed): impressions, clicks, average position. */
  queries: { query: string; impressions: number; clicks: number; position: number }[]
  /** Live pages on the owner's site (sitemap + posts I published). */
  pages: { url: string; title: string }[]
  /** Website drafts not live yet. */
  drafts: { id: string; title: string }[]
  /** Pages real competitors have that the owner doesn't (Research gaps, from their real pages). */
  gaps: { id: string; title: string; host: string; url: string | null }[]
  /** What the business sells: its category and its service pages / menu links. */
  services: { name: string; url: string | null }[]
}

export type SourceKind = "ai" | "gsc" | "gap" | "service" | "page" | "draft"
export type ClusterSource = { kind: SourceKind; ref: string; label: string; text: string; detail: string | null; url: string | null }
export type ClusterArticle = {
  id: string
  title: string
  /** The question it answers, when one of the inputs is a question. */
  question: string | null
  pillar: boolean
  sources: ClusterSource[]
  /** Live at build time (matched to one of the owner's pages). */
  url: string | null
  /** A draft that already covers it, at build time. */
  draftId: string | null
  /** A Research gap card it came from ("<contentGapId>:<index>"), for the brief's competitor benchmark. */
  gapId: string | null
  competitor: string | null
}
export type Cluster = { id: string; title: string; why: string; pillar: ClusterArticle; articles: ClusterArticle[] }
export type ClusterMap = {
  v: 1
  at: string
  clusters: Cluster[]
  inputs: { questions: number; queries: number; pages: number; drafts: number; gaps: number; services: number }
  /** Pillars/articles the model proposed that I dropped (not tied to a real input). */
  dropped: number
}

/** What the model returns (structured output), before validation. */
export type RawPlan = {
  clusters: { pillar: string; pillarSources: string[]; pillarPage: string | null; articles: { title: string; question: string | null; sources: string[]; page: string | null }[] }[]
}

export const MAX_CLUSTERS = 6
export const MIN_CLUSTERS = 3
export const MAX_ARTICLES = 10

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/^["“'\s]+|["”'\s]+$/g, "").trim()
export const titleKey = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim()
const STOP = new Set("the and for with your you how what why does can are our from that this into near best much who when which should about a an of to in on is do i my or vs it its at be by".split(" "))
const words = (s: string) => [...new Set(titleKey(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)))]
const overlap = (a: string, b: string) => { const wb = words(b); return words(a).filter((w) => wb.some((x) => x === w || (w.length > 4 && x.startsWith(w.slice(0, -1))))).length }

export function hashId(prefix: string, s: string): string {
  let h = 0x811c9dc5
  const t = titleKey(s)
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return `${prefix}${h.toString(36)}`
}

const slugTitle = (url: string) => {
  try { const p = new URL(url).pathname.split("/").filter(Boolean); return decodeURIComponent(p[p.length - 1] ?? "").replace(/\.(html?|php)$/i, "").replace(/[-_]+/g, " ").trim() } catch { return "" }
}
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, "") } catch { return u } }

// ── the prompt's numbered lists ──────────────────────────────────────────────────────────
export function promptLists(i: ClusterInputs): string {
  const sec = (head: string, lines: string[]) => `${head}\n${lines.join("\n") || "(none)"}`
  return [
    sec("AI QUESTIONS customers ask (Q):", i.questions.map((x, k) => `Q${k}: ${x.q}${x.asked ? `  [AIs named the business in ${x.named} of ${x.asked} answers]` : ""}`)),
    sec("GOOGLE SEARCHES that showed the site (K, Search Console, 90 days):", i.queries.map((x, k) => `K${k}: ${x.query}  [${x.impressions} impressions, average position ${Math.round(x.position * 10) / 10}]`)),
    sec("LIVE PAGES on the business's own site (P):", i.pages.map((x, k) => `P${k}: ${x.title} — ${x.url}`)),
    sec("DRAFTS already written, not live yet (D):", i.drafts.map((x, k) => `D${k}: ${x.title}`)),
    sec("COMPETITOR PAGES the business doesn't have (G):", i.gaps.map((x, k) => `G${k}: ${x.title}  [${x.host}]`)),
    sec("WHAT THE BUSINESS SELLS (S):", i.services.map((x, k) => `S${k}: ${x.name}`)),
  ].join("\n\n")
}

// ── validation ───────────────────────────────────────────────────────────────────────────
function resolve(ref: string, i: ClusterInputs): ClusterSource | null {
  const m = ref.trim().toUpperCase().match(/^([QKPDGS])(\d{1,3})$/)
  if (!m) return null
  const n = Number(m[2])
  switch (m[1]) {
    case "Q": { const x = i.questions[n]; return x ? { kind: "ai", ref: `Q${n}`, label: "AI question", text: x.q, detail: x.asked ? `AIs name you in ${x.named} of ${x.asked} answers` : null, url: null } : null }
    case "K": { const x = i.queries[n]; return x ? { kind: "gsc", ref: `K${n}`, label: "Google search", text: x.query, detail: `#${Math.max(1, Math.round(x.position))} on Google · ${x.impressions.toLocaleString("en-US")} impressions in 90 days`, url: null } : null }
    case "P": { const x = i.pages[n]; return x ? { kind: "page", ref: `P${n}`, label: "Live on your site", text: x.title, detail: null, url: x.url } : null }
    case "D": { const x = i.drafts[n]; return x ? { kind: "draft", ref: `D${n}`, label: "Your draft", text: x.title, detail: null, url: null } : null }
    case "G": { const x = i.gaps[n]; return x ? { kind: "gap", ref: `G${n}`, label: "Competitor page", text: x.title, detail: `${x.host} has a page on this`, url: x.url } : null }
    case "S": { const x = i.services[n]; return x ? { kind: "service", ref: `S${n}`, label: "Your service", text: x.name, detail: null, url: x.url } : null }
  }
  return null
}

/** Numbers a title may carry: only ones in its own sources (no invented "7 ways", "$99", "2025"). */
function numbersOk(title: string, sources: ClusterSource[]): boolean {
  const allowed = new Set(sources.flatMap((s) => (s.text.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]$/, ""))))
  return (title.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]$/, "")).every((x) => allowed.has(x))
}

function articleFrom(o: { title: string; question: string | null; sources: string[]; page: string | null; pillar: boolean }, i: ClusterInputs): ClusterArticle | null {
  const title = clean(o.title).slice(0, 110)
  if (title.length < 6) return null
  const refs = [...new Set(o.sources.map((r) => r.trim().toUpperCase()))]
  const sources = refs.map((r) => resolve(r, i)).filter((s): s is ClusterSource => !!s && s.kind !== "page" && s.kind !== "draft")
  // The page/draft it maps to must be about the same thing (a word in common), else it's dropped.
  let url: string | null = null, draftId: string | null = null
  const page = o.page ? resolve(o.page, i) : null
  if (page?.kind === "page" && page.url && (overlap(title, page.text) > 0 || overlap(title, slugTitle(page.url)) > 0)) { url = page.url; sources.unshift(page) }
  if (page?.kind === "draft" && overlap(title, page.text) > 0) { draftId = i.drafts[Number(page.ref.slice(1))].id; sources.unshift(page) }
  if (!sources.length) return null
  if (!numbersOk(title, sources)) return null
  // A question it answers: the model's, only when it's one of the real questions/searches; else the first AI question cited.
  const real = sources.filter((s) => s.kind === "ai" || s.kind === "gsc").map((s) => s.text)
  const q = o.question ? clean(o.question) : null
  const question = (q && real.find((r) => titleKey(r) === titleKey(q))) ?? sources.find((s) => s.kind === "ai")?.text ?? null
  const gap = sources.find((s) => s.kind === "gap")
  return {
    id: hashId("a_", title),
    title,
    question,
    pillar: o.pillar,
    sources,
    url,
    draftId,
    gapId: gap ? i.gaps[Number(gap.ref.slice(1))].id : null,
    competitor: gap ? i.gaps[Number(gap.ref.slice(1))].host : null,
  }
}

/** One plain sentence on what the cluster is built from, written in code from the real counts. */
export function whyOf(c: { pillar: ClusterArticle; articles: ClusterArticle[] }): string {
  const all = [c.pillar, ...c.articles].flatMap((a) => a.sources)
  const n = (k: SourceKind) => new Set(all.filter((s) => s.kind === k).map((s) => s.ref)).size
  const parts = [
    n("ai") ? `${n("ai")} AI question${n("ai") === 1 ? "" : "s"}` : null,
    n("gsc") ? `${n("gsc")} Google search${n("gsc") === 1 ? "" : "es"} you show up for` : null,
    n("gap") ? `${n("gap")} competitor page${n("gap") === 1 ? "" : "s"}` : null,
    n("service") ? `${n("service") === 1 ? "your service" : `${n("service")} of your services`}` : null,
    n("page") ? `${n("page")} page${n("page") === 1 ? "" : "s"} you already have` : null,
  ].filter(Boolean) as string[]
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0] ?? "your own data"
  return `Built from ${list}.`
}

/** Keeps only what maps to a real input; one live page / draft / title per map. */
export function validatePlan(raw: RawPlan | null | undefined, i: ClusterInputs, at = new Date().toISOString()): ClusterMap {
  let dropped = 0
  const seenTitle = new Set<string>()
  const seenUrl = new Set<string>()
  const seenDraft = new Set<string>()
  const take = (a: ClusterArticle | null): ClusterArticle | null => {
    if (!a) { dropped++; return null }
    const k = titleKey(a.title)
    if (seenTitle.has(k)) { dropped++; return null }
    if (a.url && seenUrl.has(a.url)) a.url = null
    if (a.draftId && seenDraft.has(a.draftId)) a.draftId = null
    seenTitle.add(k)
    if (a.url) seenUrl.add(a.url)
    if (a.draftId) seenDraft.add(a.draftId)
    return a
  }
  const clusters: Cluster[] = []
  for (const c of raw?.clusters ?? []) {
    if (clusters.length >= MAX_CLUSTERS) { dropped++; continue }
    const pillar = take(articleFrom({ title: c.pillar, question: null, sources: c.pillarSources ?? [], page: c.pillarPage, pillar: true }, i))
    if (!pillar) { dropped += (c.articles ?? []).length; continue }
    const articles: ClusterArticle[] = []
    for (const a of c.articles ?? []) {
      if (articles.length >= MAX_ARTICLES) { dropped++; continue }
      const x = take(articleFrom({ ...a, pillar: false }, i))
      if (x) articles.push(x)
    }
    if (!articles.length) {
      dropped++
      seenTitle.delete(titleKey(pillar.title))
      if (pillar.url) seenUrl.delete(pillar.url)
      if (pillar.draftId) seenDraft.delete(pillar.draftId)
      continue
    }
    clusters.push({ id: hashId("c_", pillar.title), title: pillar.title, why: whyOf({ pillar, articles }), pillar, articles })
  }
  return {
    v: 1,
    at,
    clusters,
    inputs: { questions: i.questions.length, queries: i.queries.length, pages: i.pages.length, drafts: i.drafts.length, gaps: i.gaps.length, services: i.services.length },
    dropped,
  }
}

// ── status, next, links ──────────────────────────────────────────────────────────────────
/** A website draft (post_draft row) as the cluster view needs it. */
export type DraftRow = { id: string; title: string | null; topic: string | null; requestTopic: string | null; status: string | null; url: string | null; cluster: string | null; at: string }
export type ArticleStatus = "published" | "drafted" | "planned"
export type ArticleView = ClusterArticle & { status: ArticleStatus; liveUrl: string | null; openDraftId: string | null; ref: string }
export type ClusterCard = { id: string; title: string; why: string; pillar: ArticleView; articles: ArticleView[]; written: number; live: number; total: number }
export type ClusterView = { mapId: string; at: string; clusters: ClusterCard[]; inputs: ClusterMap["inputs"]; next: { ref: string; title: string; pillar: string } | null }

/** "<mapId>:<articleId>": what a draft stores as metadata.cluster. */
export const clusterRef = (mapId: string, articleId: string) => `${mapId}:${articleId}`
export const articleOfRef = (ref: string | null | undefined) => (ref?.includes(":") ? ref.split(":").pop()! : null)

export function statusOf(a: ClusterArticle, drafts: DraftRow[]): { status: ArticleStatus; liveUrl: string | null; openDraftId: string | null } {
  const keys = new Set([titleKey(a.title), a.question ? titleKey(a.question) : ""].filter(Boolean))
  const mine = drafts.filter((d) => d.id === a.draftId || articleOfRef(d.cluster) === a.id || [d.title, d.topic, d.requestTopic].some((t) => t && keys.has(titleKey(t))))
  const live = mine.find((d) => d.status === "published" && d.url)
  if (a.url || live) return { status: "published", liveUrl: a.url ?? live?.url ?? null, openDraftId: live?.id ?? null }
  const open = mine.filter((d) => d.status !== "published").sort((x, y) => y.at.localeCompare(x.at))[0]
  return open ? { status: "drafted", liveUrl: null, openDraftId: open.id } : { status: "planned", liveUrl: null, openDraftId: null }
}

export function viewOf(mapId: string, map: ClusterMap, drafts: DraftRow[]): ClusterView {
  const v = (a: ClusterArticle): ArticleView => ({ ...a, ...statusOf(a, drafts), ref: clusterRef(mapId, a.id) })
  const clusters = map.clusters.map((c) => {
    const pillar = v(c.pillar)
    const articles = c.articles.map(v)
    const all = [pillar, ...articles]
    return { id: c.id, title: c.title, why: c.why, pillar, articles, written: all.filter((x) => x.status !== "planned").length, live: all.filter((x) => x.status === "published").length, total: all.length }
  })
  const n = nextOf(clusters)
  return { mapId, at: map.at, clusters, inputs: map.inputs, next: n ? { ref: n.article.ref, title: n.article.title, pillar: n.cluster.title } : null }
}

/** The next article to write: finish one topic before starting the next, pillar page first. */
function nextOf(clusters: ClusterCard[]): { cluster: ClusterCard; article: ArticleView } | null {
  for (const c of clusters) {
    if (c.pillar.status === "planned") return { cluster: c, article: c.pillar }
    const a = c.articles.find((x) => x.status === "planned")
    if (a) return { cluster: c, article: a }
  }
  return null
}

export function nextArticle(mapId: string, map: ClusterMap, drafts: DraftRow[]): { cluster: ClusterCard; article: ArticleView } | null {
  return nextOf(viewOf(mapId, map, drafts).clusters)
}

/**
 * Pages a cluster article's brief must link to: its pillar and its live siblings (the pillar links
 * to every live supporting page). Only live URLs: a draft has no address yet.
 */
export function linkTargets(mapId: string, map: ClusterMap, articleId: string, drafts: DraftRow[], max = 5): { url: string; title: string; pillar: boolean }[] {
  const view = viewOf(mapId, map, drafts)
  const c = view.clusters.find((x) => x.pillar.id === articleId || x.articles.some((a) => a.id === articleId))
  if (!c) return []
  const isPillar = c.pillar.id === articleId
  const out: { url: string; title: string; pillar: boolean }[] = []
  if (!isPillar && c.pillar.liveUrl) out.push({ url: c.pillar.liveUrl, title: c.pillar.title, pillar: true })
  for (const a of c.articles) if (a.id !== articleId && a.liveUrl && !out.some((x) => x.url === a.liveUrl)) out.push({ url: a.liveUrl, title: a.title, pillar: false })
  return out.slice(0, isPillar ? max + 1 : max)
}

export function findArticle(map: ClusterMap, articleId: string): { cluster: Cluster; article: ClusterArticle } | null {
  for (const c of map.clusters) {
    if (c.pillar.id === articleId) return { cluster: c, article: c.pillar }
    const a = c.articles.find((x) => x.id === articleId)
    if (a) return { cluster: c, article: a }
  }
  return null
}

/** Short, natural anchor text for a link to a sibling page (its title, without the brand part). */
export function anchorFor(title: string): string {
  const t = title.split(/\s[|–—-]\s|:\s/)[0].trim()
  return (t.length > 60 ? t.slice(0, 57).replace(/\s+\S*$/, "") : t) || title.slice(0, 60)
}

/** Adds "Related reading: [a](u) and [b](u)." before the FAQ section (or at the end). Pure. */
export function withRelated(markdown: string, links: { anchor: string; url: string }[]): string {
  if (!links.length) return markdown
  const items = links.map((l) => `[${l.anchor}](${l.url})`)
  const line = `Related reading: ${items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0]}.`
  const faq = markdown.search(/^##\s+Frequently asked questions/im)
  return faq >= 0 ? `${markdown.slice(0, faq).trimEnd()}\n\n${line}\n\n${markdown.slice(faq)}` : `${markdown.trimEnd()}\n\n${line}`
}

export { hostOf as clusterHost }
