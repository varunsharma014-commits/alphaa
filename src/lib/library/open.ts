// Read a linked file at the moment we need it: stream from Drive or Dropbox, never keep it.
import { createHmac, timingSafeEqual } from "crypto"
import { driveMedia, MissingFile } from "./drive"
import { dropboxMedia } from "./dropbox"
import type { BrandAsset } from "./types"

export { MissingFile }
export class TooBig extends Error {}

/** The upstream response for an asset (Range / HEAD passed through). */
export async function openAsset(userId: string, a: BrandAsset, o: { range?: string | null; method?: "GET" | "HEAD" } = {}): Promise<Response> {
  if (a.source === "drive" && a.fileId) return driveMedia(userId, a.fileId, { resourceKey: a.resourceKey, ...o })
  if (a.source === "dropbox" && a.link) return dropboxMedia(a.link, o)
  throw new MissingFile("I don’t have a link for this file.")
}

/** The whole body, stopping (and throwing TooBig) past `cap` bytes. */
export async function readCapped(r: Response, cap: number): Promise<Buffer> {
  if (!r.ok) throw new Error(`The file couldn’t be read (${r.status}).`)
  const len = Number(r.headers.get("content-length") ?? 0)
  if (len && len > cap) { await r.body?.cancel().catch(() => null); throw new TooBig(`over ${Math.round(cap / 1048576)} MB`) }
  if (!r.body) return Buffer.from(await r.arrayBuffer())
  const reader = r.body.getReader()
  const parts: Uint8Array[] = []
  let n = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    n += value.byteLength
    if (n > cap) { await reader.cancel().catch(() => null); throw new TooBig(`over ${Math.round(cap / 1048576)} MB`) }
    parts.push(value)
  }
  return Buffer.concat(parts)
}

export async function assetBytes(userId: string, a: BrandAsset, cap: number): Promise<Buffer> {
  return readCapped(await openAsset(userId, a), cap)
}

// ── Signed, short-lived public URLs (Meta pulls videos from here) ─────────────
const secret = () => process.env.CONNECTOR_SECRET || process.env.CLERK_SECRET_KEY || "dev"
const sig = (id: string, exp: number) => createHmac("sha256", secret()).update(`asset:${id}:${exp}`).digest("base64url").slice(0, 32)

/** https://…/api/asset/<id>.mp4?e=<unix>&s=<sig>, valid for `ttlSec` (default 3 hours). */
export function signedAssetUrl(a: Pick<BrandAsset, "id" | "mime">, ttlSec = 3 * 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  const ext = a.mime === "video/quicktime" ? "mov" : a.mime === "video/mp4" ? "mp4" : a.mime === "image/png" ? "png" : "jpg"
  return `${process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"}/api/asset/${a.id}.${ext}?e=${exp}&s=${sig(a.id, exp)}`
}

export function checkAssetSig(id: string, e: string | null, s: string | null): boolean {
  const exp = Number(e)
  if (!exp || !s || exp < Date.now() / 1000) return false
  const want = Buffer.from(sig(id, exp))
  return s.length === want.length && timingSafeEqual(Buffer.from(s), want)
}
