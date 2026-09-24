export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { sendScanReadyEmail } from "@/lib/scan-email"
import { scanResultsUrl } from "@/lib/scan-token"

// Public (under /api/scan/**). The /start conversation runs the scan first and
// asks "where do I send this?" afterwards — this attaches the address to the
// lead and sends the report. One address per scan: once set, it stays.

const schema = z.object({ scanId: z.string().min(10).max(64), email: z.string().email().max(200) })

export async function POST(req: NextRequest) {
  let scanId: string
  let email: string
  try {
    ;({ scanId, email } = schema.parse(await req.json()))
  } catch {
    return NextResponse.json({ error: "That doesn’t look like an email address." }, { status: 400 })
  }

  const lead = await db.scanLead.findUnique({ where: { id: scanId } })
  if (!lead) return NextResponse.json({ error: "Scan not found" }, { status: 404 })

  if (lead.email && lead.email !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: "This report already belongs to another address." }, { status: 409 })
  }

  const address = email.trim().toLowerCase()
  if (!lead.email) {
    await db.scanLead.update({ where: { id: scanId }, data: { email: address } })
  }

  // Send in the background; the conversation never waits on a mail server.
  void sendScanReadyEmail(scanId).catch((e) => console.error("[scan/claim] email failed", scanId, e))

  return NextResponse.json({ ok: true, resultsUrl: scanResultsUrl(scanId, address) })
}
