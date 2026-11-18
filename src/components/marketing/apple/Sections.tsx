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
      step: "No agency bills",
      title: "One agent instead of three retainers.",
      body: "Agencies often charge $1,000+ a month for one channel. I handle your SEO and AI search, content and reviews from $99 a month. On Growth I also run social, ads and email (early access).",
      art: <div className="ap-price-chip"><b>$99</b><span>/month</span><em>No contract</em></div>,
    },
    {
      tone: "sky" as const,
      step: "Ready to hire",
      title: "Reach people ready to book today.",
      body: `People searching Google or asking Perplexity for “the best HVAC contractor near me” want to hire someone today. I work to put you in front of them.`,
      art: <ChatAnswer engine="Perplexity" q="Best HVAC contractor near me?" name="Example HVAC Co." rest=" — same-day service, well reviewed. (Fictional business.)" />,
    },
    {
      tone: "sage" as const,
      step: "The end goal",
      title: "The goal is a ringing phone.",
      body: `Not better metrics: a customer who calls because a post, a search or ChatGPT gave them your name. When you connect Google Analytics, I count the visitors I send you, so you can see it for yourself.`,
      art: (
        <Phone>
          <IncomingCall from="New customer" sub="“ChatGPT said you’re the best in town.”" />
        </Phone>
      ),
    },
  ]
  return (
    <section className="ap-sec ap-sec--grey">
      <h2 className="ap-h2 ap-center">Turn your marketing<br />into real revenue.</h2>
      <p className="ap-lead ap-center">Every post, review reply and AI recommendation should bring you customers, not vanity metrics. When ChatGPT names your business, that’s a direct referral to someone ready to book, buy or visit.</p>
      {/* Paid clicks vs. an earned AI recommendation: one of the strengths, shown side by side. */}
      <div className="ap-hero-panel">
        <Panel tone="lavender" tall>
          <div className="ap-versus">
            <div className="ap-versus__side">
              <div className="ap-versus__label">Paid click</div>
              <AdVsAi only="ad" />
            </div>
            <div className="ap-versus__vs" aria-hidden="true">vs</div>
            <div className="ap-versus__side">
              <div className="ap-versus__label">Earned AI answer</div>
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
    title: "I see where customers find you.",
    body: `Every week I check Google and ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask. Then I tell you who got recommended: you, or the shop down the street.`,
    art: (
      <Phone>
        <AgentNote title="Good morning." body="I asked ChatGPT for the “best dentist near Zilker.” It named 3 clinics. You weren’t one. Here’s why — and what I’m doing to fix it." />
        <EngineChips items={[{ name: "ChatGPT", ok: false }, { name: "Gemini", ok: true }, { name: "Claude", ok: true }, { name: "Perplexity", ok: false }]} />
      </Phone>
    ),
  },
  {
    title: "I write and post the work.",
    body: `Blog posts, Google posts, website fixes and review replies, all in your voice. On the Growth plan I also write social posts, build ads and email past customers (early access).`,
    art: (
      <Phone>
        <AgentNote title="New page ready" body="I wrote a page answering “Do you take Delta Dental?” — the #2 question in your area." actions={["Publish", "Edit"]} />
        <DraftDoc title="FAQ · Example Dental Co. (example)" lines={["Are you accepting new patients?", "Do you offer same-day crowns?"]} fresh="Do you take Delta Dental? Yes — we’re in network…" />
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
      <h2 className="ap-h2 ap-center">Most tools give you a to-do list.<br /><span className="ap-quiet">{A}’s AI Agent does them for you.</span></h2>
      <p className="ap-lead ap-center">Marketing tools hand you a dashboard and leave you to figure it out. I run your marketing: I write, fix and publish, then tell you exactly what I did, in plain English.</p>
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
    more: `I message you like a person would. Read it, tap Approve or Edit, done.`,
    tone: "mist",
    art: <AgentNote title="Post this to Google?" body="“Now booking same-week cleanings — call or book online.”" actions={["Approve", "Edit"]} />,
  },
  {
    eyebrow: "The tech, handled",
    title: "The technical stuff? Not your problem.",
    body: "You don’t need to learn any of it.",
    more: `I check 23 things AI reads on your site (whether AI can get in, your business facts, reviews, service pages) and fix what I can for you.`,
    tone: "sky",
    art: <Checklist rows={[{ label: "AI can read your site", ok: true }, { label: "Address, phone and hours clear", ok: true }, { label: "Summary for AI assistants", ok: true }, { label: "Reviews AI can read", ok: true }]} />,
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
    title: "No contract. Cancel online in a minute.",
    body: "I keep my job only if I keep earning it.",
    more: "No minimum term and no exit fees. From $99 a month.",
    tone: "sage",
    art: <div className="ap-price-chip"><b>$99</b><span>/month</span><em>Cancel anytime</em></div>,
  },
  {
    eyebrow: "Works with your site",
    title: "Keep your website. Keep your host.",
    body: "WordPress, Shopify, Webflow — or anything else.",
    more: `I never need your passwords. I connect to WordPress, Shopify and Webflow with one secure approval (Wix is coming soon) and hand your web person exact instructions for anything else.`,
    tone: "lavender",
    art: <ChatAnswer q="Who does emergency plumbing in Austin?" name="Example Plumbing Co." rest=" — open 24/7, licensed. (Fictional business.)" />,
  },
]

export function EasyRail() {
  // Bento: one wide card to lead, then a 2×2 grid — everything visible, nothing cut off.
  const [lead, ...rest] = EASY
  const Card = ({ c, wide }: { c: (typeof EASY)[number]; wide?: boolean }) => (
    <article className={`ap-bento__card${wide ? " is-wide" : ""}`} data-reveal>
      <div className="ap-bento__text">
        <div className="ap-bento__eyebrow">{c.eyebrow}</div>
        <h3>{c.title}</h3>
        <p className="ap-bento__lead">{c.body}</p>
        <p className="ap-bento__more">{c.more}</p>
      </div>
      <div className={`ap-bento__art ap-tint--${c.tone}`}>{c.art}</div>
    </article>
  )
  return (
    <section className="ap-sec ap-sec--grey">
      <h2 className="ap-h2 ap-center">Zero technical skills required.<br /><span className="ap-quiet">Your AI Agent does the work for you.</span></h2>
      <p className="ap-center" style={{ marginTop: 18 }}><Link href="/how-it-works" className="ap-link" style={{ fontSize: 19 }}>See how I work ›</Link></p>
      <div className="ap-bento">
        <Card c={lead} wide />
        {rest.map((c) => <Card key={c.title} c={c} />)}
      </div>
    </section>
  )
}

// ── 4. Agency vs agent: side-by-side, prices on one line, savings right under ──
const ROWS: [string, string, string][] = [
  ["The report", "A monthly PDF full of jargon and vanity metrics. You have no idea if it worked.", "One line: what I did today, what changed, what I need from you."],
  ["The contract", "6-month minimums, 12-month contracts, exit fees. Locked in before they deliver.", "Month to month. Cancel online in a minute. I only stay if I keep earning it."],
  ["The scope", "Usually one channel per retainer. Ask about ChatGPT or Claude and many stumble.", "SEO and AI search, content and reviews on every plan. Social, ads and email on Growth (early access)."],
]

export function AgencyToggle() {
  return (
    <section className="ap-sec">
      <h2 className="ap-h2 ap-center">Agencies often charge $1,000+ a month<br /><span className="ap-quiet">for marketing an AI Agent now runs for you.</span></h2>
      <p className="ap-lead ap-center">Keep the money, get your time back, and show up where customers search and ask today.</p>
      <div className="ap-vs">
        <div className="ap-vs__col ap-vs__col--them">
          <div className="ap-vs__name">Marketing agency (example)</div>
          <div className="ap-vs__price"><b>$1,000+</b><span>/mo</span></div>
          <div className="ap-vs__year">for example, $12,000+ a year</div>
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
          <span>For example, against a $1,000 a month agency, save</span>
          <b>$10,812 a year</b>
          <em>…and your marketing still gets done every week.</em>
        </div>
      </div>
    </section>
  )
}
