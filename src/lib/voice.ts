// How the business sounds. The agent reads the owner's own words (homepage, about, services, a
// blog post, the replies they wrote to Google reviews), writes three ways it could sound, and
// uses the closest match until the owner picks one. The owner can also set the language,
// formality, emoji, length and "we"/"I", or write the voice in their own words.
//
// Kept in agent settings (`voice`), NOT in User.voiceDescription: that field is the business's
// own description and also feeds the schema markup and llms.txt.
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { safeFetch } from "@/lib/safe-fetch"
import { anthropic } from "@/lib/claude"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"

export type Formality = "relaxed" | "balanced" | "formal"
export type VoiceStyle = {
  language: string
  formality: Formality
  emoji: "none" | "few"
  length: "short" | "normal"
  person: "we" | "i"
}
export type VoiceOption = { id: string; name: string; summary: string; guide: string; sample: string }
export type Voice = {
  analyzedAt: string
  /** What I read, in owner words ("your homepage", "4 of your review replies"). */
  read: string[]
  detected: Omit<VoiceStyle, "length">
  phrases: string[]
  avoid: string[]
  options: VoiceOption[]
  /** An option id, or "custom" for the owner's own words. */
  chosen: string
  custom?: string
  style: VoiceStyle
  /** Set once the owner picks anything; until then I use my closest match. */
  pickedAt?: string
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
const MODEL = "claude-opus-5-5"

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>|<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim()
}

async function get(url: string): Promise<string> {
  try {
    const r = await safeFetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) })
    return r.ok ? await r.text() : ""
  } catch {
    return ""
  }
}

function link(home: string, base: string, re: RegExp, not?: RegExp): string | null {
  const host = new URL(base).host
  for (const m of home.matchAll(/href=["']([^"'#?]+)["']/gi)) {
    const href = m[1]
    if (!re.test(href) || (not && not.test(href))) continue
    try {
      const u = new URL(href, base)
      if (u.host === host) return u.toString()
    } catch { /* skip */ }
  }
  return null
}

const Schema = z.object({
  language: z.string().describe("The language the website is written in, as its English name, e.g. English, French, Spanish, Arabic"),
  formality: z.enum(["relaxed", "balanced", "formal"]),
  emoji: z.enum(["none", "few"]),
  person: z.enum(["we", "i"]).describe("Do they speak as the business (we) or as the owner (I)?"),
  phrases: z.array(z.string()).describe("3 to 6 words or short phrases they actually use, copied exactly from the text"),
  avoid: z.array(z.string()).describe("2 to 4 things that would sound off-brand for them"),
  options: z.array(z.object({
    name: z.string().describe("2 to 4 plain words, e.g. 'Like your website', 'Warmer and chattier', 'Straight to the point'"),
    summary: z.string().describe("One sentence telling the owner what this voice is like"),
    guide: z.string().describe("3 to 5 short lines of writing instructions someone else could follow"),
    sample: z.string().describe("A 2 to 3 sentence social post in this voice, about something the text actually mentions"),
  })).describe("Exactly 3 options"),
})

/** Read the owner's own words and write three voice options. Null when there's too little to go on. */
export async function analyzeVoice(userId: string): Promise<Voice | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { websiteUrl: true, businessName: true, businessType: true, voiceDescription: true } })
  if (!user) return null
  return analyzeVoiceFor({ ...user, userId })
}

/** The same, for any website (a visitor with no account yet has no userId, so no review replies). */
export async function analyzeVoiceFor(user: { websiteUrl: string | null; businessName: string | null; businessType: string | null; voiceDescription?: string | null; userId?: string }): Promise<Voice | null> {
  const userId = user.userId
  const read: string[] = []
  const parts: string[] = []
  let lang = ""
  if (user.websiteUrl) {
    const base = user.websiteUrl.startsWith("http") ? user.websiteUrl : `https://${user.websiteUrl}`
    const home = await get(base)
    if (home) {
      lang = home.match(/<html[^>]*\blang=["']?([a-zA-Z-]{2,10})/i)?.[1] ?? ""
      parts.push(`HOMEPAGE\n${textOf(home).slice(0, 4000)}`)
      read.push("your homepage")
      const pages: [string, string | null][] = [
        ["about page", link(home, base, /about|our-story|who-we-are|a-propos|quienes|uber-uns/i)],
        ["services page", link(home, base, /services|what-we-do|treatments|menu|products|solutions/i)],
        ["latest blog post", link(home, base, /\/(blog|news|articles?)\/[^/]+/i, /\/(tag|category|page)\//i)],
      ]
      const got = await Promise.all(pages.map(async ([label, url]) => [label, url ? await get(url) : ""] as const))
      for (const [label, html] of got) {
        const t = textOf(html).slice(0, 2500)
        if (t.length < 200) continue
        parts.push(`${label.toUpperCase()}\n${t}`)
        read.push(`your ${label}`)
      }
    }
  }
  // Replies the owner wrote themselves (not ones I drafted).
  const [replies, mine] = userId ? await Promise.all([
    db.gmbReview.findMany({ where: { userId, reply: { not: null } }, orderBy: { publishedAt: "desc" }, take: 12, select: { reply: true } }),
    db.mockActivity.findMany({ where: { userId, type: "review_draft" }, select: { metadata: true }, take: 200 }),
  ]) : [[], []]
  const drafted = new Set(mine.map((m) => ((m.metadata as { text?: string } | null)?.text ?? "").trim()))
  const own = replies.map((r) => (r.reply ?? "").trim()).filter((r) => r.length > 20 && !drafted.has(r)).slice(0, 6)
  if (own.length) {
    parts.push(`REPLIES THE OWNER WROTE TO GOOGLE REVIEWS\n${own.map((r) => `- ${r.slice(0, 400)}`).join("\n")}`)
    read.push(own.length === 1 ? "a reply you wrote to a Google review" : `${own.length} replies you wrote to Google reviews`)
  }
  if (user.voiceDescription?.trim()) parts.push(`HOW THE OWNER DESCRIBES THE BUSINESS\n${user.voiceDescription.slice(0, 800)}`)
  const sample = parts.join("\n\n")
  if (sample.length < 400) return null

  const msg = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 6000,
    output_config: { effort: "medium", format: zodOutputFormat(Schema) },
    messages: [{
      role: "user",
      content: `Below is writing from ${user.businessName ?? "a small business"}${user.businessType ? ` (${user.businessType})` : ""}: their own website and, if any, review replies the owner wrote.${lang ? ` The page says its language is "${lang}".` : ""}

Work out how they write, so an assistant can write their social posts, emails, ads and review replies so they sound like the owner wrote them.

Then give exactly 3 voice options the owner can choose from:
1. The first is how they sound today, as close as you can get it. Name it "Like your website".
2. The other two are clearly different choices this owner might prefer (for example warmer and more personal, or more expert and direct, or more playful). Pick the two that make sense for this business.

Write each option's name, summary and guide in English (the owner reads them in an English app). Write the samples in the website's language.
Rules for the samples: Use only facts that appear in the text. No prices, numbers, years, awards or guarantees unless they are in the text. No hashtags. Never say "best", "#1" or "leading".

${sample}`,
    }],
  })
  const out = msg.parsed_output
  if (!out || out.options.length < 3) return null
  const lower = sample.toLowerCase()
  const options = out.options.slice(0, 3).map((o, i) => ({ id: `v${i + 1}`, name: o.name.trim().slice(0, 40), summary: o.summary.trim().slice(0, 240), guide: o.guide.trim().slice(0, 700), sample: o.sample.trim().slice(0, 600) }))
  const detected = { language: out.language.trim().slice(0, 30) || "English", formality: out.formality, emoji: out.emoji, person: out.person }
  return {
    analyzedAt: new Date().toISOString(),
    read,
    detected,
    phrases: out.phrases.map((p) => p.trim()).filter((p) => p && lower.includes(p.toLowerCase())).slice(0, 6),
    avoid: out.avoid.map((a) => a.trim()).filter(Boolean).slice(0, 4),
    options,
    chosen: options[0].id,
    style: { ...detected, length: "normal" },
  }
}

const FORMALITY: Record<Formality, string> = {
  relaxed: "Relaxed and friendly, like talking to a regular customer.",
  balanced: "Friendly but professional.",
  formal: "Formal and polished. No slang.",
}

/** The voice as writing instructions for any prompt. */
export function voiceText(v: Voice): string {
  const guide = v.chosen === "custom" && v.custom ? v.custom : v.options.find((o) => o.id === v.chosen)?.guide ?? v.options[0]?.guide ?? ""
  const s = v.style
  return [
    "HOW TO WRITE FOR THIS BUSINESS (the owner chose this; follow it):",
    guide,
    `Language: write everything in ${s.language}.`,
    `Tone: ${FORMALITY[s.formality]}`,
    s.emoji === "none" ? "Emoji: none." : "Emoji: at most one, only where it feels natural.",
    s.length === "short" ? "Length: short. Cut any sentence that doesn't add something." : "Length: normal.",
    s.person === "we" ? "Speak as the business (\"we\")." : "Speak as the owner (\"I\").",
    v.phrases.length ? `Words they use: ${v.phrases.map((p) => `"${p}"`).join(", ")}.` : "",
    v.avoid.length ? `Avoid: ${v.avoid.join("; ")}.` : "",
  ].filter(Boolean).join("\n")
}

/** The saved voice as prompt text, or null if I haven't learned it yet. */
export async function voiceFor(userId: string): Promise<string | null> {
  const v = (await getAgentSettings(userId)).voice
  return v ? voiceText(v) : null
}

/** The saved voice, learning it first (closest match, not yet confirmed by the owner) if needed. */
export async function ensureVoice(userId: string, opts: { force?: boolean } = {}): Promise<Voice | null> {
  const s = await getAgentSettings(userId)
  if (s.voice && !opts.force) return s.voice
  const v = await analyzeVoice(userId)
  if (!v) return s.voice ?? null
  // Re-reading the site keeps what the owner already chose.
  const keep = opts.force && s.voice?.pickedAt ? { style: s.voice.style, custom: s.voice.custom, chosen: s.voice.chosen === "custom" ? "custom" : v.chosen, pickedAt: s.voice.pickedAt } : {}
  const next = { ...v, ...keep }
  await saveAgentSettings(userId, { voice: next })
  await db.mockActivity.create({ data: { userId, type: "voice_learned", title: "Learned how your business sounds from your website", metadata: { read: v.read, options: v.options.map((o) => o.name) } } })
  return next
}

/** Prompt text for the voice, learning it first if needed. Kept for older callers. */
export async function learnVoice(userId: string, opts: { force?: boolean } = {}): Promise<string | null> {
  const v = await ensureVoice(userId, opts)
  return v ? voiceText(v) : null
}
