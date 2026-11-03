import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-funeral-homes-get-recommended-by-ai",
  title: "How Funeral Homes Get Recommended by AI (2026)",
  description:
    "How funeral homes get recommended by ChatGPT, Gemini, Claude and Perplexity: publish prices as text, describe every service and keep your profile current.",
  subtitle:
    "Funeral homes get recommended by AI when assistants can read their prices, services, location and reputation in plain text, because families now ask those questions before they ever call.",
  date: "2026-11-03",
  updated: "2026-11-03",
  readMins: 6,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how funeral homes get recommended by ai",
  image: {
    src: "/blog/how-funeral-homes-get-recommended-by-ai.webp",
    alt: "White lilies in a cream ceramic vase on a wooden table beside a folded leaflet in a calm, softly lit reception room.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI assistants can only quote funeral prices that are published on a page they can read.",
    "An FTC staff report found fewer than 40 percent of funeral provider websites it reviewed showed any prices online (FTC, 2022).",
    "The FTC Funeral Rule already requires accurate price information for anyone who telephones and asks.",
    "Schema.org has no dedicated funeral home type, so LocalBusiness markup with full address, hours and phone is the practical choice.",
    "A separate, plainly written page for each service gives assistants a specific answer to quote for each family question.",
  ],
  sources: [
    {
      title: "Complying with the Funeral Rule | Federal Trade Commission",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/complying-funeral-rule",
    },
    {
      title: "FTC Seeks to Improve the American Public's Access to Funeral Service Prices Online | Federal Trade Commission",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/news-events/news/press-releases/2022/10/ftc-seeks-improve-american-publics-access-funeral-service-prices-online",
    },
    {
      title: "Funeral Rule | Federal Trade Commission",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/news-events/topics/truth-advertising/funeral-rule",
    },
    {
      title: "Tips to improve your local ranking on Google",
      publisher: "Google Business Profile Help",
      url: "https://support.google.com/business/answer/7091",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
    {
      title: "Searching the web with ChatGPT | OpenAI Help Center",
      publisher: "OpenAI",
      url: "https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Funeral homes get recommended by AI when ChatGPT, Gemini, Claude and
        Perplexity can read what they offer, what it costs, where they are and what families say about them. Start
        by publishing your General Price List as a normal web page, then give each service its own clear page and
        keep your Google Business Profile complete.
      </p>

      <p>
        This guide is for funeral directors, owners of independent and family-run homes, and the people who manage
        their websites. It covers how assistants choose which funeral homes to name, why price transparency matters
        more here than in almost any other trade, and the steps that help, in order. It also says plainly what no one
        can promise.
      </p>

      <h2>Why are families asking AI about funeral homes?</h2>
      <p>
        Families ask AI assistants about funeral homes because the questions are urgent, unfamiliar and often
        asked late at night, and an assistant gives a direct answer without a sales call. A typical prompt is not
        &quot;funeral homes near me&quot; but something closer to &quot;what does a simple cremation cost in
        Columbus and which funeral homes are reputable?&quot;
      </p>
      <p>
        That shift matters. A list of links lets a family compare at their own pace. An assistant names two or
        three providers in a sentence, sometimes with a price, and explains why. The homes it names are the ones
        whose information it could find and trust. A home that publishes nothing specific gives it nothing to say.
      </p>
      <p>
        When ChatGPT searches the web for a local question, OpenAI&apos;s{" "}
        <a href="https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt" {...ext}>
          help article on ChatGPT search
        </a>{" "}
        says it uses a general location from the user&apos;s IP address and may rewrite the prompt into a
        city-specific query. Our guide to{" "}
        <Link href="/blog/ai-near-me-searches">AI near me searches</Link> explains what that means for any local
        business.
      </p>

      <h2>How do AI assistants decide which funeral homes to recommend?</h2>
      <p>
        Assistants recommend the funeral homes that most clearly match the family&apos;s question on service,
        location and reputation, using what they can read on your site, your profiles and other sites that mention
        you. For the local results that Google&apos;s AI features sit alongside, Google&apos;s{" "}
        <a href="https://support.google.com/business/answer/7091" {...ext}>
          local ranking help page
        </a>{" "}
        says results are mainly based on relevance, distance and prominence, and that reviews and links from other
        websites feed prominence.
      </p>
      <p>
        For funeral homes, relevance has an extra layer. Families ask about specific arrangements: direct cremation,
        green burial, a Catholic funeral Mass, a Jewish burial within a day, a Hindu cremation, veterans&apos;
        honours, repatriation abroad, pre-need planning. If your site only says &quot;we offer a full range of
        services&quot;, an assistant cannot match you to any of those questions with confidence.
      </p>

      <h2>Why does publishing funeral prices online matter for AI?</h2>
      <p>
        Publishing prices matters because cost is one of the first things families ask an assistant, and it can
        only quote prices that appear on a page it can read. When an FTC review looked at funeral provider websites,
        the{" "}
        <a
          href="https://www.ftc.gov/news-events/news/press-releases/2022/10/ftc-seeks-improve-american-publics-access-funeral-service-prices-online"
          {...ext}
        >
          FTC reported in 2022
        </a>{" "}
        that fewer than 40 percent of the sites it reviewed provided any prices online. A home that does publish
        prices stands out in that gap.
      </p>
      <p>
        The legal background is worth knowing. The FTC&apos;s guide to{" "}
        <a href="https://www.ftc.gov/business-guidance/resources/complying-funeral-rule" {...ext}>
          complying with the Funeral Rule
        </a>{" "}
        says providers must give accurate price information to anyone who telephones and asks, without requiring
        their name or number first, and must offer the General Price List at a face-to-face meeting. Posting it
        online is not currently required, but the FTC&apos;s{" "}
        <a href="https://www.ftc.gov/news-events/topics/truth-advertising/funeral-rule" {...ext}>
          Funeral Rule page
        </a>{" "}
        shows it opened a review in 2020 and, in October 2022, asked whether providers should be required to display
        prices online. Check that page for the current status before relying on either position.
      </p>
      <p>
        You already have the price list. Putting it on the site as text, rather than only as a scanned PDF, turns a
        compliance document into the most quotable page you own. Our posts on{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link> and on{" "}
        <Link href="/blog/do-ai-engines-read-pdfs-images">whether AI engines read PDFs and images</Link> explain
        why the format matters.
      </p>

      <h2>Which family questions should your website answer?</h2>
      <p>
        Your website should answer, in plain words, every question a family is likely to type into an assistant
        before calling you. The table pairs the common questions with the page that should answer each one.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>What families ask</th>
              <th>Page that answers it</th>
              <th>What to include</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>How much does a funeral or cremation cost here?</td>
              <td>Prices page</td>
              <td>Your General Price List as text, package prices, what is and is not included</td>
            </tr>
            <tr>
              <td>What is direct cremation and do you offer it?</td>
              <td>Cremation services page</td>
              <td>Plain definition, price, timeline, what the family receives</td>
            </tr>
            <tr>
              <td>Can you handle our faith or cultural traditions?</td>
              <td>Traditions page or section</td>
              <td>Each tradition you serve, by name, with what you provide</td>
            </tr>
            <tr>
              <td>What do I do when someone dies at home?</td>
              <td>First steps page</td>
              <td>Who to call, what happens next, your 24-hour number</td>
            </tr>
            <tr>
              <td>Can I plan and pay in advance?</td>
              <td>Pre-planning page</td>
              <td>How pre-need works with you, options and how funds are held</td>
            </tr>
            <tr>
              <td>Where are you and when can we visit?</td>
              <td>Contact and locations page</td>
              <td>Address, areas served, parking, accessibility, office hours</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How can a funeral home get recommended by AI step by step?</h2>
      <p>
        There are seven steps, starting with prices and service pages, because those are what assistants most
        often lack. None of them is technical beyond what a web designer can do in an afternoon.
      </p>
      <ol>
        <li>
          <strong>Publish your price list as a web page.</strong> Use real text and headings, keep it dated, and
          update it whenever your prices change. Keep a downloadable copy too if you like, but not instead.
        </li>
        <li>
          <strong>Give each service its own page.</strong> Traditional burial, cremation, direct cremation, memorial
          services, green burial if you offer it, veterans&apos; services and pre-planning. Each page should say what
          it is, who it suits, what it costs or where to find the price, and where you provide it.
        </li>
        <li>
          <strong>Name the traditions and communities you serve.</strong> If you regularly arrange Catholic, Jewish,
          Muslim, Hindu, Buddhist, humanist or other services, say so by name. Assistants can only match a family to
          a tradition you mention.
        </li>
        <li>
          <strong>Complete your Google Business Profile.</strong> Correct categories, every location, hours, a
          24-hour phone line if you have one, photos of the facility, and a description that names your services.
          Keep the same name, address and phone on Bing, Apple Maps and funeral directories.
        </li>
        <li>
          <strong>Ask for reviews with care, and reply with care.</strong> A short, gentle request a few weeks after
          the service is appropriate for many families. Replies should thank them without repeating private
          details. Our guide to <Link href="/blog/google-reviews-ai-visibility">Google reviews and AI visibility</Link>{" "}
          explains why the wording of reviews matters.
        </li>
        <li>
          <strong>Add LocalBusiness structured data.</strong> Schema.org has no dedicated funeral home type, so use
          LocalBusiness with your address, coordinates, phone and opening hours, following Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
            LocalBusiness documentation
          </a>
          . Our <Link href="/blog/schema-markup-for-ai-search">schema guide</Link> shows the format.
        </li>
        <li>
          <strong>Check what assistants say, every month.</strong> Ask ChatGPT, Gemini, Claude and Perplexity the
          questions in the table above for your town. If an answer is wrong, such as an old address or a closed
          location, see our guide to{" "}
          <Link href="/blog/fix-wrong-ai-information-about-your-business">
            fixing wrong AI information about your business
          </Link>
          .
        </li>
      </ol>

      <h2>Do obituary pages help a funeral home show up in AI?</h2>
      <p>
        Obituary pages can help, because they are fresh, local and connected to your name, but they are not a
        substitute for clear service and price pages. Each obituary is a dated page that mentions your funeral home
        and your town, and families share them widely, which brings visits and links.
      </p>
      <p>
        Two cautions. Make sure obituaries are crawlable pages on your own domain rather than locked inside a
        third-party widget, and treat them with the dignity families expect: never stuff them with marketing copy or
        keywords. Their value comes from being genuine.
      </p>

      <h2>What should funeral homes avoid when chasing AI visibility?</h2>
      <p>
        Funeral homes should avoid anything that trades trust for attention, because trust is exactly what both
        families and assistants are looking for. That means no fake or incentivised reviews, no prices that differ
        from your General Price List, no &quot;from&quot; prices that hide required fees, and no pages copied from
        other homes with the town name swapped.
      </p>
      <p>
        Be wary, too, of anyone promising that ChatGPT will recommend you. No one can edit what an AI model says;
        the honest work is improving the public information it reads. Alphaa does that work for you: it asks the
        four assistants what they say about your funeral home every week, then drafts the fixes (price pages, FAQs,
        schema, profile posts, review replies) for you to approve before anything goes live, from $99 a month. You
        can see where you stand today with the <Link href="/start">free 60-second AI check</Link>, and our broader
        guide covers <Link href="/blog/get-recommended-by-ai-local-service-business">AI visibility for local service businesses</Link>.
      </p>

      <h2>What else do funeral directors ask about AI recommendations?</h2>

      <h3>Will publishing our prices online lose us business?</h3>
      <p>
        Usually the opposite is the risk: if you do not publish prices, an assistant asked about cost can only name
        homes that do. Families who see a clear price before calling arrive better informed and with more trust.
      </p>

      <h3>Do we have to put our General Price List online?</h3>
      <p>
        Not under the FTC Funeral Rule as currently written, which requires the list at a face-to-face meeting and
        accurate prices by phone. The FTC has asked whether online posting should be required, so check its Funeral
        Rule page and any state rules that apply to you.
      </p>

      <h3>Can a small family-run funeral home compete with large chains in AI answers?</h3>
      <p>
        Yes, because assistants answer local questions with local results, and a small home with clear prices,
        specific service pages and warm reviews often gives them more to quote than a chain&apos;s generic page.
        Size matters less than clarity here.
      </p>

      <h3>Should each of our locations have its own page?</h3>
      <p>
        Yes, each location should have its own page with its address, phone, hours, parking and the services
        offered there. Assistants answer by town, and a single combined page makes it hard to match the right
        location to the right family.
      </p>

      <h3>How long does it take for AI assistants to reflect changes?</h3>
      <p>
        There is no fixed timeline, because each assistant searches and updates on its own schedule. Assistants
        that search the web live can pick up a changed page once it is crawled, while answers drawn from older
        training data change more slowly.
      </p>
    </div>
  )
}
