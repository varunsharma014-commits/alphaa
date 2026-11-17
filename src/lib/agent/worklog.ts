// Everything the agent did, as Claude-style step logs: one line per day that opens to every
// step. The dashboard also polls `/api/agent/activity` and drops new steps into the chat live.
import { db } from "@/lib/db"
import { agent, type Message } from "@/lib/agent/types"
import { LEDGER_TYPES, ledgerText, nextCheck } from "@/lib/agent/briefing"

export type WorkItem = { text: string; at: string; href: string | null }

export async function workItems(userId: string, since: Date, take = 120): Promise<WorkItem[]> {
  const rows = await db.mockActivity.findMany({
    where: { userId, type: { in: LEDGER_TYPES }, createdAt: { gt: since } },
    orderBy: { createdAt: "desc" },
    take,
  })
  const seen = new Set<string>()
  const out: WorkItem[] = []
  for (const r of rows) {
    const meta = (r.metadata ?? {}) as Record<string, unknown>
    const text = ledgerText(r.type, r.title, meta)
    if (!text) continue
    const key = `${r.createdAt.toISOString().slice(0, 13)}|${text}`
    if (seen.has(key)) continue
    seen.add(key)
    const href = typeof meta.url === "string" && /^https?:\/\//.test(meta.url) && !meta.undone ? meta.url : null
    out.push({ text, at: r.createdAt.toISOString(), href })
  }
  return out
}

const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
}

export async function workMessages(userId: string): Promise<Message[]> {
  const items = await workItems(userId, new Date(Date.now() - 14 * 86_400_000))
  const next = new Date(nextCheck()).toLocaleDateString("en-US", { weekday: "long" })
  if (!items.length) {
    return [agent([
      { kind: "text", text: "Nothing logged in the last two weeks yet.", big: true },
      { kind: "text", text: `Every step I take shows up here as I do it. Next on my list: asking ChatGPT, Gemini, Claude and Perplexity about you again on ${next}.` },
    ], "wk-empty")]
  }
  const byDay = new Map<string, WorkItem[]>()
  for (const it of items) {
    const k = dayLabel(it.at)
    byDay.set(k, [...(byDay.get(k) ?? []), it])
  }
  const msgs: Message[] = [agent([
    { kind: "text", text: `Here’s everything I did in the last two weeks: ${items.length} ${items.length === 1 ? "step" : "steps"}.`, big: true },
    { kind: "text", text: "Tap a day to see each step. New work shows up in this chat as I do it." },
  ], "wk-head")]
  let i = 0
  for (const [day, list] of byDay) {
    msgs.push(agent([{ kind: "log", title: day, sub: `${list.length} ${list.length === 1 ? "step" : "steps"}`, open: i === 0, items: list }], `wk-${i}`))
    i++
  }
  msgs.push(agent([{ kind: "text", text: `Next on my list: asking the four AIs about you again on ${next}.` }], "wk-next"))
  return msgs
}
