import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ai-visibility-audit",
  title: "How to Do an AI Visibility Audit (Step by Step)",
  description:
    "A step-by-step AI visibility audit: test what ChatGPT, Gemini, Claude and Perplexity say about you, then check crawlers, schema, listings and sources.",
  subtitle:
    "An AI visibility audit tests what AI assistants say about your business today, then traces each gap to a cause on your site or across the web that you can fix.",
  date: "2026-10-29",
  updated: "2026-10-29",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "ai visibility audit",
  image: {
    src: "/blog/ai-visibility-audit.webp",
    alt: "A clipboard with a blank checklist and a pen on a wooden desk beside a magnifying glass, a tape measure and a flashlight.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "An AI visibility audit has two halves: test what assistants answer, then trace each gap to a fixable cause.",
    "OpenAI says sites that block OAI-SearchBot will not be shown in ChatGPT search answers, except as navigational links.",
    "GPTBot, ClaudeBot and Google-Extended govern AI training, so blocking them is a separate choice from search visibility.",
    "Google says AI Overviews and AI Mode have no extra requirements beyond being indexed and eligible for a snippet.",
    "Run each test question more than once, because AI answers vary between runs.",
  ],
  sources: [
    {
      title: "Overview of OpenAI Crawlers",
      publisher: "OpenAI",
      url: "https://platform.openai.com/docs/bots",
    },
    { title: "Perplexity Crawlers - Perplexity", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
    {
      title: "Does Anthropic crawl data from the web, and how can site owners block the crawler?",
      publisher: "Claude Help Center",
      url: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> An AI visibility audit checks what ChatGPT, Gemini, Claude and Perplexity say
        about your business, then finds why. Ask each assistant 10 to 20 real customer questions, record who gets named,
        then check crawler access, page content, structured data, business listings and the sources the assistants cite.
        Fix the biggest gap first.
      </p>

      <p>
        This guide is for owners and marketers who want a one-off diagnosis they can do in an afternoon, with free tools.
        It covers what to test, how to run each check, how to score what you find and what to fix first.
      </p>

      <h2>What is an AI visibility audit?</h2>
      <p>
        An AI visibility audit is a one-time diagnosis of whether AI assistants mention, describe and cite your business
        correctly, and of the specific causes when they do not. It differs from ongoing tracking: tracking tells you a
        number each week, while an audit explains the number and produces a fix list.
      </p>
      <p>
        The audit has two halves. The <em>outside-in</em> half asks the assistants questions and records their answers.
        The <em>inside-out</em> half inspects the things those answers are built from: whether AI crawlers can reach your
        pages, whether the pages state the facts plainly, and whether the rest of the web agrees with them. If you want
        a repeatable scorecard after the audit, see{" "}
        <Link href="/blog/how-to-measure-ai-visibility">how to measure AI visibility</Link>.
      </p>

      <h2>What should an AI visibility audit check?</h2>
      <p>
        A complete audit checks six areas, from the answers themselves down to the technical access underneath them. The
        table lists each area, the question it answers and a free way to check it.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Question it answers</th>
              <th>Free way to check</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Answers</td>
              <td>Do assistants name us, and is what they say true?</td>
              <td>Ask each assistant your question list in a fresh chat</td>
            </tr>
            <tr>
              <td>Crawler access</td>
              <td>Can the AI search crawlers fetch our pages?</td>
              <td>Read robots.txt and firewall rules against each vendor&apos;s crawler docs</td>
            </tr>
            <tr>
              <td>Readable content</td>
              <td>Is the answer in the HTML, not only in scripts or images?</td>
              <td>View page source and search for your key facts</td>
            </tr>
            <tr>
              <td>Structured data</td>
              <td>Do we state name, address, hours and services in machine-readable form?</td>
              <td>Google&apos;s Rich Results Test</td>
            </tr>
            <tr>
              <td>Entity consistency</td>
              <td>Do our listings and profiles agree with each other?</td>
              <td>Compare Google Business Profile, directories and social profiles</td>
            </tr>
            <tr>
              <td>Cited sources</td>
              <td>Which pages do assistants trust for our category, and are we on them?</td>
              <td>Open the citations in each answer</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How do you run an AI visibility audit step by step?</h2>
      <p>
        You run an AI visibility audit in eight steps, starting with the questions your customers actually ask and ending
        with a ranked fix list. Keep a spreadsheet open; each step adds columns to it.
      </p>
      <ol>
        <li>
          <strong>Write 10 to 20 customer questions.</strong> Mix category questions (&quot;best emergency electrician in
          Denver&quot;), comparison questions (&quot;X vs Y for a small office&quot;) and brand questions (&quot;is X any
          good&quot;). Use the words customers use on calls and in reviews, not your internal jargon. Our guide to{" "}
          <Link href="/blog/keyword-research-for-ai-search">keyword research for AI search</Link> covers how to find
          them.
        </li>
        <li>
          <strong>Ask every assistant, more than once.</strong> Put each question to ChatGPT, Gemini, Claude and
          Perplexity in a fresh chat. Record whether you are named, in what position, whether the facts are right, and
          which competitors and sources appear. Run each question two or three times, because answers vary between runs.
        </li>
        <li>
          <strong>Check crawler access.</strong> Open yoursite.com/robots.txt and compare it with each vendor&apos;s
          documentation. OpenAI&apos;s{" "}
          <a href="https://platform.openai.com/docs/bots" {...ext}>
            crawler overview
          </a>{" "}
          says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers, though they can still
          appear as navigational links. Perplexity&apos;s{" "}
          <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
            crawler page
          </a>{" "}
          recommends allowing PerplexityBot to appear in its results, and Anthropic says blocking Claude-SearchBot may
          reduce your visibility in Claude&apos;s search results. Check your CDN or firewall too, since a bot-blocking
          rule can refuse these crawlers even when robots.txt allows them.
        </li>
        <li>
          <strong>Separate training from search.</strong> GPTBot, ClaudeBot and Google-Extended control whether content
          may be used for model training, and blocking them is a legitimate choice. Make sure nobody blocked the search
          crawlers by accident while blocking the training ones. Our{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> has the full list.
        </li>
        <li>
          <strong>Confirm the content is readable.</strong> View the page source of your home, services and pricing
          pages and search for the facts a customer needs: services, area served, prices or price ranges, hours. If they
          only appear after JavaScript runs, some crawlers may miss them; see{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
        </li>
        <li>
          <strong>Test structured data.</strong> Run key pages through Google&apos;s Rich Results Test. Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
            LocalBusiness documentation
          </a>{" "}
          says this markup lets you tell Google about hours, departments, reviews and more. Missing or broken markup is
          a quick fix; our <Link href="/blog/schema-markup-for-ai-search">schema markup guide</Link> shows the fields
          that matter.
        </li>
        <li>
          <strong>Check entity consistency.</strong> Compare your name, address, phone, website and categories across
          Google Business Profile, Bing Places, Apple Business Connect, Yelp, industry directories and social profiles.
          Every mismatch is a reason for an assistant to hesitate or repeat stale facts.
        </li>
        <li>
          <strong>Audit the sources assistants cite.</strong> Open every citation from step two. List the review sites,
          directories, &quot;best of&quot; articles and forums that keep appearing, then note which ones mention you and
          which only mention competitors. That list becomes your off-site plan.
        </li>
      </ol>

      <h2>How do you score the results and decide what to fix first?</h2>
      <p>
        Score each finding by how many questions it affects and how hard it is to fix, then work from high impact and low
        effort downwards. Most audits produce the same handful of patterns:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>What you found</th>
              <th>Likely cause</th>
              <th>First fix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Not named for any question</td>
              <td>Crawler blocked, or site does not state what you do and where</td>
              <td>Unblock search crawlers; add plain service and area pages</td>
            </tr>
            <tr>
              <td>Named, but with wrong facts</td>
              <td>Stale listings or conflicting profiles</td>
              <td>Correct listings at the source; update site facts</td>
            </tr>
            <tr>
              <td>Named only for your brand name</td>
              <td>No page answers the category question</td>
              <td>Write pages and FAQs that answer those questions directly</td>
            </tr>
            <tr>
              <td>Competitor always named first</td>
              <td>They appear on the sources assistants cite</td>
              <td>Earn reviews and mentions on those same sources</td>
            </tr>
            <tr>
              <td>Visible in one assistant only</td>
              <td>That engine&apos;s crawler or index differs</td>
              <td>Check that engine&apos;s crawler and index specifically</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        For wrong facts specifically, our guide to{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">fixing wrong AI information</Link> walks through
        where corrections need to land. For the competitor pattern, see{" "}
        <Link href="/blog/why-ai-recommends-your-competitor">why AI recommends your competitor</Link>.
      </p>

      <h2>Does Google need anything special for AI Overviews?</h2>
      <p>
        No, Google says there are no additional requirements to appear in AI Overviews or AI Mode beyond normal Search
        eligibility. In{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>
        , Google says a page must be indexed and eligible to be shown with a snippet to be a supporting link, and that
        meeting the requirements does not guarantee being shown. So the Google part of your audit is ordinary
        indexing hygiene: no accidental noindex, no nosnippet on pages you want quoted, and pages that answer the
        question. Check for those controls on your key pages while you are in the page source.
      </p>

      <h2>How often should you repeat an AI visibility audit?</h2>
      <p>
        Repeat a full audit every quarter, or after any site redesign, migration, CDN change or rebrand, and track the
        answers more often in between. Redesigns and new firewall rules are the most common way a site that was visible
        quietly stops being fetched.
      </p>
      <p>
        Between audits, re-ask your question list monthly at minimum. Expect some movement even when nothing changed,
        since assistants vary their answers; look for trends across several runs rather than reacting to one.
      </p>

      <h2>Can you automate an AI visibility audit?</h2>
      <p>
        Yes, partly: trackers can automate the asking, and agents can automate some of the fixing, but someone still has
        to approve what changes on your site. Monitoring tools run your question list on a schedule and log mentions and
        citations; our <Link href="/blog/best-aeo-tools-2026">best AEO tools of 2026</Link> compares them.
      </p>
      <p>
        Alphaa is an AI agent that does both halves for one business. It asks ChatGPT, Gemini, Claude and Perplexity your
        customers&apos; questions every week, runs a 23-point check of what those assistants can read on your site, and
        drafts the fixes, such as FAQ pages, structured data and llms.txt, for you to approve before anything is published
        to WordPress, Shopify or Webflow. Plans start at $99 a month. To see the outside-in half for free, run the{" "}
        <Link href="/start">60-second AI check</Link>.
      </p>

      <h2>What else do people ask about AI visibility audits?</h2>

      <h3>How long does an AI visibility audit take?</h3>
      <p>
        A manual audit for one business takes about an afternoon with 10 to 20 questions. Most of the time goes on asking
        the assistants and opening their citations; the technical checks take under an hour once you know where to look.
      </p>

      <h3>Is an AI visibility audit the same as an SEO audit?</h3>
      <p>
        No, though they overlap. An SEO audit checks how Google ranks your pages, while an AI visibility audit also tests
        what assistants actually say, which crawlers they use and which third-party sources they trust for your category.
      </p>

      <h3>Should I block GPTBot during an audit?</h3>
      <p>
        That is a business decision, not an audit finding. OpenAI says GPTBot is used for training and OAI-SearchBot for
        search, and the settings are independent, so you can block training while still allowing ChatGPT search.
      </p>

      <h3>Why do I get different answers when I repeat a question?</h3>
      <p>
        AI assistants generate each answer fresh, so wording, order and even which businesses appear can change between
        runs. That is why an audit asks each question more than once and looks at the pattern.
      </p>

      <h3>Can an audit guarantee that ChatGPT will recommend me?</h3>
      <p>
        No. An audit finds and removes the obstacles you control, such as blocked crawlers, missing facts and
        inconsistent listings, but no one can force an assistant to name a business.
      </p>
    </div>
  )
}
