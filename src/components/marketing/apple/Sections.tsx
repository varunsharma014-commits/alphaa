"use client"

// Apple-pattern homepage sections: illustrated step cards, an accordion that
// swaps a phone shot, a horizontal card rail with (+) details, a segmented
// toggle, and a filterable FAQ. Styles: app/apple.css (.ap-*).

import { useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { AgentNote, ChatAnswer, Checklist, DraftDoc, EngineChips, IncomingCall, Panel, Phone, AdVsAi } from "./Mockups"
import { BRAND } from "@/lib/brand"

const A = BRAND.agentName

// ── 1. Revenue: three illustrated cards ──────────────────────────────────────
export function RevenueSection() {
  const cards = [
    {
      tone: "lavender" as const,
      step: "Save on ads",
      title: "Skip the Google Ads bidding war.",
      body: "Stop paying $15 a click to fight for attention on Google. When an AI recommends you as the “best local option,” you get organic trust that money can’t buy.",
      art: <div className="ap-price-chip"><b>$0</b><span>per click</span><em>AI recommendations aren’t auctioned</em></div>,
    },
    {
      tone: "sky" as const,
      step: "Ready to hire",
      title: "Capture high-intent buyers.",
      body: `People asking Perplexity or Gemini for “the best HVAC contractor near me” are looking to hire someone today. ${A} works to put you in that answer.`,
      art: <ChatAnswer engine="Perplexity" q="Best HVAC contractor near me?" name="Desert Air Heating & Cooling" rest=" — same-day service, 4.9★ from 380 reviews." />,
    },
    {
      tone: "sage" as const,
      step: "The end goal",
      title: "More calls, more bookings, more foot traffic.",
      body: `The goal isn’t better metrics. It’s a ringing phone. Businesses using ${A} report more inbound calls and appointments within weeks of their first AI mention.`,
      art: (
        <Phone>
          <IncomingCall from="New customer" sub="“ChatGPT said you’re the best in town.”" />
        </Phone>
      ),
    },
  ]
  return (
    <section className="ap-sec ap-sec--grey">
      <h2 className="ap-h2 ap-center">Turn AI recommendations<br />into real revenue.</h2>
      <p className="ap-lead ap-center">When ChatGPT or Claude names your business, it’s not a vanity metric — it’s a direct referral. People asking AI aren’t browsing. They’re ready to book, buy or visit.</p>
      {/* The strongest angle, front and centre: pay per click vs. recommended for free. */}
      <div className="ap-hero-panel">
        <Panel tone="lavender" tall>
          <div className="ap-versus">
            <div className="ap-versus__side">
              <div className="ap-versus__label">Google Ads</div>
              <AdVsAi only="ad" />
            </div>
            <div className="ap-versus__vs" aria-hidden="true">vs</div>
            <div className="ap-versus__side">
              <div className="ap-versus__label">AI recommendation</div>
              <AdVsAi only="ai" />
            </div>
          </div>
        </Panel>
      </div>
      <div className="ap-steps">
        {cards.map((c) => (
          <article key={c.title} className="ap-stepcard">
            <Panel tone={c.tone}>{c.art}</Panel>
            <div className="ap-stepcard__body">
              <div className="ap-eyebrow">{c.step}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

// ── 2. "Does the to-dos": accordion that swaps the phone shot ────────────────
const TODOS = [
  {
    title: "It tracks your AI visibility.",
    body: `Every week, ${A} asks ChatGPT, Gemini, Claude and Perplexity the exact questions your customers ask — then tells you who got recommended: you, or the shop down the street.`,
    art: (
      <Phone>
        <AgentNote title="Good morning." body="I asked ChatGPT for the “best dentist near Zilker.” It named 3 clinics. You weren’t one. Here’s why — and what I’m doing to fix it." />
        <EngineChips items={[{ name: "ChatGPT", ok: false }, { name: "Gemini", ok: true }, { name: "Claude", ok: true }, { name: "Perplexity", ok: false }]} />
      </Phone>
    ),
  },
  {
    title: "It writes what the AI needs to read.",
    body: `${A} builds the answers, facts and pages AI checks before it recommends anyone. It writes them, places them and keeps them current.`,
    art: (
      <Phone>
        <AgentNote title="New page ready" body="I wrote a page answering “Do you take Delta Dental?” — the #2 question in your area." actions={["Publish", "Edit"]} />
        <DraftDoc title="FAQ · Bright Smile Dental" lines={["Are you accepting new patients?", "Do you offer same-day crowns?"]} fresh="Do you take Delta Dental? Yes — we’re in network…" />
      </Phone>
    ),
  },
  {
    title: "You stay in total control.",
    body: "Posts, replies and new pages wait for your review. You get a one-tap approve. Nothing goes public in your name without your green light.",
    art: (
      <Phone>
        <AgentNote title="Reply to Maria’s ★★★★★ review?" body="“Thank you, Maria! We’re so glad the cleaning was painless — see you in six months.”" actions={["Approve", "Edit"]} />
      </Phone>
    ),
  },
]

export function TodoAccordion() {
  const [open, setOpen] = useState(0)
  return (
    <section className="ap-sec">
      <h2 className="ap-h2 ap-center">Most tools give you a to-do list.<br /><span className="ap-quiet">{A} just does the to-dos.</span></h2>
      <p className="ap-lead ap-center">Marketing tools show you a complicated dashboard and leave you to figure it out. {A} reads, writes, fixes and publishes — then tells you exactly what it did, in plain English.</p>
      <div className="ap-feature">
        <div className="ap-acc">
          {TODOS.map((t, i) => (
            <div key={t.title} className={`ap-acc__item${open === i ? " is-open" : ""}`}>
              <button className="ap-acc__btn" onClick={() => setOpen(i)} aria-expanded={open === i}>
                <span>{t.title}</span>
                <span className="ap-acc__chev" aria-hidden="true" />
              </button>
              <div className="ap-acc__panel"><p>{t.body}</p></div>
            </div>
          ))}
        </div>
        <div className="ap-feature__art">
          {TODOS.map((t, i) => (
            <div key={t.title} className={`ap-feature__slide${open === i ? " is-on" : ""}`}>{t.art}</div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 3. Zero tech skills: horizontal card rail with (+) ───────────────────────
const EASY: { eyebrow: string; title: string; body: string; more: string; art: ReactNode; tone: "lavender" | "sky" | "sage" | "peach" | "mist" }[] = [
  {
    eyebrow: "No new software",
    title: "If you can tap “Approve,” you can use it.",
    body: "There’s no massive dashboard to memorize.",
    more: `${A} messages you like a person would. Read it, tap Approve or Edit, done.`,
    tone: "mist",
    art: <AgentNote title="Post this to Google?" body="“Now booking same-week cleanings — call or book online.”" actions={["Approve", "Edit"]} />,
  },
  {
    eyebrow: "The jargon, handled",
    title: "Schema? llms.txt? Not your problem.",
    body: "You don’t need to know what those words mean.",
    more: `${A} checks 23 things AI reads on your site — crawler access, structured facts, reviews, service pages — and fixes what it can for you.`,
    tone: "sky",
    art: <Checklist rows={[{ label: "AI crawlers can get in", ok: true }, { label: "Structured facts complete", ok: true }, { label: "llms.txt published", ok: true }, { label: "Reviews AI can read", ok: true }]} />,
  },
  {
    eyebrow: "Plain English",
    title: "One line, not a 20-page PDF.",
    body: "What it did this week, in words you’d use.",
    more: "Agencies hide behind jargon-filled reports. You get a short note: what changed, what moved, what needs your yes.",
    tone: "peach",
    art: <AgentNote title="This week" body="Named by 3 of 4 AIs (up from 1). Published your FAQ. Replied to 4 reviews. Need a yes on one post." />,
  },
  {
    eyebrow: "Month to month",
    title: "No contract. Cancel in two clicks.",
    body: "It keeps its job only if the AIs keep saying your name.",
    more: "No minimum term and no exit fees. From $99 a month.",
    tone: "sage",
    art: <div className="ap-price-chip"><b>$99</b><span>/month</span><em>Cancel anytime</em></div>,
  },
  {
    eyebrow: "Works with your site",
    title: "Keep your website. Keep your host.",
    body: "Squarespace, Wix, WordPress — it doesn’t matter.",
    more: `${A} never needs your passwords. It connects to Google with one secure click and hands your web person exact instructions when something needs a change.`,
    tone: "lavender",
    art: <ChatAnswer q="Who does emergency plumbing in Austin?" name="Lone Star Plumbing" rest=" — open 24/7, licensed, 4.8★." />,
  },
]

export function EasyRail() {
  const rail = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState<number | null>(null)
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * Math.min(420, rail.current.clientWidth * 0.8), behavior: "smooth" })
  return (
    <section className="ap-sec ap-sec--grey ap-sec--rail">
      <div className="ap-railhead">
        <h2 className="ap-h2">Zero technical skills required.<br /><span className="ap-quiet">Your agent does the heavy lifting.</span></h2>
        <Link href="/how-it-works" className="ap-link">See how it works ›</Link>
      </div>
      <div className="ap-rail" ref={rail}>
        {EASY.map((c, i) => (
          <article key={c.title} className="ap-railcard">
            <div className="ap-eyebrow ap-eyebrow--dark">{c.eyebrow}</div>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            <div className={`ap-railcard__art ap-tint--${c.tone}`}>{c.art}</div>
            <button className="ap-plus" aria-label={`More about: ${c.title}`} onClick={() => setMore(more === i ? null : i)}>{more === i ? "×" : "+"}</button>
            <div className={`ap-railcard__more${more === i ? " is-on" : ""}`}>
              <div className="ap-eyebrow ap-eyebrow--dark">{c.eyebrow}</div>
              <h3>{c.title}</h3>
              <p>{c.more}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="ap-railnav">
        <button onClick={() => scroll(-1)} aria-label="Previous">‹</button>
        <button onClick={() => scroll(1)} aria-label="Next">›</button>
      </div>
    </section>
  )
}

// ── 4. Agency vs agent: side-by-side, prices on one line, savings right under ──
const ROWS: [string, string, string][] = [
  ["The report", "A monthly PDF full of jargon and vanity metrics. You have no idea if it worked.", "One line: what it did today, what changed, what it needs from you."],
  ["The contract", "6-month minimums, 12-month contracts, exit fees. Locked in before they deliver.", "Month to month. Cancel in two clicks. It only stays if the AIs keep saying your name."],
  ["The focus", "Google’s ten blue links. Ask about ChatGPT or Claude and watch them stumble.", "Getting you recommended by AI assistants is the only thing it does."],
]

export function AgencyToggle() {
  return (
    <section className="ap-sec">
      <h2 className="ap-h2 ap-center">Your SEO agency charges $2,000 a month<br /><span className="ap-quiet">for a job AI is taking over.</span></h2>
      <p className="ap-lead ap-center">Even a “good” Google SEO agency leaves you invisible where customers are actually asking questions today.</p>
      <div className="ap-vs">
        <div className="ap-vs__col ap-vs__col--them">
          <div className="ap-vs__name">SEO agency</div>
          <div className="ap-vs__price"><b>$2,000</b><span>/mo</span></div>
          <div className="ap-vs__year">$24,000 a year</div>
        </div>
        <div className="ap-vs__col ap-vs__col--us">
          <div className="ap-vs__name">{A}</div>
          <div className="ap-vs__price"><b>$99</b><span>/mo</span></div>
          <div className="ap-vs__year">$1,188 a year</div>
        </div>
        {ROWS.map(([k, them, us], i) => (
          <div key={k} className={`ap-vs__row${i === ROWS.length - 1 ? " is-last" : ""}`}>
            <div className="ap-vs__k">{k}</div>
            <p className="ap-vs__them">{them}</p>
            <p className="ap-vs__us">{us}</p>
          </div>
        ))}
        <div className="ap-vs__save">
          <span>Save up to</span>
          <b>$22,800 a year</b>
          <em>…and actually show up where your customers now ask.</em>
        </div>
      </div>
    </section>
  )
}
