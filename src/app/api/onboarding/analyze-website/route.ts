export const dynamic = "force-dynamic"
export const maxDuration = 45

import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"

interface WebsiteAnalysis {
  businessName: string
  businessType: string
  city: string
  state: string
  voiceDescription: string
  topicsToAvoid: string
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`
    const res = await fetch(normalized, {
      headers: { "User-Agent": "AlphaaBot/1.0 (onboarding; +https://alphaa.app)" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return ""
    const html = await res.text()
    // Strip HTML tags and collapse whitespace — lightweight, no cheerio needed here
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .slice(0, 6000)
      .trim()
  } catch {
    return ""
  }
}

export async function POST(req: NextRequest) {
  try {
    const { websiteUrl } = await req.json() as { websiteUrl: string }
    if (!websiteUrl) return NextResponse.json({ error: "No URL" }, { status: 400 })

    const pageText = await fetchPageText(websiteUrl)
    if (!pageText) {
      return NextResponse.json({ error: "Could not fetch website" }, { status: 422 })
    }

    const prompt = `You are analyzing a business website to help pre-fill their marketing onboarding.

Website URL: ${websiteUrl}

Page content (first ~6000 chars):
${pageText}

Extract the following and return ONLY valid JSON — no markdown, no explanation:
{
  "businessName": "<the business name, or empty string if unclear>",
  "businessType": "<one of these exact values if you can determine it: Dentist, Lawyer / Law Firm, Med Spa, Plumber, Electrician, HVAC, General Contractor, Real Estate Agent, Restaurant, Retail Store, Chiropractor, Physical Therapist, Accountant / CPA, Insurance Agent, Salon / Barbershop, Auto Repair, Landscaping, Cleaning Service, Photographer, SaaS / Software, Marketing or Ad Agency, Ecommerce / Online Store, Consulting, Professional Services, B2B Services, Agency, Online Education, Media / Publishing, Financial Services, Manufacturing, Nonprofit, or Other>",
  "city": "<city the business is in, or empty string>",
  "state": "<2-letter state abbreviation, or empty string>",
  "voiceDescription": "<2-4 sentences written AS the business owner describing what makes their business different, using the actual details from their website: years in business, specialties, unique approach, team culture, customer experience. Sound natural and human, not corporate. Example: 'We're a family-owned dental practice that's been serving Austin families for 15 years. Our patients always comment on how we make even nervous patients feel comfortable. We specialize in cosmetic work and same-day appointments.'>",
  "topicsToAvoid": "<if you can detect any sensitive topics (e.g. pricing disputes, bad reviews, litigation, specific competitor names they avoid) include them here, otherwise empty string>"
}`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = (response.content[0] as { type: string; text: string }).text
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim()

    const analysis = JSON.parse(raw) as WebsiteAnalysis
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error("[analyze-website]", err)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
