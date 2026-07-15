export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { sendAuditResultsEmail } from "@/lib/email"
import type { Prisma } from "@prisma/client"

// Public endpoint (under /api/scan/** in the middleware allowlist).
// Sends the AuditResultsEmail for a completed free scan to the email the
// lead entered when starting the scan. Rate-limited to ONE send per scan
// row via a `sentEmail` flag stored inside the existing ogData Json —
// no schema change.

const schema = z.object({ scanId: z.string().min(10).max(64) })

const ENGINE_DISPLAY = [
  { key: "chatgpt", responseKey: "chatgpt", name: "ChatGPT" },
  { key: "google_ai", responseKey: "claude", name: "Google AI" },
  { key: "perplexity", responseKey: "perplexity", name: "Perplexity" },
  { key: "gemini", responseKey: "gemini", name: "Gemini" },
] as const

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

    // Build engine rows from stored Json (old rows: string per engine;
    // new rows: { query, response, appeared, mentioned }).
    const aiStatus: Record<string, unknown> = isRecord(lead.aiSearchStatus) ? lead.aiSearchStatus : {}
    const responses: Record<string, unknown> = isRecord(lead.engineResponses) ? lead.engineResponses : {}

    const engines = ENGINE_DISPLAY.map((e) => {
      const raw = responses[e.responseKey]
      let found = aiStatus[e.key] === "occasionally" || aiStatus[e.key] === "frequently"
      let snippet: string | undefined
      if (isRecord(raw) && typeof raw.response === "string") {
        if (typeof raw.appeared === "boolean") found = raw.appeared
        if (found) snippet = raw.response.slice(0, 160)
      } else if (typeof raw === "string" && found) {
        snippet = raw.slice(0, 160)
      }
      return { name: e.name, found, snippet }
    })

    const issues = Array.isArray(lead.issues) ? lead.issues : []
    const first = issues[0]
    const topIssue =
      isRecord(first) && typeof first.explanation === "string"
        ? first.explanation
        : isRecord(first) && typeof first.headline === "string"
          ? first.headline
          : "Your business is missing from most AI answers about your area — the signals AI reads aren't pointing at you yet."

    try {
      await sendAuditResultsEmail(lead.email, {
        businessName: lead.businessName || lead.businessUrl || "Your business",
        city: lead.city ?? "",
        overallScore: lead.visibilityScore,
        engines,
        topIssue,
        isSubscriber: false,
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
