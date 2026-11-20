import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "xml-sitemap-for-ai-search",
  title: "XML Sitemap for AI Search: What Still Matters in 2026",
  description:
    "How an XML sitemap helps AI search: what Bing and Google read, why accurate lastmod matters, what they ignore, and the setup that keeps your pages quotable.",
  subtitle:
    "An XML sitemap helps AI search by telling the crawlers behind ChatGPT, Copilot and Google which pages exist and when they really changed, so updates reach AI answers sooner; it does not make any page rank or get cited on its own.",
  date: "2026-11-20",
  updated: "2026-11-20",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "xml sitemap for ai search",
  takeaways: [
    "Bing says sitemaps remain a foundational signal for full URL coverage in AI-powered search, alongside IndexNow for instant updates.",
    "Bing and Google both ignore the changefreq and priority tags, so only loc and an accurate lastmod do real work.",
    "Google uses lastmod only when it is consistently and verifiably accurate, and only for significant changes to a page.",
    "One sitemap file can hold up to 50,000 URLs or 50MB uncompressed; larger sites split files under a sitemap index.",
    "Bing says it fetches a newly submitted sitemap immediately and then typically rereads it at least once a day.",
  ],
  sources: [
    {
      title: "Keeping Content Discoverable with Sitemaps in AI Powered Search",
      publisher: "Microsoft Bing Blog",
      url: "https://blogs.bing.com/webmaster/2025/7/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search/",
    },
    {
      title: "What Is a Sitemap | Google Search Central",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview",
    },
    {
      title: "Build and Submit a Sitemap | Google Search Central",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
    },
    { title: "sitemaps.org - Protocol", publisher: "sitemaps.org", url: "https://www.sitemaps.org/protocol.html" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> An XML sitemap for AI search is the same file you use for classic SEO: a list of
        your important URLs with accurate last-modified dates. It helps search indexes such as Bing and Google, which AI
        assistants draw on, find new and changed pages sooner. Keep it complete, list it in robots.txt, and never fake the dates.
      </p>

      <p>
        This guide is for business owners, marketers and developers who want their pages found and refreshed by the
        search indexes AI assistants rely on. It covers what the engines actually read in a sitemap, what they ignore,
        and a setup checklist you can finish in an afternoon.
      </p>

      <h2>Does an XML sitemap help with AI search?</h2>
      <p>
        Yes, an XML sitemap helps with AI search because AI answers are built on top of search indexes, and a sitemap
        helps those indexes find every page you care about and notice when it changes. Microsoft said so directly in a
        July 2025 post on the{" "}
        <a
          href="https://blogs.bing.com/webmaster/2025/7/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search/"
          {...ext}
        >
          Bing Webmaster blog
        </a>
        : while IndexNow notifies engines of immediate changes, sitemaps remain a foundational signal for complete URL
        coverage in AI-powered search.
      </p>
      <p>
        That matters beyond Bing itself. ChatGPT search uses outside search providers, and our explainer on{" "}
        <Link href="/blog/does-chatgpt-use-bing">whether ChatGPT uses Bing</Link> covers what OpenAI has said about
        that. Google&apos;s AI Overviews and AI Mode draw on Google&apos;s own index. In both cases a page that the
        index has not crawled, or crawled months ago, cannot be the source an assistant quotes today.
      </p>
      <p>
        A sitemap is a discovery and freshness aid, not a ranking factor. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview" {...ext}>
          sitemap overview
        </a>{" "}
        says a sitemap helps search engines discover URLs but doesn&apos;t guarantee that every item in it will be
        crawled and indexed. What gets quoted still depends on what the page says.
      </p>

      <h2>What do AI-era search engines actually read in a sitemap?</h2>
      <p>
        AI-era search engines read two things in a sitemap that really matter: the page address in <code>loc</code>{" "}
        and the last real change in <code>lastmod</code>. The other optional tags do nothing for Bing or Google.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tag</th>
              <th>Bing</th>
              <th>Google</th>
              <th>What to do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>loc</code>
              </td>
              <td>Required</td>
              <td>Required; crawled exactly as listed</td>
              <td>Full absolute canonical URLs only</td>
            </tr>
            <tr>
              <td>
                <code>lastmod</code>
              </td>
              <td>A key signal for recrawl priority</td>
              <td>Used if consistently and verifiably accurate</td>
              <td>Set it to the last significant content change</td>
            </tr>
            <tr>
              <td>
                <code>changefreq</code>
              </td>
              <td>Ignored</td>
              <td>Ignored</td>
              <td>Leave it out or leave it alone</td>
            </tr>
            <tr>
              <td>
                <code>priority</code>
              </td>
              <td>Ignored</td>
              <td>Ignored</td>
              <td>Leave it out or leave it alone</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Bing&apos;s post says lastmod helps it decide which URLs to recrawl and reindex, or skip entirely if nothing has
        changed, and that freshness signals affect how quickly updates show up in AI-generated answers. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap" {...ext}>
          build and submit guide
        </a>{" "}
        says it ignores priority and changefreq and uses lastmod only when it is consistently and verifiably accurate,
        for example when it matches the page&apos;s own last modification.
      </p>

      <h2>Why does an accurate lastmod matter so much?</h2>
      <p>
        An accurate lastmod matters because it is the only freshness signal in a sitemap that engines trust, and they
        stop trusting it if it lies. Many sitemap generators stamp every URL with the time the sitemap was built.
        That tells the crawler everything changed, every day, which quickly teaches it that your dates mean nothing.
      </p>
      <p>
        Both engines spell out what counts. Bing says to avoid setting lastmod to the sitemap&apos;s generation time
        unless the page content really changed. Google says an update to the main content, the structured data or the
        links on a page is generally significant, while changing the copyright date is not. The{" "}
        <a href="https://www.sitemaps.org/protocol.html" {...ext}>
          sitemaps.org protocol
        </a>{" "}
        adds that the date must be when the linked page was last modified, not when the sitemap was generated.
      </p>
      <p>
        Bing recommends ISO 8601 dates with both date and time, such as <code>2026-11-20T09:30:00+00:00</code>, for a
        more precise signal. The protocol also allows a plain <code>YYYY-MM-DD</code> date. Freshness is a theme across
        AI search, as we cover in <Link href="/blog/content-freshness-ai-search">content freshness and AI search</Link>,
        and an honest lastmod is how a sitemap carries it.
      </p>

      <h2>Do small websites need a sitemap?</h2>
      <p>
        Small websites often do not strictly need a sitemap, but most benefit from one and it costs almost nothing.
        Google says you might not need one if your site has about 500 pages or fewer that matter for search, every
        important page is reachable through links from the home page, and you have few media or news pages.
      </p>
      <p>
        Google also says you might need one if your site is new and has few external links, because crawlers find
        pages by following links from pages they already know. That describes a lot of small business sites. If you run
        WordPress, Wix or a similar platform, Google notes your CMS has likely already made a sitemap for you; your job
        is to check it is correct. Our guide to{" "}
        <Link href="/blog/ai-visibility-for-a-new-website">AI visibility for a new website</Link> covers the other
        early steps.
      </p>

      <h2>How do you set up an XML sitemap for AI search step by step?</h2>
      <p>
        You set up an XML sitemap for AI search in seven steps, starting with finding the one your platform already
        makes. Most of the work is checking, not building.
      </p>
      <ol>
        <li>
          <strong>Find your current sitemap.</strong> Try <code>/sitemap.xml</code> or <code>/sitemap_index.xml</code>{" "}
          on your domain, or check your CMS or SEO plugin settings.
        </li>
        <li>
          <strong>Keep only pages you want found.</strong> List canonical, indexable URLs that return 200. Remove
          redirects, 404s, noindex pages, thin tag archives and duplicate parameter URLs.
        </li>
        <li>
          <strong>Use full absolute URLs.</strong> Google says to use fully qualified URLs, such as{" "}
          <code>https://www.example.com/services/</code>, not relative paths, and to pick one version of each page.
        </li>
        <li>
          <strong>Fix lastmod.</strong> Make sure each date reflects the last real content change. If your generator
          cannot do that, leaving lastmod out is better than filling it with build times.
        </li>
        <li>
          <strong>Split large sites.</strong> A single file can hold up to 50,000 URLs or 50MB uncompressed, according
          to the protocol. Above that, split the files and list them in a sitemap index.
        </li>
        <li>
          <strong>List it in robots.txt.</strong> Add a line such as <code>Sitemap: https://www.example.com/sitemap.xml</code>.
          Bing names this as one of its two submission methods, and any crawler that reads robots.txt can find it.
        </li>
        <li>
          <strong>Submit it in both consoles.</strong> Submit the sitemap in Google Search Console and Bing Webmaster
          Tools, then check each one&apos;s status and last-read date for errors.
        </li>
      </ol>
      <p>
        Bing says it fetches a sitemap as soon as you submit it or reference it in robots.txt, and then revisits it
        regularly, typically at least once a day. Its Webmaster Tools also has an{" "}
        <Link href="/blog/bing-ai-performance-report">AI performance report</Link> that shows how often your pages are
        cited in Copilot and related AI experiences.
      </p>

      <h2>How do a sitemap, IndexNow, robots.txt and llms.txt work together?</h2>
      <p>
        A sitemap, IndexNow, robots.txt and llms.txt each do a different job, and a well-set-up site uses all four. None
        replaces the others.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>File or protocol</th>
              <th>Job</th>
              <th>Who reads it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>XML sitemap</td>
              <td>Complete list of pages and when each really changed</td>
              <td>Google, Bing and other search crawlers</td>
            </tr>
            <tr>
              <td>IndexNow</td>
              <td>Instant ping when a URL is added, changed or removed</td>
              <td>Bing and other IndexNow engines; not Google</td>
            </tr>
            <tr>
              <td>robots.txt</td>
              <td>Which crawlers may fetch which paths, plus where the sitemap is</td>
              <td>Search and AI crawlers, including OpenAI&apos;s</td>
            </tr>
            <tr>
              <td>llms.txt</td>
              <td>A short curated guide to your most useful pages</td>
              <td>A proposed standard; support varies by tool</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The sitemap is your full inventory and IndexNow is your doorbell: see{" "}
        <Link href="/blog/indexnow-for-ai-search">IndexNow for AI search</Link> for setup. robots.txt decides who gets
        in at all. OpenAI&apos;s{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          crawler overview
        </a>{" "}
        says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers, and recommends allowing it
        if you want to appear. A perfect sitemap does nothing if robots.txt or a firewall blocks the crawler, which our{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> walks through. For the
        curated layer, see <Link href="/blog/how-to-create-llms-txt-file">how to create an llms.txt file</Link>.
      </p>

      <h2>What sitemap mistakes hurt AI visibility?</h2>
      <p>
        The sitemap mistakes that hurt AI visibility most are the ones that waste crawl attention or hide real changes.
        These are the common ones.
      </p>
      <ul>
        <li>
          <strong>Fake lastmod dates</strong> set to the build time on every URL, so real updates look like noise.
        </li>
        <li>
          <strong>Listing URLs that redirect, 404 or are noindex</strong>, which sends crawlers to pages you do not want
          in an index.
        </li>
        <li>
          <strong>Missing key pages</strong>, such as new service, location or pricing pages added outside the CMS.
        </li>
        <li>
          <strong>A sitemap nobody can reach</strong>, because a staging rule, password or bot protection blocks it.
        </li>
        <li>
          <strong>Mixed versions of the same page</strong>, such as http and https, or with and without www, instead
          of the canonical URL only.
        </li>
      </ul>
      <p>
        Internal links matter as much as the sitemap, because Google says well-linked sites are usually discovered
        without one. Our guide to <Link href="/blog/internal-linking-for-ai-search">internal linking for AI search</Link>{" "}
        covers that side.
      </p>

      <h2>How can Alphaa help with sitemaps and AI visibility?</h2>
      <p>
        Alphaa runs a 23-point check of what AI assistants can read on your site and asks ChatGPT, Gemini, Claude and
        Perplexity every week what they say about you.
        When it finds a gap, it drafts the fix for your approval, such as a missing service page, FAQ answers,
        structured data or an llms.txt file.
      </p>
      <p>
        Approved changes publish to WordPress, Shopify or Webflow through{" "}
        <Link href="/integrations">Alphaa&apos;s integrations</Link>, from $99 a month. Alphaa cannot make an assistant
        cite you, but it shows where your public information is missing, stale or blocked. Start with the{" "}
        <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else do people ask about sitemaps and AI search?</h2>

      <h3>Is there a special sitemap format for AI crawlers?</h3>
      <p>
        No, there is no separate sitemap format for AI crawlers; the standard XML sitemap protocol is what Bing and
        Google read. Bing says XML remains its preferred format because it carries lastmod.
      </p>

      <h3>Should I remove changefreq and priority from my sitemap?</h3>
      <p>
        You can, but it is not urgent, because Bing and Google both say they ignore those tags. Spend the time on
        accurate lastmod dates and a clean URL list instead.
      </p>

      <h3>Can I submit an RSS feed instead of a sitemap?</h3>
      <p>
        Google accepts RSS 2.0 and Atom 1.0 feeds as sitemaps, but it notes a feed only covers recent URLs. Use a feed
        alongside a full XML sitemap, not instead of one.
      </p>

      <h3>How often should my sitemap update?</h3>
      <p>
        Your sitemap should update whenever you add, remove or significantly change a page, which most CMSs do
        automatically. Bing says it typically rereads submitted sitemaps at least once a day.
      </p>

      <h3>Does a sitemap get my pages into ChatGPT?</h3>
      <p>
        Not by itself, because a sitemap only helps search indexes discover and refresh your pages. Whether ChatGPT
        cites a page depends on the crawler being allowed in and on the page clearly answering the question asked.
      </p>
    </div>
  )
}
