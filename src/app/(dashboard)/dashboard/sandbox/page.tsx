export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MessagesSquare } from "lucide-react"
import { db } from "@/lib/db"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import SandboxClient from "@/components/dashboard/SandboxClient"
import {
  SANDBOX_DAILY_LIMIT,
  SANDBOX_ACTIVITY_TYPE,
  sandboxWindowStart,
  suggestedQuestion,
} from "@/lib/sandbox"

export default async function SandboxPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  // Gotcha #1 — resolve clerkId to the internal user.id before any child query.
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  // Same counter the API enforces, so the UI opens with a truthful number.
  let used = 0
  try {
    used = await db.mockActivity.count({
      where: {
        userId: user.id,
        type: SANDBOX_ACTIVITY_TYPE,
        createdAt: { gte: sandboxWindowStart() },
      },
    })
  } catch (err) {
    console.error("[sandbox] usage count failed:", err)
  }
  const remaining = Math.max(0, SANDBOX_DAILY_LIMIT - used)

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <AutopilotBar message="alphaa checks the AI engines for you every Wednesday — this asks them live, right now" />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <MessagesSquare size={20} color="var(--ds-accent)" />
        <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>Ask the AIs about your business</h1>
      </div>
      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginBottom: "16px" }}>
        Type any question a customer might ask, and see what ChatGPT, Claude, Gemini and Perplexity actually answer
        &mdash; right now.
      </p>

      <SandboxClient
        businessName={user.businessName ?? ""}
        placeholder={suggestedQuestion(user.businessType, user.city)}
        initialRemaining={remaining}
        limit={SANDBOX_DAILY_LIMIT}
      />
    </div>
  )
}
