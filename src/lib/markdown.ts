// Client-safe Markdown helpers for agent-written pages and posts.
//
// mdToHtml is deliberately small and safe: every character of the source is HTML-escaped first,
// and only these constructs become tags:
//   ## / ### / #### headings, paragraphs, - or * bullets, 1. ordered lists, | pipe | tables |,
//   > blockquotes (and "> [!NOTE]" / "> **Note:**" callouts), **bold**, *italic* / _italic_,
//   `inline code`, [links](https://…) and ![images](https://… "alt text").
// Links and images only accept https:// (or a /root-relative path on the same site). Anything
// else stays as plain text. External links get target="_blank" rel="noopener".
// The same HTML goes to WordPress, Webflow, Shopify and Wix (lib/connector/html-adapt.ts adjusts
// it per platform), and to the in-app preview.

export type MdOptions = {
  /** In the approval view, make facts only the owner knows impossible to miss. */
  highlightPlaceholders?: boolean
  /** The owner's site (with or without protocol): links to it are internal (no new tab). */
  siteUrl?: string | null
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const CALLOUTS: Record<string, string> = { NOTE: "Note", TIP: "Tip", IMPORTANT: "Important", WARNING: "Warning", CAUTION: "Caution" }

const hostOf = (u: string | null | undefined): string | null => {
  if (!u) return null
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

/** A URL we'll put in an href/src: https only (or a root-relative path). Null = render as text. */
export function safeUrl(raw: string): string | null {
  const u = raw.trim()
  if (!u || /[\s<>"'`\\]/.test(u)) return null
  if (/^\/(?!\/)/.test(u)) return u // /path on the same site
  if (!/^https:\/\//i.test(u)) return null
  try {
    const p = new URL(u)
    return p.protocol === "https:" && p.hostname.includes(".") ? u : null
  } catch {
    return null
  }
}

/**
 * Inline Markdown → HTML. Order matters: code spans first (their contents are literal), then
 * images and links (their text is processed recursively without links), then bold and italic.
 * Pieces already turned into HTML are parked as \u0000N\u0000 tokens so later rules can't touch them.
 */
function inlineHtml(src: string, opts: MdOptions, siteHost: string | null, allowLinks = true): string {
  const parked: string[] = []
  const park = (html: string) => `\u0000${parked.push(html) - 1}\u0000`
  let s = src.replace(/\u0000/g, "")

  s = s.replace(/`([^`\n]+)`/g, (_, code: string) => park(`<code>${esc(code)}</code>`))
  // ![alt](url "title")
  s = s.replace(/!\[([^\]\n]*)\]\(\s*([^)\s]+)(?:\s+"([^"\n]*)")?\s*\)/g, (m, alt: string, url: string, title?: string) => {
    const href = safeUrl(url)
    if (!href) return park(esc(alt || ""))
    return park(`<img src="${esc(href)}" alt="${esc(alt.trim())}"${title ? ` title="${esc(title)}"` : ""} loading="lazy">`)
  })
  if (allowLinks) {
    // [text](url "title")
    s = s.replace(/\[([^\]\n]+)\]\(\s*([^)\s]+)(?:\s+"([^"\n]*)")?\s*\)/g, (m, text: string, url: string, title?: string) => {
      const href = safeUrl(url)
      const inner = inlineHtml(text, { ...opts, highlightPlaceholders: false }, siteHost, false)
      if (!href) return park(inner)
      const h = href.startsWith("/") ? siteHost : hostOf(href)
      const external = !!h && h !== siteHost
      return park(`<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' target="_blank" rel="noopener"' : ""}>${inner}</a>`)
    })
  }
  s = esc(s)
  s = s.replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, "<strong>$1</strong>").replace(/__(?=\S)(.+?)(?<=\S)__/g, "<strong>$1</strong>")
  s = s.replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*)/g, "$1<em>$2</em>").replace(/(^|[^_\w])_(?=[^\s_])([^_\n]+?)(?<=[^\s_])_(?![_\w])/g, "$1<em>$2</em>")
  if (opts.highlightPlaceholders) s = s.replace(/\[([^\]\n]{2,})\]/g, '<mark class="ag-ph">[$1]</mark>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => parked[Number(i)] ?? "")
}

/** Cells of a pipe-table row: "| a | b |" → ["a", "b"]. Escaped pipes (\|) stay in the cell. */
function cells(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "")
  return t.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"))
}
const isTableSep = (line: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim()) && line.includes("-")
const isTableRow = (line: string) => /^\|.*\|$/.test(line.trim()) || (line.includes("|") && cells(line).length > 1)

/** Small, safe Markdown → HTML for agent-written pages and posts (see the header comment). */
export function mdToHtml(md: string, opts: MdOptions = {}): string {
  const siteHost = hostOf(opts.siteUrl)
  const inline = (s: string) => inlineHtml(s, opts, siteHost)
  const lines = md.replace(/\r\n?/g, "\n").split("\n")
  const out: string[] = []
  let list: { tag: "ul" | "ol"; start: number; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const start = list.tag === "ol" && list.start !== 1 ? ` start="${list.start}"` : ""
    out.push(`<${list.tag}${start}>${list.items.map((l) => `<li>${inline(l)}</li>`).join("")}</${list.tag}>`)
    list = null
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line)) { flush(); continue }

    const h = line.match(/^(#{2,4})\s+(.+?)\s*#*$/)
    if (h) { flush(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue }

    // Pipe table: a header row, then a |---|---| separator, then body rows.
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flush()
      const head = cells(line)
      const body: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim() && isTableRow(lines[i])) { body.push(cells(lines[i])); i++ }
      i--
      const width = head.length
      const row = (r: string[], tag: "th" | "td") => `<tr>${Array.from({ length: width }, (_, k) => `<${tag}>${inline(r[k] ?? "")}</${tag}>`).join("")}</tr>`
      out.push(`<table><thead>${row(head, "th")}</thead><tbody>${body.map((r) => row(r, "td")).join("")}</tbody></table>`)
      continue
    }

    // Blockquote (consecutive "> " lines); "> [!NOTE]" or a leading "**Note:**" makes it a callout.
    if (/^>/.test(line)) {
      flush()
      const q: string[] = []
      while (i < lines.length && /^\s*>/.test(lines[i])) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++ }
      i--
      let kind: string | null = null
      const marker = q[0]?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i)
      if (marker) { kind = marker[1].toUpperCase(); q[0] = marker[2] }
      else {
        const bold = q[0]?.match(/^\*\*(Note|Tip|Important|Warning|Caution):?\*\*:?\s*/i)
        if (bold) kind = bold[1].toUpperCase()
      }
      const paras = q.join("\n").split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean)
      const label = marker && kind ? `<p><strong>${CALLOUTS[kind]}</strong></p>` : ""
      out.push(`<blockquote${kind ? ` class="callout callout-${kind.toLowerCase()}"` : ""}>${label}${paras.map((p) => `<p>${inline(p)}</p>`).join("")}</blockquote>`)
      continue
    }

    const ul = line.match(/^[-*+]\s+(.+)$/)
    if (ul) {
      if (list?.tag !== "ul") { flush(); list = { tag: "ul", start: 1, items: [] } }
      list!.items.push(ul[1])
      continue
    }
    const ol = line.match(/^(\d{1,3})[.)]\s+(.+)$/)
    if (ol) {
      if (list?.tag !== "ol") { flush(); list = { tag: "ol", start: Number(ol[1]) || 1, items: [] } }
      list!.items.push(ol[2])
      continue
    }
    flush()
    // A line that is only an image becomes a figure (with its alt text as the caption source).
    const img = line.match(/^!\[([^\]\n]*)\]\(\s*([^)\s]+)(?:\s+"([^"\n]*)")?\s*\)$/)
    if (img && safeUrl(img[2])) { out.push(`<figure>${inline(line)}</figure>`); continue }
    out.push(`<p>${inline(line.replace(/^#\s+/, ""))}</p>`)
  }
  flush()
  return out.join("\n")
}

/** FAQ pairs from "### question" + following paragraph, for FAQPage JSON-LD (plain text, no Markdown). */
export function mdFaq(md: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = []
  const parts = md.split(/^###\s+/m).slice(1)
  for (const p of parts) {
    const [q, ...rest] = p.split("\n")
    const a = mdPlain(rest.join(" ").split(/^##/m)[0]).replace(/\s+/g, " ").trim()
    if (q.trim() && a) out.push({ q: mdPlain(q).trim(), a: a.slice(0, 600) })
  }
  return out
}

/** Markdown → plain text (links keep their words, images their alt text). */
export function mdPlain(md: string): string {
  return md
    .replace(/!\[([^\]\n]*)\]\([^)\n]*\)/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, "$1$2")
    .replace(/(^|[^\w*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/^\s*>\s?(\[![A-Z]+\]\s*)?/gm, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*\|?\s*:?-{2,}[-|:\s]*$/gm, "")
    .replace(/\s*\|\s*/g, " ")
}

/** Every [text](url) link in a Markdown text. */
export function mdLinks(md: string): { text: string; url: string }[] {
  return [...md.matchAll(/(?<!!)\[([^\]\n]+)\]\(\s*([^)\s]+)(?:\s+"[^"\n]*")?\s*\)/g)].map((m) => ({ text: m[1], url: m[2] }))
}
