import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "does-chatgpt-use-bing",
  title: "Does ChatGPT Use Bing? How ChatGPT Search Finds Sources",
  description:
    "ChatGPT search draws on partner search providers, including Microsoft Bing, plus OpenAI's own crawler. What that means for your site, and the 7 checks to run.",
  subtitle:
    "Yes, in part: Bing has been a ChatGPT search provider since 2023 and OpenAI still names Microsoft among its search partners, but ChatGPT also relies on its own OAI-SearchBot crawler.",
  date: "2026-10-27",
  updated: "2026-10-27",
  readMins: 5,
  tag: "Guide",
  kind: "guide",
  keyphrase: "does chatgpt use bing",
  image: {
    src: "/blog/does-chatgpt-use-bing.webp",
    alt: "A brass card-catalog drawer pulled open with index cards inside, next to a magnifying glass on a wooden desk by a window.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Microsoft announced in May 2023 that Bing would become the default search experience in ChatGPT.",
    "OpenAI's help center says ChatGPT search sometimes partners with other search providers and links Microsoft's and Shopify's privacy policies.",
    "ChatGPT rewrites a question into one or more targeted queries before sending them to a search provider.",
    "Sites that block OAI-SearchBot will not be shown in ChatGPT search answers, apart from navigational links, according to OpenAI.",
    "Being indexed by Bing and crawlable by OAI-SearchBot covers both routes ChatGPT uses to find a page.",
  ],
  sources: [
    { title: "Searching the web with ChatGPT | OpenAI Help Center", publisher: "OpenAI", url: "https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
    { title: "Microsoft Build brings AI tools to the forefront for developers - The Official Microsoft Blog", publisher: "Microsoft", url: "https://blogs.microsoft.com/blog/2023/05/23/microsoft-build-brings-ai-tools-to-the-forefront-for-developers/" },
    { title: "Webmaster Guidelines - Bing Webmaster Tools", publisher: "Microsoft Bing", url: "https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a" },
    { title: "Home | IndexNow.org", publisher: "IndexNow", url: "https://www.indexnow.org/" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team. We build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about
          businesses. Every claim below links to OpenAI&apos;s or Microsoft&apos;s own documentation, read on 27
          October 2026.
        </em>
      </p>
      <p>
        <strong>Short answer:</strong> Yes, ChatGPT uses Bing, but not only Bing. Microsoft made Bing the default
        search experience in ChatGPT in 2023, and OpenAI still names Microsoft among its search partners. ChatGPT also
        uses OpenAI&apos;s own crawler, OAI-SearchBot. To be found, a site should be indexed by Bing and open to
        OAI-SearchBot.
      </p>
      <p>
        This guide is for business owners and marketers who want to know where ChatGPT gets the pages it cites, and
        what to check so their own site is one of them. It covers what OpenAI and Microsoft have said publicly, what
        they have not said, and a seven-step checklist.
      </p>

      <h2>Does ChatGPT search use Bing?</h2>
      <p>
        ChatGPT search uses Bing as one of its search providers, according to both Microsoft and OpenAI. In May 2023,
        Microsoft&apos;s{" "}
        <a href="https://blogs.microsoft.com/blog/2023/05/23/microsoft-build-brings-ai-tools-to-the-forefront-for-developers/" {...ext}>
          Build announcement
        </a>{" "}
        said Bing was coming to ChatGPT as the default search experience, so that answers would be grounded in web
        data and include citations.
      </p>
      <p>
        OpenAI&apos;s current help article,{" "}
        <a href="https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt" {...ext}>
          Searching the web with ChatGPT
        </a>
        , says ChatGPT search &quot;sometimes partners with other search providers&quot;. Under the heading on
        information shared with search providers, it points readers to two privacy policies: Microsoft&apos;s and
        Shopify&apos;s. That is as close as OpenAI comes to naming its partners, and it is consistent with Bing being
        the general web provider and Shopify supplying shopping results.
      </p>

      <h2>How does ChatGPT search actually find sources?</h2>
      <p>
        ChatGPT search rewrites your question into one or more short search queries, sends them to a search provider,
        reads the results and may search again with more specific queries before it answers. OpenAI&apos;s help
        article gives an example: a long research question becomes &quot;CCR8 immunotherapy drug development
        2025&quot;, and a follow-up query narrows it further.
      </p>
      <p>
        Location matters for local businesses. OpenAI says ChatGPT may estimate a general location from the
        user&apos;s IP address and share that general location, not the IP address itself, with search providers. A
        question like &quot;good restaurants near me&quot; from San Francisco may become the query &quot;top
        restaurants San Francisco&quot;. If memory is turned on, saved details such as a dietary preference can shape
        the query too. So the query that reaches Bing is usually shorter and more specific than what the customer
        typed, which is why pages that state the city, the service and the key facts plainly tend to match. The
        mechanism is explained in more depth in{" "}
        <Link href="/blog/what-is-query-fan-out">what query fan-out is</Link>.
      </p>
      <p>
        For some tasks ChatGPT pulls from specialist partners rather than a general index. The same help article says
        restaurant availability may come from OpenTable, Resy or Yelp, depending on the restaurant.
      </p>

      <h2>Where does ChatGPT get the information it cites?</h2>
      <p>
        ChatGPT draws on at least four routes: partner search providers such as Bing, OpenAI&apos;s own search
        crawler, task-specific partners, and what the model learned in training. Each one has a different lever for a
        business owner.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>What OpenAI or Microsoft says</th>
              <th>What you control</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bing (search provider)</td>
              <td>Default search experience since 2023; Microsoft privacy statement linked in OpenAI&apos;s help</td>
              <td>Bing indexing, sitemap, IndexNow, Bing Places listing</td>
            </tr>
            <tr>
              <td>OAI-SearchBot (OpenAI&apos;s crawler)</td>
              <td>Used to surface websites in ChatGPT search; blocked sites are not shown in answers</td>
              <td>robots.txt and firewall or CDN rules</td>
            </tr>
            <tr>
              <td>Shopping partner</td>
              <td>Shopify privacy policy linked as a search provider</td>
              <td>Product data on your store</td>
            </tr>
            <tr>
              <td>Reservation partners</td>
              <td>Availability from OpenTable, Resy or Yelp</td>
              <td>Your listing on those platforms</td>
            </tr>
            <tr>
              <td>Training data</td>
              <td>What the model learned before its cutoff, used when no search runs</td>
              <td>Long-term: consistent facts across the web</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The difference between the last row and the rest matters. When ChatGPT searches, a page you fix today can be
        cited soon after it is indexed. When it answers from training, nothing you change shows up until a future
        model. The split is covered in{" "}
        <Link href="/blog/training-data-vs-live-retrieval-ai-search">training data vs live retrieval</Link>.
      </p>

      <h2>Does ChatGPT use Google search results?</h2>
      <p>
        OpenAI has not said that ChatGPT uses Google, and Google is not among the search providers whose privacy
        policies OpenAI links in its help article. OpenAI also does not publish how much of each answer comes from
        each provider, or from its own crawler.
      </p>
      <p>
        In practice that uncertainty does not change the work. Pages that are well indexed in Google are usually well
        indexed in Bing too, because both reward the same basics: crawlable HTML, a sitemap, clear titles and
        consistent facts. The gap tends to appear on newer or smaller sites that have never been checked in Bing at
        all, so Bing Webmaster Tools is worth a look even when Google Search Console looks healthy.
      </p>

      <h2>What is OAI-SearchBot, and why does it matter as much as Bing?</h2>
      <p>
        OAI-SearchBot is OpenAI&apos;s search crawler, and blocking it removes your site from ChatGPT search answers
        even if Bing has indexed every page. OpenAI&apos;s{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          crawler documentation
        </a>{" "}
        says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers, though they can still
        appear as navigational links, and that a robots.txt change can take about 24 hours to take effect.
      </p>
      <p>
        The help article adds a second condition: to be eligible, the website host or content delivery network must
        allow traffic from OpenAI&apos;s published searchbot IP addresses. That catches sites whose robots.txt is fine
        but whose firewall or bot-protection setting blocks unfamiliar crawlers. OAI-SearchBot is separate from
        GPTBot, which OpenAI uses for training, so you can block training and still allow search. The full list of AI
        crawlers and how to handle each is in{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">the AI crawlers robots.txt guide</Link>.
      </p>

      <h2>How do you make sure ChatGPT can find your site through Bing?</h2>
      <p>
        There are seven checks, and most take minutes: open both doors, make your pages easy to index, and tell Bing
        when something changes. Microsoft&apos;s{" "}
        <a href="https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a" {...ext}>
          Bing Webmaster Guidelines
        </a>{" "}
        now describe how content is chosen for Bing search, Copilot and grounding API results, and they say the same
        SEO fundamentals apply to all three.
      </p>
      <ol>
        <li>
          <strong>Allow OAI-SearchBot and Bingbot in robots.txt.</strong> Open yoursite.com/robots.txt and make sure
          neither is disallowed. Bing&apos;s guidelines list blocking Bingbot as something to avoid.
        </li>
        <li>
          <strong>Check your firewall or CDN.</strong> If you use bot protection, confirm it lets through
          OpenAI&apos;s published searchbot IP addresses and Bingbot.
        </li>
        <li>
          <strong>Verify your site in Bing Webmaster Tools.</strong> It shows which pages Bing has indexed and why
          others were left out. You can import a verified Google Search Console property to save time.
        </li>
        <li>
          <strong>Submit an XML sitemap with accurate lastmod dates.</strong> Bing says sitemaps should list only
          canonical URLs and include freshness signals such as lastmod.
        </li>
        <li>
          <strong>Turn on IndexNow.</strong>{" "}
          <a href="https://www.indexnow.org/" {...ext}>
            IndexNow
          </a>{" "}
          is a simple ping that tells participating search engines, including Microsoft Bing, that a URL was added,
          updated or deleted. Many CMS plugins and CDNs support it.
        </li>
        <li>
          <strong>Remove directives that limit citations.</strong> Bing says NOARCHIVE stops content being used in
          Copilot responses and grounding results, and NOCACHE limits it to the URL, title and snippet. Check your
          SEO plugin has not set either sitewide.
        </li>
        <li>
          <strong>Claim your Bing Places listing if you serve customers locally.</strong> Local questions often run
          through a map and listing layer, and Bing&apos;s is separate from Google Business Profile.
        </li>
      </ol>
      <p>
        One more check sits outside Bing: make sure your important text is in the HTML, not loaded only by
        JavaScript. Bing&apos;s guidelines warn against hiding critical content behind client-side rendering, and the
        same issue affects OpenAI&apos;s crawler; see{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
      </p>

      <h2>Does ranking well in Bing mean ChatGPT will recommend you?</h2>
      <p>
        No. Being in Bing&apos;s index makes your pages eligible to be found, but ChatGPT still decides which results
        to read, quote and recommend. OpenAI&apos;s help article says ChatGPT ranks results using multiple factors and
        that placement is not guaranteed.
      </p>
      <p>
        What tends to tip the decision is the content itself: a page that answers the rewritten query directly, states
        facts that can be checked, and agrees with what reviews and listings say elsewhere. Bing&apos;s own guidelines
        point the same way, favouring content that is clear, focused on one topic, verifiable on the page and
        consistent in how it names people, products and places. The broader playbook is in{" "}
        <Link href="/blog/how-to-get-recommended-by-chatgpt">how to get recommended by ChatGPT</Link>, and
        Microsoft&apos;s own assistant is covered in{" "}
        <Link href="/blog/how-to-get-recommended-by-microsoft-copilot">how to get recommended by Microsoft Copilot</Link>.
      </p>
      <p>
        The fastest way to know whether any of this is a problem for you is to look. Ask ChatGPT the questions your
        customers ask, with search on, and see which sites it cites. Or run the{" "}
        <Link href="/start">free 60-second AI check</Link>, which asks ChatGPT, Gemini, Claude and Perplexity and
        reports what each one says about your business.
      </p>

      <h2>What else do people ask about ChatGPT and Bing?</h2>

      <h3>Is ChatGPT search powered entirely by Bing?</h3>
      <p>
        No. OpenAI says ChatGPT search sometimes partners with other search providers, and it also runs its own
        crawler, OAI-SearchBot. OpenAI does not publish how much of any answer comes from Bing.
      </p>

      <h3>If my site is not in Bing, can ChatGPT still cite it?</h3>
      <p>
        Possibly, through OAI-SearchBot, but you are relying on one route instead of two. Checking Bing Webmaster Tools
        is free and quick, so there is little reason to leave the Bing route closed.
      </p>

      <h3>Does Bing Places affect ChatGPT recommendations for local businesses?</h3>
      <p>
        OpenAI has not said so directly, but local questions are sent to search providers with a general location
        attached, and Bing is one of those providers. A claimed, accurate Bing Places listing is low-cost insurance
        that the facts it returns about you are right.
      </p>

      <h3>Should I block GPTBot to stop OpenAI training on my content?</h3>
      <p>
        You can block GPTBot without affecting ChatGPT search, because OpenAI uses OAI-SearchBot for search and GPTBot
        for training. Just make sure the rule names GPTBot only and does not block OAI-SearchBot as well.
      </p>

      <h3>How quickly does a change show up in ChatGPT search?</h3>
      <p>
        There is no published timeline. OpenAI says robots.txt changes take about 24 hours to register, and IndexNow
        helps Bing pick up new or changed URLs sooner, but when a given answer reflects the change is up to ChatGPT.
      </p>
    </div>
  )
}
