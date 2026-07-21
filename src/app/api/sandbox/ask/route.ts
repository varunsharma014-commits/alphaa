// Live AI Sandbox — asks all four engines a user-supplied question RIGHT NOW.
//
// This spends real API money on every call, so it is rate limited to
// SANDBOX_DAILY_LIMIT questions per user per rolling 24h. The counter is the
// MockActivity ledger (type "sandbox_query") — no schema change needed.
//
// Nothing here ever fabricates an answer: unconfigured/failed engines come back
// from scanAllEngines with status "not_configured"/"error" and an empty
// response, and we pass that through honestly.

export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { scanAllEngines } from "@/lib/ai-engines"
import { extractMentionedBusinesses } from "@/lib/scan-insights"
import { logActivity } from "@/lib/activity"
import { SANDBOX_DAILY_LIMIT, SANDBOX_ACTIVITY_TYPE, sandboxWindowStart } from "@/lib/sandbox"

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

  // ── Rate limit: count sandbox runs in the last rolling 24h ────────────────
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
    console.error("[sandbox] rate-limit count failed:", err)
    return NextResponse.json(
      { error: "We couldn't check your usage right now. Please try again in a minute." },
      { status: 500 }
    )
  }

  if (used >= SANDBOX_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: `You've used your ${SANDBOX_DAILY_LIMIT} live checks today — they reset in a few hours. alphaa also checks automatically every Wednesday.`,
        remaining: 0,
      },
      { status: 429 }
    )
  }

  // Reserve the slot BEFORE spending money, so a crash mid-run can't hand out
  // free extra runs.
  await logActivity(
    user.id,
    SANDBOX_ACTIVITY_TYPE,
    "You asked the AI engines a live question",
    raw.slice(0, 200),
    { question: raw }
  )
  const remaining = Math.max(0, SANDBOX_DAILY_LIMIT - (used + 1))

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

  // Persist the per-engine verdicts so the dashboard's engine pages can use
  // live questions as evidence (see lib/engine-evidence.ts). Deliberately a
  // DIFFERENT activity type from the sandbox_query reservation above — the
  // daily rate limit counts sandbox_query rows, and a second row of that type
  // would make every ask count twice.
  const named = results.filter((r) => r.appeared).map((r) => r.engine)
  await logActivity(
    user.id,
    "sandbox_result",
    named.length > 0 ? `The AI engines answered — ${named.join(", ")} named you` : "The AI engines answered your question",
    raw.slice(0, 200),
    {
      question: raw,
      results: results.map((r) => ({ engine: r.engine, appeared: r.appeared, status: r.status })),
    }
  )

  return NextResponse.json({ question: raw, results, remaining, limit: SANDBOX_DAILY_LIMIT })
}
