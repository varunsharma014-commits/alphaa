// Website security basics, in plain English for a non-technical owner — 8
// read-only checks, no LLM. Every check is best-effort: a network failure or
// timeout yields ok=null ("Couldn’t check"), never a fabricated fail. The
// "exposed files" probe never stores or returns what it reads.

// Server-only (node:tls).
import tls from "node:tls"

export type SecurityKey = "https" | "sslExpiry" | "hsts" | "headers" | "mixed" | "safeBrowsing" | "cms" | "exposed"
export type SecurityItem = { key: SecurityKey; label: string; ok: boolean | null; detail: string; severity: "high" | "medium" | "low" }
export type SecurityCheck = { domain: string; checkedAt: string; items: SecurityItem[]; passed: number; total: number }

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
const OVERALL_MS = 25_000
const COULDNT = "Couldn’t check"

const META: Record<SecurityKey, { label: string; severity: SecurityItem["severity"] }> = {
  https: { label: "Secure connection (HTTPS)", severity: "high" },
  sslExpiry: { label: "Security certificate", severity: "high" },
  hsts: { label: "Browsers told to always use HTTPS", severity: "medium" },
  headers: { label: "Basic security headers", severity: "low" },
  mixed: { label: "No insecure page elements", severity: "medium" },
  safeBrowsing: { label: "Not flagged by Google Safe Browsing", severity: "high" },
  cms: { label: "WordPress is up to date", severity: "medium" },
  exposed: { label: "No private files exposed", severity: "high" },
}
const ORDER: SecurityKey[] = ["https", "sslExpiry", "hsts", "headers", "mixed", "safeBrowsing", "cms", "exposed"]

type Result = { ok: boolean | null; detail: string }
type Fetched = { ok: boolean; status: number; text: string; finalUrl: string; headers: Headers }

async function get(url: string, ms = 8000, redirect: RequestRedirect = "follow", maxBytes = 3_000_000): Promise<Fetched | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA, Accept: "text/html,application/xhtml+xml,*/*" }, redirect, signal: AbortSignal.timeout(ms) })
    const text = res.ok ? (await res.text()).slice(0, maxBytes) : ""
    return { ok: res.ok, status: res.status, text, finalUrl: res.url || url, headers: res.headers }
  } catch {
    return null
  }
}

function hostOf(siteUrl: string): string | null {
  let s = (siteUrl || "").trim()
  if (!s) return null
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`
  try {
    const h = new URL(s).hostname.toLowerCase()
    return h && h.includes(".") ? h : null
  } catch {
    return null
  }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// ---- 1. HTTPS ---------------------------------------------------------------
async function checkHttps(host: string, home: Promise<Fetched | null>): Promise<Result> {
  const [h, plain] = await Promise.all([home, get(`http://${host}/`, 8000)])
  if (!h && !plain) return { ok: null, detail: COULDNT }
  if (!h || !h.finalUrl.startsWith("https://")) return { ok: false, detail: "Your site doesn’t load securely — visitors see a “Not secure” warning." }
  if (!plain) return { ok: true, detail: "Your site loads securely." }
  if (!plain.finalUrl.startsWith("https://")) return { ok: false, detail: "Your site loads securely, but the plain http:// address doesn’t forward visitors to the secure version." }
  return { ok: true, detail: "Your site loads securely, and the old http:// address forwards to it." }
}

// ---- 2. Certificate expiry ---------------------------------------------------
function peerCert(host: string, ms = 7000): Promise<{ validTo: Date; authorized: boolean; err: string | null } | null> {
  return new Promise((resolve) => {
    let done = false
    const finish = (v: { validTo: Date; authorized: boolean; err: string | null } | null) => {
      if (done) return
      done = true
      try { sock.destroy() } catch { /* ignore */ }
      resolve(v)
    }
    const sock = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: ms }, () => {
      const c = sock.getPeerCertificate()
      const validTo = c && c.valid_to ? new Date(c.valid_to) : null
      const err = sock.authorizationError ? String(sock.authorizationError) : null
      finish(validTo && !isNaN(validTo.getTime()) ? { validTo, authorized: sock.authorized, err } : null)
    })
    sock.on("error", () => finish(null))
    sock.on("timeout", () => finish(null))
    setTimeout(() => finish(null), ms + 500)
  })
}

async function checkCert(host: string): Promise<Result> {
  const c = await peerCert(host)
  if (!c) return { ok: null, detail: COULDNT }
  const days = Math.floor((c.validTo.getTime() - Date.now()) / 86_400_000)
  if (days < 0) return { ok: false, detail: "Expired — browsers are showing visitors a security warning." }
  if (!c.authorized && c.err !== "CERT_HAS_EXPIRED") {
    return { ok: false, detail: `Browsers don’t trust your certificate (it may not match your address or be self-issued). Renews in ${plural(days, "day")}.` }
  }
  if (days < 14) return { ok: false, detail: `Expires in ${plural(days, "day")} — renew it now or visitors will see a security warning.` }
  return { ok: true, detail: `Renews in ${plural(days, "day")}.` }
}

// ---- 3. HSTS -----------------------------------------------------------------
async function checkHsts(home: Promise<Fetched | null>): Promise<Result> {
  const h = await home
  if (!h || !h.finalUrl.startsWith("https://")) return { ok: null, detail: COULDNT }
  const v = h.headers.get("strict-transport-security")
  if (!v || !/max-age=\s*"?[1-9]/i.test(v)) return { ok: false, detail: "Browsers aren’t told to always use the secure version of your site." }
  return { ok: true, detail: "Browsers are told to always use the secure version of your site." }
}

// ---- 4. Security headers -----------------------------------------------------
async function checkHeaders(home: Promise<Fetched | null>): Promise<Result> {
  const h = await home
  if (!h) return { ok: null, detail: COULDNT }
  const missing: string[] = []
  if ((h.headers.get("x-content-type-options") || "").toLowerCase().trim() !== "nosniff") missing.push("protection against disguised files")
  const xfo = h.headers.get("x-frame-options")
  const csp = h.headers.get("content-security-policy") || ""
  if (!xfo && !/frame-ancestors/i.test(csp)) missing.push("protection against your site being embedded in someone else’s page (clickjacking)")
  if (missing.length === 0) return { ok: true, detail: "The basic protective settings are in place." }
  return { ok: false, detail: `Missing ${missing.join(" and ")}.` }
}

// ---- 5. Mixed content ----------------------------------------------------------
function countMixed(html: string): number {
  const found = new Set<string>()
  // Resources the page LOADS (not links a visitor clicks).
  for (const m of html.matchAll(/<(script|iframe|img|source|video|audio|embed|track|input)\b[^>]*?\ssrc\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi)) found.add(m[2])
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    if (!/rel\s*=\s*["']?[^"'>]*\b(stylesheet|icon|preload|modulepreload)\b/i.test(tag)) continue
    const href = tag.match(/href\s*=\s*["']?(http:\/\/[^"'\s>]+)/i)
    if (href) found.add(href[1])
  }
  for (const m of html.matchAll(/<object\b[^>]*?\sdata\s*=\s*["']?(http:\/\/[^"'\s>]+)/gi)) found.add(m[1])
  return found.size
}

async function checkMixed(home: Promise<Fetched | null>): Promise<Result> {
  const h = await home
  if (!h || !h.ok || !h.finalUrl.startsWith("https://") || !h.text) return { ok: null, detail: COULDNT }
  const n = countMixed(h.text)
  if (n === 0) return { ok: true, detail: "Everything on your homepage loads securely." }
  return { ok: false, detail: `${plural(n, "item")} on your homepage (images, scripts or styles) ${n === 1 ? "loads" : "load"} insecurely, which can trigger browser warnings.` }
}

// ---- 6. Safe Browsing ----------------------------------------------------------
async function checkSafeBrowsing(host: string, home: Promise<Fetched | null>): Promise<Result> {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY
  if (!key) return { ok: null, detail: "Not set up yet" }
  const h = await home
  const urls = Array.from(new Set([`https://${host}/`, `http://${host}/`, ...(h ? [h.finalUrl] : [])]))
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "alphaa", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: urls.map((url) => ({ url })),
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { ok: null, detail: COULDNT }
    const j = (await res.json()) as { matches?: { threatType?: string }[] }
    const matches = j.matches || []
    if (matches.length === 0) return { ok: true, detail: "Google doesn’t flag your site as dangerous." }
    const types = Array.from(new Set(matches.map((m) => m.threatType || "")))
    const words = types.map((t) => (t === "SOCIAL_ENGINEERING" ? "phishing" : t === "MALWARE" ? "malware" : "unwanted software")).filter((w, i, a) => a.indexOf(w) === i)
    return { ok: false, detail: `Google flags your site for ${words.join(" and ")} — browsers may warn visitors away.` }
  } catch {
    return { ok: null, detail: COULDNT }
  }
}

// ---- 7. WordPress version ------------------------------------------------------
function wpVersion(html: string): { isWp: boolean; version: string | null } {
  const gen =
    html.match(/<meta[^>]+name\s*=\s*["']generator["'][^>]+content\s*=\s*["']WordPress\s*([\d.]+)?/i) ||
    html.match(/<meta[^>]+content\s*=\s*["']WordPress\s*([\d.]+)?["'][^>]+name\s*=\s*["']generator["']/i)
  if (gen) return { isWp: true, version: gen[1] || null }
  const isWp = /\/wp-content\/|\/wp-includes\/|<link[^>]+rel\s*=\s*["']https:\/\/api\.w\.org\/["']|\/wp-json\//i.test(html)
  return { isWp, version: null }
}

const majorMinor = (v: string): [number, number] => {
  const [a, b] = v.split(".")
  return [parseInt(a, 10) || 0, parseInt(b || "0", 10) || 0]
}

async function checkCms(home: Promise<Fetched | null>): Promise<Result> {
  const h = await home
  if (!h || !h.ok || !h.text) return { ok: null, detail: COULDNT }
  const wp = wpVersion(h.text)
  if (!wp.isWp) return { ok: null, detail: "Not WordPress" }
  if (!wp.version) return { ok: true, detail: "Your site runs WordPress and keeps its version hidden." }
  let latest: string | null = null
  try {
    const res = await fetch("https://api.wordpress.org/core/version-check/1.7/", { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const j = (await res.json()) as { offers?: { current?: string }[] }
      latest = j.offers?.[0]?.current || null
    }
  } catch { /* fall through */ }
  if (!latest) return { ok: null, detail: `Your site runs WordPress ${wp.version}; ${COULDNT.toLowerCase()} the latest version.` }
  const [ma, mi] = majorMinor(wp.version)
  const [la, li] = majorMinor(latest)
  if (ma < la || (ma === la && mi < li)) {
    return { ok: false, detail: `Your site runs WordPress ${wp.version}; the latest is ${latest}. Old versions are a common way sites get hacked.` }
  }
  return { ok: true, detail: `Your site runs WordPress ${wp.version} — current.` }
}

// ---- 8. Exposed private files ------------------------------------------------
async function probe(url: string, looksPrivate: (body: string) => boolean): Promise<boolean | null> {
  // No redirects: a site that forwards /.env to its homepage is not exposing it.
  const f = await get(url, 6000, "manual", 4096)
  if (!f) return null
  if (f.status !== 200) return false
  const ct = (f.headers.get("content-type") || "").toLowerCase()
  if (ct.includes("text/html")) return false
  return looksPrivate(f.text) // body is discarded here; never stored or returned
}

async function checkExposed(host: string): Promise<Result> {
  const [git, env] = await Promise.all([
    probe(`https://${host}/.git/HEAD`, (b) => b.trimStart().startsWith("ref:")),
    probe(`https://${host}/.env`, (b) => /^[A-Z_]{3,}=/m.test(b)),
  ])
  const leaked: string[] = []
  if (env) leaked.push(".env")
  if (git) leaked.push(".git")
  if (leaked.length === 1) return { ok: false, detail: `A private file (${leaked[0]}) is publicly readable — it can contain passwords or code. Have your web person remove it now.` }
  if (leaked.length > 1) return { ok: false, detail: `Private files (${leaked.join(", ")}) are publicly readable — they can contain passwords or code. Have your web person remove them now.` }
  if (git === null && env === null) return { ok: null, detail: COULDNT }
  return { ok: true, detail: "None of the common private files are publicly readable." }
}

// ---- Orchestration -------------------------------------------------------------
export async function checkSecurity(siteUrl: string): Promise<SecurityCheck | null> {
  const host = hostOf(siteUrl)
  if (!host) return null
  try {
    const home = get(`https://${host}/`, 10_000)
    const runners: Record<SecurityKey, () => Promise<Result>> = {
      https: () => checkHttps(host, home),
      sslExpiry: () => checkCert(host),
      hsts: () => checkHsts(home),
      headers: () => checkHeaders(home),
      mixed: () => checkMixed(home),
      safeBrowsing: () => checkSafeBrowsing(host, home),
      cms: () => checkCms(home),
      exposed: () => checkExposed(host),
    }
    const results: Partial<Record<SecurityKey, Result>> = {}
    const all = Promise.all(
      ORDER.map(async (k) => {
        try {
          results[k] = await runners[k]()
        } catch {
          results[k] = { ok: null, detail: COULDNT }
        }
      }),
    )
    // Whatever hasn't finished by the deadline becomes "Couldn’t check".
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([all, new Promise<void>((r) => { timer = setTimeout(r, OVERALL_MS) })])
    if (timer) clearTimeout(timer)

    const items: SecurityItem[] = ORDER.map((k) => {
      const r = results[k] || { ok: null, detail: COULDNT }
      return { key: k, label: META[k].label, ok: r.ok, detail: r.detail, severity: META[k].severity }
    })
    const checked = items.filter((i) => i.ok !== null)
    return { domain: host, checkedAt: new Date().toISOString(), items, passed: checked.filter((i) => i.ok).length, total: checked.length }
  } catch {
    return null
  }
}

const SEV_RANK: Record<SecurityItem["severity"], number> = { high: 0, medium: 1, low: 2 }

function fixPhrase(i: SecurityItem): string {
  switch (i.key) {
    case "https": return "make your site load securely over HTTPS"
    case "sslExpiry":
      if (/^Expired/.test(i.detail)) return "your security certificate has expired"
      if (/^Expires in/.test(i.detail)) return `your security certificate ${i.detail.replace(/ —.*$/, "").replace(/^Expires/, "expires")}`
      return "browsers don’t trust your security certificate"
    case "hsts": return "tell browsers to always use the secure version of your site"
    case "headers": return "add the basic security headers"
    case "mixed": return "fix the page elements that load insecurely"
    case "safeBrowsing": return "Google flags your site as dangerous"
    case "cms": return "update WordPress to the latest version"
    case "exposed": return i.detail.split(" — ")[0].replace(/^./, (c) => c.toLowerCase())
  }
}

export function securitySummary(c: SecurityCheck): string {
  if (c.total === 0) return "We couldn’t run the security checks on your site."
  const lead = `${c.passed} of ${plural(c.total, "security check")} pass${c.total === 1 ? "es" : ""}.`
  const failing = c.items.filter((i) => i.ok === false).sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || ORDER.indexOf(a.key) - ORDER.indexOf(b.key))
  if (failing.length === 0) return `All ${plural(c.total, "security check")} pass.`
  return `${lead} Fix first: ${fixPhrase(failing[0])}.`
}
