// Checks on a written blog post before it is saved (lib/content.ts writePost), like the email
// writer's (lib/email-campaigns/write.ts): every number must come from the facts or the brief,
// and links may only point at the owner's own site (or the brief's link targets). Pure.

const normNum = (n: string) => {
  const v = n.replace(/,(?=\d{3}\b)/g, "")
  return v.includes(".") ? String(Number(v)) : v.replace(/^0+(?=\d)/, "")
}

/** Every number in these texts (1,200 → 1200; 4.80 → 4.8), plus this year and next. */
export function allowedNumbers(texts: (string | null | undefined)[], now = new Date()): Set<string> {
  const out = new Set<string>(["24/7"])
  for (const t of texts) for (const m of (t ?? "").matchAll(/\d[\d,]*(?:\.\d+)?/g)) out.add(normNum(m[0]))
  const y = now.getUTCFullYear()
  out.add(String(y))
  out.add(String(y + 1))
  return out
}

// A small count next to one of these words is a claim ("25 years", "2 hours"); next to anything
// else it describes the article ("3 ways", "5 questions") and is fine.
const CLAIM_UNITS = /^(years?|yrs?|months?|weeks?|days?|hours?|hrs?|minutes?|mins?|seconds?|customers?|clients?|patients?|reviews?|stars?|projects?|jobs?|locations?|offices?|employees?|staff|people|members?|technicians?|experts?|times|x|miles?|km|kilometers?|kilometres?|sq|square|ft|feet|meters?|metres?|homes?|families|businesses|companies|cities|states|countries|awards?|percent|per)$/i

/**
 * Numbers in the post that the facts don't back, as they read ("25 years", "$99", "30%").
 * Not checked: numbers inside link/image URLs, ordered-list markers, "24/7", and small counts
 * (1-12) that describe the article itself ("3 things to check").
 */
export function numberProblems(markdown: string, allowed: Set<string>): string[] {
  const text = markdown
    .replace(/!\[([^\]\n]*)\]\([^)\n]*\)/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^\s*\d{1,3}[.)]\s+/gm, "")
    .replace(/\b24\/7\b/g, " ")
  const bad: string[] = []
  const re = /(?<![\w.,/-])([$€£]\s?)?(\d[\d,]*(?:\.\d+)?)(?:\s?(%|percent\b|[kK]\b))?(?:(?:st|nd|rd|th)\b)?(?:[\s-]+([A-Za-z]+))?/g
  for (const m of text.matchAll(re)) {
    const [, cur, num, pct, word] = m
    const v = normNum(num)
    if (allowed.has(v)) continue
    const n = Number(v)
    const isClaim = !!cur || !!pct || (word ? CLAIM_UNITS.test(word) : false)
    if (!isClaim && Number.isInteger(n) && n >= 1 && n <= 12) continue
    bad.push(`${cur ? cur.trim() : ""}${num}${pct ? (pct.toLowerCase() === "percent" ? " percent" : pct) : ""}${!cur && !pct && word && CLAIM_UNITS.test(word) ? ` ${word}` : ""}`)
  }
  return [...new Set(bad)]
}

const hostOf = (u: string): string | null => {
  try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase() } catch { return null }
}

/**
 * Keep only links to the owner's own site (https, or /paths made absolute) and the brief's link
 * targets; any other link keeps its words as plain text. Images not on the owner's site go.
 */
export function cleanLinks(markdown: string, o: { siteHost: string | null; allowed?: string[] }): string {
  const site = o.siteHost?.replace(/^www\./, "").toLowerCase() ?? null
  const ok = new Set((o.allowed ?? []).map((u) => u.replace(/\/+$/, "")))
  const fix = (url: string): string | null => {
    const u = url.trim()
    if (/^\/(?!\/)/.test(u)) return site ? `https://${site}${u}` : null
    if (!/^https:\/\//i.test(u)) return null
    if (ok.has(u.replace(/\/+$/, ""))) return u
    return site && hostOf(u) === site ? u : null
  }
  return markdown
    .replace(/!\[([^\]\n]*)\]\(\s*([^)\s]+)[^)\n]*\)/g, (m, alt: string, url: string) => (fix(url) ? m : ""))
    .replace(/(?<!!)\[([^\]\n]+)\]\(\s*([^)\s]+)(\s+"[^"\n]*")?\s*\)/g, (_, text: string, url: string, title?: string) => {
      const u = fix(url)
      return u ? `[${text}](${u}${title ?? ""})` : text
    })
}

/** Sentences (or list items) holding one of these number tokens, removed. Headings stay. */
export function dropSentencesWith(markdown: string, tokens: string[]): string {
  if (!tokens.length) return markdown
  const has = (s: string) => tokens.some((t) => s.includes(t.split(" ")[0]))
  const out: string[] = []
  for (const line of markdown.split("\n")) {
    if (!has(line) || /^\s*#{1,6}\s/.test(line)) { out.push(line); continue }
    if (/^\s*([-*+]|\d+[.)])\s/.test(line)) continue
    const kept = line.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter((s) => !has(s)).join(" ").trim()
    if (kept) out.push(kept)
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** The same numbers turned into [check: …] placeholders, so publishing waits for the owner. */
export function flagNumbers(markdown: string, tokens: string[]): string {
  let out = markdown
  for (const t of tokens) out = out.split(t).join(`[check: ${t}]`)
  return out
}
