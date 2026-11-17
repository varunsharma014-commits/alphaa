import { notFound } from "next/navigation"
import { AgentShell } from "@/components/agent/AgentShell"
import { DashboardAgent } from "@/components/agent/DashboardAgent"
import { agent } from "@/lib/agent/types"
import type { RailData } from "@/lib/agent/feed"
import { answersMessages, securityMessages } from "@/lib/agent/check-narration"
import { voiceMessages } from "@/lib/agent/voice-narration"
import { insightsMessages } from "@/lib/agent/insights-narration"
import { brandMessages } from "@/lib/agent/voice-narration"
import { weekDoneMessages } from "@/lib/agent/week-narration"

// Dev-only: renders the app shell with sample messages so the agent UI can be
// checked in a browser without a Clerk session. 404s in production.
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()
  const rail: RailData = { businessName: "Bright Smile Dental", location: "Austin, TX", dayNumber: 42, named: 3, checked: 4, states: ["found", "found", "found", "partial"], waiting: { reviews: 1, posts: 1 }, googleConnected: true }
  const sample = answersMessages({
    at: new Date().toISOString(), named: 9, answers: 40,
    questions: [
      { q: "Who is the best family dentist in Austin?", engines: { chatgpt: { appeared: true, status: "appeared", named: [] }, gemini: { appeared: false, status: "not_appearing", named: ["Austin Family Dental"] }, claude: { appeared: true, status: "appeared", named: [] }, perplexity: { appeared: false, status: "not_appearing", named: ["Barton Springs Dental"] } } },
      { q: "Emergency dentist open Saturday near Zilker", engines: { chatgpt: { appeared: false, status: "not_appearing", named: ["Austin Family Dental"] }, gemini: { appeared: false, status: "not_appearing", named: [] }, claude: { appeared: false, status: "not_appearing", named: [] }, perplexity: { appeared: false, status: "not_appearing", named: ["SmileNow"] } } },
    ],
    rivals: [{ name: "Austin Family Dental", count: 14 }, { name: "Barton Springs Dental", count: 6 }],
    facts: { checked: true, question: "", issues: [{ engine: "chatgpt", claim: "Closed on Saturdays", truth: "open Saturday 9–1", severity: "high" }] },
  }, new Date())
  const sec = securityMessages({ domain: "brightsmile.com", checkedAt: "", passed: 5, total: 7, items: [
    { key: "hsts", label: "Browsers told to always use HTTPS", ok: false, detail: "Not set", severity: "medium" },
    { key: "sslExpiry", label: "Security certificate", ok: true, detail: "Renews in 60 days", severity: "high" },
    { key: "https", label: "Secure connection (HTTPS)", ok: true, detail: "Yes", severity: "high" },
  ] }, false)
  const now = Date.now()
  const voice = voiceMessages({
    analyzedAt: new Date().toISOString(), read: ["your homepage", "your about page", "3 replies you wrote to Google reviews"],
    detected: { language: "French", formality: "relaxed", emoji: "none", person: "we" }, phrases: ["fait maison", "savoir-faire", "pause gourmande"], avoid: ["Corporate jargon"],
    options: [
      { id: "v1", name: "Like your website", summary: "Warm, proud of the craft, a little playful.", guide: "", sample: "Croissants, pains au chocolat, chaussons aux pommes : tout est fait maison, avec un véritable savoir-faire." },
      { id: "v2", name: "Warm and family", summary: "Personal, like the owner talking at the counter.", guide: "", sample: "Chaque matin, on retrouve le même plaisir à sortir les pains du four." },
      { id: "v3", name: "The baker explains", summary: "Teaches a little about the craft in every post.", guide: "", sample: "Le secret d'un pain bien croustillant ? Une pâte qu'on laisse reposer." },
    ],
    chosen: "v1", style: { language: "French", formality: "relaxed", emoji: "none", length: "normal", person: "we" },
  })
  const log = agent([{ kind: "log", title: "I just did 3 things", sub: "just now", open: true, items: [
    { text: "Replied to a Google review", at: new Date(now - 120_000).toISOString(), href: null },
    { text: "Wrote and published a post: “How long does a sourdough loaf stay fresh?”", at: new Date(now - 60_000).toISOString(), href: "https://example.com" },
    { text: "Rewrote your page title and description so Google and AI know what you do", at: new Date(now).toISOString(), href: null },
  ] }])
  const insights = insightsMessages({
    at: new Date().toISOString(),
    sources: ["Google Search Console", "Google Analytics", "the questions I ask ChatGPT, Gemini, Claude and Perplexity each week", "your competitors’ websites"],
    working: [{ key: "a", text: "“dentist austin” brought 41 clicks from Google in the last 28 days, up 11 from the 4 weeks before." }, { key: "b", text: "The post I published, “What happens at a child’s first dental visit?”, got 64 views in the last 28 days." }],
    notWorking: [{ key: "c", text: "“emergency dentist austin” was seen 420 times on Google, but you’re around position 11, just off the first page." }, { key: "d", text: "When customers ask AI “Emergency dentist open Saturday in Austin”, it doesn’t name you. It names Austin Family Dental and SmileNow." }],
    niche: [{ key: "e", text: "Austin Family Dental is the business AI names most in your area: 7 times across 12 answers." }],
    ideas: [
      { title: "What should you do in a dental emergency in Austin?", format: "blog", why: "“emergency dentist austin” was seen 420 times but you’re around position 11, and AI names Austin Family Dental instead of you.", keys: ["c"] },
      { title: "Teeth whitening: what to expect at your first visit", format: "google", why: "Your whitening page is your most visited page after the homepage.", keys: ["a"] },
      { title: "3 things parents ask before a child’s first visit", format: "social", why: "Your post about a child’s first visit got 64 views in 28 days.", keys: ["b"] },
    ],
  }, { google: true })
  const brand = brandMessages({ logo: "x", colors: ["#00473c", "#e6ff55", "#2d6b52"], primary: "#00473c", font: "Inter", source: "site", at: "" }, "/blog-covers/_backdrop.jpg")
  const week = weekDoneMessages({
    status: "done", startedAt: "", steps: [], notes: ["Connect your Google listing and I’ll add two Google updates to every week."],
    summary: "I planned and wrote 1 blog post, 2 Google updates and 3 social posts. 3 are published or scheduled. 3 are waiting for your yes.",
    trends: [{ title: "Austin Marathon road closures Sunday", why: "Patients may struggle to reach you on Sunday morning.", url: "https://example.com", when: "Feb 15" }],
    items: [
      { kind: "blog", day: "Tuesday", title: "What should you do in a dental emergency in Austin?", why: "“emergency dentist austin” was seen 420 times but you’re around position 11.", status: "published", text: "## Call us first\nMost emergencies…", href: "https://example.com" },
      { kind: "google", day: "Thursday", title: "Saturday visits", why: "AI names Austin Family Dental for Saturday questions.", status: "scheduled", text: "Need a dentist this Saturday? …", postId: "p1" },
      { kind: "social", day: "Friday", title: "3 things parents ask", why: "Your kids’ post got 64 views.", status: "ready", text: "Is your child nervous about the dentist? …", image: "/blog-covers/_backdrop.jpg" },
    ],
  }, "demo", () => [{ label: "Publish it to my site", action: { type: "dismiss" }, primary: true }])
  const messages = [
    ...week,
    ...brand,
    ...insights,
    log,
    ...voice,
    ...sample,
    ...sec,
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
      { kind: "steps", items: ["Reading growthturbine.com", "Working out what customers ask", "Asking ChatGPT, Gemini, Claude and Perplexity", "Checking who they recommended instead"], done: 2, ticker: [["Opening"], ["Thinking"], ["Asking ChatGPT…", "Asking Gemini…", "Asking Claude…", "Asking Perplexity…"], ["Checking"]] },
      { kind: "sources", title: "Can AI get in?  ·  9 of 10", collapseOk: true, items: [{ name: "Set up with Bing (ChatGPT search uses it)", detail: "No sign of Bing Webmaster Tools", status: "No", ok: false }, ...["AI crawlers can open your site", "robots.txt lets AI search in", "Readable without JavaScript", "Sitemap"].map((n) => ({ name: n, detail: "Allowed", status: "Yes", ok: true }))] },
      { kind: "cta", chip: { label: "Start today →", action: { type: "link", href: "/signup" }, primary: true } },
      { kind: "chips", items: [{ label: "Email me this report", action: { type: "say", text: "ok" }, primary: false }] },
    ]),
    agent([
      { kind: "divider", text: "Your results" },
      { kind: "text", text: "AI assistants sent 4 people to your website this week — ChatGPT 3, Perplexity 1. (up from 1)", big: true },
      { kind: "text", text: "From your Google listing: 12 calls (up from 9), 18 requests for directions and 31 website visits." },
    ]),
    agent([
      { kind: "text", text: "I wrote the structured facts AI reads about you.", big: true },
      { kind: "chips", items: [{ label: "Email it to my web person", action: { type: "handoff", what: "schema" }, primary: true }, { label: "Have our team do it", action: { type: "link", href: "/dashboard/concierge" } }, { label: "Connect my website", action: { type: "wp-connect" } }] },
    ]),
    agent([
      { kind: "text", text: "Reviews are one of the strongest things AI weighs before naming a business." },
      { kind: "chips", items: [{ label: "Ask a customer for a review", action: { type: "review-ask" }, primary: true }] },
    ]),
    agent([
      { kind: "text", text: "1. Bing Places" },
      { kind: "receipt", title: "Bing Places for Business", sub: "about 10 minutes", items: ["Go to bingplaces.com and sign in.", "Choose “Import from Google Business Profile”.", "Confirm and verify."] },
      { kind: "chips", items: [{ label: "Open Bing Places", action: { type: "link", href: "https://www.bingplaces.com" } }, { label: "I’ve done it", action: { type: "setting", key: "bingPlacesDone", value: true, done: "Noted." }, primary: true }] },
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
