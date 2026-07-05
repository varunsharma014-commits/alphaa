export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { runVisibilityScan } from "@/lib/visibility-scan"

export const maxDuration = 90

// Thin Clerk-authed wrapper — the scan itself lives in src/lib/visibility-scan.ts
// so the weekly cron can run the exact same logic.
export async function POST(_req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const result = await runVisibilityScan(user.id)
  return NextResponse.json(result)
}
