// The brand library: files the owner links from Google Drive or Dropbox (brand book, photos,
// videos). We keep the LINK, a small preview and tags, never a copy of the file. Client-safe.
export const BRAND_ASSET = "brand_asset"
export const ASSET_THUMB = "asset_thumb"
export const MAX_ASSETS = 300
export const MAX_PICK = 25

export type AssetSource = "drive" | "dropbox" | "upload"
export type AssetKind = "brandbook" | "photo" | "video"
export type AssetStatus = "pending" | "ok" | "missing" | "failed"

/** Size caps for what we read (transiently, never kept). Videos are never downloaded. */
export const CAP = { photo: 25 * 1024 * 1024, brandbook: 30 * 1024 * 1024, video: 1024 * 1024 * 1024 }

export const PHOTO_MIMES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"]
export const VIDEO_MIMES = ["video/mp4", "video/quicktime"]
export const PDF_MIME = "application/pdf"
export const PICK_MIMES = [PDF_MIME, ...PHOTO_MIMES, ...VIDEO_MIMES]
export const DROPBOX_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".heic", ".webp", ".mp4", ".mov"]

export type BrandBook = {
  colors: string[]
  fonts: string[]
  logoRules: string[]
  tone: string
  wordsToUse: string[]
  wordsToAvoid: string[]
  taglines: string[]
  audience: string
  /** What the owner applied, and when. */
  applied?: { colors?: string; fonts?: string; rules?: string }
}

export type BrandAsset = {
  id: string
  source: AssetSource
  /** Drive file id, or the Dropbox file id ("id:…"). */
  fileId?: string | null
  /** Dropbox shared (preview) link; Drive resourceKey goes in `resourceKey`. */
  link?: string | null
  resourceKey?: string | null
  name: string
  mime: string
  size?: number | null
  kind: AssetKind
  thumbId?: string | null
  tags: string[]
  description?: string | null
  hasPeople?: boolean
  hasText?: boolean
  qualityOk?: boolean
  width?: number | null
  height?: number | null
  durationSec?: number | null
  addedAt: string
  lastUsedAt?: string | null
  uses: number
  status: AssetStatus
  /** Why it failed or went missing, in owner words. */
  note?: string | null
  /** The owner tapped "Use this next". */
  next?: boolean
  brandbook?: BrandBook | null
}

/** What the browser picker sends us for one file. */
export type PickedFile = {
  id?: string
  name: string
  mimeType?: string
  sizeBytes?: number
  resourceKey?: string
  /** Dropbox: the preview link. */
  link?: string
  /** Dropbox: thumbnail link (expires after 4 hours, so read at once). */
  thumbnailLink?: string
  durationSec?: number
}

export type LibrarySettings = {
  /** Video picked with "Use this next" for the next Facebook / Instagram post. */
  nextVideo?: string | null
  /** One-time note for the library panel (how the last Drive connect went). */
  note?: string | null
}

export function kindOf(mime: string, name: string): AssetKind | null {
  const m = mime.toLowerCase()
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase()
  if (m === PDF_MIME || ext === "pdf") return "brandbook"
  if (PHOTO_MIMES.includes(m) || ["jpg", "jpeg", "png", "heic", "heif", "webp"].includes(ext)) return "photo"
  if (VIDEO_MIMES.includes(m) || ["mp4", "mov"].includes(ext)) return "video"
  return null
}

export function mimeFromName(name: string): string {
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toLowerCase()
  return ({ pdf: PDF_MIME, jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic", heif: "image/heif", webp: "image/webp", mp4: "video/mp4", mov: "video/quicktime" } as Record<string, string>)[ext] ?? "application/octet-stream"
}
