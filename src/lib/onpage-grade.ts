// On-page SEO score for a draft, live as the owner types (pure code, client-safe, never blocks
// publishing). Sits next to the content score (lib/content-grade.ts) in the editor.
//
//   Topic coverage  terms the top pages for this topic use that the draft doesn't (lib/salient-terms.ts,
//                   computed from the pages the brief already read + Google AI Overview text we stored)
//   Headings        one H1 (the title), no skipped levels, some question headings
//   Keyword         the brief's keyword in the title, the opening and an H2
//   Internal links  how many links to the owner's own site, and the brief's / pillar's targets
//   Freshness       no stale or future years in the title or text (we never suggest adding a year)
//   Title / summary lengths Google shows; image alt text
import { blocksOf, plain, wordsOf, type GradeLevel } from "@/lib/content-grade"
import { keysIn, type Term } from "@/lib/salient-terms"

export type OnPageContext = {
  keyword?: string | null
  terms?: Term[]
  /** How many ranking pages the terms came from. */
  termPages?: number
  internalTargets?: { url: string; anchor?: string }[]
  pillar?: { url: string; title?: string } | null
  siblings?: { url: string; title?: string }[]
  siteHost?: string | null
  /** The summary that goes out as the excerpt / description. */
  excerpt?: string | null
  /** The post has a cover image with alt text (we always write one). */
  coverAlt?: boolean
  now?: Date
}

export type OnPageCheck = { key: "coverage" | "headings" | "keyword" | "links" | "freshness" | "title" | "summary" | "images"; label: string; value: string; level: GradeLevel; weight: number }
export type OnPageFix = { level: "fix" | "ok"; text: string; /** A link the owner can add with one tap: Markdown to insert. */ insert?: string }
export type OnPageGrade = {
  score: number
  level: GradeLevel
  checks: OnPageCheck[]
  fixes: OnPageFix[]
  missingTerms: string[]
  coveredTerms: string[]
}

export const TITLE_MIN = 30
export const TITLE_MAX = 60
export const SUMMARY_MIN = 120
export const SUMMARY_MAX = 160

const bareHost = (u: string) => { try { return new URL(/^https?:/i.test(u) ? u : `https://${u}`).hostname.toLowerCase().replace(/^www\./, "") } catch { return "" } }
const normUrl = (u: string) => u.replace(/#.*$/, "").replace(/\/+$/, "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "")
const pts = (l: GradeLevel) => (l === "good" ? 1 : l === "ok" ? 0.6 : 0.2)

export type MdLink = { text: string; url: string }
export function linksIn(md: string): MdLink[] {
  return [...md.matchAll(/(^|[^!])\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => ({ text: m[2], url: m[3] }))
}
export function imagesIn(md: string): { alt: string; url: string }[] {
  return [...md.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => ({ alt: m[1].trim(), url: m[2] }))
}

export function gradeOnPage(md: string, title: string, ctx: OnPageContext = {}): OnPageGrade {
  const now = ctx.now ?? new Date()
  const year = now.getFullYear()
  const blocks = blocksOf(md)
  const heads = blocks.filter((b): b is { kind: "h"; level: number; text: string } => b.kind === "h")
  const bodyWords = blocks.filter((b) => b.kind !== "h").reduce((n, b) => n + wordsOf(b.text).length, 0)
  const checks: OnPageCheck[] = []
  const fixes: OnPageFix[] = []

  // ── topic coverage ──
  const terms = (ctx.terms ?? []).slice(0, 25)
  let missingTerms: string[] = []
  let coveredTerms: string[] = []
  if (terms.length >= 5) {
    const have = keysIn(`${title}\n${plain(md)}`)
    const total = terms.reduce((n, t) => n + t.weight, 0)
    const covered = terms.filter((t) => have.has(t.key))
    coveredTerms = covered.map((t) => t.term)
    missingTerms = terms.filter((t) => !have.has(t.key)).map((t) => t.term)
    const share = total ? covered.reduce((n, t) => n + t.weight, 0) / total : 0
    const level: GradeLevel = share >= 0.7 ? "good" : share >= 0.45 ? "ok" : "fix"
    checks.push({ key: "coverage", label: "Topic coverage", value: `${covered.length} of ${terms.length} terms`, level, weight: 30 })
    if (level !== "good" && missingTerms.length) {
      const from = ctx.termPages ? ` (from ${ctx.termPages} page${ctx.termPages === 1 ? "" : "s"} already ranking for this)` : ""
      fixes.push({ level, text: `Pages that rank for this also cover: ${missingTerms.slice(0, 8).map((t) => `“${t}”`).join(", ")}${from}. Add the ones that are true for you, where they fit.` })
    }
  }

  // ── headings ──
  {
    const h1s = heads.filter((h) => h.level === 1)
    const skips: { text: string; from: number; to: number }[] = []
    let prev = 1 // the title is the H1
    for (const h of heads) {
      if (h.level > prev + 1) skips.push({ text: plain(h.text).slice(0, 50), from: prev, to: h.level })
      prev = h.level
    }
    const h2 = heads.filter((h) => h.level === 2)
    const questions = h2.filter((h) => /\?\s*$/.test(plain(h.text)) || /^(how|what|why|when|where|who|which|can|does|do|is|are|should)\b/i.test(plain(h.text)))
    const problems = (h1s.length ? 1 : 0) + skips.length + (bodyWords >= 300 && !h2.length ? 1 : 0)
    const level: GradeLevel = problems === 0 && (questions.length > 0 || h2.length === 0) ? "good" : problems === 0 ? "ok" : problems === 1 ? "ok" : "fix"
    checks.push({ key: "headings", label: "Headings", value: `${h2.length} section${h2.length === 1 ? "" : "s"}${questions.length ? `, ${questions.length} as questions` : ""}${h1s.length ? `, ${h1s.length} extra H1` : ""}`, level, weight: 15 })
    if (h1s.length) fixes.push({ level: "fix", text: `Your title is already the page’s main heading (H1). Change “# ${plain(h1s[0].text).slice(0, 50)}” to a ## section heading so the page has one H1.` })
    for (const k of skips.slice(0, 2)) fixes.push({ level: "ok", text: `“${k.text}” jumps from H${k.from} to H${k.to}. Make it H${k.from + 1} so the outline doesn’t skip a level.` })
    if (bodyWords >= 300 && !h2.length) fixes.push({ level: "fix", text: "Break the post into sections with ## headings. Search engines and AI use them to find each answer." })
    else if (h2.length >= 2 && !questions.length) fixes.push({ level: "ok", text: "Phrase one or two section headings as the question a customer asks (“How long does … take?”)." })
  }

  // ── keyword ──
  const kw = ctx.keyword?.trim()
  if (kw) {
    const k = keysIn(kw)
    const hasAll = (s: string) => { const have = keysIn(s); return [...k].filter((x) => !x.includes(" ")).every((x) => have.has(x)) }
    const opening = blocks.filter((b) => b.kind !== "h").map((b) => b.text).join(" ").split(/\s+/).slice(0, 100).join(" ")
    const inTitle = hasAll(title), inOpen = hasAll(opening), inH2 = heads.some((h) => h.level >= 2 && hasAll(h.text))
    const n = [inTitle, inOpen, inH2].filter(Boolean).length
    checks.push({ key: "keyword", label: "Main search phrase", value: n === 3 ? "in title, opening and a heading" : `${n} of 3 places`, level: n === 3 ? "good" : n >= 2 ? "ok" : "fix", weight: 10 })
    if (!inTitle) fixes.push({ level: "fix", text: `Use “${kw}” (or close words) in the title. It’s what people search for.` })
    if (!inOpen) fixes.push({ level: "ok", text: `Mention “${kw}” in the first 100 words.` })
    if (!inH2 && heads.length) fixes.push({ level: "ok", text: `Use “${kw}” in one section heading.` })
  }

  // ── internal links ──
  {
    const host = ctx.siteHost ? bareHost(ctx.siteHost) : ""
    const links = linksIn(md)
    const internal = links.filter((l) => l.url.startsWith("/") || (host && bareHost(l.url) === host))
    const linked = new Set(internal.map((l) => normUrl(l.url.startsWith("/") && host ? `${host}${l.url}` : l.url)))
    const targets = [...(ctx.pillar ? [{ url: ctx.pillar.url, anchor: ctx.pillar.title }] : []), ...(ctx.internalTargets ?? []), ...(ctx.siblings ?? []).map((s) => ({ url: s.url, anchor: s.title }))]
      .filter((t, i, a) => a.findIndex((x) => normUrl(x.url) === normUrl(t.url)) === i)
    const unused = targets.filter((t) => !linked.has(normUrl(t.url)))
    const want = Math.max(2, Math.min(5, Math.round(bodyWords / 350)))
    const pillarMissing = !!ctx.pillar && unused.some((t) => normUrl(t.url) === normUrl(ctx.pillar!.url))
    const level: GradeLevel = internal.length >= want && !pillarMissing ? "good" : internal.length >= 1 ? "ok" : "fix"
    checks.push({ key: "links", label: "Links to your pages", value: `${internal.length}${targets.length ? `, ${targets.length - unused.length} of ${targets.length} planned` : ""}`, level, weight: 15 })
    if (pillarMissing) fixes.push({ level: "fix", text: `Link to your main page on this topic: ${ctx.pillar!.title ?? ctx.pillar!.url}.`, insert: `[${ctx.pillar!.title ?? "Read more"}](${ctx.pillar!.url})` })
    for (const t of unused.filter((t) => !ctx.pillar || normUrl(t.url) !== normUrl(ctx.pillar.url)).slice(0, 3)) fixes.push({ level: "ok", text: `Link to ${t.anchor ? `“${t.anchor}”` : t.url} where it fits.`, insert: `[${t.anchor ?? "this page"}](${t.url})` })
    if (!targets.length && internal.length < want) fixes.push({ level: internal.length ? "ok" : "fix", text: `Add ${want - internal.length} more link${want - internal.length === 1 ? "" : "s"} to your own pages (a service page, contact, a related post).` })
  }

  // ── freshness ──
  {
    const titleYears = [...`${title} ${heads.map((h) => h.text).join(" ")}`.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]))
    const textYears = [...plain(md).matchAll(/\b(?:in|for|of|since|by|as of|updated|until)\s+((?:19|20)\d{2})\b/gi)].map((m) => Number(m[1]))
    const future = [...new Set([...titleYears, ...textYears].filter((y) => y > year))]
    const staleTitle = [...new Set(titleYears.filter((y) => y < year && y >= year - 15))]
    const level: GradeLevel = future.length ? "fix" : staleTitle.length ? "ok" : "good"
    checks.push({ key: "freshness", label: "Dates", value: future.length ? `mentions ${future.join(", ")}` : staleTitle.length ? `title says ${staleTitle.join(", ")}` : "nothing out of date", level, weight: 10 })
    if (future.length) fixes.push({ level: "fix", text: `It mentions ${future.join(", ")}, which hasn’t happened yet. Check the date.` })
    if (staleTitle.length) fixes.push({ level: "ok", text: `A heading says ${staleTitle.join(", ")}. If it’s still true today, drop the year; only say ${year} if you’ve checked it for ${year}.` })
  }

  // ── title ──
  {
    const n = title.trim().length
    const level: GradeLevel = n >= TITLE_MIN && n <= TITLE_MAX ? "good" : (n >= 20 && n < TITLE_MIN) || (n > TITLE_MAX && n <= 70) ? "ok" : "fix"
    checks.push({ key: "title", label: "Title length", value: `${n} characters`, level, weight: 10 })
    if (n > TITLE_MAX) fixes.push({ level: level === "fix" ? "fix" : "ok", text: `The title is ${n} characters. Google shows about ${TITLE_MAX}, so the end gets cut. Put the important words first.` })
    else if (n < TITLE_MIN) fixes.push({ level: level === "fix" ? "fix" : "ok", text: `The title is only ${n} characters. Say what the page answers, in ${TITLE_MIN}-${TITLE_MAX} characters.` })
  }

  // ── summary (excerpt = meta description) ──
  if (ctx.excerpt !== undefined) {
    const n = (ctx.excerpt ?? "").trim().length
    const level: GradeLevel = n >= SUMMARY_MIN && n <= SUMMARY_MAX ? "good" : (n >= 70 && n < SUMMARY_MIN) || (n > SUMMARY_MAX && n <= 200) ? "ok" : "fix"
    checks.push({ key: "summary", label: "Summary for Google", value: n ? `${n} characters` : "none", level, weight: 10 })
    if (!n) fixes.push({ level: "fix", text: `Add a ${SUMMARY_MIN}-${SUMMARY_MAX} character summary. Google shows it under your title.` })
    else if (n > SUMMARY_MAX) fixes.push({ level: level === "fix" ? "fix" : "ok", text: `The summary is ${n} characters. Google shows about ${SUMMARY_MAX}; trim it.` })
    else if (n < SUMMARY_MIN) fixes.push({ level: level === "fix" ? "fix" : "ok", text: `The summary is ${n} characters. Use ${SUMMARY_MIN}-${SUMMARY_MAX} to say what the reader gets.` })
  }

  // ── images ──
  {
    const imgs = imagesIn(md)
    const bad = imgs.filter((i) => i.alt.length < 5 || /\.(jpe?g|png|webp|gif|avif)$/i.test(i.alt) || /^(image|photo|picture|img)\s*\d*$/i.test(i.alt))
    if (imgs.length || ctx.coverAlt !== undefined) {
      const level: GradeLevel = bad.length === 0 ? "good" : bad.length === 1 && imgs.length > 2 ? "ok" : "fix"
      checks.push({ key: "images", label: "Image descriptions", value: imgs.length ? `${imgs.length - bad.length} of ${imgs.length} described${ctx.coverAlt ? ", cover described" : ""}` : ctx.coverAlt ? "cover described" : "no images", level, weight: 10 })
      for (const i of bad.slice(0, 2)) fixes.push({ level: "fix", text: `Describe the image ${i.url.split("/").pop()?.slice(0, 40) ?? ""} in its alt text: ![what it shows](…). Screen readers and Google read it.` })
    }
  }

  const totalW = checks.reduce((n, c) => n + c.weight, 0)
  const score = totalW ? Math.round((checks.reduce((n, c) => n + pts(c.level) * c.weight, 0) / totalW) * 100) : 0
  const level: GradeLevel = score >= 80 ? "good" : score >= 60 ? "ok" : "fix"
  return { score, level, checks, fixes: fixes.sort((a, b) => (a.level === b.level ? 0 : a.level === "fix" ? -1 : 1)).slice(0, 8), missingTerms, coveredTerms }
}
