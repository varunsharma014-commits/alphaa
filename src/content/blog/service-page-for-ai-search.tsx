import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "service-page-for-ai-search",
  title: "How to Write a Service Page for AI Search (2026)",
  description:
    "How to write a service page for AI search: what to put on it, how to state price and area, which schema to add, and the mistakes that keep AI from quoting you.",
  subtitle:
    "A service page works for AI search when it states plainly what you do, where, for whom, roughly what it costs and how you prove it, in text a machine can read.",
  date: "2026-11-09",
  updated: "2026-11-09",
  readMins: 8,
  tag: "Guide",
  kind: "guide",
  keyphrase: "service page for ai search",
  image: {
    src: "/blog/service-page-for-ai-search.webp",
    alt: "A canvas tool roll laid open on a pale oak table, with a hammer, pliers, screwdrivers and a file each in its own pocket",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "A service page should answer what you do, where, for whom, what it costs and how long it takes.",
    "Google says AI Overviews and AI Mode need no special markup, only pages eligible to appear with a snippet.",
    "Keep key facts in visible text, and make any structured data match what the page says.",
    "Give each distinct service its own page, so an engine can match one question to one clear answer.",
    "Proof should be specific and real, such as licences, process details and work you have done yourself.",
  ],
  sources: [
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "Creating Helpful, Reliable, People-First Content",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
    { title: "Service - Schema.org Type", publisher: "Schema.org", url: "https://schema.org/Service" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> To write a service page for AI search, give each service its own page and state
        in plain text what you do, where, for whom, roughly what it costs and how long it takes. Add real proof and
        matching schema. Start with your highest-value service, because that page answers the questions buyers ask AI.
      </p>

      <p>
        This guide is for owners and marketers at service businesses: trades, clinics, firms and agencies. It covers
        what belongs on the page, how to word it, and what to leave out. It is about improving the odds of being
        understood and quoted. Nobody can guarantee an AI engine will recommend you.
      </p>

      <h2>Why do service pages matter for AI search?</h2>
      <p>
        Service pages matter because they are the pages that can directly answer a buyer&apos;s question about who does
        a job, where, and for how much. When someone asks an assistant for a recommendation, it needs specific facts it
        can attribute to you. A homepage with a slogan and a list of six services rarely gives it those facts.
      </p>
      <p>
        Google describes how AI Mode and AI Overviews may use{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>query fan-out</a>, issuing
        multiple related searches across subtopics to find supporting pages. A question about replacing a water heater
        can spawn smaller questions about cost, timing and permits. A page that answers those subtopics has more chances
        to be useful. Our explainer on <Link href="/blog/what-is-query-fan-out">query fan-out</Link> goes further.
      </p>

      <h2>What should a service page include?</h2>
      <p>
        A service page should include seven blocks, each answering one question a buyer or an AI engine would ask. You
        do not need a long page. You need each of these to be present, specific and true.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Block</th>
              <th>Question it answers</th>
              <th>What good looks like</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Direct opening</td>
              <td>What is this and who is it for?</td>
              <td>Two or three sentences naming the service, the customer and the area</td>
            </tr>
            <tr>
              <td>Scope</td>
              <td>What exactly do you do, and not do?</td>
              <td>A list of included work and common exclusions</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>Roughly what will it cost?</td>
              <td>A real range or starting price, plus what moves it</td>
            </tr>
            <tr>
              <td>Process and timing</td>
              <td>What happens and how long does it take?</td>
              <td>Numbered steps with honest durations</td>
            </tr>
            <tr>
              <td>Service area</td>
              <td>Do you work where I am?</td>
              <td>Named towns or counties in plain text, not only a map image</td>
            </tr>
            <tr>
              <td>Proof</td>
              <td>Why trust you?</td>
              <td>Licence numbers, certifications, named staff, real project details</td>
            </tr>
            <tr>
              <td>FAQ</td>
              <td>What else do people worry about?</td>
              <td>Four to six questions taken from real calls and emails</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How do you write a service page step by step?</h2>
      <p>
        There are eight steps, starting with collecting the questions customers actually ask before you write a word.
        Work on one service at a time, beginning with the one that brings in the most profitable jobs.
      </p>
      <ol>
        <li>
          <strong>Collect real questions.</strong> Go through calls, emails and reviews, and write down how people
          phrase the problem. Our guide to <Link href="/blog/keyword-research-for-ai-search">researching prompts instead
          of keywords</Link> shows how.
        </li>
        <li>
          <strong>Write the opening as an answer.</strong> Name the service, who it is for and where you offer it, in
          the first two or three sentences.
        </li>
        <li>
          <strong>Define the scope.</strong> List what is included and what is not. Exclusions are useful to buyers and
          are rare enough on competing pages to stand out.
        </li>
        <li>
          <strong>State the price.</strong> Publish a range or starting price, and name the two or three things that
          move it.
        </li>
        <li>
          <strong>Lay out the process.</strong> Use a numbered list from first contact to finished work, with honest
          timings.
        </li>
        <li>
          <strong>Add proof you can stand behind.</strong> Include licences, training, equipment and specifics of work
          you have done.
        </li>
        <li>
          <strong>Add an FAQ.</strong> Use the leftover questions from step one, and answer each in its first sentence.
        </li>
        <li>
          <strong>Add schema and link it in.</strong> Mark up what is visible, then link to the page from your homepage,
          navigation and related posts so engines and people can reach it.
        </li>
      </ol>

      <h2>How should the opening of a service page read?</h2>
      <p>
        The opening should read like a direct answer that still makes sense if it is lifted out of the page and quoted
        alone. Avoid &quot;welcome to&quot; lines and claims like &quot;quality service you can trust,&quot; which carry
        no information an engine can use.
      </p>
      <p>
        Here is the shape, with placeholders to replace with your own facts: &quot;[Business] replaces [type of equipment]
        for homeowners in [towns]. Most jobs take [time] and cost [range], depending on [factor one] and [factor two].
        Our technicians are [licence or certification].&quot; Three plain sentences like these give an engine the
        service, customer, place, time, price and credential. For more on this, read{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI actually quotes</Link>.
      </p>

      <h2>Should you put prices on a service page?</h2>
      <p>
        Yes, publish a range or starting price wherever you honestly can, because price is one of the first things a
        buyer asks and a page without it cannot answer that question. A wide range with clear reasons still beats
        &quot;call for a quote.&quot;
      </p>
      <p>
        If your work really cannot be priced in advance, explain how pricing is worked out, for example by the hour, by
        project or after an inspection, and say what a typical first step costs. Our piece on{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link> covers the
        trade-offs for businesses that worry about competitors seeing their numbers.
      </p>

      <h2>How should a service page describe your service area?</h2>
      <p>
        A service page should name the towns, counties or neighbourhoods you really serve, in plain text on the page.
        Google&apos;s guidance on <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>AI
        features</a> recommends keeping important content in textual form, so a map embed or an image of a coverage
        area is not enough by itself.
      </p>
      <p>
        Do not list places you would not actually travel to. If you serve many areas, group them sensibly, and only
        build separate location pages when you have something genuinely different to say about each. Our guide to{" "}
        <Link href="/blog/do-city-landing-pages-work-ai-search">city landing pages</Link> explains when they are worth it.
      </p>

      <h2>Which schema should a service page use?</h2>
      <p>
        A service page can use <a href="https://schema.org/Service" {...ext}>Service</a> markup alongside your
        LocalBusiness details, but schema supports the page and does not replace it. Google states that no special
        schema.org markup is needed to appear in AI Overviews or AI Mode, and that structured data should match the
        visible text.
      </p>
      <ul>
        <li>
          <strong>Service:</strong> schema.org defines properties including <code>serviceType</code>,{" "}
          <code>provider</code>, <code>areaServed</code> and <code>offers</code>. Fill in only what the page shows.
        </li>
        <li>
          <strong>LocalBusiness:</strong> Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
            LocalBusiness documentation
          </a>{" "}
          requires <code>name</code> and <code>address</code>, and recommends <code>telephone</code>, <code>url</code>,{" "}
          <code>geo</code>, <code>openingHoursSpecification</code> and <code>priceRange</code>.
        </li>
        <li>
          <strong>Use the specific type.</strong> Google says to use the most specific LocalBusiness subtype, such as
          Electrician or Plumber, where one exists.
        </li>
      </ul>
      <p>
        Our <Link href="/blog/schema-markup-for-ai-search">guide to schema markup for AI search</Link> has fuller
        examples of what to add.
      </p>

      <h2>How do you show proof without making things up?</h2>
      <p>
        You show proof by publishing specific facts you can verify, such as licence numbers, training, and details of
        work you have done. Google&apos;s guidance on{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>helpful,
        reliable content</a> asks whether a page demonstrates first-hand expertise, and it warns against fabricated
        creator profiles.
      </p>
      <p>
        The same goes for reviews and testimonials: use real ones, with the customer&apos;s permission where needed. A
        note saying who wrote the page and who checked it helps too. If you do not yet have much proof, describing your
        actual process in detail is honest and still more useful than vague claims.
      </p>

      <h2>Should each service have its own page?</h2>
      <p>
        Yes, each distinct service should have its own page, because one page can give a clear answer about one thing.
        Bundling boiler repair, drain clearing and bathroom remodels onto a single page leaves each one thin and makes
        the page harder to match to any specific question.
      </p>
      <p>
        Combine services only where buyers treat them as the same job. Then use a short hub page listing them all with a
        sentence each and a link to the detail. That also gives AI crawlers a simple path through your site.
      </p>

      <h2>What mistakes stop AI from using a service page?</h2>
      <p>
        The most common mistakes are key facts hidden from text, vague copy and pages that contradict your other
        listings. Each one makes it harder for an engine to state something about you with confidence.
      </p>
      <ul>
        <li>Important details only inside images, PDFs, accordions that need scripts, or videos with no transcript.</li>
        <li>A template page duplicated across services with only the service name swapped.</li>
        <li>Prices, hours or areas that differ from your Google Business Profile and directory listings.</li>
        <li>Blocking AI crawlers by accident. Our <Link href="/blog/ai-crawlers-robots-txt-guide">robots.txt guide</Link> shows how to check.</li>
        <li>Dates and details left stale for years. See <Link href="/blog/content-freshness-ai-search">why freshness matters</Link>.</li>
      </ul>

      <h2>How do you check whether a service page is working?</h2>
      <p>
        You check by asking the AI engines the questions the page was written to answer, on a regular schedule, and
        noting whether you appear and what they say. Answers vary from run to run, so look for a trend over several
        weeks rather than one result. Our guide to{" "}
        <Link href="/blog/how-to-measure-ai-visibility">measuring AI visibility</Link> sets out what to log.
      </p>
      <p>
        Alphaa can take this on for you. It asks ChatGPT, Gemini, Claude and Perplexity weekly, runs a 23-point check of
        what they can read on your site, and drafts page fixes for you to approve before they publish to WordPress,
        Shopify or Webflow, from <Link href="/pricing">$99 a month</Link>.
      </p>

      <h2>What else do people ask about service pages and AI search?</h2>

      <h3>How long should a service page be for AI search?</h3>
      <p>
        A service page should be as long as it takes to answer the real questions, with no set word count. Most land
        somewhere between a few hundred and a thousand or so words, and padding does not help because engines lift
        specific passages rather than reward length.
      </p>

      <h3>Do I need a blog if I have good service pages?</h3>
      <p>
        Good service pages come first, because they answer buying questions directly. A blog then helps by covering the
        wider questions people ask earlier on, and it gives you natural places to link back to those service pages.
      </p>

      <h3>Can I use AI to write my service pages?</h3>
      <p>
        You can use AI to draft them, but a person who knows the work should check and add the specifics. Google&apos;s
        guidance focuses on whether content is helpful, and generic text with no first-hand detail gives an engine
        little reason to quote you.
      </p>

      <h3>Should I add an FAQ to every service page?</h3>
      <p>
        Add one where you have real questions to answer, which is true of most services. Keep the questions specific to
        that service, and avoid pasting the same FAQ on every page, since the repetition adds nothing for buyers or
        engines.
      </p>

      <h3>How often should I update a service page?</h3>
      <p>
        Update a service page whenever a fact changes, and review it at least a couple of times a year. Prices, service
        areas, staff credentials and timing are the details that go out of date first and that buyers rely on most.
      </p>
    </div>
  )
}
