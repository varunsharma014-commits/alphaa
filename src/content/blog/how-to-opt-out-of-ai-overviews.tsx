import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-opt-out-of-ai-overviews",
  title: "How to Opt Out of AI Overviews: Google's New Control",
  description:
    "Google now lets sites opt out of AI Overviews, AI Mode and Discover AI in Search Console. What the control does, what it does not, and whether to use it.",
  subtitle:
    "You opt out of AI Overviews with the Search generative AI control under Settings in Search Console, which also removes your site from AI Mode and Discover's AI features.",
  date: "2026-11-11",
  updated: "2026-11-11",
  readMins: 5,
  tag: "News",
  kind: "news",
  keyphrase: "opt out of ai overviews",
  image: {
    src: "/blog/how-to-opt-out-of-ai-overviews.webp",
    alt: "A single brass toggle switch on a brushed brass plate mounted on a pale wooden wall, in soft side light.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google began testing a Search Console toggle for its generative AI features on 3 June 2026 and rolled it out worldwide by 31 August 2026.",
    "The control covers AI Overviews, AI Mode and generative AI features in Discover, and sits under Settings, Search generative AI.",
    "Excluded sites get no traffic or impressions from those features, and Google says the setting is not a ranking signal elsewhere in Search.",
    "The control does not stop AI training; Google points to Google-Extended for that, and to noindex to leave Search entirely.",
    "It has no effect on ChatGPT, Claude, Gemini or Perplexity, which follow their own crawlers and rules.",
  ],
  sources: [
    {
      title: "New opportunities, control and insights for website owners",
      publisher: "Google",
      url: "https://blog.google/products-and-platforms/products/search/new-opportunities-control-and-insights-for-website-owners/",
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
    {
      title: "Google's common crawlers | Google Crawling Infrastructure",
      publisher: "Google for Developers",
      url: "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> To opt out of AI Overviews, open Search Console, go to Settings, then Search
        generative AI, and choose to exclude your site. Google rolled the control out to all sites by 31 August 2026.
        It also removes you from AI Mode and Discover&apos;s AI features, and you lose all traffic and impressions from
        them.
      </p>

      <p>
        This explainer covers what Google announced, what the setting does and does not do, and why most businesses
        that want customers should leave it switched on.
      </p>

      <h2>What did Google announce?</h2>
      <p>
        Google announced a Search Console toggle that lets site owners choose whether their links and content appear in
        its generative AI Search features. In a{" "}
        <a
          href="https://blog.google/products-and-platforms/products/search/new-opportunities-control-and-insights-for-website-owners/"
          {...ext}
        >
          post dated 3 June 2026
        </a>
        , Google said it was beginning to test the control with a subset of website owners in the UK, and mentioned
        its engagement with regulators such as the UK&apos;s Competition and Markets Authority. An update on the same post
        says that as of 31 August 2026 the features had rolled out to all websites worldwide.
      </p>
      <p>
        The same announcement introduced the generative AI performance reports in Search Console, which show your
        impressions in these features. Our{" "}
        <Link href="/blog/search-console-generative-ai-report">guide to the generative AI report</Link> explains how to
        read them.
      </p>

      <h2>Which AI features does the control cover?</h2>
      <p>
        The control covers three features: AI Overviews, AI Mode and generative AI features in Google Discover.
        Google&apos;s{" "}
        <a href="https://support.google.com/webmasters/answer/16908024" {...ext}>
          help page for the control
        </a>{" "}
        says it expects to update that list over time.
      </p>

      <h2>How do you opt out of AI Overviews step by step?</h2>
      <p>
        You opt out in four steps inside Search Console, and Google says the change generally takes a few days to take
        full effect.
      </p>
      <ol>
        <li>
          <strong>Open the right property.</strong> Use the highest-level property you own, such as the domain
          property, because child properties inherit its setting by default.
        </li>
        <li>
          <strong>Go to Settings, then Search generative AI.</strong>
        </li>
        <li>
          <strong>Choose &quot;Exclude my site&apos;s links and content from Search generative AI features&quot;.</strong>{" "}
          The default for every property is to include them.
        </li>
        <li>
          <strong>Wait and check.</strong> Google says content is excluded within one to two days after the control goes
          live, though caching can make some take longer.
        </li>
      </ol>
      <p>
        A child property, such as a subfolder set up as its own URL-prefix property, can override the parent and set its
        own choice. That lets a publisher exclude one section while leaving the rest of the site included.
      </p>

      <h2>What happens when you exclude your site?</h2>
      <p>
        When you exclude your site, its links and content stop appearing in those AI features and stop being used to
        ground their answers. Google&apos;s help page spells out the effects.
      </p>
      <ul>
        <li>You receive no traffic and no impressions from AI Overviews, AI Mode or Discover&apos;s AI features.</li>
        <li>Content from other sites still appears, and Google notes it may look similar to yours.</li>
        <li>The setting is not used as a ranking or inclusion signal in the rest of Search.</li>
        <li>It does not override separate choices such as Merchant Center or Google Ads participation.</li>
        <li>Your content may still help Google Search as a whole, for example in understanding language.</li>
      </ul>

      <h2>Does the control stop Google training AI on your content?</h2>
      <p>
        No, the control does not affect AI training. Google&apos;s help page says to use Google-Extended to limit
        training of the models used in its generative AI features, and noindex to leave Google Search completely.
      </p>
      <p>
        Google-Extended is a robots.txt token rather than a separate crawler. Google&apos;s{" "}
        <a href="https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers" {...ext}>
          crawler documentation
        </a>{" "}
        says it does not affect inclusion or ranking in Google Search. The older page-level tools still work too:
        Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features guide
        </a>{" "}
        lists nosnippet, data-nosnippet, max-snippet and noindex as the ways to limit what is shown from a page. Our{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> covers the bots of other
        AI companies.
      </p>

      <h2>Should a business opt out of AI Overviews?</h2>
      <p>
        Most businesses that want customers should not opt out, because the control removes them from answers that
        their customers read, while competitors stay in. AI Overviews now appear in up to ~48% of commercial-intent
        searches (BrightEdge, 2026). Opting out does not remove the AI answer, only your place in it.
      </p>
      <p>
        The case for opting out is narrower. It suits publishers whose business is the content itself, who want to
        test whether AI answers are taking visits they would otherwise get. Measure first: the generative AI report
        shows your impressions, and Google suggests using it to estimate how a change would affect your traffic.
      </p>
      <p>
        For a local business, the better move is usually the reverse: make sure the AI features describe you correctly.
        Our guide to{" "}
        <Link href="/blog/google-ai-overviews-local-business">Google AI Overviews for local businesses</Link> shows how,
        and Alphaa checks what ChatGPT, Gemini, Claude and Perplexity say about you each week and drafts fixes you
        approve, from $99 a month. The <Link href="/start">free 60-second check</Link> is a quick baseline.
      </p>

      <h2>What else do site owners ask about the AI Overviews opt-out?</h2>

      <h3>Does opting out of AI Overviews hurt my normal Google rankings?</h3>
      <p>
        Google says no: the control is not used as a ranking or inclusion signal for other parts of Search. Your
        ordinary results should be unaffected by the setting itself.
      </p>

      <h3>Does the Google control affect ChatGPT or Perplexity?</h3>
      <p>
        No, it only covers Google&apos;s own generative AI features. ChatGPT, Claude and Perplexity use their own crawlers,
        which you manage in robots.txt.
      </p>

      <h3>Can I opt out of AI Overviews for only some pages?</h3>
      <p>
        You can set a different choice for a section that has its own URL-prefix property in Search Console. For single
        pages, the nosnippet and data-nosnippet controls limit what Google shows.
      </p>

      <h3>Can I opt back in after excluding my site?</h3>
      <p>
        Yes, you can switch the control back to include at any time in the same settings page. Expect a few days for
        the change to spread through Google&apos;s systems, as with the opt-out.
      </p>
    </div>
  )
}
