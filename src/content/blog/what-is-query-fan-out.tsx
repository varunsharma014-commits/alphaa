import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "what-is-query-fan-out",
  title: "What Is Query Fan-Out? How AI Search Splits Your Question",
  description:
    "Query fan-out is how Google AI Mode and AI Overviews split one question into many related searches, then merge the results. What it means for your pages.",
  subtitle:
    "Query fan-out is the technique AI search uses to break one question into several related sub-searches, run them at once, and combine what it finds into a single answer.",
  date: "2026-10-27",
  updated: "2026-10-27",
  readMins: 5,
  tag: "Glossary",
  kind: "glossary",
  keyphrase: "what is query fan-out",
  image: {
    src: "/blog/what-is-query-fan-out.webp",
    alt: "A beam of light passing through a glass prism and spreading into a rainbow toward five blank white cards in an arc.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google describes query fan-out as issuing multiple related searches across subtopics and data sources, then combining the results.",
    "Google says both AI Overviews and AI Mode may use query fan-out.",
    "Google says Deep Search uses the same technique and can issue hundreds of searches for one question.",
    "A page can be cited for a sub-question the user never typed, so pages that answer related questions get more chances.",
  ],
  sources: [
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Expanding AI Overviews and introducing AI Mode", publisher: "Google", url: "https://blog.google/products-and-platforms/products/search/ai-mode-search/" },
    {
      title: "AI Mode in Google Search: Updates from Google I/O 2025",
      publisher: "Google",
      url: "https://blog.google/products-and-platforms/products/search/google-search-ai-mode-update/",
    },
    {
      title: "Google expert explains AI Mode in Search’s query fan-out method",
      publisher: "Google",
      url: "https://blog.google/company-news/inside-google/googlers/how-google-ai-visual-search-works/",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Query fan-out is the technique AI search uses to split one question into
        several related searches, run them at the same time, and merge the results into one answer. Google uses it
        in AI Mode and AI Overviews. For a business, it means your page can be cited for a sub-question the customer
        never typed.
      </p>

      <h2>What does query fan-out mean?</h2>
      <p>
        Query fan-out means one question &quot;fans out&quot; into many smaller searches before the AI writes its
        answer. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features documentation
        </a>{" "}
        says both AI Overviews and AI Mode may use a query fan-out technique, issuing multiple related searches across
        subtopics and data sources while the response is being built.
      </p>
      <p>
        Google first described it when it introduced AI Mode in March 2025. The{" "}
        <a href="https://blog.google/products-and-platforms/products/search/ai-mode-search/" {...ext}>
          launch post
        </a>{" "}
        says AI Mode issues multiple related searches concurrently across subtopics and multiple data sources, then
        brings the results together into an easy-to-understand response. In a later{" "}
        <a href="https://blog.google/company-news/inside-google/googlers/how-google-ai-visual-search-works/" {...ext}>
          Google explainer
        </a>
        , Search engineering director Dounia Berrada summed it up as AI Mode doing a dozen searches for you in the
        time it takes to do one.
      </p>

      <h2>How does query fan-out work step by step?</h2>
      <p>Query fan-out works in four broad steps, starting with breaking the question into its parts.</p>
      <ol>
        <li>
          <strong>Break the question down.</strong> The model identifies the subtopics inside the question, such as
          price, location, suitability and alternatives.
        </li>
        <li>
          <strong>Search each part at once.</strong> It issues a related search for each subtopic, across the web
          index and other data sources.
        </li>
        <li>
          <strong>Read the results.</strong> It reads the pages and data that come back for every sub-search.
        </li>
        <li>
          <strong>Combine and cite.</strong> It writes one answer that draws on the results, with links to the pages it
          used.
        </li>
      </ol>
      <p>
        Google&apos;s example in the Berrada explainer is a photo of a garden: asking whether the plants will survive in
        shade, suit the local climate and need much upkeep sends AI Mode off to research each plant&apos;s care
        requirements separately before answering. The{" "}
        <a href="https://blog.google/products-and-platforms/products/search/google-search-ai-mode-update/" {...ext}>
          I/O 2025 update
        </a>{" "}
        adds that Deep Search uses the same technique taken further, and can issue hundreds of searches for one
        question.
      </p>

      <h2>How is query fan-out different from a normal search?</h2>
      <p>
        A normal search matches one query to one ranked list of pages, while query fan-out runs many queries and builds
        one answer from all of them. The difference changes which pages get used.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Classic search</th>
              <th>Query fan-out</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Queries run</td>
              <td>The one the user typed</td>
              <td>Several related sub-queries at once</td>
            </tr>
            <tr>
              <td>Output</td>
              <td>A ranked list of links</td>
              <td>One written answer with supporting links</td>
            </tr>
            <tr>
              <td>Pages that can appear</td>
              <td>Pages relevant to the exact query</td>
              <td>Pages relevant to any of the sub-queries</td>
            </tr>
            <tr>
              <td>Where Google uses it</td>
              <td>Standard results</td>
              <td>AI Mode, AI Overviews and Deep Search</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Why does query fan-out matter for a business website?</h2>
      <p>
        Query fan-out matters because the AI searches for the follow-up questions a customer would ask, so a page that
        answers those specific questions has more ways to be cited. Someone asking for &quot;a good dentist near me who
        is open Saturdays and takes my insurance&quot; may trigger separate searches about hours, insurance and
        reviews. A page that states those facts plainly can be picked up for each one.
      </p>
      <p>
        It also explains why a single keyword-stuffed page underperforms. Pages that cover a topic in clear sections,
        each answering one question, fit the way the sub-searches are split. Google still says no special markup or AI
        text files are needed to appear in these features; the page must simply be indexed and eligible for a snippet.
        More on how Google picks the pages is in{" "}
        <Link href="/blog/how-google-ai-overviews-choose-sources">how Google AI Overviews choose sources</Link> and{" "}
        <Link href="/blog/how-to-show-up-in-google-ai-mode">how to show up in Google AI Mode</Link>.
      </p>

      <h2>How do you write pages for query fan-out?</h2>
      <p>
        You write for query fan-out by answering the related questions around your main topic on your own pages, each
        in its own clearly headed section. Practical habits that help:
      </p>
      <ul>
        <li>List the follow-up questions customers ask on calls and in reviews, and answer each one on the page.</li>
        <li>Phrase headings as questions and put the direct answer in the first sentence below.</li>
        <li>State concrete facts in text: prices, hours, service areas, specialities and what is included.</li>
        <li>Give each service its own page, so a sub-search about one service finds a focused answer.</li>
        <li>Link related pages together so the whole topic is easy to find.</li>
      </ul>
      <p>
        Finding those questions is covered in{" "}
        <Link href="/blog/keyword-research-for-ai-search">keyword research for AI search</Link>. Alphaa, an AI agent
        that checks what ChatGPT, Gemini, Claude and Perplexity say about your business each week, drafts these
        answer pages and publishes them once you approve. The <Link href="/start">free 60-second AI check</Link> shows
        where you stand today.
      </p>

      <h2>What else do people ask about query fan-out?</h2>

      <h3>Does ChatGPT use query fan-out?</h3>
      <p>
        Query fan-out is Google&apos;s name for its technique, and Google is the company that documents it. Other AI
        search tools also run web searches before answering, but they describe their methods in their own terms, so
        check each vendor&apos;s documentation rather than assuming they work the same way.
      </p>

      <h3>Can I see which fan-out queries Google ran?</h3>
      <p>
        No, Google does not show the sub-queries it issues. You can infer them by looking at which questions the
        answer covers and which pages it links to for each part.
      </p>

      <h3>Does every search trigger query fan-out?</h3>
      <p>
        Google says AI Overviews and AI Mode may use it, which means it is not guaranteed for every query. Google&apos;s own
        examples involve questions with several parts, such as the garden photo with three separate concerns.
      </p>

      <h3>Do I need special markup for query fan-out?</h3>
      <p>
        No, Google says there is no special markup or AI text file needed to appear in AI Overviews or AI Mode. What
        helps is clear, indexed pages that answer the related questions customers ask.
      </p>
    </div>
  )
}
