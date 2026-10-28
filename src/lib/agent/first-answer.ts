// The first-visit moment: the real answer ChatGPT gives a customer, with the
// owner's name (or the rival named instead) highlighted. Shown once; the
// answer is saved in agent settings the first time so it never shifts under them.

import { db } from "@/lib/db"
import { extractMentionedBusinesses } from "@/lib/scan-insights"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"

export type FirstAnswer = {
  engine: "chatgpt" | "claude" | "gemini" | "perplexity"
  query: string
  answer: string
  appeared: boolean
  mentioned: string[]
  at: string
  seenAt?: string
}

type Found = Omit<FirstAnswer, "mentioned" | "seenAt"> & { mentioned?: string[] }
const ORDER: FirstAnswer["engine"][] = ["chatgpt", "perplexity", "gemini", "claude"]
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/** Every stored answer we have, freshest first, ChatGPT preferred. */
async function storedAnswers(user: { id: string; email: string }): Promise<Found[]> {
  const [audit, lead, sandbox] = await Promise.all([
    db.audit.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { aiEngineResults: true } }),
    db.scanLead.findFirst({
      where: { OR: [{ userId: user.id }, ...(user.email ? [{ email: user.email }] : [])], visibilityScore: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, engineResponses: true },
    }),
    db.mockActivity.findMany({ where: { userId: user.id, type: "sandbox_result" }, orderBy: { createdAt: "desc" }, take: 5 }),
  ])
  const out: Found[] = []
  for (const r of audit?.aiEngineResults ?? []) {
    if (ORDER.includes(r.engine as FirstAnswer["engine"]) && r.response.trim()) out.push({ engine: r.engine as FirstAnswer["engine"], query: r.query, answer: r.response, appeared: r.appeared, at: r.createdAt.toISOString() })
  }
  const responses = isRecord(lead?.engineResponses) ? lead.engineResponses : {}
  for (const engine of ORDER) {
    const r = responses[engine]
    if (lead && isRecord(r) && typeof r.response === "string" && r.response.trim() && typeof r.appeared === "boolean")
      out.push({ engine, query: typeof r.query === "string" ? r.query : "", answer: r.response, appeared: r.appeared, mentioned: Array.isArray(r.mentioned) ? r.mentioned.filter((m): m is string => typeof m === "string") : undefined, at: lead.createdAt.toISOString() })
  }
  for (const row of sandbox) {
    const s = row.metadata as { question?: string; lead?: { engine?: string; answer?: string; appeared?: boolean; mentioned?: string[] } | null } | null
    if (s?.lead?.answer && ORDER.includes(s.lead.engine as FirstAnswer["engine"]))
      out.push({ engine: s.lead.engine as FirstAnswer["engine"], query: s.question ?? "", answer: s.lead.answer, appeared: !!s.lead.appeared, mentioned: s.lead.mentioned, at: row.createdAt.toISOString() })
  }
  return out.filter((a) => a.query.trim()).sort((a, b) => ORDER.indexOf(a.engine) - ORDER.indexOf(b.engine) || b.at.localeCompare(a.at))
}

/**
 * The answer to show on the first visit, or null when it was already seen.
 * `answer: null` means nothing has been asked yet: the page asks live.
 */
export async function getFirstAnswer(user: { id: string; email: string; businessName: string | null; websiteUrl: string | null }): Promise<{ answer: FirstAnswer | null } | null> {
  const settings = await getAgentSettings(user.id)
  if (settings.firstAnswer?.seenAt) return null
  if (settings.firstAnswer) return { answer: settings.firstAnswer }
  const found = (await storedAnswers(user))[0]
  if (!found) return { answer: null }
  let mentioned = found.mentioned
  if (!mentioned) {
    const ex = await extractMentionedBusinesses([{ engine: found.engine, query: found.query, response: found.answer }], user.businessName ?? "", user.websiteUrl ?? "").catch(() => null)
    const m = ex?.mentioned?.[found.engine]
    mentioned = Array.isArray(m) ? m.filter((n): n is string => typeof n === "string") : []
  }
  const answer: FirstAnswer = { ...found, answer: found.answer.slice(0, 6000), mentioned }
  await saveAgentSettings(user.id, { firstAnswer: answer })
  return { answer }
}

export async function markFirstAnswerSeen(userId: string): Promise<void> {
  const s = await getAgentSettings(userId)
  await saveAgentSettings(userId, { firstAnswer: { ...(s.firstAnswer ?? { engine: "chatgpt", query: "", answer: "", appeared: false, mentioned: [], at: new Date().toISOString() }), seenAt: new Date().toISOString() } })
}
