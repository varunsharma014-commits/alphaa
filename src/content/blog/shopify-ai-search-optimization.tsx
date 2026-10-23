import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "shopify-ai-search-optimization",
  title: "Shopify AI Search Optimization: A Practical 2026 Guide",
  description:
    "How Shopify stores get found in ChatGPT, Gemini, Claude and Perplexity: Agentic Storefronts, robots.txt.liquid, product data and the content AI quotes.",
  subtitle:
    "Shopify AI search optimization has two halves: product data that flows to AI shopping channels through Shopify Catalog, and crawlable store content that assistants can read and cite.",
  date: "2026-10-23",
  updated: "2026-10-23",
  readMins: 7,
  tag: "Guide",
  kind: "guide",
  keyphrase: "shopify ai search optimization",
  image: {
    src: "/blog/shopify-ai-search-optimization.webp",
    alt: "A stack of folded cream linen and two kraft-paper parcels tied with string on a wooden sideboard under a paper lantern.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Shopify says Agentic Storefronts give merchants access to ChatGPT, Microsoft Copilot, AI Mode in Google Search and the Gemini app.",
    "Shopify's changelog says products reach AI channels such as ChatGPT and Copilot automatically through Shopify Catalog.",
    "Shopify's default robots.txt allows public products, collections, pages and blogs, and Shopify warns that editing it can lose all traffic.",
    "OpenAI says sites that block OAI-SearchBot will not be shown in ChatGPT search answers, apart from navigational links.",
    "Product feeds cover shopping answers; blog posts, FAQ pages and policies are what assistants quote for research questions.",
  ],
  sources: [
    { title: "Millions of merchants can sell in AI chats", publisher: "Shopify", url: "https://www.shopify.com/news/agentic-commerce-momentum" },
    {
      title: "A new home for Agentic Storefronts in your admin - Shopify developer changelog",
      publisher: "Shopify",
      url: "https://shopify.dev/changelog/a-new-home-for-agentic-storefronts-in-your-admin",
    },
    { title: "Editing robots.txt.liquid", publisher: "Shopify Help Center", url: "https://help.shopify.com/en/manual/promoting-marketing/seo/editing-robots-txt" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
    {
      title: "Product (Product, Review, Offer) structured data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/product",
    },
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Shopify AI search optimization means two things: keeping your product data
        complete so it flows to AI shopping channels through Shopify Catalog, and publishing crawlable store content
        that assistants can quote. Start by checking your Agentic Storefronts page in the Shopify admin, then fix thin
        product descriptions and missing buyer-question pages.
      </p>

      <p>
        This guide is for Shopify merchants and the people who run their stores. It separates what Shopify now does for
        you automatically from what it cannot do, and covers the settings that quietly block AI crawlers.
      </p>

      <h2>What is Shopify AI search optimization?</h2>
      <p>
        Shopify AI search optimization is the work of making a Shopify store&apos;s products and content easy for
        ChatGPT, Gemini, Claude and Perplexity to find, understand and recommend. On Shopify it splits into two
        channels that work differently.
      </p>
      <ul>
        <li>
          <strong>Shopping answers.</strong> When someone asks an assistant to find a product, structured product data
          (titles, prices, availability, variants) matters most. Shopify now syndicates that data for you.
        </li>
        <li>
          <strong>Research answers.</strong> When someone asks &quot;which running shoe is best for flat feet&quot; or
          &quot;is merino worth it for hiking&quot;, assistants quote pages: buying guides, FAQ pages, comparisons and
          policies. That content is still yours to write.
        </li>
      </ul>
      <p>
        Most stores do fine on the first and badly on the second. The broader discipline is explained in{" "}
        <Link href="/blog/what-is-answer-engine-optimization">what answer engine optimization is</Link>.
      </p>

      <h2>What are Shopify Agentic Storefronts?</h2>
      <p>
        Agentic Storefronts are Shopify&apos;s built-in connection that puts merchants&apos; products in AI chat
        channels without separate apps or feeds. Shopify&apos;s announcement,{" "}
        <a href="https://www.shopify.com/news/agentic-commerce-momentum" {...ext}>
          Millions of merchants can sell in AI chats
        </a>{" "}
        (24 March 2026), names ChatGPT, Microsoft Copilot, AI Mode in Google Search and the Gemini app, and says products
        stay synced with real-time inventory and pricing. It also says orders from ChatGPT appear in your admin with
        referral attribution, and that you remain the merchant of record.
      </p>
      <p>
        Shopify&apos;s{" "}
        <a href="https://shopify.dev/changelog/a-new-home-for-agentic-storefronts-in-your-admin" {...ext}>
          developer changelog
        </a>{" "}
        (11 May 2026) adds that products are automatically accessible to AI channels through Shopify Catalog, and that
        Agentic Storefronts now has its own admin page. From there you can monitor performance across AI channels, see
        which queries your products appear for, and get suggestions for improving product data. Open it first: it is
        the only first-party view of how your catalogue performs in AI shopping.
      </p>

      <h2>How do you optimize a Shopify store for AI search, step by step?</h2>
      <p>
        There are seven steps, ordered so that nothing you do later is wasted by a block you missed earlier.
      </p>
      <ol>
        <li>
          <strong>Remove the storefront password.</strong> A store still behind its launch password is invisible to
          every crawler. Check while logged out, in a private window.
        </li>
        <li>
          <strong>Check robots.txt and any bot protection.</strong> Visit yourstore.com/robots.txt and confirm no rule
          names OAI-SearchBot, Claude-SearchBot or PerplexityBot. Check any CDN or app that blocks bots too.
        </li>
        <li>
          <strong>Review your Agentic Storefronts page.</strong> Act on its product-data suggestions and note which
          queries your products already appear for.
        </li>
        <li>
          <strong>Rewrite thin product descriptions.</strong> Replace supplier copy with specific facts: materials,
          dimensions, fit, compatibility, care, who it is for and who it is not for.
        </li>
        <li>
          <strong>Write collection intros.</strong> Two or three sentences at the top of each collection that say what
          is in it and how to choose, in plain text rather than an image banner.
        </li>
        <li>
          <strong>Publish buyer-question content.</strong> Blog posts and pages that answer the questions shoppers ask
          before buying, each opening with a direct answer.
        </li>
        <li>
          <strong>Make policies plain.</strong> Shipping times, returns, warranty and sizing written as text on public
          pages, because assistants are often asked about them.
        </li>
      </ol>

      <h2>Does Shopify block AI crawlers?</h2>
      <p>
        No, Shopify&apos;s default robots.txt does not block AI search crawlers. Shopify&apos;s help article{" "}
        <a href="https://help.shopify.com/en/manual/promoting-marketing/seo/editing-robots-txt" {...ext}>
          Editing robots.txt.liquid
        </a>{" "}
        says the default file allows crawlers to request public products, collections, pages, blogs and policies, and
        blocks admin, cart, checkout, account and filtered or sorted collection URLs. When we checked several live
        Shopify stores in October 2026, their default files named no AI crawlers at all.
      </p>
      <p>
        That matters because OpenAI&apos;s{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          crawler overview
        </a>{" "}
        says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers, apart from navigational
        links, while GPTBot is a separate training crawler. Blocks on Shopify stores usually come from a theme developer
        or an app that edited the file, or from a CDN placed in front of the store. The full list of crawler names is in
        the <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers robots.txt guide</Link>.
      </p>

      <h2>Should you edit robots.txt.liquid on Shopify?</h2>
      <p>
        Only if you have a specific reason and someone who knows Liquid, because Shopify treats it as an unsupported
        customisation. Its help article warns that incorrect use can result in loss of all traffic, that Shopify
        Support cannot help with edits, and that replacing the template with plain-text rules is strongly not
        recommended because rules may go out of date.
      </p>
      <p>
        For most stores the right move is to leave the default alone. If you want to opt out of AI training while
        staying visible in AI search, a developer can add a GPTBot or ClaudeBot disallow through Liquid while leaving
        OAI-SearchBot, Claude-SearchBot and PerplexityBot allowed. Test the live file afterwards.
      </p>

      <h2>What product data helps AI recommend your products?</h2>
      <p>
        Complete, specific and consistent product data helps most, because assistants compare products on facts they
        can read. These are the fields worth auditing first:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>What good looks like</th>
              <th>Common problem</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Title</td>
              <td>Product type, key attribute and variant, in plain words</td>
              <td>Brand-only names that do not say what it is</td>
            </tr>
            <tr>
              <td>Description</td>
              <td>Materials, sizes, use cases, compatibility, care</td>
              <td>Copied supplier text shared with other stores</td>
            </tr>
            <tr>
              <td>Price and availability</td>
              <td>Accurate per variant and in stock where listed</td>
              <td>Sold-out variants still shown as available</td>
            </tr>
            <tr>
              <td>Images and alt text</td>
              <td>Alt text that describes the product literally</td>
              <td>Empty alt text or file names as alt text</td>
            </tr>
            <tr>
              <td>Reviews</td>
              <td>Visible on the product page as text</td>
              <td>Reviews loaded only inside a script widget</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Most Shopify themes output Product structured data with price and availability. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/product" {...ext}>
          product structured data documentation
        </a>{" "}
        explains the properties; check your theme&apos;s output with the Rich Results Test rather than adding a second
        schema app, which often duplicates markup. For more on what assistants weigh, see{" "}
        <Link href="/blog/ecommerce-products-recommended-by-ai">how ecommerce products get recommended by AI</Link>.
      </p>

      <h2>What content should a Shopify store publish for AI answers?</h2>
      <p>
        Publish pages that answer the questions shoppers ask before they buy, each with a direct answer in the first two
        sentences. Product feeds cannot answer &quot;which one should I get&quot;, and that is where research answers
        come from.
      </p>
      <ul>
        <li>
          <strong>Buying guides.</strong> &quot;How to choose a&quot; posts that compare your own products by use
          case, with a table.
        </li>
        <li>
          <strong>Sizing and fit pages.</strong> In text, with measurements, not only an image chart.
        </li>
        <li>
          <strong>Comparison posts.</strong> Honest comparisons between product types or materials your customers
          weigh up.
        </li>
        <li>
          <strong>An FAQ page.</strong> Built from real customer service questions, with one short answer each.
        </li>
      </ul>
      <p>
        Google says in{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        that there are no additional requirements to appear in AI Overviews or AI Mode beyond being indexed and eligible
        for a snippet, so this content serves ordinary search too. The writing approach is in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI will quote</Link>.
      </p>

      <h2>What can Shopify apps not change for AI search?</h2>
      <p>
        Apps with content permissions cannot edit theme files or robots.txt, so sitewide structured data, crawler rules
        and a root-level llms.txt need a theme developer. Shopify also keeps your homepage title and description in
        Online Store → Preferences, which apps cannot change.
      </p>
      <p>
        The <Link href="/integrations/shopify">Alphaa app for Shopify</Link> works within those limits. It asks only for
        read_content and write_content, publishes the blog posts and pages you approve, updates their search titles and
        descriptions, and has an undo on each change. For the theme-level changes it cannot make, it tells you or your
        developer exactly what to change. It has no access to orders, customers, products or payments.
      </p>

      <h2>How do you check whether it is working?</h2>
      <p>
        Check three places: your Agentic Storefronts page, your analytics, and the assistants themselves. The admin page
        shows AI-channel performance, and Shopify says ChatGPT orders carry referral attribution. In Google Analytics,
        visits from chatgpt.com, perplexity.ai and similar domains show as referrals; the setup is in{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">how to track AI traffic in Google Analytics</Link>.
      </p>
      <p>
        Then ask ChatGPT, Gemini, Claude and Perplexity the questions your shoppers ask and note which stores and pages
        they name. Answers vary between runs, so look for a pattern over several weeks. The{" "}
        <Link href="/start">free 60-second AI check</Link> gives you a baseline across all four.
      </p>

      <h2>What else do Shopify merchants ask about AI search?</h2>

      <h3>Do I need an app to sell through ChatGPT on Shopify?</h3>
      <p>
        No, Shopify says Agentic Storefronts are managed in the admin without separate apps or feeds. Eligibility and
        settings can vary by store and region, so check the Agentic Storefronts page in your own admin.
      </p>

      <h3>Can I add an llms.txt file to a Shopify store?</h3>
      <p>
        Not through the admin, because Shopify has no built-in way to place a file at your store&apos;s root. A theme
        developer can set one up, but it is optional and unproven, so product data and answer pages matter far more.
      </p>

      <h3>Does Shopify&apos;s blog help with AI visibility?</h3>
      <p>
        Yes, the built-in blog is crawlable and fine for AI search if posts answer real buyer questions. If your store
        has no blog yet, add one under Online Store → Blog posts → Manage blogs.
      </p>

      <h3>Should I block GPTBot on my Shopify store?</h3>
      <p>
        That is a training choice, not a visibility one. OpenAI says GPTBot collects training data while OAI-SearchBot
        decides whether you can appear in ChatGPT search, so you can block one and allow the other.
      </p>

      <h3>Will AI shopping channels replace my store&apos;s own SEO?</h3>
      <p>
        No, they add a channel rather than replace one. Shoppers who research before buying still read pages, and those
        same pages are what Google and the assistants cite.
      </p>
    </div>
  )
}
