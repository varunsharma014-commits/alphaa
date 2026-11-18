// "How your images look", inside the "Your brand & voice" thread: three (or four) ways a social
// image can look, a sample of each, and the owner's photo library. One tap to switch.
// Server only (reads the library and settings). Ops go to /api/agent/voice ("img-*").
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import { imageUrl } from "@/lib/images"
import { aiImagesAvailable, imageSettings, saveImageSettings, styleSample, type ImageStyle } from "@/lib/post-images"
import { listPhotos, MAX_PHOTOS, type BrandPhoto } from "@/lib/brand-photos"
import { canvaConfigured } from "@/lib/canva/client"
import { getCanvaAccount } from "@/lib/canva/store"
import { canvaMessages } from "@/lib/canva/narration"

/** Owner-only (signed-in) view of a library photo. */
const photoUrl = (id: string) => `/api/agent/photos/${id}`

const op = (body: Record<string, string>, label: string, on = false): Chip => ({ label: on ? `✓ ${label}` : label, primary: on, action: { type: "agent-op", endpoint: "voice", body } })

export function addPhotosChip(label = "Add my photos"): Chip {
  return { label, action: { type: "agent-op", endpoint: "voice", body: { op: "img-photo-added" }, form: {
    text: "Add photos of your work, your place or what you sell. JPG or PNG, up to 8 MB each. Only use photos you took or own.",
    fields: [{ name: "photos", label: "Photos", type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true, upload: "/api/agent/photos", required: true }],
    cta: "Add them",
    fine: "I clean each photo before I keep it (location data from your phone is removed).",
  } } }
}

const NAME: Record<ImageStyle, string> = { card: "Text card", photo: "My photos", ai: "AI-made picture", canva: "My Canva template" }

export async function imagesMessages(userId: string, opts: { growth?: boolean } = {}): Promise<Message[]> {
  const [s, photos, canva] = await Promise.all([imageSettings(userId), listPhotos(userId), canvaConfigured() ? getCanvaAccount(userId) : Promise.resolve(null)])
  const style = s.style
  const canvaReady = !!(canva && s.canvaTemplate)
  // Samples: the card always; a photo one when there are photos; AI and Canva once made.
  const [card, photo] = await Promise.all([styleSample(userId, "card"), photos.length ? styleSample(userId, "photo").catch(() => null) : Promise.resolve(null)])
  const ai = s.samples?.ai ?? null
  const canvaSample = canvaReady ? s.samples?.canva ?? null : null
  const tall = (s.size ?? "square") === "portrait"

  const blocks: Block[] = [
    { kind: "text", text: "How your images look" },
    { kind: "text", text: `Every social post gets a picture with a short headline and your logo. ${style === "card" ? "Right now it’s your colour with the headline." : style === "photo" ? "Right now I use your own photos, a different one each time." : style === "ai" ? "Right now I make a picture with AI for each post." : "Right now I fill your Canva template."} Pick what fits you.` },
  ]
  const sample = (st: ImageStyle, id: string | null, meta: string, text: string) => blocks.push({ kind: "doc", title: NAME[st], meta: style === st ? `using this · ${meta}` : meta, text, ...(id ? { image: imageUrl(id), square: st === "card" || !tall } : {}) })
  sample("card", card, "your colour and logo", "Clean and quick to read. Always works.")
  sample("photo", photo, photos.length ? `${photos.length} of your photos` : "no photos yet", photos.length ? "Your real work, your real place. People stop for real photos." : "Add a few photos, or connect your Google listing, and I’ll use them.")
  if (aiImagesAvailable()) sample("ai", ai, "AI-made picture", "A picture made by AI for each topic. It never shows people, faces, text or logos. Use it when you don’t have photos.")
  if (canvaReady) sample("canva", canvaSample, s.canvaTemplate!.title, "Your own Canva brand template, filled with each post’s headline.")

  const chips: Chip[] = [op({ op: "img-style", value: "card" }, NAME.card, style === "card"), op({ op: "img-style", value: "photo" }, NAME.photo, style === "photo")]
  if (aiImagesAvailable()) chips.push(op({ op: "img-style", value: "ai" }, NAME.ai, style === "ai"))
  if (canvaReady) chips.push(op({ op: "img-style", value: "canva" }, NAME.canva, style === "canva"))
  blocks.push({ kind: "chips", items: chips })
  if (style === "photo" || style === "ai") {
    blocks.push({ kind: "text", text: "Shape" })
    blocks.push({ kind: "chips", items: [op({ op: "img-size", value: "square" }, "Square", !tall), op({ op: "img-size", value: "portrait" }, "Tall (fills more of the feed)", tall)] })
  }
  if (aiImagesAvailable() && !ai) blocks.push({ kind: "chips", items: [op({ op: "img-sample", value: "ai" }, "Show me an AI-made sample")] })
  const out: Message[] = [agent(blocks, "vc-images")]
  out.push(photosMessage(photos))
  if (canvaConfigured()) {
    if (s.canvaNote) await saveImageSettings(userId, { canvaNote: null })
    out.push(...canvaMessages(canva, { growth: opts.growth ?? true, templates: !!canva?.templates, template: s.canvaTemplate?.title ?? null, note: s.canvaNote ?? null }))
  }
  return out
}

function photosMessage(photos: BrandPhoto[]): Message {
  const by = (src: BrandPhoto["source"]) => photos.filter((p) => p.source === src).length
  const parts = [by("google") && `${by("google")} from your Google listing`, by("website") && `${by("website")} from your website`, by("upload") && `${by("upload")} you added`, by("canva") && `${by("canva")} from your Canva`].filter(Boolean) as string[]
  const blocks: Block[] = [
    { kind: "text", text: photos.length ? `Your photos: ${photos.length}${parts.length ? ` (${parts.join(", ")})` : ""}. I use the one used least, so posts don’t repeat.` : "I don’t have any of your photos yet. I look on your Google listing and your website, or you can add some here." },
  ]
  // The newest few, each removable.
  for (const p of [...photos].reverse().slice(0, 4)) {
    blocks.push({ kind: "doc", title: p.source === "google" ? "From your Google listing" : p.source === "website" ? "From your website" : p.source === "canva" ? "From your Canva" : "You added this", meta: p.usedCount ? `used ${p.usedCount}×` : "not used yet", text: "", image: photoUrl(p.id), square: true })
    blocks.push({ kind: "chips", items: [op({ op: "img-photo-remove", id: p.id }, "Don’t use this one")] })
  }
  const chips: Chip[] = []
  if (photos.length < MAX_PHOTOS) chips.push(addPhotosChip(photos.length ? "Add more photos" : "Add my photos"))
  chips.push(op({ op: "img-photos-sync" }, "Look for my photos again"))
  blocks.push({ kind: "chips", items: chips })
  return agent(blocks, "vc-photos")
}
