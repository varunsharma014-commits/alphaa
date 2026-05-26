import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ ready: false }, { status: 400 })

  try {
    const lead = await db.scanLead.findUnique({ where: { id } })
    if (!lead || !lead.visibilityScore) return NextResponse.json({ ready: false })

    return NextResponse.json({
      ready: true,
      result: {
        scanId: lead.id,
        visibilityScore: lead.visibilityScore,
        issues: lead.issues,
        competitorInsight: "",
        aiSearchStatus: lead.aiSearchStatus,
        businessName: lead.businessName ?? "",
        city: (lead as any).city ?? "",
        businessUrl: lead.businessUrl ?? "",
        ogData: (lead as any).ogData ?? null,
        engineResponses: (lead as any).engineResponses ?? null,
      },
    })
  } catch {
    return NextResponse.json({ ready: false })
  }
}
