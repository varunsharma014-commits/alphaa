// Using the brand library: the next photo for a post (one the owner marked "Use this next",
// else tags matching the topic, least used first), read fresh from Drive / Dropbox each time.
import { normalizePhoto } from "@/lib/photo-render"
import { assetBytes, MissingFile, TooBig } from "./open"
import { markMissing } from "./ingest"
import { librarySettings, listAssets, patchAsset, saveLibrarySettings } from "./store"
import { CAP, type BrandAsset } from "./types"

const STOP = new Set("a an and are at be by for from how in is it of on or our the this to we what when why with you your".split(" "))
const words = (s: string) => new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w)))

/** How well a photo's tags and description match a post topic (0 = no overlap). */
export function topicScore(a: Pick<BrandAsset, "tags" | "description">, topic: string): number {
  const t = words(topic)
  if (!t.size) return 0
  let n = 0
  for (const tag of a.tags) for (const w of words(tag)) if (t.has(w)) n += 2
  for (const w of words(a.description ?? "")) if (t.has(w)) n += 1
  return n
}

/** Photos fit for a post background, best first: "Use this next", then topic match, then least used. */
export function rankPhotos(list: BrandAsset[], topic = ""): BrandAsset[] {
  return list
    .filter((a) => a.kind === "photo" && a.status === "ok" && a.qualityOk !== false)
    .map((a) => ({ a, s: topicScore(a, topic) }))
    .sort((x, y) => Number(!!y.a.next) - Number(!!x.a.next) || y.s - x.s || x.a.uses - y.a.uses || Date.parse(x.a.lastUsedAt ?? "1970") - Date.parse(y.a.lastUsedAt ?? "1970") || Date.parse(x.a.addedAt) - Date.parse(y.a.addedAt))
    .map((x) => x.a)
}

/** The next library photo as a clean JPEG, marked used. Null when the library has none we can open. */
export async function nextLibraryPhoto(userId: string, topic = "", opts: { peek?: boolean } = {}): Promise<{ id: string; bytes: Buffer } | null> {
  const ranked = rankPhotos(await listAssets(userId), topic)
  for (const a of ranked.slice(0, 3)) {
    try {
      const clean = await normalizePhoto(await assetBytes(userId, a, CAP.photo), 1600)
      if (!clean) { await patchAsset(userId, a.id, { status: "failed", note: "I can’t read this kind of photo. A JPG or PNG copy works.", next: false }); continue }
      if (!opts.peek) await patchAsset(userId, a.id, { uses: a.uses + 1, lastUsedAt: new Date().toISOString(), next: false })
      return { id: a.id, bytes: clean.jpeg }
    } catch (err) {
      if (err instanceof MissingFile) await markMissing(userId, a, err.message)
      else if (err instanceof TooBig) await patchAsset(userId, a.id, { status: "failed", note: `It’s ${err.message} now, too big for me to read.`, next: false })
      else console.error("[library] photo", err instanceof Error ? err.message : err)
    }
  }
  return null
}

/** The video the owner picked for their next Facebook / Instagram post (taken once). */
export async function takeNextVideo(userId: string): Promise<string | null> {
  const s = await librarySettings(userId)
  if (!s.nextVideo) return null
  const a = (await listAssets(userId)).find((x) => x.id === s.nextVideo && x.kind === "video" && x.status === "ok")
  await saveLibrarySettings(userId, { nextVideo: null })
  if (!a) return null
  await patchAsset(userId, a.id, { uses: a.uses + 1, lastUsedAt: new Date().toISOString(), next: false })
  return a.id
}
