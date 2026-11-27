export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { logActivity } from "@/lib/activity"
import { containsPlaceholders, postToGmb } from "@/lib/gbp-poster"
import { resolveAccessToken } from "@/lib/gmb"
import { getAgentSettings } from "@/lib/agent/settings"
import { voiceFor } from "@/lib/voice"
import { asUser } from "@/lib/usage"
import { approveGbpPost } from "@/lib/approvals"
import { draftKey } from "@/lib/draft-dedupe"

const anthropic = claudeFor("google-posts")

// Google Business Profile posts on the plan's schedule (UTC day of week):
// Starter 2 a week (Mon, Thu), Pro / Growth 4 (Mon, Tue, Thu, Fri).
// The scheduler pings this route on all four days; the plan filter lives here.
//
// Every post is created as a DRAFT the owner approves from the agent feed
// ("Post it" / "Delete it" → /api/gbp/posts/[id]/publish). It goes live on
// its own only when the owner is on Pro / Growth AND turned on the
// auto-publish setting (the same `autoPublishPosts` flag the blog cron reads).
const DAYS: Record<"starter" | "pro", number[]> = { starter: [1, 4], pro: [1, 2, 4, 5] }

// Don't stack a second draft on the same listing within a day (guards a
// double tick and the Mon→Tue / Thu→Fri back-to-back Pro days).
const DEDUPE_MS = 20 * 60 * 60 * 1000
// An unapproved draft newer than this blocks the next one.
const OPEN_DRAFT_MS = 14 * 86_400_000

type Integration = {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  gmbAccountId: string | null
  gmbLocationId: string | null
}

async function generatePost(
  businessName: string,
  businessType: string | null,
  city: string | null,
  voice: string | null,
  previous: string[] = []
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Write a short Google Business Profile post for ${businessName}${
          businessType ? `, a ${businessType}` : ""
        }${city ? ` in ${city}` : ""}.

Rules:
- 100-150 words
${voice ? "" : "- Conversational, friendly tone\n"}- Focus on a local tip, seasonal service, customer story, or business update
- End with a soft call to action (e.g. "Call us", "Visit us", "Book online")
- No hashtags
${voice ? "" : "- No emojis\n"}- Do NOT mention pricing
${voice ? "" : '- Write in first-person plural ("We", "Our", "Us")\n'}- Sound like a real small business owner, not marketing copy

AEO (AI-engine optimization) hard rules — mandatory, applied within the short word count. Do NOT add a multi-question FAQ section (it will not fit a short GBP post):
- Open with a clear question a customer might ask an AI engine, e.g. "Looking for a ${businessType ?? "local service"} you can trust${city ? ` in ${city}` : ""}?"
- Answer that question directly in the first 1-2 sentences — AI engines favor direct, up-front answers.
- Include the business name (${businessName})${city ? ` and city (${city})` : ""} naturally in the first paragraph.
- End with a single short line stating the business name${city ? ` and city` : ""}. NEVER invent an address or phone number, and NEVER write bracket placeholders like "[address]" or "[phone]" — this post may go straight to Google, so if you don't know a fact, leave it out entirely.${city ? "" : "\n- The city is not known. Do NOT reference any city, neighborhood, or 'your area'."}

${voice ? `\n${voice}\n` : ""}${previous.length ? `\nRecent posts on this listing. Pick a different topic and a different opening question; never reuse their first sentence:\n${previous.map((p) => `- ${p.slice(0, 200).replace(/\s+/g, " ")}`).join("\n")}\n` : ""}
Return ONLY the post text, no extra commentary.`,
      },
    ],
  })
  const block = msg.content[0]
  return block.type === "text" ? block.text.trim() : ""
}

type CronUser = {
  id: string
  plan: string
  businessName: string | null
  businessType: string | null
  city: string | null
  integration: Integration | null
}

async function processUser(user: CronUser): Promise<{ status: "draft" | "posted" | "failed" | "skipped"; gmbPostId?: string | null }> {
  asUser(user.id)
  const recent = await db.gbpPost.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - DEDUPE_MS) } },
    select: { id: true },
  })
  if (recent) return { status: "skipped" }
  // Don't stack drafts the owner hasn't looked at yet: an unapproved draft from the last two weeks
  // (or a post the weekly plan already scheduled) means the next one waits. Without this the
  // briefing filled with near-identical "Looking for a … in Ottawa?" drafts (Nov 2026).
  const waiting = await db.gbpPost.findFirst({
    where: {
      userId: user.id,
      OR: [
        { status: "draft", createdAt: { gte: new Date(Date.now() - OPEN_DRAFT_MS) } },
        { status: "scheduled", scheduledFor: { gte: new Date() } },
      ],
    },
    select: { id: true },
  })
  if (waiting) return { status: "skipped" }
  const previous = (await db.gbpPost.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5, select: { content: true } })).map((p) => p.content)

  const businessName = user.businessName ?? "the business"

  const content = await generatePost(businessName, user.businessType, user.city, await voiceFor(user.id).catch(() => null), previous)
  if (!content) throw new Error("Claude returned empty post content")
  if (previous.some((p) => draftKey(p) === draftKey(content))) return { status: "skipped" }

  const hasGmb = !!(user.integration?.gmbAccountId && user.integration?.gmbLocationId)

  // Owner-approved by default. Auto-publish only for Pro / Growth with
  // the setting on, a connected listing, and no unfilled "[City]"-style facts
  // (containsPlaceholders also gates the manual publish route).
  const settings = await getAgentSettings(user.id)
  const auto =
    !!settings.autoPublishPosts &&
    /pro|full|growth/i.test(user.plan) &&
    hasGmb &&
    !containsPlaceholders(content)

  if (!auto || !user.integration) {
    await db.gbpPost.create({
      data: { userId: user.id, content, postType: "UPDATE", status: "draft" },
    })
    if (containsPlaceholders(content)) {
      console.error(`[gbp-posts-cron] placeholder content parked as draft for user ${user.id}`)
    }
    await logActivity(
      user.id,
      "gbp_post_draft",
      "alphaa drafted a Google post for you to approve",
      `${content.slice(0, 60)}${content.length > 60 ? "…" : ""}`
    )
    return { status: "draft" }
  }

  const accessToken = await resolveAccessToken(user.integration)
  const result = await postToGmb(
    accessToken,
    user.integration.gmbAccountId!,
    user.integration.gmbLocationId!,
    content,
    "UPDATE"
  )

  const status = result.success ? "posted" : "failed"
  const gmbPostId = result.gmbPostId ?? null
  const failReason = result.error?.slice(0, 120) ?? ""
  if (!result.success) {
    console.error(`[gbp-posts-cron] GMB post error for user ${user.id}:`, result.error)
  }

  await db.gbpPost.create({
    data: {
      userId: user.id,
      content,
      postType: "UPDATE",
      status,
      gmbPostId,
      postedAt: status === "posted" ? new Date() : null,
    },
  })

  if (status === "posted") {
    await logActivity(
      user.id,
      "gbp_post",
      "alphaa published a Google post for you",
      `${content.slice(0, 60)}${content.length > 60 ? "…" : ""}`
    )
  } else {
    await logActivity(
      user.id,
      "gbp_post_failed",
      "A Google post needs attention",
      failReason || "Google didn't accept the post — we'll retry on the next run"
    )
  }

  return { status, gmbPostId }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Google updates the agent scheduled for today (the weekly plan, autopilot on).
  const due = await db.gbpPost.findMany({ where: { status: "scheduled", scheduledFor: { lte: new Date() } }, select: { id: true, userId: true }, take: 200 })
  let scheduledPosted = 0
  for (const p of due) {
    const r = await approveGbpPost(p.userId, p.id).catch(() => ({ ok: false as const, error: "error" }))
    if (r.ok) scheduledPosted++
    else await db.gbpPost.update({ where: { id: p.id }, data: { status: "draft" } }).catch(() => null)
  }

  const dow = new Date().getUTCDay()

  const users = (
    await db.user.findMany({
      where: {
        subscriptionStatus: "active",
        stripeSubscriptionId: { not: null },
      },
      select: {
        id: true,
        plan: true,
        businessName: true,
        businessType: true,
        city: true,
        integration: {
          select: {
            accessToken: true,
            refreshToken: true,
            expiresAt: true,
            gmbAccountId: true,
            gmbLocationId: true,
          },
        },
      },
    })
    // Google listing posts are Pro and up since 2026-11-26 (Starter is AI search only).
  ).filter((u) => /pro|full|growth/i.test(u.plan) && DAYS.pro.includes(dow))

  let processed = 0
  let drafted = 0
  let posted = 0
  let failed = 0
  let skipped = 0
  const errors: { userId: string; error: string }[] = []

  for (const user of users) {
    try {
      const result = await processUser(user)
      if (result.status === "skipped") {
        skipped++
        continue
      }
      processed++
      if (result.status === "posted") posted++
      else if (result.status === "draft") drafted++
      else failed++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[gbp-posts-cron] Failed for user ${user.id}:`, message)
      errors.push({ userId: user.id, error: message })
      failed++
    }
  }

  return NextResponse.json({ due: users.length, processed, posted, drafted, skipped, failed, errors, scheduledPosted })
}
