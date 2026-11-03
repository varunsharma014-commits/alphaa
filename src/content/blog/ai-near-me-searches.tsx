import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ai-near-me-searches",
  title: "How to Show Up in AI Near Me Searches (2026 Guide)",
  description:
    "How ChatGPT and Google's AI answer near me searches, what location data they use, and the eight fixes that help a local business show up when customers ask.",
  subtitle:
    "AI assistants turn \"near me\" into a city-specific web search using your customer's approximate location, so you show up by stating your location, services and reputation plainly in the places those searches read.",
  date: "2026-11-03",
  updated: "2026-11-03",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "ai near me searches",
  image: {
    src: "/blog/ai-near-me-searches.webp",
    alt: "A smartphone on a cafe table showing a simple map with three location pins, with a blurred street outside the window.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "ChatGPT estimates a user's general location from their IP address and may rewrite \"near me\" into a city-specific search.",
    "Precise device location in ChatGPT is optional and off by default, so most local answers rely on approximate location.",
    "Google says local results are mainly based on relevance, distance and prominence, and reviews feed prominence.",
    "Google says there are no special requirements or markup needed to appear in AI Overviews or AI Mode.",
    "Writing your city, neighborhoods and services in plain text is the single most direct fix for AI near me searches.",
  ],
  sources: [
    {
      title: "Searching the web with ChatGPT | OpenAI Help Center",
      publisher: "OpenAI",
      url: "https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt",
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
        <strong>Short answer:</strong> To show up in AI near me searches, make your city, neighborhoods, services,
        hours and reviews easy for search engines to read. ChatGPT turns &quot;near me&quot; into a city-specific
        web search using the customer&apos;s approximate location, so the businesses named are the ones whose pages
        and profiles clearly match that city and service.
      </p>

      <p>
        This guide is for local business owners and the people who run their websites. It explains what actually
        happens when someone types &quot;plumber near me&quot; into an AI assistant, using the engines&apos; own
        documentation where it exists, and then gives eight fixes in priority order.
      </p>

      <h2>How do AI assistants answer &quot;near me&quot; searches?</h2>
      <p>
        AI assistants answer &quot;near me&quot; searches by working out roughly where the person is, rewriting the
        question into a normal local search for that place, and summarising the results. OpenAI documents this
        directly. Its help article on{" "}
        <a href="https://help.openai.com/en/articles/9237897-searching-the-web-with-chatgpt" {...ext}>
          searching the web with ChatGPT
        </a>{" "}
        says ChatGPT collects general location information based on the user&apos;s IP address and may rewrite a
        prompt into one or more targeted queries for its search providers.
      </p>
      <p>
        OpenAI&apos;s own example is a person asking for good restaurants near them from the San Francisco area,
        which ChatGPT may rewrite as &quot;top restaurants San Francisco&quot;. The IP address itself is not passed
        on, only the general location. If memory is on, saved details such as dietary preferences can shape the
        rewritten query too.
      </p>
      <p>
        That rewrite is the most important thing in this guide. The engine is not running some special AI-only
        local index. It is running an ordinary search for &quot;[service] [city]&quot; and then choosing which
        results to name. If your pages and profiles do not clearly say what you do and where, you are not in the
        pool it chooses from.
      </p>

      <h2>Where do AI assistants get your location from?</h2>
      <p>
        By default ChatGPT uses an approximate location inferred from the user&apos;s IP address, and precise
        device location is optional and off by default. OpenAI says users who turn on location sharing get more
        specific answers about nearby businesses, local news and weather, and that ChatGPT may share that location
        with trusted third-party providers that supply local information such as nearby business listings.
      </p>
      <p>
        Two practical consequences follow. First, most near me answers are city-level, not street-level, so
        appearing in the right city matters more than being the closest pin. Second, a customer on a VPN or a
        mobile network may be placed in the wrong area; OpenAI notes this and suggests users add a city,
        neighborhood or postal code to the question. Many people already do, which is why &quot;near me&quot; and
        &quot;in [city]&quot; queries are best treated as the same target.
      </p>
      <p>
        On Google, the classic local results that AI Overviews and AI Mode sit alongside follow Google&apos;s stated
        rules. Its{" "}
        <a href="https://support.google.com/business/answer/7091" {...ext}>
          local ranking help page
        </a>{" "}
        says local results are mainly based on relevance, distance and prominence, and that when a customer does
        not share where they are, Google uses what it knows about their location.
      </p>

      <h2>Which signals decide who gets named in a near me answer?</h2>
      <p>
        The business that gets named is usually the one that most clearly matches the rewritten search on three
        things: what you do, where you do it, and how well regarded you are. The table maps each signal to where an
        assistant reads it and where you fix it.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>What the assistant needs to see</th>
              <th>Where you fix it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Relevance</td>
              <td>The exact service named in plain words</td>
              <td>Service pages, Google Business Profile categories and description</td>
            </tr>
            <tr>
              <td>Location</td>
              <td>Your city, neighborhoods and service area stated as text</td>
              <td>Homepage, contact page, service-area pages, schema</td>
            </tr>
            <tr>
              <td>Prominence</td>
              <td>Reviews, ratings and mentions on other sites</td>
              <td>Google reviews, directories, local press</td>
            </tr>
            <tr>
              <td>Consistency</td>
              <td>The same name, address and phone everywhere</td>
              <td>Every listing and profile you control</td>
            </tr>
            <tr>
              <td>Availability</td>
              <td>Hours, emergency or same-day service, booking</td>
              <td>Profile hours, schema, a clear hours line on the site</td>
            </tr>
            <tr>
              <td>Crawl access</td>
              <td>Search bots allowed to read your pages</td>
              <td>robots.txt and your host or CDN settings</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Prominence is the one owners underrate. Google says it is based on information such as how many websites
        link to your business and how many reviews you have, and that more reviews and positive ratings can help
        local ranking. Our guide to{" "}
        <Link href="/blog/google-reviews-ai-visibility">how Google reviews affect AI visibility</Link> covers why
        review text matters as much as the star count.
      </p>

      <h2>How do you show up in AI near me searches step by step?</h2>
      <p>
        There are eight steps, and the first two fix the most common gap: assistants cannot tell where you work.
        Work through them in order.
      </p>
      <ol>
        <li>
          <strong>Write your location in plain text.</strong> Put your city and the main neighborhoods or towns you
          serve on the homepage and contact page, in sentences, not only inside a map embed or an image. A rewritten
          query like &quot;emergency electrician Leeds&quot; can only match words that exist on the page.
        </li>
        <li>
          <strong>Name each service on its own page.</strong> One clear page per main service, saying what it is,
          who it is for and where you offer it. &quot;We fix boilers in Leeds, Bradford and Wakefield&quot; beats a
          vague &quot;heating solutions&quot; banner.
        </li>
        <li>
          <strong>Complete your Google Business Profile.</strong> Correct primary category, every relevant
          secondary category, service area, hours, and a description that names your services. See our guide to{" "}
          <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link>.
        </li>
        <li>
          <strong>Make your details match everywhere.</strong> The same business name, address and phone number on
          your site, Google, Bing, Apple Maps, Yelp and industry directories. OpenAI&apos;s help page lists
          Microsoft among its search providers, so Bing Places is worth claiming; our post on{" "}
          <Link href="/blog/does-chatgpt-use-bing">whether ChatGPT uses Bing</Link> explains the link.
        </li>
        <li>
          <strong>Earn and answer reviews.</strong> Ask every happy customer, and reply to reviews in a way that
          mentions the service and the area naturally. Reviews feed the prominence signal Google describes.
        </li>
        <li>
          <strong>Add LocalBusiness structured data.</strong> Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
            LocalBusiness documentation
          </a>{" "}
          covers address, geo coordinates, telephone, opening hours and price range. Schema is not a magic switch,
          but it states the facts in a form machines read reliably.
        </li>
        <li>
          <strong>Let the search bots in.</strong> OpenAI says a site must allow OAI-SearchBot and must not block
          its published IP addresses at the host or CDN to be eligible for ChatGPT search results. Check your{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">robots.txt settings for AI crawlers</Link>.
        </li>
        <li>
          <strong>Test it the way customers ask.</strong> Ask ChatGPT, Gemini, Claude and Perplexity &quot;[your
          service] near me&quot; and &quot;best [your service] in [city]&quot;, ideally from your area and without a
          VPN. Note who is named and what is said, then repeat monthly, because answers vary from one run to the
          next.
        </li>
      </ol>

      <h2>Do you need a separate page for every town you serve?</h2>
      <p>
        You need a page for each place only where you have something genuinely specific to say about it, such as
        jobs done there, local regulations or a team based nearby. Thin pages that swap the town name and repeat
        the same text are the kind of doorway pages search engines discount, and they give an assistant nothing new
        to quote.
      </p>
      <p>
        A sensible pattern for most service businesses is one strong page per main service, a clear service-area
        section listing every town in plain text, and a small number of real location pages for the places that
        bring the most work. Our deeper guide asks{" "}
        <Link href="/blog/do-city-landing-pages-work-ai-search">whether city landing pages work for AI search</Link>
        .
      </p>

      <h2>Is optimising for AI near me searches different from local SEO?</h2>
      <p>
        Mostly no: optimising for AI near me searches is local SEO done thoroughly, with extra weight on clear,
        quotable text. Google states in its guidance on{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features and your website
        </a>{" "}
        that there are no additional requirements or special optimizations needed to appear in AI Overviews or AI
        Mode, and that SEO fundamentals continue to be worthwhile.
      </p>
      <p>
        The difference is in what gets rewarded once you are in the result set. A map pack shows a list and lets
        the customer choose. An assistant writes a sentence about two or three businesses and often explains why. It
        can only explain what it can read, so pages that state facts plainly (&quot;open until 10pm&quot;,
        &quot;24-hour call-outs&quot;, &quot;fixed-price quotes&quot;) give it a reason to name you. Gemini, Claude
        and Perplexity publish less detail than OpenAI about how they handle location, so test each one rather than
        assuming they behave the same.
      </p>
      <p>
        If you want to know where you stand today, the <Link href="/start">free 60-second AI check</Link> asks the
        four assistants about your business and shows what they say. Alphaa then monitors those answers weekly and
        drafts the fixes above for you to approve, from $99 a month.
      </p>

      <h2>What else do owners ask about AI near me searches?</h2>

      <h3>Does ChatGPT know exactly where my customer is?</h3>
      <p>
        Usually not exactly. By default ChatGPT uses a general location estimated from the IP address, and precise
        device location only applies if the user has turned location sharing on.
      </p>

      <h3>Why does ChatGPT recommend a business in the wrong town?</h3>
      <p>
        The most common cause is that the user&apos;s approximate location was wrong, for example because of a VPN
        or mobile network. It can also happen when your own pages do not state your service area clearly, so the
        assistant matches someone who does.
      </p>

      <h3>Do I need a physical address to appear in AI near me answers?</h3>
      <p>
        No, service-area businesses can appear, but they need to state the areas they serve in plain text on their
        site and profiles. Without a storefront address, the written service area is the main location signal an
        assistant has.
      </p>

      <h3>Will adding &quot;near me&quot; to my page titles help?</h3>
      <p>
        Generally no, because assistants rewrite &quot;near me&quot; into a place name before searching. Naming the
        actual city, neighborhoods and services does more than repeating the phrase &quot;near me&quot;.
      </p>

      <h3>How often should I check what AI assistants say locally?</h3>
      <p>
        Monthly at minimum, and weekly if local customers are a large share of your business. AI answers vary
        between runs, so a single check shows a snapshot, not a trend.
      </p>
    </div>
  )
}
