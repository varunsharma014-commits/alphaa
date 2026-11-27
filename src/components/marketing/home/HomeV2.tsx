// Homepage v3 (approved mockup, 2026-11-18): framed column, coloured service pills, hero with
// drifting shapes, one colour chapter per service, a proof mosaic of TRUE facts,
// the real agent in the prompt box (straight under the hero) and a black final panel.
// Only what works today is sold: social posts are ready to publish in one tap (direct posting
// waits on Meta/LinkedIn approval) and ads are "Coming soon", in no current plan (2026-11-26).
// Server-rendered so every word is crawlable; the interactive pieces are small client islands.
// Rules: sell the outcome, not the mechanics. No invented ratings, quotes or results: every
// example business, number and answer is labelled as an example.
import Link from "next/link"
import "./home-v2.css"
import { AiAnswers, Autopilot, BrandStudio, CostTable } from "./HomeV2Client"
import { StartAgent, type StartGreet } from "@/components/agent/StartAgent"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { GROWTH_EARLY_ACCESS_HREF, GROWTH_ON_SALE } from "@/lib/growth"
import { AUTHOR } from "@/lib/author"
import { plans } from "@/app/(marketing)/pricing/pricing-data"
import { Frame, Section, ServicePills, HeroShapes, ServiceChapter, FinalCta, Head, SVC_ORDER } from "@/components/marketing/v3"
import { FollowTheme } from "@/components/marketing/v3/FollowTheme"

const GREET: StartGreet = {
  lines: ["Hi. I’m Alphaa, your AI marketing agent."],
  ask: "What’s your website?",
  hint: "Nothing to install. No card. Just your website.",
  idleHint: "Type your website and I’ll start working on it right now.",
  agentLabel: "AI agent · online",
}

const price = (name: string) => plans.find((p) => p.name === name)?.monthly

export function HomeV2() {
  const growthHref = GROWTH_ON_SALE ? "/signup?plan=growth_monthly" : GROWTH_EARLY_ACCESS_HREF
  const growthNote = GROWTH_ON_SALE ? "Growth plan" : "Growth plan · early access"
  return (
    <Frame top>
      {/* Hero */}
      <Section className="v3-hero" label="Introduction">
        <div>
          <ServicePills />
          <h1 className="v3-h1">Hire the AI agent <span className="v3-blue">that runs your marketing for you.</span></h1>
          <p className="v3-lede">More customers find you on Google and in AI answers, and you get your evenings back. I write your social posts, keep your Google profile fresh and fix what keeps AI from naming you. You just tap “Approve.”</p>
          <div className="v3-btns">
            <Link className="v3-btn" href="/start">Hire your agent →</Link>
            <a className="v3-btn v3-btn--ghost" href="#features">See what I do</a>
          </div>
          <p className="v3-fine">{GUARANTEE_LINE} Month to month. Cancel online in a minute.</p>
        </div>
        <HeroShapes cards={["3 posts ready for this week", "Replied to Sarah’s review", "ChatGPT named you"]} tones={["mk", "ad", "se", "ct"]} />
      </Section>

      {/* The real agent (same conversation as /start), straight under the hero: the website typed
          here goes to /start?site=…, where the agent starts working on it straight away. */}
      <Section center id="start">
        <h2 className="v3-h2">What should I do for you this week?</h2>
        <p className="v3-lede">Drop your website below and I’ll build your first week of marketing.</p>
        <div className="v3-prompt"><FollowTheme><StartAgent embedded handoff="/start" greet={GREET} /></FollowTheme></div>
      </Section>

      {/* One chapter per service */}
      <Section id="features" label="What your agent does">
        <div className="v3-center" style={{ marginBottom: 32 }}>
          <Head kicker="What your agent does" title="One agent. All your marketing." />
        </div>
        <div className="v3-chapters">
          {SVC_ORDER.map((slug) => (
            <ServiceChapter
              home
              key={slug}
              slug={slug}
              growthNote={growthNote}
              visual={slug === "ai-search-optimization" ? <div className="v3-visual v3-visual--fit"><AiAnswers /></div> : undefined}
            />
          ))}
        </div>
      </Section>

      {/* Agency vs Alphaa */}
      <Section center>
        <h2 className="v3-h2">Fire your expensive<br /><span className="v3-blue">marketing agency.</span></h2>
        <p className="v3-lede">Paying an agency for each piece adds up fast, and you still end up chasing them for updates. One AI agent does the work every week, for a fraction of the price.</p>
        <CostTable />
      </Section>

      {/* Insights: the pain is guessing */}
      <Section center>
        <Head kicker="No more guessing" title={<>Marketing shouldn’t be your<br />second full-time job.</>} lede="Most owners spend money on marketing and just hope. Every week I tell you, in plain English, what brought you customers, what’s quietly losing them, and what your competitors are doing. Then I fix it." />
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
        <p style={{ marginTop: 18 }}><span className="v3-example">Illustrative example: a sample dental practice, not real customer data</span></p>
      </Section>

      {/* Brand + voice: the pain is writing */}
      <Section center tone="mk">
        <Head kicker="No more blank page" title={<>Never write a post again.<br /><span className="v3-em">Your customers will think you did.</span></>} lede="You didn’t start a business to write captions at 11pm. I learn how you talk from your website and the replies you send customers, then write every post in your voice, with your logo and colours. Try it." />
        <BrandStudio />
      </Section>

      {/* Autopilot: the dream is time */}
      <Section center tone="se">
        <Head kicker="Your time back" title={<>Close your laptop.<br /><span className="v3-em">I have the marketing handled.</span></>} lede="No more chasing an agency or approving every little thing. Your Google updates and blog posts go out, your happy customers hear back, and your social posts are ready for one tap, while you’re with customers, or home for dinner. Check in whenever you like." />
        <Autopilot />
      </Section>

      {/* Pricing */}
      <Section center id="pricing">
        <h2 className="v3-h2">Pick how much I take off your plate.</h2>
        <div className="hv-plans">
          <div className="hv-plan"><div className="hv-plan__badge" /><h3>Starter</h3><p className="hv-plan__for">Get found on Google and by AI.</p><div className="hv-plan__price">$99<small>/month</small></div>
            <ul><li>Get recommended by ChatGPT, Gemini, Claude and Perplexity</li><li>Your week of marketing in one tap</li><li>2 Google updates a week, in your voice</li><li>Review replies written for you</li><li>What’s working, every week</li></ul>
            <Link className="hv-pill hv-pill--ghost" href="/start">Get started</Link></div>
          <div className="hv-plan hv-plan--hi"><div className="hv-plan__badge">Recommended</div><h3>Pro</h3><p className="hv-plan__for">Your social media too, ready in one tap.</p><div className="hv-plan__price">${price("Pro")}<small>/month</small></div>
            <ul><li>Everything in Starter</li><li>3 branded social posts a week, ready to publish in one tap</li><li>4 Google updates a week</li><li>Google updates and blog posts can go live on their own</li><li>20 customer questions checked with AI every week</li><li>Up to 3 locations</li></ul>
            <Link className="hv-pill hv-pill--blue" href="/signup?plan=pro">Get started</Link></div>
          <div className="hv-plan"><div className="hv-plan__badge">{GROWTH_ON_SALE ? "New" : "Early access"}</div><h3>Growth</h3><p className="hv-plan__for">Bring past customers back.</p><div className="hv-plan__price">${price("Growth")}<small>/month</small></div>
            <ul><li>Everything in Pro</li><li>Emails that bring customers back</li><li>See which calls and forms your marketing brought in</li></ul>
            <a className="hv-pill hv-pill--ghost" href={growthHref}>{GROWTH_ON_SALE ? "Get started" : "Get early access"}</a></div>
        </div>
        <p className="hv-soon"><b>Ads · Coming soon</b> Google and Meta ads, built and tuned every week, on a new plan above Growth. Not part of any plan yet.</p>
        <p className="hv-guar">{GUARANTEE_LINE}</p>
        <p className="v3-fine"><Link className="v3-link" href="/pricing">Compare all plans ›</Link></p>
      </Section>
    </Frame>
  )
}

export function HomeV2Final() {
  return (
    <Frame>
      <FinalCta
        title={<>Run the business.<br /><span>I’ll run the marketing.</span></>}
        sub="Set up in minutes. Your first week of marketing can be ready today. Month to month, cancel online in a minute."
      >
        <p>Built by <Link href={AUTHOR.path}>{AUTHOR.name}</Link>, who spent over a decade in performance marketing and founded Growth Turbine, a marketing agency in Ottawa. Questions? Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> and a person answers.</p>
      </FinalCta>
    </Frame>
  )
}
