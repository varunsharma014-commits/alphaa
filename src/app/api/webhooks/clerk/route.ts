export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"

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
    await db.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0]?.email_address ?? "",
        fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
      },
    })
  }

  if (event.type === "user.deleted") {
    await db.user.deleteMany({ where: { clerkId: event.data.id } })
  }

  return NextResponse.json({ received: true })
}
