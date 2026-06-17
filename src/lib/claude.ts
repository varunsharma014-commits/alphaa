import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export function buildAuditPrompt(businessName: string, city: string, websiteUrl: string) {
  return `You are Alphaa's visibility audit engine. Analyze this business and generate a realistic visibility audit.

Business: ${businessName}
Location: ${city}
Website: ${websiteUrl}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "visibility_score": <integer between 30 and 72>,
  "issues": [
    {
      "severity": "critical" | "warning" | "improvement",
      "headline": "<6-10 word plain English issue title>",
      "explanation": "<2 sentences, no jargon, written for a 50-year-old business owner>",
      "fix_summary": "<1 sentence: what Alphaa will do to fix this>"
    }
  ],
  "competitor_insight": "<1-2 sentences about competitors getting found on searches when you aren't>",
  "ai_search_status": {
    "chatgpt": "not_appearing" | "occasionally" | "frequently",
    "perplexity": "not_appearing" | "occasionally" | "frequently",
    "google_ai": "not_appearing" | "occasionally" | "frequently",
    "gemini": "not_appearing" | "occasionally" | "frequently"
  }
}

Rules:
- Exactly 6 issues
- Weight score toward 38-58 range to feel realistic, not too bad or too good
- Issues must be specific to the business type — mention it by name. If the business serves a local area, also reference the city by name; if it serves customers online, nationally, or B2B, focus on its audience and offering instead of a city
- NEVER use words: schema, AEO, LLM, entity, structured data, semantic, generative engine
- DO use: Google, ChatGPT, Maps, "your website", "your business profile", "people searching for what you offer"
- Always include at least: weak Google Business Profile activity, missing FAQ content, low AI search appearance, inconsistent business info across the web, thin or missing pages for your key services or offerings, no recent reviews
- Make it feel like a real audit, not a template`
}
