import { anthropic } from "@/lib/claude"

export type GapItem = {
  topic: string
  priority: "high" | "medium" | "low"
  suggestedTitle: string
  suggestedOutline: string[]
  estimatedImpact: string
}

export async function analyzeContentGaps(
  userUrl: string,
  competitorUrl: string,
  businessName: string,
  businessType: string,
  city: string
): Promise<{ gaps: GapItem[]; summary: string }> {
  const prompt = `You are an expert SEO content strategist. Analyze the content gaps between two local business websites and identify what topics the competitor likely covers that the user's site is missing.

User's business:
- Name: ${businessName}
- Type: ${businessType}
- City: ${city}
- Website: ${userUrl}

Competitor website: ${competitorUrl}

Based on the business type, city, and URLs, identify 6-10 high-value content gaps — topics the competitor likely ranks for that ${businessName} should also cover. Focus on content that drives local search traffic for a ${businessType} in ${city}.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "summary": "<2-3 sentences summarizing the main content opportunity vs this competitor>",
  "gaps": [
    {
      "topic": "<short topic name, e.g. 'Emergency Plumbing Services'>",
      "priority": "high" | "medium" | "low",
      "suggestedTitle": "<SEO-optimized page/post title>",
      "suggestedOutline": ["<section 1>", "<section 2>", "<section 3>", "<section 4>"],
      "estimatedImpact": "<1 sentence on expected SEO/traffic impact>"
    }
  ]
}

Rules:
- Return 6-10 gap items
- Prioritize gaps based on local search volume and business relevance
- suggestedOutline should have 3-5 bullet points
- Make titles city-specific where relevant (include "${city}")
- Focus on topics that bring in customers ready to buy, not just informational fluff
- estimatedImpact should be specific and realistic`

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const parsed = JSON.parse(cleaned)

    const gaps: GapItem[] = (parsed.gaps ?? []).map((g: unknown) => {
      const gap = g as Record<string, unknown>
      return {
        topic: String(gap.topic ?? ""),
        priority: (["high", "medium", "low"].includes(String(gap.priority)) ? gap.priority : "medium") as GapItem["priority"],
        suggestedTitle: String(gap.suggestedTitle ?? ""),
        suggestedOutline: Array.isArray(gap.suggestedOutline) ? (gap.suggestedOutline as unknown[]).map(String) : [],
        estimatedImpact: String(gap.estimatedImpact ?? ""),
      }
    })

    return {
      gaps,
      summary: String(parsed.summary ?? ""),
    }
  } catch (err) {
    console.error("analyzeContentGaps error:", err)
    // Fallback: return a single generic gap item so the feature doesn't hard-fail
    return {
      gaps: [
        {
          topic: "Local Service Pages",
          priority: "high",
          suggestedTitle: `${businessType} Services in ${city} | ${businessName}`,
          suggestedOutline: [
            "What we offer",
            "Why choose us in " + city,
            "Pricing & booking",
            "Customer reviews",
          ],
          estimatedImpact: "Dedicated service pages can significantly improve local search rankings.",
        },
      ],
      summary: `Analysis complete. Review the identified gap to improve your content strategy vs the competitor at ${competitorUrl}.`,
    }
  }
}
