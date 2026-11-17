// How a week run reads in the chat. Client-safe (no server imports): the dashboard builds
// these from the run's JSON, with its own site chips.
import { agent, type Block, type Chip, type Message } from "@/lib/agent/types"
import type { WeekItem, WeekKind, WeekRun } from "@/lib/agent/week"

const LABEL: Record<WeekKind, string> = { blog: "Blog post", google: "Google listing update", social: "Social post" }
const STATUS: Record<WeekItem["status"], string> = { writing: "writing", ready: "needs your OK", published: "published", scheduled: "scheduled", failed: "didn’t work this time" }

export function weekRunningMessage(run: WeekRun | null, id: string): Message {
  const steps = run?.steps ?? [{ text: "Getting started", done: false }]
  return agent([
    { kind: "text", text: "On it. You run the business, I’ll handle this week’s marketing.", big: true },
    { kind: "steps", items: steps.map((s) => s.text), done: steps.filter((s) => s.done).length },
  ], `week-${id}`)
}

export function weekDoneMessages(run: WeekRun, id: string, siteChips: (op: "post", extra: { title?: string; text?: string; draftId?: string; docId?: string }) => Chip[], again = false): Message[] {
  if (run.status === "failed") return [agent([{ kind: "text", text: "Something went wrong running your week. Nothing was published. Try again in a few minutes." }, { kind: "chips", items: [{ label: "Try again", action: { type: "ask", text: "Run my marketing for this week" }, primary: true }] }], `week-${id}`)]
  const out: Message[] = []
  out.push(agent([
    { kind: "text", text: again ? "Your marketing for this week is already done. Here it is." : "Your marketing for this week is done.", big: true },
    { kind: "text", text: run.summary ?? "" },
    { kind: "receipt", title: "This week", items: run.items.map((i) => `${i.day} · ${LABEL[i.kind]} · ${i.title} (${STATUS[i.status]})`) },
  ], `week-${id}`))
  if (run.trends.length) {
    out.push(agent([
      { kind: "text", text: "What your customers are paying attention to this week:" },
      { kind: "sources", items: run.trends.map((t) => ({ name: t.title, detail: t.why, status: t.when ?? "", ok: true, href: t.url })) },
    ], `week-${id}-trends`))
  }
  run.items.forEach((it, k) => {
    if (it.status === "failed" || !it.text) return
    const docId = `week-${id}-${k}`
    const blocks: Block[] = [
      { kind: "text", text: `${it.day}: ${it.why}` },
      { kind: "doc", title: it.title, meta: `${LABEL[it.kind]} · ${STATUS[it.status]}`, text: it.text, docId, editable: it.status === "ready", markdown: it.kind === "blog", image: it.image ?? undefined, square: it.kind === "social" },
    ]
    let chips: Chip[] = []
    if (it.kind === "blog") chips = it.status === "published" && it.href ? [{ label: "See it live", action: { type: "link", href: it.href }, primary: true }] : siteChips("post", { title: it.title, text: it.text, draftId: it.draftId, docId })
    else if (it.kind === "google" && it.postId) chips = [{ label: it.status === "scheduled" ? "Post it now instead" : "Post it to Google", action: { type: "post-publish", postId: it.postId }, primary: it.status !== "scheduled" }, { label: "Delete it", action: { type: "post-delete", postId: it.postId } }]
    else if (it.kind === "social") chips = [{ label: "Copy the post", action: { type: "copy", text: it.text, done: "Copied. Paste it into Facebook, Instagram or LinkedIn with the image." }, primary: true }, ...(it.image ? [{ label: "Open the image", action: { type: "link" as const, href: it.image } }] : [])]
    if (chips.length) blocks.push({ kind: "chips", items: chips })
    out.push(agent(blocks, `week-${id}-${k}`))
  })
  out.push(agent([
    ...run.notes.map((n) => ({ kind: "text" as const, text: n })),
    { kind: "chips", items: [
      { label: "What I do without asking", action: { type: "thread", topic: "autopilot" } },
      { label: "Your brand & voice", action: { type: "thread", topic: "voice" } },
    ] },
  ], `week-${id}-end`))
  return out
}
