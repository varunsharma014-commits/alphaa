import { crawlWebsite } from "@/lib/crawler"
import { anthropic } from "@/lib/claude"

export type CompetitorAnalysis = {
  name: string
  url: string
  crawlData: {
    pagesFound: number
    schemaTypes: string[]
    estimatedPostingFrequency: string
    keyTopics: string[]
    strengths: string[]
    weaknesses: string[]
  }
  aiSummary: string
}

function extractDomainName(url: string): string {
  try {
    const parsed = new URL(url)
    // e.g. "www.acme.com" → "Acme"
    const hostname = parsed.hostname.replace(/^www\./, "")
    const domain = hostname.split(".")[0]
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return "Competitor"
  }
}

interface CrawlSummary {
  pagesScanned: number
  schemaFound: string[]
  issueCount: number
  missingTitles: number
  missingDescriptions: number
  missingH1: number
  imagesWithoutAlt: number
}

async function analyzeWithClaude(
  competitorUrl: string,
  businessType: string,
  city: string,
  crawlSummary: CrawlSummary | null
): Promise<{
  estimatedPostingFrequency: string
  keyTopics: string[]
  strengths: string[]
  weaknesses: string[]
  aiSummary: string
}> {
  const crawlContext = crawlSummary
    ? `
Crawl results for ${competitorUrl}:
- Pages scanned: ${crawlSummary.pagesScanned}
- Schema types found: ${crawlSummary.schemaFound.length > 0 ? crawlSummary.schemaFound.join(", ") : "none"}
- Total SEO issues found: ${crawlSummary.issueCount}
- Pages missing title tags: ${crawlSummary.missingTitles}
- Pages missing meta descriptions: ${crawlSummary.missingDescriptions}
- Pages missing H1: ${crawlSummary.missingH1}
- Images without alt text: ${crawlSummary.imagesWithoutAlt}
`
    : `
The website ${competitorUrl} could not be crawled. Analyze based on the URL and business context only.
`

  const prompt = `You are advising a business owner directly about one of their competitors. Speak TO them as "you" and "your business" — never describe their business type in the third person (never write "For a ${businessType}, this means…"; write "For you, this means…").

The owner runs a ${businessType} in ${city}. Their competitor is ${competitorUrl}.

${crawlContext}

Based on this data, return ONLY valid JSON — no markdown, no explanation:

{
  "estimatedPostingFrequency": "<one of: Daily, Weekly, Monthly, Rarely>",
  "keyTopics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>", "<topic 5>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "aiSummary": "<2-3 sentences spoken directly to the owner as 'you', covering what this competitor is doing online and where your opening is. No jargon.>"
}

Rules:
- estimatedPostingFrequency: base it on pages found (20+ = Daily, 10-19 = Weekly, 3-9 = Monthly, 0-2 = Rarely). If crawl failed, infer from business type.
- keyTopics: infer from the competitor URL, domain name, and business type — what they likely write about
- strengths: what this competitor genuinely does well — i.e. what you are up against
- weaknesses: real openings YOU can win, phrased as your advantage
- PLAIN ENGLISH ONLY. The reader is a busy owner, not a marketer. NEVER use the words: schema, alt text, crawlable, crawl, H1, meta description, SEO issues, indexed, structured data, organic visibility. Translate every technical fact into what it means for winning customers:
  - "no missing alt text" -> "their photos are labelled so Google and AI can understand them"
  - "minimal crawlable pages" -> "AI engines can only read a small part of their site — that is an opening for you"
  - "missing schema" -> "they have not told AI what their business actually does"
  - "six SEO issues on two pages" -> "their site has basic problems that hold it back in search"
- aiSummary: written for a non-technical business owner, no jargon like "schema" or "SEO score" — say "Google-friendly setup" instead
- All arrays must have exactly the number of items specified above
- Do NOT use the words: schema, AEO, LLM, entity, structured data, semantic, generative engine`

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude")
  }

  // Strip markdown code fences if present
  const raw = content.text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  const parsed = JSON.parse(raw)

  return {
    estimatedPostingFrequency: parsed.estimatedPostingFrequency ?? "Monthly",
    keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    aiSummary: parsed.aiSummary ?? "",
  }
}

export async function analyzeCompetitor(
  competitorUrl: string,
  businessName: string,
  businessType: string,
  city: string
): Promise<CompetitorAnalysis> {
  const name = businessName || extractDomainName(competitorUrl)

  // Step 1: Attempt to crawl
  let crawlSummary: CrawlSummary | null = null
  let pagesFound = 0
  let schemaTypes: string[] = []

  try {
    const crawlOutput = await crawlWebsite(competitorUrl, 20)
    pagesFound = crawlOutput.pagesScanned
    schemaTypes = crawlOutput.schemaFound

    crawlSummary = {
      pagesScanned: crawlOutput.pagesScanned,
      schemaFound: crawlOutput.schemaFound,
      issueCount: crawlOutput.issues.length,
      missingTitles: crawlOutput.metaIssues.missingTitles,
      missingDescriptions: crawlOutput.metaIssues.missingDescriptions,
      missingH1: crawlOutput.metaIssues.missingH1,
      imagesWithoutAlt: crawlOutput.metaIssues.imagesWithoutAlt,
    }
  } catch {
    // Crawl failed — Claude will do a best-effort analysis from the URL alone
    crawlSummary = null
  }

  // Step 2: Ask Claude to produce analysis fields
  const aiResult = await analyzeWithClaude(competitorUrl, businessType, city, crawlSummary)

  return {
    name,
    url: competitorUrl,
    crawlData: {
      pagesFound,
      schemaTypes,
      estimatedPostingFrequency: aiResult.estimatedPostingFrequency,
      keyTopics: aiResult.keyTopics,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
    },
    aiSummary: aiResult.aiSummary,
  }
}
