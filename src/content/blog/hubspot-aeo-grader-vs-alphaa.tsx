import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "hubspot-aeo-grader-vs-alphaa",
  title: "HubSpot AEO Grader vs Alphaa (2026): Score vs Agent",
  description:
    "HubSpot AEO Grader vs Alphaa, compared from each company's own pages: what the free score measures, HubSpot AEO's $50 plan, and who writes the fixes for you.",
  subtitle:
    "HubSpot's AEO Grader is a free one-time score of how three AI engines describe a brand, while Alphaa is a $99-a-month agent that checks four assistants weekly and writes the fixes.",
  date: "2026-11-02",
  updated: "2026-11-02",
  readMins: 6,
  tag: "Comparison",
  kind: "comparison",
  keyphrase: "hubspot aeo grader",
  image: {
    src: "/blog/hubspot-aeo-grader-vs-alphaa.webp",
    alt: "A small wooden robot arm holding a pencil over a blank sheet of paper beside an empty instant photo on a pale wooden desk.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "HubSpot's AEO Grader is a free, one-time brand check that needs no account and scores a brand out of 100.",
    "The Grader checks ChatGPT, Perplexity and Gemini, and weights sentiment most heavily at up to 40 of the 100 points.",
    "HubSpot AEO, the paid tracker, costs $50 a month for 25 prompts across the same three engines, as of November 2026.",
    "Alphaa costs from $99 a month, asks ChatGPT, Gemini, Claude and Perplexity weekly, and drafts fixes the owner approves.",
    "Use the Grader for a free baseline; choose a tracker or an agent depending on who will make the website changes.",
  ],
  sources: [
    {
      title: "AI Search Grader: Free One-Time AEO Brand Check, No Account Required",
      publisher: "HubSpot",
      url: "https://www.hubspot.com/aeo-grader",
    },
    {
      title: "HubSpot AEO | AEO Tools to Track & Improve Your AI Visibility",
      publisher: "HubSpot",
      url: "https://www.hubspot.com/products/aeo",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> The HubSpot AEO Grader is a free, one-time score of how ChatGPT, Perplexity
        and Gemini describe a brand, with no account needed. Alphaa is a paid AI agent, from $99 a month, that asks
        four assistants about one business every week and drafts the website fixes for the owner to approve. One
        diagnoses; the other does the work.
      </p>

      <p>
        We make Alphaa, so weigh this page accordingly. Everything said about HubSpot comes from its{" "}
        <a href="https://www.hubspot.com/aeo-grader" {...ext}>
          AI Search Grader page
        </a>{" "}
        and its{" "}
        <a href="https://www.hubspot.com/products/aeo" {...ext}>
          HubSpot AEO product page
        </a>
        , read on 2 November 2026. Where HubSpot does not publish a detail, we say so instead of guessing.
      </p>

      <h2>What is the HubSpot AEO Grader?</h2>
      <p>
        The HubSpot AEO Grader is a free tool that gives a brand a score out of 100 based on how AI engines describe
        it. HubSpot also calls it the AI Search Grader; the page title describes it as a &quot;free one-time AEO
        brand check&quot; with no account required. You enter a company name, location, product or service and
        industry, and HubSpot says the snapshot is ready in under two minutes.
      </p>
      <p>
        According to its FAQ, the Grader asks GPT-5.4 mini from OpenAI, Perplexity and Gemini, and cross-checks the
        results across the three. HubSpot says the tool reveals what those engines say about you based on their
        training data. You can run it on any brand name, so it works for sizing up competitors too.
      </p>

      <h2>How does the HubSpot AEO Grader calculate its score?</h2>
      <p>
        The Grader adds up five weighted dimensions into one score out of 100, and sentiment carries the most
        weight. This is the breakdown HubSpot publishes:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Maximum points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sentiment</td>
              <td>40</td>
            </tr>
            <tr>
              <td>Presence quality</td>
              <td>20</td>
            </tr>
            <tr>
              <td>Brand recognition</td>
              <td>20</td>
            </tr>
            <tr>
              <td>Share of voice</td>
              <td>10</td>
            </tr>
            <tr>
              <td>Market competition</td>
              <td>10</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Two things follow from those weights. A well-liked brand that AI engines rarely mention can still score
        respectably, because sentiment is 40% of the total. And because the score is a single snapshot, it will
        move if you run it again on another day: AI answers vary from run to run, which we explain in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>

      <h2>What is the difference between the Grader, HubSpot AEO and Alphaa?</h2>
      <p>
        The Grader is a free diagnosis, HubSpot AEO is a paid tracker with recommendations, and Alphaa is a paid
        agent that writes and publishes the changes. HubSpot itself draws the first line: its FAQ says the Grader is
        a snapshot of how AI represents you today, while HubSpot AEO provides ongoing monitoring, competitor
        comparisons and prioritized recommendations.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>HubSpot AEO Grader</th>
              <th>HubSpot AEO</th>
              <th>Alphaa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              <td>Free</td>
              <td>$50/mo, or $45/mo billed annually</td>
              <td>$99, $199 or $299/mo, month to month</td>
            </tr>
            <tr>
              <td>Account needed</td>
              <td>No, per the page title</td>
              <td>Yes; no other HubSpot subscription required</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>AI engines</td>
              <td>ChatGPT (GPT-5.4 mini), Perplexity, Gemini</td>
              <td>ChatGPT, Gemini, Perplexity</td>
              <td>ChatGPT, Gemini, Claude, Perplexity</td>
            </tr>
            <tr>
              <td>How often</td>
              <td>One-time snapshot</td>
              <td>Score updates daily</td>
              <td>Weekly</td>
            </tr>
            <tr>
              <td>Prompts</td>
              <td>Set by HubSpot from your inputs</td>
              <td>25 included; more can be bought</td>
              <td>Customer questions for one business</td>
            </tr>
            <tr>
              <td>Recommendations</td>
              <td>Written interpretation of the score</td>
              <td>Prioritized actions such as new posts, page updates, outreach</td>
              <td>Specific fixes, drafted in full</td>
            </tr>
            <tr>
              <td>Writes and publishes changes</td>
              <td>No</td>
              <td>Content tools only with Marketing Hub Pro or Enterprise</td>
              <td>Yes, to WordPress, Shopify, Webflow after owner approval</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>HubSpot details are from its own pages as of November 2026 and may change.</p>

      <h2>How much does HubSpot AEO cost compared with Alphaa?</h2>
      <p>
        HubSpot AEO costs $50 a month, or $45 a month paid annually, which is about half the price of Alphaa
        Starter at $99. The HubSpot plan includes 25 prompts tracked across ChatGPT, Perplexity and Gemini, with
        more prompts available to buy and no stated cap. HubSpot says you can start tracking those 25 prompts free
        without a credit card; the page does not say how long the free period lasts. AEO is also included in
        Marketing Hub Pro and Enterprise, which is where HubSpot says content creation tools are built in.
      </p>
      <p>
        Alphaa costs $99 (Starter), $199 (Pro) or $299 (Full Service) a month, month to month, with no free trial.
        Instead there is a <Link href="/start">free 60-second AI check</Link> that shows what ChatGPT, Gemini,
        Claude and Perplexity say about your business today. Full plan details are on the{" "}
        <Link href="/pricing">pricing page</Link>.
      </p>
      <p>
        The fair comparison is not the sticker price but the work included. HubSpot AEO tells you what to do next;
        Alphaa drafts it. If you already have someone who writes and publishes web content, the cheaper tracker may
        be all you need.
      </p>

      <h2>Which AI engines does each tool check?</h2>
      <p>
        Both HubSpot products check ChatGPT, Perplexity and Gemini, while Alphaa checks those three plus Claude.
        Neither HubSpot page lists Claude, and Alphaa does not report on Microsoft Copilot or on Google&apos;s AI
        Overviews and AI Mode as separate surfaces.
      </p>
      <p>
        For Google&apos;s AI features, Google says in{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        that there are no additional requirements to appear beyond being indexed and eligible for a snippet. So the
        fundamentals that help the assistants (crawlable pages, clear text, structured data that matches the page,
        an up-to-date Business Profile) are the same ones Google lists, whichever tool you use to measure them.
      </p>

      <h2>Who does the work after you get your score?</h2>
      <p>
        After the Grader, you do the work; after HubSpot AEO, you do the work with a prioritized list; with
        Alphaa, the agent drafts the work and you approve it. That is the deciding question for most small
        businesses.
      </p>
      <p>
        HubSpot AEO&apos;s recommendations, by its own description, look like &quot;create a new blog post&quot;,
        &quot;update a page&quot; or &quot;reach out to third-party sites&quot;. Those are useful directions, and a
        marketing team inside HubSpot can act on them with the content tools in Marketing Hub. A business without
        that team still needs someone to write the post and publish it.
      </p>
      <p>
        Alphaa assumes there is no marketer. It runs a 23-point check of what assistants can read on your site,
        compares that with what they actually say, and writes the fixes: FAQ pages, structured data, an llms.txt
        file, Google Business Profile posts and review replies. Each one comes with a plain-language reason, and
        nothing goes live until you approve it through{" "}
        <Link href="/integrations">the WordPress, Shopify or Webflow integration</Link>. The trade-off is scope:
        Alphaa covers one business per plan and four engines, and it does not offer HubSpot&apos;s CRM or marketing
        suite.
      </p>

      <h2>When is the HubSpot AEO Grader enough?</h2>
      <p>
        The Grader is enough when you want a free, quick read on how AI describes your brand and do not yet plan to
        change anything. Good reasons to stop there:
      </p>
      <ul>
        <li>You want a baseline number before deciding whether AI visibility is worth any budget.</li>
        <li>You want to compare your score with two or three competitors at no cost.</li>
        <li>You are preparing a one-off slide or report and do not need tracking over time.</li>
      </ul>

      <h2>When should you choose HubSpot AEO or Alphaa instead?</h2>
      <p>
        Choose HubSpot AEO if you already live in HubSpot and have people to act on recommendations; choose Alphaa
        if you run one business and want the fixes written for you. These signals point one way or the other:
      </p>
      <ul>
        <li>
          <strong>HubSpot AEO:</strong> your team uses Marketing Hub, you want daily score updates and citation
          analysis, and you want the lowest monthly price for tracking.
        </li>
        <li>
          <strong>Alphaa:</strong> nobody on staff does marketing full time, you want Claude covered alongside
          ChatGPT, Gemini and Perplexity, and you would rather approve a finished FAQ page than read a chart.
        </li>
      </ul>
      <p>
        Neither tool can edit what an AI model believes, and neither can promise a recommendation. All three work
        through the public signals assistants read. For the mechanism, see{" "}
        <Link href="/blog/how-to-get-recommended-by-chatgpt">how to get recommended by ChatGPT</Link>, and for how
        to judge any score you are given, see{" "}
        <Link href="/blog/how-to-measure-ai-visibility">how to measure AI visibility</Link>.
      </p>

      <h2>How do you decide in 15 minutes?</h2>
      <p>Decide by running both free checks on the same business and asking who will act on the result:</p>
      <ol>
        <li>
          <strong>Run the HubSpot AEO Grader.</strong> Note your score and which of the five dimensions pulled it
          down.
        </li>
        <li>
          <strong>Run Alphaa&apos;s free check.</strong> It takes about a minute and shows the actual answers from
          four assistants, including Claude.
        </li>
        <li>
          <strong>Compare what each tells you to do.</strong> Is it a direction (&quot;improve sentiment&quot;) or a
          specific change you could make today?
        </li>
        <li>
          <strong>Name the person who will make the change.</strong> If you can, a tracker is enough. If you
          cannot, an agent that drafts the change is the better fit.
        </li>
      </ol>
      <p>
        Comparing more tools? See <Link href="/blog/best-aeo-tools-2026">the best AEO tools of 2026</Link>, our{" "}
        <Link href="/blog/alphaa-vs-semrush">Alphaa vs Semrush</Link> breakdown, or the{" "}
        <Link href="/compare">comparison hub</Link> for every head-to-head.
      </p>

      <h2>What else do people ask about the HubSpot AEO Grader?</h2>

      <h3>Is the HubSpot AEO Grader really free?</h3>
      <p>
        Yes, HubSpot&apos;s FAQ says there is no cost to run an analysis. The page title also says no account is
        required, and the paid upgrade for ongoing tracking is HubSpot AEO at $50 a month.
      </p>

      <h3>Is the HubSpot AI Search Grader the same as the AEO Grader?</h3>
      <p>
        Yes, they are the same tool. It lives at hubspot.com/aeo-grader and its page is headed AI Search Grader, so
        you will see both names used.
      </p>

      <h3>Does the HubSpot AEO Grader check Claude?</h3>
      <p>
        No, HubSpot lists ChatGPT, Perplexity and Gemini for the Grader and for HubSpot AEO. Alphaa asks those three
        and Claude every week.
      </p>

      <h3>Can the HubSpot AEO Grader improve my AI visibility?</h3>
      <p>
        No, the Grader only measures; it does not change anything on your website or profiles. Improvement comes
        from the changes you make afterwards, whether you write them yourself or use a tool that drafts them.
      </p>

      <h3>Does a high AEO Grader score mean AI will recommend me?</h3>
      <p>
        Not necessarily, because the score is a weighted snapshot and AI answers vary between runs. Treat it as a
        starting point, then test the specific questions your customers ask.
      </p>
    </div>
  )
}
