// Is this social post / ad really about the owner's niche? Posts stored before the writer judged
// fit (NicheItem.fit) get one cheap Haiku check, cached per item id in agent settings `nicheFit`.
// No verdict (model unavailable) = the post stays visible; the engagement gate still applies.
import { claudeFor } from "@/lib/claude"
import { getAgentSettings, saveAgentSettings } from "@/lib/agent/settings"

const anthropic = claudeFor("niche-fit")

type Biz = { id: string; businessName: string | null; businessType: string | null; city: string | null; voiceDescription?: string | null }
export type FitItem = { id: string; text: string }

export async function nicheFitVerdicts(user: Biz, items: FitItem[], ms = 7000): Promise<Record<string, boolean>> {
  const s = await getAgentSettings(user.id)
  const cache = { ...(s.nicheFit ?? {}) }
  const todo = items.filter((i) => !cache[i.id]).slice(0, 16)
  if (todo.length) {
    const run = (async () => {
      try {
        const msg = await anthropic.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 400,
          messages: [{
            role: "user",
            content:
              `The business: ${user.businessName ?? "unknown"}, ${user.businessType ?? "a small business"}${user.city?.trim() ? ` in ${user.city.trim()}` : ""}. ${(user.voiceDescription ?? "").slice(0, 300)}\n\n` +
              `Which of these social posts are really about this business's niche (something its customers or peers would care about)? A post about something else, even if found under a related-looking hashtag, does NOT fit.\n\n` +
              todo.map((t, k) => `${k + 1}. ${t.text.replace(/\s+/g, " ").slice(0, 300)}`).join("\n") +
              `\n\nReply with ONLY JSON: [{"n": <number>, "fits": true|false}]`,
          }],
        })
        const b = msg.content.find((x) => x.type === "text")
        const raw = b && b.type === "text" ? b.text : "[]"
        const parsed = JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)) as { n?: number; fits?: boolean }[]
        const at = new Date().toISOString()
        for (const p of parsed) { const t = typeof p.n === "number" ? todo[p.n - 1] : undefined; if (t && typeof p.fits === "boolean") cache[t.id] = { ok: p.fits, at } }
        const entries = Object.entries(cache).sort((a, b) => b[1].at.localeCompare(a[1].at)).slice(0, 300)
        await saveAgentSettings(user.id, { nicheFit: Object.fromEntries(entries) })
      } catch { /* no verdict this time */ }
    })()
    await Promise.race([run, new Promise((r) => setTimeout(r, ms))])
  }
  return Object.fromEntries(items.filter((i) => cache[i.id]).map((i) => [i.id, cache[i.id].ok]))
}
