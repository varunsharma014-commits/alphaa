// Client-safe message blocks shared by server-built threads and client jobs.
import type { CitationReport } from "@/lib/citations"
import { agent, type Block, type Message } from "@/lib/agent/types"

function ago(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 14) return "last week"
  return `${Math.floor(days / 7)} weeks ago`
}

export function citationBlocks(report: CitationReport, businessType: string | null, city: string | null, at: Date): Block[] {
  const targets = [...report.targets].sort((a, b) => (a.status === "missing" ? -1 : 1) - (b.status === "missing" ? -1 : 1) || a.rank - b.rank).slice(0, 8)
  return [
    { kind: "text", text: `${report.listed} of ${report.targets.length} pages the AIs read mention you.`, big: true },
    { kind: "text", text: `These are the pages that come up when someone looks for a ${businessType || "business"}${city ? ` in ${city}` : ""} — checked ${ago(at)}.` },
    { kind: "sources", items: targets.map((t) => ({ name: t.domain, detail: t.title.slice(0, 80), status: t.status === "listed" ? "You’re on it" : t.status === "missing" ? "Not on it" : "Couldn’t check", ok: t.status === "listed", href: t.url })) },
    ...(report.missing > 0 ? [{ kind: "text", text: `Getting onto the ${report.missing === 1 ? "missing one" : `${report.missing} missing pages`} is the fastest way to change what AI says. Most are listings you can claim in minutes — ask me how for any of them.` } as Block] : [{ kind: "text", text: "You’re on every page they lean on. I’ll re-check every week." } as Block]),
  ]
}

// Discussions the AIs read (Reddit, Quora, local forums). We never post for
// the owner — we draft a helpful reply they post themselves, disclosing who they are.
export function discussionMessages(report: CitationReport): Message[] {
  const threads = report.targets.filter((t) => t.kind === "forum").slice(0, 3)
  if (!threads.length) return []
  return [
    agent([
      { kind: "text", text: `The AIs also read ${threads.length === 1 ? "a discussion" : `${threads.length} discussions`} where people ask for a business like yours.` },
      { kind: "text", text: "A genuinely helpful reply from you — saying plainly that you own the business — is one of the few ways to show up there. I’ll draft it; you post it from your own account." },
    ], "disc-intro"),
    ...threads.map((t) =>
      agent([
        { kind: "sources", items: [{ name: t.domain, detail: t.title.slice(0, 90), status: t.status === "listed" ? "You’re mentioned" : "Not mentioned", ok: t.status === "listed", href: t.url }] },
        { kind: "chips", items: [{ label: "Draft a reply for me", action: { type: "draft", topic: t.title.slice(0, 190) || t.domain, mode: "reply", url: t.url }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
      ], `disc-${t.rank}`)
    ),
  ]
}
