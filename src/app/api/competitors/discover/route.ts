export const dynamic = "force-dynamic"
export const maxDuration = 300

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { runAutoDiscovery } from "@/lib/discover-competitors"
import { isSearchConfigured } from "@/lib/apify-search"

// Manual trigger for competitor auto-discovery + content-gap generation.
// Powers the "Find competitors now" button on Competitor Intel.
export async function POST(): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (!isSearchConfigured()) {
    return NextResponse.json(
      { error: "Search is not configured yet. Please try again shortly." },
      { status: 503 },
    )
  }
  if (!user.businessType || !user.city) {
    return NextResponse.json(
      { error: "Add your business type and city in settings first." },
      { status: 400 },
    )
  }

  const result = await runAutoDiscovery({
    id: user.id,
    businessName: user.businessName,
    businessType: user.businessType,
    city: user.city,
    websiteUrl: user.websiteUrl,
  })

  return NextResponse.json({ success: true, ...result })
}
