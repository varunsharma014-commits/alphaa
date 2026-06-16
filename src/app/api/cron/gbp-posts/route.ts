export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"

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
  city: string | null
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Write a short Google Business Profile post for ${businessName}${
          businessType ? `, a ${businessType}` : ""
        }${city ? ` in ${city}` : ""}.

Rules:
- 100-150 words
- Conversational, friendly tone
- Focus on a local tip, seasonal service, customer story, or business update
- End with a soft call to action (e.g. "Call us", "Visit us", "Book online")
- No hashtags
- No emojis
- Do NOT mention pricing
- Write in first-person plural ("We", "Our", "Us")
- Sound like a real small business owner, not marketing copy

Return ONLY the post text, no extra commentary.`,
      },
    ],
  })
  const block = msg.content[0]
  return block.type === "text" ? block.text.trim() : ""
}

async function postToGmb(
  accessToken: string,
  gmbAccountId: string,
  gmbLocationId: string,
  content: string
): Promise<string | null> {
  const BUSINESS_BASE = "https://mybusiness.googleapis.com/v4"
  const url = `${BUSINESS_BASE}/accounts/${gmbAccountId}/locations/${gmbLocationId}/localPosts`

  const body = {
    languageCode: "en-US",
    summary: content,
    callToAction: {
      actionType: "LEARN_MORE",
      url: "",
    },
    topicType: "STANDARD",
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GMB post failed ${res.status}: ${err.slice(0, 300)}`)
  }

  const data = (await res.json()) as { name?: string }
  return data.name ?? null
}

async function refreshAccessToken(integration: Integration): Promise<string> {
  if (!integration.refreshToken) {
    throw new Error("No refresh token available")
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!tokenRes.ok) {
    throw new Error("Failed to refresh Google token")
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string }
  if (!tokenData.access_token) throw new Error("No access_token in refresh response")
  return tokenData.access_token
}

async function processUser(user: {
  id: string
  businessName: string | null
  businessType: string | null
  city: string | null
  integration: Integration | null
}): Promise<{ status: string; gmbPostId?: string | null }> {
  const businessName = user.businessName ?? "the business"

  // Generate post content
  const content = await generatePost(businessName, user.businessType, user.city)
  if (!content) throw new Error("Claude returned empty post content")

  const hasGmb =
    user.integration?.gmbAccountId && user.integration?.gmbLocationId

  if (!hasGmb || !user.integration) {
    // Save as draft — no GMB integration
    await db.gbpPost.create({
      data: {
        userId: user.id,
        content,
        postType: "UPDATE",
        status: "draft",
      },
    })
    return { status: "draft" }
  }

  // Try to get a valid access token
  let accessToken = user.integration.accessToken
  if (
    user.integration.expiresAt &&
    new Date(user.integration.expiresAt) <= new Date()
  ) {
    accessToken = await refreshAccessToken(user.integration)
  }

  // Attempt GMB post
  let gmbPostId: string | null = null
  let status = "failed"

  try {
    gmbPostId = await postToGmb(
      accessToken,
      user.integration.gmbAccountId!,
      user.integration.gmbLocationId!,
      content
    )
    status = "posted"
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[gbp-posts-cron] GMB post error for user ${user.id}:`, message)
    status = "failed"
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

  return { status, gmbPostId }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await db.user.findMany({
    where: {
      subscriptionStatus: { in: ["active", "trialing"] },
    },
    select: {
      id: true,
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

  let processed = 0
  let drafted = 0
  let posted = 0
  let failed = 0
  const errors: { userId: string; error: string }[] = []

  for (const user of users) {
    try {
      const result = await processUser(user)
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

  return NextResponse.json({ processed, posted, drafted, failed, errors })
}
