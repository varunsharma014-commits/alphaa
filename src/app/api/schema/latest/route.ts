export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { trustedSchemas } from "@/lib/schema-generator"

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

    // Only blocks built from real facts; an older AI-made record counts as none, so callers rewrite it.
    const schemas = trustedSchemas(latest?.schemas)
    if (!latest || !schemas.length) {
      return NextResponse.json({ schemaMarkup: null })
    }

    return NextResponse.json({
      schemaMarkup: {
        id: latest.id,
        schemas,
        generatedAt: latest.generatedAt,
      },
    })
  } catch (err) {
    console.error("Schema latest error:", err)
    return NextResponse.json({ error: "Failed to fetch schema markup." }, { status: 500 })
  }
}
