export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { sendAuditResultsEmail } from "@/lib/email"
import type { Prisma } from "@prisma/client"
import { scanResultsUrl } from "@/lib/scan-token"
import { scanEngineRows } from "@/lib/scan-engines"
import { leadName } from "@/emails/copy"

// Public endpoint (under /api/scan/** in the middleware allowlist).
// Sends the AuditResultsEmail for a completed free scan to the email the
// lead entered when starting the scan. Rate-limited to ONE send per scan
// row via a `sentEmail` flag stored inside the existing ogData Json —
// no schema change.

const schema = z.object({ scanId: z.string().min(10).max(64) })

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export async function POST(req: NextRequest) {
  try {
    const { scanId } = schema.parse(await req.json())

    const lead = await db.scanLead.findUnique({ where: { id: scanId } })
    if (!lead || !lead.visibilityScore || !lead.email) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    const ogData: Record<string, unknown> = isRecord(lead.ogData) ? { ...lead.ogData } : {}
    if (ogData.sentEmail === true) {
      // Already sent for this scan — treat as success so the UI stays calm.
      return NextResponse.json({ ok: true, alreadySent: true })
    }

    // Claim the send BEFORE dispatching so a double-click can't send twice.
    await db.scanLead.update({
      where: { id: scanId },
      data: { ogData: { ...ogData, sentEmail: true } as Prisma.InputJsonValue },
    })

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app"
    try {
      await sendAuditResultsEmail(lead.email, {
        businessName: leadName(lead.businessName, lead.businessUrl),
        city: lead.city,
        overallScore: lead.visibilityScore,
        // Unknown (the engine didn't answer) stays unknown, never "not named".
        engines: scanEngineRows(lead, { snippets: true }),
        variant: "requested",
        // Sent only to the address the scan was run with, so the tokenised
        // link to the full report is safe to include.
        resultsUrl: scanResultsUrl(lead.id, lead.email),
        hireUrl: `${base}/signup?scan=${lead.id}&utm_source=email&utm_medium=report&utm_campaign=email-me-report`,
      })
    } catch (sendErr) {
      // Roll the claim back so the user can retry.
      await db.scanLead
        .update({
          where: { id: scanId },
          data: { ogData: { ...ogData, sentEmail: false } as Prisma.InputJsonValue },
        })
        .catch(() => {})
      throw sendErr
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err && typeof err === "object" && "name" in err && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    console.error("email-report error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: "Could not send report" }, { status: 500 })
  }
}
