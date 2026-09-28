export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { writePost, writeMeta, writeLocationPage, writeOutreach } from "@/lib/content"
import { getAgentSettings } from "@/lib/agent/settings"
import { generatePostImage } from "@/lib/images"

// Writes a short, publish-ready FAQ section that closes a competitor gap —
// from the business's own facts only. Unknown facts become [bracketed]
// placeholders so nothing is invented. Logged to the ledger as a draft.
const body = z.object({
  topic: z.string().min(3).max(200),
  competitor: z.string().max(200).optional(),
  // mode "reply": a reply the owner posts themselves in a discussion the AIs cite.
  // post: a blog post; meta: page title + description; location: a location page;
  // outreach: email to a "best of" list / steps for a directory the AIs read.
  mode: z.enum(["faq", "reply", "post", "meta", "location", "outreach"]).optional(),
  url: z.string().url().max(500).optional(),
  locationId: z.string().max(40).optional(),
  kind: z.string().max(20).optional(),
})

async function threadText(url: string): Promise<string> {
  try {
    if (/reddit\.com/.test(url)) {
      const res = await fetch(url.replace(/\/?(\?.*)?$/, ".json"), { headers: { "User-Agent": "Mozilla/5.0 (compatible; AlphaaBot/1.0)" }, signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const j = (await res.json()) as { data?: { children?: { data?: { title?: string; selftext?: string; body?: string } }[] } }[]
        const post = j[0]?.data?.children?.[0]?.data
        const comments = (j[1]?.data?.children ?? []).slice(0, 8).map((c) => c.data?.body).filter(Boolean)
        return [post?.title, post?.selftext, ...comments].filter(Boolean).join("\n---\n").slice(0, 5000)
      }
    }
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return ""
    return (await res.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 5000)
  } catch {
    return ""
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  let input: z.infer<typeof body>
  try {
    input = body.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const facts = [
    `Business: ${user.businessName ?? "unknown"}`,
    `Type: ${user.businessType ?? "unknown"}`,
    `Location: ${[user.city, user.state].filter(Boolean).join(", ") || "unknown"}`,
    `Website: ${user.websiteUrl ?? "unknown"}`,
    user.voiceDescription ? `Voice: ${user.voiceDescription}` : "",
    user.topicsToAvoid ? `Avoid: ${user.topicsToAvoid}` : "",
  ].filter(Boolean).join("\n")

  try {
    if (input.mode === "post") {
      const p = await writePost(user, input.topic === "auto" ? undefined : input.topic)
      const img = await generatePostImage(user.id, { title: p.title, businessType: user.businessType, city: user.city })
      const row = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: `Drafted a post: “${p.title}”`, metadata: { ...p, status: "ready", imageId: img?.id ?? null } } })
      return NextResponse.json({ title: p.title, text: p.markdown, draftId: row.id, image: img?.url ?? null })
    }
    if (input.mode === "meta") {
      const url = input.url ?? user.websiteUrl ?? ""
      const page = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" }, signal: AbortSignal.timeout(8000) }).then((r) => r.text()).catch(() => "")
      const currentTitle = page.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim() ?? null
      const currentDescription = page.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] ?? null
      const text = await writeMeta(user, { url, currentTitle, currentDescription })
      return NextResponse.json({ title: "Page title & description", text, current: { title: currentTitle, description: currentDescription } })
    }
    if (input.mode === "location") {
      const loc = (await getAgentSettings(user.id)).locations?.find((l) => l.id === input.locationId)
      if (!loc) return NextResponse.json({ error: "I can’t find that location." }, { status: 404 })
      const p = await writeLocationPage(user, loc)
      await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Drafted the ${loc.city} location page`, metadata: { ...p, locationId: loc.id } } })
      return NextResponse.json({ title: p.title, text: p.markdown })
    }
    if (input.mode === "outreach" && input.url) {
      const pageText = await threadText(input.url)
      const text = await writeOutreach(user, { url: input.url, title: input.topic, kind: input.kind ?? "bestof" }, pageText)
      await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Drafted outreach for “${input.topic.slice(0, 80)}”`, metadata: { url: input.url, text } } })
      return NextResponse.json({ title: input.topic, text })
    }
  } catch (err) {
    console.error("[agent/draft]", input.mode, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
  }

  if (input.mode === "reply" && input.url) {
    const thread = await threadText(input.url)
    try {
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `A local discussion that AI assistants read when recommending businesses: "${input.topic}" (${input.url}).
${thread ? `What the thread says:\n${thread}\n` : "(The thread text couldn't be loaded — go by the title.)"}
Write a reply the business owner will post from their own account. Rules: be genuinely helpful first — answer what was asked, with practical advice anyone could use. Say plainly, once, that they own the business (e.g. "Full disclosure, I run ${user.businessName ?? "[business name]"}"). No hype, no "best", no discount codes, no links unless the thread asks for one. Under 120 words. Use only the facts below; write [brackets] for anything you'd have to invent. Output only the reply.

FACTS
${facts}`,
        }],
      })
      const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : ""
      if (!text) throw new Error("empty")
      await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Drafted a reply for “${input.topic.slice(0, 80)}”`, metadata: { topic: input.topic, url: input.url, text, mode: "reply" } } })
      return NextResponse.json({ title: input.topic, text })
    } catch (err) {
      console.error("[agent/draft reply]", err instanceof Error ? err.message : err)
      return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
    }
  }

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `Write a short FAQ section (3 questions, about 300 words total) for this business's website on the topic: "${input.topic}". It should be the page an AI assistant quotes when a customer asks about this.

Rules: each question as a line starting "Q: ", each answer starting "A: " whose first sentence answers directly. Plain English. Use only the facts below; for anything you don't know (prices, hours, policies, insurance accepted, years in business) write a [bracketed placeholder] instead of inventing it. No marketing fluff, no claims of being "the best". Output only the Q/A lines.

FACTS
${facts}`,
      }],
    })
    const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : ""
    if (!text) throw new Error("empty")
    await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Drafted an FAQ section: “${input.topic}”`, description: input.competitor ? `To close a gap with ${input.competitor}` : null, metadata: { topic: input.topic, text } } })
    return NextResponse.json({ title: input.topic, text })
  } catch (err) {
    console.error("[agent/draft]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
  }
}
