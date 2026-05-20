export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId }, select: { subscriptionStatus: true, trialEndsAt: true, plan: true } })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const daysRemaining = user.trialEndsAt
    ? Math.max(0, Math.ceil((user.trialEndsAt.getTime() - Date.now()) / 86400000))
    : null

  return NextResponse.json({ status: user.subscriptionStatus, daysRemaining, plan: user.plan })
}
