// Homepage v2 (Varun, 2026-11-17): "Run your entire marketing using an AI agent".
// Server-rendered so every word is crawlable; the interactive pieces live in HomeV2Client.
// Rules: sell the outcome, not the mechanics. No invented ratings, quotes or results:
// every example business, number and answer is labelled as an example.
import { Fragment } from "react"
import Link from "next/link"
import "./home-v2.css"
import { AiAnswers, Autopilot, BrandStudio, ChatDemo, CostTable, FeatureVideo } from "./HomeV2Client"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { GROWTH_EARLY_ACCESS_HREF, GROWTH_ON_SALE } from "@/lib/growth"
import { AUTHOR } from "@/lib/author"

const Tick = () => (
  <span className="hv-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
)
const Shield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
)

const SERVICES: [string, string][] = [
  ["Social Media Management", "#ffd6e0"], ["Ads Management", "#d6ecff"], ["SEO & AEO", "#dcf7e3"], ["Content Writing", "#fff0c2"],
  ["Email Marketing", "#eadcff"], ["Website Fixes", "#ffe3cc"], ["Analytics & Tracking", "#d4f4f2"],
]

// Drawn avatars (no photos or AI renders of people).
function Face({ bg, skin, hair, style }: { bg: string; skin: string; hair: string; style: "short" | "long" | "bun" | "curly" | "cap" }) {
  const hairs = {
    short: <path d="M11 17c0-6 4-9 9-9s9 3 9 9c-2-3-5-4-9-4s-7 1-9 4z" fill={hair} />,
    long: <path d="M10 20c0-8 4.5-12 10-12s10 4 10 12v9h-3v-9c-2-3-4-4-7-4s-5 1-7 4v9h-3z" fill={hair} />,
    bun: <><circle cx="20" cy="7" r="4" fill={hair} /><path d="M11 17c0-6 4-8 9-8s9 2 9 8c-2-2-5-3-9-3s-7 1-9 3z" fill={hair} /></>,
    curly: <path d="M10 18c-1-7 4-11 10-11s11 4 10 11c-1-2-2-3-3-3-1-2-3-2-4-1-1-1-3-1-4 0-1-1-3-1-4 1-2 0-4 1-5 3z" fill={hair} />,
    cap: <><path d="M10 16c0-5 4.5-8 10-8s10 3 10 8z" fill={hair} /><rect x="24" y="14" width="10" height="3" rx="1.5" fill={hair} /></>,
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" fill={bg} />
      <path d="M6 40c1-8 7-12 14-12s13 4 14 12z" fill={style === "cap" ? "#3a3a3c" : hair} opacity=".9" />
      <circle cx="20" cy="19" r="8" fill={skin} />
      {hairs[style]}
    </svg>
  )
}

const FEATURES = [
  {
    tag: "Social Media Content", c: "#ffd6e0", title: "Show up every week without lifting a finger.",
    body: "No more staring at a blank screen at 11pm. Your Facebook, Instagram and LinkedIn stay active with posts people stop scrolling for, written in your voice and made in your brand colours.",
    points: ["Planned around what your customers care about this week", "Your logo and colours on every image", "Posted for you, or ready with one tap"],
    label: "Social posts · this week",
    scenes: [
      <Fragment key="s1"><div className="say">Run my social for this week</div><div className="row"><i />Reading your brand: logo, colours, voice</div><div className="row"><i />Checking which posts got the most likes</div></Fragment>,
      <Fragment key="s2"><div className="mini"><div style={{ background: "#0b3d91", color: "#fff" }}>Saturday visits are back</div><div style={{ background: "#f6d34a", color: "#111" }}>Croissants out at 7</div><div style={{ background: "#e4572e", color: "#fff" }}>Freeze warning tonight</div></div><div className="box"><b>3 posts ready</b> · in your voice, with your logo</div></Fragment>,
      <Fragment key="s3"><div className="box"><b>Posted to Instagram</b> · Tue 9:00</div><div className="box"><b>Posted to Facebook</b> · Thu 12:00</div><div className="box"><b>Posted to LinkedIn</b> · Fri 8:30</div></Fragment>,
    ],
  },
  {
    tag: "Ads Management", c: "#d6ecff", title: "Stop paying for clicks that never call.",
    body: "Your ads reach people already looking for what you sell. Every week I cut what isn’t bringing customers and put the money into what is, so the same budget brings in more.",
    points: ["Never spends more than your monthly budget", "Your budget goes to Google and Meta. We never take a cut", "See which ads brought calls and bookings"],
    label: "Ads · weekly tune-up",
    scenes: [
      <Fragment key="s4"><div className="say">How are my ads doing?</div><div className="box"><b>Google Search</b> · 14 calls this week</div><div className="box"><b>Meta</b> · 6 form fills</div></Fragment>,
      <Fragment key="s5"><div className="row"><i />Paused 3 keywords with clicks but no calls</div><div className="row"><i />Moved $40 to “emergency plumber”</div><div className="row"><i />Wrote 2 fresh ad versions</div></Fragment>,
      <Fragment key="s6"><div className="box">Budget used <b>$412 of $500</b></div><div className="bar"><span style={{ width: "82%" }} /></div><div className="box"><b>Same budget, more calls.</b> I’ll keep tuning.</div></Fragment>,
    ],
  },
  {
    tag: "Content Writing", c: "#fff0c2", title: "Be the answer when customers search.",
    body: "Your customers are asking Google and ChatGPT questions right now. I find the ones you’re missing and publish the answer on your website, so the next person who asks finds you, not a competitor.",
    points: ["Topics picked from what your customers actually search", "Written to be quoted by AI assistants", "Published to WordPress, Webflow, Shopify or Wix"],
    label: "Blog · new post",
    scenes: [
      <Fragment key="s7"><div className="row"><i />Found a question you’re losing: “emergency dentist open weekends”</div><div className="row"><i />Seen 420 times. You’re on page two.</div></Fragment>,
      <Fragment key="s8"><div className="box"><b>What to do in a dental emergency on a weekend</b><br />Most dental emergencies can wait a few hours. Here’s how to tell…</div><div className="box">5 questions answered · FAQ added</div></Fragment>,
      <Fragment key="s9"><div className="box"><b>Published to your website</b> · /blog/weekend-dental-emergency</div><div className="row"><i />Sent to Google to index</div></Fragment>,
    ],
  },
  {
    tag: "SEO & AEO", c: "#dcf7e3", title: "Get recommended by ChatGPT, not your competitor.",
    body: "People now ask AI who to call. When ChatGPT, Gemini, Claude or Perplexity names someone else, you lose that customer without ever knowing. I fix what keeps you out and check every week.",
    points: ["Weekly checks across 4 AI assistants", "Fixes what AI can’t read on your website", "Keeps your Google listing busy and fresh"],
    label: "AI visibility · weekly check",
    scenes: [
      <Fragment key="s10"><div className="say">Does ChatGPT recommend me?</div><div className="row"><i />Asking ChatGPT, Gemini, Claude and Perplexity</div></Fragment>,
      <Fragment key="s11"><div className="box"><b>ChatGPT</b> · names you</div><div className="box"><b>Gemini</b> · names a competitor</div><div className="box"><b>Perplexity</b> · names you</div></Fragment>,
      <Fragment key="s12"><div className="row"><i />Added the business facts Gemini couldn’t read</div><div className="row"><i />Wrote the page it quotes for this question</div><div className="big">3 of 4</div><div>AIs now name you</div></Fragment>,
    ],
  },
  {
    tag: "Email Marketing", c: "#eadcff", title: "Turn past customers into repeat customers.",
    body: "Your easiest sale is someone who already bought from you. I send short, friendly emails at the right moment, reminders, seasonal news and offers, so they come back to you instead of wandering off.",
    points: ["Written in your voice, sent at the right time", "Unsubscribe link and legal footer handled", "See who came back"],
    label: "Email · this week",
    scenes: [
      <Fragment key="s13"><div className="row"><i />Found 214 customers due for a check-up</div><div className="row"><i />Writing a reminder in your voice</div></Fragment>,
      <Fragment key="s14"><div className="box"><b>Subject: Time for your check-up?</b><br />Hi Sam, it’s been six months. Saturday mornings are open again…</div></Fragment>,
      <Fragment key="s15"><div className="box"><b>Sent to 214</b> · Tue 10:00</div><div className="box">58% opened · 17 booked</div></Fragment>,
    ],
  },
]

const WHY = [
  { t: "Every week, not once a month", p: "Your marketing never takes a week off, even when you do.", d: "M4 6h16M4 12h16M4 18h10" },
  { t: "Answers in seconds", p: "Ask anything by typing or out loud. No waiting for a call back.", d: "M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4zM5 11a7 7 0 0 0 14 0M12 18v3" },
  { t: "See everything it does", p: "Every post, ad and fix, the moment it happens.", d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { t: "No contracts, no lock-in", p: "Month to month. Cancel online in a minute.", d: "M7 11V8a5 5 0 0 1 9.6-2M5 11h14v10H5z" },
]

export function HomeV2() {
  const growthHref = GROWTH_ON_SALE ? "/signup?plan=growth" : GROWTH_EARLY_ACCESS_HREF
  return (
    <div className="hv">
      {/* Hero */}
      <section className="hv-hero">
        <div className="hv-wrap">
          <span className="hv-eyebrow">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" /></svg>
            <b>Your AI marketing agent</b>
          </span>
          <ul className="hv-svc" aria-label="What your AI agent does">
            {SERVICES.map(([s, c]) => <li key={s} style={{ ["--c" as string]: c }}><Tick />{s}</li>)}
          </ul>
          <h1>Run your entire marketing <span>using an AI agent</span></h1>
          <div className="hv-proof">
            <div className="hv-faces" aria-hidden="true">
              <Face bg="#ffe1d6" skin="#f1c5a8" hair="#3b2a1a" style="long" />
              <Face bg="#d9f2e3" skin="#8d5a3b" hair="#1d1d1f" style="short" />
              <Face bg="#e3e1ff" skin="#e8b894" hair="#c26a2b" style="bun" />
              <Face bg="#fff1c7" skin="#5b3a29" hair="#1d1d1f" style="curly" />
              <Face bg="#d7ecff" skin="#f3d0b5" hair="#7a7a7a" style="cap" />
            </div>
            <span>Built for small businesses that want to avoid the agency scam</span>
          </div>
          <Link className="hv-cta" href="/start">Get started</Link>
          <div className="hv-promise"><Shield /><span>{GUARANTEE_LINE}</span></div>
          <p className="hv-fine">Month to month. Cancel online in a minute.</p>
          <ChatDemo />
        </div>
      </section>

      {/* Agency vs Alphaa */}
      <section className="hv-band hv-band--grey">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2">An agency’s work.<br />But cheaper and better.</h2>
          <p className="hv-lede">Paying an agency for each piece adds up fast, and you still end up chasing them for updates. One AI agent does all of it, every week, for a fraction of the price.</p>
          <CostTable />
          <div className="hv-why4">
            {WHY.map((w) => (
              <div key={w.t}>
                <div className="hv-why4__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={w.d} /></svg></div>
                <b>{w.t}</b>
                <p>{w.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What the agent does */}
      <section className="hv-band" id="features">
        <div className="hv-wrap">
          <div className="hv-center">
            <p className="hv-kicker">What your agent does</p>
            <h2 className="hv-h2" style={{ marginTop: 10 }}>One agent. Your whole marketing.</h2>
            <p style={{ marginTop: 14 }}><span className="hv-example">Example screens and numbers</span></p>
          </div>
          {FEATURES.map((f, k) => (
            <div key={f.tag} className={`hv-feat ${k % 2 ? "hv-feat--flip" : ""}`}>
              <FeatureVideo color={f.c} label={f.label} scenes={f.scenes} />
              <div className="hv-feat__txt">
                <span className="hv-tag" style={{ ["--c" as string]: f.c }}>{f.tag}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <ul>{f.points.map((p) => <li key={p}><Tick /><span>{p}</span></li>)}</ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI answers */}
      <section className="hv-band hv-band--grey">
        <div className="hv-wrap hv-split">
          <div>
            <p className="hv-kicker">Get recommended</p>
            <h2 className="hv-h2" style={{ marginTop: 10 }}>When they ask, be the answer.</h2>
            <p className="hv-lede">ChatGPT, Gemini, Claude and Perplexity name a few businesses, and the customer calls one of them. Every week I check what they say about you and fix what keeps you off the list.</p>
          </div>
          <AiAnswers />
        </div>
      </section>

      {/* Insights: the pain is guessing */}
      <section className="hv-band">
        <div className="hv-wrap hv-center">
          <p className="hv-kicker">No more guessing</p>
          <h2 className="hv-h2" style={{ marginTop: 10 }}>Stop paying for marketing<br />that doesn’t work.</h2>
          <p className="hv-lede">Most owners spend money on marketing and just hope. Every week I tell you, in plain English, what brought you customers, what’s quietly losing them, and what your competitors are doing. Then I fix it.</p>
          <div className="hv-ins">
            <div className="up"><h3>Bringing you customers</h3><ul>
              <li>“dentist near me” brought <span className="hv-num">41</span> clicks this month, up <span className="hv-num">11</span>.</li>
              <li>Your post on a child’s first visit got <span className="hv-num">64</span> views.</li>
            </ul></div>
            <div className="down"><h3>Losing you customers</h3><ul>
              <li>“emergency dentist” was seen <span className="hv-num">420</span> times, but you’re just off page one.</li>
              <li>Ask AI for a Saturday dentist and it names someone else.</li>
            </ul></div>
            <div><h3>What your competitors are doing</h3><ul>
              <li>The practice AI names most has a page for nervous patients. You don’t.</li>
              <li>They posted twice this week.</li>
            </ul></div>
          </div>
          <p style={{ marginTop: 18 }}><span className="hv-example">Example numbers</span></p>
        </div>
      </section>

      {/* Brand + voice: the pain is writing */}
      <section className="hv-band hv-band--grey">
        <div className="hv-wrap hv-center">
          <p className="hv-kicker">No more blank page</p>
          <h2 className="hv-h2" style={{ marginTop: 10 }}>Never write a post again.<br />Your customers will think you did.</h2>
          <p className="hv-lede">You didn’t start a business to write captions at 11pm. I learn how you talk from your website and the replies you send customers, then write every post in your voice, with your logo and colours. Try it.</p>
          <BrandStudio />
        </div>
      </section>

      {/* Autopilot: the dream is time */}
      <section className="hv-band">
        <div className="hv-wrap hv-center">
          <p className="hv-kicker">Your time back</p>
          <h2 className="hv-h2" style={{ marginTop: 10 }}>Close the laptop.<br />Your marketing keeps going.</h2>
          <p className="hv-lede">No more chasing an agency or approving every little thing. Your posts go out, your customers hear back and your ads keep improving while you’re with customers, or home for dinner. Check in whenever you like.</p>
          <Autopilot />
        </div>
      </section>

      {/* Pricing */}
      <section className="hv-band hv-band--grey" id="pricing">
        <div className="hv-wrap hv-center">
          <h2 className="hv-h2">Pick how much I take off your plate.</h2>
          <div className="hv-plans">
            <div className="hv-plan"><div className="hv-plan__badge" /><h3>Starter</h3><p className="hv-plan__for">Get found on Google and by AI.</p><div className="hv-plan__price">$99<small>/month</small></div>
              <ul><li>Get recommended by ChatGPT, Gemini, Claude and Perplexity</li><li>Your week of marketing in one tap</li><li>2 Google updates a week, in your voice</li><li>Review replies written for you</li><li>What’s working, every week</li></ul>
              <Link className="hv-pill hv-pill--ghost" href="/start">Get started</Link></div>
            <div className="hv-plan hv-plan--hi"><div className="hv-plan__badge">Recommended</div><h3>Pro</h3><p className="hv-plan__for">Your website and Google, on autopilot.</p><div className="hv-plan__price">$199<small>/month</small></div>
              <ul><li>Everything in Starter</li><li>4 Google updates a week</li><li>Posts can go live without you lifting a finger</li><li>20 customer questions checked with AI every week</li><li>Up to 3 locations</li></ul>
              <Link className="hv-pill hv-pill--blue" href="/signup?plan=pro">Get started</Link></div>
            <div className="hv-plan"><div className="hv-plan__badge">{GROWTH_ON_SALE ? "New" : "Early access"}</div><h3>Growth</h3><p className="hv-plan__for">Your whole marketing, handled.</p><div className="hv-plan__price">$499<small>/month</small></div>
              <ul><li>Everything in Pro</li><li>Social posts that look like your brand</li><li>Emails that bring customers back</li><li>Google and Meta ads, tuned every week</li><li>See which calls and forms your marketing brought in</li></ul>
              <a className="hv-pill hv-pill--ghost" href={growthHref}>{GROWTH_ON_SALE ? "Get started" : "Get early access"}</a></div>
          </div>
          <p className="hv-guar"><Shield />{GUARANTEE_LINE}</p>
          <p className="hv-fine">Ad spend is paid to Google and Meta directly. We never take a cut. <Link href="/pricing">Compare all plans ›</Link></p>
        </div>
      </section>
    </div>
  )
}

export function HomeV2Final() {
  return (
    <div className="hv">
      <section className="hv-final">
        <div className="hv-wrap">
          <h2>Run the business.<br /><span>I’ll run the marketing.</span></h2>
          <p className="hv-lede" style={{ margin: "18px auto 0" }}>Set up in minutes. Your first week of marketing can be ready today.</p>
          <Link className="hv-cta" href="/start">Get started</Link>
          <div className="hv-founder">
            <span aria-hidden="true">VS</span>
            <p>Built by <Link href={AUTHOR.path}>{AUTHOR.name}</Link>, who spent over a decade in performance marketing and founded Growth Turbine, a marketing agency in Ottawa. Questions? Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> and a person answers.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
