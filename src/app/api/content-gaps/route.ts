export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
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
        { error: "Add your website URL in settings before running a content gap analysis." },
        { status: 400 }
      )
    }

    const { gaps, summary } = await analyzeContentGaps(
      user.websiteUrl,
      competitorUrl,
      user.businessName ?? "Your Business",
      user.businessType ?? "Local Business",
      user.city ?? "your city"
    )

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
