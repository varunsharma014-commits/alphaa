// The "What's working" thread: real findings, then ideas the owner can have written in one tap.
import { agent, type Message } from "@/lib/agent/types"
import type { Insights, IdeaFormat } from "@/lib/insights"

const FORMAT: Record<IdeaFormat, { label: string; cta: string; mode: "post" | "gbp" | "social" }> = {
  blog: { label: "Blog post", cta: "Write this post", mode: "post" },
  google: { label: "Google listing update", cta: "Write this update", mode: "gbp" },
  social: { label: "Social post", cta: "Write this social post", mode: "social" },
}

export function insightsRunMessage(): Message {
  return agent([
    { kind: "text", text: "Let me look at your numbers.", big: true },
    { kind: "steps", items: ["Reading your Google search results", "Reading your website visits", "Checking what AI says when customers ask", "Looking at your competitors and your social posts", "Picking what to create next"], done: 0, ticker: [["Clicks and searches, 4 weeks apart"], ["Which pages people visit"], ["Who AI names instead of you"], ["What they published lately"], ["Matching ideas to the data"]] },
  ], "in-run")
}

const refresh = { label: "Refresh with today’s data", action: { type: "run" as const, task: "insights" as const } }

export function insightsMessages(i: Insights | null, opts: { google: boolean }): Message[] {
  if (!i) {
    return [agent([
      { kind: "text", text: "I couldn’t pull your numbers just now.", big: true },
      { kind: "chips", items: [{ ...refresh, primary: true }] },
    ], "in-none")]
  }
  const out: Message[] = []
  const when = new Date(i.at).toLocaleDateString("en-US", { month: "long", day: "numeric" })
  const empty = !i.working.length && !i.notWorking.length && !i.niche.length
  out.push(agent([
    { kind: "text", text: empty ? "I don’t have enough data yet to say what’s working." : "Here’s what’s working, what isn’t, and what I’d create next.", big: true },
    { kind: "text", text: i.sources.length ? `From ${list(i.sources)}. Updated ${when}.` : `Updated ${when}.` },
    ...(!opts.google ? [{ kind: "text" as const, text: "Connect Google and I can also see which searches bring you customers and which pages they visit." }, { kind: "chips" as const, items: [{ label: "Connect Google", action: { type: "link" as const, href: "/api/integrations/google/connect?go=1" }, primary: true }] }] : []),
  ], "in-head"))

  if (i.working.length) out.push(agent([{ kind: "receipt", title: "What’s working", items: i.working.map((l) => l.text) }], "in-working"))
  if (i.notWorking.length) out.push(agent([{ kind: "receipt", title: "What isn’t working", items: i.notWorking.map((l) => l.text) }], "in-not"))
  if (i.niche.length) out.push(agent([{ kind: "receipt", title: "In your niche", items: i.niche.map((l) => l.text) }], "in-niche"))

  if (i.ideas.length) {
    out.push(agent([{ kind: "text", text: i.ideas.length === 1 ? "One thing I’d create next:" : `${i.ideas.length} things I’d create next, based on that:` }], "in-ideas"))
    i.ideas.forEach((idea, k) => {
      const f = FORMAT[idea.format]
      out.push(agent([
        { kind: "doc", title: idea.title, meta: f.label, text: idea.why },
        { kind: "chips", items: [{ label: f.cta, action: { type: "draft", topic: idea.title, mode: f.mode }, primary: k === 0 }] },
      ], `in-idea-${k}`))
    })
  }
  out.push(agent([
    { kind: "text", text: "I look again every week. Ask me anything about these numbers." },
    { kind: "chips", items: [refresh] },
  ], "in-end"))
  return out
}

function list(a: string[]): string {
  if (a.length <= 1) return a[0] ?? ""
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`
}
