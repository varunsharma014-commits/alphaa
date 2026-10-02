export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { runAutoDiscovery } from "@/lib/discover-competitors"
import { completeOnboardingFromScan } from "@/lib/onboarding"

// Signed-in setup is the same agent conversation as /start: the scan already
// knows the business, so finishing it is what completes onboarding.
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { scanId?: unknown; businessType?: unknown }
  if (typeof body.scanId !== "string") return NextResponse.json({ error: "scanId required" }, { status: 400 })

  const user = await completeOnboardingFromScan(clerkId, body.scanId, typeof body.businessType === "string" ? body.businessType : undefined)
  if (!user) return NextResponse.json({ error: "Scan not found" }, { status: 404 })

  if (user.businessType) void runAutoDiscovery({
    id: user.id,
    businessName: user.businessName,
    businessType: user.businessType,
    city: user.city,
    websiteUrl: user.websiteUrl,
    voiceDescription: user.voiceDescription,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
