export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET(): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = await db.crawlResult.findFirst({
      where: { userId: user.id },
      orderBy: { crawledAt: "desc" },
    })

    return NextResponse.json({ result })
  } catch (err) {
    console.error("Crawl latest error:", err)
    return NextResponse.json(
      { error: "Failed to fetch crawl result." },
      { status: 500 }
    )
  }
}
