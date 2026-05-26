export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { generateSchemaMarkup } from "@/lib/schema-generator"

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
        { error: "Add your website URL in settings before generating schema markup." },
        { status: 400 }
      )
    }

    // Fetch phone from integration if available (none in schema currently — pass undefined)
    const schemas = await generateSchemaMarkup(
      user.businessName ?? "My Business",
      user.businessType ?? "Local Business",
      user.city ?? "",
      user.state ?? "",
      user.websiteUrl
    )

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
