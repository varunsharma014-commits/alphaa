export const dynamic = "force-dynamic"
export const maxDuration = 120

import { publicHit } from "@/lib/quotas"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { z as z4 } from "zod/v4"
import { readSiteFacts, siteFactsText } from "@/lib/site-facts"
import type { Prisma } from "@prisma/client"

const anthropic = claudeFor("public-scan")

// Public endpoint (under /api/scan/** in the middleware allowlist — same as
// /api/scan/result and /api/scan/email-report).
//
// Generates ONE paste-ready fix for the scanned business: an answer-first FAQ
// block plus matching JSON-LD. The result is cached inside the existing ogData
// Json column (ogData.quickFix) so a scan can only ever cost one generation —
// repeat calls (reload, second device, someone hammering the endpoint) return
// the cached copy. No schema change.

const schema = z.object({ scanId: z.string().min(10).max(64) })

const MODEL = "claude-opus-5-5"

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

const FixSchema = z4.object({
  faqHtml: z4.string().describe("The <section> FAQ block, plain HTML"),
  jsonLd: z4.string().describe("One <script type=\"application/ld+json\"> tag with the @graph"),
  targetQuestion: z4.string().describe("The single most valuable of the 3 questions"),
})

// Numbers and prices the draft may state: only ones the site itself shows.
const numbersIn = (s: string) => (s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, "").replace(/,/g, "")).filter((x) => x.length > 0)
const visible = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")

function buildPrompt(input: {
  businessName: string
  city: string
  websiteUrl: string
  industry: string | null
  keyword: string | null
  isLocal: boolean
  site: string
}): string {
  const { businessName, city, websiteUrl, industry, keyword, isLocal, site } = input

  return `You write website content for small businesses so that AI assistants (ChatGPT, Claude, Perplexity, Google AI) can read a plain page and repeat the business's own answers back to customers.

THE BUSINESS
Name: ${businessName}
City / area: ${city && !/^your area$/i.test(city) ? city : "(not provided)"}
Website: ${websiteUrl || "(not provided)"}
Serves one local area: ${isLocal ? "yes" : "no: serves customers online / nationally / B2B"}
A quick guess at the industry (a hint only; if it doesn't match the website, trust the website): ${industry || "(unknown)"}
What customers search for (a hint only): ${keyword || "(unknown)"}

WHAT THE BUSINESS'S OWN WEBSITE SAYS (the only source of facts)
${site || "(the website couldn't be read: use only the name above and stay generic)"}

YOUR TASK
Produce what this owner can paste onto their website today:

1. faqHtml: an HTML FAQ block with EXACTLY 3 question/answer pairs. The questions must be what a
   real customer of THIS business asks before buying, judged from what the website says it sells
   and who it's for${keyword ? ` (the search "${keyword}" is a hint)` : ""}${isLocal && city && !/^your area$/i.test(city) ? `, in ${city}` : ""}.
   Describe the business in the website's own terms: what its title, Google summary and headings
   say it does and who it is for. Never widen or change the audience (if the site says "startups
   and founders raising capital", don't add nonprofits, schools or anyone else).
   Write ANSWER-FIRST: the first sentence of each answer directly answers the question in plain
   words. Then at most 1-2 more sentences of useful detail. No preamble, no marketing fluff.
   Use this exact structure (semantic, plain HTML, no classes, no scripts, no styling):
   <section>
     <h2>Frequently asked questions</h2>
     <h3>QUESTION</h3>
     <p>ANSWER</p>
     ... (3 total)
   </section>

2. jsonLd: a single JSON-LD script tag containing an @graph with:
   - a FAQPage whose mainEntity questions/answers EXACTLY match the 3 Q&As in faqHtml
     (answers as plain text, no HTML tags inside), and
   - ${isLocal ? "a LocalBusiness" : "an Organization"} node for ${businessName}${websiteUrl ? ` with "url"` : ""} and a "description" taken from the website's own words.
   Format it as: <script type="application/ld+json">\n{ ... }\n</script>
   Pretty-print the JSON with 2-space indentation.

3. targetQuestion: the single most valuable customer question of the three, as a plain string.

HONESTY RULES (breaking any of these makes the output useless):
- State only facts that appear in the website text above. Prices, plan names, what's included,
  who it's for, guarantees, locations, hours: use them exactly as the site gives them, or leave them out.
- Use a [bracketed placeholder] ONLY for a fact the answer genuinely needs and the website text
  doesn't give (e.g. [add your opening hours] for a local shop whose site lists none). If the site
  shows a price, quote it; never write [add your starting price] when a price is shown above.
  Placeholders in the JSON-LD follow the same rule.
- Never add numbers that aren't in the website text (no years, counts, ratings, percentages or prices of your own).
- No superlatives you can't point to on the site ("best", "#1", "leading", "award-winning", "trusted").
- Don't invent an aggregateRating, review, priceRange or founding date. Leave those fields out.
- Plain English only. No jargon such as "semantic triggers", "entity injection", "AEO", "LLM optimization", "generative engine".
- Make no promises about rankings, citations, or being recommended by AI.`
}

/** Anything in the draft the site doesn't back up: numbers/prices not on the site. */
function unsupported(fix: QuickFix, site: string): string[] {
  const allowed = new Set(numbersIn(site))
  const shown = `${visible(fix.faqHtml)} ${fix.targetQuestion}`
  // FAQ text: every number must come from the site ("3" questions etc. are in our markup, not the text).
  return [...new Set(numbersIn(shown).filter((n) => !allowed.has(n)))]
}

async function writeFix(prompt: string, retryNote?: string): Promise<QuickFix | null> {
  const msg = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 6000,
    output_config: { effort: "low", format: zodOutputFormat(FixSchema) },
    messages: [{ role: "user", content: retryNote ? `${prompt}\n\nYOUR LAST DRAFT WAS REJECTED: ${retryNote}` : prompt }],
  })
  if (msg.stop_reason === "refusal" || msg.stop_reason === "max_tokens") return null
  const out = msg.parsed_output
  if (!out || !out.faqHtml.trim() || !out.jsonLd.trim()) return null
  return { faqHtml: out.faqHtml.trim(), jsonLd: out.jsonLd.trim(), targetQuestion: out.targetQuestion.trim() }
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
    const cap = await publicHit("quickfix", req)
    if (!cap.ok) return NextResponse.json({ error: cap.error, quota: true }, { status: 429 })

    // Ground the draft in the site itself: homepage, pricing and About page.
    const websiteUrl = (lead.businessUrl || "").trim()
    const facts = websiteUrl ? await readSiteFacts(websiteUrl).catch(() => null) : null
    const site = facts ? siteFactsText(facts) : ""
    const prompt = buildPrompt({
      businessName,
      city: (lead.city || "").trim(),
      websiteUrl,
      industry,
      keyword,
      isLocal,
      site,
    })

    let quickFix = await writeFix(prompt)
    const bad = quickFix ? unsupported(quickFix, site) : []
    if (quickFix && bad.length) {
      quickFix = await writeFix(prompt, `it states ${bad.map((n) => `"${n}"`).join(", ")}, which the website text doesn't show. Use only numbers and prices from the website text.`)
      if (quickFix && unsupported(quickFix, site).length) quickFix = null
    }
    if (!quickFix) {
      // Honest failure: the UI hides the section rather than showing a broken or made-up box.
      return NextResponse.json({ error: "Could not generate a fix" }, { status: 502 })
    }

    // Cache inside the existing Json column — no schema change.
    try {
      // Re-read: other writers (the first-week preview, the email claim) may have saved meanwhile.
      const fresh = await db.scanLead.findUnique({ where: { id: scanId }, select: { ogData: true } })
      const now = isRecord(fresh?.ogData) ? fresh!.ogData : ogData
      await db.scanLead.update({
        where: { id: scanId },
        data: { ogData: { ...now, quickFix } as unknown as Prisma.InputJsonValue },
      })
    } catch {
      // Caching is best-effort — still return the fix we just paid for.
    }

    return NextResponse.json({ ...quickFix, cached: false })
  } catch {
    return NextResponse.json({ error: "Could not generate a fix" }, { status: 502 })
  }
}
