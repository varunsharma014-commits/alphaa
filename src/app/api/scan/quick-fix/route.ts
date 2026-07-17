export const dynamic = "force-dynamic"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import type { Prisma } from "@prisma/client"

// Public endpoint (under /api/scan/** in the middleware allowlist — same as
// /api/scan/result and /api/scan/email-report).
//
// Generates ONE paste-ready fix for the scanned business: an answer-first FAQ
// block plus matching JSON-LD. The result is cached inside the existing ogData
// Json column (ogData.quickFix) so a scan can only ever cost one generation —
// repeat calls (reload, second device, someone hammering the endpoint) return
// the cached copy. No schema change.

const schema = z.object({ scanId: z.string().min(10).max(64) })

const MODEL = "claude-sonnet-4-6"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export interface QuickFix {
  faqHtml: string
  jsonLd: string
  targetQuestion: string
}

function readCachedQuickFix(ogData: unknown): QuickFix | null {
  if (!isRecord(ogData)) return null
  const raw = ogData.quickFix
  if (!isRecord(raw)) return null
  if (
    typeof raw.faqHtml !== "string" ||
    typeof raw.jsonLd !== "string" ||
    typeof raw.targetQuestion !== "string"
  ) {
    return null
  }
  if (raw.faqHtml.trim().length === 0 || raw.jsonLd.trim().length === 0) return null
  return {
    faqHtml: raw.faqHtml,
    jsonLd: raw.jsonLd,
    targetQuestion: raw.targetQuestion,
  }
}

// Strip markdown fences before JSON.parse (CLAUDE.md gotcha #9).
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim()
}

function buildPrompt(input: {
  businessName: string
  city: string
  websiteUrl: string
  industry: string | null
  keyword: string | null
  isLocal: boolean
}): string {
  const { businessName, city, websiteUrl, industry, keyword, isLocal } = input

  return `You write website content for small businesses so that AI assistants (ChatGPT, Claude, Perplexity, Google AI) can read a plain page and repeat the business's own answers back to customers.

THE BUSINESS
Name: ${businessName}
City / area: ${city || "(not provided)"}
Website: ${websiteUrl || "(not provided)"}
What they do: ${industry || "(unknown — infer conservatively from the name, and stay generic if you cannot tell)"}
What customers search for: ${keyword || "(unknown)"}
Serves one local area: ${isLocal ? "yes" : "no — serves customers online / nationally / B2B"}

YOUR TASK
Produce TWO things this owner can paste onto their website today:

1. faqHtml — an HTML FAQ block with EXACTLY 3 question/answer pairs. The questions must be
   things a REAL customer of THIS kind of business actually asks before buying${keyword ? ` — anchored on "${keyword}"` : ""}${isLocal && city ? ` in ${city}` : ""}.
   Write ANSWER-FIRST: the first sentence of each answer must directly answer the question in
   plain words. Then at most 1-2 more sentences of useful detail. No preamble, no marketing fluff.
   Use this exact structure (semantic, plain HTML — no classes, no scripts, no styling):
   <section>
     <h2>Frequently asked questions</h2>
     <h3>QUESTION</h3>
     <p>ANSWER</p>
     ... (3 total)
   </section>

2. jsonLd — a single JSON-LD script tag containing an @graph with:
   - a FAQPage whose mainEntity questions/answers EXACTLY match the 3 Q&As in faqHtml
     (answers as plain text, no HTML tags inside), and
   - ${isLocal ? "a LocalBusiness" : "an Organization"} node for ${businessName}.
   Format it as: <script type="application/ld+json">\n{ ... }\n</script>
   Pretty-print the JSON with 2-space indentation.

3. targetQuestion — the single most valuable customer question of the three, as a plain string.

ABSOLUTE HONESTY RULES — breaking any of these makes the output useless:
- NEVER invent facts about this business. You do not know their prices, opening hours, phone
  number, address, years in business, staff names, certifications, awards, review counts,
  ratings, guarantees, service area boundaries, or payment methods.
- Wherever a specific fact is genuinely needed, emit a clearly-marked placeholder in square
  brackets for the owner to fill in — e.g. [add your opening hours], [add your starting price],
  [add your phone number], [add your street address]. Placeholders are REQUIRED over guesses.
  This applies inside the JSON-LD too (e.g. "telephone": "[add your phone number]").
- Do NOT claim the business is "the best", "award-winning", "trusted", "leading", "#1",
  "certified", or "highly rated". No superlatives, no social proof you cannot verify.
- Do NOT state anything about the business that is not already given above.
- Do NOT invent an aggregateRating, review, priceRange value, or founding date. Omit those
  fields entirely rather than fabricating or placeholdering a rating.
- Plain English only. NEVER use invented jargon: no "semantic triggers", "entity injection",
  "AI blueprint", "AEO", "LLM optimization", "generative engine", "schema stuffing".
- Make no promises about rankings, citations, or being recommended by AI.
- Answers must be genuinely useful to a customer even with the placeholders in them.

OUTPUT
Return ONLY raw JSON — no markdown, no fences, no commentary:
{
  "faqHtml": "<section>...</section>",
  "jsonLd": "<script type=\\"application/ld+json\\">...</script>",
  "targetQuestion": "..."
}`
}

export async function POST(req: NextRequest) {
  let scanId: string
  try {
    scanId = schema.parse(await req.json()).scanId
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  try {
    const lead = await db.scanLead.findUnique({ where: { id: scanId } })
    if (!lead) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    const ogData: Record<string, unknown> = isRecord(lead.ogData) ? { ...lead.ogData } : {}

    // One generation per scan — serve the cache on every repeat call.
    const cached = readCachedQuickFix(ogData)
    if (cached) {
      return NextResponse.json({ ...cached, cached: true })
    }

    // Insights are only on new-shape rows — degrade to businessName/city.
    const insights = isRecord(ogData.insights) ? ogData.insights : {}
    const industry =
      typeof insights.industry === "string" && insights.industry.trim().length > 1
        ? insights.industry.trim()
        : null
    const keyword =
      typeof insights.keyword === "string" && insights.keyword.trim().length > 1
        ? insights.keyword.trim()
        : null
    const isLocal = insights.isLocal !== false

    const businessName = (lead.businessName || lead.businessUrl || "").trim()
    if (!businessName) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: buildPrompt({
            businessName,
            city: (lead.city || "").trim(),
            websiteUrl: (lead.businessUrl || "").trim(),
            industry,
            keyword,
            isLocal,
          }),
        },
      ],
    })

    const block = message.content[0]
    const text = block && block.type === "text" ? block.text : ""

    let parsed: unknown
    try {
      parsed = JSON.parse(stripFences(text))
    } catch {
      // Honest failure — the UI hides the section rather than showing a broken box.
      return NextResponse.json({ error: "Could not generate a fix" }, { status: 502 })
    }

    if (
      !isRecord(parsed) ||
      typeof parsed.faqHtml !== "string" ||
      typeof parsed.jsonLd !== "string" ||
      parsed.faqHtml.trim().length === 0 ||
      parsed.jsonLd.trim().length === 0
    ) {
      return NextResponse.json({ error: "Could not generate a fix" }, { status: 502 })
    }

    const quickFix: QuickFix = {
      faqHtml: parsed.faqHtml.trim(),
      jsonLd: parsed.jsonLd.trim(),
      targetQuestion:
        typeof parsed.targetQuestion === "string" && parsed.targetQuestion.trim().length > 0
          ? parsed.targetQuestion.trim()
          : "",
    }

    // Cache inside the existing Json column — no schema change.
    try {
      await db.scanLead.update({
        where: { id: scanId },
        data: { ogData: { ...ogData, quickFix } as unknown as Prisma.InputJsonValue },
      })
    } catch {
      // Caching is best-effort — still return the fix we just paid for.
    }

    return NextResponse.json({ ...quickFix, cached: false })
  } catch {
    return NextResponse.json({ error: "Could not generate a fix" }, { status: 502 })
  }
}
