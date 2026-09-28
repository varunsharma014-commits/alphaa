import { connectionKey, indexNowKey, sign } from "./keys"
import type { AgentSettings } from "@/lib/agent/settings"

export type WpOp = "page" | "schema" | "llms" | "robots" | "post" | "meta" | "sitemap" | "headers"
export type WpStatus = {
  ok: boolean
  version: string
  schema: boolean
  llms: boolean
  robots: boolean
  physicalRobots: boolean
  physicalLlms: boolean
  indexnow: string
}

export async function wpCall<T>(userId: string, wp: NonNullable<AgentSettings["wp"]>, route: string, body: unknown = {}): Promise<T> {
  const key = connectionKey(userId)
  const ts = String(Math.floor(Date.now() / 1000))
  const raw = JSON.stringify(body)
  const base = wp.restUrl.endsWith("/") ? wp.restUrl : `${wp.restUrl}/`
  const res = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Alphaa-Timestamp": ts, "X-Alphaa-Signature": sign(key, ts, raw) },
    body: raw,
    signal: AbortSignal.timeout(20_000),
  })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string }
  if (!res.ok) throw new Error(data?.message || `WordPress answered ${res.status}`)
  return data
}

/** Tell Bing (and every IndexNow engine) a URL changed. Bing's index feeds ChatGPT search. */
export async function pingIndexNow(userId: string, siteUrl: string, urls: string[]): Promise<boolean> {
  try {
    const host = new URL(siteUrl).host
    const key = indexNowKey(userId)
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(10_000),
    })
    return res.status === 200 || res.status === 202
  } catch {
    return false
  }
}

/** Turns the agent's "Q: … / A: …" draft into page HTML plus FAQPage JSON-LD. */
export function faqToHtml(text: string): { html: string; faq: { q: string; a: string }[] } {
  const faq: { q: string; a: string }[] = []
  let cur: { q: string; a: string } | null = null
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (/^Q:/i.test(line)) {
      if (cur) faq.push(cur)
      cur = { q: line.replace(/^Q:\s*/i, ""), a: "" }
    } else if (cur) cur.a += (cur.a ? " " : "") + line.replace(/^A:\s*/i, "")
  }
  if (cur) faq.push(cur)
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const html = faq.map((f) => `<h2>${esc(f.q)}</h2>\n<p>${esc(f.a)}</p>`).join("\n")
  return { html, faq }
}

/** Small, safe Markdown → HTML for agent-written pages: ##/### headings, paragraphs, - lists, **bold**. */
export function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  const out: string[] = []
  let list: string[] = []
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = [] } }
  for (const raw of md.split("\n")) {
    const line = raw.trim()
    if (!line) { flush(); continue }
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
