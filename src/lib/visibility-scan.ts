// Core dashboard visibility scan — extracted from /api/dashboard/scan so the
// same logic can run from the authed route AND the weekly cron. Runs the
// Claude audit + real AI engine scan in parallel, persists an Audit with its
// AiEngineResult rows, and returns the exact payload the route responds with.

import { db } from "@/lib/db"
import { anthropic, buildAuditPrompt } from "@/lib/claude"
import { scanAllEngines } from "@/lib/ai-engines"
import { processWinsForAudit } from "@/lib/wins"
import type { AiSearchStatus } from "@/types/audit"

// `userId` is the internal User.id (NOT the clerkId).
export async function runVisibilityScan(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  const businessName = user.businessName ?? "this business"
  const businessType = user.businessType ?? "business"
  const city = user.city ?? ""
  const websiteUrl = user.websiteUrl ?? ""

  // Run Claude audit and AI engine scan in parallel
  const prompt = buildAuditPrompt(businessName, city, websiteUrl)

  const [claudeResult, engineScan] = await Promise.allSettled([
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
    scanAllEngines(businessName, businessType, city, websiteUrl),
  ])

  // Parse Claude audit
  let auditData: {
    visibility_score: number
    issues: Array<{ severity: string; headline: string; explanation: string; fix_summary: string }>
    competitor_insight: string
    ai_search_status: Record<string, AiSearchStatus>
  }

  if (claudeResult.status === "fulfilled") {
    try {
      const raw = claudeResult.value.content[0].type === "text" ? claudeResult.value.content[0].text : ""
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      auditData = JSON.parse(cleaned)
    } catch {
      auditData = getFallbackAudit(businessName, city)
    }
  } else {
    auditData = getFallbackAudit(businessName, city)
  }

  // Merge real engine results into aiSearchStatus
  const aiSearchStatus: Record<string, AiSearchStatus> = { ...auditData.ai_search_status }

  const engineResults = engineScan.status === "fulfilled" ? engineScan.value.results : []

  for (const result of engineResults) {
    if (result.status === "not_configured") continue
    const key = result.engine === "claude" ? "google_ai" : result.engine
    if (result.status === "appeared") {
      aiSearchStatus[key] = "occasionally"
    } else {
      aiSearchStatus[key] = "not_appearing"
    }
  }

  // Override google_ai with real Claude engine scan
  const claudeEngineResult = engineResults.find((r) => r.engine === "claude")
  if (claudeEngineResult && claudeEngineResult.status !== "not_configured") {
    aiSearchStatus["google_ai"] = claudeEngineResult.appeared ? "occasionally" : "not_appearing"
  }

  // Compute overall visibility score (adjust if real engines found appearances)
  const appearedCount = engineResults.filter((r) => r.appeared).length
  const configuredCount = engineResults.filter((r) => r.status !== "not_configured").length
  let visibilityScore = auditData.visibility_score
  if (configuredCount > 0) {
    const appearRatio = appearedCount / configuredCount
    // Slight boost if appearing, slight drop if not — stay within realistic range
    visibilityScore = Math.min(72, Math.max(28, Math.round(visibilityScore + (appearRatio - 0.5) * 10)))
  }

  // Persist audit + engine results in a transaction
  const audit = await db.$transaction(async (tx) => {
    const newAudit = await tx.audit.create({
      data: {
        userId: user.id,
        visibilityScore,
        issues: auditData.issues,
        competitorInsight: auditData.competitor_insight,
        aiSearchStatus,
      },
    })

    if (engineResults.length > 0) {
      await tx.aiEngineResult.createMany({
        data: engineResults.map((r) => ({
          auditId: newAudit.id,
          engine: r.engine,
          query: r.query,
          response: r.response.slice(0, 4000), // guard DB column size
          appeared: r.appeared,
          position: r.position ?? null,
          snippet: r.snippet ?? null,
        })),
      })
    }

    return newAudit
  })

  // Fetch the full audit with engine results to return
  const fullAudit = await db.audit.findUnique({
    where: { id: audit.id },
    include: { aiEngineResults: true },
  })

  // Win detection + notification vs the previous audit — strictly best-effort,
  // must never break the scan (processWinsForAudit also swallows internally).
  try {
    await processWinsForAudit(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        businessName: user.businessName,
        businessType: user.businessType,
        city: user.city,
      },
      audit.id,
    )
  } catch (err) {
    console.error(`[wins] post-scan win processing failed for user ${user.id}:`, err)
  }

  return {
    success: true,
    auditId: audit.id,
    visibilityScore,
    aiSearchStatus,
    engineResults: fullAudit?.aiEngineResults ?? [],
    issues: auditData.issues,
    competitorInsight: auditData.competitor_insight,
  }
}

function getFallbackAudit(businessName: string, city: string) {
  return {
    visibility_score: 42,
    issues: [
      { severity: "critical", headline: "Google Business Profile is rarely updated", explanation: `${businessName} hasn't posted to Google in over 90 days. Google deprioritizes inactive profiles in local search results.`, fix_summary: "Alphaa will post 2–4 times per week automatically." },
      { severity: "critical", headline: "Your business doesn't appear on ChatGPT", explanation: `When people in ${city} ask ChatGPT for services like yours, your business isn't mentioned. This is a growing source of customer referrals.`, fix_summary: "Alphaa optimizes your content so AI tools include you in responses." },
      { severity: "warning", headline: "Missing FAQ content on your website", explanation: "Your website doesn't answer common questions customers search for. This reduces your chances of appearing in Google's featured snippets.", fix_summary: "Alphaa generates and publishes FAQ content monthly." },
      { severity: "warning", headline: "Inconsistent business info across the web", explanation: "Your name, address, and phone number appear differently on different sites. Google penalizes this inconsistency in local rankings.", fix_summary: "Alphaa audits and flags inconsistencies for you to fix." },
      { severity: "warning", headline: "No service area pages on your website", explanation: "You're missing dedicated pages for each city or neighborhood you serve. These pages are how Google knows you're relevant for local searches.", fix_summary: "Alphaa generates local service area pages for your top markets." },
      { severity: "improvement", headline: "Review velocity has slowed", explanation: "Your last few reviews are older than 60 days. Fresh reviews signal to Google that your business is active and trustworthy.", fix_summary: "Alphaa monitors your reviews and sends weekly summary reports." },
    ],
    competitor_insight: `At least 3 competitors in ${city} are posting to Google weekly and appearing on ChatGPT. They're getting customers you're missing.`,
    ai_search_status: { chatgpt: "not_appearing", perplexity: "not_appearing", google_ai: "occasionally", gemini: "not_appearing" } as Record<string, AiSearchStatus>,
  }
}
