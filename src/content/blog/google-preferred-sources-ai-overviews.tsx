import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "google-preferred-sources-ai-overviews",
  title: "Google Preferred Sources in AI Overviews, Explained",
  description:
    "Google Preferred Sources now appear in AI Overviews and AI Mode. What changed, which sites are eligible, how to set it up, and what it does not do for you.",
  subtitle:
    "Since May 2026, links from sites a person has chosen can carry a Preferred label inside Google's AI answers, which helps with loyal readers more than with new customers.",
  date: "2026-11-09",
  updated: "2026-11-09",
  readMins: 4,
  tag: "News",
  kind: "news",
  keyphrase: "google preferred sources ai overviews",
  image: {
    src: "/blog/google-preferred-sources-ai-overviews.webp",
    alt: "An open blank book on a dark surface with a single glowing ribbon bookmark lying along its centre",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google extended Preferred Sources to AI Overviews and AI Mode in an announcement dated May 27, 2026.",
    "Links from sites a person selected can be labeled Preferred inside that person's AI responses.",
    "Google says any website publishing fresh content is eligible, but only domains and subdomains qualify, not subdirectories.",
    "The feature depends on individual users choosing your site, so it mainly rewards an audience you already have.",
  ],
  sources: [
    {
      title: "How Google Search helps you find original, quality content",
      publisher: "Google",
      url: "https://blog.google/products-and-platforms/products/search/original-high-quality-content-search/",
    },
    {
      title: "Guide to Preferred Sources in Google Search for Web Publishers",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/preferred-sources",
    },
    {
      title: "How to select Preferred Sources in Google Search",
      publisher: "Google",
      url: "https://blog.google/products-and-platforms/products/search/preferred-sources/",
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
        <strong>Short answer:</strong> Google Preferred Sources now extend to AI Overviews and AI Mode, under a May 27,
        2026 announcement. If someone selects your site in their Search settings, your links can carry a Preferred label
        in the AI answers they see. It only affects people who chose you, so it builds loyalty rather than reach.
      </p>

      <h2>What did Google change with Preferred Sources?</h2>
      <p>
        Google took a personalization feature that began in Top Stories and carried it into its AI search products. In{" "}
        <a
          href="https://blog.google/products-and-platforms/products/search/original-high-quality-content-search/"
          {...ext}
        >
          its May 2026 announcement
        </a>
        , Google said links from sources a person has selected will appear in AI responses, labeled Preferred in the
        same way as in Top Stories.
      </p>
      <p>
        Preferred Sources first launched in{" "}
        <a href="https://blog.google/products-and-platforms/products/search/preferred-sources/" {...ext}>
          the U.S. and India in August 2025
        </a>{" "}
        as a way to choose news sites for Top Stories. Google says more than 345,000 unique sources have now been
        selected.
      </p>

      <h2>Which websites are eligible for Preferred Sources?</h2>
      <p>
        Google says any website that publishes fresh content is eligible, which means it is not limited to news
        publishers. The{" "}
        <a href="https://developers.google.com/search/docs/appearance/preferred-sources" {...ext}>
          Search Central guide
        </a>{" "}
        adds a few conditions worth checking:
      </p>
      <ul>
        <li>
          <strong>Domain or subdomain only.</strong> A site at example.com or code.example.com can appear in the source
          preferences tool. A subdirectory such as example.com/blog cannot.
        </li>
        <li>
          <strong>AI features.</strong> To be eligible in AI Overviews and AI Mode, Google says your site must be
          included in Search generative AI features in Search Console.
        </li>
        <li>
          <strong>Languages.</strong> In AI features, it works in the languages and locales where those features are
          available.
        </li>
      </ul>
      <p>
        To check whether you qualify, search for your domain in Google&apos;s source preferences tool. If your site comes
        up, people can select it.
      </p>

      <h2>How do you get readers to add your site?</h2>
      <p>
        You get readers to add your site by sending them a deep link or showing a button that opens Google&apos;s source
        preferences tool with your domain already filled in. Google says both methods are optional and that neither is
        required to appear as a preferred source.
      </p>
      <ol>
        <li>
          Search for your domain in the source preferences tool to confirm it is listed.
        </li>
        <li>
          Build your link in this format, using your own domain:{" "}
          <code>https://www.google.com/preferences/source?q=yourdomain.com</code>.
        </li>
        <li>
          Put the link in your newsletter, social profiles or follow section. Google also offers a JavaScript button and
          downloadable badges, and allows a custom design.
        </li>
      </ol>

      <h2>Does Preferred Sources change which sites AI recommends?</h2>
      <p>
        Nothing in Google&apos;s documentation says it changes which sites AI recommends to the public at large. For Top
        Stories, the guide says being selected makes your content more likely to appear for that person. For AI Mode and
        AI Overviews, the wording is narrower: your content can be highlighted with a preferred badge for people who
        selected your site.
      </p>
      <p>
        Google also says that people are twice as likely to click through to a Preferred Source. Treat that as a
        company-reported figure. It concerns people who already chose the site, and those readers were likely to be
        interested anyway. For how pages get picked in the first place, see{" "}
        <Link href="/blog/how-google-ai-overviews-choose-sources">how Google AI Overviews choose sources</Link>. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>AI features documentation</a>{" "}
        still says there are no additional requirements or special optimizations for appearing there.
      </p>

      <h2>Should a small business bother with Preferred Sources?</h2>
      <p>
        A small business should spend a few minutes on it if it publishes regularly and has an audience that returns,
        and otherwise treat it as a low priority. A trade publication, local news site or B2B company with a newsletter
        could reasonably ask subscribers to add it.
      </p>
      <p>
        A plumber or dentist will rarely have customers who pick them as a favorite source, and a new customer asking
        Google for a recommendation will not have selected anyone. For those businesses, the work that matters is still
        making your facts clear and consistent across your site and listings. Our guides to{" "}
        <Link href="/blog/how-to-show-up-in-google-ai-mode">showing up in Google AI Mode</Link> and{" "}
        <Link href="/blog/google-ai-overviews-local-business">AI Overviews for local businesses</Link> cover that work, and
        you can see where you stand now with the <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else did Google announce alongside it?</h2>
      <p>
        Google also announced changes meant to highlight timely and well-sourced content in AI search. For some questions
        on developing topics, a carousel will surface timely articles, including Preferred Sources. A Highly Cited badge
        will appear on more web article links to mark articles that other stories cite.
      </p>
      <p>
        For some searches, Google said a carousel will show firsthand perspectives from discussions, forums and social
        media. That lines up with our earlier look at <Link href="/blog/reddit-and-ai-search">why forum mentions matter
        in AI search</Link>.
      </p>

      <h2>What else do people ask about Google Preferred Sources?</h2>

      <h3>Is Preferred Sources only for news publishers?</h3>
      <p>
        No, Google says any website that publishes fresh content is eligible. It began as a Top Stories feature, so news
        sites are the natural fit, but the eligibility wording is broader than news alone.
      </p>

      <h3>Can I pay to become a Preferred Source?</h3>
      <p>
        No, Google describes it as something individual people choose in their Search settings. Nothing in its
        documentation mentions a paid option, and the setup steps are only ways of asking your readers to select you.
      </p>

      <h3>Does the Preferred label appear for everyone?</h3>
      <p>
        No, the label appears for people who selected that site as a source. Someone who has not chosen your site will
        not see your links marked as Preferred, even if your page appears in their AI answer.
      </p>

      <h3>Can my blog subfolder be a Preferred Source?</h3>
      <p>
        No, Google says only domain-level and subdomain-level sites are eligible in the source preferences tool. A blog
        at example.com/blog would be covered by selecting example.com, or by moving to a subdomain if that made sense.
      </p>
    </div>
  )
}
