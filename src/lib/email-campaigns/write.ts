// Writes one customer email in the owner's voice. Facts only: the business profile, the owner's
// own note for this email, and pages that really exist on their site. A draft is rejected (one
// retry, then a plain template) if it uses a number, price or offer that isn't in the facts,
// names another AI, or uses hype words.
import { withQuota } from "@/lib/quotas"
import { z } from "zod/v4"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { db } from "@/lib/db"
import { claudeFor } from "@/lib/claude"
import { voiceFor } from "@/lib/voice"
import { enforce, finishEmail } from "@/lib/guardrails"
import type { Campaign } from "./store"

const anthropic = claudeFor("email-campaign")
const MODEL = "claude-opus-5-5"

const Schema = z.object({
  subject: z.string().describe("Subject line, at most 60 characters, plain, no clickbait, no emoji unless the voice uses them"),
  preview: z.string().describe("Inbox preview text, at most 100 characters, adds to the subject"),
  paragraphs: z.array(z.string()).describe("2 to 4 short paragraphs, 70 to 150 words in total. No greeting (I add 'Hi <name>,') and no sign-off (I add it)."),
  link: z.number().int().describe("Index of the LINK the button should open"),
  button: z.string().describe("Button label, 2 to 5 words"),
})

type Link = { label: string; url: string }

const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "")
const withHttps = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`)
const nums = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."))
const BANNED = /\b(best|#1|number one|leading|world[- ]class|guarantee[ds]?|act now|limited time|don[’']t miss|chatgpt|gemini|perplexity|claude)\b/i

/** writeCampaign, counted against the brand's plan quota (content_piece:email; lib/quotas.ts). Throws a QuotaError when out. */
export function writeCampaign(...args: Parameters<typeof writeCampaignUnmetered>): ReturnType<typeof writeCampaignUnmetered> {
  // Brand guardrails (lib/guardrails.ts): banned words rejected + one retry, the email disclaimer as the last paragraph.
  return withQuota(args[0], "content_piece:email", () => enforce(args[0], "email", () => writeCampaignUnmetered(...args), {
    texts: (c) => [c.subject, c.preview, ...c.paragraphs, c.cta?.label ?? ""],
    finish: (c, g) => ({ ...c, paragraphs: finishEmail(c.paragraphs, g) }),
  }))
}

async function writeCampaignUnmetered(userId: string, opts: { topic?: string; avoid?: string[] } = {}): Promise<Omit<Campaign, "v" | "status">> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { businessName: true, businessType: true, city: true, state: true, websiteUrl: true, voiceDescription: true } })
  if (!user) throw new Error("no user")
  const biz = user.businessName?.trim() || "our business"
  const links: Link[] = []
  if (user.websiteUrl) links.push({ label: "Your website (homepage)", url: withHttps(user.websiteUrl) })
  const posts = await db.mockActivity.findMany({ where: { userId, type: "post_draft", createdAt: { gte: new Date(Date.now() - 45 * 86_400_000) } }, orderBy: { createdAt: "desc" }, take: 20, select: { title: true, metadata: true } })
  for (const p of posts) {
    const m = p.metadata as { status?: string; url?: string; title?: string } | null
    if (m?.status === "published" && m.url && /^https:\/\//.test(m.url) && links.length < 5) links.push({ label: `Blog post: ${(m.title ?? p.title).replace(/^Drafted a post:?\s*/i, "").slice(0, 120)}`, url: m.url })
  }
  const voice = await voiceFor(userId).catch(() => null)
  const topic = opts.topic?.trim().slice(0, 600) || undefined
  const facts = [
    `BUSINESS: ${biz}`,
    user.businessType ? `TYPE: ${user.businessType}` : null,
    user.city?.trim() ? `CITY: ${user.city.trim()}${user.state?.trim() ? `, ${user.state.trim()}` : ""}` : null,
    user.voiceDescription?.trim() ? `ABOUT (the owner's description): ${user.voiceDescription.trim().slice(0, 800)}` : null,
    topic ? `THE OWNER'S NOTE FOR THIS EMAIL: ${topic}` : null,
    links.length ? `LINKS:\n${links.map((l, i) => `${i}: ${l.label} ${l.url}`).join("\n")}` : null,
  ].filter(Boolean).join("\n")
  const year = new Date().getFullYear()
  const allowed = new Set([...nums(facts), String(year), String(year + 1), "24/7", "1"])

  const prompt = `Write one short email from ${biz} to its own past customers.
Goal: be genuinely useful or welcome, and give them a reason to come back or get in touch. ${topic ? "Build it around the owner's note." : "Pick one helpful, seasonal or practical angle that fits this kind of business. If a blog post link fits, point to it."}
Rules:
- Use only the facts below. Never invent offers, discounts, prices, dates, awards, reviews, stats or results. The only numbers you may use are ones in the facts.
- Write like a person who runs the business, not an ad. Plain English, short sentences, no dashes, no hype words ("best", "leading", "act now", "limited time").
- Never mention AI, ChatGPT or any AI tool.
${opts.avoid?.length ? `- Don't repeat these recent subjects or their angle: ${opts.avoid.map((s) => `"${s}"`).join(", ")}\n` : ""}${voice ? `\nHOW THE BUSINESS SOUNDS:\n${voice}\n` : ""}
FACTS:
${facts}`

  const check = (o: z.infer<typeof Schema>): string | null => {
    const all = [o.subject, o.preview, o.button, ...o.paragraphs].join(" ")
    if (!o.paragraphs.length || o.paragraphs.length > 5) return "paragraphs"
    const words = o.paragraphs.join(" ").split(/\s+/).length
    if (words < 40 || words > 200) return "length"
    if (o.subject.length > 80 || !o.subject.trim()) return "subject"
    if (BANNED.test(all)) return "banned"
    if (/[—–]/.test(all)) return "dash"
    if (/\[[^\]]+\]/.test(all)) return "placeholder"
    const badNum = nums(all).find((n) => !allowed.has(n))
    if (badNum) return `number ${badNum}`
    const offer = /[$€£]\s?\d|\d+\s?%|\b\d+\s?off\b|\b(discount|coupon|promo code|for free|free (gift|consultation|consult|trial|shipping|session|estimate|quote|check))\b/i.exec(all)
    if (offer && !(topic && /[$€£%]|off|discount|coupon|promo|free/i.test(topic))) return `offer ${offer[0]}`
    return null
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const msg = await anthropic.messages.parse({
        model: MODEL,
        max_tokens: 2000,
        output_config: { effort: "low", format: zodOutputFormat(Schema) },
        messages: [{ role: "user", content: prompt }],
      })
      const o = msg.parsed_output
      if (!o) continue
      const why = check(o)
      if (why) { console.warn("[email-campaign] rejected draft:", why); continue }
      const link = links[o.link] ?? links[0]
      return {
        subject: o.subject.trim().slice(0, 80),
        preview: o.preview.trim().slice(0, 120),
        paragraphs: o.paragraphs.map((p) => p.trim()).filter(Boolean),
        cta: link ? { label: o.button.trim().slice(0, 40) || "Visit us", url: link.url } : undefined,
        topic,
      }
    } catch (err) {
      console.error("[email-campaign] write", err instanceof Error ? err.message : err)
    }
  }
  // Template: says nothing that isn't true.
  const site = links[0]
  return {
    subject: `A quick hello from ${biz}`.slice(0, 80),
    preview: "Thanks for being a customer. Here is how to reach us.",
    paragraphs: [
      `Thanks for choosing ${biz}. We wanted to check in and say we’re here whenever you need us again.`,
      topic ? topic : "If there’s anything we can help with, just reply to this email and it comes straight to us.",
    ],
    cta: site ? { label: `Visit ${host(site.url).split("/")[0]}`, url: site.url } : undefined,
    topic,
  }
}
