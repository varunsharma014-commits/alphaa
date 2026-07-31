import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyScanToken } from "@/lib/scan-token"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  const token = req.nextUrl.searchParams.get("t")
  if (!id) return NextResponse.json({ ready: false }, { status: 400 })

  try {
    const lead = await db.scanLead.findUnique({ where: { id } })
    if (!lead || !lead.visibilityScore) return NextResponse.json({ ready: false })

    // The report itself is only served to someone holding the emailed token.
    // Without it we return just enough to render the "check your inbox" screen
    // — no score, no engine answers, nothing a scraper could harvest.
    if (!verifyScanToken(lead.id, lead.email, token)) {
      const [user, domain] = lead.email.split("@")
      const maskedEmail =
        user && domain
          ? `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`
          : ""
      return NextResponse.json({
        ready: true,
        gated: true,
        result: {
          scanId: lead.id,
          businessName: lead.businessName ?? "",
          maskedEmail,
        },
      })
    }

    return NextResponse.json({
      ready: true,
      gated: false,
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
