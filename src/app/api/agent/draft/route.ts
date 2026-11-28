export const dynamic = "force-dynamic"
export const maxDuration = 180

import { checkQuota, isQuotaError, quotaBody, refundQuota } from "@/lib/quotas"
import { GuardrailError } from "@/lib/guardrails"
import { voiceFor } from "@/lib/voice"
import { NextResponse } from "next/server"
import { safeFetch } from "@/lib/safe-fetch"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { writePost, writeMeta, writeLocationPage, writeSocial } from "@/lib/content"
import { getAgentSettings } from "@/lib/agent/settings"
import { generatePostImage, imageUrl } from "@/lib/images"
import { generateGbpPost } from "@/lib/gbp-poster"
import { hasPro } from "@/lib/billing"
import { once } from "@/lib/draft-dedupe"

const anthropic = claudeFor("draft")

// Writes a short, publish-ready FAQ section that closes a competitor gap —
// from the business's own facts only. Unknown facts become [bracketed]
// placeholders so nothing is invented. Logged to the ledger as a draft.
const body = z.object({
  topic: z.string().min(3).max(200),
  competitor: z.string().max(200).optional(),
  // post: a blog post; meta: page title + description; location: a location page.
  mode: z.enum(["faq", "post", "meta", "location", "gbp", "social"]).optional(),
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
    user.voiceDescription ? `About them (their words): ${user.voiceDescription}` : "",
    user.topicsToAvoid ? `Avoid: ${user.topicsToAvoid}` : "",
    (await voiceFor(user.id).catch(() => null)) ?? "",
  ].filter(Boolean).join("\n")

  // "Write it" tapped twice (or retried while the first is still writing) answers with the same
  // draft instead of writing a second copy: one in-flight write per brand + mode + topic, and a
  // finished one from the last 15 minutes is returned as is.
  const mode = input.mode
  if (mode === "gbp" && !hasPro(user)) return NextResponse.json({ error: "Google listing posts come with the Pro plan." }, { status: 403 })
  if (mode === "post" || mode === "gbp" || mode === "social") {
    const r = await once(`draft:${user.id}:${mode}:${input.topic.trim().toLowerCase()}`, () => writeDraft(user, mode, input.topic))
    if (r.ok) return NextResponse.json(r.body)
    if (!r.quota && r.rule) return NextResponse.json({ error: r.rule }, { status: 409 })
    return r.quota ? NextResponse.json({ error: r.quota, quota: true, buy: true }, { status: 429 }) : NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
  }

  try {
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
    if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
    console.error("[agent/draft]", input.mode, err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
  }

  // FAQ section: one more written piece on the plan's draft quota.
  const q = await checkQuota(user, "content_piece:draft")
  if (!q.allowed) return NextResponse.json(...quotaBody(q))
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
    refundQuota(user.id, "content_piece:draft")
    if (isQuotaError(err)) return NextResponse.json(...quotaBody(err))
    console.error("[agent/draft]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "I couldn’t write that just now. Try again in a minute." }, { status: 502 })
  }
}

const RECENT_MS = 15 * 60_000
type DraftUser = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>>

async function writeDraft(user: DraftUser, mode: "post" | "gbp" | "social", topic: string): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; quota?: string; rule?: string }> {
  const since = new Date(Date.now() - RECENT_MS)
  try {
    if (mode === "post") {
      const prev = await db.mockActivity.findFirst({ where: { userId: user.id, type: "post_draft", createdAt: { gte: since }, metadata: { path: ["requestTopic"], equals: topic } }, orderBy: { createdAt: "desc" } })
      if (prev) {
        const m = prev.metadata as { title?: string; markdown?: string; imageId?: string | null; excerpt?: string }
        return { ok: true, body: { title: m.title, text: m.markdown, excerpt: m.excerpt ?? null, draftId: prev.id, image: m.imageId ? imageUrl(m.imageId) : null } }
      }
      const p = await writePost(user, topic === "auto" ? undefined : topic)
      const img = await generatePostImage(user.id, { title: p.title, businessType: user.businessType, city: user.city })
      const row = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: `Drafted a post: “${p.title}”`, metadata: { ...p, status: "ready", imageId: img?.id ?? null, requestTopic: topic } } })
      return { ok: true, body: { title: p.title, text: p.markdown, excerpt: p.excerpt, draftId: row.id, image: img?.url ?? null } }
    }
    if (mode === "gbp") {
      const prev = await db.mockActivity.findFirst({ where: { userId: user.id, type: "gbp_post_draft", createdAt: { gte: since }, metadata: { path: ["topic"], equals: topic } }, orderBy: { createdAt: "desc" } })
      const prevId = (prev?.metadata as { postId?: string } | null)?.postId
      const prevPost = prevId ? await db.gbpPost.findFirst({ where: { id: prevId, userId: user.id, status: "draft" } }) : null
      if (prevPost) return { ok: true, body: { title: "Google listing update", text: prevPost.content, postId: prevPost.id } }
      const integ = await db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationName: true } })
      const g = await generateGbpPost(integ?.gmbLocationName ?? user.businessName ?? "Our Business", user.businessType ?? "local business", user.city ?? "", "UPDATE", topic, await voiceFor(user.id).catch(() => null))
      const post = await db.gbpPost.create({ data: { userId: user.id, content: g.content, postType: "UPDATE", status: "draft" } })
      await db.mockActivity.create({ data: { userId: user.id, type: "gbp_post_draft", title: "Wrote an update for your Google listing", metadata: { topic, postId: post.id } } })
      return { ok: true, body: { title: "Google listing update", text: g.content, postId: post.id } }
    }
    const prev = await db.mockActivity.findFirst({ where: { userId: user.id, type: "draft_written", createdAt: { gte: since }, metadata: { path: ["topic"], equals: topic } }, orderBy: { createdAt: "desc" } })
    const pm = prev?.metadata as { text?: string; kind?: string; imageId?: string | null } | null
    if (pm?.kind === "social" && pm.text) {
      return { ok: true, body: { title: "Social post", text: pm.text, image: pm.imageId ? imageUrl(pm.imageId) : null } }
    }
    const sp = await writeSocial(user, topic)
    const { ensureBrandKit } = await import("@/lib/brand-kit")
    const { renderSocialCard } = await import("@/lib/social-card")
    const brand = await ensureBrandKit(user.id).catch(() => null)
    const card = await renderSocialCard(user.id, { headline: sp.headline, businessName: user.businessName, brand }).catch(() => null)
    await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Wrote a social post: “${topic}”`, metadata: { topic, text: sp.text, kind: "social", imageId: card?.id ?? null } } })
    return { ok: true, body: { title: "Social post", text: sp.text, image: card?.url ?? null } }
  } catch (err) {
    if (isQuotaError(err)) return { ok: false, quota: err.message }
    if (err instanceof GuardrailError) return { ok: false, rule: err.message }
    console.error("[agent/draft]", mode, err instanceof Error ? err.message : err)
    return { ok: false }
  }
}
