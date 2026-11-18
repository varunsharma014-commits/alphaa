export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { ensureVoice, type Voice } from "@/lib/voice"
import { brandMessages, voiceMessages } from "@/lib/agent/voice-narration"
import { ensureBrandKit, saveBrand, HEX_RE, type BrandKit } from "@/lib/brand-kit"
import { imageUrl } from "@/lib/images"
import type { Voice as V } from "@/lib/voice"
import { agent } from "@/lib/agent/types"
import { hasGrowth } from "@/lib/billing"
import { imagesMessages } from "@/lib/agent/images-panel"
import { aiImagesAvailable, imageSettings, saveImageSettings, styleSample } from "@/lib/post-images"
import { listPhotos, refreshPhotos, removePhoto } from "@/lib/brand-photos"

// "Your brand & voice": logo + colours, and the voice. Learn the voice from the owner's own words, pick one of three, or tune it.
// Every answer is the thread's messages, so the chat just shows them.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("learn") }),
  z.object({ op: z.literal("pick"), id: z.string().max(20) }),
  z.object({ op: z.literal("custom"), text: z.string().trim().min(10).max(1200) }),
  z.object({ op: z.literal("brand-read") }),
  z.object({ op: z.literal("brand-color"), value: z.string().trim().max(10) }),
  z.object({ op: z.literal("brand-logo"), value: z.string().trim().url().max(600) }),
  z.object({ op: z.literal("style"), key: z.enum(["language", "formality", "emoji", "length", "person"]), value: z.string().trim().min(1).max(30) }),
  // "How your images look" (lib/agent/images-panel.ts)
  z.object({ op: z.literal("img-style"), value: z.enum(["card", "photo", "ai", "canva"]) }),
  z.object({ op: z.literal("img-size"), value: z.enum(["square", "portrait"]) }),
  z.object({ op: z.literal("img-sample"), value: z.enum(["photo", "ai"]) }),
  z.object({ op: z.literal("img-photos-sync") }),
  z.object({ op: z.literal("img-photo-added"), photos: z.string().max(2000).optional() }),
  z.object({ op: z.literal("img-photo-remove"), id: z.string().min(5).max(40) }),
])

const STYLE_VALUES: Record<string, string[] | null> = {
  language: null,
  formality: ["relaxed", "balanced", "formal"],
  emoji: ["none", "few"],
  length: ["short", "normal"],
  person: ["we", "i"],
}

/** The whole thread: brand first, then how images look, then voice. */
async function brandAndVoice(user: { id: string; plan: string; email: string }, brand: BrandKit | null | undefined, voice: V | null | undefined) {
  const images = await imagesMessages(user.id, { growth: hasGrowth(user) }).catch((err) => { console.error("[voice] images panel", err instanceof Error ? err.message : err); return [] })
  return [...brandMessages(brand, brand?.sampleId ? imageUrl(brand.sampleId) : null), ...images, ...voiceMessages(voice)]
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  return NextResponse.json({ messages: await brandAndVoice(user, s.brand, s.voice) })
}

export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Write a sentence or two and I’ll use it." }, { status: 400 })
  }

  if (input.op === "learn") {
    const had = await getAgentSettings(user.id)
    // "Read my site again" (both learned) re-reads both; a first visit only fills what's missing.
    const again = !!had.voice && !!had.brand
    const [v, b] = await Promise.all([ensureVoice(user.id, { force: again }).catch(() => null), ensureBrandKit(user.id, { force: again }).catch(() => null)])
    return NextResponse.json({ messages: await brandAndVoice(user, b, v) })
  }
  if (input.op === "img-style" || input.op === "img-size" || input.op === "img-sample" || input.op === "img-photos-sync" || input.op === "img-photo-added" || input.op === "img-photo-remove") {
    const st = await getAgentSettings(user.id)
    let said = "Done."
    if (input.op === "img-style") {
      if (input.value === "ai" && !aiImagesAvailable()) return NextResponse.json({ error: "AI-made pictures are coming soon." }, { status: 409 })
      if (input.value === "canva" && !(await imageSettings(user.id)).canvaTemplate) return NextResponse.json({ error: "Pick a Canva brand template first." }, { status: 409 })
      await saveImageSettings(user.id, { style: input.value })
      if (input.value === "photo") {
        const r = await refreshPhotos(user.id).catch(() => null)
        const { listAssets } = await import("@/lib/library/store")
        const n = (r?.total ?? (await listPhotos(user.id)).length) + (await listAssets(user.id).catch(() => [])).filter((a) => a.kind === "photo" && a.status === "ok").length
        said = n ? `Done. Your posts use your own photos from now on, a different one each time (${n} so far).` : "Done. I didn’t find photos on your Google listing or website yet. Add a few below, and until then I use your text card."
      } else if (input.value === "ai") {
        await styleSample(user.id, "ai").catch(() => null)
        said = "Done. I make an AI picture for each post, never with people, faces, text or logos in it."
      } else said = input.value === "card" ? "Done. Your posts use your colour, headline and logo." : "Done. Your posts use your Canva template."
    } else if (input.op === "img-size") {
      await saveImageSettings(user.id, { size: input.value, samples: { ...(st.images?.samples ?? {}), photo: null, ai: null } })
      said = input.value === "portrait" ? "Done. Tall pictures from now on." : "Done. Square pictures from now on."
    } else if (input.op === "img-sample") {
      const id = await styleSample(user.id, input.value, { force: true }).catch(() => null)
      said = id ? "Here’s a sample." : input.value === "ai" ? "I couldn’t make an AI sample just now. Try again in a minute." : "Add a photo first and I’ll show you."
    } else if (input.op === "img-photos-sync") {
      const r = await refreshPhotos(user.id, { force: true })
      const found = r.google + r.website
      said = found ? `I found ${found} new ${found === 1 ? "photo" : "photos"}${r.google && r.website ? ` (${r.google} on your Google listing, ${r.website} on your website)` : r.google ? " on your Google listing" : " on your website"}.` : "No new photos this time. Add some here, or put them on your Google listing."
      if (found) await saveImageSettings(user.id, { samples: { ...(st.images?.samples ?? {}), photo: null } })
    } else if (input.op === "img-photo-added") {
      const n = (input.photos ?? "").split(",").filter(Boolean).length
      said = n ? `Added ${n === 1 ? "your photo" : `${n} photos`}.${st.images?.style !== "photo" ? " Tap “My photos” to use them on your posts." : ""}` : "Done."
      await saveImageSettings(user.id, { samples: { ...(st.images?.samples ?? {}), photo: null } })
    } else if (input.op === "img-photo-remove") {
      said = (await removePhoto(user.id, input.id)) ? "Removed. I won’t use that one." : "That photo isn’t here any more."
      await saveImageSettings(user.id, { samples: { ...(st.images?.samples ?? {}), photo: null } })
    }
    return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...(await brandAndVoice(user, st.brand, st.voice))] })
  }
  if (input.op === "brand-read" || input.op === "brand-color" || input.op === "brand-logo") {
    let b: BrandKit | null
    let said: string
    if (input.op === "brand-read") {
      b = await ensureBrandKit(user.id, { force: true }).catch(() => null)
      said = b ? "I read your website again." : "I couldn’t open your website just now."
    } else if (input.op === "brand-color") {
      const hex = input.value.startsWith("#") ? input.value.toLowerCase() : `#${input.value.toLowerCase()}`
      if (!HEX_RE.test(hex)) return NextResponse.json({ error: "That should look like #1A73E8." }, { status: 400 })
      b = await saveBrand(user.id, { primary: hex })
      said = `Done. Your images use ${hex} from now on.`
    } else {
      b = await saveBrand(user.id, { logo: input.value })
      said = b.sampleId ? "Done. Here’s how it looks." : "Saved. If the logo doesn’t show, try a PNG link."
    }
    const v = (await getAgentSettings(user.id)).voice
    // The photo sample carries the logo and colour: draw it again next time.
    const im = await imageSettings(user.id)
    if (im.samples?.photo) await saveImageSettings(user.id, { samples: { ...im.samples, photo: null } })
    return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...(await brandAndVoice(user, b, v))] })
  }

  const s = await getAgentSettings(user.id)
  const v = s.voice
  if (!v) {
    if (input.op !== "custom") return NextResponse.json({ error: "I haven’t learned your voice yet. Tap “Read my site again” first." }, { status: 409 })
  }
  const now = new Date().toISOString()
  let next: Voice
  let said: string
  if (input.op === "custom") {
    const base: Voice = v ?? { analyzedAt: now, read: [], detected: { language: "English", formality: "balanced", emoji: "none", person: "we" }, phrases: [], avoid: [], options: [], chosen: "custom", style: { language: "English", formality: "balanced", emoji: "none", length: "normal", person: "we" } }
    next = { ...base, custom: input.text, chosen: "custom", pickedAt: now }
    said = "Got it. Everything I write from now on follows your words."
  } else if (input.op === "pick") {
    const o = v!.options.find((x) => x.id === input.id)
    if (!o && !(input.id === "custom" && v!.custom)) return NextResponse.json({ error: "That option isn’t here any more." }, { status: 400 })
    next = { ...v!, chosen: input.id, pickedAt: now }
    said = `Done. I’ll write as “${o?.name ?? "your own words"}” from now on, in your posts, emails, ads and review replies.`
  } else {
    const allowed = STYLE_VALUES[input.key]
    const value = input.key === "language" ? input.value.replace(/[^\p{L} ()-]/gu, "").trim().replace(/^\p{L}/u, (c) => c.toUpperCase()) : input.value
    if (!value || (allowed && !allowed.includes(value))) return NextResponse.json({ error: "That one isn’t an option." }, { status: 400 })
    next = { ...v!, style: { ...v!.style, [input.key]: value }, pickedAt: now }
    said = input.key === "language" ? `Done. I’ll write in ${value} from now on.` : "Done. I’ll use that from now on."
  }
  await saveAgentSettings(user.id, { voice: next })
  return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...voiceMessages(next)] })
}
