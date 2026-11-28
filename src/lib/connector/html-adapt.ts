// mdToHtml (lib/markdown.ts) writes one standard HTML article. Each platform stores rich text
// differently, so before publishing we adjust only what that platform can't keep:
//   wordpress  as is (wp_kses_post keeps tables, blockquotes, code, images, links)
//   shopify    as is (article body_html is plain HTML)
//   webflow    Rich Text has no tables and drops code: tables become a list (one row = one item,
//              "Header: value"), <code> becomes plain text, images become Webflow's image
//              figure, a blockquote keeps its words in one block (paragraphs joined by <br>)
//   wix        tables become a list and <code> plain text; blockquotes and images are real
//              Ricos BLOCKQUOTE / IMAGE nodes (lib/connector/wix.ts htmlToRicos)
// Nothing is dropped: every word of a table or a code span reaches every platform.
import type { Platform } from "@/lib/connector/types"

const strip = (s: string) => s.replace(/<[^>]+>/g, "").trim()

/** <table> → <ul>: each body row is one item "<b>first cell</b>: Header 2: cell 2; Header 3: cell 3". */
export function tablesToLists(html: string): string {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (_, inner: string) => {
    const rows = [...inner.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd]>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].trim()))
    if (!rows.length) return ""
    const [head, ...body] = /<thead>/.test(inner) ? rows : [[], ...rows]
    if (!body.length) return `<p>${head.filter((c) => strip(c)).join("; ")}</p>`
    const items = body.map((r) => {
      const first = r[0] ?? ""
      const rest = r.slice(1).map((c, i) => (strip(c) ? (head[i + 1] && strip(head[i + 1]) ? `${head[i + 1]}: ${c}` : c) : "")).filter(Boolean)
      const lead = strip(first) ? `<strong>${first}</strong>` : ""
      return `<li>${[lead, rest.join("; ")].filter(Boolean).join(": ")}</li>`
    })
    return `<ul>${items.join("")}</ul>`
  })
}

const codeToText = (html: string) => html.replace(/<\/?code>/g, "")

/** Webflow Rich Text: its own image figure, one-block quotes, no tables, no code. */
function forWebflow(html: string): string {
  let out = codeToText(tablesToLists(html))
  out = out.replace(/<figure>\s*(<img [^>]*>)\s*<\/figure>/g, (_, img: string) => `<figure class="w-richtext-align-fullwidth w-richtext-figure-type-image"><div>${img.replace(/\s+loading="lazy"/, "")}</div></figure>`)
  out = out.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (_, inner: string) => {
    const paras = [...inner.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1].trim()).filter(Boolean)
    return `<blockquote>${(paras.length ? paras : [inner]).join("<br>")}</blockquote>`
  })
  return out
}

export function htmlForPlatform(html: string, platform: Platform): string {
  if (platform === "webflow") return forWebflow(html)
  if (platform === "wix") return codeToText(tablesToLists(html))
  return html
}
