import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "about-page-for-ai-search",
  title: "How to Write an About Page for AI Search (2026)",
  description:
    "How to write an About page for AI search: the facts to state, the structured data to add, and the mistakes that leave ChatGPT and Gemini unsure who you are.",
  subtitle:
    "Write your About page as a plain, checkable fact sheet about who runs the business, what it does, where and since when, then mark it up with Organization or LocalBusiness schema.",
  date: "2026-10-31",
  updated: "2026-10-31",
  readMins: 8,
  tag: "Guide",
  kind: "guide",
  keyphrase: "about page for ai search",
  image: {
    src: "/blog/about-page-for-ai-search.webp",
    alt: "An open blank notebook beside a plain brass name plate and two brass keys on a ring, on a walnut counter.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google suggests putting Organization markup on the home page or a single page describing the organisation, such as an About page.",
    "An About page for AI search should state names, services, location, founding year and credentials as plain, checkable sentences.",
    "Google's helpful content guidance cites background about the author or site, such as an About page, as a sign of expertise.",
    "Structured data should match the visible text on the page, and Google says AI features need no special schema.",
    "The details on your About page must match your Google Business Profile, directories and social profiles exactly.",
  ],
  sources: [
    {
      title: "Creating Helpful, Reliable, People-First Content",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    },
    {
      title: "Organization Schema Markup",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/organization",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
    { title: "AboutPage - Schema.org Type", publisher: "Schema.org", url: "https://schema.org/AboutPage" },
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
        <strong>Short answer:</strong> An About page for AI search is a plain fact sheet about your business: who
        runs it, what you do, where, since when, and what qualifies you, written in short sentences an assistant can
        quote. Add Organization or LocalBusiness structured data that matches the visible text, and keep every detail
        identical to your other profiles.
      </p>

      <p>
        This guide is for owners and marketers of small and local businesses who want ChatGPT, Gemini, Claude and
        Perplexity to describe them accurately. It covers what to write, how to structure it, the markup to add and
        the mistakes we see most often when we check sites.
      </p>

      <h2>Why does your About page matter for AI search?</h2>
      <p>
        Your About page matters because it is usually the one page on your site whose whole job is to say who you
        are, and AI assistants need that before they will describe or recommend you with confidence. When an
        assistant answers &quot;who is the best roofer in Tulsa&quot;, it has to connect your name to a trade, a
        place and some evidence of quality. Product and service pages rarely state those facts together; a good
        About page does.
      </p>
      <p>
        Google&apos;s own guidance points the same way. In{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>
          Creating Helpful, Reliable, People-First Content
        </a>
        , it asks whether content offers background about the author or the site that publishes it, and gives an
        About page as an example. Its{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/organization" {...ext}>
          Organization markup documentation
        </a>{" "}
        suggests placing that markup on the home page or a single page describing the organisation, such as an
        &quot;about us&quot; page. Neither is a promise of AI visibility, but both show that search systems look to
        this page for identity facts. For the wider idea of how engines resolve who you are, see our guide to{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO</Link>.
      </p>

      <h2>What should an About page for AI search include?</h2>
      <p>
        An About page for AI search should include the facts a stranger would need to verify you, each stated once
        in a plain sentence. Use this list as a checklist; skip anything that is not true of your business rather
        than stretching it.
      </p>
      <ul>
        <li>
          <strong>Legal and trading name.</strong> The exact name you use on your Google Business Profile, with the
          legal name too if it differs.
        </li>
        <li>
          <strong>What you do, in category words.</strong> &quot;We are a residential electrician&quot;, not
          &quot;we light up lives&quot;. Use the words customers type.
        </li>
        <li>
          <strong>Where you work.</strong> Your address if customers visit, and the towns or areas you serve.
        </li>
        <li>
          <strong>When you started.</strong> A founding year is a simple, checkable fact.
        </li>
        <li>
          <strong>Who runs it.</strong> Owner and key staff names, roles and relevant qualifications, linked to
          individual bio pages if you have them.
        </li>
        <li>
          <strong>Licences, accreditations and memberships.</strong> Name the body and, where public, the licence
          number so it can be checked.
        </li>
        <li>
          <strong>Who you serve best.</strong> The customer types, job sizes or specialisms you focus on.
        </li>
        <li>
          <strong>How to reach you.</strong> Phone, email and hours, matching your other listings.
        </li>
        <li>
          <strong>Where else you are listed.</strong> Links to your Google Business Profile, main directories and
          social profiles.
        </li>
      </ul>

      <h2>How do you write an About page step by step?</h2>
      <p>
        Write it in six steps, starting with a one-paragraph summary that could stand on its own if an assistant
        quoted nothing else.
      </p>
      <ol>
        <li>
          <strong>Open with a 40–60 word identity summary.</strong> Name, category, location, founding year and what
          you are known for, in that order. For example: &quot;Harbor Plumbing is a family-run plumbing company in
          Portland, Maine, founded in 2009. We handle emergency repairs, water heaters and bathroom refits for homes
          across Cumberland County.&quot;
        </li>
        <li>
          <strong>Add a &quot;who we are&quot; section with real people.</strong> One or two sentences per person:
          name, role, years in the trade, qualifications. Google&apos;s guidance warns against deceptive authorship
          information and fabricated creator profiles, so use real names or none.
        </li>
        <li>
          <strong>Add a &quot;what we do&quot; section.</strong> List services in the words customers use, and link
          each one to its service page so assistants can follow the trail.
        </li>
        <li>
          <strong>Add proof that can be checked.</strong> Licences, accreditations, awards with the year and the
          awarding body, and links to where your reviews live. Leave out claims you cannot back with a link or
          document.
        </li>
        <li>
          <strong>Close with contact details and profile links.</strong> The same name, address and phone as your
          Google Business Profile, plus links to it and your main listings.
        </li>
        <li>
          <strong>Add structured data and link the page sitewide.</strong> Mark it up (next section) and link to it
          from your main navigation or footer so crawlers and people reach it from every page.
        </li>
      </ol>

      <h2>What structured data belongs on an About page?</h2>
      <p>
        The About page is a natural home for Organization markup, or LocalBusiness markup if customers visit you or
        you serve a local area, optionally wrapped in a schema.org AboutPage. Google&apos;s Organization page says
        there are no required properties and recommends adding as many relevant ones as apply, such as name, url,
        logo, sameAs, address, contactPoint, foundingDate, legalName and description. It says the markup helps Google
        understand your organisation&apos;s administrative details and disambiguate it in search results.
      </p>
      <p>
        For a local business, Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
          LocalBusiness documentation
        </a>{" "}
        requires name and address, recommends properties such as telephone, url, geo, openingHoursSpecification and
        priceRange, and says to use the most specific subtype possible, such as Restaurant or DaySpa. Schema.org also
        defines an{" "}
        <a href="https://schema.org/AboutPage" {...ext}>
          AboutPage
        </a>{" "}
        type, and its mainEntity property can point at your Organization so the page and the business are explicitly
        linked.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>What to put in it</th>
              <th>Why it helps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>name / legalName</td>
              <td>Trading name and registered name</td>
              <td>Ties variants of your name to one entity</td>
            </tr>
            <tr>
              <td>description</td>
              <td>Your 40–60 word identity summary</td>
              <td>Matches the visible opening paragraph</td>
            </tr>
            <tr>
              <td>address / areaServed</td>
              <td>Street address and towns you serve</td>
              <td>Connects you to local questions</td>
            </tr>
            <tr>
              <td>foundingDate</td>
              <td>The year you started</td>
              <td>A checkable fact other sources repeat</td>
            </tr>
            <tr>
              <td>sameAs</td>
              <td>Google Business Profile, directories, social profiles</td>
              <td>Links your site to your other listings</td>
            </tr>
            <tr>
              <td>founder / employee</td>
              <td>Owner and key staff as Person entries</td>
              <td>Shows real people stand behind the business</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        One rule overrides the rest: the markup must say the same thing as the page. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        advises making sure structured data matches the visible text, and says no special schema.org markup is
        required to appear in AI Overviews or AI Mode. Treat markup as a clear label on facts that are already on the
        page, not as a substitute for them. Our <Link href="/blog/schema-markup-for-ai-search">schema markup
        guide</Link> covers the other page types.
      </p>

      <h2>What mistakes stop AI from understanding your About page?</h2>
      <p>
        The most common mistake is writing a mission statement instead of facts, which gives an assistant nothing
        specific to repeat. These are the others we see most often:
      </p>
      <ul>
        <li>
          <strong>Inconsistent details.</strong> A different phone number, an old address or a variant of the name
          compared with your Google Business Profile and directories. Assistants cross-check, and mismatches create
          doubt. See <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings and NAP
          consistency</Link>.
        </li>
        <li>
          <strong>Key facts only in images.</strong> Team photos with names baked into the image, or certificates
          shown as pictures with no text alongside.
        </li>
        <li>
          <strong>Content loaded only by JavaScript.</strong> Some AI crawlers do not run scripts, so text that
          appears only after a script runs may never be read.
        </li>
        <li>
          <strong>Unverifiable superlatives.</strong> &quot;The best in the city&quot; is not a fact an assistant can
          check, and it adds nothing to your description.
        </li>
        <li>
          <strong>An orphaned page.</strong> An About page that is not linked from the navigation or footer, or is
          blocked in robots.txt, may be crawled rarely or not at all.
        </li>
        <li>
          <strong>Stale facts.</strong> Former staff, closed locations or an old service list. Update the page when
          the business changes, the same day you update your profiles.
        </li>
      </ul>

      <h2>How do you check whether AI reads your About page correctly?</h2>
      <p>
        Check by asking the assistants directly what they know about your business and comparing their answer with
        your About page line by line. Ask ChatGPT, Gemini, Claude and Perplexity something like &quot;What is
        [business name] in [town], who runs it and when was it founded?&quot; and note any wrong or missing facts.
      </p>
      <p>
        Wrong answers usually trace back to an outdated or inconsistent source elsewhere on the web, not only your
        own page. Our guide to <Link href="/blog/fix-wrong-ai-information-about-your-business">fixing wrong AI
        information about your business</Link> walks through finding and correcting those sources. Answers also vary
        between runs, so ask more than once before drawing conclusions. The{" "}
        <Link href="/start">free 60-second AI check</Link> asks all four assistants for you and shows what each one
        says today.
      </p>
      <p>
        Alphaa, the agent we build, includes the About page in its 23-point site check and can draft the identity
        summary and the Organization or LocalBusiness markup for the owner to approve before anything is published to
        WordPress, Shopify or Webflow. Plans start at $99 a month; see <Link href="/pricing">pricing</Link>. It
        improves the public signals assistants read; it cannot make any assistant recommend you.
      </p>

      <h2>What else do owners ask about About pages and AI search?</h2>

      <h3>How long should an About page be for AI search?</h3>
      <p>
        Long enough to state every identity fact once, which for most small businesses is 300 to 700 words. Lead
        with the 40–60 word summary so the most important facts are at the top, and cut anything that is decoration
        rather than information.
      </p>

      <h3>Should the About page or the home page carry Organization schema?</h3>
      <p>
        Either works, according to Google&apos;s Organization documentation, which suggests the home page or a
        single page that describes the organisation. Pick one, keep it complete, and avoid conflicting versions of
        the same markup on different pages.
      </p>

      <h3>Do I need individual staff bio pages?</h3>
      <p>
        They help when your expertise rests on specific people, such as clinicians, lawyers or licensed trades. A
        bio page gives each person their own checkable facts; our guide to{" "}
        <Link href="/blog/eeat-author-bios-ai-search">author bios and E-E-A-T</Link> explains what to put on them.
      </p>

      <h3>Can I write my About page with AI tools?</h3>
      <p>
        Yes, as long as a person checks every fact before it is published. The danger is not the tool but invented
        details, such as a wrong founding year or a qualification nobody holds, which assistants may then repeat.
      </p>

      <h3>Will a better About page get me recommended by ChatGPT?</h3>
      <p>
        It cannot guarantee it, because no single page controls what an assistant says. It removes a common reason
        for vague or wrong answers, and works best alongside reviews, consistent listings and helpful service pages.
      </p>
    </div>
  )
}
