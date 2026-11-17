import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "internal-linking-for-ai-search",
  title: "Internal Linking for AI Search: A Practical 2026 Guide",
  description:
    "Internal linking for AI search explained: how links help AI crawlers find and understand your pages, what to link, anchor text rules, and a 7-step fix list.",
  subtitle:
    "Internal links help AI search engines find your important pages, understand what each one covers and how they relate, so every page you want quoted should be linked from relevant pages with descriptive anchor text.",
  date: "2026-11-17",
  updated: "2026-11-17",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "internal linking for ai search",
  takeaways: [
    "Google lists making content findable through internal links among its best practices for AI Overviews and AI Mode.",
    "Google says every page you care about should have a link from at least one other page on your site.",
    "Crawlers reliably follow standard a elements with an href; links built only with onclick or span tags may be missed.",
    "Descriptive anchor text tells people and crawlers what a linked page covers; avoid generic phrases like click here.",
    "AI search crawlers such as OAI-SearchBot and PerplexityBot discover pages to show in answers, so orphan pages are easy to miss.",
  ],
  sources: [
    {
      title: "SEO Link Best Practices for Google | Google Search Central",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "SEO Starter Guide: The Basics | Google Search Central",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    },
    {
      title: "What Is a Sitemap | Google Search Central",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview",
    },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
    { title: "Perplexity Crawlers", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Internal linking for AI search means linking your own pages to each other so
        AI crawlers can find every page worth quoting and understand what it covers. Link each important page from
        related pages, use plain HTML links with descriptive anchor text, and make sure no service, FAQ or pricing
        page sits orphaned.
      </p>

      <p>
        This guide is for owners and marketers of small and mid-sized sites who want ChatGPT, Gemini, Claude,
        Perplexity and Google&apos;s AI features to find the right page when they answer a question. It sticks to what
        the search engines and AI companies document, and says plainly where the evidence stops.
      </p>

      <h2>Why does internal linking matter for AI search?</h2>
      <p>
        Internal linking matters for AI search because AI answers can only cite pages their search systems have
        found, and links are the main way pages get found. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" {...ext}>
          SEO Starter Guide
        </a>{" "}
        says it primarily finds pages through links from pages it already crawled.
      </p>
      <p>
        Google&apos;s guidance for{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Overviews and AI Mode
        </a>{" "}
        lists making content easily findable through internal links among the SEO basics that still apply. It says a
        page needs to be indexed and eligible to show a snippet to be a supporting link, and that there are no extra
        technical requirements. In other words, nothing special unlocks AI features; the basics, internal links
        included, are the work.
      </p>
      <p>
        The chat assistants follow the same pattern. OpenAI says{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          OAI-SearchBot
        </a>{" "}
        is used to surface websites in ChatGPT&apos;s search features, and Perplexity says{" "}
        <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
          PerplexityBot
        </a>{" "}
        is designed to surface and link websites in its results. A crawler that never reaches a page cannot offer it
        as a source. Our guide to <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt</Link>{" "}
        covers how to let these bots in.
      </p>

      <h2>How do AI crawlers follow internal links?</h2>
      <p>
        AI crawlers follow internal links the same way search crawlers do: they read standard HTML anchor elements
        with an href attribute and request the URL inside. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable" {...ext}>
          link best practices
        </a>{" "}
        say it can reliably follow an a element with an href, and that links built only with onclick handlers or
        span tags may not be parsed.
      </p>
      <p>
        Google also says links inserted with JavaScript are fine as long as the rendered HTML uses the same markup.
        Not every crawler renders JavaScript the way Google does, so links that only appear after scripts run are a
        risk for smaller AI crawlers. Our explainer on{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link> goes into
        that trade-off. The safe default is simple: put important links in the HTML the server sends.
      </p>

      <h2>Which pages should you link to most?</h2>
      <p>
        Link most to the pages you want AI answers to quote: service pages, pricing, FAQs, location pages and any
        original research or case studies. These pages carry the specific facts an assistant needs to recommend you,
        so they deserve links from your homepage, navigation and related articles.
      </p>
      <ul>
        <li>
          <strong>Service pages.</strong> One page per service, linked from the homepage and from every article that
          mentions the service. Our guide to the{" "}
          <Link href="/blog/service-page-for-ai-search">service page for AI search</Link> covers what goes on them.
        </li>
        <li>
          <strong>Pricing and FAQ pages.</strong> Questions about cost and policy are common in AI chats; make these
          pages reachable within a click or two of the homepage.
        </li>
        <li>
          <strong>Location pages.</strong> For multi-location businesses, link each location from a locations index
          and from the relevant service pages.
        </li>
        <li>
          <strong>Proof pages.</strong> Case studies, reviews pages and original data should be linked from the
          claims they support.
        </li>
      </ul>

      <h2>What anchor text works best for AI search?</h2>
      <p>
        Descriptive anchor text works best, because it tells both readers and crawlers what the linked page covers
        before they open it. Google describes good anchor text as descriptive, reasonably concise and relevant to
        both the page it sits on and the page it points to.
      </p>
      <p>
        Google advises against generic text such as &quot;click here&quot; or &quot;read more&quot;, and against
        stuffing keywords into anchors or stringing many links together with no surrounding context. Write anchors the
        way you would describe the page to a customer: &quot;emergency boiler repair&quot;, &quot;our pricing&quot;,
        &quot;how we handle refunds&quot;. The sentence around the link also helps, so place links where they make sense
        in the text rather than in a pile at the bottom.
      </p>

      <h2>How does internal linking compare with sitemaps and navigation?</h2>
      <p>
        Internal links, sitemaps and navigation do overlapping jobs, but only links in content also explain how pages
        relate. Google says a sitemap helps discovery on large or poorly linked sites, but does not guarantee every URL
        is crawled or indexed. This table sets out what each one does.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Helps discovery</th>
              <th>Shows how pages relate</th>
              <th>Best use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Links inside content</td>
              <td>Yes</td>
              <td>Yes, through anchor text and surrounding sentences</td>
              <td>Connecting articles to services, pricing and proof</td>
            </tr>
            <tr>
              <td>Main navigation</td>
              <td>Yes</td>
              <td>Partly, by showing top-level sections</td>
              <td>Keeping key pages one click from anywhere</td>
            </tr>
            <tr>
              <td>Breadcrumbs</td>
              <td>Yes</td>
              <td>Yes, by showing the page&apos;s place in a section</td>
              <td>Sites with categories or several levels</td>
            </tr>
            <tr>
              <td>XML sitemap</td>
              <td>Yes, without guarantee</td>
              <td>No</td>
              <td>Large sites, new sites, pages that are hard to reach</td>
            </tr>
            <tr>
              <td>Footer links</td>
              <td>Yes</td>
              <td>Weakly</td>
              <td>Policies, contact and location pages</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Use all of them, but do not rely on the sitemap to rescue a page nothing links to. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview" {...ext}>
          sitemap overview
        </a>{" "}
        says proper linking means every page you consider important can be reached through some form of navigation.
      </p>

      <h2>How do you fix internal linking for AI search step by step?</h2>
      <p>
        You can fix internal linking in seven steps, starting with a list of the pages you most want AI assistants
        to quote. Most small sites can work through this in an afternoon.
      </p>
      <ol>
        <li>
          <strong>List your priority pages.</strong> Write down the 10 to 20 pages that answer the questions customers
          ask: services, pricing, FAQs, locations, proof.
        </li>
        <li>
          <strong>Find orphan pages.</strong> Compare your sitemap with the pages your crawler or CMS shows as linked.
          Any priority page with no internal links pointing to it is the first fix.
        </li>
        <li>
          <strong>Check the link markup.</strong> View the page source and confirm links are a elements with real URLs
          in the href, not buttons or scripts.
        </li>
        <li>
          <strong>Link from your strongest pages.</strong> Add links to priority pages from the homepage, main
          navigation and the articles that already get traffic.
        </li>
        <li>
          <strong>Rewrite vague anchors.</strong> Replace &quot;click here&quot; and &quot;learn more&quot; with text
          that names the page&apos;s topic.
        </li>
        <li>
          <strong>Group related pages.</strong> Link articles on one topic to each other and to a hub page, which helps
          build <Link href="/blog/topical-authority-for-ai-search">topical authority</Link>.
        </li>
        <li>
          <strong>Recheck after changes.</strong> Fix broken links and redirects when pages move, and confirm new pages
          get at least one link the day they go live.
        </li>
      </ol>

      <h2>What internal linking mistakes hurt AI visibility?</h2>
      <p>
        The mistakes that hurt most are orphan pages, links crawlers cannot read, and vague anchors that hide what a
        page covers. Each one makes it harder for an AI system to find or understand the page that best answers a
        question.
      </p>
      <ul>
        <li>
          <strong>Orphan pages.</strong> A page with no internal links may never be found unless it is in a sitemap,
          and even then there is no guarantee.
        </li>
        <li>
          <strong>Script-only links.</strong> Menus or cards that navigate with JavaScript but have no href can hide
          whole sections.
        </li>
        <li>
          <strong>Links behind forms or logins.</strong> Crawlers generally do not fill in forms, so anything reached only through
          search boxes or account areas stays invisible.
        </li>
        <li>
          <strong>Broken and chained redirects.</strong> Links to deleted pages or long redirect chains waste crawl
          visits and confuse readers.
        </li>
        <li>
          <strong>Nofollow on your own links.</strong> Google&apos;s nofollow guidance is about links to sources you do
          not trust, not your own pages; leave internal links followed.
        </li>
      </ul>
      <p>
        Internal links will not make an assistant recommend you by themselves. They make sure the pages carrying your
        facts can be found and read, which is the step everything else depends on. AI answers also run several related
        searches at once, a process explained in our guide to{" "}
        <Link href="/blog/what-is-query-fan-out">query fan-out</Link>, so well-linked supporting pages give the system
        more of your content to draw on.
      </p>

      <h2>How can you check your internal links quickly?</h2>
      <p>
        The quickest check is to open your homepage and see whether you can reach every priority page within two or
        three clicks using only normal links. Then view the source of one key page and confirm its links are plain
        HTML anchors.
      </p>
      <p>
        If you want a wider view, Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> shows what
        ChatGPT, Gemini, Claude and Perplexity say about your business today, and its 23-point site check flags
        pages the assistants struggle to read. On a paid plan, Alphaa drafts the fixes and publishes them to WordPress,
        Shopify or Webflow once you approve.
      </p>

      <h2>What else do people ask about internal linking for AI search?</h2>

      <h3>How many internal links should a page have?</h3>
      <p>
        There is no ideal number; link wherever a related page genuinely helps the reader. Google&apos;s own link
        guidance declines to set a count and suggests that if you think you have too many links, you probably do.
      </p>

      <h3>Do AI crawlers use my XML sitemap?</h3>
      <p>
        Sitemaps help crawlers discover URLs, especially on large or new sites, but they are a backup for links,
        not a replacement. Google says a sitemap does not guarantee that every URL in it will be crawled or indexed.
      </p>

      <h3>Should internal links open in a new tab?</h3>
      <p>
        Internal links usually should open in the same tab, which is what most visitors expect. Opening in a new tab
        does not change whether a crawler can follow the link, so choose based on reader experience.
      </p>

      <h3>Do footer and sidebar links count?</h3>
      <p>
        Footer and sidebar links are crawlable and help discovery, but links inside the main content carry more
        context. Use footers for policies and locations, and put the links that explain a topic in the body text.
      </p>

      <h3>Is internal linking different for ChatGPT than for Google?</h3>
      <p>
        The basics are the same: both rely on crawlers that follow normal HTML links to find pages. The main
        difference is that not every AI crawler may render JavaScript the way Google does, so server-rendered links are
        the safer choice.
      </p>
    </div>
  )
}
