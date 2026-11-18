// Homepage v2 (Varun, 2026-11-17): "Run your entire marketing using an AI agent".
// Server-rendered so every word is crawlable; the interactive pieces live in HomeV2Client.
// Rules: sell the outcome, not the mechanics. No invented ratings, quotes or results:
// every example business, number and answer is labelled as an example.
import Link from "next/link"
import "./home-v2.css"
import { AiAnswers, Autopilot, BrandStudio, CostTable, FeatureVideo } from "./HomeV2Client"
import { StartAgent, type StartGreet } from "@/components/agent/StartAgent"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { GROWTH_EARLY_ACCESS_HREF, GROWTH_ON_SALE } from "@/lib/growth"
import { AUTHOR } from "@/lib/author"
import { SERVICE_BY_SLUG, type ServiceSlug } from "@/content/services"

const Tick = () => (
  <span className="hv-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
)
const Shield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.6-3 8.4-7 9.9C8 19.4 5 15.6 5 11V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>
)

const PILLS: [string, string, string][] = [
  ["Social Media Management", "#ffd6e0", "/services/social-media-management"], ["Ads Management", "#d6ecff", "/services/ads-management"],
  ["SEO & AEO", "#dcf7e3", "/services/ai-search-optimization"], ["Content Writing", "#fff0c2", "/services/content-writing"],
  ["Email Marketing", "#eadcff", "/services/email-marketing"], ["Website Fixes", "#ffe3cc", "/services/ai-search-optimization"],
  ["Analytics & Tracking", "#d4f4f2", "/services/ads-management"],
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

// Feature rows come from the service pages' content, in this order.
const FEATURE_ORDER: ServiceSlug[] = ["social-media-management", "ads-management", "content-writing", "ai-search-optimization", "email-marketing"]

const WHY = [
  { t: "Every week, not once a month", p: "Your marketing never takes a week off, even when you do.", d: "M4 6h16M4 12h16M4 18h10" },
  { t: "Answers in seconds", p: "Ask anything by typing or out loud. No waiting for a call back.", d: "M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4zM5 11a7 7 0 0 0 14 0M12 18v3" },
  { t: "See everything it does", p: "Every post, ad and fix, the moment it happens.", d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { t: "No contracts, no lock-in", p: "Month to month. Cancel online in a minute.", d: "M7 11V8a5 5 0 0 1 9.6-2M5 11h14v10H5z" },
]

const GREET: StartGreet = {
  lines: ["Hi. I’m Alphaa, your AI marketing agent.", "Give me your website and I’ll get to work on your marketing right now."],
  ask: "What’s your website?",
  hint: "Nothing to install. No card. Just your website.",
  idleHint: "Type your website and I’ll start working on it right now.",
  agentLabel: "AI agent · online",
}

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
            {PILLS.map(([s, c, href]) => <li key={s} style={{ ["--c" as string]: c }}><Link href={href}><Tick />{s}</Link></li>)}
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
          {/* The real agent (same conversation as /start): the website typed here goes to
              /start?site=…, where the agent starts working on it straight away. */}
          <div className="hv-demo" id="demo"><StartAgent embedded handoff="/start" greet={GREET} /></div>
        </div>
      </section>

      {/* What the agent does */}
      <section className="hv-band hv-band--grey" id="features">
        <div className="hv-wrap">
          <div className="hv-center">
            <p className="hv-kicker">What your agent does</p>
            <h2 className="hv-h2" style={{ marginTop: 10 }}>One agent. Your whole marketing.</h2>
            <p style={{ marginTop: 14 }}><span className="hv-example">Example screens and numbers</span></p>
          </div>
          {FEATURE_ORDER.map((slug, k) => {
            const sv = SERVICE_BY_SLUG[slug]
            const f = sv.feature
            return (
              <div key={slug} className={`hv-feat ${k % 2 ? "hv-feat--flip" : ""}`}>
                <FeatureVideo color={sv.color} label={f.label} scenes={f.scenes} />
                <div className="hv-feat__txt">
                  <span className="hv-tag" style={{ ["--c" as string]: sv.color }}>{sv.kicker}</span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  <ul>{f.points.map((p) => <li key={p}><Tick /><span>{p}</span></li>)}</ul>
                  <Link className="hv-more" href={`/services/${slug}`}>Learn more about {sv.name.toLowerCase().replace("seo & aeo", "SEO & AEO")} ›</Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Agency vs Alphaa */}
      <section className="hv-band">
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
