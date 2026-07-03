export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

// Saves onboarding progress WITHOUT completing onboarding, and lets the
// client rehydrate its state (e.g. after the Google OAuth redirect).

const STRING_FIELDS = [
  "businessName",
  "businessType",
  "city",
  "state",
  "zip",
  "websiteUrl",
  "voiceDescription",
  "topicsToAvoid",
] as const

type StringField = (typeof STRING_FIELDS)[number]

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    profile: {
      businessName: user.businessName ?? "",
      businessType: user.businessType ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      zip: user.zip ?? "",
      websiteUrl: user.websiteUrl ?? "",
      voiceDescription: user.voiceDescription ?? "",
      topicsToAvoid: user.topicsToAvoid ?? "",
      onboardingStep: user.onboardingStep,
      onboardingCompleted: user.onboardingCompleted,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const data: Partial<Record<StringField, string | null>> & {
    onboardingStep?: number
  } = {}

  for (const field of STRING_FIELDS) {
    const value = body[field]
    if (typeof value === "string") {
      data[field] = value.trim() || null
    }
  }

  if (typeof body.onboardingStep === "number" && Number.isFinite(body.onboardingStep)) {
    data.onboardingStep = Math.max(0, Math.min(10, Math.round(body.onboardingStep)))
  }

  // Never sets onboardingCompleted — that stays with /api/user/onboarding-complete
  await db.user.update({ where: { clerkId }, data })

  return NextResponse.json({ success: true })
}
