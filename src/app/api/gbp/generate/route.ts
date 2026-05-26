import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateGbpPost } from "@/lib/gbp-poster"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { integration: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = (await request.json()) as { postType?: string; topic?: string }
    const rawPostType = body.postType?.toUpperCase()
    const postType: "UPDATE" | "OFFER" | "EVENT" =
      rawPostType === "OFFER" ? "OFFER" : rawPostType === "EVENT" ? "EVENT" : "UPDATE"
    const topic = body.topic?.trim() || undefined

    // Derive business info from integration or user record
    const businessName =
      user.integration?.gmbLocationName ?? user.businessName ?? "Our Business"
    const businessType = user.businessType ?? "local business"
    const city = user.city ?? "your city"

    const generated = await generateGbpPost(businessName, businessType, city, postType, topic)

    const post = await db.gbpPost.create({
      data: {
        userId: user.id,
        content: generated.content,
        postType,
        status: "draft",
      },
    })

    return NextResponse.json({ post, callToAction: generated.callToAction })
  } catch (err) {
    console.error("[GBP] generate error:", err)
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    )
  }
}
