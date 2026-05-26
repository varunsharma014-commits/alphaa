export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { crawlWebsite } from "@/lib/crawler"

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
        { error: "Add your website URL in settings" },
        { status: 400 }
      )
    }

    const output = await crawlWebsite(user.websiteUrl)

    const result = await db.crawlResult.create({
      data: {
        userId: user.id,
        url: user.websiteUrl,
        pagesScanned: output.pagesScanned,
        issues: output.issues,
        schemaFound: output.schemaFound,
        schemaMissing: output.schemaMissing,
        metaIssues: output.metaIssues,
      },
    })

    return NextResponse.json({ result })
  } catch (err) {
    console.error("Crawl error:", err)
    return NextResponse.json(
      { error: "Crawl failed. Please try again." },
      { status: 500 }
    )
  }
}
