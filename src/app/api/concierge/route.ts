export const dynamic = "force-dynamic"

// "Do it for me" intake. Captures the platform + access details BEFORE the
// customer is sent to Stripe, so a payment abandoned mid-checkout still
// leaves us a warm lead to follow up with. Fulfillment is human — the intake
// email to SUPPORT_EMAIL is the work queue for now (plus a concierge_request
// activity row so it's visible in the DB without a schema change).

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logActivity } from "@/lib/activity"
import { resend } from "@/lib/resend"
import { SUPPORT_EMAIL } from "@/lib/constants"

const schema = z.object({
  platform: z.string().min(1).max(60),
  service: z.enum(["setup", "fullservice"]),
  notes: z.string().max(2000).optional().default(""),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const input = schema.parse(await req.json())

    await logActivity(
      user.id,
      "concierge_request",
      input.service === "setup" ? "You asked us to install your code for you" : "You asked about Full Service",
      `Platform: ${input.platform}`,
      { platform: input.platform, service: input.service, notes: input.notes }
    )

    try {
      await resend.emails.send({
        from: `Alphaa <${process.env.RESEND_FROM_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `🛠 Concierge intake — ${user.businessName ?? user.email} (${input.service})`,
        text:
          `New "do it for me" intake.\n\n` +
          `Business: ${user.businessName ?? "—"}\n` +
          `Email: ${user.email}\n` +
          `Website: ${user.websiteUrl ?? "—"}\n` +
          `Platform: ${input.platform}\n` +
          `Service: ${input.service === "setup" ? "White-glove setup ($149 one-time)" : "Full Service ($299/mo)"}\n` +
          `Notes: ${input.notes || "—"}\n\n` +
          `Payment status arrives in a separate "PAID" email once Stripe confirms.\n` +
          `SLA: install + verify within 2 business days of payment.`,
      })
    } catch (e) {
      // The activity row above still records the request; don't fail the intake.
      console.error("Concierge intake email failed:", e)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    console.error("Concierge intake error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
