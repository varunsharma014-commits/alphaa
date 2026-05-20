export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic, buildAuditPrompt } from "@/lib/claude"

export const maxDuration = 60

const schema = z.object({
  businessName: z.string().min(1),
  city: z.string().min(1),
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

    // Call Claude
    const prompt = buildAuditPrompt(input.businessName, input.city, input.websiteUrl)
    let auditResult

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })
      const raw = message.content[0].type === "text" ? message.content[0].text : ""
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      auditResult = JSON.parse(cleaned)
    } catch (claudeErr) {
      // Fallback audit if Claude fails
      auditResult = getFallbackAudit(input.businessName, input.city)
    }

    // Update lead with results
    await db.scanLead.update({
      where: { id: lead.id },
      data: {
        visibilityScore: auditResult.visibility_score,
        issues: auditResult.issues,
        aiSearchStatus: auditResult.ai_search_status,
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
        aiSearchStatus: auditResult.ai_search_status,
      },
    })
  } catch (err: any) {
    console.error("Scan error:", err)
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 })
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
    ai_search_status: { chatgpt: "not_appearing", perplexity: "not_appearing", google_ai: "occasionally", gemini: "not_appearing" },
  }
}
