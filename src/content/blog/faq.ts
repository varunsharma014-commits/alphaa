// Build-time FAQ extraction for blog posts (server only).
// Every post follows the answer-first pattern: a question-phrased <h2>, then a
// paragraph whose first sentence answers it. We read the post source, pair
// each question heading with the text of the paragraph after it, and emit
// FAQPage structured data — no per-post bookkeeping to keep in sync.
import { readdirSync, readFileSync } from "fs"
import path from "path"

const DIR = path.join(process.cwd(), "src/content/blog")

let bySlug: Map<string, string> | null = null
function fileFor(slug: string): string | null {
  if (!bySlug) {
    bySlug = new Map()
    for (const f of readdirSync(DIR)) {
      if (!f.endsWith(".tsx")) continue
      const src = readFileSync(path.join(DIR, f), "utf8")
      const m = src.match(/slug:\s*"([^"]+)"/)
      if (m) bySlug.set(m[1], src)
    }
  }
  return bySlug.get(slug) ?? null
}

function toText(jsx: string): string {
  return jsx
    .replace(/\{\s*["']\s*["']\s*\}/g, " ") // {" "}
    .replace(/\{[^{}]*\}/g, "") // other JSX expressions
    .replace(/<[^>]+>/g, "") // tags
    .replace(/&apos;/g, "’").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function extractFaq(slug: string, max = 8): { q: string; a: string }[] {
  try {
    const src = fileFor(slug)
    if (!src) return []
    const out: { q: string; a: string }[] = []
    const re = /<h2[^>]*>([\s\S]*?)<\/h2>\s*(?:<p[^>]*>([\s\S]*?)<\/p>)?/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src)) && out.length < max) {
      const q = toText(m[1])
      const a = m[2] ? toText(m[2]) : ""
      if (q.endsWith("?") && a.length >= 40) out.push({ q, a })
    }
    return out
  } catch {
    return []
  }
}
