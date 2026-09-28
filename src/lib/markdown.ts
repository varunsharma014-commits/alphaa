// Client-safe Markdown helpers for agent-written pages and posts.

/** Small, safe Markdown → HTML for agent-written pages: ##/### headings, paragraphs, - lists, **bold**. */
export function mdToHtml(md: string, opts: { highlightPlaceholders?: boolean } = {}): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const inline = (s: string) => {
    const out = esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // In the approval view, make facts only the owner knows impossible to miss.
    return opts.highlightPlaceholders ? out.replace(/\[([^\]]{2,})\]/g, '<mark class="ag-ph">[$1]</mark>') : out
  }
  const out: string[] = []
  let list: string[] = []
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = [] } }
  for (const raw of md.split("\n")) {
    const line = raw.trim()
    if (!line || /^-{3,}$/.test(line)) { flush(); continue }
    const h = line.match(/^(#{2,4})\s+(.+)$/)
    if (h) { flush(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue }
    const li = line.match(/^[-*]\s+(.+)$/)
    if (li) { list.push(li[1]); continue }
    flush()
    out.push(`<p>${inline(line.replace(/^#\s+/, ""))}</p>`)
  }
  flush()
  return out.join("\n")
}

/** FAQ pairs from "### question" + following paragraph, for FAQPage JSON-LD. */
export function mdFaq(md: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = []
  const parts = md.split(/^###\s+/m).slice(1)
  for (const p of parts) {
    const [q, ...rest] = p.split("\n")
    const a = rest.join(" ").split(/^##/m)[0].replace(/\s+/g, " ").trim()
    if (q.trim() && a) out.push({ q: q.trim(), a: a.slice(0, 600) })
  }
  return out
}
