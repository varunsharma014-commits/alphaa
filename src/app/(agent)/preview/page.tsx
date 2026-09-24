import { notFound } from "next/navigation"
import { AgentShell } from "@/components/agent/AgentShell"
import { DashboardAgent } from "@/components/agent/DashboardAgent"
import { agent } from "@/lib/agent/types"
import type { RailData } from "@/lib/agent/feed"

// Dev-only: renders the app shell with sample messages so the agent UI can be
// checked in a browser without a Clerk session. 404s in production.
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  const rail: RailData = { businessName: "Bright Smile Dental", location: "Austin, TX", dayNumber: 42, named: 3, checked: 4, states: ["found", "found", "found", "partial"], waiting: { reviews: 1, posts: 1 }, googleConnected: true }
  const messages = [
    { id: "day", role: "agent" as const, blocks: [{ kind: "divider" as const, text: "Tuesday, 23 September · day 42" }] },
    agent([
      { kind: "text", text: "ChatGPT named you this morning.", big: true },
      { kind: "text", text: "That’s new — yesterday it didn’t." },
      { kind: "verdicts", items: [{ engine: "chatgpt", state: "found", note: "checked today" }, { engine: "gemini", state: "found", note: "checked today" }, { engine: "claude", state: "partial", note: "you asked · 3 days ago" }, { engine: "perplexity", state: "found", note: "checked today" }] },
      { kind: "answer", engine: "chatgpt", query: "Who’s the best dentist near Zilker, Austin?", answer: "Here are a few well-reviewed options near Zilker:\n\n1. Austin Family Dental — highly rated, takes most insurance.\n2. Bright Smile Dental — in-network with Delta Dental, sees kids from age 3.\n3. Barton Springs Dental — good for cosmetic work.", appeared: true, mentioned: ["Austin Family Dental", "Barton Springs Dental"], businessName: "Bright Smile Dental" },
      { kind: "chips", items: [{ label: "Ask them again now", action: { type: "live", question: "Who is the best dentist in Austin?" }, primary: false }] },
    ]),
    agent([
      { kind: "text", text: "Maria G. left a 5-star review yesterday:" },
      { kind: "doc", title: "Maria G. · Google", meta: "★★★★★", text: "Leo’s first visit went so well. Everyone was patient with him." },
      { kind: "text", text: "I’ll write a thank-you. You approve, I post it." },
      { kind: "chips", items: [{ label: "Draft a reply", action: { type: "review-draft", reviewId: "x" }, primary: true }, { label: "Skip", action: { type: "dismiss" } }] },
    ]),
    agent([
      { kind: "text", text: "Where the AIs look before they recommend a dentist in Austin: 2 of 6 pages mention you." },
      { kind: "sources", items: [{ name: "zocdoc.com", detail: "Best Dentists in Austin, TX", status: "Not on it", ok: false }, { name: "yelp.com", detail: "Top 10 Best Dentist near Zilker", status: "You’re on it", ok: true }, { name: "austinchronicle.com", detail: "Best of Austin 2026 — Dentist", status: "Not on it", ok: false }] },
      { kind: "chips", items: [{ label: "Show me every page", action: { type: "link", href: "/dashboard/citations" }, primary: false }] },
    ]),
    agent([{ kind: "receipt", title: "This week", sub: "14 things done", items: ["Asked the 4 AIs your 5 questions", "Published “Do you take Delta Dental?”", "Replied to 6 reviews", "Posted 2 Google updates"] }, { kind: "text", text: "Ask me about any of it below." }]),
  ]
  return (
    <div data-agent="" data-theme="light" data-brand="blue">
      <AgentShell rail={rail} theme="light" trialDaysLeft={null} showUser={false}>
        <DashboardAgent initial={messages} businessName="Bright Smile Dental" />
      </AgentShell>
    </div>
  )
}
