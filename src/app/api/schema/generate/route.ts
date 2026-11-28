export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateSchemaFor } from "@/lib/schema-generator"

export async function POST(): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.websiteUrl) {
      return NextResponse.json(
        { error: "Tell me your website in Agent preferences first, then I’ll write this." },
        { status: 400 }
      )
    }

    // Built from real data only and validated (lib/schema-generator.ts); FAQPage only from the site's own Q&A.
    const { schemas } = await generateSchemaFor(user)
    if (!schemas.length) return NextResponse.json({ error: "I need your business name and website before I can write this." }, { status: 400 })

    const record = await db.schemaMarkup.create({
      data: {
        userId: user.id,
        schemas: schemas as unknown as object,
      },
    })

    return NextResponse.json({ id: record.id, schemas, generatedAt: record.generatedAt })
  } catch (err) {
    console.error("Schema generate error:", err)
    return NextResponse.json({ error: "Schema generation failed. Please try again." }, { status: 500 })
  }
}
