import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { analyzeCompetitor } from "@/lib/competitor-analyzer"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { hostOf, relevantCompetitors } from "@/lib/competitor-relevance"

export const dynamic = "force-dynamic"

// GET /api/competitors — list all competitors for the current user
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Only real competitors (shared gate: lib/competitor-relevance.ts). Nothing is deleted.
  const competitors = await relevantCompetitors(user, await db.competitor.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  }))

  return NextResponse.json({ competitors })
}

// POST /api/competitors — analyze + save a competitor
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body.url !== "string") {
    return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 })
  }

  // Validate URL
  let normalizedUrl: string
  try {
    const parsed = new URL(body.url.trim())
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "URL must use http or https" }, { status: 400 })
    }
    normalizedUrl = parsed.href
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  try {
    const analysis = await analyzeCompetitor(
      normalizedUrl,
      "", // name will be extracted from domain
      user.businessType ?? "business",
      user.city ?? ""
    )

    // Upsert — update if this URL already exists for this user, otherwise create
    const existing = await db.competitor.findFirst({
      where: { userId: user.id, url: normalizedUrl },
    })

    let competitor
    if (existing) {
      competitor = await db.competitor.update({
        where: { id: existing.id },
        data: {
          name: analysis.name,
          crawlData: {
            ...analysis.crawlData,
            aiSummary: analysis.aiSummary,
            source: "manual",
          },
          analyzedAt: new Date(),
        },
      })
    } else {
      competitor = await db.competitor.create({
        data: {
          userId: user.id,
          url: normalizedUrl,
          name: analysis.name,
          crawlData: {
            ...analysis.crawlData,
            aiSummary: analysis.aiSummary,
            // The owner added it: the niche check never hides it (domain rules still do).
            source: "manual",
          },
          analyzedAt: new Date(),
        },
      })
    }

    // Added by hand: if they had dismissed it before, it counts again.
    const host = hostOf(normalizedUrl)
    const st = await getAgentSettings(user.id)
    if (host && st.competitorsDismissed?.includes(host)) await saveAgentSettings(user.id, { competitorsDismissed: st.competitorsDismissed.filter((h) => h !== host) })

    return NextResponse.json({ competitor, analysis })
  } catch (err) {
    console.error("[POST /api/competitors]", err)
    return NextResponse.json({ error: "Failed to analyze competitor" }, { status: 500 })
  }
}
