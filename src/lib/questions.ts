// Weekly question tracking. One question a week says little; real visibility
// is "named in 23 of 40 answers" across the questions customers actually ask.
// Also checks what the AIs say *about* the business against known facts, so
// wrong hours, phone numbers or "permanently closed" get caught.
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"
import { scanAllEngines, type EngineResult } from "@/lib/ai-engines"
import { extractMentionedBusinesses } from "@/lib/scan-insights"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"
import { getLocationInfo } from "@/lib/gmb"

type Engine = EngineResult["engine"]
export type QuestionResult = { q: string; engines: Partial<Record<Engine, { appeared: boolean; status: EngineResult["status"]; named: string[] }>> }
export type FactIssue = { engine: Engine; claim: string; truth: string; severity: "high" | "medium" }
export type QuestionScan = {
  at: string
  questions: QuestionResult[]
  named: number // answers that named the business
  answers: number // answers that came back
  rivals: { name: string; count: number }[]
  facts: { checked: boolean; issues: FactIssue[]; question: string | null }
}

const SONNET = "claude-sonnet-4-6"
const HAIKU = "claude-haiku-4-5"
const text = (r: { content: { type: string; text?: string }[] }) => r.content.find((c) => c.type === "text")?.text?.trim() ?? ""

export const questionLimit = (plan: string) => (/pro|full/i.test(plan) ? 20 : 10)

/** The questions we track: the owner's own list, else written once from the business profile. */
export async function trackedQuestions(userId: string): Promise<string[]> {
  const s = await getAgentSettings(userId)
  if (s.questions?.length) return s.questions
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return []
  const n = questionLimit(user.plan)
  const cities = [user.city, ...(s.locations ?? []).map((l) => l.city)].filter((c, i, a): c is string => !!c && a.indexOf(c) === i)
  try {
    const res = await anthropic.messages.create({
      model: SONNET,
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `Write ${n} questions real customers type into ChatGPT or Perplexity when looking for a business like this one. Business: ${user.businessName ?? "unknown"} — ${user.businessType ?? "local business"}${cities.length ? ` in ${cities.join(" / ")}` : ""}. Website: ${user.websiteUrl ?? "unknown"}.
Mix: "best X in <city>" style; specific services; problems ("my AC is leaking, who can fix it today"); comparisons/price questions; ${cities.length > 1 ? "spread across every city listed; " : ""}Never include the business's own name. One question per line, no numbering, no quotes.`,
      }],
    })
    const qs = text(res).split("\n").map((l) => l.replace(/^[-*\d.)\s]+/, "").trim()).filter((l) => l.length > 12).slice(0, n)
    if (qs.length) await saveAgentSettings(userId, { questions: qs })
    return qs
  } catch (err) {
    console.error("[questions] generate", err instanceof Error ? err.message : err)
    return []
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]) }
  }))
  return out
}

/** Ask every tracked question to all four AIs, then fact-check what they say about the business. */
export async function runQuestionScan(userId: string): Promise<QuestionScan | null> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { integration: true } })
  if (!user?.businessName) return null
  const qs = await trackedQuestions(userId)
  if (!qs.length) return null
  const biz = user.businessName
  const type = user.businessType ?? "business"
  const city = user.city ?? ""

  const questions = await mapLimit(qs, 2, async (q): Promise<QuestionResult> => {
    const scan = await scanAllEngines(biz, type, city, user.websiteUrl ?? "", q).catch(() => null)
    if (!scan) return { q, engines: {} }
    const ment = await extractMentionedBusinesses(scan.results, biz, user.websiteUrl ?? "").catch(() => ({ mentioned: {} as Record<string, string[]> }))
    const engines: QuestionResult["engines"] = {}
    for (const r of scan.results) {
      if (r.status === "not_configured") continue
      engines[r.engine] = { appeared: r.appeared, status: r.status, named: (ment.mentioned[r.engine] ?? []).slice(0, 6) }
    }
    return { q, engines }
  })

  let named = 0, answers = 0
  const rivalCount = new Map<string, number>()
  for (const q of questions) {
    for (const e of Object.values(q.engines)) {
      if (!e || e.status === "error") continue
      answers++
      if (e.appeared) named++
      for (const n of e.named) if (n.toLowerCase() !== biz.toLowerCase()) rivalCount.set(n, (rivalCount.get(n) ?? 0) + 1)
    }
  }
  const rivals = [...rivalCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))

  const facts = await factCheck(user).catch((err) => {
    console.error("[questions] factCheck", err instanceof Error ? err.message : err)
    return { checked: false, issues: [], question: null }
  })

  const result: QuestionScan = { at: new Date().toISOString(), questions, named, answers, rivals, facts }
  await db.mockActivity.create({
    data: { userId, type: "question_scan", title: `Asked the four AIs ${qs.length} customer questions — named in ${named} of ${answers} answers`, metadata: result as unknown as object },
  })
  return result
}

type FactUser = NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>> & { integration?: { accessToken: string; refreshToken: string | null; expiresAt: Date | null; gmbAccountId: string | null; gmbLocationId: string | null } | null }

/** Ask each AI about the business directly and compare the answer to the facts we know. */
async function factCheck(user: FactUser): Promise<QuestionScan["facts"]> {
  const loc = user.integration ? await getLocationInfo(user.integration).catch(() => null) : null
  const known = [
    `Name: ${user.businessName}`,
    loc?.address || user.city ? `Address: ${loc?.address || [user.city, user.state].filter(Boolean).join(", ")}` : "",
    loc?.phone ? `Phone: ${loc.phone}` : "",
    user.websiteUrl ? `Website: ${user.websiteUrl}` : "",
    loc?.categories?.length ? `Category: ${loc.categories.join(", ")}` : user.businessType ? `Category: ${user.businessType}` : "",
    "Status: open and operating",
  ].filter(Boolean).join("\n")
  const question = `What can you tell me about ${user.businessName}${user.city ? ` in ${user.city}` : ""}? What's their phone number, address and opening hours, and are they still open?`
  const scan = await scanAllEngines(user.businessName!, user.businessType ?? "business", user.city ?? "", user.websiteUrl ?? "", question)
  const answered = scan.results.filter((r) => r.response.trim() && r.status !== "error" && r.status !== "not_configured")
  if (!answered.length) return { checked: false, issues: [], question }
  const res = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Known facts about a business (from its owner and Google Business Profile):
${known}

Below are answers from AI assistants about it. List only claims that CONTRADICT the known facts (wrong phone, wrong address/city, says closed or moved, wrong category, wrong website). Ignore claims the facts don't cover (e.g. hours if unknown) and ignore "I don't know" answers. Output JSON only: {"issues":[{"engine":"chatgpt|claude|gemini|perplexity","claim":"what the AI said, short","truth":"the correct fact","severity":"high|medium"}]} — high = closed/moved/wrong phone.

${answered.map((r) => `### ${r.engine}\n${r.response.slice(0, 1800)}`).join("\n\n")}`,
    }],
  })
  const raw = text(res).replace(/```json\n?|```/g, "").trim()
  let issues: FactIssue[] = []
  try {
    const parsed = JSON.parse(raw) as { issues?: FactIssue[] }
    issues = (parsed.issues ?? []).filter((i) => i && i.claim && i.truth && ["chatgpt", "claude", "gemini", "perplexity"].includes(i.engine)).slice(0, 8)
  } catch {}
  return { checked: true, issues, question }
}

export async function latestQuestionScan(userId: string): Promise<{ scan: QuestionScan; at: Date } | null> {
  const row = await db.mockActivity.findFirst({ where: { userId, type: "question_scan" }, orderBy: { createdAt: "desc" } })
  return row?.metadata ? { scan: row.metadata as unknown as QuestionScan, at: row.createdAt } : null
}
