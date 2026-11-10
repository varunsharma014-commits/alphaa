import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "indexnow-for-ai-search",
  title: "IndexNow for AI Search: Get New Pages Found Faster",
  description:
    "What IndexNow is, which engines use it, how it reaches ChatGPT search through Bing, and how to set it up on any site in four steps, with the limits explained.",
  subtitle:
    "IndexNow is a free protocol that tells Bing and other participating engines the moment a page changes, which helps AI answers built on those indexes see your updates sooner, though it does not reach Google.",
  date: "2026-11-10",
  updated: "2026-11-10",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "indexnow for ai search",
  image: {
    src: "/blog/indexnow-for-ai-search.webp",
    alt: "A brass desk bell beside a stack of white paper with a paper airplane flying above it, against a pale blue-grey wall.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "IndexNow lets a site notify search engines when a URL is added, updated or deleted, instead of waiting for a crawl.",
    "IndexNow.org lists Amazon, Bing, Naver, Seznam.cz, Yandex and Yep as participants; Google is not on the list.",
    "A submission to one participating engine is shared with all the others.",
    "One POST request can carry up to 10,000 URLs, and a 200 response only means the URL was received.",
    "IndexNow speeds discovery in Bing, which ChatGPT search uses as one provider, but it cannot make any engine cite a page.",
  ],
  sources: [
    { title: "FAQ | IndexNow.org", publisher: "IndexNow", url: "https://www.indexnow.org/faq" },
    { title: "Documentation | IndexNow.org", publisher: "IndexNow", url: "https://www.indexnow.org/documentation" },
    { title: "Why IndexNow | Bing Webmaster Tools", publisher: "Microsoft Bing", url: "https://www.bing.com/indexnow" },
    {
      title: "Crawler Hints · Cloudflare Cache (CDN) docs",
      publisher: "Cloudflare",
      url: "https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/",
    },
    {
      title: "Microsoft Build brings AI tools to the forefront for developers",
      publisher: "Microsoft",
      url: "https://blogs.microsoft.com/blog/2023/05/23/microsoft-build-brings-ai-tools-to-the-forefront-for-developers/",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> IndexNow for AI search means pinging Bing and other participating engines the
        moment you publish or change a page, so their indexes, and the AI answers built on them, can pick it up
        sooner. It is free, takes one key file and one request, and helps ChatGPT search through Bing. It does nothing
        for Google.
      </p>

      <p>
        This guide is for owners and marketers who update their sites and want AI assistants to see the new version
        quickly. It covers what IndexNow is, where it helps, how to set it up, and what it cannot do.
      </p>

      <h2>What is IndexNow?</h2>
      <p>
        IndexNow is an open protocol that lets a website tell search engines straight away that a URL has been added,
        updated or deleted, rather than waiting for a crawler to notice. The{" "}
        <a href="https://www.indexnow.org/faq" {...ext}>
          IndexNow FAQ
        </a>{" "}
        describes it as a way to notify engines of changes instead of relying on them to discover those changes on
        their own schedule.
      </p>
      <p>
        Microsoft&apos;s{" "}
        <a href="https://www.bing.com/indexnow" {...ext}>
          Why IndexNow page
        </a>{" "}
        calls it a free, open-source protocol and lists the benefits as faster discovery, more current results, lower
        crawl costs and less load on your server. The idea is simple: crawlers spend a lot of effort re-checking pages
        that have not changed, and very little time on the one you edited this morning. IndexNow points them at the
        right page.
      </p>

      <h2>Which search engines use IndexNow?</h2>
      <p>
        As of November 2026, the IndexNow FAQ lists Amazon, Bing, Naver, Seznam.cz, Yandex and Yep as participating
        engines, plus a shared endpoint at api.indexnow.org. Google is not on that list. The FAQ also says a submission
        to any one participating endpoint is shared with all IndexNow-enabled engines, so you only need to send each
        change once.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Engine or AI assistant</th>
              <th>Reads IndexNow?</th>
              <th>What to use instead or as well</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bing</td>
              <td>Yes, listed participant</td>
              <td>Bing Webmaster Tools and a sitemap</td>
            </tr>
            <tr>
              <td>ChatGPT search</td>
              <td>Indirectly, through Bing as one search provider</td>
              <td>Allow OAI-SearchBot in robots.txt</td>
            </tr>
            <tr>
              <td>Microsoft Copilot</td>
              <td>Indirectly, through Bing</td>
              <td>Bing Webmaster Tools</td>
            </tr>
            <tr>
              <td>Google Search, AI Overviews, Gemini</td>
              <td>No, Google is not a listed participant</td>
              <td>XML sitemap and Google Search Console</td>
            </tr>
            <tr>
              <td>Perplexity, Claude</td>
              <td>Not listed as participants</td>
              <td>Allow their crawlers; keep pages crawlable</td>
            </tr>
            <tr>
              <td>Yandex, Naver, Seznam.cz, Yep, Amazon</td>
              <td>Yes, listed participants</td>
              <td>Nothing extra needed</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Why does IndexNow matter for AI search?</h2>
      <p>
        IndexNow matters for AI search because several AI assistants answer from a search index, and the fastest way to
        get a change into Bing&apos;s index is to tell Bing about it. When an assistant searches the web before
        answering, it can only quote pages its search index has seen. A price change, a new service page or a corrected
        address that Bing has not recrawled will not show up in an answer that relies on Bing.
      </p>
      <p>
        The link to ChatGPT runs through Bing. In May 2023, Microsoft{" "}
        <a
          href="https://blogs.microsoft.com/blog/2023/05/23/microsoft-build-brings-ai-tools-to-the-forefront-for-developers/"
          {...ext}
        >
          announced
        </a>{" "}
        that Bing was coming to ChatGPT &quot;as the default search experience&quot;. ChatGPT search now uses more than
        one source, including OpenAI&apos;s own crawler, as our explainer{" "}
        <Link href="/blog/does-chatgpt-use-bing">does ChatGPT use Bing?</Link> sets out. Bing is still one of them, and
        it is the one you can notify directly.
      </p>
      <p>
        It also matters more for some pages than others. Pages whose facts change, such as prices, opening hours,
        services, staff and FAQs, are exactly what customers ask assistants about. Our guide to{" "}
        <Link href="/blog/content-freshness-ai-search">content freshness in AI search</Link> explains why stale facts
        hurt, and{" "}
        <Link href="/blog/training-data-vs-live-retrieval-ai-search">training data vs live retrieval</Link> explains
        which answers come from a live search at all.
      </p>

      <h2>How do you set up IndexNow step by step?</h2>
      <p>
        Setting up IndexNow takes four steps: create a key, host it as a text file, submit changed URLs, and check the
        response code. The{" "}
        <a href="https://www.indexnow.org/documentation" {...ext}>
          IndexNow documentation
        </a>{" "}
        gives the full specification.
      </p>
      <ol>
        <li>
          <strong>Create a key.</strong> The key is a string of 8 to 128 characters using only letters, numbers and
          dashes. Any random string that meets those rules works.
        </li>
        <li>
          <strong>Host the key file.</strong> Save a UTF-8 text file named after the key, for example{" "}
          <code>your-key.txt</code>, containing only the key, and put it at the root of your domain. The documentation
          strongly recommends the root; a file in a subfolder only covers URLs under that folder. Each subdomain needs
          its own key file.
        </li>
        <li>
          <strong>Submit changed URLs.</strong> For one URL, send a GET request to{" "}
          <code>https://api.indexnow.org/indexnow?url=&lt;page&gt;&amp;key=&lt;key&gt;</code>. For several, send one
          POST with a JSON body containing <code>host</code>, <code>key</code> and a <code>urlList</code> of up to 10,000
          URLs.
        </li>
        <li>
          <strong>Check the response.</strong> A 200 means the URL was received and 202 means it was received with key
          validation still pending. 403 means the key file was not found or did not match, 422 means the URLs do not
          belong to the host, and 429 means too many requests.
        </li>
      </ol>
      <p>
        Most site owners never write the request themselves. Bing&apos;s IndexNow page shows the WordPress SEO plugins
        Yoast, Rank Math, AIOSEO and SEOPress, along with Cloudflare, Wix and Duda, among those adopting it, so check
        your plugin or platform settings before building anything. On WordPress, see our{" "}
        <Link href="/blog/wordpress-ai-search-optimization">WordPress AI search guide</Link>.
      </p>

      <h2>Can Cloudflare send IndexNow pings for you?</h2>
      <p>
        Yes, Cloudflare&apos;s Crawler Hints feature can send IndexNow signals automatically for sites behind
        Cloudflare. According to{" "}
        <a href="https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/" {...ext}>
          Cloudflare&apos;s Crawler Hints documentation
        </a>
        , it uses cache signals to work out when content has likely changed and tells search engines through IndexNow.
        It is available on Free, Pro, Business and Enterprise plans and is switched on from the caching configuration
        page in the dashboard.
      </p>
      <p>
        Crawler Hints infers changes from cache misses, so it is a reasonable default rather than a precise list of the
        pages you edited. If you publish on a schedule, an explicit ping from your publishing workflow is more exact.
        Alphaa&apos;s own blog does this: every new post is submitted to IndexNow with the blog index and sitemap once it
        is live.
      </p>

      <h2>What are the rules and limits of IndexNow?</h2>
      <p>
        The main rules are to submit only URLs that have meaningfully changed, to keep each request to 10,000 URLs, and
        to back off when an engine says you are sending too many. The IndexNow FAQ makes these points.
      </p>
      <ul>
        <li>
          <strong>No guarantee.</strong> Submitting a URL does not guarantee immediate indexing. It makes a faster crawl
          more likely, and submitted URLs still count toward your crawl quota.
        </li>
        <li>
          <strong>Only real changes.</strong> Submit pages that were added, meaningfully updated or deleted. Wait at least
          five minutes before resubmitting the same URL.
        </li>
        <li>
          <strong>Respect rate limits.</strong> Exact limits are not public and each engine sets its own. On a 429
          response, pause and honour the Retry-After header.
        </li>
        <li>
          <strong>Deletions count too.</strong> The protocol covers deleted URLs as well, so submitting a page you have
          removed prompts engines to recheck it, which helps clear out outdated pages assistants might keep quoting.
        </li>
      </ul>

      <h2>What does IndexNow not do?</h2>
      <p>
        IndexNow does not make any engine rank, cite or recommend a page; it only shortens the time before a
        participating engine knows the page changed. If the page is thin, blocked, or unclear about the facts customers
        ask for, being crawled sooner will not change the answer.
      </p>
      <p>
        It also does not cover the whole AI landscape. Google is not a listed participant, so Google AI Overviews, AI
        Mode and Gemini still depend on Google&apos;s own crawl, which you guide with an XML sitemap and Search Console.
        Perplexity and Claude are not listed either. For those, the job is to make sure their crawlers are allowed,
        which our <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> covers, and
        that the content renders without JavaScript, covered in{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
      </p>
      <p>
        Once Bing has the page, you can see how it performs in Microsoft&apos;s AI surfaces in the{" "}
        <Link href="/blog/bing-ai-performance-report">Bing AI Performance report</Link>.
      </p>

      <h2>How does IndexNow fit into an AI visibility plan?</h2>
      <p>
        IndexNow is a small final step in an AI visibility plan: first make the page worth citing, then make sure every
        engine can reach it, then ping the engines that accept IndexNow. A practical order looks like this.
      </p>
      <ol>
        <li>Fix the facts on the page: services, prices, areas, hours and answers to common questions.</li>
        <li>Add structured data and keep business details consistent across your profiles.</li>
        <li>Check that AI crawlers are allowed and the page renders as plain HTML.</li>
        <li>Publish, then ping IndexNow and update your sitemap.</li>
        <li>Ask the assistants the same questions a week or two later and compare the answers.</li>
      </ol>
      <p>
        Alphaa does steps one and five every week for a business. It asks ChatGPT, Gemini, Claude and Perplexity what
        they say, drafts the fixes for the owner to approve, and publishes them to WordPress, Shopify or Webflow. To
        see where you stand first, run the <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else do people ask about IndexNow?</h2>

      <h3>Does Google support IndexNow?</h3>
      <p>
        Google is not among the participating engines listed on IndexNow.org as of November 2026. To get changes into
        Google faster, keep your XML sitemap current and use the URL Inspection tool in Search Console.
      </p>

      <h3>Does IndexNow help my site show up in ChatGPT?</h3>
      <p>
        It can help indirectly, because Bing is one of the search providers behind ChatGPT search and IndexNow gets
        changes into Bing sooner. It does not control whether ChatGPT quotes the page.
      </p>

      <h3>Do I need a separate submission for each search engine?</h3>
      <p>
        No, a submission to one participating engine is shared with all the others, according to the IndexNow FAQ.
        Sending the same URL to several endpoints adds nothing.
      </p>

      <h3>How many URLs can I submit with IndexNow?</h3>
      <p>
        One POST request can carry up to 10,000 URLs, and requests above that may fail with a 422 error. Daily limits
        are not published and vary by engine.
      </p>

      <h3>Is IndexNow safe to turn on?</h3>
      <p>
        Yes, IndexNow only tells engines which of your URLs changed and proves ownership with a key file. It does not
        expose private pages, as long as you submit only public URLs.
      </p>
    </div>
  )
}
