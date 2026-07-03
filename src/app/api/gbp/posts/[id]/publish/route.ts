import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { postToGmb } from "@/lib/gbp-poster"
import { logActivity } from "@/lib/activity"

export const dynamic = "force-dynamic"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { integration: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await db.gbpPost.findUnique({
      where: { id },
      select: { id: true, userId: true, content: true, postType: true, status: true },
    })

    if (!post || post.userId !== user.id) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const integration = user.integration
    if (!integration || !integration.gmbAccountId || !integration.gmbLocationId) {
      return NextResponse.json(
        { error: "No GMB account connected" },
        { status: 400 }
      )
    }

    const result = await postToGmb(
      integration.accessToken,
      integration.gmbAccountId,
      integration.gmbLocationId,
      post.content,
      post.postType
    )

    if (!result.success) {
      await db.gbpPost.update({
        where: { id },
        data: { status: "failed" },
      })
      return NextResponse.json(
        { error: result.error ?? "Failed to publish post" },
        { status: 500 }
      )
    }

    const updated = await db.gbpPost.update({
      where: { id },
      data: {
        status: "posted",
        gmbPostId: result.gmbPostId ?? null,
        postedAt: new Date(),
      },
    })

    await logActivity(
      user.id,
      "gbp_post",
      "alphaa published a Google post for you",
      `${post.content.slice(0, 60)}${post.content.length > 60 ? "…" : ""}`
    )

    return NextResponse.json({ post: updated })
  } catch (err) {
    console.error("[GBP] publish post error:", err)
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 })
  }
}
