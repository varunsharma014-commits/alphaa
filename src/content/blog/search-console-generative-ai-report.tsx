import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "search-console-generative-ai-report",
  title: "Search Console Generative AI Report: How to Use It",
  description:
    "How to find and read the Search Console generative AI report: what AI Overviews and AI Mode impressions mean, the filters, the limits, and what to do next.",
  subtitle:
    "The Search Console generative AI report shows how often your pages appeared in AI Overviews and AI Mode, by page, country, device and date, but it shows impressions only.",
  date: "2026-11-11",
  updated: "2026-11-11",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "search console generative ai report",
  image: {
    src: "/blog/search-console-generative-ai-report.webp",
    alt: "A small brass telescope on a tripod standing on a wooden desk next to an open blank notebook and a pencil, in soft window light.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google announced the generative AI performance reports on 3 June 2026 and rolled them out to all websites worldwide by 31 August 2026.",
    "The Search report counts impressions in AI Overviews and AI Mode, grouped by page, country, device or date.",
    "It shows no clicks, queries or position; those AI clicks are still counted inside the main Performance report.",
    "A missing report usually means too few AI impressions, or that the site was excluded with the Search generative AI control.",
    "The report covers Google only, so it says nothing about ChatGPT, Claude, Gemini or Perplexity.",
  ],
  sources: [
    {
      title: "Generative AI performance report (Search) - Search Console Help",
      publisher: "Google Search Console Help",
      url: "https://support.google.com/webmasters/answer/16984139",
    },
    {
      title: "Introducing Search Generative AI performance reports in Search Console",
      publisher: "Google Search Central Blog",
      url: "https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports",
    },
    {
      title: "What are impressions, position, and clicks? - Search Console Help",
      publisher: "Google Search Console Help",
      url: "https://support.google.com/webmasters/answer/7042828",
    },
    {
      title: "Search generative AI control - Search Console Help",
      publisher: "Google Search Console Help",
      url: "https://support.google.com/webmasters/answer/16908024",
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
        <strong>Short answer:</strong> The Search Console generative AI report shows how many times links to your site
        appeared in Google&apos;s AI Overviews and AI Mode. Open it from the Performance section, then group impressions
        by page, country, device or date. It shows impressions only, with no clicks or queries, so pair it with the
        main Performance report and analytics.
      </p>

      <p>
        This guide is for site owners and marketers who have seen the new report in Search Console and want to know
        what it measures, how to read it without fooling yourself, and what to change once you have the numbers.
      </p>

      <h2>What is the Search Console generative AI report?</h2>
      <p>
        The generative AI performance report is a free Search Console report that counts your site&apos;s impressions
        inside Google&apos;s generative AI features on Search. Google{" "}
        <a href="https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports" {...ext}>
          announced it on 3 June 2026
        </a>{" "}
        alongside a separate report for Discover, first for a subset of sites, and added a note that as of 31 August
        2026 the insights had rolled out to all websites worldwide.
      </p>
      <p>
        According to Google&apos;s{" "}
        <a href="https://support.google.com/webmasters/answer/16984139" {...ext}>
          help page for the report
        </a>
        , it currently includes two features: AI Overviews and AI Mode. Google says it expects to update that list
        over time, and that experiments in Search Labs are not included.
      </p>

      <h2>How do you open the generative AI report?</h2>
      <p>
        You open it from the Performance section of a verified Search Console property, where it sits next to the
        Search, Discover and News reports. If you have not verified your site yet, do that first; there is no way to
        see this data for a site you do not own.
      </p>
      <ol>
        <li>
          <strong>Sign in to Search Console</strong> and choose the property for your site. A domain property gives
          the widest view.
        </li>
        <li>
          <strong>Open Performance, then the generative AI report for Search.</strong> The default view shows total
          impressions over time.
        </li>
        <li>
          <strong>Pick a date range.</strong> Start with the longest range available so you can see a trend rather than
          a single week.
        </li>
        <li>
          <strong>Choose a dimension tab under the chart.</strong> Pages, Countries, Dates or Devices.
        </li>
        <li>
          <strong>Set the search type filter</strong> if you want to separate text searches from multimodal searches.
        </li>
      </ol>

      <h2>Why can&apos;t you see the generative AI report?</h2>
      <p>
        You usually cannot see the report because your site has not had enough impressions in AI features yet. Google
        says this is the most common reason, and new or small sites hit it often.
      </p>
      <p>
        The other reason is a setting. Search Console now has a{" "}
        <a href="https://support.google.com/webmasters/answer/16908024" {...ext}>
          Search generative AI control
        </a>{" "}
        under Settings, and a site set to exclude itself receives no impressions or traffic from these features, so
        the report stays empty. Check that setting before assuming you have a visibility problem. We explain the
        control in{" "}
        <Link href="/blog/how-to-opt-out-of-ai-overviews">how to opt out of AI Overviews</Link>.
      </p>

      <h2>What does each part of the report show?</h2>
      <p>
        Each part of the report shows impressions, grouped by the dimension you choose. This table summarises what
        Google&apos;s documentation says each view contains.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>View</th>
              <th>What it groups by</th>
              <th>Useful for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chart</td>
              <td>Total impressions for the property over time</td>
              <td>Spotting trends and sudden drops</td>
            </tr>
            <tr>
              <td>Pages</td>
              <td>Final URL linked by the AI feature, mostly assigned to the canonical URL</td>
              <td>Finding which pages AI cites</td>
            </tr>
            <tr>
              <td>Countries</td>
              <td>Country where the search started</td>
              <td>Checking you appear where you sell</td>
            </tr>
            <tr>
              <td>Dates</td>
              <td>Days, weeks or months, in Pacific Time</td>
              <td>Before-and-after comparisons</td>
            </tr>
            <tr>
              <td>Devices</td>
              <td>Desktop, tablet or mobile</td>
              <td>Seeing where AI visibility comes from</td>
            </tr>
            <tr>
              <td>Search type filter</td>
              <td>Web text-based or web multimodal, such as Lens and Circle to Search</td>
              <td>Separating image-led searches</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Two details trip people up. On the chart, two results from your site in the same AI answer count as one
        impression, because the chart aggregates by property; filter by URL and it aggregates by page instead. And the
        newest data can be preliminary, shown as a dotted line, so ignore the last day or two.
      </p>

      <h2>What counts as an impression in AI Overviews and AI Mode?</h2>
      <p>
        An impression counts each time a link to your site is shown to a user inside an AI Overview or AI Mode response.
        Google&apos;s page on{" "}
        <a href="https://support.google.com/webmasters/answer/7042828" {...ext}>
          impressions, position and clicks
        </a>{" "}
        says standard impression rules apply to both features.
      </p>
      <p>The same page sets out how the two features are counted in the wider Performance report.</p>
      <ul>
        <li>
          <strong>AI Overviews:</strong> the whole overview occupies one position, and every link in it gets that same
          position. A click on an external link counts as a click.
        </li>
        <li>
          <strong>AI Mode:</strong> position follows the normal results-page method. A follow-up question counts as a
          new query, with its own impressions, position and clicks.
        </li>
      </ul>

      <h2>What does the generative AI report not show?</h2>
      <p>
        The report does not show clicks, click-through rate, position or the queries that triggered your impressions.
        Google&apos;s announcement lists impressions, pages, countries, devices and dates, and says it may add metrics
        over time.
      </p>
      <p>
        Clicks from AI features are not lost, though. Google&apos;s guide to{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features and your website
        </a>{" "}
        says AI Overviews and AI Mode traffic is included in the main Performance report under the Web search type. The
        generative AI report data comes from that same Web search type. What you cannot do is separate AI clicks from
        ordinary clicks there.
      </p>
      <p>
        The other limits carry over from the main report: the 1,000-row table limit applies, chart and table totals
        can differ because of how they aggregate, and values shown as ~ or - export as zero.
      </p>

      <h2>How should you read the generative AI report?</h2>
      <p>
        Read it as a list of which pages Google trusts enough to cite, and as a trend line, not as a scoreboard. These
        are the questions worth asking of the data.
      </p>
      <ol>
        <li>
          <strong>Which pages get AI impressions?</strong> Sort the Pages tab. Often it is a handful of guides or FAQ
          pages rather than your homepage, which tells you what format Google finds quotable.
        </li>
        <li>
          <strong>Which important pages get none?</strong> Compare the list with your key service or product pages.
          Missing pages are your first candidates for clearer, answer-first rewrites.
        </li>
        <li>
          <strong>Do countries match your market?</strong> A local business with most impressions abroad has a
          relevance problem, not a success.
        </li>
        <li>
          <strong>Did a change move the line?</strong> Use the Dates tab to compare the weeks before and after you
          rewrote a page, allowing time for Google to recrawl it.
        </li>
        <li>
          <strong>Are impressions turning into visits?</strong> Check the same pages in the main Performance report and
          in analytics. Our guide to{" "}
          <Link href="/blog/how-to-track-ai-traffic-google-analytics">tracking AI traffic in Google Analytics</Link>{" "}
          shows how to separate referrals from AI assistants.
        </li>
      </ol>

      <h2>How do you get more impressions in AI Overviews and AI Mode?</h2>
      <p>
        You get more AI impressions by doing the same things that make a page eligible and useful in ordinary search,
        because Google says there are no extra requirements. Its{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features guide
        </a>{" "}
        says a page must be indexed and eligible to show with a snippet, and that no special files or schema are
        needed.
      </p>
      <ul>
        <li>Allow crawling in robots.txt and at your CDN or host.</li>
        <li>Put important content in text, not only in images or scripts.</li>
        <li>Link to key pages from elsewhere on your site.</li>
        <li>Make sure structured data matches the visible text.</li>
        <li>Keep your Business Profile and Merchant Center details current.</li>
      </ul>
      <p>
        In practice, pages that answer one question clearly in the first lines tend to be easier to quote. Our guides on{" "}
        <Link href="/blog/how-google-ai-overviews-choose-sources">how AI Overviews choose sources</Link> and{" "}
        <Link href="/blog/how-to-show-up-in-google-ai-mode">showing up in Google AI Mode</Link> go into the detail.
      </p>

      <h2>What does the report miss about AI visibility?</h2>
      <p>
        The report misses every AI assistant that is not Google Search, which for many businesses is most of the
        picture. It says nothing about ChatGPT, Claude, Gemini or Perplexity, and nothing about what any of them say
        when they mention you without linking.
      </p>
      <p>
        Bing Webmaster Tools covers Microsoft&apos;s surfaces, and our{" "}
        <Link href="/blog/best-free-ai-visibility-checkers">list of free AI visibility checkers</Link> covers the
        rest. Alphaa asks ChatGPT, Gemini, Claude and Perplexity your customers&apos; questions every week, then drafts
        the page rewrites, FAQs and structured data for you to approve, from $99 a month. The{" "}
        <Link href="/start">free 60-second check</Link> shows where you stand today.
      </p>

      <h2>What else do people ask about the generative AI report?</h2>

      <h3>Is the Search Console generative AI report free?</h3>
      <p>
        Yes, it is part of Search Console, which is free for any site you can verify. Google rolled it out to all
        websites worldwide by 31 August 2026.
      </p>

      <h3>Does the generative AI report include Gemini?</h3>
      <p>
        No, it covers AI Overviews and AI Mode on Google Search, and a separate report covers Discover. The Gemini app
        is not listed in Google&apos;s documentation for the report.
      </p>

      <h3>Are AI Overview clicks counted in Search Console?</h3>
      <p>
        Yes, a click on an external link in an AI Overview counts as a click in the main Performance report. It is
        mixed in with ordinary Web search clicks, so you cannot isolate it there.
      </p>

      <h3>Can I export the generative AI report data?</h3>
      <p>
        Yes, the report has an export button for both the chart and the table. Values shown as ~ or - in the report
        export as zeros.
      </p>

      <h3>Why did my AI impressions suddenly drop?</h3>
      <p>
        A sudden drop can come from fewer AI answers being shown for your topics, a competitor being cited instead, or a
        crawling or indexing problem. Check the Search generative AI control setting and the page indexing report
        first.
      </p>
    </div>
  )
}
