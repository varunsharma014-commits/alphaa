// Link checks for the site crawl (lib/crawler.ts): broken internal links, broken outbound
// links and redirect chains, with the pages that link to them. Polite by design: one request
// at a time per host with a short gap, HEAD first (GET only when a server refuses HEAD), a
// timeout per hop and an overall deadline. Every hop goes through safeFetch (no private hosts).
import { safeFetch } from "@/lib/safe-fetch"

export type LinkState = "ok" | "broken" | "unreachable" | "blocked"
export type LinkCheck = {
  url: string
  status: number | null
  state: LinkState
  /** Each redirect followed, in order (the URL it pointed to). Empty = no redirect. */
  hops: string[]
  finalUrl: string
  error?: string
}

const UA = "AlphaaBot/1.0 (SEO audit; link check; +https://alphaa.app)"
const MAX_HOPS = 6

/** What a status / network error means for a link. Bot walls (401/403/429/999) are not "broken". */
export function classify(status: number | null, error?: string): LinkState {
  if (status === null) {
    // DNS failure / refused connection = the address is dead; a timeout may just be slow.
    if (error && /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|getaddrinfo|can't be reached|certificate|CERT_/i.test(error)) return "broken"
    return "unreachable"
  }
  if (status >= 200 && status < 400) return "ok"
  if (status === 401 || status === 403 || status === 429 || status === 999) return "blocked"
  if (status >= 500) return "unreachable"
  return "broken" // 400, 404, 410 and the rest of 4xx
}

/** Plain words for the owner: "is missing (404)", "doesn’t answer (timed out)". */
export function stateText(c: Pick<LinkCheck, "status" | "state" | "error">): string {
  if (c.status === 404 || c.status === 410) return `is missing (${c.status})`
  if (c.status && c.status >= 500) return `shows a server error (${c.status})`
  if (c.status && c.status >= 400) return `returns an error (${c.status})`
  if (c.state === "broken") return "doesn’t exist any more (the address can’t be found)"
  if (c.state === "unreachable") return "doesn’t answer (it timed out)"
  return "works"
}

async function once(url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<{ status: number; location: string | null }> {
  const res = await safeFetch(url, {
    method,
    redirect: "manual",
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    signal: AbortSignal.timeout(timeoutMs),
  })
  await res.body?.cancel().catch(() => {})
  return { status: res.status, location: res.headers.get("location") }
}

/** Follow one link hop by hop (so redirect chains are visible) and classify where it ends. */
export async function checkLink(url: string, opts: { timeoutMs?: number } = {}): Promise<LinkCheck> {
  const timeoutMs = opts.timeoutMs ?? 6000
  const hops: string[] = []
  let cur = url
  for (let i = 0; i <= MAX_HOPS; i++) {
    let r: { status: number; location: string | null }
    try {
      r = await once(cur, "HEAD", timeoutMs)
      // Plenty of servers refuse or mishandle HEAD: ask again with GET before judging.
      if (r.status === 405 || r.status === 501 || r.status === 403 || r.status === 404 || r.status >= 500) r = await once(cur, "GET", timeoutMs)
    } catch (e) {
      const error = e instanceof Error ? `${e.name}: ${e.message}${(e as { cause?: { code?: string } }).cause?.code ? ` ${(e as { cause?: { code?: string } }).cause!.code}` : ""}` : String(e)
      return { url, status: null, state: classify(null, error), hops, finalUrl: cur, error }
    }
    if (r.status >= 300 && r.status < 400 && r.location) {
      let next: string
      try {
        next = new URL(r.location, cur).toString()
      } catch {
        return { url, status: r.status, state: "broken", hops, finalUrl: cur, error: "bad redirect" }
      }
      hops.push(next)
      cur = next
      continue
    }
    return { url, status: r.status, state: classify(r.status), hops, finalUrl: cur }
  }
  return { url, status: null, state: "broken", hops, finalUrl: cur, error: "Too many redirects" }
}

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase()
  } catch {
    return ""
  }
}

/**
 * Check many links politely: hosts in parallel (up to `concurrency`), one request at a time per
 * host with `gapMs` between them, at most `perHost` links per host, nothing started after `deadline`.
 */
export async function checkLinks(
  urls: string[],
  opts: { concurrency?: number; gapMs?: number; perHost?: number; deadline?: number; timeoutMs?: number } = {},
): Promise<Map<string, LinkCheck>> {
  const { concurrency = 4, gapMs = 250, perHost = 6, deadline = Date.now() + 20_000, timeoutMs = 6000 } = opts
  const byHost = new Map<string, string[]>()
  for (const u of new Set(urls)) {
    const h = hostOf(u)
    if (!h) continue
    const list = byHost.get(h) ?? []
    if (list.length < perHost) list.push(u)
    byHost.set(h, list)
  }
  const queues = [...byHost.values()]
  const out = new Map<string, LinkCheck>()
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  async function worker() {
    for (;;) {
      const q = queues.shift()
      if (!q) return
      for (let i = 0; i < q.length; i++) {
        if (Date.now() > deadline) return
        out.set(q[i], await checkLink(q[i], { timeoutMs: Math.min(timeoutMs, Math.max(1000, deadline - Date.now())) }))
        if (i < q.length - 1) await sleep(gapMs)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queues.length) }, worker))
  return out
}
