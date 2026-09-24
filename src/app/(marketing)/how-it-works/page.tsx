import type { Metadata } from "next"
import Link from "next/link"
import { Panel, ChatAnswer, AgentNote, DraftDoc, Phone, EngineChips, Checklist } from "@/components/marketing/apple/Mockups"
import { BRAND } from "@/lib/brand"

export const metadata: Metadata = {
  title: "How it works — from a free check to AI recommending you",
  description:
    "Exactly what happens: a free 60-second check of what ChatGPT, Gemini, Claude and Perplexity say about you, one-click setup, the weekly work your agent does, and what you approve.",
  alternates: { canonical: "/how-it-works" },
}

const A = BRAND.agentName

// Accurate to what the product does today — no timelines promised, no
// features that don't exist (no snippet install, no auto-publishing).
const STEPS = [
  {
    tone: "sky" as const,
    eyebrow: "Step 1 · Free, 60 seconds",
    title: "See what AI says about you.",
    body: `Enter your website. ${A} asks ChatGPT, Gemini, Claude and Perplexity the question a real customer would, shows you exactly who they named, and reads your site the way they do — 23 checks, from crawler access to reviews.`,
    art: <ChatAnswer q="Best dentist near Zilker, Austin?" name="Bright Smile Dental" rest=" — gentle with nervous patients, open Saturdays, 4.9★." />,
  },
  {
    tone: "lavender" as const,
    eyebrow: "Step 2 · About two minutes",
    title: "Say yes, and connect Google.",
    body: "Confirm your business details and connect your Google Business Profile with one secure click. No passwords to hand over, nothing to install.",
    art: <Checklist rows={[{ label: "Business details confirmed", ok: true }, { label: "Google Business Profile connected", ok: true }, { label: "First check of your site", ok: true }, { label: "Week one plan ready", ok: true }]} />,
  },
  {
    tone: "peach" as const,
    eyebrow: "Step 3 · Every week",
    title: "It does the work.",
    body: `${A} asks the four AIs your customers’ questions, writes the pages and facts AI needs to read — FAQ answers, structured facts, llms.txt — drafts Google posts and review replies, and watches what your competitors publish.`,
    art: <DraftDoc title="FAQ · Bright Smile Dental" lines={["Are you accepting new patients?", "Do you offer same-day crowns?", "Is there parking?"]} fresh="Do you take Delta Dental? Yes — we’re in network…" />,
  },
  {
    tone: "mist" as const,
    eyebrow: "Step 4 · One tap",
    title: "You approve anything public.",
    body: "Posts, review replies and new pages wait for you. Read it, tap Approve or Edit. Nothing goes out in your name without your yes.",
    art: (
      <Phone>
        <AgentNote title="Reply to Maria’s ★★★★★ review?" body="“Thank you, Maria! We’re so glad the cleaning was painless — see you in six months.”" actions={["Approve", "Edit"]} />
      </Phone>
    ),
  },
  {
    tone: "sage" as const,
    eyebrow: "Step 5 · Plain English",
    title: "One short note: what changed.",
    body: "What it did, what moved, and what it needs a yes on — in words you’d use. No dashboards to decode, no 20-page PDF.",
    fine: "Changes to your Google profile can show up within days. AI answers usually take longer — often weeks — and nobody can honestly promise when, or guarantee a ranking.",
    art: (
      <Phone>
        <AgentNote title="This week" body="Named by 3 of 4 AIs, up from 1. Published your FAQ. Replied to 4 reviews. One post needs your yes." />
        <EngineChips items={[{ name: "ChatGPT", ok: true }, { name: "Gemini", ok: true }, { name: "Claude", ok: true }, { name: "Perplexity", ok: false }]} />
      </Phone>
    ),
  },
]

export default function HowItWorksPage() {
  return (
    <>
      <section className="ap-sec ap-sec--grey" style={{ paddingTop: 120 }}>
        <h1 className="ap-h2 ap-center" style={{ fontSize: "clamp(44px, 7.7vw, 88px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
          Everything {A} does.<br /><span className="ap-quiet">Explained.</span>
        </h1>
        <p className="ap-lead ap-center">No black boxes. Here’s exactly what happens — from a free check to AI saying your name.</p>
        <div className="ap-story">
          {STEPS.map((s) => (
            <article key={s.title} className="ap-row">
              <div className="ap-row__art"><Panel tone={s.tone}>{s.art}</Panel></div>
              <div className="ap-row__text">
                <div className="ap-eyebrow">{s.eyebrow}</div>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
                {"fine" in s && s.fine && <p className="ap-row__fine">{s.fine}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="ap-sec ap-cta">
        <h2 className="ap-h2">See what AI says about you.</h2>
        <p className="ap-lead">It takes about a minute. Just your website.</p>
        <Link href="/start" className="ap-btn">Scan Your Website – It’s Free</Link>
        <p className="ap-fine">No credit card required.</p>
      </section>
    </>
  )
}
