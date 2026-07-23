import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "seo-to-aeo-90-day-playbook",
  title: "From SEO to AEO: The 90-Day Playbook for Getting Recommended by AI",
  description:
    "A concrete 90-day plan to shift from ranking on Google to getting recommended by ChatGPT, Claude, Gemini, and Perplexity — three 30-day phases of measure, fix, and build, with the exact tasks we run for local businesses.",
  date: "2026-07-23",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>By the alphaa team — this is the exact sequence we run when a business moves from chasing rankings
        to getting cited by AI.</strong> Last updated 23 July 2026.
      </p>

      <p>
        <strong>Short answer:</strong> You do not rebuild your site or abandon SEO. Over 90 days you run three
        30-day phases — <strong>measure</strong> what AI engines say about you today, <strong>fix</strong> the
        facts and structure they read, and <strong>build</strong> the third-party evidence that gets you named.
        The goal is not a ranking; it is being the business ChatGPT, Claude, Gemini, and Perplexity recommend when
        your customer asks. The payoff is real: traffic to retail sites from AI assistants grew over 1,200% in
        under a year, and those visitors convert better than traditional search traffic (Adobe Analytics, 2025–26).
      </p>

      <h2>Why a playbook instead of a rebuild</h2>
      <p>
        The instinct when a channel shifts is to tear everything down. Do not. Live retrieval — the process AI
        assistants use to pull fresh web pages before answering — reads the same crawlable, well-structured content
        that good SEO already produces. The fundamentals did not stop working; they stopped being the whole job.
        What is new is the layer on top: making your facts consistent everywhere a model looks, and earning the
        third-party mentions that let it name you with confidence. This playbook adds that layer in a fixed order
        so you are never guessing what to do next.
      </p>
      <p>
        One honesty note before you start: no plan, including this one, can guarantee a citation. AI answers vary
        by phrasing, by user, by model version, and week to week. What a disciplined 90 days does is improve the
        evidence the models read, which shifts the odds in your favor. If a vendor promises &quot;guaranteed
        placement in ChatGPT,&quot; they are describing a lever that does not exist — we explain why in{" "}
        <Link href="/blog/is-aeo-real">Is AEO real?</Link>.
      </p>

      <h2>Days 1–30: Measure (get your real baseline)</h2>
      <p>
        You cannot improve what you have not looked at. Most owners have never actually asked an AI what it says
        about their business, and the answer is usually wrong, vague, or absent. Phase one is diagnosis, not
        editing.
      </p>
      <ul>
        <li>
          <strong>Ask the four engines directly.</strong> In ChatGPT, Claude, Gemini, and Perplexity, ask the
          questions a customer would: &quot;best [your service] in [your city],&quot; &quot;who should I hire
          for [problem],&quot; &quot;is [your business] any good?&quot; Screenshot every answer. Note whether you
          appear, whether the facts are right, and who gets named instead.
        </li>
        <li>
          <strong>Audit your factual consistency.</strong> Pull your business name, address, phone, hours, and
          service area from your website, Google Business Profile, and the top three directories for your
          category. Put them in one column each. Every contradiction you find is a reason a model hedges you out
          of an answer.
        </li>
        <li>
          <strong>Inventory your quotable content.</strong> For your five most important services, does a page
          answer, in plain language, what it is, who it is for, and where you do it? Vague marketing copy is
          unquotable — a model cannot lift a clean sentence from &quot;we deliver excellence.&quot;
        </li>
        <li>
          <strong>Write down the baseline.</strong> Which engines named you, out of four. How many fact
          contradictions. How many services lack a clear page. These three counts are what you will move.
        </li>
      </ul>
      <p>
        If checking four engines by hand is tedious, a{" "}
        <Link href="/blog/how-to-see-what-chatgpt-says-about-your-business">visibility scan does the measuring
        for you</Link> and gives you the same baseline in a couple of minutes.
      </p>

      <h2>Days 31–60: Fix (make your facts machine-readable)</h2>
      <p>
        Now you correct what the measurement exposed. This phase is unglamorous and high-leverage — it removes the
        reasons an engine leaves you out before you spend effort earning new mentions.
      </p>
      <ul>
        <li>
          <strong>Make your core facts identical everywhere.</strong> Reconcile every contradiction from the
          audit. Name, address, phone, hours, and service area should match to the character across your site,
          Google Business Profile, and directories. This single step resolves more &quot;why doesn&apos;t it
          mention me&quot; problems than anything else.
        </li>
        <li>
          <strong>Rewrite thin service pages to be answer-first.</strong> Open each page with a direct,
          specific sentence a model can quote: what the service is, who it is for, the city or area you serve, and
          one concrete differentiator. Then support it. You are writing for extraction, not for a hero banner.
        </li>
        <li>
          <strong>Add structured data.</strong> Mark up your business, services, and FAQs with schema so the
          facts are machine-readable, not just human-readable. Our guide to{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> covers exactly which
          types to use — and the rule to never mark up a fact that is not true on the page.
        </li>
        <li>
          <strong>Publish plain-language FAQ answers.</strong> Take the real questions customers ask and answer
          each in two or three sentences a model can lift verbatim. This is the content format AI engines cite
          most readily.
        </li>
      </ul>
      <p>
        By day 60 the machine-readable version of your business should be accurate, specific, and consistent.
        That is the raw material every AI answer is assembled from.
      </p>

      <h2>Days 61–90: Build (earn the outside evidence)</h2>
      <p>
        Describing yourself well is necessary but not sufficient. AI assistants reward being described{" "}
        <strong>verifiably, specifically, and consistently across many sources</strong> — being vouched for by
        others carries weight your own site cannot manufacture. Phase three builds that.
      </p>
      <ul>
        <li>
          <strong>Turn reviews into a steady habit.</strong> Ask every satisfied customer for a Google review,
          and reply to the ones you have. Reviews are one of the most-read third-party signals — we explain the
          mechanism in{" "}
          <Link href="/blog/google-reviews-ai-visibility">why your Google reviews now decide your AI
          visibility</Link>.
        </li>
        <li>
          <strong>Get listed where your category is discussed.</strong> The directories, association pages, and
          local roundups a model retrieves when it researches your field. Consistent listings reinforce the same
          facts from more angles.
        </li>
        <li>
          <strong>Earn a few genuine mentions.</strong> A local news feature, a partner&apos;s site, an
          honest answer in a community forum where your business is genuinely relevant. Quality and truth beat
          volume — a handful of real, specific mentions outperform dozens of thin ones.
        </li>
        <li>
          <strong>Re-run the day-1 measurement.</strong> Ask the same four engines the same questions. Compare
          against your baseline: more engines naming you, fewer wrong facts, cleaner descriptions. That delta is
          your result.
        </li>
      </ul>

      <h2>The 90-day plan at a glance</h2>
      <table>
        <thead>
          <tr>
            <th>Phase</th>
            <th>Focus</th>
            <th>Outcome you measure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Days 1–30</td>
            <td>Measure — baseline what AI says today</td>
            <td>Engines that name you (of 4); fact contradictions; unclear service pages</td>
          </tr>
          <tr>
            <td>Days 31–60</td>
            <td>Fix — consistent facts, answer-first pages, schema</td>
            <td>Contradictions resolved; pages rewritten; schema live</td>
          </tr>
          <tr>
            <td>Days 61–90</td>
            <td>Build — reviews, listings, genuine mentions</td>
            <td>Re-measured engine mentions vs. baseline</td>
          </tr>
        </tbody>
      </table>

      <h2>What to expect after 90 days</h2>
      <p>
        Be realistic about the shape of the result. AI engines re-crawl and re-train on their own schedule, so
        improvements show up unevenly — one engine may pick up your corrected facts weeks before another. You are
        not buying a ranking that flips on a set date; you are raising the odds that when a customer asks, the
        answer includes you. What you should see is directional: more of the four engines naming you, fewer wrong
        details, and descriptions that sound like your actual business. If nothing moved, that is information too —
        usually it points back to weak third-party evidence, the hardest and most important part.
      </p>
      <p>
        This is the last post in our series on the shift from ranked links to AI answers. If you are starting from
        the beginning, <Link href="/blog/death-of-the-blue-link">The death of the blue link</Link> explains why
        the ground moved, and <Link href="/blog/what-is-answer-engine-optimization">what answer engine
        optimization is</Link> defines the discipline this playbook applies.
      </p>

      <h2>The bottom line</h2>
      <p>
        Moving from SEO to AEO is not a teardown; it is a 90-day reordering of effort. Measure honestly, fix your
        facts, build your evidence — in that sequence, because each phase makes the next one work. Do it well and
        you stop asking &quot;where do I rank?&quot; and start answering the only question that now matters: when
        your customer asks an AI who to hire, does it say you? Start by finding out where you stand today.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
