export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"

// Writes a short, publish-ready FAQ section that closes a competitor gap —
// from the business's own facts only. Unknown facts become [bracketed]
// placeholders so nothing is invented. Logged to the ledger as a draft.
const body = z.object({ topic: z.string().min(3).max(200), competitor: z.string().max(200).optional() })

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
