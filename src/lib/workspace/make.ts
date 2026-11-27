// "Make my version" (a niche post) and "Write it" (an idea): write the owner's own version with the
// existing writers, save it as the right kind of draft, and say what it is so the sheet can offer
// ONE action (lib/workspace/schedule.ts). Nothing is published here.
import type { User } from "@prisma/client"
import { db } from "@/lib/db"
import { hasPro } from "@/lib/billing"
import { lastReadyNichePosts } from "@/lib/niche-posts"
import { writePost, writeSocial } from "@/lib/content"
import { renderSocialCard } from "@/lib/social-card"
import { ensureBrandKit } from "@/lib/brand-kit"
import { createPost, listAccounts } from "@/lib/social/store"
import { generateGbpPost } from "@/lib/gbp-poster"
import { generatePostImage } from "@/lib/images"
import { voiceFor } from "@/lib/voice"
import { countUsage } from "@/lib/usage"

export type Made = {
  /** social = a SocialPost draft, gbp = a GbpPost draft, site = a post_draft row, copy = text only (no plan for posting). */
  kind: "social" | "gbp" | "site" | "copy"
  id: string | null
  title: string
  text: string
  image: string | null
  excerpt?: string | null
  accounts?: number
}

async function social(user: User, topic: string, context?: string): Promise<Made> {
  const sp = await writeSocial(user, topic, context)
  const brand = await ensureBrandKit(user.id).catch(() => null)
  const card = await renderSocialCard(user.id, { headline: sp.headline, businessName: user.businessName, brand }).catch(() => null)
  await db.mockActivity.create({ data: { userId: user.id, type: "draft_written", title: `Wrote a social post: “${sp.headline}”`, metadata: { topic, text: sp.text, kind: "social", imageId: card?.id ?? null } } })
  if (!hasPro(user)) return { kind: "copy", id: null, title: sp.headline, text: sp.text, image: card?.url ?? null }
  const accounts = (await listAccounts(user.id)).filter((a) => a.status === "active" && (card || (a.platform !== "instagram" && a.platform !== "tiktok")))
  const post = await createPost(user.id, { text: sp.text, imageId: card?.id ?? null, accountIds: accounts.map((a) => a.id), status: "draft", scheduledFor: null, source: "manual", title: sp.headline })
  return { kind: "social", id: post.id, title: sp.headline, text: sp.text, image: card?.url ?? null, accounts: accounts.length }
}

export async function makeFromNiche(user: User, itemId: string): Promise<Made | null> {
  const p = await lastReadyNichePosts(user.id)
  const item = p?.items.find((i) => i.id === itemId)
  if (!item) return null
  const topic = item.angle || `A post for your business in the spirit of this: ${item.about}`
  const context = `A ${item.platform === "meta_ad" ? "long-running ad" : "post"} in this business's niche is getting attention. What it is: ${item.about}${item.why ? ` Why it works: ${item.why}` : ""} Make an original post for this business in the same spirit. Never copy or mention the other account.`
  countUsage(user.id, "niche_version")
  return social(user, topic, context)
}

export async function makeFromIdea(user: User, idea: { title: string; format: "blog" | "google" | "social" }): Promise<Made> {
  if (idea.format === "social") return social(user, idea.title)
  if (idea.format === "google") {
    // Google listing posts are Pro and up (2026-11-26): on Starter the text is copy-only.
    if (!hasPro(user)) {
      const g = await generateGbpPost(user.businessName ?? "Our Business", user.businessType ?? "local business", user.city ?? "", "UPDATE", idea.title, await voiceFor(user.id).catch(() => null))
      return { kind: "copy", id: null, title: "Google listing update", text: g.content, image: null }
    }
    const integ = await db.integration.findUnique({ where: { userId: user.id }, select: { gmbLocationName: true } })
    const g = await generateGbpPost(integ?.gmbLocationName ?? user.businessName ?? "Our Business", user.businessType ?? "local business", user.city ?? "", "UPDATE", idea.title, await voiceFor(user.id).catch(() => null))
    const post = await db.gbpPost.create({ data: { userId: user.id, content: g.content, postType: "UPDATE", status: "draft" } })
    await db.mockActivity.create({ data: { userId: user.id, type: "gbp_post_draft", title: "Wrote an update for your Google listing", metadata: { topic: idea.title, postId: post.id } } })
    return { kind: "gbp", id: post.id, title: "Google listing update", text: g.content, image: null }
  }
  const p = await writePost(user, idea.title)
  const img = await generatePostImage(user.id, { title: p.title, businessType: user.businessType, city: user.city })
  const row = await db.mockActivity.create({ data: { userId: user.id, type: "post_draft", title: `Drafted a post: “${p.title}”`, metadata: { ...p, status: "ready", imageId: img?.id ?? null, requestTopic: idea.title } } })
  return { kind: "site", id: row.id, title: p.title, text: p.markdown, image: img?.url ?? null, excerpt: p.excerpt }
}
