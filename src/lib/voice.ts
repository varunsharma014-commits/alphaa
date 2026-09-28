// Learns how a business sounds from its own website, once, so every post,
// page and reply the agent writes reads like the owner wrote it. Saved to
// User.voiceDescription (the owner can edit it; we never overwrite theirs).
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim()
}

async function get(url: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) })
    return r.ok ? await r.text() : ""
  } catch {
    return ""
  }
}

/** Reads the homepage + about page and writes a short voice guide. Returns null if the site can't be read. */
export async function learnVoice(userId: string, opts: { force?: boolean } = {}): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user?.websiteUrl) return null
  if (user.voiceDescription?.trim() && !opts.force) return user.voiceDescription
  const base = user.websiteUrl.startsWith("http") ? user.websiteUrl : `https://${user.websiteUrl}`
  const home = await get(base)
  if (!home) return null
  const aboutHref = home.match(/href=["']([^"']*(?:about|our-story|who-we-are)[^"']*)["']/i)?.[1]
  const about = aboutHref ? await get(new URL(aboutHref, base).toString()) : ""
  const sample = `${textOf(home).slice(0, 4000)}\n\n${textOf(about).slice(0, 2500)}`.trim()
  if (sample.length < 300) return null
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Here is text from a business's own website. Describe how they write, so someone else can write new pages that sound like them.
Write 4 short lines, plain English, no preamble:
Tone: …
Talks to customers as: … (e.g. "you", first names, formal)
Words and phrases they use: … (3–6, quoted from the text)
Avoid: … (what would sound off-brand)

WEBSITE TEXT
${sample}`,
    }],
  })
  const voice = res.content.find((c) => c.type === "text")?.text?.trim()
  if (!voice || voice.length < 40) return null
  await db.user.update({ where: { id: userId }, data: { voiceDescription: voice.slice(0, 1200) } })
  await db.mockActivity.create({ data: { userId, type: "voice_learned", title: "Learned how your business sounds from your website", metadata: { voice } } })
  return voice
}
