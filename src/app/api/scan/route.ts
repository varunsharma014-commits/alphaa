export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic, buildAuditPrompt } from "@/lib/claude"
import { scanAllEngines, type EngineResult } from "@/lib/ai-engines"
import {
  inferBusinessProfile,
  extractMentionedBusinesses,
  estimateMonthlyLoss,
  buildCompetitorList,
  buildCompetitorDetails,
  fetchKeywordSerp,
  fallbackKeyword,
  type BusinessProfile,
} from "@/lib/scan-insights"
import type { AiSearchStatus } from "@/types/audit"
import type { EngineEvidence, ScanInsights, ScanSerp, CompetitorDetail } from "@/types/scan"

type SiteOg = {
  title: string
  description: string
  image: string | null
  favicon: string
  domain: string
}

// Fetch the site once: OG metadata for the results page + a text excerpt that
// grounds the business-profile inference (so queries match what the site sells).
async function fetchSiteData(websiteUrl: string): Promise<{ og: SiteOg | null; text: string }> {
  if (!websiteUrl) return { og: null, text: "" }
  try {
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } })
    const html = await res.text()
    const { load } = await import("cheerio")
    const $ = load(html)
    const domain = new URL(url).hostname
    const og: SiteOg = {
      title: $('meta[property="og:title"]').attr("content") || $("title").text().trim() || "",
      description: $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "",
      image: $('meta[property="og:image"]').attr("content") || null,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      domain,
    }
    $("script, style, noscript, svg").remove()
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 1200)
    return { og, text }
  } catch {
    return { og: null, text: "" }
  }
}

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
      data: { email: input.email, businessName: input.businessName, businessUrl: input.websiteUrl, city: input.city },
    })

    const prompt = buildAuditPrompt(input.businessName, input.city, input.websiteUrl)

    // Engine pipeline: site fetch → business profile (haiku) → engine scan with
    // ONE business-specific customer question. If profile inference fails,
    // scanAllEngines falls back to its generic queries (old behavior).
    // Runs in parallel with the sonnet audit, which usually takes longer.
    const enginePipeline = (async () => {
      const site = await fetchSiteData(input.websiteUrl)
      let profile: BusinessProfile | null = null
      try {
        profile = await inferBusinessProfile({
          businessName: input.businessName,
          businessType: input.businessType,
          city: input.city,
          websiteUrl: input.websiteUrl,
          siteTitle: site.og?.title,
          siteDescription: site.og?.description,
          siteText: site.text,
        })
      } catch {
        profile = null
      }
      const scan = await scanAllEngines(
        input.businessName,
        input.businessType,
        input.city,
        input.websiteUrl,
        profile?.query
      )
      return { site, profile, scan }
    })()

    const [claudeResult, pipelineSettled] = await Promise.allSettled([
      anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      enginePipeline,
    ])

    // Parse Claude audit result
    let auditResult: ReturnType<typeof getFallbackAudit>
    if (claudeResult.status === "fulfilled") {
      try {
        const raw = claudeResult.value.content[0].type === "text" ? claudeResult.value.content[0].text : ""
        const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        auditResult = JSON.parse(cleaned)
      } catch {
        auditResult = getFallbackAudit(input.businessName, input.city, input.businessType)
      }
    } else {
      auditResult = getFallbackAudit(input.businessName, input.city, input.businessType)
    }

    const pipeline = pipelineSettled.status === "fulfilled" ? pipelineSettled.value : null
    const profile = pipeline?.profile ?? null
    const engineResults: EngineResult[] = pipeline?.scan.results ?? []
    const site = pipeline?.site ?? { og: null, text: "" }

    // Merge real engine results into aiSearchStatus (overwrite Claude estimates where we have real data)
    const aiSearchStatus: Record<string, AiSearchStatus> = { ...auditResult.ai_search_status }

    for (const result of engineResults) {
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
    const claudeEngineResult = engineResults.find((r) => r.engine === "claude")
    if (claudeEngineResult && claudeEngineResult.status !== "not_configured") {
      aiSearchStatus["google_ai"] = claudeEngineResult.appeared ? "occasionally" : "not_appearing"
    }

    // Resolve industry + locality: the profile that actually drove the queries
    // wins; the audit's inference is the fallback; a real user-supplied business
    // type is the last resort. The generic default "business" is never used.
    const auditIndustry =
      typeof auditResult.industry === "string" && auditResult.industry.trim().toLowerCase() !== "business"
        ? auditResult.industry.trim()
        : ""
    const typedIndustry =
      input.businessType && input.businessType.trim().toLowerCase() !== "business" ? input.businessType.trim() : ""
    const industry = profile?.industry || auditIndustry || typedIndustry
    const isLocal = profile?.isLocal ?? (typeof auditResult.is_local === "boolean" ? auditResult.is_local : true)

    // The customer-facing Google search phrase (2-4 words). Comes from the
    // same haiku profile that drove the engine queries; derived from industry
    // when the profile failed. Empty only when industry is empty (insights
    // will be null then anyway — no keyword, no SERP run).
    const keyword = profile?.keyword || fallbackKeyword(industry, isLocal, input.city)

    // Post-engine intelligence: mention extraction + loss estimate + Google
    // SERP evidence for the keyword, all in parallel. SERP is the scan's ONE
    // Apify run (20s cap inside fetchKeywordSerp). Everything is best-effort —
    // failures degrade to []/null, never break the scan.
    const [mentionedSettled, lossSettled, serpSettled] = await Promise.allSettled([
      extractMentionedBusinesses(engineResults, input.businessName, input.websiteUrl),
      industry ? estimateMonthlyLoss(industry, isLocal, input.city, keyword) : Promise.resolve(null),
      keyword ? fetchKeywordSerp(keyword) : Promise.resolve<ScanSerp | null>(null),
    ])
    const extraction =
      mentionedSettled.status === "fulfilled" ? mentionedSettled.value : { mentioned: {}, domains: {} }
    const mentionedByEngine = extraction.mentioned
    const monthlyLoss = lossSettled.status === "fulfilled" ? lossSettled.value : null
    const serp = serpSettled.status === "fulfilled" ? serpSettled.value : null

    // New-contract engine responses: { query, response (<=900), appeared, mentioned }
    const engineResponses: Record<string, EngineEvidence> = {}
    for (const r of engineResults) {
      if (r.status === "not_configured" || !r.response) continue
      engineResponses[r.engine] = {
        query: r.query,
        response: r.response.slice(0, 900),
        appeared: r.appeared,
        mentioned: mentionedByEngine[r.engine] ?? [],
      }
    }

    // v1 competitor names (unchanged shape) + v2 enrichment: each name matched
    // against the SERP for link + Google-rank evidence. Pure code, but guarded
    // anyway — competitor intel must never fail the scan.
    const competitors = buildCompetitorList(mentionedByEngine)
    let competitorDetails: CompetitorDetail[] = []
    try {
      competitorDetails = buildCompetitorDetails(competitors, mentionedByEngine, serp, input.websiteUrl, extraction.domains)
    } catch {
      competitorDetails = []
    }

    // insights is null only when we couldn't determine a real industry at all —
    // the results page hides the block in that case.
    const insights: ScanInsights | null = industry
      ? {
          industry,
          isLocal,
          competitors,
          keyword,
          serp,
          competitorDetails,
          estimatedMonthlyLoss: monthlyLoss,
        }
      : null

    // ogData is ALWAYS an object for new scans and always carries `insights`
    // (possibly null), even when the OG fetch itself failed.
    const ogData = { ...(site.og ?? {}), insights }

    // Update lead with results
    await db.scanLead.update({
      where: { id: lead.id },
      data: {
        visibilityScore: auditResult.visibility_score,
        issues: auditResult.issues,
        aiSearchStatus,
        ogData: ogData as object,
        engineResponses: engineResponses as object,
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
        businessName: input.businessName,
        city: input.city,
        businessUrl: input.websiteUrl,
        ogData,
        engineResponses,
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

function getFallbackAudit(businessName: string, city: string, businessType: string) {
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
    industry: businessType && businessType.toLowerCase() !== "business" ? businessType : "",
    is_local: true,
  }
}
