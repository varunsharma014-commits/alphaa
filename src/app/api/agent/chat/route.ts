export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { getEngineEvidence, ENGINE_KEYS } from "@/lib/engine-evidence"
import { suggestedQuestion } from "@/lib/sandbox"
import { BRAND } from "@/lib/brand"

// The agent's voice in the dashboard. Answers from the user's REAL data
// (latest audit, engine verdicts, citations, activity ledger) and is told,
// hard, not to claim work it did not do. When the user wants a live check it
// returns `liveQuestion` and the client offers the (rate-limited) sandbox.

const schema = z.object({
  message: z.string().min(1).max(600),
  history: z.array(z.object({ role: z.enum(["agent", "user"]), text: z.string().max(2000) })).max(12).optional().default([]),
})

const LIVE_RE = /\b(ask|check|test|try|run|see what|what does|what do|does (chatgpt|gemini|claude|perplexity|ai)|do the ais?)\b/i

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Please sign in first." }, { status: 401 })

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Say a bit more and I’ll answer." }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      integration: true,
      audits: { orderBy: { createdAt: "desc" }, take: 1, include: { aiEngineResults: true } },
      gmbReviews: { where: { reply: null }, take: 3 },
      gbpPosts: { where: { status: "draft" }, take: 3 },
      contentGaps: { orderBy: { analyzedAt: "desc" }, take: 1 },
    },
  })
  if (!user) return NextResponse.json({ error: "We couldn’t find your account." }, { status: 404 })

  const [evidence, citation, activity] = await Promise.all([
    getEngineEvidence({ id: user.id, email: user.email }),
    db.mockActivity.findFirst({ where: { userId: user.id, type: "citation_scan" }, orderBy: { createdAt: "desc" } }),
    db.mockActivity.findMany({ where: { userId: user.id, type: { notIn: ["sandbox_query"] } }, orderBy: { createdAt: "desc" }, take: 25 }),
  ])

  const audit = user.audits[0]
  const facts = [
    `Business: ${user.businessName ?? "unknown"} — ${user.businessType ?? "type unknown"} in ${[user.city, user.state].filter(Boolean).join(", ") || "location unknown"}. Website: ${user.websiteUrl ?? "none on file"}.`,
    `Customer since: ${user.createdAt.toDateString()}. Plan: ${user.plan} (${user.subscriptionStatus}).`,
    `Google connected: ${user.integration ? "yes" : "no"}. Google Business Profile selected: ${user.integration?.gmbLocationId ? "yes" : "no"}. Search Console: ${user.integration?.gscSiteUrl ? "yes" : "no"}.`,
    `AI verdicts (freshest evidence per engine): ${ENGINE_KEYS.map((e) => `${e}=${evidence[e].state}${evidence[e].at ? ` (${evidence[e].source}, ${evidence[e].at.toDateString()})` : ""}`).join("; ")}.`,
    audit
      ? `Latest audit ${audit.createdAt.toDateString()}: score ${audit.visibilityScore}. Issues: ${JSON.stringify(audit.issues).slice(0, 1500)}. Engine answers: ${audit.aiEngineResults.map((r) => `[${r.engine}] Q: ${r.query} — appeared=${r.appeared} — A: ${r.response.slice(0, 500)}`).join("\n")}`
      : "No audit run yet.",
    citation ? `Where-AI-looks report (${citation.createdAt.toDateString()}): ${citation.title}. ${citation.description ?? ""} ${JSON.stringify(citation.metadata).slice(0, 1800)}` : "No where-AI-looks report yet.",
    `Reviews waiting for a reply: ${user.gmbReviews.length}. Draft Google posts: ${user.gbpPosts.length}.`,
    user.contentGaps[0] ? `Latest content-gap analysis vs ${user.contentGaps[0].competitorUrl}: ${JSON.stringify(user.contentGaps[0].gaps).slice(0, 1200)}` : "No competitor content analysis yet.",
    `Recent things ${BRAND.agentName} actually did (ledger, newest first): ${activity.map((a) => `${a.createdAt.toDateString()}: ${a.title}${a.description ? ` — ${a.description}` : ""}`).join(" | ").slice(0, 2500) || "nothing yet"}`,
  ].join("\n")

  const system = `You are ${BRAND.agentName}, an AI agent that works for one local business to get it recommended by ChatGPT, Gemini, Claude and Perplexity. You are talking to the owner inside their app.

Voice: first person ("I"). Plain English an 8-year-old follows. Short sentences. No jargon — never say schema, crawl, SEO, AEO, llms.txt, JSON-LD, backlinks, SERP; say what it means for them instead ("the page AI reads about you", "the sites AI trusts"). Warm, direct, no hype, no exclamation marks. Sound like a sharp employee giving a 20-second update, not a report.

Hard rules:
- Only state facts that are in FACTS below. If you don't have data, say "I haven't checked that yet" and offer to.
- Never claim you did something unless it is in the ledger. Never promise rankings or results.
- What you actually can do today: ask the four AIs questions (weekly automatically, or live when asked); draft and post replies to Google reviews and Google updates (only if Google is connected); write the page AI reads about the business and the FAQ/structured facts for their site (they or a human install it); check which pages AI reads and whether they are on them; watch competitors' pages; send a weekly note. You cannot edit their website directly, buy ads, or create accounts on third-party sites for them.
- If they ask why an AI doesn't name them, answer from the evidence (which sources the answer leaned on, what the competitor has that they don't) and give ONE next step.
- Keep it under 120 words unless they ask for detail. No bullet lists unless listing 3+ items.

FACTS
${facts}`

  const history = body.history.map((h) => ({ role: h.role === "agent" ? ("assistant" as const) : ("user" as const), content: h.text.slice(0, 1500) }))
  // The API requires the conversation to start with a user turn.
  while (history.length && history[0].role !== "user") history.shift()

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system,
      messages: [...history, { role: "user", content: body.message }],
    })
    const text = res.content[0]?.type === "text" ? res.content[0].text.trim() : ""
    if (!text) throw new Error("empty")

    const wantsLive = LIVE_RE.test(body.message)
    const liveQuestion = wantsLive ? extractQuestion(body.message) ?? suggestedQuestion(user.businessType, user.city) : null
    return NextResponse.json({ text, liveQuestion })
  } catch (err) {
    console.error("[agent/chat]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I lost the thread for a second. Ask me again?" }, { status: 502 })
  }
}

// "ask chatgpt who the best plumber in Austin is" → "who the best plumber in Austin is?"
function extractQuestion(message: string): string | null {
  const quoted = message.match(/[“"']([^”"']{8,200})[”"']/)
  if (quoted) return quoted[1].trim()
  const m = message.match(/\b(?:ask|check|test|try)\b[^:]*?(?:chatgpt|gemini|claude|perplexity|the ais?|ai)?\s*(?:about|for|whether|if|:)?\s*(.{8,200})$/i)
  if (m) {
    const q = m[1].trim().replace(/[.]+$/, "")
    return q.endsWith("?") ? q : `${q}?`
  }
  return null
}
