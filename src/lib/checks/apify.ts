// Apify, for the pages that block ordinary server requests:
// - Facebook and Instagram via Apify's own scrapers (structured data back)
// - everything else (Yelp, Tripadvisor, directories) via Apify's Web Unblocker proxy
// Gated on APIFY_TOKEN; with no token every call returns null and the checks
// fall back to "couldn't read". Costs: FB $0.01/page, IG ~$0.002/profile,
// unblocker a few cents a page — a few cents per customer per week.
import { ProxyAgent, fetch as uFetch } from "undici"

const TOKEN = () => process.env.APIFY_TOKEN || ""
export const apifyEnabled = () => !!TOKEN()

let proxyPw: string | null = null
async function proxyPassword(): Promise<string | null> {
  if (proxyPw) return proxyPw
  try {
    const r = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(TOKEN())}`, { signal: AbortSignal.timeout(8000) })
    const j = (await r.json()) as { data?: { proxy?: { password?: string } } }
    proxyPw = j.data?.proxy?.password ?? null
  } catch {
    proxyPw = null
  }
  return proxyPw
}

/**
 * GET a page through Apify's Web Unblocker (handles the bot walls Yelp,
 * Tripadvisor and most directories put up). The unblocker re-signs TLS, so
 * certificate checks are off for this dispatcher only — it's used solely to
 * read public pages, never to send credentials.
 */
export async function proxyGet(url: string, headers: Record<string, string>, ms = 60_000): Promise<{ status: number; url: string; html: string } | null> {
  if (!apifyEnabled()) return null
  const pw = await proxyPassword()
  if (!pw) return null
  try {
    const dispatcher = new ProxyAgent({ uri: "http://proxy.apify.com:8000", requestTls: { rejectUnauthorized: false }, token: `Basic ${Buffer.from(`groups-UNBLOCKER,country-US:${pw}`).toString("base64")}` })
    const res = await uFetch(url, { headers, redirect: "follow", dispatcher, signal: AbortSignal.timeout(ms) })
    const html = res.ok ? (await res.text()).slice(0, 3_000_000) : ""
    return { status: res.status, url: res.url || url, html }
  } catch {
    return null
  }
}

async function runActor<T>(actor: string, input: unknown, timeoutSecs = 90): Promise<T[] | null> {
  if (!apifyEnabled()) return null
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(TOKEN())}&timeout=${timeoutSecs}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout((timeoutSecs + 15) * 1000),
    })
    if (!r.ok) {
      console.error(`[apify] ${actor} ${r.status}`)
      return null
    }
    return (await r.json()) as T[]
  } catch (err) {
    console.error(`[apify] ${actor}`, err instanceof Error ? err.message : err)
    return null
  }
}

export type SocialData = { name: string | null; bio: string | null; phone: string | null; address: string | null; website: string | null; rating: number | null; ratingCount: number | null }

export async function facebookPage(url: string): Promise<SocialData | null> {
  type Fb = { title?: string; pageName?: string; intro?: string; info?: string[]; phone?: string; address?: string; website?: string; websites?: string[]; rating?: string | number; ratingCount?: number; ratingOverall?: number }
  const items = await runActor<Fb>("apify~facebook-pages-scraper", { startUrls: [{ url }] })
  const p = items?.[0]
  if (!p || (!p.title && !p.pageName)) return null
  // Facebook shows "95% recommend (120 Reviews)" rather than stars.
  const pct = typeof p.rating === "string" ? Number(p.rating.match(/(\d+)%/)?.[1]) : NaN
  const count = p.ratingCount ?? (typeof p.rating === "string" ? Number(p.rating.match(/\((\d[\d,]*)/)?.[1]?.replace(/,/g, "")) : NaN)
  return {
    name: p.title ?? p.pageName ?? null,
    bio: p.intro ?? (p.info ?? []).join(" ").slice(0, 300) ?? null,
    phone: p.phone ?? null,
    address: p.address ?? null,
    website: p.website ?? p.websites?.[0] ?? null,
    rating: typeof p.ratingOverall === "number" ? p.ratingOverall : Number.isFinite(pct) ? Math.round((pct / 20) * 10) / 10 : null,
    ratingCount: Number.isFinite(count) ? count : null,
  }
}

export async function instagramProfile(url: string): Promise<SocialData | null> {
  const username = url.match(/instagram\.com\/([A-Za-z0-9_.]+)/)?.[1]
  if (!username) return null
  type Ig = { username?: string; fullName?: string; biography?: string; externalUrl?: string; businessPhoneNumber?: string; businessAddress?: unknown }
  const items = await runActor<Ig>("apify~instagram-profile-scraper", { usernames: [username] })
  const p = items?.[0]
  if (!p || !p.username) return null
  return { name: p.fullName || p.username, bio: p.biography ?? null, phone: p.businessPhoneNumber ?? null, address: null, website: p.externalUrl ?? null, rating: null, ratingCount: null }
}
