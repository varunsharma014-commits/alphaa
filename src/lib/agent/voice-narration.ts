// The "How I sound" thread: what I learned from the owner's own words, three voices to pick
// from, and the dials (language, formality, emoji, length, we/I). Every choice is one tap.
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import type { Voice, VoiceStyle } from "@/lib/voice"
import type { BrandKit } from "@/lib/brand-kit"

/** Logo, colours and a sample social image. `sample` is the image URL (built on the server). */
export function brandMessages(b: BrandKit | null | undefined, sample: string | null): Message[] {
  if (!b) {
    return [agent([
      { kind: "text", text: "I couldn’t read your logo and colours from your website yet." },
      { kind: "chips", items: [{ label: "Read my site again", action: { type: "agent-op", endpoint: "voice", body: { op: "brand-read" } } }, colorChip(), logoChip()] },
    ], "vc-brand")]
  }
  const colors = Array.from(new Set([...(b.primary ? [b.primary] : []), ...b.colors])).slice(0, 4)
  return [agent([
    { kind: "text", text: "Your brand", big: true },
    { kind: "text", text: `${b.logo ? "I found your logo" : "I didn’t find a logo"}${b.primary ? ` and your main colour, ${b.primary}` : ""}${b.font ? `. Your site uses the ${b.font} font` : ""}. Every social image I make uses them, with a short headline people get in two seconds.` },
    ...(sample ? [{ kind: "doc", title: "How your social images will look", meta: b.source === "owner" ? "your choices" : "from your website", image: sample, square: true, text: "" } as const] : []),
    { kind: "text", text: "Main colour" },
    { kind: "chips", items: [
      ...colors.map((c) => ({ label: b.primary === c ? `✓ ${c}` : c, primary: b.primary === c, action: { type: "agent-op" as const, endpoint: "voice" as const, body: { op: "brand-color", value: c } } })),
      colorChip(),
    ] },
    { kind: "chips", items: [logoChip(!!b.logo), { label: "Read my site again", action: { type: "agent-op", endpoint: "voice", body: { op: "brand-read" } } }] },
  ], "vc-brand")]
}

function colorChip(): Chip {
  return { label: "Another colour", action: { type: "agent-op", endpoint: "voice", body: { op: "brand-color" }, form: {
    text: "Which colour should your images use? Paste the colour code, like #1A73E8.",
    fields: [{ name: "value", label: "Colour code", type: "text", placeholder: "#1A73E8", required: true }],
    cta: "Use it",
  } } }
}
function logoChip(has = false): Chip {
  return { label: has ? "Use a different logo" : "Add my logo", action: { type: "agent-op", endpoint: "voice", body: { op: "brand-logo" }, form: {
    text: "Paste a link to your logo (a PNG, JPG or SVG). Right-click your logo on your website and choose “Copy image address”.",
    fields: [{ name: "value", label: "Logo link", type: "url", placeholder: "https://…/logo.png", required: true }],
    cta: "Use this logo",
  } } }
}

export const VOICE_LANGUAGES = ["English", "French", "Spanish", "German", "Portuguese", "Italian", "Arabic", "Hindi", "Chinese"]

const FORMALITY_WORD: Record<VoiceStyle["formality"], string> = { relaxed: "relaxed and friendly", balanced: "friendly but professional", formal: "formal and polished" }

const op = (body: Record<string, string>, label: string, on: boolean): Chip => ({
  label: on ? `✓ ${label}` : label,
  action: { type: "agent-op", endpoint: "voice", body },
  primary: on,
})

export function voiceRunMessage(): Message {
  return agent([
    { kind: "text", text: "Let me read your website first.", big: true },
    { kind: "steps", items: ["Finding your logo and colours", "Reading your about and services pages", "Reading replies you wrote to your reviews", "Writing three ways I could sound"], done: 0, ticker: [["Looking at your headlines", "Noting the words you use"], ["Seeing how you describe what you do"], ["Hearing how you talk to customers"], ["Matching your tone", "Writing an example for each"]] },
  ], "voice-run")
}

export function voiceMessages(v: Voice | null | undefined): Message[] {
  if (!v) {
    return [agent([
      { kind: "text", text: "I couldn’t read enough of your writing to learn your voice.", big: true },
      { kind: "text", text: "Tell me in your own words how you like to sound, or add your website in your business details and I’ll read it." },
      { kind: "chips", items: [customChip("Describe my voice"), { label: "Try reading my site again", action: { type: "agent-op", endpoint: "voice", body: { op: "learn" } } }] },
    ], "vc-none")]
  }
  const s = v.style
  const lang = s.language
  const out: Message[] = []

  out.push(agent([
    { kind: "text", text: v.pickedAt ? "Here’s how I write for you." : "Here’s how you sound today.", big: true },
    { kind: "text", text: `I read ${list(v.read)}. You write in ${v.detected.language}, ${FORMALITY_WORD[v.detected.formality]}, and speak as “${v.detected.person === "we" ? "we" : "I"}”.` },
    ...(v.phrases.length ? [{ kind: "receipt", title: "Words you use", sub: "I’ll keep using them", items: v.phrases.map((p) => `“${p}”`) } as Block] : []),
  ], "vc-now"))

  const blocks: Block[] = [
    { kind: "text", text: v.pickedAt ? "Your posts, emails, ads and review replies use the one marked “using this”. Switch any time." : "Pick how I should sound in your posts, emails, ads and review replies. Until you choose, I use the first one." },
  ]
  for (const [i, o] of v.options.entries()) {
    const on = v.chosen === o.id
    blocks.push({ kind: "doc", title: o.name, meta: on ? "using this" : i === 0 ? "matches your website" : undefined, text: `${o.summary}\n\nExample:\n${o.sample}` })
  }
  if (v.custom) blocks.push({ kind: "doc", title: "In your own words", meta: v.chosen === "custom" ? "using this" : undefined, text: v.custom })
  blocks.push({ kind: "chips", items: [
    ...v.options.map((o) => op({ op: "pick", id: o.id }, `Use “${o.name}”`, v.chosen === o.id && !!v.pickedAt)),
    ...(v.custom ? [op({ op: "pick", id: "custom" }, "Use my own words", v.chosen === "custom")] : []),
    customChip(v.custom ? "Edit my own words" : "Describe it in my own words", v.custom),
  ] })
  out.push(agent(blocks, "vc-options"))

  const langs = Array.from(new Set([v.detected.language, ...(lang !== v.detected.language ? [lang] : []), ...(v.detected.language === "English" ? [] : ["English"])]))
  out.push(agent([
    { kind: "text", text: "Fine-tune it. Each one is a single tap." },
    { kind: "text", text: "Language" },
    { kind: "chips", items: [
      ...langs.map((l) => op({ op: "style", key: "language", value: l }, l, lang === l)),
      { label: "Another language", action: { type: "agent-op", endpoint: "voice", body: { op: "style", key: "language" }, form: {
        text: "Which language should I write in?",
        fields: [{ name: "value", label: "Language", type: "text", placeholder: VOICE_LANGUAGES.filter((x) => !langs.includes(x)).slice(0, 3).join(", "), required: true }],
        cta: "Use it",
      } } },
    ] },
    { kind: "text", text: "Tone" },
    { kind: "chips", items: (["relaxed", "balanced", "formal"] as const).map((f) => op({ op: "style", key: "formality", value: f }, f === "relaxed" ? "Relaxed" : f === "balanced" ? "Balanced" : "Formal", s.formality === f)) },
    { kind: "text", text: "Emoji" },
    { kind: "chips", items: [op({ op: "style", key: "emoji", value: "none" }, "None", s.emoji === "none"), op({ op: "style", key: "emoji", value: "few" }, "A few", s.emoji === "few")] },
    { kind: "text", text: "Length" },
    { kind: "chips", items: [op({ op: "style", key: "length", value: "short" }, "Short and punchy", s.length === "short"), op({ op: "style", key: "length", value: "normal" }, "Normal", s.length === "normal")] },
    { kind: "text", text: "Speak as" },
    { kind: "chips", items: [op({ op: "style", key: "person", value: "we" }, "“We” (the business)", s.person === "we"), op({ op: "style", key: "person", value: "i" }, "“I” (you, the owner)", s.person === "i")] },
  ], "vc-style"))

  out.push(agent([
    { kind: "text", text: `Last read ${new Date(v.analyzedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. If your website changes, I can read it again and keep your choices.` },
    { kind: "chips", items: [{ label: "Read my site again", action: { type: "agent-op", endpoint: "voice", body: { op: "learn" } } }] },
  ], "vc-again"))
  return out
}

function customChip(label: string, value?: string): Chip {
  return { label, action: { type: "agent-op", endpoint: "voice", body: { op: "custom" }, form: {
    text: "Describe how you want to sound, the way you’d explain it to a new employee. For example: “Warm and down to earth. Short sentences. Never pushy. We call customers by their first name.”",
    fields: [{ name: "text", label: "How I should sound", type: "textarea", value: value ?? "", required: true }],
    cta: "Use this",
  } } }
}

function list(a: string[]): string {
  if (a.length <= 1) return a[0] ?? "your website"
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`
}
