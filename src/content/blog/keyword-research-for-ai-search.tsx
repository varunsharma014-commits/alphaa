import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "keyword-research-for-ai-search",
  title: "Keyword Research for AI Search: Prompts, Not Keywords",
  description:
    "Keyword research for AI search starts with prompts, not search volume. How to build a prompt list, where real prompt data comes from, and how to use it.",
  subtitle:
    "Keyword research for AI search means collecting the full questions customers put to an assistant, then writing a page that answers each one completely.",
  date: "2026-10-01",
  updated: "2026-10-01",
  readMins: 7,
  tag: "Guide",
  kind: "guide",
  keyphrase: "keyword research for ai search",
  image: {
    src: "/blog/keyword-research-for-ai-search.webp",
    alt: "A roll of plain paper tape unspooling across a beige surface and splitting into three separate strips.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI assistants take whole questions, so the unit of research is a prompt, not a two-word keyword.",
    "Google says its AI features issue multiple related searches at once, so one prompt pulls in many sub-queries.",
    "Search Console still shows the classic queries that feed those sub-searches, which makes it the cheapest prompt source you have.",
    "Prioritise prompts by commercial intent and how answerable they are, not by a volume number nobody publishes.",
    "Map one prompt to one answerable section, then check what the engines say before and after.",
  ],
  sources: [
    { title: "Optimizing your website for generative AI features on Google Search", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide" },
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Expanding AI Overviews and introducing AI Mode", publisher: "Google", url: "https://blog.google/products/search/ai-mode-search/" },
    { title: "Performance report (Search results): Overview and basic setup", publisher: "Google Search Console Help", url: "https://support.google.com/webmasters/answer/7576553" },
    { title: "Pricing for Peec AI - AI Search Analytics for Marketing teams and SEO agencies", publisher: "Peec AI", url: "https://peec.ai/pricing" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about local businesses. Last updated 1 October 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Keyword research for AI search means collecting the whole questions
        customers type into an assistant, not the two-word phrases they used to type into Google. Start from the
        questions you already get asked, confirm them against Search Console, then write one self-contained answer
        per question. Volume numbers matter far less than answerability.
      </p>

      <p>
        Nothing about classic keyword research is wasted — it is just aimed at the wrong unit. A keyword tool
        exists to rank a list of phrases by how many people type them. An assistant does not receive phrases. It
        receives a paragraph with a budget, a city and a constraint in it, and it returns one answer.
      </p>

      <h2>Why does classic keyword research break down for AI search?</h2>
      <p>
        It breaks down because the thing being searched changed shape: a keyword is a fragment, and a prompt is a
        complete request. &quot;Dentist Austin&quot; and &quot;which dentist in north Austin takes my insurance and
        can see a nervous patient on a Saturday&quot; are the same commercial moment, but only the second one tells
        you what to put on the page.
      </p>
      <p>
        Three practical consequences follow. There is no public volume figure for a prompt that long, so you cannot
        sort your list the old way. There is one answer rather than ten links, so being the eleventh-best page on a
        topic returns nothing. And the same prompt asked twice can return different businesses, which we cover in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time you ask</Link>.
      </p>

      <h2>What is query fan-out, and why does it change your list?</h2>
      <p>
        Query fan-out is Google&apos;s term for issuing several related searches at once instead of one, and it
        means a single prompt can pull your page in through a sub-query you never targeted. Google describes AI
        Mode in its{" "}
        <a href="https://blog.google/products/search/ai-mode-search/" {...ext}>
          launch announcement
        </a>{" "}
        as &quot;issuing multiple related searches concurrently across subtopics and multiple data sources&quot;,
        and its{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          documentation on AI features
        </a>{" "}
        says the same technique is what surfaces a wider set of links than classic Search.
      </p>
      <p>
        For research this is good news. You do not have to guess the exact wording of a long prompt, because the
        engine decomposes it into the shorter, more ordinary queries you already understand. What you have to do
        is make sure one of those sub-answers is unambiguously yours. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/ai-optimization-guide" {...ext}>
          guide to optimising for generative AI features
        </a>{" "}
        is blunt that there is no AI-specific rewrite to perform: its systems understand synonyms and meaning, so
        padding a page with variants does nothing.
      </p>

      <h2>Where do you get real prompt data?</h2>
      <p>
        Prompt data comes from five places, and four of them are free. No tool publishes ChatGPT search volume the
        way Google Keyword Planner publishes query volume, so triangulate instead of waiting for a number that is
        not coming.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>What you get</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Your inbox, phone log and chat transcripts</td>
              <td>The exact wording of real questions, with the constraint attached</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>Search Console performance report</td>
              <td>Classic queries you already get impressions for — the sub-searches fan-out uses</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>Your own reviews and competitors&apos; reviews</td>
              <td>The words customers use for what went right and wrong</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>Asking the assistants directly</td>
              <td>Who gets named today for a prompt, and which pages were cited</td>
              <td>Free</td>
            </tr>
            <tr>
              <td>AI-search analytics platforms</td>
              <td>Tracked prompts at daily frequency, plus relative prompt-demand scores</td>
              <td>From about $95 a month</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        On that last row: vendors are starting to publish demand estimates rather than volumes. Peec AI&apos;s{" "}
        <a href="https://peec.ai/pricing" {...ext}>
          pricing page
        </a>{" "}
        describes a &quot;prompt volume&quot; feature as the relative demand for the topic behind each tracked
        prompt, scored 1 to 5. That is a useful ordering signal and not a search volume, and it is worth keeping
        the distinction straight when someone quotes one at you.
      </p>
      <p>
        Search Console deserves its own note. Its{" "}
        <a href="https://support.google.com/webmasters/answer/7576553" {...ext}>
          performance report
        </a>{" "}
        groups data by the query people typed, and those queries are exactly the short sub-searches an AI answer
        assembles from. Export three months, filter to anything question-shaped, and you have a prompt shortlist
        grounded in your own impressions rather than a guess.
      </p>

      <h2>How do you build the prompt list step by step?</h2>
      <p>
        Six steps, and the first one takes twenty minutes with a notebook rather than any software at all.
      </p>
      <ol>
        <li>
          <strong>Write down the last twenty questions a customer actually asked you.</strong> Full sentences, their
          words, including the constraint — the budget, the neighbourhood, the deadline, the insurer.
        </li>
        <li>
          <strong>Add the decision questions that come before you.</strong> People ask an assistant &quot;do I even
          need a structural engineer for this&quot; long before they ask who to hire. Those prompts are where
          recommendations get formed.
        </li>
        <li>
          <strong>Pull your Search Console queries and keep the question-shaped ones.</strong> Anything with who,
          what, how, which, why, cost, near me or best in it. These confirm which topics you already have standing
          on.
        </li>
        <li>
          <strong>Ask each prompt to ChatGPT, Gemini, Claude and Perplexity yourself.</strong> Record who gets
          named and which sources are cited. A prompt where a directory wins is a different job from one where a
          competitor&apos;s own page wins.
        </li>
        <li>
          <strong>Group prompts by the answer they need, not by wording.</strong> Twelve phrasings of &quot;what
          does this cost&quot; are one page with one honest price section, not twelve thin pages.
        </li>
        <li>
          <strong>Score each group on intent and answerability.</strong> Intent is how close the asker is to
          buying; answerability is whether you can give a specific, checkable answer today. Start where both are
          high.
        </li>
      </ol>

      <h2>How should you prioritise prompts without volume data?</h2>
      <p>
        Rank by commercial intent first and answerability second, because a prompt you can answer specifically is
        worth more than a popular one you can only answer vaguely. Four things move a prompt up the list:
      </p>
      <ul>
        <li>
          <strong>It names a purchase decision.</strong> &quot;Best&quot;, &quot;cost&quot;, &quot;near me&quot;,
          &quot;versus&quot; and &quot;is it worth it&quot; are all late-stage.
        </li>
        <li>
          <strong>You can answer it with a number, a name or a condition.</strong> Specifics are what get quoted;
          see <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI actually quotes</Link>.
        </li>
        <li>
          <strong>A competitor is currently named and you are not.</strong> That is a page-level gap with an
          obvious fix, not a branding problem.
        </li>
        <li>
          <strong>The current answer about you is wrong.</strong> A stale price or an old address outranks any new
          content idea, because it is actively costing you the customers you already earned.
        </li>
      </ul>

      <h2>What does a finished prompt list look like?</h2>
      <p>
        It looks like a short table of customer questions with the page that answers each one, which is why it is
        more useful than a thousand-row keyword export. Here is a worked fragment for a two-van plumbing company,
        built the way the six steps above produce it.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prompt</th>
              <th>Intent</th>
              <th>Who gets named today</th>
              <th>Page that should answer it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>How much does it cost to replace a water heater in Denver?</td>
              <td>High</td>
              <td>A national franchise and a price-guide blog</td>
              <td>Pricing page with a real installed range and what changes it</td>
            </tr>
            <tr>
              <td>Do I need a permit to replace a water heater myself?</td>
              <td>Medium</td>
              <td>The city website</td>
              <td>A short local-code explainer that links the city page</td>
            </tr>
            <tr>
              <td>Who does same-day emergency plumbing in south Denver on a Sunday?</td>
              <td>High</td>
              <td>Two directories, no local company</td>
              <td>Service page stating actual hours and response window</td>
            </tr>
            <tr>
              <td>Is it worth repairing a 12-year-old water heater?</td>
              <td>Medium</td>
              <td>Manufacturer content</td>
              <td>Repair-or-replace guide with the thresholds you really use</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Four rows, four decisions. Notice that two of them are won by publishing a number you may currently keep on
        a clipboard, and one is won simply by stating your Sunday hours in text rather than in an image. Neither is
        a content strategy problem.
      </p>

      <h2>What mistakes make this exercise useless?</h2>
      <p>
        The common failures are all about treating prompts like keywords again, and each one has an obvious tell.
        Watch for these five:
      </p>
      <ul>
        <li>
          <strong>Building the list from a keyword tool only.</strong> Tool exports are fragments by construction,
          so a list with no sentences in it is a list of keywords wearing a new name.
        </li>
        <li>
          <strong>Writing one page per phrasing.</strong> Near-duplicate pages split your own evidence and give an
          engine no reason to prefer any of them.
        </li>
        <li>
          <strong>Tracking branded prompts.</strong> &quot;What is Acme Plumbing&quot; will always name you and
          will never tell you anything.
        </li>
        <li>
          <strong>Chasing prompts you cannot answer specifically.</strong> If the honest answer is &quot;it
          depends&quot; with no numbers attached, you will publish a generic page and be skipped for one that is
          not.
        </li>
        <li>
          <strong>Measuring once.</strong> The same prompt returns different businesses on different days, so a
          single screenshot is not a baseline — a logged schedule is.
        </li>
      </ul>

      <h2>What do you do with the finished list?</h2>
      <p>
        Turn each prompt group into one section that answers it completely and standalone, then publish it where
        the engines can reach it. The shape matters: a question-phrased heading followed immediately by a short,
        self-contained answer is the closest thing to a pre-extracted quote, which is why{" "}
        <Link href="/blog/do-faq-pages-work-for-ai-search">FAQ blocks still work for AI search</Link> even after
        Google retired their rich results.
      </p>
      <p>
        Then measure. Re-ask the same prompts on a fixed schedule and log who gets named, and watch referral
        traffic from assistants separately from Google — our guide to{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">tracking AI traffic in Google Analytics</Link>{" "}
        covers the setup. The honest version of this work is a before-and-after on a prompt list, not a ranking
        report. If you want the current state of yours without building the list first, the{" "}
        <Link href="/start">free 60-second check</Link> asks four assistants about your business and shows you
        what comes back.
      </p>

      <h2>What else do people ask about keyword research for AI search?</h2>

      <h3>Are keywords dead for AI search?</h3>
      <p>
        No — keywords are still how retrieval finds candidate pages, they are just no longer how you plan content.
        Google says its AI features rely on core Search ranking systems, so the pages that get retrieved are
        largely the pages classic SEO would have surfaced anyway.
      </p>

      <h3>Can I see ChatGPT search volume for a prompt?</h3>
      <p>
        No public tool reports ChatGPT prompt volume the way Keyword Planner reports Google volume. What you can
        get is relative demand scoring from AI-search platforms and your own tracked results over time, which is
        enough to order a list even though it is not a volume figure.
      </p>

      <h3>How many prompts should a small business track?</h3>
      <p>
        Ten to twenty is plenty for a single-location business, as long as they are the prompts that precede a
        purchase. Tracking 300 prompts is a reporting exercise; tracking the twenty that decide your bookings is a
        work queue you can actually clear.
      </p>

      <h3>Do long-tail prompts need their own pages?</h3>
      <p>
        Usually not — group them. Several phrasings of the same question belong in one thorough section, because
        thin near-duplicate pages compete with each other and give an engine no reason to prefer any of them.
      </p>

      <h3>Should I write pages for prompts I cannot answer honestly?</h3>
      <p>
        No. If you cannot give a specific answer, a page about it will be generic, and generic pages are the ones
        engines skip in favour of whoever published the actual number. Fix the gap in the business first, then
        write about it.
      </p>
    </div>
  )
}
