import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// DELETE /api/competitors/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { id } = await params

  // Verify the competitor belongs to this user before deleting
  const competitor = await db.competitor.findFirst({
    where: { id, userId: user.id },
  })

  if (!competitor) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 })
  }

  await db.competitor.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
