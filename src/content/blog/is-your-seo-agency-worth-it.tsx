import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "is-your-seo-agency-worth-it",
  title: "Is Your SEO Agency Worth It? A 10-Minute Audit You Can Run Yourself",
  description:
    "A practical 10-minute audit to judge whether your SEO agency is earning its retainer — six checks you can run without any tools, what a good answer looks like, and the questions that separate real work from busywork.",
  date: "2026-07-21",
  readMins: 9,
  tag: "Guide",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>By the alphaa team — we run AI-visibility scans for local businesses, which means we spend a lot of
        time looking at sites that have been under agency management for years. This audit is the sequence we
        actually use when an owner asks us whether they are getting their money&apos;s worth.</em>
      </p>

      <p>
        <strong>Short answer:</strong> Your SEO agency is worth it if it can show you work that changed something
        on your site or your public profiles, tied to a number that moved, in language you understand. It is
        probably not worth it if the monthly report is a traffic chart with no decisions attached, if nobody can
        name what shipped last month, or if the answer to &quot;what did we change?&quot; is a list of activities
        rather than a list of outcomes. Below is a six-check audit that takes about ten minutes and requires no
        tools you don&apos;t already have.
      </p>

      <h2>Before you start: what you are actually judging</h2>
      <p>
        You are not judging whether your agency works hard. You are judging whether the work is
        <strong> compounding</strong> — whether each month leaves behind an asset (a page, a fixed technical
        issue, a review, a citation, a schema block) that keeps paying after the invoice clears. Retainer SEO
        goes wrong in a specific, recognizable way: the activity stays constant, the assets stop accumulating,
        and the reporting shifts from what changed to what was done.
      </p>
      <p>
        One caveat worth stating up front, because it cuts both ways: SEO is genuinely slow, and a flat month is
        not evidence of failure. Six flat months with no shipped assets is a different story. Judge the trend and
        the artifacts, not a single report.
      </p>

      <h2>Check 1: Can you name what shipped last month? (2 minutes)</h2>
      <p>
        Open the last three monthly reports side by side. Write down, for each month, the specific things that
        now exist that did not exist before — a new service page, a fixed redirect chain, twelve review
        responses, a schema block, a Google Business Profile update.
      </p>
      <p>
        <strong>Good answer:</strong> you can list three to six concrete artifacts per month, and you could click
        to see most of them. <strong>Bad answer:</strong> the reports describe effort — &quot;ongoing keyword
        research,&quot; &quot;continued optimization,&quot; &quot;monitored rankings&quot; — with nothing you can
        point at. &quot;Optimization&quot; that produces no artifact is the single most common form of retainer
        busywork.
      </p>

      <h2>Check 2: View source on your own homepage (2 minutes)</h2>
      <p>
        This is the fastest technical tell in existence. Open your homepage, right-click, choose
        &quot;View Page Source,&quot; and press Ctrl-F (Cmd-F on Mac). Search for these three strings:
      </p>
      <ul>
        <li>
          <strong>application/ld+json</strong> — this is structured data (schema markup): a machine-readable
          block that tells search and AI engines what your business is, where it is, and what it offers. A local
          business site under active management should have it. Zero hits after a year of retainers is a real
          finding.
        </li>
        <li>
          <strong>&lt;title&gt;</strong> — read what comes after it. It should describe what you do and where,
          in words a customer would use. If it says &quot;Home&quot; or &quot;Welcome to Our Website,&quot; that
          is a two-minute fix nobody made.
        </li>
        <li>
          <strong>name=&quot;description&quot;</strong> — same test. Missing or generic is a finding.
        </li>
      </ul>
      <p>
        Then check <strong>yourdomain.com/robots.txt</strong> in your browser. If you see
        <strong> Disallow: /</strong> on a line by itself, your site is asking crawlers not to index it at all.
        That is rare, but we have found it on live sites under paid management, and it is catastrophic and
        invisible from a traffic chart alone.
      </p>

      <h2>Check 3: Ask an AI engine who you are (2 minutes)</h2>
      <p>
        This is the check almost no agency report covers yet, and it is increasingly the one that predicts
        customers. Open ChatGPT, Gemini, or Perplexity and ask the question a customer would ask — not your
        business name, but the need: &quot;who is the best [your service] in [your city]?&quot; Then ask a
        direct one: &quot;tell me about [your business name] in [your city].&quot;
      </p>
      <p>
        Three outcomes, each meaning something different:
      </p>
      <ul>
        <li>
          <strong>You are named, accurately.</strong> Good. Note which sources it cites — that tells you where
          your evidence is actually coming from.
        </li>
        <li>
          <strong>You are absent, competitors are named.</strong> Your public evidence is thinner or less
          consistent than theirs. This is workable and is the core of{" "}
          <Link href="/blog/what-is-answer-engine-optimization">answer engine optimization</Link>.
        </li>
        <li>
          <strong>You are named, with wrong details.</strong> Old address, closed hours, services you dropped.
          This is the most urgent version, because the engine is confidently telling customers something false
          about you.
        </li>
      </ul>
      <p>
        Why this belongs in an agency audit: roughly two-thirds of Google searches now end without a single
        click to a website (SparkToro/Similarweb, 2026), and 65% of consumers now use AI tools to research
        products before buying (Clutch, 2026). An agency reporting only on rankings and sessions is reporting on
        a shrinking share of how customers actually find you. That is not necessarily incompetence — it is a
        scope that has not been updated.
      </p>

      <h2>Check 4: Read the report for decisions, not numbers (2 minutes)</h2>
      <p>
        Take the most recent report and count two things: how many charts it contains, and how many
        <em> decisions</em> it recommends. A decision looks like &quot;we are cutting the three pages that get no
        impressions and consolidating them into one, because X.&quot; A chart is not a decision.
      </p>
      <p>
        <strong>Good answer:</strong> the report tells a short story — here is what we tried, here is what it
        did, here is what we are doing next and why. <strong>Bad answer:</strong> a dashboard export with a
        paragraph of summary that would be equally true for any client. If you could swap in another business
        name and the report would still read correctly, it was not written about you.
      </p>

      <h2>Check 5: Check the traffic you actually care about (1 minute)</h2>
      <p>
        Ignore total sessions. Total traffic is the easiest number to make go up and the least connected to
        revenue. Ask instead: are calls, form fills, or bookings up? If your agency cannot connect its work to
        any of those, it is optimizing a proxy.
      </p>
      <p>
        Be fair here, though — attribution is genuinely hard, especially for local businesses where the customer
        journey ends in a phone call. The failure is not imperfect attribution. The failure is not attempting it,
        and defaulting to sessions because sessions are easy to chart.
      </p>

      <h2>Check 6: The rankings-flat-traffic-down test (1 minute)</h2>
      <p>
        If your rankings are stable but traffic is falling, and your agency has no explanation, they are missing
        the most important structural change in search. That pattern usually is not a penalty and usually is not
        their fault — it is what happens when an answer appears above your link. AI Overviews now appear in up to
        ~48% of commercial-intent searches (BrightEdge, 2026), which is precisely where buying decisions happen.
      </p>
      <p>
        What you are testing is whether your agency can explain it. An agency that says &quot;rankings held, so
        we&apos;re fine&quot; is reading a metric that has quietly stopped predicting customers. We unpack that
        exact pattern in <Link href="/blog/zero-click-search">Zero-Click Search</Link>.
      </p>

      <h2>Scoring it honestly</h2>
      <p>
        Count how many checks came back clean:
      </p>
      <ul>
        <li>
          <strong>5–6 clean:</strong> your agency is doing real work. Push the scope toward AI visibility if it
          isn&apos;t there yet, but don&apos;t fire someone who is shipping.
        </li>
        <li>
          <strong>3–4 clean:</strong> the work is real but the reporting or the scope is stale. This is a
          conversation, not a cancellation. Bring the specific findings.
        </li>
        <li>
          <strong>0–2 clean:</strong> you are paying for activity. Get a written answer to the four questions
          below before your next invoice.
        </li>
      </ul>

      <h2>Four questions to send your agency</h2>
      <ul>
        <li>What specifically shipped in the last 90 days that still exists on my site or profiles today?</li>
        <li>What are we doing about AI answers — ChatGPT, Gemini, Perplexity, AI Overviews — and how is it measured?</li>
        <li>Which metric are we actually trying to move this quarter, and why that one?</li>
        <li>What would you stop doing if the budget were cut 30%? (This reveals what they consider filler.)</li>
      </ul>
      <p>
        A good agency answers these in a paragraph each, without defensiveness. Evasive or purely reassuring
        answers are themselves the finding.
      </p>

      <h2>The honest caveats</h2>
      <p>
        A few limits on this audit, stated plainly. It is a diagnostic, not a verdict — six checks cannot capture
        everything a competent agency does, and some of the most valuable work (cleaning up a messy site
        migration, killing a toxic backlink profile) leaves little visible trace. SEO also takes months to
        compound, so recency bias will make a new agency look worse than it is. And a failed check is a
        conversation starter, not proof of bad faith; plenty of agencies are doing solid classic SEO and simply
        haven&apos;t added AI visibility to their scope yet.
      </p>
      <p>
        We should also be clear about our own position: alphaa is an alternative to an SEO agency, so we have an
        obvious interest in you asking these questions. That is exactly why the audit above is built from things
        you can verify yourself, in your own browser, without taking our word for any of it. If your agency
        passes, keep them.
      </p>

      <h2>The bottom line</h2>
      <p>
        Judge your agency on artifacts and decisions, not effort and charts. Ten minutes — three reports, a view
        source, one AI query, and a hard look at what the reporting actually recommends — will tell you most of
        what you need to know. The check that surprises people most is the AI one, because it is the newest and
        the least likely to be in anyone&apos;s scope: the engines are already answering questions about your
        business, whether or not anyone you pay is watching.
      </p>
      <p>
        <em>Last updated July 21, 2026.</em>
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
