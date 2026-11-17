export const dynamic = "force-dynamic"
export const maxDuration = 180

import { NextResponse } from "next/server"
import { safeFetch } from "@/lib/safe-fetch"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { writePost, writeMeta, writeLocationPage } from "@/lib/content"
import { getAgentSettings } from "@/lib/agent/settings"
import { generatePostImage } from "@/lib/images"

// Writes a short, publish-ready FAQ section that closes a competitor gap —
// from the business's own facts only. Unknown facts become [bracketed]
// placeholders so nothing is invented. Logged to the ledger as a draft.
const body = z.object({
  topic: z.string().min(3).max(200),
  competitor: z.string().max(200).optional(),
  // post: a blog post; meta: page title + description; location: a location page.
  mode: z.enum(["faq", "post", "meta", "location"]).optional(),
  url: z.string().url().max(500).optional(),
  locationId: z.string().max(40).optional(),
})

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
      const page = await safeFetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" }, signal: AbortSignal.timeout(8000) }).then((r) => r.text()).catch(() => "")
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
  } catch (err) {
    console.error("[agent/draft]", input.mode, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
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
