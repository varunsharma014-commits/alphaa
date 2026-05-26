import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateGbpPost } from "@/lib/gbp-poster"

export const dynamic = "force-dynamic"

const POST_TYPES: Array<"UPDATE" | "OFFER" | "EVENT"> = [
  "UPDATE",
  "OFFER",
  "EVENT",
  "UPDATE",
  "OFFER",
  "UPDATE",
  "EVENT",
  "UPDATE",
]

const TOPICS = [
  "What makes us different from the competition",
  "This week's special deal for new customers",
  "Upcoming community event we're excited about",
  "Customer success story and recent results",
  "Seasonal promotion — limited time only",
  "Behind the scenes — how we serve our customers",
  "Free workshop or consultation this month",
  "Top tip from our team for local customers",
]

export async function POST() {
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

    const businessName =
      user.integration?.gmbLocationName ?? user.businessName ?? "Our Business"
    const businessType = user.businessType ?? "local business"
    const city = user.city ?? "your city"

    const posts = []
    for (let i = 0; i < 8; i++) {
      const postType = POST_TYPES[i]
      const topic = TOPICS[i]

      try {
        const generated = await generateGbpPost(
          businessName,
          businessType,
          city,
          postType,
          topic
        )

        const post = await db.gbpPost.create({
          data: {
            userId: user.id,
            content: generated.content,
            postType,
            status: "draft",
          },
        })

        posts.push(post)
      } catch (err) {
        console.error(`[GBP] generate-month post ${i + 1} error:`, err)
        // Continue generating remaining posts
      }
    }

    return NextResponse.json({ posts, count: posts.length })
  } catch (err) {
    console.error("[GBP] generate-month error:", err)
    return NextResponse.json(
      { error: "Failed to generate monthly posts" },
      { status: 500 }
    )
  }
}
