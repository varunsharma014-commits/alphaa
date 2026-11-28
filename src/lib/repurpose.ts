// "Repurpose" a finished blog post in one tap (2026-11-28). From the post's own text (already
// checked against the facts), five drafts land in the normal queues, each waiting for the usual
// approve / Stop (nothing is published here):
//   social    Social Studio draft (writeSocial + an image in the owner's style, postImageFor) on
//             the connected Facebook / Instagram / X / TikTok accounts
//   linkedin  Social Studio draft on the LinkedIn account(s), longer and in a professional tone
//   gbp       a Google Business Profile update draft (generateGbpPost → GbpPost "draft")
//   email     this month's customer email draft about the post (writeCampaign, button = the post)
//   video     a 30-45 second short-video script (hook, scenes, on-screen text, caption), saved as
//             a draft_written row (kind "video_script"); there is no video queue to post it from
// Each writer counts its own quota (social ×2, gbp, email, draft). Pro and up only (hasPro).
// One run per post: the result is saved on the post (metadata.repurposed) and returned again.
import type { User } from "@prisma/client"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { hasPro } from "@/lib/billing"
import { withQuota, isQuotaError } from "@/lib/quotas"
import { factsOf, writeSocial } from "@/lib/content"
import { voiceFor } from "@/lib/voice"
import { postImageFor } from "@/lib/post-images"
import { generateGbpPost } from "@/lib/gbp-poster"
import { writeCampaign } from "@/lib/email-campaigns/write"
import { createCampaign } from "@/lib/email-campaigns/store"
import { createPost, listAccounts } from "@/lib/social/store"
import { PLATFORM_NAME } from "@/lib/social/types"
import { mdPlain } from "@/lib/markdown"
import { allowedNumbers, numberProblems, dropSentencesWith } from "@/lib/content-check"
import { imageUrl } from "@/lib/images"
import { GuardrailError, enforce, finishSocial } from "@/lib/guardrails"

const anthropic = claudeFor("repurpose")
const MODEL = "claude-sonnet-5-5"

export type RepurposeKind = "social" | "linkedin" | "gbp" | "email" | "video"
export type RepurposeItem = {
  kind: RepurposeKind
  status: "made" | "skipped" | "failed"
  /** social_post / GbpPost / email campaign / draft_written id */
  id?: string | null
  title: string
  text?: string
  image?: string | null
  /** Where the draft waits, in the owner's words. */
  where: string
  note?: string
}
export type RepurposeResult = { at: string; draftId: string; postTitle: string; url: string | null; items: RepurposeItem[] }

type PostMeta = { title?: string; markdown?: string; excerpt?: string; status?: string; url?: string; topic?: string; repurposed?: RepurposeResult }

const LABEL: Record<RepurposeKind, string> = { social: "Social post", linkedin: "LinkedIn post", gbp: "Google listing update", email: "Email to your customers", video: "Short video script" }

/** The post's sections as a short summary the writers can use (its own words, numbers already checked). */
function digest(m: PostMeta): string {
  const md = m.markdown ?? ""
  const heads = [...md.matchAll(/^##\s+(.+)$/gm)].map((x) => mdPlain(x[1]).trim()).filter((h) => !/frequently asked/i.test(h)).slice(0, 6)
  const first = mdPlain(md.split(/\n##\s/)[0] ?? "").replace(/\s+/g, " ").trim().slice(0, 600)
  return [`Title: ${m.title ?? ""}`, m.excerpt ? `Summary: ${m.excerpt}` : "", first ? `Opening answer: ${first}` : "", heads.length ? `Sections: ${heads.join(" | ")}` : ""].filter(Boolean).join("\n")
}

const LinkedInSchema = z.object({ text: z.string().describe("The LinkedIn post, 120-220 words, line breaks between short paragraphs") })
const VideoSchema = z.object({
  hook: z.string().describe("What is said in the first 2 seconds, under 12 words"),
  scenes: z.array(z.object({ seconds: z.number().int(), onScreen: z.string().describe("Text on screen, under 8 words"), voiceover: z.string().describe("What is said"), shot: z.string().describe("What to film, simple, no actors needed") })).describe("4-6 scenes, 30-45 seconds in total"),
  cta: z.string().describe("The closing line"),
  caption: z.string().describe("Post caption, under 40 words, at most 3 hashtags"),
})

async function linkedInPost(user: User, m: PostMeta, url: string | null): Promise<string> {
  // Brand guardrails (lib/guardrails.ts): banned words → one retry; hashtags + disclaimer appended for LinkedIn.
  return withQuota(user, "content_piece:social", () => enforce(user.id, "social", async () => {
    const voice = await voiceFor(user.id).catch(() => null)
    const allowed = allowedNumbers([factsOf(user), m.markdown, m.title])
    const prompt = `Write one LinkedIn post for this business, sharing what its new article teaches. Open with a line that makes a professional stop scrolling, then 3-5 short paragraphs (or a short list) with the most useful points from the article, then one line inviting them to read the full article, then the hashtags. ${url ? "Don't write the link or 'link below': I add the link after your text." : ""} 120-220 words. Plain, confident, no hype ("best", "#1", "leading"), no emoji unless the voice uses them, at most 3 hashtags at the end. Use only what the article and facts say; the only numbers allowed are ones in them.

THE ARTICLE
${digest(m)}

FACTS
${factsOf(user, voice)}`
    let text = ""
    for (let attempt = 0; attempt < 2 && !text; attempt++) {
      const msg = await anthropic.messages.parse({ model: MODEL, max_tokens: 1200, output_config: { format: zodOutputFormat(LinkedInSchema) }, messages: [{ role: "user", content: prompt }] })
      const out = msg.parsed_output?.text?.trim() ?? ""
      const bad = numberProblems(out, allowed)
      if (out && (!bad.length || attempt === 1)) text = bad.length ? dropSentencesWith(out, bad) : out
    }
    if (!text) throw new Error("no linkedin text")
    return url ? `${text}\n\n${url}` : text
  }, { texts: (t) => [t], finish: (t, g) => finishSocial(t, g, "linkedin").text }))
}

async function videoScript(user: User, m: PostMeta): Promise<{ text: string; script: z.infer<typeof VideoSchema> }> {
  return withQuota(user, "content_piece:draft", () => enforce(user.id, "social", async () => {
    const voice = await voiceFor(user.id).catch(() => null)
    const allowed = allowedNumbers([factsOf(user), m.markdown, m.title])
    const prompt = `Write a 30-45 second vertical short-video script (Reels / Shorts) for this business, from its new article. The owner films it on a phone: simple shots of the place, the work, hands or the screen, no actors and no AI video. One idea, the most useful point first. Use only what the article and facts say; the only numbers allowed are ones in them. No "best", "#1" or "leading".

THE ARTICLE
${digest(m)}

FACTS
${factsOf(user, voice)}`
    for (let attempt = 0; attempt < 2; attempt++) {
      const msg = await anthropic.messages.parse({ model: MODEL, max_tokens: 1500, output_config: { format: zodOutputFormat(VideoSchema) }, messages: [{ role: "user", content: prompt }] })
      const s = msg.parsed_output
      if (!s?.scenes?.length) continue
      const all = [s.hook, s.cta, s.caption, ...s.scenes.flatMap((x) => [x.onScreen, x.voiceover])].join("\n")
      if (numberProblems(all, allowed).length && attempt === 0) continue
      const text = [`Hook (0-2s): ${s.hook}`, ...s.scenes.map((x, i) => `${i + 1}. (${x.seconds}s) Film: ${x.shot}\n   On screen: ${x.onScreen}\n   Say: ${x.voiceover}`), `End: ${s.cta}`, `Caption: ${s.caption}`].join("\n")
      return { text, script: s }
    }
    throw new Error("no video script")
  }, { texts: (v) => [v.text] }))
}

/** Five drafts from one finished post. Throws only when the post isn't there or the plan doesn't include it. */
export async function repurposePost(user: User, draftId: string, opts: { again?: boolean } = {}): Promise<RepurposeResult> {
  if (!hasPro(user)) throw new RepurposeError("Turning a post into social, Google and email drafts comes with the Pro plan.")
  const row = await db.mockActivity.findFirst({ where: { id: draftId, userId: user.id, type: "post_draft" } })
  if (!row) throw new RepurposeError("That post isn’t here any more.")
  const m = (row.metadata ?? {}) as PostMeta
  if (!m.markdown || m.status === "undone") throw new RepurposeError("That post was taken down, so I won’t reuse it.")
  if (m.repurposed && !opts.again) return m.repurposed
  const title = (m.title ?? "Our new post").trim()
  const url = m.status === "published" && m.url && /^https:\/\//.test(m.url) ? m.url : null
  const accounts = (await listAccounts(user.id)).filter((a) => a.status === "active")
  const linkedin = accounts.filter((a) => a.platform === "linkedin")
  const others = accounts.filter((a) => a.platform !== "linkedin")
  const names = (list: typeof accounts) => Array.from(new Set(list.map((a) => PLATFORM_NAME[a.platform]))).join(", ")

  const fail = (kind: RepurposeKind, err: unknown): RepurposeItem => (console.error("[repurpose]", kind, err instanceof Error ? err.message : err), { kind, status: "failed", title: LABEL[kind], where: "", note: isQuotaError(err) || err instanceof GuardrailError ? err.message : "I couldn’t write this one just now." })
  // One picture for both social drafts, in the owner's image style.
  let image: Promise<{ id: string; url: string } | null> | null = null

  const social = (async (): Promise<RepurposeItem> => {
    try {
      const sp = await writeSocial(user, title, `A new article on our website. ${digest(m).slice(0, 900)}`)
      image ??= postImageFor(user.id, { headline: sp.headline, topic: title }).catch(() => null)
      const img = await image
      const text = url ? `${sp.text}\n\n${url}` : sp.text
      const usable = others.filter((a) => img || (a.platform !== "instagram" && a.platform !== "tiktok"))
      const post = await createPost(user.id, { text, imageId: img?.id ?? null, accountIds: usable.map((a) => a.id), status: "draft", scheduledFor: null, source: "manual", title: sp.headline })
      return { kind: "social", status: "made", id: post.id, title: sp.headline, text, image: img ? imageUrl(img.id) : null, where: usable.length ? `Social Studio, for ${names(usable)}` : "Social Studio (connect an account to post it)" }
    } catch (err) { return fail("social", err) }
  })()

  const li = (async (): Promise<RepurposeItem> => {
    try {
      const text = await linkedInPost(user, m, url)
      image ??= postImageFor(user.id, { headline: title.split(/\s+/).slice(0, 6).join(" "), topic: title }).catch(() => null)
      const img = await image
      const post = await createPost(user.id, { text, imageId: img?.id ?? null, accountIds: linkedin.map((a) => a.id), status: "draft", scheduledFor: null, source: "manual", title: `LinkedIn: ${title}`.slice(0, 120) })
      return { kind: "linkedin", status: "made", id: post.id, title: "LinkedIn post", text, image: img ? imageUrl(img.id) : null, where: linkedin.length ? "Social Studio, for LinkedIn" : "Social Studio (connect LinkedIn to post it)" }
    } catch (err) { return fail("linkedin", err) }
  })()

  const gbp = (async (): Promise<RepurposeItem> => {
    try {
      const integ = await db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationName: true, gmbLocationId: true } })
      const g = await generateGbpPost(integ?.gmbLocationName ?? user.businessName ?? "Our Business", user.businessType ?? "local business", user.city ?? "", "UPDATE", `Our new article “${title}”. ${m.excerpt ?? ""} ${url ? "Invite people to read it on our website." : ""}`.trim(), await voiceFor(user.id).catch(() => null))
      const post = await db.gbpPost.create({ data: { userId: user.id, content: g.content, postType: "UPDATE", status: "draft" } })
      await db.mockActivity.create({ data: { userId: user.id, type: "gbp_post_draft", title: "Wrote an update for your Google listing", metadata: { topic: title, postId: post.id, from: draftId } } })
      return { kind: "gbp", status: "made", id: post.id, title: "Google listing update", text: g.content, where: integ?.gmbLocationId ? "Google posts, waiting for your OK" : "Google posts (connect your Google listing to post it)" }
    } catch (err) { return fail("gbp", err) }
  })()

  const email = (async (): Promise<RepurposeItem> => {
    if (!url) return { kind: "email", status: "skipped", title: LABEL.email, where: "", note: "Publish the post first, so the email can link to it." }
    try {
      // The topic reads as a sentence on its own (the writer's plain fallback prints it).
      const c = await writeCampaign(user.id, { topic: `We just published a new article on our website: “${title}”.${m.excerpt ? ` ${m.excerpt}` : ""}`, link: { label: `Blog post: ${title}`, url }, context: digest(m), numbersFrom: m.markdown })
      const made = await createCampaign(user.id, { v: 1, status: "draft", ...c })
      return { kind: "email", status: "made", id: made.id, title: c.subject, text: c.paragraphs.join("\n\n"), where: "Email & Flows, as a draft" }
    } catch (err) { return fail("email", err) }
  })()

  const video = (async (): Promise<RepurposeItem> => {
    try {
      const v = await videoScript(user, m)
      const d = await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Wrote a video script: “${title}”`, metadata: { topic: title, text: v.text, kind: "video_script", script: v.script, from: draftId } } })
      return { kind: "video", status: "made", id: d.id, title: LABEL.video, text: v.text, where: "Here, to film on your phone" }
    } catch (err) { return fail("video", err) }
  })()

  const items = await Promise.all([social, li, gbp, email, video])
  const result: RepurposeResult = { at: new Date().toISOString(), draftId, postTitle: title, url, items }
  const cur = await db.mockActivity.findUnique({ where: { id: row.id } })
  await db.mockActivity.update({ where: { id: row.id }, data: { metadata: { ...((cur?.metadata ?? m) as object), repurposed: result } as object } })
  return result
}

export class RepurposeError extends Error {}

/** Published (or finished) posts the owner can repurpose, newest first. */
export async function repurposablePosts(userId: string, take = 6): Promise<{ id: string; title: string; url: string | null; at: string; repurposed: boolean }[]> {
  const rows = await db.mockActivity.findMany({ where: { userId, type: "post_draft", metadata: { path: ["status"], equals: "published" } }, orderBy: { createdAt: "desc" }, take })
  return rows.map((r) => {
    const m = r.metadata as PostMeta
    return { id: r.id, title: m.title ?? r.title.replace(/^Drafted a post:\s*/, ""), url: m.url ?? null, at: r.createdAt.toISOString(), repurposed: !!m.repurposed }
  })
}
