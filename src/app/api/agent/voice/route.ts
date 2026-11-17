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
])

const STYLE_VALUES: Record<string, string[] | null> = {
  language: null,
  formality: ["relaxed", "balanced", "formal"],
  emoji: ["none", "few"],
  length: ["short", "normal"],
  person: ["we", "i"],
}

/** The whole thread: brand first, then voice. */
function brandAndVoice(brand: BrandKit | null | undefined, voice: V | null | undefined) {
  return [...brandMessages(brand, brand?.sampleId ? imageUrl(brand.sampleId) : null), ...voiceMessages(voice)]
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const s = await getAgentSettings(user.id)
  return NextResponse.json({ messages: brandAndVoice(s.brand, s.voice) })
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
    return NextResponse.json({ messages: brandAndVoice(b, v) })
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
    return NextResponse.json({ messages: [agent([{ kind: "text", text: said }]), ...brandAndVoice(b, v)] })
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
