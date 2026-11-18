// Dropbox for the brand library, through the Dropbox Chooser (no Dropbox login on our side).
// The Chooser gives a shared "preview" link per file; we keep that link and turn it into a
// download (dl=1) only at the moment we read the file. Preview links don't expire, but the
// owner can turn them off in Dropbox, which we treat as "missing".
import { MissingFile } from "./drive"

/** Hidden until the Dropbox app key is set. */
export const dropboxConfigured = () => !!process.env.NEXT_PUBLIC_DROPBOX_APP_KEY
export const dropboxAppKey = () => process.env.NEXT_PUBLIC_DROPBOX_APP_KEY ?? ""

const HOSTS = /^(www\.)?dropbox\.com$|^dl\.dropboxusercontent\.com$/i

/** Only real Dropbox share links, over https (we fetch them server-side). */
export function isDropboxLink(link: string): boolean {
  try {
    const u = new URL(link)
    return u.protocol === "https:" && HOSTS.test(u.hostname)
  } catch {
    return false
  }
}

/** A shared link as a direct download: dl=1 (keeps rlkey and the rest of the query). */
export function directLink(link: string): string {
  const u = new URL(link)
  u.searchParams.delete("raw")
  u.searchParams.set("dl", "1")
  return u.toString()
}

/** A Chooser thumbnail link at a useful size (they expire after 4 hours). */
export function thumbLink(link: string, box: 256 | 800 | 1280 = 800): string {
  try {
    const u = new URL(link)
    u.searchParams.set("bounding_box", String(box))
    u.searchParams.set("mode", "fit")
    return u.toString()
  } catch {
    return link
  }
}

/** The file's bytes as a stream response (Range passed through). Throws MissingFile when the link is off. */
export async function dropboxMedia(link: string, o: { range?: string | null; method?: "GET" | "HEAD" } = {}): Promise<Response> {
  if (!isDropboxLink(link)) throw new MissingFile("That isn’t a Dropbox link.")
  const r = await fetch(directLink(link), { method: o.method ?? "GET", redirect: "follow", headers: o.range ? { Range: o.range } : {}, signal: AbortSignal.timeout(120_000) })
  // Every redirect must stay on Dropbox.
  if (r.url && !isDropboxLink(r.url)) throw new MissingFile("Dropbox sent me somewhere else.")
  if (r.status === 404 || r.status === 410 || r.status === 403 || r.status === 409) throw new MissingFile("This Dropbox link doesn’t work any more (the file moved, or the link was turned off).")
  // A turned-off link answers with an HTML page instead of the file.
  if (r.ok && /text\/html/i.test(r.headers.get("content-type") ?? "")) throw new MissingFile("This Dropbox link doesn’t work any more (the file moved, or the link was turned off).")
  return r
}

export async function fetchThumb(link: string | null | undefined): Promise<Buffer | null> {
  if (!link || !isDropboxLink(link) && !/^https:\/\/[a-z0-9.-]+\.dropbox(usercontent|static)?\.com\//i.test(link)) return null
  try {
    const r = await fetch(thumbLink(link), { signal: AbortSignal.timeout(15_000) })
    return r.ok && /^image\//.test(r.headers.get("content-type") ?? "") ? Buffer.from(await r.arrayBuffer()) : null
  } catch {
    return null
  }
}
