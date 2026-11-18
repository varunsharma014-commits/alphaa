// "Your brand library" panel in the "Your brand & voice" thread, plus "Here’s what I learned
// from your brand book". Server only. Ops go to /api/agent/library.
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { addPhotosChip } from "@/lib/agent/images-panel"
import { driveConfigured, getDriveAccount } from "./drive"
import { dropboxAppKey, dropboxConfigured } from "./dropbox"
import { librarySettings, listAssets, saveLibrarySettings } from "./store"
import { MAX_ASSETS, type BrandAsset, type BrandBook } from "./types"

const op = (body: Record<string, string | number | boolean>, label: string, primary = false): Chip => ({ label, primary, action: { type: "agent-op", endpoint: "library", body } })
export const thumbUrl = (id: string) => `/api/agent/library/thumb/${id}`
const SOURCE = { drive: "Google Drive", dropbox: "Dropbox", upload: "you" } as const

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`

function metaLine(a: BrandAsset, nextVideo: string | null | undefined): string {
  if (a.status === "pending") return "reading it…"
  if (a.status === "missing") return "can’t open it any more"
  if (a.status === "failed") return "couldn’t read it"
  const next = a.next || nextVideo === a.id ? "next up · " : ""
  if (a.kind === "video") return `${next}video${a.durationSec ? ` · ${mmss(a.durationSec)}` : ""} · ${a.uses ? `used ${a.uses}×` : "not used yet"}`
  if (a.kind === "brandbook") return "brand book"
  return `${next}${a.tags.slice(0, 4).join(", ") || "photo"} · ${a.uses ? `used ${a.uses}×` : "not used yet"}`
}

/** Every message of the panel: the library, then one card per brand book. */
export async function libraryMessages(userId: string, opts: { all?: boolean } = {}): Promise<Message[]> {
  const drive = driveConfigured(), dropbox = dropboxConfigured()
  const [assets, s, driveAcc] = await Promise.all([listAssets(userId), librarySettings(userId), drive ? getDriveAccount(userId) : Promise.resolve(null)])
  if (s.note) await saveLibrarySettings(userId, { note: null })
  const photos = assets.filter((a) => a.kind === "photo"), videos = assets.filter((a) => a.kind === "video"), books = assets.filter((a) => a.kind === "brandbook")
  const pending = assets.filter((a) => a.status === "pending").length
  const missing = assets.filter((a) => a.status === "missing").length

  const blocks: Block[] = [{ kind: "text", text: "Your brand library" }]
  if (s.note) blocks.push({ kind: "text", text: s.note })
  const linkWhere = [drive && "Google Drive", dropbox && "Dropbox"].filter(Boolean).join(" or ")
  blocks.push({ kind: "text", text: assets.length
    ? `${[photos.length && plural(photos.length, "photo"), videos.length && plural(videos.length, "video"), books.length && plural(books.length, "brand book")].filter(Boolean).join(", ")}. I keep a link and a small preview, never a copy. Your posts use the photo that fits the topic best, the least used first.`
    : `${linkWhere ? `Link your brand book, photos and videos from ${linkWhere}.` : "Add your photos here."} I keep a link and a small preview, never a copy. Then your posts use your real photos, and I follow your brand book’s colours, fonts and words.` })
  if (pending) blocks.push({ kind: "text", text: `Still reading ${plural(pending, "file")}. It takes a few seconds each.` })
  if (missing) blocks.push({ kind: "text", text: `I can’t open ${plural(missing, "file")} any more (moved, deleted, or access removed), so I stopped using ${missing === 1 ? "it" : "them"}.` })

  const add: Chip[] = []
  if (assets.length < MAX_ASSETS) {
    if (drive) add.push(driveAcc && driveAcc.status !== "expired"
      ? op({ pick: "drive" }, "Add from Google Drive", !assets.length)
      : { label: driveAcc ? "Reconnect Google Drive" : "Add from Google Drive", primary: !assets.length, action: { type: "link", href: "/api/library/drive/connect" } })
    if (dropbox) add.push(op({ pick: "dropbox", key: dropboxAppKey() }, "Add from Dropbox"))
    add.push(addPhotosChip("Upload from this device"))
  }
  if (pending) add.push(op({ op: "list" }, "Check again"))
  blocks.push({ kind: "chips", items: add })

  const nextVideo = s.nextVideo
  const shown = [...assets].reverse().slice(0, opts.all ? 30 : 6)
  for (const a of shown) {
    blocks.push({ kind: "doc", title: a.name, meta: `${metaLine(a, nextVideo)} · from ${SOURCE[a.source]}`, text: a.status === "missing" || a.status === "failed" ? a.note ?? "" : a.description ?? "", ...(a.thumbId ? { image: thumbUrl(a.thumbId), square: true } : {}) })
    const chips: Chip[] = []
    if (a.status === "ok" && a.kind !== "brandbook" && !(a.next || nextVideo === a.id)) chips.push(op({ op: "next", id: a.id }, "Use this next"))
    if (a.status === "missing" || a.status === "failed") chips.push(op({ op: "retry", id: a.id }, "Try again"))
    chips.push(op({ op: "remove", id: a.id }, "Remove"))
    blocks.push({ kind: "chips", items: chips })
  }
  const more: Chip[] = []
  if (assets.length > shown.length) more.push(op({ op: "list", all: true }, `Show ${Math.min(assets.length, 30)} of ${assets.length}`))
  if (driveAcc) more.push(op({ op: "drive-disconnect" }, "Disconnect Google Drive"))
  if (more.length) blocks.push({ kind: "chips", items: more })

  const out: Message[] = [agent(blocks, "lib-panel")]
  for (const b of books.filter((x) => x.status === "ok" && x.brandbook)) out.push(brandBookMessage(b))
  return out
}

/** "Here’s what I learned from your brand book", with chips to apply each part. */
export function brandBookMessage(a: BrandAsset): Message {
  const b = a.brandbook!
  const items: { name: string; detail?: string; status: string; ok: boolean }[] = []
  if (b.colors.length) items.push({ name: "Colours", detail: b.colors.join("  "), status: b.applied?.colors ? "using these" : "", ok: !!b.applied?.colors })
  if (b.fonts.length) items.push({ name: "Fonts", detail: b.fonts.join(", "), status: b.applied?.fonts ? "using these" : "", ok: !!b.applied?.fonts })
  if (b.tone) items.push({ name: "Tone", detail: b.tone, status: b.applied?.rules ? "following it" : "", ok: !!b.applied?.rules })
  if (b.wordsToUse.length) items.push({ name: "Words to use", detail: b.wordsToUse.join(", "), status: b.applied?.rules ? "following it" : "", ok: !!b.applied?.rules })
  if (b.wordsToAvoid.length) items.push({ name: "Words to avoid", detail: b.wordsToAvoid.join(", "), status: b.applied?.rules ? "following it" : "", ok: !!b.applied?.rules })
  if (b.taglines.length) items.push({ name: "Taglines", detail: b.taglines.map((t) => `“${t}”`).join(", "), status: b.applied?.rules ? "following it" : "", ok: !!b.applied?.rules })
  if (b.audience) items.push({ name: "Who it’s for", detail: b.audience, status: b.applied?.rules ? "following it" : "", ok: !!b.applied?.rules })
  if (b.logoRules.length) items.push({ name: "Logo rules", detail: b.logoRules.join(" · "), status: "", ok: false })
  const writing = !!(b.tone || b.wordsToUse.length || b.wordsToAvoid.length || b.taglines.length || b.audience)
  const chips: Chip[] = []
  const todo = [b.colors.length && !b.applied?.colors, b.fonts.length && !b.applied?.fonts, writing && !b.applied?.rules].filter(Boolean).length
  if (todo > 1) chips.push(op({ op: "bb-apply", id: a.id, what: "all" }, "Use all of it", true))
  if (b.colors.length && !b.applied?.colors) chips.push(op({ op: "bb-apply", id: a.id, what: "colors" }, "Use these colours"))
  if (b.fonts.length && !b.applied?.fonts) chips.push(op({ op: "bb-apply", id: a.id, what: "fonts" }, "Use these fonts"))
  if (writing && !b.applied?.rules) chips.push(op({ op: "bb-apply", id: a.id, what: "rules" }, "Write by these rules"))
  if (b.applied?.rules) chips.push(op({ op: "bb-unapply", id: a.id }, "Stop following its writing rules"))
  const blocks: Block[] = [
    { kind: "text", text: "Here’s what I learned from your brand book" },
    { kind: "sources", title: a.name, items },
  ]
  if (chips.length) blocks.push({ kind: "chips", items: chips })
  else blocks.push({ kind: "text", text: "I’m using all of it. Your posts, emails and replies follow it from now on." })
  return agent(blocks, `lib-bb-${a.id}`)
}

/** Writing rules from a brand book, as lines for voiceText(). */
export function bookRules(b: BrandBook): string[] {
  return [
    b.tone && `Tone: ${b.tone}`,
    b.audience && `Who it's for: ${b.audience}`,
    b.wordsToUse.length && `Words to use: ${b.wordsToUse.join(", ")}`,
    b.wordsToAvoid.length && `Never use: ${b.wordsToAvoid.join(", ")}`,
    b.taglines.length && `Taglines (copy exactly, only where they fit): ${b.taglines.map((t) => `"${t}"`).join(", ")}`,
  ].filter(Boolean) as string[]
}

