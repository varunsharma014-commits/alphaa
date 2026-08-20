import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-much-does-aeo-cost",
  title: "How Much Does AEO Cost? An Honest 2026 Price Breakdown",
  description:
    "AEO in 2026 costs roughly $0 to $500 if you do it yourself, $30 to $300 a month for monitoring tools, and $1,500 to $10,000 a month for an agency retainer. Here is what each tier actually buys, what the hidden costs are, and how to tell whether you need to spend anything at all.",
  date: "2026-08-20",
  readMins: 10,
  tag: "Comparison",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and see what owners
          are quoted before they come to us. Last updated 20 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> answer engine optimization costs <strong>$0 to about $500 in one-off
        effort if you do it yourself</strong>, <strong>$30 to $300 a month for a monitoring or automation
        tool</strong>, and <strong>$1,500 to $10,000 a month for an agency retainer</strong>. Most small
        businesses do not need the top tier. The work that moves AI recommendations the most — consistent
        business facts, structured data, reviews, and a few genuinely useful pages — is cheap in dollars and
        expensive in attention.
      </p>

      <h2>What are you actually paying for in AEO?</h2>
      <p>
        AEO is the practice of shaping the public signals an AI assistant reads before it answers a question
        like &quot;who is the best plumber in Tulsa.&quot; There is no ad auction to buy into and no ranking
        to purchase. So every dollar you spend goes into one of four buckets:
      </p>
      <ol>
        <li>
          <strong>Diagnosis</strong> — finding out what ChatGPT, Claude, Gemini and Perplexity currently say
          about you, and where the wrong or missing facts come from.
        </li>
        <li>
          <strong>Fixes on your own property</strong> — schema markup, an{" "}
          <Link href="/blog/llms-txt-guide">llms.txt file</Link>, server-rendered content, pages that answer
          real questions.
        </li>
        <li>
          <strong>Off-property signals</strong> — Google Business Profile, directory listings, reviews,
          third-party mentions. This is where most of the leverage is and where you have the least direct
          control.
        </li>
        <li>
          <strong>Monitoring</strong> — re-checking on a schedule, because{" "}
          <Link href="/blog/why-ai-answers-change-every-time">AI answers change between runs</Link> and a fix
          that landed in March can quietly stop showing in June.
        </li>
      </ol>
      <p>
        Anyone quoting you a price is pricing some mix of those four. Ask which ones, in those words, and the
        quote usually becomes easy to evaluate.
      </p>

      <h2>Tier 1: Doing it yourself — $0 to $500 one-off</h2>
      <p>
        The DIY route is genuinely viable for a single-location business, and it is the tier we recommend
        most owners start at. The realistic bill:
      </p>
      <ul>
        <li>
          <strong>Claiming and completing Google Business Profile, Apple Business Connect, Bing Places:</strong>{" "}
          $0. Two to three hours.
        </li>
        <li>
          <strong>Fixing name, address, phone and hours everywhere they appear:</strong> $0, or $50 to $100 a
          year if you use a listings-sync service to cover the long tail of directories.
        </li>
        <li>
          <strong>Adding LocalBusiness or Organization schema:</strong> $0 on Squarespace, Wix, Shopify or
          WordPress with a plugin. A developer will charge $150 to $400 for a custom site.
        </li>
        <li>
          <strong>Publishing an llms.txt file:</strong> $0 and about twenty minutes.
        </li>
        <li>
          <strong>Writing three or four pages that answer the questions you actually get asked:</strong> $0 if
          you write them, $100 to $200 each from a freelancer.
        </li>
        <li>
          <strong>Asking recent customers for reviews:</strong> $0, and the single highest-return hour in the
          list.
        </li>
      </ul>
      <p>
        The honest cost here is not money, it is that <strong>most owners never finish</strong>. The DIY tier
        is free and is abandoned about two-thirds of the way through, usually at the directory-cleanup step,
        which is tedious and invisible. If you know that about yourself, budget for a tool or a person
        instead of pretending otherwise.
      </p>

      <h2>Tier 2: Tools and monitoring — $30 to $300 a month</h2>
      <p>
        This tier buys you two things: knowing what the engines say without checking by hand, and having the
        repetitive fixes done on a schedule. Typical 2026 pricing across the category:
      </p>
      <ul>
        <li>
          <strong>$0 to $30/month</strong> — free scans and light rank-tracking add-ons bolted onto existing
          SEO tools. Fine for a snapshot, thin for tracking.
        </li>
        <li>
          <strong>$50 to $150/month</strong> — dedicated AI-visibility monitoring: a set of prompts run
          across several engines on a schedule, share-of-voice against named competitors, citation sources.
        </li>
        <li>
          <strong>$150 to $300/month</strong> — monitoring plus execution: schema generation, content
          publishing, listings hygiene, alerts when an engine starts getting a fact wrong.
        </li>
      </ul>
      <p>
        A caution on comparing these: <strong>prompt volume is the hidden unit of price</strong>. A $49 plan
        checking 10 prompts monthly on one engine and a $99 plan checking 50 prompts weekly across four
        engines are not the same product, and the sticker price will not tell you which you are looking at.
        Ask how many prompts, how often, and across which engines before comparing anything. We go through
        the trade-offs by vendor in{" "}
        <Link href="/blog/best-aeo-tools-2026">our honest comparison of AEO tools</Link>.
      </p>

      <h2>Tier 3: Agencies and consultants — $1,500 to $10,000 a month</h2>
      <p>
        Agency AEO retainers in 2026 mostly sit between $1,500 and $5,000 a month for small and mid-sized
        businesses, with $5,000 to $10,000-plus for multi-location brands, regulated industries, and
        enterprise. Project-based audits typically run $2,000 to $7,500 one-off. Freelance consultants
        commonly charge $100 to $250 an hour.
      </p>
      <p>What that budget is genuinely good at:</p>
      <ul>
        <li>Multi-location entity work, where the location-count multiplies every task — see{" "}
          <Link href="/blog/multi-location-business-ai-visibility">the multi-location guide</Link>.
        </li>
        <li>Regulated categories where wording carries legal risk (medical, legal, financial).</li>
        <li>Digital PR and earned mentions, which take relationships and time, not software.</li>
        <li>Untangling a genuine mess: migrations, rebrands, duplicate listings, a wrong-facts problem that
          has spread across dozens of sources.</li>
      </ul>
      <p>
        What it is often bad at: charging a retainer for work that is either one-off or automatable. If the
        proposal is &quot;monthly schema review and two blog posts,&quot; you are paying agency rates for a
        tool-tier job. The self-audit in{" "}
        <Link href="/blog/is-your-seo-agency-worth-it">is your SEO agency worth it</Link> applies almost
        unchanged to AEO retainers.
      </p>

      <h2>The costs nobody puts in the quote</h2>
      <ul>
        <li>
          <strong>Your own time.</strong> Every tier needs facts only you have: service areas, hours,
          pricing, what you actually do. Budget two to four hours in month one regardless of what you buy.
        </li>
        <li>
          <strong>Developer time.</strong> If your site is a JavaScript app that renders content client-side,
          some AI crawlers will see an empty page — a real fix, not a settings toggle. See{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">why AI can&apos;t read your JavaScript site</Link>.
        </li>
        <li>
          <strong>Review generation.</strong> The mechanism that most reliably moves recommendations is
          getting more, and more recent, genuine reviews. That is an operational habit, and it costs staff
          attention every week.
        </li>
        <li>
          <strong>Waiting.</strong> Nothing you buy compresses the indexing and re-crawl cycle below a few
          weeks. Our honest timeline is in{" "}
          <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
        </li>
      </ul>

      <h2>How to decide what to spend: a five-minute test</h2>
      <ol>
        <li>
          Ask ChatGPT, Gemini and Perplexity the question a customer would ask — &quot;best [your service] in
          [your city]&quot; — and write down whether you appear.
        </li>
        <li>
          Ask each one &quot;tell me about [your business name]&quot; and note every fact that is wrong,
          missing or stale.
        </li>
        <li>
          If you appear and the facts are right: spend <strong>Tier 1 plus monitoring</strong>. You are
          defending a position, not building one.
        </li>
        <li>
          If you are absent but the facts are right: spend on <strong>Tier 1 fixes and off-property
          signals</strong> — reviews, listings, third-party mentions. This is usually a visibility problem,
          not a website problem.
        </li>
        <li>
          If the facts are wrong or the engines confuse you with another business: fix that first, before
          anything else. Start with{" "}
          <Link href="/blog/fix-wrong-ai-information-about-your-business">fixing wrong AI information</Link>.
          Spending on content while your identity is scrambled is money into a leak.
        </li>
      </ol>

      <h2>Common questions</h2>
      <h3>Is AEO cheaper than SEO?</h3>
      <p>
        In upfront cash, usually yes — much of the work is one-off hygiene rather than a permanent content
        arms race. In ongoing effort, it is comparable, because the signals decay and need re-checking. The
        two also overlap heavily: server-rendered, crawlable, accurate pages serve both.
      </p>
      <h3>Do I need to pay for every AI engine separately?</h3>
      <p>
        No. There is nothing to buy from ChatGPT, Claude, Gemini or Perplexity to influence organic
        recommendations. Paid placements inside AI products exist and are separate from — and do not buy —
        organic recommendation; see{" "}
        <Link href="/blog/do-paid-ads-affect-ai-recommendations">does paid advertising affect AI
        recommendations</Link>.
      </p>
      <h3>Can anyone guarantee I will be recommended?</h3>
      <p>
        No, and a guarantee is the clearest signal to walk away. Engines re-generate answers per query,
        weight sources they control, and change models without notice. What you can buy is a better set of
        inputs and the ability to see what is happening. Anyone selling certainty is selling something else.
      </p>
      <h3>What is the minimum sensible budget?</h3>
      <p>
        Zero dollars and about six focused hours, spread over two weeks, covers the highest-leverage work for
        a single-location business. Add a monitoring tool once the fixes are in, so you find out when
        something breaks rather than when the phone stops ringing.
      </p>

      <h2>The bottom line</h2>
      <p>
        AEO pricing looks confusing because the category is young and the deliverables are invisible. Strip it
        back and there are only four things to buy: diagnosis, on-site fixes, off-site signals, and
        monitoring. Do the free work first, buy monitoring second, and only hire an agency when the problem is
        genuinely one of scale, regulation or relationships — not when it is one of tedium. The businesses
        that get recommended most are rarely the ones spending most; they are the ones whose facts are
        consistent everywhere an engine looks.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
