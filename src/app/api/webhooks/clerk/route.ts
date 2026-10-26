export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { leadName } from "@/emails/copy"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  }

  let event: any
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
    event = wh.verify(body, headers)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses[0]?.email_address ?? ""
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || null
    await db.user.create({ data: { clerkId: id, email, fullName, subscriptionStatus: "none" } })

    // The business isn't known at sign-up (onboarding comes later), but most
    // people ran a free scan first: use that scan's business when there is one.
    let businessName: string | null = null
    if (email) {
      const lead = await db.scanLead
        .findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
          select: { businessName: true, businessUrl: true },
        })
        .catch(() => null)
      businessName = lead ? leadName(lead.businessName, lead.businessUrl) : null
    }
    try {
      await sendWelcomeEmail(email, {
        firstName: first_name || null,
        businessName,
      })
    } catch (e) {
      console.error("Welcome email failed:", e)
    }
  }

  if (event.type === "user.deleted") {
    await db.user.deleteMany({ where: { clerkId: event.data.id } })
  }

  return NextResponse.json({ received: true })
}
