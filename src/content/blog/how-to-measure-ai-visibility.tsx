import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-measure-ai-visibility",
  title: "How to Measure AI Visibility (2026 Guide)",
  description:
    "AI visibility is not traffic. The four metrics worth tracking, how to build a prompt set, what Search Console now shows, and what no tool can tell you.",
  subtitle:
    "Measure AI visibility by asking a fixed set of buyer questions on a fixed schedule and scoring how often you are mentioned, cited and recommended.",
  date: "2026-10-02",
  updated: "2026-10-02",
  readMins: 7,
  tag: "Measurement",
  kind: "guide",
  keyphrase: "how to measure ai visibility",
  image: {
    src: "/blog/how-to-measure-ai-visibility.webp",
    alt: "A brass sliding caliper lying beside a neat stack of blank white index cards on a pale tabletop.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI visibility is measured on prompts, not keywords: a fixed question set re-asked on a fixed schedule.",
    "Track four things — mention rate, citation rate, recommendation rank and sentiment — and ignore single answers.",
    "Search Console's generative AI report shows Google AI impressions only: no clicks, position or query data.",
    "Answers vary run to run, so a baseline needs several samples per prompt before any number means anything.",
    "No measurement proves causation, so pair every number with the date you changed something.",
  ],
  sources: [
    { title: "Generative AI performance report (Search)", publisher: "Google Search Console Help", url: "https://support.google.com/webmasters/answer/16984139" },
    { title: "Introducing Search Generative AI performance reports in Search Console", publisher: "Google Search Central Blog", url: "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports" },
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://platform.openai.com/docs/bots" },
    { title: "Perplexity Crawlers", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
    { title: "Analytics dimensions and metrics", publisher: "Google Help", url: "https://support.google.com/analytics/answer/9143382" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say
          about local businesses, so these are the metrics we run on our own customers every week.
        </em>
      </p>
      <p>
        <strong>Short answer:</strong> To measure AI visibility, write 20 to 40 buyer questions, ask them on every
        engine that matters on a fixed schedule, and score four things: how often you are mentioned, how often
        your site is cited, where you sit in the recommended list, and how you are described. Treat any single
        answer as noise.
      </p>
      <p>
        This is a different measurement problem from SEO, and the instinct to reuse rank tracking is where most
        teams go wrong. There is no stable ranked list to monitor, the same question returns different answers an
        hour apart, and the metric that pays — being recommended by name — is not in any analytics tool you
        already own. Here is a method that survives contact with that reality.
      </p>

      <h2>What does AI visibility actually mean?</h2>
      <p>
        AI visibility is how often an AI assistant names, cites or recommends you when someone asks a question you
        should win. It is a property of the answer, not of a results page. Three distinct things hide inside the
        phrase, and conflating them is why vendor numbers disagree so wildly.
      </p>
      <ul>
        <li>
          <strong>Mention.</strong> The answer says your business name, with or without a link. This is the
          loosest and most common form of visibility.
        </li>
        <li>
          <strong>Citation.</strong> The answer links to a page on your site as a source. This is what sends
          traffic and what shows up in your logs.
        </li>
        <li>
          <strong>Recommendation.</strong> The answer actually puts you forward as a choice, usually in a short
          list. This is the one that produces calls.
        </li>
      </ul>
      <p>
        A business can be mentioned constantly and recommended never — described as &quot;also in the area&quot;
        while three competitors get the shortlist. If you only track mentions you will not see that, so measure
        all three separately.
      </p>

      <h2>Which four metrics are worth tracking?</h2>
      <p>
        Four metrics cover almost every useful question: mention rate, citation rate, recommendation rank and
        sentiment. Compute each one across your whole prompt set rather than per answer.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>How to compute it</th>
              <th>What a change tells you</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mention rate</td>
              <td>Prompts where your name appears ÷ all prompts asked</td>
              <td>Whether the engines know you exist in this category at all</td>
            </tr>
            <tr>
              <td>Citation rate</td>
              <td>Prompts where your domain is cited ÷ all prompts asked</td>
              <td>Whether your own pages, rather than directories, are the evidence</td>
            </tr>
            <tr>
              <td>Recommendation rank</td>
              <td>Your average position in the named list, counting misses as unranked</td>
              <td>Whether you are a candidate or just context</td>
            </tr>
            <tr>
              <td>Sentiment and attributes</td>
              <td>The adjectives and facts attached to you across answers</td>
              <td>Whether the engines have the right story, price and specialisms</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Share of voice — your mentions as a percentage of all brand mentions across the set — is a useful fifth if
        you have a tight competitor list. We define that metric on its own page:{" "}
        <Link href="/blog/what-is-ai-citation-share">what AI citation share is</Link>.
      </p>

      <h2>How do you build a prompt set that is worth measuring?</h2>
      <p>
        Build the prompt set from how customers actually ask, not from your keyword list, and then freeze it.
        Twenty to forty prompts is enough for a single-location business; a multi-location or multi-service brand
        needs a set per market. Work through it in this order.
      </p>
      <ol>
        <li>
          <strong>Start with the money questions.</strong> &quot;Best emergency plumber in Leeds&quot;, &quot;who
          repairs Bosch dishwashers near me&quot;, &quot;cheapest MOT in Bristol&quot;. Full sentences, the way
          someone types into a chat box, not two-word keywords.
        </li>
        <li>
          <strong>Add the qualifying questions.</strong> Questions asked just before the decision: open on
          Sundays, do they take Medicaid, how much does it usually cost, do they handle insurance claims.
        </li>
        <li>
          <strong>Add the comparison questions.</strong> &quot;X vs Y&quot; and &quot;alternatives to X&quot; for
          each real competitor. These answers are where you find out how you are positioned.
        </li>
        <li>
          <strong>Add a brand-check block.</strong> &quot;What do you know about <em>your business</em>?&quot;,
          &quot;is <em>your business</em> any good?&quot;. This is where you catch wrong hours, a closed location
          or a merged entity. Fixing those is covered in{" "}
          <Link href="/blog/fix-wrong-ai-information-about-your-business">
            how to fix wrong AI information about your business
          </Link>
          .
        </li>
        <li>
          <strong>Freeze the wording and the schedule.</strong> Changing a prompt resets its history. Re-ask
          weekly, on the same day, with no personalisation, no memory and no prior chat context.
        </li>
      </ol>
      <p>
        One discipline matters more than the rest: sample each prompt several times per run. Answers are generated
        fresh each time and vary even with identical input, which we explain in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>. Three samples
        per prompt turns an anecdote into a rate.
      </p>

      <h2>What does Google Search Console now show about AI visibility?</h2>
      <p>
        Search Console now has a dedicated generative AI performance report, and it shows impressions only.
        Google{" "}
        <a href="https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports" {...ext}>
          announced the reports in June 2026
        </a>{" "}
        and noted on the same page that, as of 31 August 2026, the insights had rolled out to all websites
        worldwide. The report gives you impressions inside generative AI features on Search — AI Overviews and AI
        Mode — plus generative AI features in Discover.
      </p>
      <p>
        What you get, per{" "}
        <a href="https://support.google.com/webmasters/answer/16984139" {...ext}>
          Google&apos;s documentation
        </a>
        , is impressions broken down by page, country, device, date and search type. What you do not get is
        clicks, click-through rate, position or query data, and the usual Search Console caveats still apply,
        including the 1,000-row limit and preliminary recent data. Google has said it expects to add metrics over
        time.
      </p>
      <p>
        So treat it as one input, not the scoreboard. It is free, it is first-party, and it is the only place
        Google tells you anything about AI Overviews and AI Mode. It is also silent on ChatGPT, Claude and
        Perplexity, which is most of the question for a lot of businesses.
      </p>

      <h2>How do you measure the traffic side of AI visibility?</h2>
      <p>
        Measure AI traffic by isolating assistant hostnames as referral sources, and expect it to undercount. In
        GA4 there is no built-in AI channel, so clicks from a citation inside ChatGPT land in Referral alongside
        newsletters and forums; filtering session source for <code>chatgpt.com</code>, <code>perplexity.ai</code>,{" "}
        <code>gemini.google.com</code> and <code>claude.ai</code> pulls them out, and promoting that into a custom
        channel group makes it permanent. The{" "}
        <a href="https://support.google.com/analytics/answer/9143382" {...ext}>
          GA4 dimension reference
        </a>{" "}
        lists the fields involved, and we walk through the setup in{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">
          how to track AI traffic in Google Analytics
        </Link>
        .
      </p>
      <p>
        Your server logs are the other half, and they answer a different question: is anyone fetching your pages
        on behalf of these engines at all? Both{" "}
        <a href="https://platform.openai.com/docs/bots" {...ext}>
          OpenAI
        </a>{" "}
        and{" "}
        <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
          Perplexity
        </a>{" "}
        publish their crawler user agents. If you see no retrieval fetches for a page you want quoted, no amount
        of prompt tracking will fix it — that is a crawling problem, and it is the first thing to rule out.
      </p>

      <h2>How often should you measure, and what counts as a real change?</h2>
      <p>
        Weekly measurement with a monthly read is the right rhythm for almost everyone, and a real change is one
        that holds for three consecutive runs. Answers drift day to day for reasons that have nothing to do with
        you — a model update, a different retrieval set, a competitor&apos;s new page — so a single week&apos;s
        improvement is not evidence.
      </p>
      <p>
        Two things do deserve a scheduled review rather than continuous watching. Refresh your competitor list
        quarterly, because the names the engines put next to yours change as new pages and new entrants get
        indexed, and a stale list makes your share numbers quietly wrong. And re-read your prompt set against
        seasonality twice a year: a roofer&apos;s winter questions are not the summer ones, and measuring the
        wrong half of the year is a common reason a flat chart hides real movement.
      </p>
      <p>
        Pair the series with a change log. Every time you publish a page, fix a listing, add schema or collect a
        batch of reviews, write the date next to it. Without that, you will have a chart and no idea which of five
        things moved it. And keep expectations calibrated: engines need to recrawl and then choose your page
        during retrieval, so weeks is normal — see{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>

      <h2>How do you turn the numbers into a priority list?</h2>
      <p>
        Rank the gaps by how commercial the prompt is and how cheap the fix is, and work the cheap commercial
        ones first. The same four metrics point at four different kinds of problem, so read them as a diagnosis
        rather than a scoreboard.
      </p>
      <ol>
        <li>
          <strong>Wrong facts about you.</strong> Always first. A closed location, old hours or a merged entity
          costs you answers across the whole set, and the fix is listing and schema work, not content.
        </li>
        <li>
          <strong>Zero mentions on a money prompt.</strong> The engines do not associate you with that service or
          that place. This needs a page that is unmistakably about it, plus corroboration elsewhere.
        </li>
        <li>
          <strong>Mentioned but never cited.</strong> The engines know you through directories rather than your
          own site. The fix is a page that answers the prompt better than the directory does.
        </li>
        <li>
          <strong>Cited but never recommended.</strong> You read as reference material, not as a candidate. This
          usually means missing the comparison and &quot;best X for Y&quot; questions, which we cover in{" "}
          <Link href="/blog/comparison-pages-ai-search">comparison pages for AI search</Link>.
        </li>
        <li>
          <strong>Described wrongly.</strong> Right name, wrong story — too expensive, wrong specialism, wrong
          area served. Fix it where the engines read it: your own pages, then your listings and reviews.
        </li>
      </ol>

      <h2>What can no AI visibility measurement tell you?</h2>
      <p>
        No measurement can prove why an engine changed its answer, and none can promise it will keep the new one.
        You are observing a system you cannot inspect: nobody outside the labs sees the retrieval set, the
        ranking, or the model revision behind today&apos;s answer. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          own guidance on AI features
        </a>{" "}
        is explicit that there is no special markup that buys inclusion, and the same is true of every other
        engine.
      </p>
      <p>
        That is an argument for honest measurement, not for giving up on it. Knowing that ChatGPT names three
        competitors and not you for your best question is genuinely actionable, even without knowing why. If you
        want the baseline without building the harness yourself, the free 60-second check at{" "}
        <Link href="/start">our scan page</Link> asks ChatGPT, Gemini, Claude and Perplexity about your business
        and shows you what came back.
      </p>

      <h2>What else do people ask about measuring AI visibility?</h2>

      <h3>Can I just use rank tracking for AI visibility?</h3>
      <p>
        No, because there is no stable ranked list to track. AI answers are generated per request and vary between
        runs, so the unit of measurement is a rate across many samples of a prompt, not a position.
      </p>

      <h3>How many prompts do I need to track?</h3>
      <p>
        Twenty to forty prompts covers a single-location business, split across money questions, qualifying
        questions, comparisons and brand checks. Add a set per market or per service line if you operate in
        several, as covered in{" "}
        <Link href="/blog/multi-location-business-ai-visibility">multi-location AI visibility</Link>.
      </p>

      <h3>Does Google Search Console show ChatGPT data?</h3>
      <p>
        No. The generative AI performance report covers Google&apos;s own surfaces — AI Overviews, AI Mode and
        generative features in Discover — and reports impressions only. ChatGPT, Claude and Perplexity are not
        included anywhere in Search Console.
      </p>

      <h3>Why does my AI visibility score differ between tools?</h3>
      <p>
        Because every vendor picks its own prompts, sample count, engines and definition of a mention. A score is
        only comparable with itself over time, so pick one method and keep it rather than reconciling two
        dashboards.
      </p>

      <h3>What is a good mention rate to aim for?</h3>
      <p>
        There is no universal benchmark, and any vendor quoting one is guessing. The useful target is your own
        baseline plus a direction of travel, measured against the same prompt set and the same competitors over
        several months.
      </p>

      <h3>Should I measure before or after I start fixing things?</h3>
      <p>
        Before, always. A baseline taken after you have changed five things is worthless for attribution, and the
        first measurement run usually surfaces the wrong-information problems that are cheapest to fix.
      </p>
    </div>
  )
}
