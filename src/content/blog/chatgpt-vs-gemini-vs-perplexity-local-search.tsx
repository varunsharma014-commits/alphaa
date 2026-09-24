import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "chatgpt-vs-gemini-vs-perplexity-local-search",
  title: "ChatGPT vs. Gemini vs. Perplexity (and Claude): How Each Picks Local Businesses in 2026",
  description:
    "Where ChatGPT, Gemini, Perplexity and Claude get their local business recommendations, which crawlers to allow, and what a dentist, plumber or restaurant should prioritise for each, based only on what the companies and published studies actually say.",
  date: "2026-09-25",
  readMins: 8,
  tag: "Guide",
}


export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> All four engines search the live web before naming a local business,
        but they lean on different sources. ChatGPT uses third-party search providers plus partner data such
        as Yelp. Gemini draws on Google Search and Google Maps. Perplexity cites community sites like Reddit
        heavily. Claude runs its own web search. Consistent facts everywhere help with all four.
      </p>

      <p>
        This guide sticks to what the companies document and what published studies show. Where a claim is
        only reported, not confirmed by the company, we say so. Where the evidence is thin, we say that too.
        Nobody outside these companies knows the exact ranking logic, and nobody can guarantee you a spot.
      </p>

      <h2>Where does ChatGPT get local business recommendations?</h2>
      <p>
        ChatGPT searches the web when a question needs current information. It pulls results from
        third-party search providers and from content partners, then writes an answer with citations. For
        local questions, Yelp is now a confirmed data partner, and independent research suggests the web
        results closely track Bing.
      </p>
      <p>
        OpenAI&apos;s{" "}
        <a href="https://help.openai.com/en/articles/9237897-chatgpt-search" target="_blank" rel="noopener noreferrer">
          ChatGPT search help page
        </a>{" "}
        says search uses third-party search providers and content supplied directly by partners. It also says
        ChatGPT may share your approximate location, taken from your IP address, with those providers. Its
        example: &quot;good restaurants near me&quot; can be rewritten into a search like &quot;top restaurants
        San Francisco.&quot; So a local answer usually begins as an ordinary city-plus-category search.
      </p>
      <p>
        OpenAI has not published how much of that search comes from Bing. The best public evidence is a{" "}
        <a href="https://www.seerinteractive.com/insights/87-percent-of-searchgpt-citations-match-bings-top-results" target="_blank" rel="noopener noreferrer">
          Seer Interactive study
        </a>{" "}
        (February 2025, 500+ citations across 100 queries). It found that 87% of ChatGPT search citations
        matched Bing&apos;s top organic results, against 56% for Google. That is a small, early sample. Treat
        it as a strong hint, not a confirmed fact.
      </p>
      <p>
        The Yelp link is confirmed. In an{" "}
        <a href="https://blog.yelp.com/news/yelp-chatgpt-integration/" target="_blank" rel="noopener noreferrer">
          August 2026 announcement
        </a>
        , Yelp described an existing content integration that shows its reviews, ratings, photos and
        business details inside ChatGPT, and added reservations and waitlists on top.
      </p>
      <ul>
        <li><strong>Crawlers:</strong> OpenAI&apos;s <a href="https://developers.openai.com/api/docs/bots" target="_blank" rel="noopener noreferrer">bot documentation</a> says <code>OAI-SearchBot</code> surfaces sites in ChatGPT search results, <code>ChatGPT-User</code> visits pages for user actions, and <code>GPTBot</code> is for model training. If you block OAI-SearchBot, your site won&apos;t show up in ChatGPT search answers.</li>
        <li><strong>Bing:</strong> Claim and verify your listing in Bing Places and check that Bing indexes your site. Given the Seer finding, this is cheap insurance.</li>
        <li><strong>Yelp:</strong> For restaurants and home services especially, a complete, well-reviewed Yelp page now feeds ChatGPT directly.</li>
      </ul>
      <p>
        More detail:{" "}
        <Link href="/blog/how-to-get-recommended-by-chatgpt">how to get recommended by ChatGPT</Link>.
      </p>

      <h2>How does Gemini pick local businesses?</h2>
      <p>
        Gemini leans on Google&apos;s own data. Google says the Gemini app uses public information from Google
        Maps to find businesses and to give their ratings, hours and websites. Google&apos;s AI Overviews and AI
        Mode build answers from pages in the Google Search index. Your Google Business Profile and your
        Google rankings are the foundation here.
      </p>
      <p>
        Google&apos;s{" "}
        <a href="https://support.google.com/gemini/answer/16622866?hl=en&co=GENIE.Platform%3DDesktop" target="_blank" rel="noopener noreferrer">
          Gemini Apps help page
        </a>{" "}
        says Gemini uses &quot;public information from Google Maps&quot; to find places such as businesses,
        stores and restaurants, and to return addresses, descriptions, websites, ratings and opening hours.
        That Maps data is largely what you control through your Google Business Profile. Google also offers
        developers{" "}
        <a href="https://developers.googleblog.com/en/your-ai-is-now-a-local-expert-grounding-with-google-maps-is-now-ga/" target="_blank" rel="noopener noreferrer">
          grounding with Google Maps
        </a>
        , which pulls in places, reviews and hours, so apps built on Gemini can draw on the same data.
      </p>
      <p>
        For AI Overviews and AI Mode, Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener noreferrer">
          AI features documentation
        </a>{" "}
        says a page must be indexed and eligible to appear in Search with a snippet, with no extra technical
        requirements. It also says both features may use &quot;query fan-out,&quot; running several related
        searches across subtopics and data sources. Google does not publish how Business Profile signals are
        weighted inside those answers, so ignore anyone who claims to know the exact formula.
      </p>
      <ul>
        <li><strong>Google Business Profile:</strong> Get the categories, hours, services, photos and website link right. This is the Maps data Gemini reads.</li>
        <li><strong>Reviews on Google:</strong> Ratings appear in the Maps data Gemini returns, so recent, genuine reviews matter.</li>
        <li><strong>Crawler:</strong> Googlebot covers Search, including AI features. Google points to <code>Google-Extended</code> for training and grounding in its other AI systems, not for Search eligibility.</li>
      </ul>
      <p>
        See also{" "}
        <Link href="/blog/how-to-get-recommended-by-google-gemini">how to get recommended by Google Gemini</Link>{" "}
        and{" "}
        <Link href="/blog/google-business-profile-ai-answers">how your Google Business Profile feeds AI answers</Link>.
      </p>

      <h2>Why does Perplexity cite Reddit so often?</h2>
      <p>
        Perplexity&apos;s top sources lean heavily toward community discussion. In Profound&apos;s large citation
        study, Reddit made up 46.7% of citations among Perplexity&apos;s ten most-cited sources, the highest
        share any single domain had on any platform. Perplexity hasn&apos;t explained why, so the reason
        itself isn&apos;t known.
      </p>
      <p>
        The{" "}
        <a href="https://www.tryprofound.com/blog/ai-platform-citation-patterns" target="_blank" rel="noopener noreferrer">
          Profound study
        </a>{" "}
        covered 680 million citations from August 2024 to June 2025. Read the 46.7% carefully. It is
        Reddit&apos;s share <em>within Perplexity&apos;s top ten sources</em>, not its share of every citation.
        The same analysis put Yelp (5.8%) and Tripadvisor (4.1%) in Perplexity&apos;s top ten. That matters
        for restaurants and home services. For comparison, Wikipedia led ChatGPT&apos;s top ten at 47.9%, and
        Reddit held 21.0% of Google AI Overviews&apos; top ten.
      </p>
      <p>
        On crawlers, Perplexity&apos;s{" "}
        <a href="https://docs.perplexity.ai/guides/bots" target="_blank" rel="noopener noreferrer">bot documentation</a> says{" "}
        <code>PerplexityBot</code> surfaces and links websites in Perplexity search results and is not used
        for training foundation models. <code>Perplexity-User</code> fetches pages when a user asks a
        question, and Perplexity says it generally ignores robots.txt because a person started the request.
      </p>
      <ul>
        <li><strong>Allow PerplexityBot</strong> or your site can&apos;t be surfaced in its results.</li>
        <li><strong>Be discussed honestly on Reddit</strong> in your local and trade subreddits. Answer questions, don&apos;t spam links. Our <Link href="/blog/reddit-and-ai-search">Reddit and AI search guide</Link> covers how.</li>
        <li><strong>Keep Yelp and Tripadvisor current</strong> if you&apos;re in food, hospitality or home services.</li>
      </ul>
      <p>
        More: <Link href="/blog/how-to-get-cited-on-perplexity">how to get cited on Perplexity</Link>.
      </p>

      <h2>Does Claude recommend local businesses?</h2>
      <p>
        Yes, when web search is on. Anthropic says Claude may use your approximate location, taken from your
        IP address, for localized requests, and every search answer includes citations. Anthropic doesn&apos;t
        document a local data partner like Yelp for Claude, so the public evidence on its local sources is
        the thinnest of the four.
      </p>
      <p>
        Anthropic&apos;s{" "}
        <a href="https://support.claude.com/en/articles/10684626-enable-and-use-web-search" target="_blank" rel="noopener noreferrer">
          web search help page
        </a>{" "}
        confirms the location behaviour and says image search is powered by Bing. It doesn&apos;t name the
        provider for text search. In March 2025, Anthropic added Brave Search to its subprocessor list, and{" "}
        <a href="https://simonwillison.net/2025/Mar/21/anthropic-use-brave/" target="_blank" rel="noopener noreferrer">
          independent testing
        </a>{" "}
        found Claude&apos;s cited results matched Brave&apos;s. That points to Brave as a likely backend, but
        Anthropic&apos;s own search docs don&apos;t say so.
      </p>
      <p>
        Anthropic&apos;s{" "}
        <a href="https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" target="_blank" rel="noopener noreferrer">
          crawler page
        </a>{" "}
        lists three bots: <code>ClaudeBot</code> collects content that may be used for training,{" "}
        <code>Claude-SearchBot</code> improves search result quality, and <code>Claude-User</code> fetches
        pages when a user asks Claude a question.
      </p>
      <ul>
        <li><strong>Allow Claude-SearchBot and Claude-User.</strong> Blocking ClaudeBot only affects training.</li>
        <li><strong>Check your visibility in Brave Search.</strong> It costs nothing, and the evidence points that way.</li>
        <li><strong>Make your own site quotable</strong>, with clear services, service area and prices, because without a known local data partner your site and third-party pages do most of the work.</li>
      </ul>
      <p>
        More: <Link href="/blog/how-to-get-recommended-by-claude">how to get recommended by Claude</Link>.
      </p>

      <h2>How do the four engines compare side by side?</h2>
      <table>
        <thead>
          <tr>
            <th>Engine</th>
            <th>Where live web results come from</th>
            <th>Local data it leans on</th>
            <th>Crawlers to allow</th>
            <th>Prioritise</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ChatGPT</td>
            <td>Third-party search providers plus partners (OpenAI). Close match to Bing results (Seer study, not confirmed by OpenAI).</td>
            <td>Yelp reviews, ratings, photos and details (confirmed by Yelp).</td>
            <td><code>OAI-SearchBot</code>, <code>ChatGPT-User</code></td>
            <td>Bing Places and Bing indexing, Yelp profile, crawlable site</td>
          </tr>
          <tr>
            <td>Gemini</td>
            <td>Google Search index. AI Overviews and AI Mode use query fan-out (Google).</td>
            <td>Public Google Maps data: ratings, hours, websites (Google).</td>
            <td><code>Googlebot</code></td>
            <td>Google Business Profile, Google reviews, Google rankings</td>
          </tr>
          <tr>
            <td>Perplexity</td>
            <td>Its own search results, surfaced by PerplexityBot (Perplexity).</td>
            <td>Reddit dominates its top sources. Yelp and Tripadvisor also rank in its top ten (Profound study).</td>
            <td><code>PerplexityBot</code>, <code>Perplexity-User</code></td>
            <td>Genuine Reddit presence, Yelp and Tripadvisor, citable pages</td>
          </tr>
          <tr>
            <td>Claude</td>
            <td>Claude web search. Brave reported as the backend, not stated in Anthropic&apos;s search docs. Images from Bing.</td>
            <td>No documented local partner. Uses location from your IP (Anthropic).</td>
            <td><code>Claude-SearchBot</code>, <code>Claude-User</code></td>
            <td>Clear, factual site content, Brave visibility, third-party reviews</td>
          </tr>
        </tbody>
      </table>

      <h2>What works across all four?</h2>
      <p>
        Every engine starts with a live search, reads what it finds and names businesses that several
        sources back up. The winning move is the same everywhere: let the crawlers in, keep your facts
        identical everywhere, and earn real reviews and mentions on the platforms each engine reads most.
      </p>
      <p>
        The key takeaway is that there&apos;s no single &quot;AI ranking.&quot; There are four retrieval
        pipelines with different favourite sources. Google data drives Gemini, Yelp and probably Bing feed
        ChatGPT, Reddit carries unusual weight in Perplexity, and Claude relies on its own web search with
        no documented local partner. A dentist who only polishes a Google profile can win Gemini and still be
        missing from the other three.
      </p>
      <ul>
        <li><strong>Check robots.txt</strong> for all the search and user bots in the table. Our <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawler robots.txt guide</Link> has copy-paste rules.</li>
        <li><strong>Use the same name, address, phone, hours and services</strong> on your site, Google, Bing, Yelp and trade directories.</li>
        <li><strong>Put the answer on your site in plain words:</strong> what you do, where, for whom, and roughly what it costs.</li>
        <li><strong>Earn reviews steadily</strong> on Google and on Yelp or your trade&apos;s main review site, and reply to them.</li>
        <li><strong>Re-check regularly.</strong> Answers change from run to run (see <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>), so one screenshot tells you little.</li>
      </ul>

      <h2>What should a local business do this week?</h2>
      <p>
        Start by finding out what each engine says today. Ask all four the question a real customer would
        ask, like &quot;best emergency plumber in Leeds&quot;, and see who each one names. Then fix the gaps
        for whichever engine leaves you out.
      </p>
      <ul>
        <li><strong>Day 1:</strong> Run the <Link href="/start">free 60-second Alphaa check</Link>. It asks ChatGPT, Gemini, Claude and Perplexity the same customer question, shows who each one named, and runs 23 checks on what AI can read on your site.</li>
        <li><strong>Day 2:</strong> Fix any blocked crawlers and mismatched listing details it finds.</li>
        <li><strong>Days 3–5:</strong> Claim or complete Bing Places, Yelp and your Google Business Profile, then ask recent happy customers for reviews.</li>
      </ul>
      <p>
        If you&apos;d rather have it handled, Alphaa is an AI agent that keeps working to get local businesses
        recommended by all four engines. It starts at $99/month, month to month. There&apos;s no free trial,
        and no honest provider can promise rankings. You&apos;ll see what changes, engine by engine.
      </p>
    </div>
  )
}
