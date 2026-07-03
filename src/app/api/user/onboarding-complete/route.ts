export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { runAutoDiscovery } from "@/lib/discover-competitors"

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

  const user = await db.user.findUnique({ where: { clerkId: userId } })

  // Kick off competitor auto-discovery in the background (no-op until APIFY_TOKEN
  // is set). Railway runs a persistent server, so this fire-and-forget promise
  // completes after the response is sent — onboarding never waits on it.
  if (user?.businessType) {
    void runAutoDiscovery({
      id: user.id,
      businessName: user.businessName,
      businessType: user.businessType,
      city: user.city,
      websiteUrl: user.websiteUrl,
      voiceDescription: user.voiceDescription,
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
