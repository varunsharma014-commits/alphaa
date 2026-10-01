import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-property-managers-get-recommended-by-ai",
  title: "How Property Managers Get Recommended by AI",
  description:
    "Owners now ask ChatGPT who manages rentals in their city. What property managers must publish — fees, doors, markets — to be the one AI names back.",
  subtitle:
    "Property managers get recommended by AI when their fee structure, service area and door count are published as checkable facts an engine can quote.",
  date: "2026-10-01",
  updated: "2026-10-01",
  readMins: 7,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how property managers get recommended by ai",
  image: {
    src: "/blog/how-property-managers-get-recommended-by-ai.webp",
    alt: "Five brass door keys in a row beneath a wooden peg rail on a pale wall.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Owners ask assistants about fees and terms before they ask for a company name, so your pricing page decides the recommendation.",
    "Publish the management percentage, leasing fee, renewal fee and what is excluded, or an engine will cite a competitor who did.",
    "Service-area setup on Google matters: a profile with a hidden address and a sane radius is the one that gets matched.",
    "NARPM and local association directories are the third-party records assistants check your details against.",
    "Owner reviews, not tenant complaints, are the evidence that moves an owner-side recommendation.",
  ],
  sources: [
    { title: "Search for a Property Manager - National Association of Residential Property Managers", publisher: "NARPM", url: "https://www.narpm.org/find/property-managers/" },
    { title: "Guidelines for representing your business on Google", publisher: "Google Business Profile Help", url: "https://support.google.com/business/answer/3038177" },
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Local Business (LocalBusiness) Structured Data", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/structured-data/local-business" },
    { title: "RealEstateAgent - Schema.org Type", publisher: "Schema.org", url: "https://schema.org/RealEstateAgent" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about local businesses. Last updated 1 October 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Property managers get recommended by AI when the facts an owner is comparing
        — management percentage, leasing fee, markets served, property types, door count — are published on your own
        site as plain, checkable statements, and the same details match on Google and in association directories.
        Vague &quot;competitive rates&quot; pages get skipped.
      </p>

      <p>
        The owner-side buying journey is unusually fact-heavy, which is good news. An owner with a rental two states
        away is not browsing; they are trying to work out what a manager costs and whether anyone will take a single
        condo. Those are answerable questions, and the company that answered them in writing is the one an assistant
        can name.
      </p>

      <h2>What do owners actually ask AI about property managers?</h2>
      <p>
        They ask about money and terms first, and for a company name second. In practice the prompts cluster into
        five groups, and only the last one mentions anyone by name:
      </p>
      <ul>
        <li>
          <strong>Cost.</strong> &quot;What percentage do property managers charge in Phoenix?&quot; &quot;Is 10%
          plus a leasing fee normal?&quot;
        </li>
        <li>
          <strong>Worth it.</strong> &quot;Should I self-manage one rental or hire a manager?&quot;
        </li>
        <li>
          <strong>Fit.</strong> &quot;Who manages single-family rentals for out-of-state owners near Tampa?&quot;
          &quot;Does anyone take a portfolio of four units?&quot;
        </li>
        <li>
          <strong>Risk.</strong> &quot;What do I do if my property manager will not release my funds?&quot;
          &quot;How do I get out of a management agreement?&quot;
        </li>
        <li>
          <strong>Shortlist.</strong> &quot;Best property management companies in Raleigh for small landlords.&quot;
        </li>
      </ul>
      <p>
        If your site only speaks to the last group, you have skipped four chances to be the source the assistant
        read before it answered.
      </p>

      <h2>Why do assistants skip most property management websites?</h2>
      <p>
        Because the average property management site withholds exactly the information the prompt is about. A page
        that says &quot;competitive pricing — call for a quote&quot; contains no extractable fact, so there is
        nothing for an engine to lift. Google is explicit in its{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          documentation on AI features
        </a>{" "}
        that there are no special optimisations or extra markup required to appear in them, which means the
        differentiator is not a trick — it is whether the page says something specific.
      </p>
      <p>
        The second reason is identity. Many firms operate as one brand across three counties with a suite address,
        a doing-business-as name on the lease and a different name on the Google profile. An engine that cannot
        resolve which company you are has no reason to recommend you over a national marketplace it can resolve. We
        cover that failure mode in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          how AI engines figure out who your business is
        </Link>
        .
      </p>

      <h2>What should a property manager publish first?</h2>
      <p>
        Publish the fee structure, in numbers, with the exclusions named — it is the single highest-value page you
        can write. Then work down this list in order.
      </p>
      <ol>
        <li>
          <strong>A real pricing page.</strong> Management percentage or flat fee, leasing fee, renewal fee, tenant
          placement, inspection and maintenance mark-up, and what is not included. A range with the conditions
          attached beats silence.
        </li>
        <li>
          <strong>A scope-of-service table.</strong> Who handles after-hours maintenance, eviction filing,
          accounting, 1099s, HOA liaison, turnovers. Owners compare on this and nobody publishes it.
        </li>
        <li>
          <strong>Who you take and who you do not.</strong> Property types, minimum rent, door count you manage,
          cities and ZIPs served. A clear &quot;we do not manage short-term rentals&quot; wins you the prompts you
          can serve.
        </li>
        <li>
          <strong>A market page per city, with local facts.</strong> Typical rents, vacancy, licensing and local
          ordinance notes. Not a template with the city name swapped — see{" "}
          <Link href="/blog/do-city-landing-pages-work-ai-search">whether city landing pages still work</Link>.
        </li>
        <li>
          <strong>An owner FAQ with real answers.</strong> Deposit handling, when owners get paid, how maintenance
          limits work, how to terminate. Question heading, short answer directly under it.
        </li>
        <li>
          <strong>Structured data on the office page.</strong> Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
            LocalBusiness documentation
          </a>{" "}
          covers the base, and Schema.org&apos;s{" "}
          <a href="https://schema.org/RealEstateAgent" {...ext}>
            RealEstateAgent type
          </a>{" "}
          is the closer match for a management office.
        </li>
      </ol>

      <h2>How should a property manager set up Google and the directories?</h2>
      <p>
        Set the profile up as a service-area business with a hidden address and a realistic radius, because that is
        what Google&apos;s own rules ask for. The{" "}
        <a href="https://support.google.com/business/answer/3038177" {...ext}>
          guidelines for representing your business on Google
        </a>{" "}
        say service-area businesses should keep one profile for the central office with a designated service area,
        should hide the address when working from a residential location, and should generally not claim a radius
        beyond about two hours&apos; driving time. They also ask you to use as few categories as possible and to
        pick what the business <em>is</em>, not what it has.
      </p>
      <p>
        Then make the third-party records agree. NARPM&apos;s{" "}
        <a href="https://www.narpm.org/find/property-managers/" {...ext}>
          public property-manager directory
        </a>{" "}
        is searchable by anyone, which makes it one of the places an assistant can check your name, market and
        credentials against your own site. State real-estate licence lookups, your local apartment association and
        the usual business directories do the same job. Consistency across them is the point; our guide to{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">
          directory listings and NAP citations in AI search
        </Link>{" "}
        explains why a single stale phone number is worth fixing.
      </p>

      <h2>Which reviews actually matter for an owner recommendation?</h2>
      <p>
        Owner reviews matter far more than tenant reviews for an owner-side prompt, and property management is the
        rare industry where the two populations review you for opposite reasons. A tenant writes about a deposit
        dispute; an owner writes about vacancy days and whether the statement arrived. An assistant summarising
        &quot;is this company good&quot; reads both, so the asymmetry is worth managing deliberately.
      </p>
      <p>
        That means asking owners for reviews on a schedule, and replying to tenant complaints in a way that states
        the policy rather than arguing. A reply that explains the deposit timeline gives an engine a fact to quote
        instead of a grievance. We go deeper in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why your Google reviews now decide your AI visibility</Link>.
      </p>

      <h2>Does the answer change for short-term rentals, HOAs or commercial?</h2>
      <p>
        Yes, and the biggest difference is who you are competing against for the answer. Residential long-term
        management competes mainly with national marketplaces and directories. Short-term rental management competes
        with the booking platforms themselves, which publish enormous amounts of structured data and are hard to
        displace on a generic prompt. HOA and commercial management compete with almost nobody, which makes them the
        easiest wins and the most neglected pages on most firms&apos; sites.
      </p>
      <p>
        The practical move is to write a separate, specific page for each line of business you actually want, with
        the detail that line of business is judged on: for HOA work, board-meeting support, reserve-study
        coordination and assessment collection; for commercial, CAM reconciliation, lease administration and
        triple-net experience; for short-term, channel management, cleaning turnaround and local licensing rules.
        One page that claims all four in a sentence each will lose to four firms that each wrote one.
      </p>

      <h2>What about the maintenance and vendor questions owners ask?</h2>
      <p>
        Maintenance is the single biggest source of owner distrust, so it is also the richest content opportunity in
        this industry. Owners ask assistants whether managers mark up repairs, whether they own the maintenance
        company, what the approval threshold is and who picks the vendor — and almost no management website answers
        any of it in writing.
      </p>
      <p>
        Answer all four plainly. State your mark-up or state that there is none. Disclose any affiliated maintenance
        entity. Name the dollar figure above which you call the owner. Say how vendors are selected and whether
        owners can supply their own. Each of those is a short, quotable fact, and together they answer the prompt an
        owner asks right before they switch managers. That is the shape of content assistants reuse, which we unpack
        in <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI actually quotes</Link>.
      </p>

      <h2>How do multi-market firms avoid splitting their own authority?</h2>
      <p>
        Pick one brand name, one primary domain and one office profile per real office, then let market pages do
        the geographic work. Firms that grow by acquisition usually end up with three legacy domains, two brand
        spellings and duplicate profiles, which divides the evidence an engine uses rather than multiplying it.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Situation</th>
              <th>What usually happens</th>
              <th>What to do instead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Acquired a local firm</td>
              <td>Both sites stay live, both rank thinly</td>
              <td>Redirect to one domain, keep the old name as an alias on your about page</td>
            </tr>
            <tr>
              <td>Three cities, one office</td>
              <td>Three fake office listings</td>
              <td>One profile with a service area, one market page per city</td>
            </tr>
            <tr>
              <td>Separate owner and tenant brands</td>
              <td>Neither accumulates authority</td>
              <td>One brand, two clearly labelled sections</td>
            </tr>
            <tr>
              <td>Portal hosted on a subdomain</td>
              <td>Login page outranks the service pages</td>
              <td>Keep the portal out of the index, link it from the footer</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The same logic applies to anyone with more than one location, and we have a general version in{" "}
        <Link href="/blog/multi-location-business-ai-visibility">
          how multi-location businesses get recommended by AI
        </Link>
        . If you also list properties for sale, the agent-side playbook in{" "}
        <Link href="/blog/how-real-estate-agents-get-recommended-by-ai">
          how real estate agents get recommended by AI
        </Link>{" "}
        covers the overlap.
      </p>

      <h2>What should a property manager do in the first week?</h2>
      <p>
        Ask the four assistants the questions your owners ask, write down who gets named, and then publish the one
        page you are most reluctant to write — the fee page. That sequence gives you a baseline and the highest-value
        fix in the same week, with no tooling required.
      </p>
      <p>
        For a second week, add the scope-of-service table and the maintenance disclosures, because between them they
        answer most of what an owner is nervous about. Then set a reminder to re-ask the same prompts in a month and
        write down what changed. Two data points a month apart teach you more about your own AI visibility than any
        single audit, and the exercise costs nothing but the time it takes to type the questions.
      </p>
      <p>
        None of this guarantees a recommendation; no software can edit what a model believes. What it does is make
        the public evidence about your company specific, consistent and current, which is the part you control. The{" "}
        <Link href="/start">free 60-second check</Link> shows what ChatGPT, Gemini, Claude and Perplexity say about
        your firm right now, and{" "}
        <Link href="/blog/schema-markup-for-ai-search">our schema markup guide</Link> covers the technical half.
      </p>

      <h2>What else do property managers ask about AI search?</h2>

      <h3>Will publishing my fees cost me deals?</h3>
      <p>
        It filters them instead. Owners who were never going to pay your rate stop calling, and owners who were
        comparing you against a competitor who published nothing now have a reason to pick you — and an assistant
        has a number it can quote on your behalf.
      </p>

      <h3>Do assistants recommend national marketplaces over local firms?</h3>
      <p>
        Often, yes, because marketplaces publish structured, machine-readable detail at scale and most local firms
        publish a brochure. The counter is specificity a marketplace cannot match: local ordinance notes, real
        vacancy figures for your submarket, and named property types you accept.
      </p>

      <h3>Does my tenant portal help or hurt?</h3>
      <p>
        A login page helps nobody if it is the page engines index most. Keep the portal out of search results, and
        make sure the pages that explain how the portal works for owners are crawlable and written in plain
        language.
      </p>

      <h3>Is NARPM membership necessary to get recommended?</h3>
      <p>
        No, but a listing in a credible third-party directory gives an assistant a second record that agrees with
        your site. NARPM&apos;s directory is public and searchable, which is exactly the property that makes a
        record useful as corroboration.
      </p>

      <h3>How long does any of this take to show up?</h3>
      <p>
        Expect months, not weeks, and expect uneven results across the four assistants. Pages have to be recrawled
        and then actually retrieved for a given prompt, and anyone promising a fixed timeline is guessing.
      </p>
    </div>
  )
}
