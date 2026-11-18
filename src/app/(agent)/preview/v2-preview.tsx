import { notFound } from "next/navigation"
import { ClerkProvider } from "@clerk/nextjs"
import { AgentShell } from "@/components/agent/AgentShell"
import { DashboardAgent } from "@/components/agent/DashboardAgent"
import type { RailData } from "@/lib/agent/feed"
import type { Briefing } from "@/lib/agent/briefing"

// Dev-only: Dashboard v2 with sample data, to check the layout without a Clerk session. 404s in production.
export function PreviewV2() {
  if (process.env.NODE_ENV === "production") notFound()
  const rail: RailData = { businessName: "Bright Smile Dental", location: "Austin, TX", dayNumber: 42, named: 3, checked: 4, states: ["found", "found", "found", "partial"], waiting: { reviews: 1, posts: 1 }, googleConnected: true }
  const day = (d: number, h: number) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString() }
  const briefing: Briefing = {
    firstName: "Sam",
    lights: [
      { engine: "chatgpt", name: "ChatGPT", light: "yes" },
      { engine: "gemini", name: "Gemini", light: "no" },
      { engine: "claude", name: "Claude", light: "yes" },
      { engine: "perplexity", name: "Perplexity", light: "unknown" },
    ],
    headline: "Great news! ChatGPT and Claude are recommending you to customers. I’m working on Gemini next.",
    asOf: new Date().toISOString(),
    rivalLine: null,
    planLine: null,
    inbox: [
      { kind: "social", id: "a,b,c", title: "Approve this week’s 3 posts", text: "I wrote them in your voice. They go out on the days below.", topic: "social", posts: [
        { id: "a", image: null, when: day(1, 9), where: ["Facebook", "Instagram"], text: "Saturday hours are back: 9 to 1, every week." },
        { id: "b", image: null, when: day(3, 12), where: ["Facebook", "Instagram"], text: "3 things to ask before your first cleaning." },
        { id: "c", image: null, when: day(5, 10), where: ["Facebook"], text: "Meet the team behind your smile." },
      ] },
      { kind: "review", id: "r1", author: "Sarah", rating: 5, title: "Sarah left you a 5-star review. Here’s my reply:", quote: "Friendly team and no waiting.", text: "Thank you, Sarah! We’re glad the visit went smoothly. See you next time." },
      { kind: "fix", id: "facts", title: "ChatGPT has a fact about you wrong", text: "It tells customers “Closed on Saturdays”. The truth: open Saturday 9–1. I’ve written the correction for your site.", topic: "answers" },
      { kind: "setup", id: "voice", title: "Pick how you sound", text: "I read your own website and wrote three ways to sound like you. Pick one, so every post sounds like you wrote it.", topic: "setup", step: 3, total: 7, chip: { label: "Show me the options", primary: true, action: { type: "thread", topic: "voice" } } },
    ],
    ledger: [
      { text: "Wrote an update for your Google listing", href: null, at: new Date().toISOString() },
      { text: "Checked whether ChatGPT, Gemini, Claude and Perplexity recommend you", href: null, at: new Date().toISOString() },
    ],
    nextCheck: day(2, 9),
    nextUp: { text: "Writing your next post", at: day(1, 10) },
    milestones: [{ text: "I started working for you", at: day(-30, 9) }],
    autoApprove: false,
  }
  return (
    <ClerkProvider>
      <div data-agent="" data-theme="light" data-brand="blue">
        <AgentShell rail={rail} theme="light" trialDaysLeft={null} showUser={false} v2 setup={{ done: 2, total: 7 }} auto={{ on: false, pro: true, growth: true }}>
          <DashboardAgent initial={[]} businessName="Bright Smile Dental" briefing={briefing} v2 />
        </AgentShell>
      </div>
    </ClerkProvider>
  )
}
