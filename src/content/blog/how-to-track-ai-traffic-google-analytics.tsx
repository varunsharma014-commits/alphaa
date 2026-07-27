import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-track-ai-traffic-google-analytics",
  title: "How to Track Traffic from ChatGPT, Perplexity and Gemini in Google Analytics",
  description:
    "AI assistants send real referral traffic, but GA4 buries it inside Referral and Direct by default. Here is how to build a reliable AI channel in GA4, what the numbers do and do not tell you, and why the biggest share of AI influence never shows up as a visit at all.",
  date: "2026-07-27",
  readMins: 10,
  tag: "Measurement",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        By the alphaa team — we set up AI-traffic reporting for businesses every week, and we would rather you
        measure this honestly than see an inflated number.
      </p>
      <p>
        <strong>Short answer:</strong> AI assistants do send referral traffic, and you can isolate it in GA4 by
        filtering <em>Session source</em> for the assistant hostnames — <code>chatgpt.com</code>,{" "}
        <code>perplexity.ai</code>, <code>gemini.google.com</code>, <code>claude.ai</code>, and{" "}
        <code>copilot.microsoft.com</code> — ideally promoted into a custom channel group so it appears in your
        standard reports. Expect the number to undercount: a large share of AI-influenced visits arrive with no
        referrer and land in Direct, and the zero-click majority never becomes a visit at all.
      </p>

      <h2>Why AI traffic is hidden by default</h2>
      <p>
        GA4 assigns each session to a default channel group using the source, medium, and campaign values it
        detects. There is no built-in &quot;AI&quot; channel. When someone clicks a citation inside ChatGPT, the
        browser sends a referrer header of <code>chatgpt.com</code>, GA4 sees an unfamiliar domain with no paid or
        organic markers, and files it under <strong>Referral</strong> — mixed in with forum links, newsletters,
        and every other site that links to you.
      </p>
      <p>
        So the traffic is there; it is just not labelled. The job is to name it, and then to be clear-eyed about
        what the label does and does not capture.
      </p>

      <h2>The fastest way to see it: a filtered report</h2>
      <p>Two minutes, no configuration, useful immediately.</p>
      <ol>
        <li>In GA4, open <strong>Reports → Acquisition → Traffic acquisition</strong>.</li>
        <li>
          Change the primary dimension from <em>Session default channel group</em> to{" "}
          <strong>Session source</strong>.
        </li>
        <li>
          Use the search box above the table to type an assistant hostname — <code>chatgpt</code>,{" "}
          <code>perplexity</code>, <code>gemini</code>, <code>claude</code>, <code>copilot</code> — one at a time.
        </li>
        <li>Set the date range to the last 90 days so you can see a trend rather than a single week of noise.</li>
      </ol>
      <p>
        What you will typically see on a site that has never done any AEO work: a small but non-zero number, and a
        line that slopes upward. That baseline is the useful part. The absolute figure matters far less than
        whether it grows after you change something.
      </p>

      <h2>The durable setup: a custom AI channel group</h2>
      <p>
        A filtered report is something you have to remember to run. A channel group makes AI traffic a permanent
        row in your standard reports. This is what we set up for clients who want to watch it monthly.
      </p>
      <ol>
        <li>
          Go to <strong>Admin → Data display → Channel groups</strong> and click{" "}
          <strong>Create new channel group</strong>. Do not edit the default group — copy it, so you always retain
          the original for comparison.
        </li>
        <li>Name it something like <em>Channels + AI</em>.</li>
        <li>
          Add a new channel called <strong>AI Assistants</strong> and{" "}
          <strong>drag it above Referral and Organic Search</strong>. Channel rules are evaluated top to bottom
          and the first match wins — if AI Assistants sits below Referral, every AI session is claimed by Referral
          first and your new channel stays empty. This ordering step is the one people miss.
        </li>
        <li>
          Set the condition to <em>Source</em> <strong>matches regex</strong>, with a pattern covering the
          assistant hostnames:
        </li>
      </ol>
      <pre><code>{`chatgpt\\.com|chat\\.openai\\.com|openai\\.com|perplexity\\.ai|gemini\\.google\\.com|bard\\.google\\.com|claude\\.ai|copilot\\.microsoft\\.com|edgeservices\\.bing\\.com`}</code></pre>
      <p>
        Save it, then switch any report to the new channel group using the dropdown at the top of the table. Two
        caveats that matter: channel groups apply going forward and to historical data in most standard reports,
        but the assistant hostname list changes as products get renamed, so revisit the regex a couple of times a
        year. And a source string only appears if the referrer survived the click.
      </p>

      <h2>Why your number is lower than reality</h2>
      <p>
        This is the section most guides leave out, and it is the one that keeps you from drawing wrong
        conclusions.
      </p>
      <ul>
        <li>
          <strong>Missing referrers land in Direct.</strong> Clicks from a native mobile app, a desktop client, or
          a link opened with a stripped referrer arrive with no source at all. GA4 files them as Direct. A quiet
          rise in Direct traffic alongside a rise in AI referrals is usually the same phenomenon.
        </li>
        <li>
          <strong>The biggest effect is invisible by design.</strong> Roughly two-thirds of Google searches now
          end without a single click to a website (SparkToro/Similarweb, 2026). If an assistant reads your page,
          recommends you by name, and the customer calls your phone number, that is a win that produces zero
          analytics sessions. See <Link href="/blog/zero-click-search">zero-click search</Link> for the full
          picture.
        </li>
        <li>
          <strong>Bot traffic is not user traffic.</strong> Visits from <code>ChatGPT-User</code> or{" "}
          <code>PerplexityBot</code> are crawlers fetching your page, and GA4&apos;s JavaScript generally does not
          record them. Those show up in your server logs instead — which is a genuinely useful, separate signal.
        </li>
      </ul>
      <p>
        The right mental model: GA4 measures the visible tip. Treat it as a directional trend line, not a
        headcount of everyone the AI sent your way.
      </p>

      <h2>What to do with the number once you have it</h2>
      <p>
        A baseline is only useful if you compare something to it. The workflow that produces a real answer:
      </p>
      <ol>
        <li>
          <strong>Record the 90-day baseline</strong> before you change anything — AI sessions, and the Direct
          number sitting next to it.
        </li>
        <li>
          <strong>Add the landing-page dimension.</strong> In an Exploration, cross AI sessions against{" "}
          <em>Landing page</em>. This tells you which specific pages assistants are citing, which is the single
          most actionable thing in this whole report — those pages are the format your answer-shaped content
          should copy.
        </li>
        <li>
          <strong>Compare engagement, not just volume.</strong> AI-referred visitors have usually already had
          their question partly answered, so they arrive further down the funnel. Check engagement rate and
          conversions for the AI channel against Organic Search. Adobe Analytics found that traffic to retail
          sites from AI assistants grew over 1,200% in under a year, and that those visitors convert better than
          traditional search traffic (Adobe Analytics, 2025–26).
        </li>
        <li>
          <strong>Re-check 60 to 90 days after a change.</strong> AEO signals take time to propagate — see{" "}
          <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link> for what moves on what timescale.
        </li>
      </ol>

      <h2>Frequently asked questions</h2>

      <h3>Can I see which question someone asked the AI before clicking?</h3>
      <p>
        No. Unlike Search Console, assistants do not pass the prompt to your site. You get the referring hostname
        and the landing page, and that is all. Anyone showing you &quot;AI keyword data&quot; is inferring it, not
        measuring it — the closest honest proxy is asking the engines directly what they say about you and
        recording the answers.
      </p>

      <h3>Does Google Search Console show AI Overviews clicks separately?</h3>
      <p>
        Not as a separate breakdown. AI Overviews are part of Search, so clicks that originate from an Overview
        are folded into your ordinary Search performance data with no dedicated filter. A pattern worth watching
        is impressions holding steady while clicks fall — a common fingerprint of answers being satisfied on the
        results page.
      </p>

      <h3>Is a UTM parameter approach worth it?</h3>
      <p>
        Not for AI citations. You cannot add UTMs to a link an assistant generates from your page — it uses your
        canonical URL. UTMs remain useful for your own campaigns; they are the wrong tool here.
      </p>

      <h2>The bottom line</h2>
      <p>
        Build the AI channel in GA4 so you stop flying blind, place it above Referral so it actually collects
        sessions, and read it as a trend rather than a total. Then pair it with the half you cannot see in
        analytics: what the engines actually say about your business when someone asks. The visit count tells you
        that AI sent someone; only the answer itself tells you whether you were recommended, mentioned in passing,
        or left out.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
      <p>
        <em>Last updated July 27, 2026.</em>
      </p>
    </div>
  )
}
