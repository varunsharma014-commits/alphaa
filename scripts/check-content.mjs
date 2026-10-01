#!/usr/bin/env node
// Blog content gate. Enforces marketing/content-engine-format.md mechanically so
// the daily content engine cannot drift or ship a silently-broken post.
//
//   node scripts/check-content.mjs                  lint every post's source
//   node scripts/check-content.mjs <slug> [<slug>]  lint only those posts
//   node scripts/check-content.mjs --built          assert the BUILT output
//   node scripts/check-content.mjs --built <slug>   ditto, one post
//
// Two layers, because we have hit both failure modes:
//   source  — authoring mistakes (unwrapped table, missing FAQ pairs, bad links)
//   built   — code regressions that silently drop schema even though the source
//             is fine (a literal-heading match in faq.ts once cost 94 posts
//             their hand-written FAQ pairs)
//
// Exit 1 if any ERROR. WARNs are printed and do not block.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs"
import path from "path"

const ROOT = process.cwd()
const BLOG = path.join(ROOT, "src/content/blog")
const BUILT = path.join(ROOT, ".next/server/app/blog")

const args = process.argv.slice(2)
const BUILT_MODE = args.includes("--built")
const only = args.filter((a) => !a.startsWith("--"))

// ── spec constants (marketing/content-engine-format.md) ──────────────────────
const WORDS = {
  guide: [1400, 2000],
  comparison: [1600, 2400],
  listicle: [1600, 2400],
  glossary: [700, 1000],
  industry: [1000, 1500],
  news: [600, 1000],
}
const KINDS = Object.keys(WORDS)
const REQUIRED_META = ["slug", "title", "description", "subtitle", "date", "readMins", "tag", "kind", "keyphrase"]
const ALLOWED_CLASSES = new Set(["article-prose", "table-wrap"])
const FAQ_MIN = 4
const FAQ_MAX = 6
// Figures marketing/content-engine.md lists under "DO NOT USE".
const BANNED_STATS = [
  { re: /50\s*%\s*of all searches/i, why: 'unsupported "AI Overviews in 50% of all searches"' },
  { re: /700\s*M\b[^.]*\bqueries/i, why: '"700M weekly queries" — wrong unit, that figure was users' },
  { re: /700\s*million\b[^.]*\bqueries/i, why: '"700 million weekly queries" — wrong unit, that figure was users' },
]
// Trust rules: Alphaa shapes public signals, it cannot promise outcomes.
// Every post discusses guarantees in order to debunk them — that IS the trust
// posture we want — so the word itself is not bannable. Flag only Alphaa
// promising an outcome in its own voice.
const BANNED_CLAIMS = [
  { re: /\b(we|alphaa)\s+(will\s+|can\s+)?guarantees?\b(?!\s*(no|not|nothing))/i, why: "first-person guarantee" },
  { re: /\bguarantee(s|d)?\s+(your|you\s+a)\s+\w*\s*(ranking|placement|spot|recommendation|citation)/i, why: "promised ranking or placement" },
  { re: /\b(we are|alphaa is)\b[^.]{0,30}\b#\s?1\b/i, why: 'self-claimed "#1"' },
  { re: /\balphaa is the best\b/i, why: 'self-claimed "the best"' },
]
// A DO-NOT-USE figure is fine when the post is quoting it to correct it, which
// is how our stats posts handle them. Require a quote or a correcting word
// nearby; a bare assertion of the figure is the thing we block.
const DEBUNK =
  /\b(no|none|not|nothing|nobody|never|without|cannot|anyone|hype|snake oil|selling|exagger|overstat|guess|wary|myth|scam|impossible|beware|wrong|outdated|out of date|misleading|unsupported|inflated|avoid|risk|puffery|discount)\b|[""]|\?/i

// Posts written before the AI-citation format rework. Correctness rules still
// apply to them; the format-completeness rules (subtitle/kind/keyphrase/
// takeaways/sources/lengths/FAQ block) are reported as warnings instead of
// errors so the backlog does not block new publishing. New posts are NOT in
// this list, so they are fully enforced. Regenerate only to retire entries.
const BASELINE_FILE = path.join(ROOT, "scripts/content-baseline.json")
const BASELINE = new Set(existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, "utf8")).grandfathered : [])

const problems = []
const add = (sev, slug, msg, cat) => problems.push({ sev, slug, msg, cat })
// Correctness: always an error. Broken links, lost schema, bad markup, false claims.
const err = (slug, msg) => add("ERROR", slug, msg, "correctness")
const warn = (slug, msg) => add("WARN", slug, msg, "format")
// Format-completeness: an error for new posts, a warning for grandfathered ones.
const fmtErr = (slug, msg) => add(BASELINE.has(slug) ? "WARN" : "ERROR", slug, msg, "format")

// ── helpers ──────────────────────────────────────────────────────────────────
// Mirrors toText() in src/content/blog/faq.ts.
function toText(jsx) {
  return jsx
    .replace(/\{\s*["']\s*["']\s*\}/g, " ")
    .replace(/\{[^{}]*\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&apos;/g, "\u2019")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function metaString(src, key) {
  const m = src.match(new RegExp(`\\b${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`))
  if (m) return m[1].replace(/\\"/g, '"')
  // multi-line template: description:\n    "..."
  const m2 = src.match(new RegExp(`\\b${key}:\\s*\\n?\\s*"((?:[^"\\\\]|\\\\.)*)"`))
  return m2 ? m2[1].replace(/\\"/g, '"') : null
}

function metaArrayLen(src, key) {
  const i = src.search(new RegExp(`\\b${key}:\\s*\\[`))
  if (i < 0) return null
  let depth = 0
  const start = src.indexOf("[", i)
  for (let j = start; j < src.length; j++) {
    if (src[j] === "[") depth++
    else if (src[j] === "]") {
      depth--
      if (depth === 0) {
        const body = src.slice(start + 1, j)
        if (!body.trim()) return 0
        // count top-level entries
        let d = 0,
          n = 1
        for (const ch of body) {
          if ("[{(".includes(ch)) d++
          else if ("]})".includes(ch)) d--
          else if (ch === "," && d === 0) n++
        }
        return body.trim().endsWith(",") ? n - 1 : n
      }
    }
  }
  return null
}

function bodyOf(src) {
  const i = src.search(/export function Body\s*\(/)
  return i < 0 ? "" : src.slice(i)
}

// toText() is only safe on small fragments: on a whole Body the function's own
// braces make the {expr} strip swallow everything. Count the JSX text nodes.
function bodyWords(body) {
  const text = [...body.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ")
  return toText(`<x>${text}</x>`).split(/\s+/).filter(Boolean).length
}

// Pairs a heading with the <p> that directly follows it — the shape extractFaq
// and the FAQPage schema depend on.
function pairs(src, tag) {
  const out = []
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>\\s*(?:<p[^>]*>([\\s\\S]*?)</p>)?`, "g")
  let m
  while ((m = re.exec(src))) out.push({ q: toText(m[1]), a: toText(m[2] || "") })
  return out
}

// Replicates extractFaq()'s contract so authoring errors surface before a build.
function derivedFaq(src, max = 12) {
  const out = []
  const seen = new Set()
  for (const p of [...pairs(src, "h3"), ...pairs(src, "h2")]) {
    if (out.length >= max) break
    if (p.q.endsWith("?") && p.a.length >= 40 && !seen.has(p.q)) {
      seen.add(p.q)
      out.push(p)
    }
  }
  return out
}

// ── layer 1: source lint ─────────────────────────────────────────────────────
function lintSources() {
  const files = readdirSync(BLOG).filter((f) => f.endsWith(".tsx"))
  const index = readFileSync(path.join(BLOG, "index.ts"), "utf8")
  const seenSlug = new Map()
  const seenKey = new Map()
  let checked = 0

  // A post's route comes from meta.slug, which is not always the filename
  // (aeo-vs-seo.tsx serves /blog/aeo-vs-seo-why-agencies-fail). Resolve links
  // and registration against the real slugs, not the file names.
  const slugToFile = new Map()
  for (const f of files) {
    if (f === "index.ts") continue
    const sl = metaString(readFileSync(path.join(BLOG, f), "utf8"), "slug")
    if (sl) slugToFile.set(sl, f)
  }

  for (const file of files) {
    const src = readFileSync(path.join(BLOG, file), "utf8")
    const slug = metaString(src, "slug")
    if (!slug) {
      err(file, "no slug in meta")
      continue
    }
    if (only.length && !only.includes(slug)) continue
    checked++
    const body = bodyOf(src)

    // identity + registration
    if (slug !== file.replace(/\.tsx$/, "")) fmtErr(slug, `slug does not match filename ${file}`)
    if (seenSlug.has(slug)) err(slug, `duplicate slug, also in ${seenSlug.get(slug)}`)
    seenSlug.set(slug, file)
    const mod = file.replace(/\.tsx$/, "")
    if (!index.includes(`"./${mod}"`)) err(slug, `not imported in index.ts (expected "./${mod}")`)
    else {
      const imp = index.match(new RegExp(`meta as (\\w+)[\\s\\S]{0,80}?"\\./${mod}"`))
      if (imp && !new RegExp(`\\{\\s*meta:\\s*${imp[1]}\\s*,`).test(index))
        err(slug, `imported but not added to the POSTS array (meta as ${imp[1]})`)
    }

    // required meta
    for (const k of REQUIRED_META) if (metaString(src, k) === null && !new RegExp(`\\b${k}:\\s*\\d`).test(src)) fmtErr(slug, `meta.${k} missing`)
    const kind = metaString(src, "kind")
    if (kind && !KINDS.includes(kind)) err(slug, `meta.kind "${kind}" is not one of ${KINDS.join(", ")}`)
    const keyphrase = metaString(src, "keyphrase")
    if (keyphrase) {
      if (seenKey.has(keyphrase)) err(slug, `duplicate keyphrase "${keyphrase}", also in ${seenKey.get(keyphrase)}`)
      seenKey.set(keyphrase, slug)
    }
    const title = metaString(src, "title")
    if (title && title.length > 60) fmtErr(slug, `title is ${title.length} chars, max 60`)
    const desc = metaString(src, "description")
    if (desc && (desc.length < 140 || desc.length > 160)) fmtErr(slug, `description is ${desc.length} chars, want 140-160`)
    const sub = metaString(src, "subtitle")
    if (sub && /[.!?]\s+\S/.test(sub)) warn(slug, "subtitle looks like more than one sentence")

    // hero image must exist on disk
    const img = metaString(src, "src")
    if (img && img.startsWith("/") && !existsSync(path.join(ROOT, "public", img.slice(1))))
      err(slug, `meta.image.src ${img} does not exist in public/`)

    // counts the spec makes mandatory
    const tk = metaArrayLen(src, "takeaways")
    if (tk === null) fmtErr(slug, "meta.takeaways missing")
    else if (tk < 3 || tk > 5) fmtErr(slug, `${tk} takeaways, want 3-5`)
    const srcs = metaArrayLen(src, "sources")
    if (srcs === null) fmtErr(slug, "meta.sources missing")
    else if (srcs < 3 || srcs > 6) fmtErr(slug, `${srcs} sources, want 3-6`)

    // links
    const internalAnchor = body.match(/<a\s+[^>]*href="\/[^"]*"/g)
    if (internalAnchor) err(slug, `${internalAnchor.length} internal <a href="/..."> — must be <Link href>`)
    const links = body.match(/<Link\s+href="\/[^"]*"/g) || []
    if (links.length && !/from "next\/link"/.test(src)) err(slug, "<Link> used without importing next/link")
    if (links.length < 2 || links.length > 4) warn(slug, `${links.length} internal <Link>s, want 2-4`)
    for (const l of body.match(/<Link\s+href="\/blog\/[^"]*"/g) || []) {
      const target = l.match(/href="\/blog\/([^"#]*)"/)[1]
      if (!slugToFile.has(target)) err(slug, `links to /blog/${target}, which is not a published slug`)
      if (target === slug) err(slug, "links to itself")
    }

    // markup hygiene inside article-prose
    for (const c of body.match(/className="([^"]*)"/g) || []) {
      const name = c.slice(11, -1)
      if (!ALLOWED_CLASSES.has(name)) err(slug, `className "${name}" inside article-prose — only ${[...ALLOWED_CLASSES].join(", ")}`)
    }
    const tables = (body.match(/<table[\s>]/g) || []).length
    const wraps = (body.match(/className="table-wrap"/g) || []).length
    if (tables > wraps) err(slug, `${tables} <table> but ${wraps} .table-wrap — unwrapped tables overflow on phones`)
    if (!tables && !/<ol[\s>]/.test(body)) warn(slug, "no table and no <ol> — spec wants one comparison table or numbered steps")

    // answer-first opening
    const first = (body.match(/<p>([\s\S]*?)<\/p>/) || [])[1]
    if (!first || !/Short answer:/.test(first)) fmtErr(slug, 'first paragraph must open with "<strong>Short answer:</strong>"')
    else {
      const n = toText(first).replace(/^Short answer:\s*/, "").split(/\s+/).length
      if (n < 40 || n > 60) warn(slug, `"Short answer" is ${n} words, want 40-60`)
    }

    // question H2s must each be answered by the <p> that follows
    const h2 = pairs(body, "h2")
    for (const p of h2) if (p.q.endsWith("?") && p.a.length < 40) fmtErr(slug, `question H2 "${p.q}" is not followed by an answering <p> of 40+ chars`)

    // the hand-written FAQ block
    const faqH3 = pairs(body, "h3").filter((p) => p.q.endsWith("?"))
    const faqOk = faqH3.filter((p) => p.a.length >= 40)
    if (faqH3.length < FAQ_MIN) fmtErr(slug, `${faqH3.length} FAQ <h3>?</h3> pairs, want ${FAQ_MIN}-${FAQ_MAX}`)
    else if (faqH3.length > FAQ_MAX) warn(slug, `${faqH3.length} FAQ <h3> pairs, spec wants ${FAQ_MIN}-${FAQ_MAX}`)
    for (const p of faqH3) if (p.a.length < 40) fmtErr(slug, `FAQ question "${p.q}" has no answering <p> directly after it`)

    // derived schema — the regression class. Assert the pairs actually survive.
    const faq = derivedFaq(src)
    if (faq.length < FAQ_MIN) fmtErr(slug, `only ${faq.length} Q&A pairs would reach FAQPage schema, want >= ${FAQ_MIN}`)
    for (const p of faqOk) if (!faq.some((f) => f.q === p.q)) err(slug, `FAQ question "${p.q}" is written but would NOT reach FAQPage schema`)

    // facts and trust
    const sentences = toText(`<x>${[...body.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]).join(" ")}</x>`).split(/(?<=[.!?])\s+/)
    for (const b of BANNED_STATS)
      for (const sent of sentences)
        if (b.re.test(sent) && !DEBUNK.test(sent)) err(slug, `asserts a DO-NOT-USE figure: ${b.why} — in "${sent.trim().slice(0, 90)}"`)
    for (const b of BANNED_CLAIMS)
      for (const sent of sentences)
        if (b.re.test(sent) && !DEBUNK.test(sent))
          err(slug, `${b.why} — Alphaa shapes signals, it cannot promise outcomes — in "${sent.trim().slice(0, 90)}"`)

    // length
    const words = bodyWords(body)
    const range = WORDS[kind]
    if (range && (words < range[0] || words > range[1])) warn(slug, `${words} words, ${kind} wants ${range[0]}-${range[1]}`)
    const rm = Number((src.match(/readMins:\s*(\d+)/) || [])[1])
    if (rm && Math.abs(rm - Math.ceil(words / 230)) > 1) warn(slug, `readMins ${rm}, words/230 = ${Math.ceil(words / 230)}`)
  }
  return checked
}

// ── layer 2: assert the built output ─────────────────────────────────────────
function lintBuilt() {
  if (!existsSync(BUILT)) {
    err("build", `${path.relative(ROOT, BUILT)} not found — run next build first`)
    return 0
  }
  // Route -> source file by meta.slug, not by filename: two posts serve a slug
  // that differs from their file name, and matching on the file name made this
  // check silently skip them.
  const slugToFile = new Map()
  for (const f of readdirSync(BLOG).filter((f) => f.endsWith(".tsx"))) {
    const sl = metaString(readFileSync(path.join(BLOG, f), "utf8"), "slug")
    if (sl) slugToFile.set(sl, f)
  }
  const builtFiles = readdirSync(BUILT).filter((f) => f.endsWith(".html"))
  for (const sl of slugToFile.keys())
    if (!builtFiles.includes(`${sl}.html`) && (!only.length || only.includes(sl)))
      err(sl, "post has no prerendered HTML — it may be missing from the POSTS array")

  let checked = 0
  for (const file of builtFiles) {
    const slug = file.replace(/\.html$/, "")
    if (only.length && !only.includes(slug)) continue
    if (!slugToFile.has(slug)) continue
    checked++
    const html = readFileSync(path.join(BUILT, file), "utf8")
    const blocks = [...html.matchAll(/type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => {
      try {
        return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&"))
      } catch {
        err(slug, "a JSON-LD block does not parse")
        return null
      }
    })
    const byType = (t) => blocks.find((b) => b && b["@type"] === t)

    for (const t of ["BlogPosting", "BreadcrumbList", "FAQPage"]) if (!byType(t)) err(slug, `built page is missing ${t} JSON-LD`)

    const faq = byType("FAQPage")
    if (faq) {
      const n = faq.mainEntity?.length ?? 0
      if (n < FAQ_MIN) err(slug, `built FAQPage has ${n} entries, want >= ${FAQ_MIN}`)
      // every hand-written FAQ question must be present in the emitted schema
      const src = readFileSync(path.join(BLOG, slugToFile.get(slug)), "utf8")
      const want = pairs(bodyOf(src), "h3").filter((p) => p.q.endsWith("?") && p.a.length >= 40)
      const got = new Set((faq.mainEntity || []).map((q) => q.name))
      for (const p of want) if (!got.has(p.q)) err(slug, `FAQ question "${p.q}" is in the source but NOT in the built FAQPage schema`)
      for (const q of faq.mainEntity || []) {
        if (!q.name?.endsWith("?")) err(slug, `built FAQPage entry is not a question: "${q.name}"`)
        if ((q.acceptedAnswer?.text || "").length < 40) err(slug, `built FAQPage answer for "${q.name}" is under 40 chars`)
      }
    }

    const bp = byType("BlogPosting")
    if (bp) {
      if (!bp.headline) err(slug, "BlogPosting has no headline")
      if (!bp.datePublished) err(slug, "BlogPosting has no datePublished")
      if (bp.dateModified && bp.datePublished && bp.dateModified < bp.datePublished)
        err(slug, `dateModified ${bp.dateModified} is before datePublished ${bp.datePublished}`)
      if (bp.url !== `https://alphaa.app/blog/${slug}`) err(slug, `BlogPosting.url is ${bp.url}`)
    }

    // rendering correctness that only shows up in the HTML
    const tables = (html.match(/<table[\s>]/g) || []).length
    const wraps = (html.match(/class="table-wrap"/g) || []).length
    if (tables > wraps) err(slug, `${tables} rendered <table> but ${wraps} .table-wrap wrapper`)
    if (!/rel="canonical"[^>]*\/blog\/|<link rel="canonical"/.test(html)) warn(slug, "no canonical link in built head")
  }
  return checked
}

// ── run ──────────────────────────────────────────────────────────────────────
// --baseline rewrites scripts/content-baseline.json from the posts that
// currently fail format-completeness rules. Run it once at adoption, then only
// to retire entries as the backlog is cleaned up. Never run it to silence a
// freshly written post.
if (args.includes("--baseline")) {
  BASELINE.clear()
  lintSources()
  // Only format-completeness failures are grandfathered. Correctness failures
  // are real bugs and must be fixed, so they never enter the baseline.
  const failing = [...new Set(problems.filter((p) => p.sev === "ERROR" && p.cat === "format").map((p) => p.slug))].sort()
  const body = {
    note: "Posts predating the AI-citation format rework. Format-completeness rules are warnings for these; correctness rules still apply. New posts must not be added here.",
    generated: new Date().toISOString().slice(0, 10),
    grandfathered: failing,
  }
  writeFileSync(BASELINE_FILE, JSON.stringify(body, null, 2) + "\n")
  console.log(`wrote ${path.relative(ROOT, BASELINE_FILE)} with ${failing.length} grandfathered post(s)`)
  process.exit(0)
}

const checked = BUILT_MODE ? lintBuilt() : lintSources()
const errors = problems.filter((p) => p.sev === "ERROR")
const warns = problems.filter((p) => p.sev === "WARN")

const grouped = new Map()
for (const p of problems) {
  if (!grouped.has(p.slug)) grouped.set(p.slug, [])
  grouped.get(p.slug).push(p)
}
for (const [slug, list] of [...grouped].sort()) {
  console.log(`\n${slug}`)
  for (const p of list) console.log(`  ${p.sev === "ERROR" ? "x" : "!"} ${p.msg}`)
}

const label = BUILT_MODE ? "built pages" : "posts"
console.log(`\n${checked} ${label} checked — ${errors.length} error(s), ${warns.length} warning(s)`)
if (errors.length) {
  console.log("Errors block publishing. Fix them, then re-run.")
  process.exit(1)
}
