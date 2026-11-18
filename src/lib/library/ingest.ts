// Bring a picked file into the brand library, in the background, one file at a time per brand:
//   photo      read it (≤ 25 MB, never kept), make a ≤ 400 px preview, tag it with Claude vision
//   video      never downloaded: size, length and preview picture come from Drive / Dropbox
//   brandbook  read the PDF (≤ 30 MB, never kept) with Claude: colours, fonts, logo rules, tone, words
// A file we can't open any more is marked "missing" and the owner is told once (a ledger row).
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { countUsage, runAsUser } from "@/lib/usage"
import { imageInfo, normalizePhoto } from "@/lib/photo-render"
import { HEX_RE } from "@/lib/brand-kit"
import { driveFile, driveThumb, MissingFile, type DriveFile } from "./drive"
import { fetchThumb, isDropboxLink } from "./dropbox"
import { assetBytes, TooBig } from "./open"
import { createAsset, getAsset, listAssets, patchAsset, storeThumb } from "./store"
import { CAP, kindOf, MAX_ASSETS, MAX_PICK, mimeFromName, type AssetSource, type BrandAsset, type BrandBook, type PickedFile } from "./types"

const VISION_MODEL = "claude-haiku-4-5"
const BOOK_MODEL = "claude-sonnet-5-5"
/** Base64 grows a file by a third and a request is capped at 32 MB, so bigger PDFs can't be sent whole. */
const PDF_SEND_MAX = 22 * 1024 * 1024

// ── Adding ──────────────────────────────────────────────────────────────────
export type AddResult = { added: BrandAsset[]; skipped: { name: string; why: string }[] }

/** Create a "pending" row per picked file and start reading them. Duplicates and odd files are skipped. */
export async function addPicked(userId: string, source: Exclude<AssetSource, "upload">, files: PickedFile[]): Promise<AddResult> {
  const have = await listAssets(userId)
  const out: AddResult = { added: [], skipped: [] }
  const thumbs = new Map<string, string>()
  for (const f of files.slice(0, MAX_PICK)) {
    const name = String(f.name ?? "").trim().slice(0, 200) || "Untitled"
    const mime = (f.mimeType || mimeFromName(name)).toLowerCase()
    const kind = kindOf(mime, name)
    if (!kind) { out.skipped.push({ name, why: "not a PDF, photo or video" }); continue }
    if (have.length + out.added.length >= MAX_ASSETS) { out.skipped.push({ name, why: `your library is full (${MAX_ASSETS} files)` }); continue }
    if (source === "drive" && !f.id) { out.skipped.push({ name, why: "Google didn’t send its id" }); continue }
    if (source === "dropbox" && (!f.link || !isDropboxLink(f.link))) { out.skipped.push({ name, why: "Dropbox didn’t send a link" }); continue }
    const fileId = f.id ? String(f.id).slice(0, 200) : null
    const link = f.link ? String(f.link).slice(0, 1000) : null
    if ([...have, ...out.added].some((a) => a.source === source && ((fileId && a.fileId === fileId) || (link && a.link === link)))) { out.skipped.push({ name, why: "already in your library" }); continue }
    const size = Number(f.sizeBytes) || null
    if (size && size > CAP[kind]) { out.skipped.push({ name, why: `over ${Math.round(CAP[kind] / 1048576)} MB` }); continue }
    const a = await createAsset(userId, {
      source, fileId, link, resourceKey: f.resourceKey ? String(f.resourceKey).slice(0, 200) : null, name, mime, size, kind,
      thumbId: null, tags: [], description: null, width: null, height: null, durationSec: Number(f.durationSec) || null,
      addedAt: new Date().toISOString(), lastUsedAt: null, uses: 0, status: "pending", note: null, brandbook: null,
    })
    if (f.thumbnailLink) thumbs.set(a.id, String(f.thumbnailLink))
    out.added.push(a)
  }
  if (out.added.length) enqueue(userId, out.added.map((a) => a.id), thumbs)
  return out
}

const queues = new Map<string, Promise<void>>()

/** Read the files one after another (per brand), off the request. */
function enqueue(userId: string, ids: string[], thumbs: Map<string, string>): void {
  const prev = queues.get(userId) ?? Promise.resolve()
  const next = prev.then(() => runAsUser(userId, async () => {
    for (const id of ids) await ingestAsset(userId, id, thumbs.get(id)).catch((err) => console.error("[library] ingest", err instanceof Error ? err.message : err))
  }))
  queues.set(userId, next)
  void next.finally(() => { if (queues.get(userId) === next) queues.delete(userId) })
}

/** Wait (up to `ms`) for these files to finish, so the answer can show their previews. */
export async function waitFor(userId: string, ms: number): Promise<void> {
  const q = queues.get(userId)
  if (!q) return
  await Promise.race([q, new Promise((r) => setTimeout(r, ms))])
}

/** Read again (the owner tapped "Try again" on a missing or failed file). */
export function retry(userId: string, id: string): void {
  enqueue(userId, [id], new Map())
}

// ── Reading one file ──────────────────────────────────────────────────────────
export async function ingestAsset(userId: string, id: string, chooserThumb?: string | null): Promise<BrandAsset | null> {
  const a = await getAsset(userId, id)
  if (!a) return null
  try {
    let meta: DriveFile | null = null
    if (a.source === "drive" && a.fileId) {
      meta = await driveFile(userId, a.fileId, a.resourceKey)
      const size = Number(meta.size) || a.size || null
      if (size && size > CAP[a.kind]) return patchAsset(userId, id, { status: "failed", size, note: `It’s over ${Math.round(CAP[a.kind] / 1048576)} MB, too big for me to read.` })
      await patchAsset(userId, id, { size, mime: meta.mimeType || a.mime, name: meta.name || a.name })
    }
    const done = a.kind === "photo" ? await ingestPhoto(userId, a, meta, chooserThumb) : a.kind === "video" ? await ingestVideo(userId, a, meta, chooserThumb) : await ingestBook(userId, a, meta)
    countUsage(userId, `library_${a.kind}`)
    return done
  } catch (err) {
    if (err instanceof MissingFile) return markMissing(userId, a, err.message)
    if (err instanceof TooBig) return patchAsset(userId, id, { status: "failed", note: `It’s ${err.message}, too big for me to read.` })
    console.error("[library] ingest", a.kind, err instanceof Error ? err.message : err)
    return patchAsset(userId, id, { status: "failed", note: "I couldn’t read this file just now." })
  }
}

/** Mark a file we can't open any more, and tell the owner once (the work log shows it). */
export async function markMissing(userId: string, a: BrandAsset, note: string): Promise<BrandAsset | null> {
  if (a.status !== "missing") {
    await db.mockActivity.create({ data: { userId, type: "library_missing", title: `I can’t open “${a.name.slice(0, 80)}” any more. I’ve stopped using it.`, metadata: { assetId: a.id, source: a.source } } })
  }
  return patchAsset(userId, a.id, { status: "missing", note, next: false })
}

async function previewOf(userId: string, bytes: Buffer | null, name: string): Promise<string | null> {
  if (!bytes) return null
  const small = await normalizePhoto(bytes, 400)
  return small ? storeThumb(userId, small.jpeg, name) : null
}

async function ingestPhoto(userId: string, a: BrandAsset, meta: DriveFile | null, chooserThumb?: string | null): Promise<BrandAsset | null> {
  const raw = await assetBytes(userId, a, CAP.photo)
  const info = imageInfo(raw)
  const clean = await normalizePhoto(raw, 1024)
  if (!clean) return patchAsset(userId, a.id, { status: "failed", size: raw.length, note: "I can’t read this kind of photo. A JPG or PNG copy works." })
  void chooserThumb // photos get their preview from the photo itself
  const thumbId = await previewOf(userId, clean.jpeg, a.name)
  const tags = await tagPhoto(clean.jpeg).catch((err) => { console.error("[library] tag", err instanceof Error ? err.message : err); return null })
  const turned = info.orientation >= 5 && info.orientation <= 8
  return patchAsset(userId, a.id, {
    status: "ok", note: null, size: raw.length, thumbId,
    width: (turned ? info.h : info.w) || meta?.imageMediaMetadata?.width || clean.w, height: (turned ? info.w : info.h) || meta?.imageMediaMetadata?.height || clean.h,
    tags: tags?.tags ?? [], description: tags?.description ?? null, hasPeople: tags?.has_people, hasText: tags?.has_text, qualityOk: tags?.quality_ok,
  })
}

async function ingestVideo(userId: string, a: BrandAsset, meta: DriveFile | null, chooserThumb?: string | null): Promise<BrandAsset | null> {
  // Never downloaded: Drive's metadata, or what the Chooser told us.
  const v = meta?.videoMediaMetadata
  const pic = meta ? await driveThumb(userId, meta) : await fetchThumb(chooserThumb)
  const thumbId = await previewOf(userId, pic, a.name)
  return patchAsset(userId, a.id, {
    status: "ok", note: null, thumbId,
    width: v?.width ?? null, height: v?.height ?? null,
    durationSec: v?.durationMillis ? Math.round(Number(v.durationMillis) / 1000) : a.durationSec ?? null,
  })
}

async function ingestBook(userId: string, a: BrandAsset, meta: DriveFile | null): Promise<BrandAsset | null> {
  const pdf = await assetBytes(userId, a, CAP.brandbook)
  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") return patchAsset(userId, a.id, { status: "failed", note: "This doesn’t look like a PDF." })
  if (pdf.length > PDF_SEND_MAX) return patchAsset(userId, a.id, { status: "failed", size: pdf.length, note: "This PDF is too big for me to read in one go (over 22 MB). A smaller export of it works." })
  const thumbId = meta ? await previewOf(userId, await driveThumb(userId, meta), a.name) : null
  const book = await readBrandBook(pdf)
  if (!book) return patchAsset(userId, a.id, { status: "failed", size: pdf.length, thumbId, note: "I couldn’t find brand rules in this PDF." })
  return patchAsset(userId, a.id, { status: "ok", note: null, size: pdf.length, thumbId, brandbook: book })
}

// ── Claude ──────────────────────────────────────────────────────────────────
const PhotoTags = z.object({
  tags: z.array(z.string()).describe("4 to 8 short lowercase tags for what's in the photo: the place, objects, food, work, activity, season, mood. No names of people."),
  description: z.string().describe("One plain sentence describing the photo, under 20 words."),
  has_people: z.boolean().describe("A person or part of one is visible"),
  has_text: z.boolean().describe("Readable words or signs take up a noticeable part of the picture"),
  quality_ok: z.boolean().describe("Sharp, well lit and fit to be a social media background"),
})
export type PhotoTagsOut = z.infer<typeof PhotoTags>

/** Tags for one of the owner's own photos (≤ 1024 px JPEG). */
export async function tagPhoto(jpeg: Buffer): Promise<PhotoTagsOut | null> {
  const msg = await anthropic.messages.parse({
    model: VISION_MODEL,
    max_tokens: 600,
    output_config: { format: zodOutputFormat(PhotoTags) },
    messages: [{ role: "user", content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
      { type: "text", text: "This is a small business owner's own photo, from their brand library. Describe it so their marketing assistant can pick it for the right post. Don't guess who anyone is." },
    ] }],
  })
  const o = msg.parsed_output
  if (!o) return null
  return { ...o, tags: Array.from(new Set(o.tags.map((t) => t.toLowerCase().trim().replace(/^#/, "")).filter((t) => t && t.length <= 30))).slice(0, 8), description: o.description.trim().slice(0, 160) }
}

const Book = z.object({
  colors: z.array(z.string()).describe("Brand colours as #RRGGBB hex, main colour first. Only colours the document states."),
  fonts: z.array(z.string()).describe("Font family names the document names, main one first"),
  logo_rules: z.array(z.string()).describe("Short rules for using the logo (clear space, backgrounds, don'ts), as written"),
  tone: z.string().describe("How the brand should sound, in one or two plain sentences. Empty if the document doesn't say."),
  words_to_use: z.array(z.string()).describe("Words or phrases the document says to use"),
  words_to_avoid: z.array(z.string()).describe("Words or phrases the document says to avoid"),
  taglines: z.array(z.string()).describe("Taglines or slogans, copied exactly"),
  audience: z.string().describe("Who the brand speaks to, in one sentence. Empty if the document doesn't say."),
})

const clean = (xs: string[], n: number, len = 80) => Array.from(new Set(xs.map((x) => x.trim().replace(/\s+/g, " ")).filter((x) => x && x.length <= len))).slice(0, n)

/** What a brand book says. Null when it says nothing useful. The PDF is sent once and never kept. */
export async function readBrandBook(pdf: Buffer): Promise<BrandBook | null> {
  const msg = await anthropic.messages.parse({
    model: BOOK_MODEL,
    max_tokens: 3000,
    output_config: { format: zodOutputFormat(Book) },
    messages: [{ role: "user", content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf.toString("base64") } },
      { type: "text", text: "This is a business's own brand book or style guide. Pull out only what it actually says, so their marketing assistant follows it. Leave a field empty when the document doesn't cover it. Never invent colours, fonts or words." },
    ] }],
  })
  const o = msg.parsed_output
  if (!o) return null
  const book: BrandBook = {
    colors: clean(o.colors.map((c) => (c.startsWith("#") ? c : `#${c}`).toLowerCase()).filter((c) => HEX_RE.test(c)), 8, 7),
    fonts: clean(o.fonts, 4, 40),
    logoRules: clean(o.logo_rules, 6, 200),
    tone: o.tone.trim().slice(0, 400),
    wordsToUse: clean(o.words_to_use, 12, 60),
    wordsToAvoid: clean(o.words_to_avoid, 12, 60),
    taglines: clean(o.taglines, 4, 120),
    audience: o.audience.trim().slice(0, 300),
  }
  const any = book.colors.length + book.fonts.length + book.logoRules.length + book.wordsToUse.length + book.wordsToAvoid.length + book.taglines.length + (book.tone ? 1 : 0) + (book.audience ? 1 : 0)
  return any ? book : null
}
