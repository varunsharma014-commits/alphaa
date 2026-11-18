// The owner's own photos, kept per brand so social images can use real pictures of the business.
// Three sources, all the owner's own: their Google Business Profile photos (the ones the
// business added, not customers'), large pictures on their own website (same domain only, no
// logos or icons), and photos they upload in the chat. Every photo is re-encoded as a clean
// JPEG (EXIF/GPS dropped) and stored as a MockActivity "brand_photo" row. Posts rotate through
// them, least used first, so the same picture doesn't come back week after week.
import { createHash } from "crypto"
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { publicUrl, bareHost } from "@/lib/connector/user"
import { resolveAccessToken } from "@/lib/gmb"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { imageInfo, normalizePhoto } from "@/lib/photo-render"

export const BRAND_PHOTO = "brand_photo"
export const MAX_PHOTOS = 40
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

export type PhotoSource = "google" | "website" | "upload" | "canva"
export type BrandPhoto = {
  id: string
  source: PhotoSource
  w: number
  h: number
  hash: string
  /** Where it came from (website page image, Google media name). Never shown as a credit: they're the owner's own. */
  sourceUrl?: string | null
  externalId?: string | null
  usedCount: number
  lastUsedAt?: string | null
  addedAt: string
}
type Meta = Omit<BrandPhoto, "id"> & { b64: string; mime: "image/jpeg" }

/** The library without the image bytes. */
export async function listPhotos(userId: string): Promise<BrandPhoto[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: BRAND_PHOTO }, orderBy: { createdAt: "asc" }, select: { id: true, metadata: true } })
  return rows.map((r) => {
    const { b64: _b, mime: _m, ...rest } = r.metadata as Meta
    void _b; void _m
    return { ...rest, id: r.id }
  })
}

export async function photoBytes(userId: string, id: string): Promise<Buffer | null> {
  const r = await db.mockActivity.findFirst({ where: { id, userId, type: BRAND_PHOTO }, select: { metadata: true } })
  const m = r?.metadata as Meta | null
  return m?.b64 ? Buffer.from(m.b64, "base64") : null
}

export async function removePhoto(userId: string, id: string): Promise<boolean> {
  return (await db.mockActivity.deleteMany({ where: { id, userId, type: BRAND_PHOTO } })).count > 0
}

const label: Record<PhotoSource, string> = { google: "your Google listing", website: "your website", upload: "you", canva: "your Canva" }

/** Clean and keep one photo. Null when it's too small, unreadable, a duplicate, or the library is full. */
export async function addPhoto(userId: string, raw: Buffer, o: { source: PhotoSource; sourceUrl?: string | null; externalId?: string | null; minSide?: number }): Promise<BrandPhoto | null> {
  const info = imageInfo(raw)
  const min = o.minSide ?? 600
  if (info.w && info.h && Math.min(info.w, info.h) < min) return null
  const clean = await normalizePhoto(raw)
  if (!clean || Math.min(clean.w, clean.h) < Math.min(min, 600)) return null
  const hash = createHash("sha1").update(clean.jpeg).digest("hex").slice(0, 20)
  const have = await listPhotos(userId)
  if (have.length >= MAX_PHOTOS) return null
  if (have.some((p) => p.hash === hash || (o.externalId && p.externalId === o.externalId) || (o.sourceUrl && p.sourceUrl === o.sourceUrl))) return null
  const meta: Meta = { source: o.source, w: clean.w, h: clean.h, hash, sourceUrl: o.sourceUrl ?? null, externalId: o.externalId ?? null, usedCount: 0, lastUsedAt: null, addedAt: new Date().toISOString(), b64: clean.jpeg.toString("base64"), mime: "image/jpeg" }
  const row = await db.mockActivity.create({ data: { userId, type: BRAND_PHOTO, title: `Added a photo from ${label[o.source]}`, metadata: meta as object } })
  const { b64: _b, mime: _m, ...rest } = meta
  void _b; void _m
  return { ...rest, id: row.id }
}

/** The next photo to use: least used, then longest ago. Marks it used. */
export async function nextPhoto(userId: string): Promise<{ id: string; bytes: Buffer } | null> {
  const list = await listPhotos(userId)
  if (!list.length) return null
  const pick = [...list].sort((a, b) => a.usedCount - b.usedCount || (Date.parse(a.lastUsedAt ?? "1970") - Date.parse(b.lastUsedAt ?? "1970")) || Date.parse(a.addedAt) - Date.parse(b.addedAt))[0]
  const row = await db.mockActivity.findFirst({ where: { id: pick.id, userId, type: BRAND_PHOTO }, select: { metadata: true } })
  const m = row?.metadata as Meta | null
  if (!m?.b64) return null
  await db.mockActivity.update({ where: { id: pick.id }, data: { metadata: { ...m, usedCount: (m.usedCount ?? 0) + 1, lastUsedAt: new Date().toISOString() } as object } })
  return { id: pick.id, bytes: Buffer.from(m.b64, "base64") }
}

// ── Google Business Profile photos ─────────────────────────────────────────────
// v4 accounts/{a}/locations/{l}/media lists the media the business itself added (customer
// photos are a separate endpoint we never call). Logos and profile pictures are skipped.
type MediaItem = { name?: string; mediaFormat?: string; googleUrl?: string; dimensions?: { widthPixels?: number; heightPixels?: number }; locationAssociation?: { category?: string } }
const SKIP_CATEGORIES = new Set(["LOGO", "PROFILE"])

export async function syncGooglePhotos(userId: string, limit = 12): Promise<number> {
  const integ = await db.integration.findUnique({ where: { userId } })
  if (!integ?.gmbAccountId || !integ?.gmbLocationId) return 0
  let items: MediaItem[] = []
  try {
    const token = await resolveAccessToken(integ)
    const acc = integ.gmbAccountId.replace(/^accounts\//, ""), loc = integ.gmbLocationId.replace(/^locations\//, "")
    const r = await fetch(`https://mybusiness.googleapis.com/v4/accounts/${acc}/locations/${loc}/media?pageSize=100`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) })
    if (!r.ok) { console.error("[brand-photos] google media", r.status); return 0 }
    items = ((await r.json()) as { mediaItems?: MediaItem[] }).mediaItems ?? []
  } catch (err) {
    console.error("[brand-photos] google media", err instanceof Error ? err.message : err)
    return 0
  }
  const have = new Set((await listPhotos(userId)).map((p) => p.externalId).filter(Boolean))
  let added = 0
  for (const m of items) {
    if (added >= limit) break
    if (m.mediaFormat !== "PHOTO" || !m.googleUrl || !m.name || have.has(m.name)) continue
    if (SKIP_CATEGORIES.has(m.locationAssociation?.category ?? "")) continue
    const w = m.dimensions?.widthPixels ?? 0, h = m.dimensions?.heightPixels ?? 0
    if (w && h && Math.min(w, h) < 600) continue
    try {
      const r = await fetch(m.googleUrl, { signal: AbortSignal.timeout(15_000) })
      if (!r.ok) continue
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length > 15_000_000) continue
      if (await addPhoto(userId, buf, { source: "google", externalId: m.name })) added++
    } catch { /* skip this one */ }
  }
  return added
}

// ── Pictures on the owner's own website ───────────────────────────────────────
const SKIP_IMG = /logo|icon|favicon|sprite|avatar|badge|placeholder|spinner|loader|emoji|payment|flag|arrow|button|banner-ad|pixel|tracking|gravatar/i

async function getHtml(url: string): Promise<string> {
  try {
    const r = await safeFetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) })
    return r.ok && /html/i.test(r.headers.get("content-type") ?? "") ? (await r.text()).slice(0, 800_000) : ""
  } catch {
    return ""
  }
}

/** Candidate image URLs on one page: og:image first, then large <img> (srcset's biggest). */
export function pageImages(html: string, pageUrl: string, siteHost: string): string[] {
  const abs = (u: string) => { try { return new URL(u.trim(), pageUrl).toString() } catch { return null } }
  const sameSite = (u: string) => { const h = publicUrl(u)?.hostname; if (!h) return false; const a = bareHost(h), b = bareHost(siteHost); return a === b || a.endsWith(`.${b}`) }
  const out: string[] = []
  const add = (u: string | null | undefined, ctx = "") => {
    if (!u || u.startsWith("data:")) return
    const a = abs(u)
    if (!a || !sameSite(a) || SKIP_IMG.test(a) || SKIP_IMG.test(ctx) || /\.(svg|gif|ico)(\?|$)/i.test(a)) return
    if (!out.includes(a)) out.push(a)
  }
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::url)?["'][^>]*>/gi)) add(m[0].match(/content=["']([^"']+)/i)?.[1])
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0]
    const ctx = [tag.match(/\balt=["']([^"']*)/i)?.[1], tag.match(/\bclass=["']([^"']*)/i)?.[1], tag.match(/\bid=["']([^"']*)/i)?.[1]].join(" ")
    const w = Number(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? 0), h = Number(tag.match(/\bheight=["']?(\d+)/i)?.[1] ?? 0)
    if ((w && w < 400) || (h && h < 400)) continue
    const srcset = tag.match(/\b(?:data-)?srcset=["']([^"']+)/i)?.[1]
    const biggest = srcset?.split(",").map((s) => s.trim().split(/\s+/)).map(([u, d]) => ({ u, n: Number((d ?? "").replace(/[^\d.]/g, "")) || 0 })).sort((a, b) => b.n - a.n)[0]?.u
    add(biggest ?? tag.match(/\b(?:data-src|data-lazy-src|src)=["']([^"']+)/i)?.[1], ctx)
  }
  return out
}

export async function syncWebsitePhotos(userId: string, limit = 10): Promise<number> {
  const s = await getAgentSettings(userId)
  const user = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true } })
  const site = s.wp?.siteUrl ?? s.site?.siteUrl ?? user?.websiteUrl
  if (!site) return 0
  const base = site.startsWith("http") ? site : `https://${site}`
  const host = publicUrl(base)?.hostname
  if (!host) return 0
  const home = await getHtml(base)
  if (!home) return 0
  // A few pages that usually show the work: about, gallery, services, menu…
  const pages = Array.from(new Set([...home.matchAll(/<a\b[^>]+href=["']([^"'#]+)/gi)].map((m) => { try { return new URL(m[1], base).toString() } catch { return "" } })
    .filter((u) => u && bareHost(publicUrl(u)?.hostname ?? "") === bareHost(host) && /\/(about|gallery|our-work|work|portfolio|projects|services|menu|team|photos)\b/i.test(new URL(u).pathname)))).slice(0, 3)
  const htmls = [home, ...(await Promise.all(pages.map(getHtml)))]
  const urls = Array.from(new Set(htmls.flatMap((h, i) => pageImages(h, i === 0 ? base : pages[i - 1], host)))).slice(0, 30)
  const have = new Set((await listPhotos(userId)).map((p) => p.sourceUrl).filter(Boolean))
  let added = 0
  for (const u of urls) {
    if (added >= limit) break
    if (have.has(u)) continue
    try {
      const r = await safeFetch(u, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10_000) })
      if (!r.ok || !/^image\/(jpeg|png|webp)/i.test(r.headers.get("content-type") ?? "")) continue
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length > 12_000_000 || buf.length < 30_000) continue
      if (await addPhoto(userId, buf, { source: "website", sourceUrl: u, minSide: 800 })) added++
    } catch { /* skip this one */ }
  }
  return added
}

/** Fill the library from Google and the website (at most once a week unless forced). */
export async function refreshPhotos(userId: string, opts: { force?: boolean } = {}): Promise<{ google: number; website: number; total: number }> {
  const s = await getAgentSettings(userId)
  const last = s.images?.photosSyncedAt ? Date.parse(s.images.photosSyncedAt) : 0
  if (!opts.force && Date.now() - last < 7 * 86_400_000) return { google: 0, website: 0, total: (await listPhotos(userId)).length }
  const [google, website] = await Promise.all([syncGooglePhotos(userId).catch(() => 0), syncWebsitePhotos(userId).catch(() => 0)])
  const cur = (await getAgentSettings(userId)).images
  await saveAgentSettings(userId, { images: { style: "card", ...(cur ?? {}), photosSyncedAt: new Date().toISOString() } })
  return { google, website, total: (await listPhotos(userId)).length }
}
