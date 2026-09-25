import { connectionKey, indexNowKey, sign } from "./keys"
import type { AgentSettings } from "@/lib/agent/settings"

export type WpOp = "page" | "schema" | "llms" | "robots"
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
