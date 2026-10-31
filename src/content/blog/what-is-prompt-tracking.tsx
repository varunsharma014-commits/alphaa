import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "what-is-prompt-tracking",
  title: "What Is Prompt Tracking in AI Search?",
  description:
    "Prompt tracking means asking AI assistants the same questions on a schedule and logging whether they mention you. How it works, what it costs, and its limits.",
  subtitle:
    "Prompt tracking is running a fixed set of customer questions through AI assistants on a schedule and recording whether, where and how each answer mentions or cites your brand.",
  date: "2026-10-31",
  updated: "2026-10-31",
  readMins: 4,
  tag: "Glossary",
  kind: "glossary",
  keyphrase: "what is prompt tracking",
  image: {
    src: "/blog/what-is-prompt-tracking.webp",
    alt: "A row of identical cream ceramic cups on a long table, two of them tagged with small blank paper labels on string.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Prompt tracking repeats a fixed set of questions in AI assistants on a schedule and records mentions, citations and position.",
    "Most AI visibility tools price by prompts tracked, for example 15 to 400 a month on Otterly AI's self-serve plans.",
    "Peec AI runs prompts daily, while LLMrefs updates each keyword at least weekly, as of October 2026.",
    "Because AI answers vary between runs, one manual check is a sample, not a measurement.",
    "Prompt tracking measures visibility; it does not change it, so someone still has to fix what it finds.",
  ],
  sources: [
    { title: "OtterlyAI Pricing - Transparent & Simple", publisher: "OtterlyAI", url: "https://otterly.ai/pricing" },
    {
      title: "Pricing for Peec AI - AI Search Analytics for Marketing teams and SEO agencies",
      publisher: "Peec AI",
      url: "https://peec.ai/pricing",
    },
    {
      title: "LLMrefs - Generative AI Search Analytics - LLM SEO Tracker",
      publisher: "LLMrefs",
      url: "https://llmrefs.com/pricing",
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
        <strong>Short answer:</strong> Prompt tracking is asking AI assistants such as ChatGPT, Gemini, Claude and
        Perplexity the same set of customer questions on a regular schedule, and recording whether each answer
        mentions your brand, cites your website, and where you appear against competitors. It is the AI-search
        equivalent of rank tracking.
      </p>

      <h2>How does prompt tracking work?</h2>
      <p>
        Prompt tracking works by sending a fixed list of prompts to one or more AI engines on a timetable, saving
        every answer, and turning the answers into a few numbers you can follow over time. A prompt is a question
        written the way a customer would ask it, such as &quot;best bookkeeping service for restaurants in
        Chicago&quot;.
      </p>
      <ol>
        <li>
          <strong>Choose the prompts.</strong> Questions your buyers ask, mostly without your brand name in them.
        </li>
        <li>
          <strong>Choose the engines.</strong> Which assistants to ask, and from which country or language.
        </li>
        <li>
          <strong>Run them on a schedule.</strong> Daily or weekly, the same way each time.
        </li>
        <li>
          <strong>Record the result.</strong> Was the brand mentioned, in what position, with which sources cited,
          and in what tone.
        </li>
        <li>
          <strong>Compare over time and against competitors.</strong> The trend matters more than any single run.
        </li>
      </ol>

      <h2>Why can&apos;t you just ask ChatGPT once?</h2>
      <p>
        One question asked once is a single sample, because AI assistants can give different answers to the same
        question minutes apart. Wording, location, account history and which web pages the assistant retrieves all
        shift the result. Prompt tracking fixes the inputs and repeats them so you can see a pattern rather than a
        coincidence. We explain the causes in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>
      <p>
        The variation is partly by design. Google says in{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        that AI Overviews and AI Mode may issue multiple related searches across subtopics to build a response, a
        technique called <Link href="/blog/what-is-query-fan-out">query fan-out</Link>. One prompt can therefore
        draw on many different pages from run to run.
      </p>

      <h2>How is a prompt different from a keyword?</h2>
      <p>
        A prompt is a full question in natural language, while a keyword is the short phrase someone types into a
        search box. &quot;Plumber Portland&quot; is a keyword; &quot;Which plumber in Portland can fix a leaking
        water heater this weekend, and roughly what will it cost?&quot; is a prompt. People tend to write longer,
        more specific questions to an assistant, and those details change which businesses the answer names.
      </p>
      <p>
        That is why tools differ in where they start. Some price and organise everything around the prompts you
        enter. Others, such as LLMrefs, start from a keyword list and generate the prompts for you. Both
        end up sending questions to the engines; the choice affects how closely the tracked prompts match what your
        real customers ask. If you write them yourself, borrow the wording from sales calls, emails and reviews
        rather than from a keyword tool.
      </p>

      <h2>What do prompt tracking tools measure?</h2>
      <p>
        Prompt tracking tools usually measure four things: whether you are mentioned, where you rank in the answer,
        which sources the engine cites, and how you are described. Vendors name and weight these differently, so a
        score from one tool cannot be compared with a score from another.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>What it counts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mention rate or visibility</td>
              <td>Share of answers that name your brand</td>
            </tr>
            <tr>
              <td>Position</td>
              <td>Where you appear in a list of recommendations</td>
            </tr>
            <tr>
              <td>Citation share</td>
              <td>Share of answers that link your site as a source</td>
            </tr>
            <tr>
              <td>Share of voice</td>
              <td>Your mentions compared with competitors&apos; across the prompt set</td>
            </tr>
            <tr>
              <td>Sentiment</td>
              <td>Whether the description of you is positive, neutral or negative</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Citation share has its own definition and pitfalls, covered in{" "}
        <Link href="/blog/what-is-ai-citation-share">what is AI citation share</Link>.
      </p>

      <h2>How much does prompt tracking cost?</h2>
      <p>
        Prompt tracking is usually priced by the number of prompts tracked, from about $29 a month for a handful to
        several hundred dollars for a few hundred, as of October 2026. Otterly AI&apos;s{" "}
        <a href="https://otterly.ai/pricing" {...ext}>
          pricing page
        </a>{" "}
        lists 15 prompts for $29, 100 for $189 and 400 for $489 a month, checked daily, with Claude, Gemini and AI
        Mode as paid add-ons. Peec AI&apos;s{" "}
        <a href="https://peec.ai/pricing" {...ext}>
          pricing
        </a>{" "}
        starts at $95 a month for 50 prompts run daily on three models. LLMrefs takes a different route: one{" "}
        <a href="https://llmrefs.com/pricing" {...ext}>
          $79 plan
        </a>{" "}
        for 500 prompts generated from your keywords, with each keyword updated at least weekly.
      </p>
      <p>
        You can also track by hand for free: keep a spreadsheet of ten prompts and ask each assistant once a week.
        It is slow, but it is honest about the sample size. Our guide to{" "}
        <Link href="/blog/how-to-measure-ai-visibility">measuring AI visibility</Link> shows a simple setup, and{" "}
        <Link href="/blog/keyword-research-for-ai-search">keyword research for AI search</Link> covers choosing the
        prompts.
      </p>

      <h2>What are the limits of prompt tracking?</h2>
      <p>
        The main limit is that prompt tracking measures visibility but does not change it. A dashboard can tell you
        that a competitor is named for &quot;emergency electrician near me&quot; and you are not; it cannot rewrite
        your service page or fix your listings. The other limits are that your prompt list is a guess at what
        customers ask, that real users see personalised answers your tracker does not, and that small prompt sets
        swing a lot from week to week.
      </p>
      <p>
        That gap is why we built Alphaa as an agent rather than a tracker. It asks ChatGPT, Gemini, Claude and
        Perplexity your customers&apos; questions every week, then drafts the fixes, such as FAQ pages and
        structured data, for the owner to approve before publishing to WordPress, Shopify or Webflow. Plans start at
        $99 a month. For how it compares with a pure tracker, see{" "}
        <Link href="/blog/alphaa-vs-llmrefs">Alphaa vs LLMrefs</Link>, or run the{" "}
        <Link href="/start">free 60-second AI check</Link> to see your own answers.
      </p>

      <h2>What else do people ask about prompt tracking?</h2>

      <h3>Is prompt tracking the same as rank tracking?</h3>
      <p>
        No, but it plays the same role for AI answers. Rank tracking records your position in a list of links;
        prompt tracking records whether an AI answer names or cites you at all, which is a yes-or-no outcome before
        it is a position.
      </p>

      <h3>How many prompts should a small business track?</h3>
      <p>
        Ten to thirty well-chosen prompts are enough for most single-location businesses. Cover your main services,
        your town and a few comparison questions, and keep the list stable so week-to-week changes mean something.
      </p>

      <h3>Should my prompts include my brand name?</h3>
      <p>
        Mostly no, because customers who do not know you yet will not type your name. Keep one or two branded
        prompts to check that assistants describe you accurately, and make the rest unbranded category questions.
      </p>

      <h3>How often should prompts be checked?</h3>
      <p>
        Weekly is enough for most businesses, because the signals that move AI answers, such as new pages, reviews
        and listings, change over weeks. Daily runs add more samples, which helps smooth out random variation in
        larger prompt sets.
      </p>
    </div>
  )
}
