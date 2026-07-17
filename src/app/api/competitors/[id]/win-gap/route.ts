export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { draftContentForGap, type WinGapItem } from "@/lib/win-gap"
import { logActivity } from "@/lib/activity"
import { Prisma } from "@prisma/client"

// POST /api/competitors/[id]/win-gap
// Body: { gap: string } — the specific weakness line the owner clicked.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { gap?: unknown }
    const gap = typeof body.gap === "string" ? body.gap.trim() : ""
    if (!gap) {
      return NextResponse.json({ error: "gap is required" }, { status: 400 })
    }

    // Always resolve clerkId → internal user.id before touching child records.
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id } = await params
    const competitor = await db.competitor.findUnique({ where: { id } })
    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 })
    }
    if (competitor.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const draft = await draftContentForGap({
      gap,
      businessName: user.businessName ?? "your business",
      businessType: user.businessType ?? "local business",
      city: user.city ?? "your area",
      websiteUrl: user.websiteUrl ?? null,
      voiceDescription: user.voiceDescription ?? null,
      topicsToAvoid: user.topicsToAvoid ?? null,
      competitorUrl: competitor.url,
    })

    const item: WinGapItem = {
      gap,
      title: draft.title,
      format: draft.format,
      targetQuestion: draft.targetQuestion,
      draft: draft.body,
      body: draft.body,
      createdAt: new Date().toISOString(),
    }

    // Persist into the existing ContentGap model — no schema change. There is
    // no unique constraint on (userId, competitorUrl), so upsert by hand:
    // append to the existing row for this competitor, or create the first one.
    const existing = await db.contentGap.findFirst({
      where: { userId: user.id, competitorUrl: competitor.url },
      orderBy: { analyzedAt: "desc" },
    })

    if (existing) {
      const current = Array.isArray(existing.gaps) ? (existing.gaps as unknown[]) : []
      await db.contentGap.update({
        where: { id: existing.id },
        data: {
          gaps: [...current, item] as unknown as Prisma.InputJsonValue,
          analyzedAt: new Date(),
        },
      })
    } else {
      await db.contentGap.create({
        data: {
          userId: user.id,
          competitorUrl: competitor.url,
          gaps: [item] as unknown as Prisma.InputJsonValue,
          summary: null,
        },
      })
    }

    await logActivity(
      user.id,
      "content_draft",
      "alphaa wrote content to win a competitor gap",
      draft.title
    )

    return NextResponse.json(item)
  } catch (err) {
    console.error("win-gap error:", err)
    const message =
      err instanceof Error && err.message ? err.message : "Could not write a draft. Try again."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
