import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { buildCitationReport, type CitationReport } from "@/lib/citations"

export const dynamic = "force-dynamic"
// SERP calls plus up to 24 page fetches — this is the slowest route in the app.
export const maxDuration = 300

const ACTIVITY_TYPE = "citation_scan"

function readReport(metadata: unknown): CitationReport | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const m = metadata as Record<string, unknown>
  if (!Array.isArray(m.targets)) return null
  return m as unknown as CitationReport
}

/** Latest saved report. */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const row = await db.mockActivity.findFirst({
    where: { userId: user.id, type: ACTIVITY_TYPE },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ report: row ? readReport(row.metadata) : null })
}

/** Run a fresh citation scan. */
export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!user.businessName?.trim()) {
    return NextResponse.json(
      { error: "Add your business name in Settings first so we know what to look for." },
      { status: 400 }
    )
  }

  try {
    const report = await buildCitationReport({
      businessName: user.businessName,
      businessType: user.businessType ?? "",
      city: user.city ?? "",
      websiteUrl: user.websiteUrl,
    })

    // Persisted on MockActivity (the app's general ledger, already used this way
    // for sandbox_result) because there is no migrations directory in this repo
    // — `prisma migrate deploy` no-ops, so adding a table would not reach prod.
    await logActivity(
      user.id,
      ACTIVITY_TYPE,
      `Checked ${report.targets.length} pages AI reads about ${user.businessType || "your industry"}`,
      report.searchConfigured
        ? `Listed on ${report.listed}, missing from ${report.missing}.`
        : "Search is not configured, so no pages could be checked.",
      report as unknown as object
    )

    return NextResponse.json({ report })
  } catch (err) {
    console.error("[citations] scan failed", err)
    return NextResponse.json({ error: "Scan failed. Try again in a moment." }, { status: 500 })
  }
}
