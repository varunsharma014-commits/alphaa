export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()

  await db.user.update({
    where: { clerkId: userId },
    data: {
      businessType: data.businessType || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      websiteUrl: data.websiteUrl || null,
      voiceDescription: data.voiceDescription || null,
      topicsToAvoid: data.topicsToAvoid || null,
      onboardingCompleted: true,
    },
  })

  // Seed mock activity so dashboard isn't empty
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (user) {
    await db.mockActivity.createMany({
      data: [
        { userId: user.id, type: "audit_completed", title: "Initial visibility audit completed", description: "Your baseline visibility score has been set." },
        { userId: user.id, type: "post_published", title: "First Google Business Profile post published", description: "Your first post is live on Google." },
        { userId: user.id, type: "citation_found", title: "Business found in Google AI results", description: "You appeared in a Google AI search for your category." },
      ],
    })
  }

  return NextResponse.json({ success: true })
}
