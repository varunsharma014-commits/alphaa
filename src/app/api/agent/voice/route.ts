export const dynamic = "force-dynamic"
export const maxDuration = 120

import { NextResponse } from "next/server"
import { z } from "zod"
import { currentUser } from "@/lib/connector/user"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { ensureVoice, type Voice } from "@/lib/voice"
import { voiceMessages } from "@/lib/agent/voice-narration"
import { agent } from "@/lib/agent/types"

// "How I sound": learn the voice from the owner's own words, pick one of three, or tune it.
// Every answer is the thread's messages, so the chat just shows them.
const body = z.discriminatedUnion("op", [
  z.object({ op: z.literal("learn") }),
  z.object({ op: z.literal("pick"), id: z.string().max(20) }),
  z.object({ op: z.literal("custom"), text: z.string().trim().min(10).max(1200) }),
  z.object({ op: z.literal("style"), key: z.enum(["language", "formality", "emoji", "length", "person"]), value: z.string().trim().min(1).max(30) }),
])

const STYLE_VALUES: Record<string, string[] | null> = {
  language: null,
  formality: ["relaxed", "balanced", "formal"],
  emoji: ["none", "few"],
  length: ["short", "normal"],
  person: ["we", "i"],
}

export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ messages: voiceMessages((await getAgentSettings(user.id)).voice) })
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
    const had = !!(await getAgentSettings(user.id)).voice
    const v = await ensureVoice(user.id, { force: had }).catch(() => null)
    return NextResponse.json({ messages: voiceMessages(v) })
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
