// Business-specific intelligence for the PUBLIC scan pipeline (/api/scan).
//
// Three claude-haiku helpers + one pure helper:
//   1. inferBusinessProfile  — figures out the plain-English industry + whether
//      the business is local, and writes ONE customer-style question a real
//      buyer would ask an AI assistant (the query the engines get asked).
//   2. extractMentionedBusinesses — ONE batched call over all engine answers
//      that extracts which businesses each engine actually recommended.
//   3. estimateMonthlyLoss   — conservative {low, high, basis} estimate of how
//      many people per month ask AI assistants for this category; null when it
//      can't be estimated honestly.
//   4. buildCompetitorList   — frequency-ordered union of mentions (max 5).
//
// Every AI call is strict-JSON (fence-strip + try/catch per CLAUDE.md gotcha 9)
// and degrades to null/{} on any failure — nothing here ever throws into the
// scan route.

import { anthropic } from "@/lib/claude"
import type { EngineResult } from "@/lib/ai-engines"

export type BusinessProfile = {
  industry: string
  isLocal: boolean
  query: string
}

export type MonthlyLossEstimate = {
  low: number
  high: number
  basis: string
}

const HAIKU = "claude-haiku-4-5"

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

function stripFences(raw: string): string {
  return raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
}

function textOf(msg: { content: Array<{ type: string; text?: string }> }): string {
  const block = msg.content.find((b) => b.type === "text")
  return block && typeof block.text === "string" ? block.text : ""
}

// Lowercased, suffix-stripped, alphanumeric-only form of a business name so
// "Joe's Pizza, LLC" and "joes pizza" compare equal.
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(llc|inc|co|corp|ltd|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
}

// True when a candidate mention is actually the scanned business itself,
// matched by name or by website domain (case-insensitive).
function isSelfMention(candidate: string, businessName: string, websiteUrl: string): boolean {
  const cand = normalizeName(candidate)
  if (!cand) return true // garbage/empty — drop it
  const own = normalizeName(businessName)
  if (own) {
    if (cand === own) return true
    if (own.length >= 4 && cand.includes(own)) return true
    if (cand.length >= 4 && own.includes(cand)) return true
  }
  if (websiteUrl) {
    try {
      const host = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`)
        .hostname.replace(/^www\./, "")
        .toLowerCase()
      if (host) {
        if (candidate.toLowerCase().includes(host)) return true
        const hostNorm = normalizeName(host)
        if (hostNorm && cand === hostNorm) return true
        const base = normalizeName(host.split(".")[0])
        if (base && base.length >= 4 && cand === base) return true
      }
    } catch {
      // unparseable URL — name check above already ran
    }
  }
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Industry + locality + the ONE customer question the engines get asked
// ─────────────────────────────────────────────────────────────────────────────

export async function inferBusinessProfile(input: {
  businessName: string
  businessType: string
  city: string
  websiteUrl: string
  siteTitle?: string
  siteDescription?: string
  siteText?: string
}): Promise<BusinessProfile | null> {
  try {
    const msg = await withTimeout(
      anthropic.messages.create({
        model: HAIKU,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `You simulate how real customers ask AI assistants (ChatGPT, Claude, Gemini, Perplexity) for recommendations.\n\n` +
              `Business being scanned:\n` +
              `- Name: ${input.businessName}\n` +
              `- Self-described type: ${input.businessType || "unknown"}\n` +
              `- Location: ${input.city || "unknown"}\n` +
              `- Website: ${input.websiteUrl || "unknown"}\n` +
              (input.siteTitle ? `- Website title: ${input.siteTitle.slice(0, 200)}\n` : "") +
              (input.siteDescription ? `- Website description: ${input.siteDescription.slice(0, 300)}\n` : "") +
              (input.siteText ? `- Website text excerpt: ${input.siteText.slice(0, 1200)}\n` : "") +
              `\nStep 1 — Identify the industry in plain English, specific to what THIS business sells (e.g. "dental practice", "AI marketing software", "family law firm", "ecommerce shoe store"). Never just "business".\n` +
              `Step 2 — Decide if it is LOCAL (serves one area — dentist, plumber, restaurant, clinic, law firm) or NON-LOCAL (serves customers anywhere — SaaS, software, online store, national agency, B2B service).\n` +
              `Step 3 — Write ONE natural question a real potential customer would ask an AI assistant when shopping in this category.\n` +
              `- LOCAL: include the city, e.g. "Who is the best dental practice in Kanata?" or "Can you recommend a good dentist in Kanata?"\n` +
              `- NON-LOCAL: no city, e.g. "What is the best AI marketing software for a small business?"\n` +
              `The question must be about the CATEGORY — never name the business itself.\n\n` +
              `Return ONLY valid JSON, no markdown fences, exactly:\n` +
              `{"industry": "<plain-English industry>", "is_local": true|false, "query": "<the customer question>"}`,
          },
        ],
      }),
      8000
    )
    const parsed = JSON.parse(stripFences(textOf(msg)))
    const industry = typeof parsed.industry === "string" ? parsed.industry.trim() : ""
    const isLocal = typeof parsed.is_local === "boolean" ? parsed.is_local : null
    const query = typeof parsed.query === "string" ? parsed.query.trim() : ""
    if (industry.length < 3 || query.length < 10 || isLocal === null) return null
    if (industry.toLowerCase() === "business") return null
    return { industry, isLocal, query }
  } catch (err) {
    console.error("inferBusinessProfile error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Which businesses each engine actually recommended (ONE batched call)
// ─────────────────────────────────────────────────────────────────────────────

export async function extractMentionedBusinesses(
  results: Array<Pick<EngineResult, "engine" | "query" | "response">>,
  businessName: string,
  websiteUrl: string
): Promise<Record<string, string[]>> {
  const answered = results.filter((r) => r.response && r.response.trim().length > 0)
  if (answered.length === 0) return {}
  try {
    const sections = answered
      .map((r) => `### ${r.engine}\nQuestion asked: ${r.query}\nAnswer:\n${r.response.slice(0, 1500)}`)
      .join("\n\n")
    const keysExample = answered.map((r) => `"${r.engine}": ["Name One", "Name Two"]`).join(", ")

    const msg = await withTimeout(
      anthropic.messages.create({
        model: HAIKU,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content:
              `You are auditing answers from AI assistants to see which businesses each one recommended.\n\n` +
              `The business being scanned is "${businessName}". NEVER include it in your lists.\n\n` +
              `${sections}\n\n` +
              `For EACH assistant above, extract the names of the specific businesses, brands, products, or companies it actually recommended or presented as options.\n` +
              `Rules:\n` +
              `- Use the exact name as written in the answer.\n` +
              `- Skip generic phrases ("local dentists", "several options", "many clinics").\n` +
              `- Skip platforms/directories mentioned only as places to search (Google Maps, Yelp, Reddit).\n` +
              `- Skip "${businessName}" itself.\n` +
              `- If an assistant recommended nothing specific, use an empty array.\n\n` +
              `Return ONLY valid JSON, no markdown fences, with exactly these keys:\n` +
              `{${keysExample}}`,
          },
        ],
      }),
      12000
    )
    const parsed = JSON.parse(stripFences(textOf(msg)))
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {}

    const out: Record<string, string[]> = {}
    for (const r of answered) {
      const raw = (parsed as Record<string, unknown>)[r.engine]
      const names = Array.isArray(raw)
        ? raw.filter((n): n is string => typeof n === "string").map((n) => n.trim())
        : []
      const seen = new Set<string>()
      out[r.engine] = names
        .filter((n) => {
          if (n.length < 2 || n.length > 80) return false
          if (isSelfMention(n, businessName, websiteUrl)) return false
          const key = normalizeName(n)
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 10)
    }
    return out
  } catch (err) {
    console.error("extractMentionedBusinesses error:", err)
    return {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Conservative monthly-loss estimate — null when it can't be honest
// ─────────────────────────────────────────────────────────────────────────────

export async function estimateMonthlyLoss(
  industry: string,
  isLocal: boolean,
  city: string
): Promise<MonthlyLossEstimate | null> {
  try {
    const market = isLocal && city ? `local — ${city}` : "non-local (serves customers online / nationally)"
    const inCity = isLocal && city ? ` in ${city}` : ""
    const msg = await withTimeout(
      anthropic.messages.create({
        model: HAIKU,
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content:
              `Estimate how many people PER MONTH ask AI assistants (ChatGPT, Gemini, Perplexity, Claude) for recommendations in this category.\n\n` +
              `Industry: ${industry}\n` +
              `Market: ${market}\n\n` +
              `Method: start from typical monthly search interest for "${industry}"${inCity}, then take only the small share of those searches that now happen inside AI assistants (a few percent of traditional search volume). Round to sensible numbers.\n\n` +
              `Rules:\n` +
              `- Be CONSERVATIVE. When unsure, go lower.\n` +
              `- "low" and "high" must be DIFFERENT positive integers forming a genuine range — never a fake exact number.\n` +
              `- "basis" is ONE plain-English sentence describing the methodology, e.g. "Estimate based on typical monthly search interest for ${industry}${inCity} and the share of searches now happening in AI assistants."\n` +
              `- If the niche is too obscure or the market too unclear to estimate with reasonable confidence, return exactly: null\n\n` +
              `Return ONLY valid JSON, no markdown fences: {"low": <integer>, "high": <integer>, "basis": "<sentence>"} or null`,
          },
        ],
      }),
      12000
    )
    const parsed = JSON.parse(stripFences(textOf(msg)))
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null
    const low = Number(parsed.low)
    const high = Number(parsed.high)
    const basis = typeof parsed.basis === "string" ? parsed.basis.trim() : ""
    if (!Number.isFinite(low) || !Number.isFinite(high)) return null
    if (low <= 0 || high <= low) return null // must be a real range, not a fake exact number
    if (basis.length < 10) return null
    return { low: Math.round(low), high: Math.round(high), basis }
  } catch (err) {
    console.error("estimateMonthlyLoss error:", err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Frequency-ordered union of mentions across engines (max 5)
// ─────────────────────────────────────────────────────────────────────────────

export function buildCompetitorList(
  mentionedByEngine: Record<string, string[]>,
  max = 5
): string[] {
  const counts = new Map<string, { name: string; count: number; firstSeen: number }>()
  let order = 0
  for (const names of Object.values(mentionedByEngine)) {
    const seenThisEngine = new Set<string>()
    for (const name of names) {
      const key = normalizeName(name)
      if (!key || seenThisEngine.has(key)) continue
      seenThisEngine.add(key)
      const entry = counts.get(key)
      if (entry) {
        entry.count++
      } else {
        counts.set(key, { name, count: 1, firstSeen: order++ })
      }
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.firstSeen - b.firstSeen)
    .slice(0, max)
    .map((e) => e.name)
}
