// Drafts never invent facts: anything only the owner knows is a [bracketed placeholder], and
// publishing refuses while one is left (lib/connector/push.ts). "Publish without them" uses this
// to drop just the sentences that need those facts, so a post can go live in one tap.

export const hasPlaceholders = (t: string) => /\[[^\]]{2,}\]/.test(t)

const SENTENCE = /(?<=[.!?…])\s+(?=[A-Z0-9"“(])/

/** The draft with every sentence / list item that holds a [placeholder] removed. Markdown stays intact. */
export function withoutPlaceholders(markdown: string): string {
  const out: string[] = []
  for (const line of markdown.split("\n")) {
    if (!hasPlaceholders(line)) { out.push(line); continue }
    if (/^\s*#{1,6}\s/.test(line)) {
      // A heading keeps its question; just lose the placeholder words.
      const h = line.replace(/\s*\[[^\]]{2,}\]\s*/g, " ").replace(/\s+([?.,!])/g, "$1").replace(/\s{2,}/g, " ").trimEnd()
      if (h.replace(/^\s*#+\s*/, "").trim()) out.push(h)
      continue
    }
    const m = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+|\s*>\s*|\s*A:\s*|\s*)(.*)$/)
    const lead = m?.[1] ?? ""
    const body = m?.[2] ?? line
    if (/^\s*([-*+]|\d+[.)])\s/.test(lead)) continue // a list item that needs the fact goes entirely
    const kept = body.split(SENTENCE).filter((s) => !hasPlaceholders(s)).join(" ").trim()
    if (kept) out.push(lead + kept)
  }
  // Drop headings left with nothing under them (e.g. an FAQ answer that was all placeholder).
  const lines = out
  const res: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const isHeading = /^\s*(#{1,6}\s|Q:)/.test(lines[i])
    if (isHeading) {
      let j = i + 1
      while (j < lines.length && !lines[j].trim()) j++
      const next = lines[j]
      const level = (lines[i].match(/^\s*(#+)/)?.[1].length ?? 9)
      const nextLevel = next?.match(/^\s*(#+)\s/)?.[1].length
      if (next === undefined || /^\s*Q:/.test(next) || (nextLevel !== undefined && nextLevel <= level)) continue
    }
    res.push(lines[i])
  }
  return res.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
