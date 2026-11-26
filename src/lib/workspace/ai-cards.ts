// The four AI assistant cards at the top of the Briefing. The "Names you" / "Not yet" verdict is
// getEngineEvidence() (weekly audit, the owner's own scan, live questions), falling back to the
// weekly question scan when those have nothing for that AI. The question, the answer text and
// who it names instead come from the same stored checks. Never-checked AIs say so.
import type { User } from "@prisma/client"
import { getEngineEvidence, type EngineKey } from "@/lib/engine-evidence"
import { storedAnswers, type Found } from "@/lib/agent/first-answer"
import { latestQuestionScan } from "@/lib/questions"
import { short } from "./common"

export type AiCard = {
  engine: EngineKey
  name: string
  mark: string
  state: "yes" | "no" | "unknown"
  question: string | null
  questionFull: string | null
  /** Businesses this AI named: instead of them (state "no"), or as well (state "yes"). */
  names: string[]
  /** Where the names come from: this answer, or across the weekly questions. */
  namesFrom: "answer" | "weekly"
  at: string | null
  /** The full stored answer, for "See the answer". */
  answer: string | null
}

const CARDS: { engine: EngineKey; name: string; mark: string }[] = [
  { engine: "chatgpt", name: "ChatGPT", mark: "Ch" },
  { engine: "claude", name: "Claude", mark: "Cl" },
  { engine: "perplexity", name: "Perplexity", mark: "Pe" },
  { engine: "gemini", name: "Gemini", mark: "Ge" },
]

export async function getAiCards(user: User): Promise<AiCard[]> {
  const [evidence, answers, qs] = await Promise.all([
    getEngineEvidence({ id: user.id, email: user.email }).catch(() => null),
    storedAnswers({ id: user.id, email: user.email }).catch((): Found[] => []),
    latestQuestionScan(user.id).catch(() => null),
  ])
  const self = (user.businessName ?? "").trim().toLowerCase()
  const notSelf = (n: string) => {
    const x = n.trim().toLowerCase()
    return !!x && !(self && (x === self || x.includes(self) || self.includes(x)))
  }
  const dedupe = (list: string[]) => Array.from(new Map(list.filter(notSelf).map((n) => [n.trim().toLowerCase(), n.trim()])).values())

  return CARDS.map(({ engine, name, mark }) => {
    const ev = evidence?.[engine]
    // The weekly question scan for this AI: every question it answered and who it named.
    const asked = (qs?.scan.questions ?? []).map((q) => ({ q: q.q, r: q.engines?.[engine] })).filter((x) => x.r && (x.r.status === "appeared" || x.r.status === "not_appearing"))
    let state: AiCard["state"] = ev && ev.state !== "unknown" ? (ev.state === "missing" ? "no" : "yes") : "unknown"
    let at = ev?.at ? ev.at.toISOString() : null
    if (state === "unknown" && asked.length && qs) {
      state = asked.some((x) => x.r!.appeared) ? "yes" : "no"
      at = qs.at.toISOString()
    }
    if (state === "unknown") return { engine, name, mark, state, question: null, questionFull: null, names: [], namesFrom: "answer", at: null, answer: null }

    // The freshest stored answer from this AI, used only when it agrees with the verdict shown.
    const ans = answers.filter((a) => a.engine === engine).sort((a, b) => b.at.localeCompare(a.at))[0]
    const use = ans && ans.appeared === (state === "yes") ? ans : null
    let names = use?.mentioned ? dedupe(use.mentioned) : []
    let namesFrom: AiCard["namesFrom"] = "answer"
    if (!names.length && asked.length) {
      const count = new Map<string, { n: string; c: number }>()
      for (const x of asked) for (const n of x.r!.named ?? []) {
        if (!notSelf(n)) continue
        const k = n.trim().toLowerCase()
        count.set(k, { n: n.trim(), c: (count.get(k)?.c ?? 0) + 1 })
      }
      names = [...count.values()].sort((a, b) => b.c - a.c).map((x) => x.n)
      namesFrom = "weekly"
    }
    const question = use?.query?.trim() || asked.find((x) => (state === "yes" ? x.r!.appeared : !x.r!.appeared))?.q || asked[0]?.q || null
    return {
      engine, name, mark, state,
      question: question ? short(question, 90) : null,
      questionFull: question,
      names: names.slice(0, 3),
      namesFrom,
      at: use?.at ?? at,
      answer: use ? use.answer.slice(0, 6000) : null,
    }
  })
}
