import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "bing-ai-performance-report",
  title: "Bing AI Performance Report: How to Use It (2026)",
  description:
    "How to set up and read the Bing AI Performance report: citations, grounding queries, citation share and intents, what it misses, and what to fix next.",
  subtitle:
    "The Bing AI Performance report is a free Bing Webmaster Tools dashboard that shows how often Copilot, Bing AI summaries and select partners cite your pages, and for which grounding queries.",
  date: "2026-11-08",
  updated: "2026-11-08",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "bing ai performance report",
  image: {
    src: "/blog/bing-ai-performance-report.webp",
    alt: "A brass sextant, a pocket compass, a magnifying glass and a pencil lying on a pale nautical chart.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Microsoft launched AI Performance in Bing Webmaster Tools as a public preview on 10 February 2026, free for verified sites.",
    "It counts citations of your pages in Microsoft Copilot, AI summaries in Bing and select partner AI experiences.",
    "Grounding queries are the phrases the AI used to retrieve your content, and Microsoft says the data shown is a sample.",
    "A June 2026 update added Intents, Topics, Citation Share and Compare, all labelled as preview features.",
    "Microsoft's announcements mention no click data and name no partners, so pair the report with analytics and direct checks of other assistants.",
  ],
  sources: [
    {
      title: "Introducing AI Performance in Bing Webmaster Tools Public Preview",
      publisher: "Microsoft Bing Webmaster Blog",
      url: "https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview",
    },
    {
      title: "New AI Visibility Insights in Bing Webmaster Tools: Intents, Topics, Citation Share, Compare",
      publisher: "Microsoft Bing Blog",
      url: "https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare",
    },
    { title: "Documentation | IndexNow.org", publisher: "IndexNow", url: "https://www.indexnow.org/documentation" },
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
        <strong>Short answer:</strong> The Bing AI performance report is a free dashboard in Bing Webmaster Tools
        that counts how often Microsoft Copilot, AI summaries in Bing and select partner AI experiences cite your
        pages. Verify your site, open AI Performance, then use the grounding queries and page list to find topics
        where you are cited and pages that are never used.
      </p>

      <p>
        This guide is for owners, marketers and SEOs who want first-party data on AI citations rather than
        estimates. It covers what the report measures, how to set it up, how to read each number, and where its
        blind spots are. Metric definitions come from Microsoft&apos;s own announcements; the setup route and the
        limits on filtering also draw on how people using the report describe it.
      </p>

      <h2>What is the Bing AI Performance report?</h2>
      <p>
        It is a Bing Webmaster Tools report that shows how your content is cited as a source in AI-generated answers
        across Microsoft&apos;s AI surfaces. Microsoft introduced it on 10 February 2026 in{" "}
        <a
          href="https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview"
          {...ext}
        >
          Introducing AI Performance in Bing Webmaster Tools Public Preview
        </a>
        , describing it as showing how publisher content appears across Microsoft Copilot, AI-generated summaries in
        Bing and select partner integrations.
      </p>
      <p>
        That matters because it is first-party data. Most AI visibility tools work by asking assistants a list of
        prompts and recording the answers. This report instead comes from the engine itself and counts real
        citations of your URLs, though only for Microsoft&apos;s surfaces.
      </p>

      <h2>What does the AI Performance report measure?</h2>
      <p>
        The report measures five things: total citations, average cited pages, grounding queries, page-level citation
        activity and the trend over time. Microsoft defines each one narrowly, and the caveats are worth reading
        before you draw conclusions.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>What Microsoft says it shows</th>
              <th>What it does not show</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total citations</td>
              <td>Times your content was displayed as a source in AI answers in the period</td>
              <td>Where in the answer the citation appeared</td>
            </tr>
            <tr>
              <td>Average cited pages</td>
              <td>Daily average of unique pages from your site shown as sources</td>
              <td>Ranking, authority or each page&apos;s role in an answer</td>
            </tr>
            <tr>
              <td>Grounding queries</td>
              <td>Key phrases the AI used when retrieving your cited content</td>
              <td>The full set; Microsoft says it is a sample</td>
            </tr>
            <tr>
              <td>Page-level citations</td>
              <td>Citation counts per URL</td>
              <td>Page importance, ranking or placement</td>
            </tr>
            <tr>
              <td>Visibility trend</td>
              <td>Citation activity over time across supported surfaces</td>
              <td>Why it changed</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Grounding queries deserve a note. They are not necessarily what a person typed. When an assistant answers,
        it often generates its own search phrases to fetch supporting pages, a process our explainer on{" "}
        <Link href="/blog/what-is-query-fan-out">query fan-out</Link> describes. The report shows those retrieval
        phrases, which makes it a window into how the engine searched, not just what the user asked. Our guide to{" "}
        <Link href="/blog/what-is-grounding-in-ai-search">grounding in AI search</Link> explains why that step
        decides which sites get cited.
      </p>

      <h2>What did the June 2026 update add?</h2>
      <p>
        The June 2026 update added four preview features: Intents, Topics, Citation Share and Compare. Microsoft
        announced them on 16 June 2026 in{" "}
        <a
          href="https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare"
          {...ext}
        >
          New AI Visibility Insights in Bing Webmaster Tools
        </a>
        , saying they were beginning to roll out globally.
      </p>
      <ul>
        <li>
          <strong>Intents</strong> classify grounding queries into categories such as Informational, Commercial,
          Navigational, Learn and Solve, Research, Creation and Local.
        </li>
        <li>
          <strong>Topics</strong> group related grounding queries into themes, so &quot;solar panels&quot; and
          &quot;residential solar installation&quot; can roll up into one topic.
        </li>
        <li>
          <strong>Citation Share</strong> is the percentage of citations for a grounding query that went to your
          site, out of all citations shown across all sites for that query.
        </li>
        <li>
          <strong>Compare</strong> overlays an earlier period on the current view, such as the last 30 days against
          the 30 before.
        </li>
      </ul>
      <p>
        Microsoft is careful about Citation Share. It calls it an observational metric, not a ranking system or a
        competitive scoreboard, and says it does not reveal competitor domains, traffic share or content quality
        scores. It also warns that topic and intent labels may be broad for niche fields. If you want the general
        idea behind the metric, our glossary entry on{" "}
        <Link href="/blog/what-is-ai-citation-share">AI citation share</Link> covers how it is measured elsewhere.
      </p>

      <h2>How do you set up the Bing AI Performance report?</h2>
      <p>
        Setup takes four steps, and the only hard requirement is a verified site in Bing Webmaster Tools. There is
        no separate sign-up or fee for the AI report.
      </p>
      <ol>
        <li>
          <strong>Sign in to Bing Webmaster Tools.</strong> Use a Microsoft account you control long term, not a
          contractor&apos;s.
        </li>
        <li>
          <strong>Add and verify your site.</strong> Bing offers several verification methods, including importing
          sites you have already verified in Google Search Console, which is the quickest route for most people.
        </li>
        <li>
          <strong>Submit your sitemap.</strong> A sitemap helps Bing find every page you want considered, which is
          the precondition for being cited at all.
        </li>
        <li>
          <strong>Open AI Performance.</strong> Pick a date range, then switch between the grounding queries and
          pages views. New sites can take a while to show data, so check back after the first few days.
        </li>
      </ol>
      <p>
        While you are there, set up IndexNow. The{" "}
        <a href="https://www.indexnow.org/documentation" {...ext}>
          IndexNow documentation
        </a>{" "}
        describes a simple protocol for telling participating engines that a URL was added, updated or deleted,
        using a key file on your site. Many CMS platforms and plugins support it already. A successful ping means
        the URL was received, not that it will be indexed or cited.
      </p>

      <h2>How should you read the report to decide what to fix?</h2>
      <p>
        Read it from the page view first, because the clearest action is finding pages that are indexed but never
        cited. There are four practical readings.
      </p>
      <ol>
        <li>
          <strong>Cited pages are your proven formats.</strong> Look at what your most-cited pages have in common:
          direct answers, tables, FAQs, specific numbers. Microsoft&apos;s own recommendations include clear headings,
          tables and FAQ sections so content is easier to reference accurately.
        </li>
        <li>
          <strong>Uncited pages are your backlog.</strong> A service page that never appears may be thin, vague or
          missing the facts an answer needs. Rewrite it with a plain answer in the first paragraph.
        </li>
        <li>
          <strong>Grounding queries are your topic map.</strong> If the engine retrieves you for a phrase you barely
          cover, deepen that page or write a dedicated one. If it never retrieves you for your core service, that is
          the biggest gap.
        </li>
        <li>
          <strong>Compare shows direction, not cause.</strong> After you publish changes, compare periods to see if
          citations moved. Microsoft notes that citation patterns also shift with model changes, freshness and user
          behaviour, so one period is not proof.
        </li>
      </ol>
      <p>
        Microsoft&apos;s announcement also recommends supporting claims with evidence, keeping content current, using
        IndexNow when pages change, keeping text, images and video consistent about the same entities, and, for
        local businesses, keeping address, hours and contact details current in Bing Places for Business. None of
        that is new to good SEO, which is the point: the report tells you where to apply it.
      </p>

      <h2>How does it compare with Google Search Console?</h2>
      <p>
        Bing reports AI citations separately, while Google folds AI feature appearances into its normal search data.
        Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        page says sites appearing in AI Overviews and AI Mode are included in overall search traffic in Search
        Console, under the Web search type, and that there are no extra requirements to appear in those features.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Bing AI Performance</th>
              <th>Google Search Console</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Separate AI report?</td>
              <td>Yes</td>
              <td>No; AI features counted in Web search data</td>
            </tr>
            <tr>
              <td>Unit measured</td>
              <td>Citations of your pages</td>
              <td>Impressions and clicks</td>
            </tr>
            <tr>
              <td>Query data</td>
              <td>Sampled grounding queries</td>
              <td>User search queries</td>
            </tr>
            <tr>
              <td>Clicks</td>
              <td>Not shown</td>
              <td>Shown</td>
            </tr>
            <tr>
              <td>Surfaces</td>
              <td>Copilot, Bing AI summaries, select partners</td>
              <td>Google Search, including AI Overviews and AI Mode</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>What does the report not tell you?</h2>
      <p>
        The report does not tell you about clicks or name the partner experiences it includes, and users report
        that it cannot filter Copilot apart from Bing summaries. Microsoft&apos;s announcements do not list ChatGPT,
        Gemini, Claude or Perplexity as covered surfaces, so you should not read it as a measure of those assistants.
      </p>
      <p>
        Bing&apos;s index does matter beyond Copilot, which our explainer on{" "}
        <Link href="/blog/does-chatgpt-use-bing">whether ChatGPT uses Bing</Link> unpacks, but a Bing citation
        count is not a ChatGPT recommendation count. To see traffic, use your analytics; our guide to{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">tracking AI traffic in Google Analytics</Link>{" "}
        shows how to separate AI referrals. To see what the other assistants actually say, ask them directly or use
        a monitoring tool. The wider method is in{" "}
        <Link href="/blog/how-to-measure-ai-visibility">how to measure AI visibility</Link>, and the Copilot side is
        covered in <Link href="/blog/how-to-get-recommended-by-microsoft-copilot">how to get recommended by Copilot</Link>.
      </p>
      <p>
        Alphaa covers the part the Bing report does not. It asks ChatGPT, Gemini, Claude and Perplexity about your
        business every week, then drafts the fixes, such as clearer service pages, FAQs and structured data, for you
        to approve and publish to WordPress, Shopify or Webflow, from $99 a month. It does not track Copilot, so the
        Bing report is a good free companion. You can see what the four assistants say today with the{" "}
        <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else do people ask about the Bing AI Performance report?</h2>

      <h3>Is the Bing AI Performance report free?</h3>
      <p>
        Yes, it is part of Bing Webmaster Tools, which is free for verified site owners. Microsoft launched it as a
        public preview, so features and definitions may still change.
      </p>

      <h3>Does the AI Performance report include ChatGPT?</h3>
      <p>
        Microsoft&apos;s announcements do not say so. They list Microsoft Copilot, AI summaries in Bing and select
        partner integrations without naming the partners, so treat ChatGPT as not covered unless Microsoft says
        otherwise.
      </p>

      <h3>Why do my grounding queries look different from what people search?</h3>
      <p>
        Grounding queries are the phrases the AI used to retrieve your content, not the user&apos;s question. Assistants
        often rewrite a question into shorter search phrases, and Microsoft says the list shown is a sample.
      </p>

      <h3>Does a high citation count mean my page ranks well?</h3>
      <p>
        No, Microsoft says citation counts do not indicate ranking, authority or placement within an answer. They show
        how often a page was used as a source, which is useful for spotting patterns rather than scoring pages.
      </p>

      <h3>How quickly will changes show up in the report?</h3>
      <p>
        There is no fixed timeline, because Bing has to recrawl the page and the AI has to choose to use it. Pinging
        IndexNow after an update helps Bing learn about the change, and Compare lets you check the trend afterwards.
      </p>
    </div>
  )
}
