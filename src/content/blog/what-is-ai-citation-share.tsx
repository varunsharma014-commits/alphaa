import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "what-is-ai-citation-share",
  title: "What Is AI Citation Share?",
  description:
    "AI citation share is the share of AI answers in your category that cite your site. How it is calculated, how it differs from mention rate, and its limits.",
  subtitle:
    "AI citation share is the percentage of AI answers to a fixed set of questions that cite your website as a source, measured against your competitors.",
  date: "2026-10-02",
  updated: "2026-10-02",
  readMins: 4,
  tag: "Glossary",
  kind: "glossary",
  keyphrase: "what is ai citation share",
  image: {
    src: "/blog/what-is-ai-citation-share.webp",
    alt: "A plain cream ceramic disc seen from above with one wedge-shaped slice cut away and set apart.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI citation share is your cited answers divided by all answers in a fixed prompt set, usually shown against competitors.",
    "A citation means the answer links your domain as a source, which is stricter than being mentioned by name.",
    "The number is only meaningful with the prompt set, engine list and sample count stated alongside it.",
    "Vendors compute it differently, so a score from one tool cannot be compared with a score from another.",
    "High citation share with low recommendation rank means the engines use you as a reference, not as a choice.",
  ],
  sources: [
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Generative AI performance report (Search)", publisher: "Google Search Console Help", url: "https://support.google.com/webmasters/answer/16984139" },
    { title: "Perplexity Crawlers", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://platform.openai.com/docs/bots" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say
          about local businesses. Here is the plain definition.
        </em>
      </p>
      <p>
        <strong>Short answer:</strong> AI citation share is the percentage of AI answers to a fixed set of
        questions that cite your website as a source, usually expressed against the competitors cited in the same
        answers. If 40 prompts produce 120 answers and 18 of them link your domain, your citation share of those
        answers is 15%.
      </p>
      <p>
        It is one of the handful of metrics that survived the move from rank tracking to AI answers, and it is the
        one most often reported without the detail needed to interpret it.
      </p>

      <h2>How is AI citation share calculated?</h2>
      <p>
        Citation share is cited answers divided by total answers in a defined prompt set, over a defined period.
        Three inputs have to be fixed before the division means anything.
      </p>
      <ul>
        <li>
          <strong>The prompt set.</strong> The exact questions, frozen in wording. Changing one resets the series.
        </li>
        <li>
          <strong>The engines.</strong> ChatGPT, Gemini, Claude and Perplexity cite at very different rates, so a
          blended figure moves when the engine mix changes.
        </li>
        <li>
          <strong>The sample count.</strong> Answers are generated fresh per request, so each prompt needs several
          samples per run before a rate is stable.
        </li>
      </ul>
      <p>
        Some tools report the competitive version instead: your citations as a percentage of all domains cited in
        the set. That is a share-of-voice number, it is always smaller, and it is not interchangeable with the
        first definition. Ask which one you are looking at.
      </p>

      <h2>How is citation share different from mention rate?</h2>
      <p>
        A citation links your domain; a mention only says your name. Mention rate is the looser and larger
        number — an answer can describe your business in detail, pulled from a directory listing, and cite nobody.
        Citation share counts only the cases where your own pages were the evidence, which is why it correlates
        with referral traffic and mention rate does not.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>What it counts</th>
              <th>What it tells you</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mention rate</td>
              <td>Answers that name your business</td>
              <td>The engines know you exist in this category</td>
            </tr>
            <tr>
              <td>AI citation share</td>
              <td>Answers that link your domain as a source</td>
              <td>Your own pages are the evidence being used</td>
            </tr>
            <tr>
              <td>Recommendation rank</td>
              <td>Your place in the named shortlist</td>
              <td>You are a candidate, not just context</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The combination is what diagnoses. High citation share with low recommendation rank is a recognisable
        pattern: the engines treat you as a reference work and someone else as the choice. The full measurement
        method is in <Link href="/blog/how-to-measure-ai-visibility">how to measure AI visibility</Link>.
      </p>

      <h2>Why would my AI citation share be zero?</h2>
      <p>
        Usually because nothing on your site answers the question in a liftable form, or because retrieval never
        fetched your pages. Both are checkable. Both{" "}
        <a href="https://platform.openai.com/docs/bots" {...ext}>
          OpenAI
        </a>{" "}
        and{" "}
        <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
          Perplexity
        </a>{" "}
        publish the user agents they fetch with, so your server logs will tell you whether the engines are reading
        you at all. If they are, the problem is the page: an answer that takes a scroll and three paragraphs to
        arrive rarely gets quoted. We cover the fix in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI quotes</Link> and{" "}
        <Link href="/blog/what-sources-do-ai-engines-cite">what sources AI engines cite</Link>.
      </p>

      <h2>How do you improve your AI citation share?</h2>
      <p>
        You improve citation share by making your pages the easiest correct source to quote on the questions in
        your set. Four moves do most of the work, in this order.
      </p>
      <ol>
        <li>
          <strong>Make the page reachable.</strong> Confirm from your logs that the assistants&apos; crawlers
          fetch it, that it is not blocked in <code>robots.txt</code>, and that the answer is in the HTML rather
          than rendered by script.
        </li>
        <li>
          <strong>Answer in the first 60 words.</strong> One page, one question, answered before any context. A
          self-contained paragraph is liftable; a build-up is not.
        </li>
        <li>
          <strong>Make the claim checkable.</strong> Specific figures, named places, dates and a source beat
          adjectives, because an engine corroborating a claim across pages is choosing between candidates.
        </li>
        <li>
          <strong>Get corroborated elsewhere.</strong> Consistent business details across listings and
          third-party pages make the engines confident enough to cite you by name rather than hedging.
        </li>
      </ol>
      <p>
        None of this is a lever you can pull on the model itself, which is why it takes weeks rather than days —
        see <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>

      <h2>Can you track AI citation share for free?</h2>
      <p>
        Partly. Google&apos;s{" "}
        <a href="https://support.google.com/webmasters/answer/16984139" {...ext}>
          generative AI performance report
        </a>{" "}
        in Search Console shows impressions for pages appearing in AI Overviews and AI Mode, with no clicks,
        position or query data, and nothing about ChatGPT, Claude or Perplexity. For those you have to ask the
        engines directly and record the answers, which is what a tracker does — or run the free 60-second check at{" "}
        <Link href="/start">our scan page</Link> to see the current answers across all four.
      </p>

      <h2>What are the limits of this metric?</h2>
      <p>
        Citation share describes what engines did, never why, and it cannot be compared across tools. The
        retrieval set, the ranking and the model revision behind any given answer are not visible from outside,
        and Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          guidance on AI features
        </a>{" "}
        is explicit that no markup buys inclusion. Treat the number as a baseline you move, with a change log
        beside it, rather than a score anyone can audit.
      </p>

      <h2>What else do people ask about AI citation share?</h2>

      <h3>Is AI citation share the same as share of voice?</h3>
      <p>
        Not quite. Share of voice usually counts brand mentions across the set, while citation share counts linked
        sources, so the two can point in opposite directions for the same business.
      </p>

      <h3>What is a good AI citation share?</h3>
      <p>
        There is no published benchmark worth quoting, and category norms differ enormously. Compare the figure
        only with your own earlier measurements on the same prompt set and engine list.
      </p>

      <h3>Does a higher citation share mean more traffic?</h3>
      <p>
        It raises the ceiling but does not guarantee clicks, because most AI answers resolve the question in
        place. See <Link href="/blog/zero-click-search">zero-click search</Link> for how much of that volume never
        becomes a visit.
      </p>

      <h3>Why does my citation share change without me doing anything?</h3>
      <p>
        Because answers are regenerated per request and the retrieval set shifts, so run-to-run variance is
        normal. We explain the mechanism in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>

      <h3>Can I buy a higher AI citation share?</h3>
      <p>
        No. No tool or vendor can place a citation, and none can promise one — what moves the number is better
        public evidence, as we argue in <Link href="/blog/is-aeo-real">is AEO real</Link>.
      </p>
    </div>
  )
}
