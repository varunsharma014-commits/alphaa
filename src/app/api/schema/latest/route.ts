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

    const latest = await db.schemaMarkup.findFirst({
      where: { userId: user.id },
      orderBy: { generatedAt: "desc" },
    })

    if (!latest) {
      return NextResponse.json({ schemaMarkup: null })
    }

    return NextResponse.json({
      schemaMarkup: {
        id: latest.id,
        schemas: latest.schemas,
        generatedAt: latest.generatedAt,
      },
    })
  } catch (err) {
    console.error("Schema latest error:", err)
    return NextResponse.json({ error: "Failed to fetch schema markup." }, { status: 500 })
  }
}
