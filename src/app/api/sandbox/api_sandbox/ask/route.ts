// Live AI Sandbox — asks all four engines a user-supplied question RIGHT NOW.
//
// This spends real API money on every call, so it is limited per plan per UTC day by the
// quota ledger (lib/quotas.ts sandbox_question; QUOTAS_JSON overrides the numbers).
//
// Nothing here ever fabricates an answer: unconfigured/failed engines come back
// from scanAllEngines with status "not_configured"/"error" and an empty
// response, and we pass that through honestly.

export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { scanAllEngines } from "@/lib/ai-engines"
import { extractMentionedBusinesses } from "@/lib/scan-insights"
import { logActivity } from "@/lib/activity"
import { SANDBOX_DAILY_LIMIT, SANDBOX_ACTIVITY_TYPE } from "@/lib/sandbox"
import { checkQuota, isQuotaError, refundQuota } from "@/lib/quotas"

export type SandboxEngineResult = {
  engine: "chatgpt" | "claude" | "gemini" | "perplexity"
  answer: string
  appeared: boolean
  mentioned: string[]
  status: "appeared" | "not_appearing" | "not_configured" | "error"
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  }

  // Gotcha #1 — never use clerkId as a child FK; resolve the internal user.id.
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({ error: "We couldn't find your account." }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Please send a question." }, { status: 400 })
  }

  const raw =
    typeof body === "object" && body !== null && typeof (body as { question?: unknown }).question === "string"
      ? (body as { question: string }).question.trim()
      : ""

  if (raw.length < 5 || raw.length > 200) {
    return NextResponse.json(
      { error: "Your question needs to be between 5 and 200 characters." },
      { status: 400 }
    )
  }

  // ── Plan quota (lib/quota-rules sandbox_question: Starter 20/day, Pro and Growth 50/day) ──
  // Recorded BEFORE spending money, so a crash mid-run can't hand out free extra runs.
  const quota = await checkQuota(user, "sandbox_question")
  if (!quota.allowed) {
    return NextResponse.json({ error: quota.message, remaining: 0, quota: true, buy: true }, { status: 429 })
  }
  // The ledger row the engine pages and the work log read (no longer the rate-limit counter).
  await logActivity(
    user.id,
    SANDBOX_ACTIVITY_TYPE,
    "You asked the AI engines a live question",
    raw.slice(0, 200),
    { question: raw }
  )
  const remaining = quota.remaining ?? 0
  const limit = quota.limit ?? SANDBOX_DAILY_LIMIT

  const businessName = user.businessName ?? ""
  const websiteUrl = user.websiteUrl ?? ""

  let engineResults
  try {
    const scan = await scanAllEngines(
      businessName,
      user.businessType ?? "",
      user.city ?? "",
      websiteUrl,
      raw
    )
    engineResults = scan.results
  } catch (err) {
    if (isQuotaError(err)) {
      refundQuota(user.id, "sandbox_question")
      return NextResponse.json({ error: err.message, remaining: 0, quota: true, buy: true }, { status: 429 })
    }
    console.error("[sandbox] scanAllEngines failed:", err)
    return NextResponse.json(
      { error: "The live check didn't finish this time. Please try again in a minute." },
      { status: 502 }
    )
  }

  // ONE batched haiku call across all answers → who each engine named.
  let mentionedByEngine: Record<string, string[]> = {}
  try {
    const extraction = await extractMentionedBusinesses(
      engineResults.map((r) => ({ engine: r.engine, query: r.query, response: r.response })),
      businessName,
      websiteUrl
    )
    if (extraction && typeof extraction.mentioned === "object" && extraction.mentioned !== null) {
      mentionedByEngine = extraction.mentioned
    }
  } catch (err) {
    // Mentions are an enhancement — never fail the whole run over them.
    console.error("[sandbox] extractMentionedBusinesses failed:", err)
  }

  const results: SandboxEngineResult[] = engineResults.map((r) => {
    const m = mentionedByEngine[r.engine]
    return {
      engine: r.engine,
      answer: r.response ?? "",
      appeared: Boolean(r.appeared),
      mentioned: Array.isArray(m) ? m.filter((n): n is string => typeof n === "string") : [],
      status: r.status,
    }
  })

  return NextResponse.json({ question: raw, results, remaining, limit })
}
