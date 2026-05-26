import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function DELETE(
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
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const post = await db.gbpPost.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    })

    if (!post || post.userId !== user.id) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft posts can be deleted" },
        { status: 400 }
      )
    }

    await db.gbpPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[GBP] delete post error:", err)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }
}
