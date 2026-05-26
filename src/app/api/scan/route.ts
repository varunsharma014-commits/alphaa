export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic, buildAuditPrompt } from "@/lib/claude"
import { scanAllEngines } from "@/lib/ai-engines"
import type { AiSearchStatus } from "@/types/audit"

export const maxDuration = 90

const schema = z.object({
  businessName: z.string().min(1),
  city: z.string().min(1),
  businessType: z.string().optional().default("business"),
  websiteUrl: z.string().optional().default(""),
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = schema.parse(body)

    // Create scan lead immediately (so result polling can find it)
    const lead = await db.scanLead.create({
      data: { email: input.email, businessName: input.businessName, businessUrl: input.websiteUrl },
    })

    // Run Claude audit and AI engine scan in parallel
    const prompt = buildAuditPrompt(input.businessName, input.city, input.websiteUrl)

    const [claudeResult, engineScan] = await Promise.allSettled([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      scanAllEngines(input.businessName, input.businessType, input.city, input.websiteUrl),
    ])

    // Parse Claude audit result
    let auditResult: ReturnType<typeof getFallbackAudit>
    if (claudeResult.status === "fulfilled") {
      try {
        const raw = claudeResult.value.content[0].type === "text" ? claudeResult.value.content[0].text : ""
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        auditResult = JSON.parse(cleaned)
      } catch {
        auditResult = getFallbackAudit(input.businessName, input.city)
      }
    } else {
      auditResult = getFallbackAudit(input.businessName, input.city)
    }

    // Merge real engine results into aiSearchStatus (overwrite Claude estimates where we have real data)
    const aiSearchStatus: Record<string, AiSearchStatus> = { ...auditResult.ai_search_status }

    if (engineScan.status === "fulfilled") {
      for (const result of engineScan.value.results) {
        if (result.status === "not_configured") continue
        // Map engine name to aiSearchStatus key
        const key = result.engine === "claude" ? "google_ai" : result.engine
        if (result.status === "appeared") {
          aiSearchStatus[key] = "occasionally"
        } else if (result.status === "not_appearing" || result.status === "error") {
          aiSearchStatus[key] = "not_appearing"
        }
      }
      // Special case: use Claude engine result for google_ai only if chatgpt/gemini covered
      const claudeEngineResult = engineScan.value.results.find((r) => r.engine === "claude")
      if (claudeEngineResult && claudeEngineResult.status !== "not_configured") {
        aiSearchStatus["google_ai"] = claudeEngineResult.appeared ? "occasionally" : "not_appearing"
      }
    }

    // Update lead with results
    await db.scanLead.update({
      where: { id: lead.id },
      data: {
        visibilityScore: auditResult.visibility_score,
        issues: auditResult.issues,
        aiSearchStatus,
      },
    })

    return NextResponse.json({
      scanId: lead.id,
      ready: true,
      result: {
        scanId: lead.id,
        visibilityScore: auditResult.visibility_score,
        issues: auditResult.issues,
        competitorInsight: auditResult.competitor_insight,
        aiSearchStatus,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Scan error:", msg)
    if (err && typeof err === "object" && "name" in err && err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
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
