// Homepage v3 (approved mockup, 2026-11-18): framed column, coloured service pills, hero with
// drifting shapes, one colour chapter per service, a proof mosaic of TRUE facts,
// the real agent in the prompt box (straight under the hero) and a black final panel.
// Only what works today is sold: social posts are ready to publish in one tap (direct posting
// waits on Meta/LinkedIn approval). Plans (2026-11-26): Starter = AI search, Pro = everything
// except ads, Growth = Pro + ads (early access, waitlist until Google and Meta approve ads).
// Server-rendered so every word is crawlable; the interactive pieces are small client islands.
// Rules: sell the outcome, not the mechanics. No invented ratings, quotes or results: every
// example business, number and answer is labelled as an example.
import Link from "next/link"
import "./home-v2.css"
import { AiAnswers, Autopilot, BrandStudio, CostTable } from "./HomeV2Client"
import { StartAgent, type StartGreet } from "@/components/agent/StartAgent"
import { GUARANTEE_LINE } from "@/lib/offer-copy"
import { GROWTH_ON_SALE } from "@/lib/growth"
import { AUTHOR } from "@/lib/author"
import { HomePlans } from "./HomePlans"
import { WithWithout } from "./WithWithout"
import { Frame, Section, ServicePills, HeroShapes, ServiceChapter, FinalCta, Head, SVC_ORDER } from "@/components/marketing/v3"
import { FollowTheme } from "@/components/marketing/v3/FollowTheme"

const GREET: StartGreet = {
  lines: ["Hi. I’m Alphaa, your AI marketing agent."],
  ask: "What’s your website?",
  hint: "Nothing to install. No card. Just your website.",
  idleHint: "Type your website and I’ll start working on it right now.",
  agentLabel: "AI agent · online",
}

export function HomeV2() {
  const growthNote = GROWTH_ON_SALE ? "Growth plan" : "Growth plan · early access"
  return (
    <Frame top>
      {/* Hero */}
      <Section className="v3-hero" label="Introduction">
        <div>
          <ServicePills />
          <h1 className="v3-h1">Your <span className="hv-mark">entire</span> marketing, run by Alphaa.</h1>
          <p className="v3-lede">I create viral social content, improve rankings on ChatGPT and Gemini, build and execute your brand growth strategy, handle the tracking and technical setup, and run your entire ad campaigns like a $300K/year CMO. You do what you do best: running your business.</p>
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

      {/* With / Without */}
      <Section center id="with-alphaa" label="With Alphaa and without">
        <h2 className="v3-h2">Your week without Alphaa.<br /><span className="v3-blue">And with it.</span></h2>
        <p className="v3-lede">Same business, same customers. The difference is who does the marketing.</p>
        <WithWithout />
      </Section>

      {/* Pricing: Growth (anchor) → Pro (recommended) → Starter, monthly / annual (2026-11-26) */}
      <Section center id="pricing">
        <h2 className="v3-h2">Pick how much I take off your plate.</h2>
        <HomePlans />
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
        title={<>Running a business is hard.<br /><span>Alphaa can help!</span></>}
        sub="Set up in minutes. Your first week of marketing can be ready today. Month to month, cancel online in a minute."
      >
        <p>Built by <Link href={AUTHOR.path}>{AUTHOR.name}</Link>, who spent over a decade in performance marketing and founded Growth Turbine, a marketing agency in Ottawa. Questions? Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> and a person answers.</p>
      </FinalCta>
    </Frame>
  )
}
