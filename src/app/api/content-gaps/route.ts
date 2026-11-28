export const dynamic = "force-dynamic"
export const maxDuration = 120 // reads the competitor's real pages first (lib/content-gaps.ts)

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { analyzeContentGaps } from "@/lib/content-gaps"

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { competitorUrl } = body as { competitorUrl?: string }

    if (!competitorUrl || typeof competitorUrl !== "string") {
      return NextResponse.json({ error: "competitorUrl is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.websiteUrl) {
      return NextResponse.json(
        { error: "Tell me your website in Agent preferences first, then I’ll compare you with competitors." },
        { status: 400 }
      )
    }

    const { gaps, summary, read } = await analyzeContentGaps(
      user.websiteUrl,
      competitorUrl,
      user.businessName ?? "Your Business",
      user.businessType ?? "Local Business",
      user.city ?? ""
    )
    // Nothing read or nothing found: say so, and don't store an empty comparison.
    if (!gaps.length) return NextResponse.json({ error: summary, read }, { status: 422 })

    const record = await db.contentGap.create({
      data: {
        userId: user.id,
        competitorUrl,
        gaps: gaps as unknown as object,
        summary,
      },
    })

    return NextResponse.json({ id: record.id, gaps, summary, competitorUrl })
  } catch (err) {
    console.error("Content gaps error:", err)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
