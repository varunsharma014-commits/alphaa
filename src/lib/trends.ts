// What's timely this week for this kind of business in this place: holidays, local events,
// seasonal needs, industry news. Found with live web search; a trend is kept only if its source
// link came back from the search itself. Cached for 3 days (MockActivity "trends").
import { db } from "@/lib/db"
import { anthropic } from "@/lib/claude"

export type Trend = { title: string; why: string; url: string; when?: string | null }
const TYPE = "trends"
const MODEL = "claude-opus-5-5"

const norm = (u: string) => u.replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase()

export async function trendsFor(userId: string): Promise<Trend[]> {
  const cached = await db.mockActivity.findFirst({ where: { userId, type: TYPE, createdAt: { gte: new Date(Date.now() - 3 * 86_400_000) } }, orderBy: { createdAt: "desc" }, select: { metadata: true } })
  if (cached) return ((cached.metadata as { trends?: Trend[] } | null)?.trends ?? [])
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true, state: true, websiteUrl: true } })
  if (!user) return []
  const trends = await searchTrends(user)
  // Only cache a real answer, so a failed search is retried next time.
  if (trends.length) await db.mockActivity.create({ data: { userId, type: TYPE, title: "Looked up what’s happening this week", metadata: { trends } } })
  return trends
}

/** Live web search for what's timely for this business. No caching. */
export async function searchTrends(user: { businessName: string | null; businessType: string | null; city: string | null; state?: string | null; websiteUrl: string | null }): Promise<Trend[]> {
  const where = [user.city, user.state].filter(Boolean).join(", ")
  const today = new Date().toISOString().slice(0, 10)
  const prompt = `Today is ${today}. Find what is timely in the next 10 days for a ${user.businessType ?? "small business"}${where ? ` in ${where}` : ""} (${user.websiteUrl ?? user.businessName ?? ""}) that its customers would care about: holidays and observances, local events, the season and weather, and news or changes in this industry.

Search the web. Then reply with ONLY a JSON array of up to 4 items, each {"title": "...", "why": "one sentence: why this matters to this business's customers this week", "url": "the page you found it on", "when": "date or null"}. Only include things you actually found in search results, each with the exact URL of a result. No commentary.`
  type B = { type: string; text?: string }
  const messages: { role: "user" | "assistant"; content: unknown }[] = [{ role: "user", content: prompt }]
  const blocks: B[] = []
  // Server tools can pause a long turn; continue it a couple of times.
  for (let i = 0; i < 3; i++) {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 6000,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 } as never],
      messages: messages as never,
    })
    blocks.push(...(res.content as unknown as B[]))
    if (res.stop_reason !== "pause_turn") break
    messages.push({ role: "assistant", content: res.content })
  }
  // Every URL the searches returned (results can sit in code-execution blocks when filtered).
  const urls = new Set<string>()
  for (const b of blocks) if (b.type !== "text") for (const m of JSON.stringify(b).matchAll(/https?:\/\/[^"\\\s]+/g)) urls.add(norm(m[0]))
  const text = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("")
  let items: Trend[] = []
  try {
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)
    items = (JSON.parse(json) as Trend[]).filter((t) => t && typeof t.title === "string" && typeof t.url === "string" && urls.has(norm(t.url)))
  } catch { items = [] }
  return items.slice(0, 4).map((t) => ({ title: t.title.trim().slice(0, 140), why: String(t.why ?? "").trim().slice(0, 280), url: t.url, when: t.when ?? null }))
}
