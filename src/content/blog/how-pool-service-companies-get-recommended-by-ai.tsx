import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-pool-service-companies-get-recommended-by-ai",
  title: "How Pool Service Companies Get Recommended by AI",
  description:
    "How pool service companies get recommended by ChatGPT, Gemini, Claude and Perplexity: publish services, certifications, routes, water care and clear prices.",
  subtitle:
    "Pool service companies get recommended by AI when assistants can read which pools and jobs they handle, which certifications the techs hold, how weekly service and water testing work, which areas the routes cover and roughly what it costs, backed by a consistent Google profile and specific reviews.",
  date: "2026-11-16",
  updated: "2026-11-16",
  readMins: 8,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how pool service companies get recommended by ai",
  takeaways: [
    "Pool owners ask AI about weekly service, green pool cleanup, equipment repair, openings and closings, price and location in one question.",
    "Google says local results are based mainly on relevance, distance and prominence, and that more reviews and positive ratings can help.",
    "PHTA's service pathway runs from Certified Pool & Spa Operator through Maintenance Specialist and Service Technician to Service Professional.",
    "CDC recommends pH 7.0 to 7.8 and at least 1 ppm chlorine in home pools, which gives a service page a sourced standard to cite.",
    "Pool route businesses that serve customers at home should set a service area on Google and hide a home address.",
  ],
  sources: [
    {
      title: "Tips to improve your local ranking on Google - Google Business Profile Help",
      publisher: "Google Business Profile Help",
      url: "https://support.google.com/business/answer/7091",
    },
    {
      title: "Guidelines for representing your business on Google - Google Business Profile Help",
      publisher: "Google Business Profile Help",
      url: "https://support.google.com/business/answer/3038177",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
    {
      title: "PHTA Certified Pool Service Professional Pathway - Pool & Hot Tub Alliance",
      publisher: "Pool & Hot Tub Alliance",
      url: "https://www.phta.org/main-navigation-tree/education-certification/certification/service-certification-pathway/",
    },
    {
      title: "Certified Pool & Spa Operator (CPO) - Pool & Hot Tub Alliance",
      publisher: "Pool & Hot Tub Alliance",
      url: "https://www.phta.org/main-navigation-tree/education-certification/certification/certified-pool-spa-operator-cpo/",
    },
    {
      title: "Home Pool and Hot Tub Water Treatment and Testing | Healthy Swimming | CDC",
      publisher: "CDC",
      url: "https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Pool service companies get recommended by AI when ChatGPT, Gemini, Claude and
        Perplexity can read which pools and jobs you handle, which certifications your techs hold, what weekly service
        includes, which neighbourhoods your routes cover and roughly what it costs. Publish those facts on your website,
        match them on your Google Business Profile, and earn reviews that name the job.
      </p>

      <p>
        This guide is for weekly pool cleaning routes, pool repair and equipment companies, seasonal opening and closing
        services, and builders that also run service departments. It covers what pool owners ask AI, how assistants pick
        whom to name, and the changes that make a pool company easy to recommend.
      </p>

      <h2>Why are pool owners asking AI to find a pool service?</h2>
      <p>
        Pool owners ask AI because choosing a pool service involves details a map listing rarely explains: what weekly
        service actually includes, whether chemicals are in the price, who can fix a pump or heater, how fast someone can
        clear a green pool before a party, and whether the company covers their street. An assistant can take all of that
        in one question and return a short list. Roughly two-thirds of Google searches now end without a single click to
        a website (SparkToro/Similarweb, 2026), and 65% of consumers now use AI tools to research products before buying
        (Clutch, 2026).
      </p>
      <p>
        For a route-based business, that means the shortlist often forms before anyone asks for a quote. If an assistant
        cannot find clear facts about your company, it names the one whose facts it can find. Our piece on{" "}
        <Link href="/blog/ai-near-me-searches">AI &quot;near me&quot; searches</Link> explains how assistants handle
        local questions.
      </p>

      <h2>How do AI assistants decide which pool companies to recommend?</h2>
      <p>
        AI assistants recommend the pool companies whose public information best matches the question, sits close to the
        customer, and is backed by consistent evidence from other sites. Google describes the same ideas for local
        results in its{" "}
        <a href="https://support.google.com/business/answer/7091" {...ext}>
          tips to improve your local ranking
        </a>
        : relevance, distance and prominence. It says more reviews and positive ratings can help, and that there is no
        way to request or pay for a better local ranking.
      </p>
      <p>The signals that matter most for a pool service fall into five groups.</p>
      <ul>
        <li>
          <strong>Services:</strong> weekly or biweekly cleaning, chemical service only, green pool and algae cleanup,
          filter cleaning, equipment repair and replacement, leak detection, openings and closings, hot tubs and spas.
        </li>
        <li>
          <strong>Credentials:</strong> which techs hold industry certifications, and any contractor or electrical licence
          your state or city requires for equipment work.
        </li>
        <li>
          <strong>Water care:</strong> how often you test, what you test for, and how you report results to the owner.
        </li>
        <li>
          <strong>Area and schedule:</strong> the towns and neighbourhoods your routes cover, service days, and whether
          you take one-off or emergency calls.
        </li>
        <li>
          <strong>Proof:</strong> reviews that name the job, captioned before-and-after photos, and consistent details on
          directories.
        </li>
      </ul>

      <h2>Which customer questions should a pool service website answer?</h2>
      <p>
        A pool service website should answer the questions people type into AI before they call, in plain sentences an
        assistant can quote. These come up most often.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer question</th>
              <th>What to publish</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>How much is weekly pool service?</td>
              <td>Price ranges by pool type and size, and whether chemicals are included</td>
            </tr>
            <tr>
              <td>What does weekly service include?</td>
              <td>A checklist: skimming, brushing, vacuuming, baskets, testing, chemicals, filter checks</td>
            </tr>
            <tr>
              <td>Who can fix a green pool fast?</td>
              <td>A green pool page: how you clean it, typical visits needed, and booking lead time</td>
            </tr>
            <tr>
              <td>Who repairs pool pumps and heaters?</td>
              <td>Equipment you service, brands you are authorised for, and licences held</td>
            </tr>
            <tr>
              <td>Do they open and close pools?</td>
              <td>Seasonal dates you book, what each visit covers, and winterising steps</td>
            </tr>
            <tr>
              <td>Do they service my area?</td>
              <td>A list of towns and neighbourhoods on your routes, kept current</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        One page per main service works better than a single services list, because it gives the assistant a specific
        page to cite for a specific question. Our guide to the{" "}
        <Link href="/blog/service-page-for-ai-search">service page AI search can quote</Link> shows the layout, and{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link> explains how to
        publish ranges without quoting pools you have not seen.
      </p>

      <h2>Why do pool certifications matter for AI visibility?</h2>
      <p>
        Pool certifications matter because they are verifiable trust signals customers ask about, and an assistant can
        only mention them if your site states them in text. The Pool &amp; Hot Tub Alliance (PHTA) runs a{" "}
        <a
          href="https://www.phta.org/main-navigation-tree/education-certification/certification/service-certification-pathway/"
          {...ext}
        >
          Certified Pool Service Professional Pathway
        </a>{" "}
        with four levels: Certified Pool &amp; Spa Operator (CPO), Certified Pool &amp; Spa Maintenance Specialist (CMS),
        Certified Pool &amp; Spa Service Technician (CST) and Certified Pool &amp; Spa Service Professional (CSP).
      </p>
      <p>
        PHTA says on its{" "}
        <a
          href="https://www.phta.org/main-navigation-tree/education-certification/certification/certified-pool-spa-operator-cpo/"
          {...ext}
        >
          CPO page
        </a>{" "}
        that over 700,000 students have been trained since 1973 and that the certification is valid for five years.
        Name the techs who hold each credential on your website, write the credential out in full rather than showing
        only a badge, and keep expiry dates current. Do not claim a certification your team does not hold, and say
        plainly if you send equipment or electrical work to a licensed partner.
      </p>

      <h2>How should pool companies write about water care?</h2>
      <p>
        Pool companies should write about water care in specific, checkable terms, because healthy water is what owners
        are paying for and an assistant can quote a page that explains it. The CDC&apos;s guidance on{" "}
        <a
          href="https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html"
          {...ext}
        >
          home pool and hot tub water treatment and testing
        </a>{" "}
        recommends pH between 7.0 and 7.8 and a chlorine level of at least 1 ppm in pools and at least 3 ppm in hot tubs,
        rising to at least 2 ppm in pools that use cyanuric acid. It also advises owners to test chlorine and pH at least
        twice a day.
      </p>
      <p>
        That gives you a sourced standard to explain your own process against. A short water care page covers what you
        test on each visit, the targets you aim for, how you handle stabiliser and salt systems, and how owners can keep
        the water balanced between visits. If you leave a test log or send a visit report, say so. Avoid absolute claims
        like &quot;perfect water every week&quot;; describe what you actually do.
      </p>

      <h2>How should a pool company set up its Google Business Profile?</h2>
      <p>
        A pool company should set up its Google Business Profile with the real business name, one accurate primary
        category, the true service area and current hours, because assistants and Google&apos;s own AI features lean on
        those details. Google&apos;s{" "}
        <a href="https://support.google.com/business/answer/3038177" {...ext}>
          guidelines for representing your business
        </a>{" "}
        set the rules.
      </p>
      <ol>
        <li>
          <strong>Use your real name.</strong> Google says the name should match the real-world name you use
          consistently. &quot;Bluewater Pool Care&quot; is fine; &quot;Bluewater Pool Cleaning Repair Phoenix&quot; is
          not.
        </li>
        <li>
          <strong>Pick a specific primary category.</strong> Choose the pool cleaning or pool service category that fits
          your core work, and add secondary ones only for genuinely separate services, such as a retail store.
        </li>
        <li>
          <strong>Set a service area.</strong> Google says service-area businesses that serve customers at their
          locations should set a service area. If you run routes from a home or a yard customers do not visit, hide the
          address and list the towns you cover.
        </li>
        <li>
          <strong>Keep seasonal hours honest.</strong> If you close in winter or only book openings in spring, update
          hours and your description so assistants do not send customers to a closed business.
        </li>
        <li>
          <strong>Add captioned photos and reply to reviews.</strong> A reply that names the job, such as &quot;glad we
          got the pool from green to clear before the weekend&quot;, adds another sentence about what you do.
        </li>
      </ol>
      <p>
        Our guide to <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link>{" "}
        goes deeper, and <Link href="/blog/google-reviews-ai-visibility">how Google reviews affect AI visibility</Link>{" "}
        explains why review wording matters.
      </p>

      <h2>What structured data should a pool service use?</h2>
      <p>
        A pool service should use LocalBusiness structured data that states its name, service area, phone, hours and
        services in a format machines read without guessing. Schema.org has no dedicated pool service type, so the
        general{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
          LocalBusiness type that Google documents
        </a>{" "}
        is the safe choice.
      </p>
      <p>
        Google&apos;s documentation lists the properties it reads, such as name, address, telephone, opening hours, URL
        and price range. Keep each value identical to your Google profile and website footer, and describe the towns your
        routes cover with <code>areaServed</code>. Our guide to{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> has a worked example.
      </p>

      <h2>How can a pool service get recommended by AI step by step?</h2>
      <p>
        A pool service can work through six steps, starting with checking what AI says today and ending with a monthly
        re-check. Most take an afternoon each, and the off-season is a good time to do them.
      </p>
      <ol>
        <li>
          <strong>Ask the assistants.</strong> Type &quot;best pool service in your town&quot; and &quot;who can fix a
          green pool near your town&quot; into ChatGPT, Gemini, Claude and Perplexity. Note who is named and why.
        </li>
        <li>
          <strong>Write one page per main service.</strong> Weekly service, green pool cleanup, equipment repair,
          openings and closings, hot tubs. Open each with a plain sentence saying what you do and where.
        </li>
        <li>
          <strong>Publish credentials and water care.</strong> Named techs and their certifications, licences for
          equipment work, and your testing routine.
        </li>
        <li>
          <strong>Publish price ranges and what moves them.</strong> Pool size, type, screen enclosures, trees nearby, and
          whether chemicals are included.
        </li>
        <li>
          <strong>Fix your listings.</strong> Same name, phone and hours on Google, Apple, Bing, Yelp and trade
          directories. Our <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings guide</Link>{" "}
          lists where to check.
        </li>
        <li>
          <strong>Ask for specific reviews and re-check monthly.</strong> Ask customers to mention the job and the
          neighbourhood. AI answers vary from one ask to the next, so look for a trend rather than a single result.
        </li>
      </ol>
      <p>
        If you also maintain gardens and yards, read{" "}
        <Link href="/blog/how-landscaping-lawn-care-get-recommended-by-ai">
          how landscaping and lawn care companies get recommended by AI
        </Link>
        . Pest and cleaning routes share the same pattern; see{" "}
        <Link href="/blog/how-pest-control-companies-get-recommended-by-ai">
          how pest control companies get recommended by AI
        </Link>
        , and the wider <Link href="/blog/get-recommended-by-ai-local-service-business">local service business guide</Link>{" "}
        applies to every local trade.
      </p>

      <h2>What should pool companies avoid when chasing AI visibility?</h2>
      <p>
        Pool companies should avoid anything that makes their facts inconsistent or unverifiable, because assistants trust
        businesses whose details agree across sources. The common mistakes are easy to fix.
      </p>
      <ul>
        <li>Stuffing services or city names into the Google business name.</li>
        <li>Listing towns you no longer run routes in, which sends customers you cannot serve.</li>
        <li>Calling every tech &quot;certified&quot; when only some hold a credential, or letting one lapse.</li>
        <li>Prices only in a quote form, with no ranges anywhere an assistant can read.</li>
        <li>Buying reviews, which breaks platform rules and can get a profile suspended.</li>
      </ul>
      <p>
        Alphaa handles the repeatable part of this for a pool company. It asks ChatGPT, Gemini, Claude and Perplexity what
        they say about you each week, then drafts service pages, FAQs, structured data, Google profile posts and review
        replies for you to approve before anything goes live, from $99 a month. Start with the{" "}
        <Link href="/start">free 60-second AI check</Link> to see what the assistants say today.
      </p>

      <h2>What else do pool service owners ask about AI recommendations?</h2>

      <h3>Do I need a CPO certification to get recommended by AI?</h3>
      <p>
        No, but a credential stated clearly on your site is one of the strongest trust signals you can give, and it is
        easy for an assistant to quote. If nobody on your team is certified, describe your experience and training
        honestly instead.
      </p>

      <h3>Should a pool service publish prices?</h3>
      <p>
        Publishing price ranges helps, because cost is one of the first things customers ask an assistant. Explain what
        moves the price, such as pool size, type and whether chemicals are included, so the range stays honest.
      </p>

      <h3>Does seasonal work hurt AI visibility in winter?</h3>
      <p>
        It does not have to, as long as your hours and description say what you offer in the off-season. Pages about
        closings, winterising and spring openings give assistants something current to cite all year.
      </p>

      <h3>How long until AI starts recommending my pool company?</h3>
      <p>
        There is no fixed timeline, and nobody can promise one. Assistants that search the web can pick up changes once
        their search index recrawls your pages, while answers drawn from training data change more slowly.
      </p>

      <h3>Should a pool route business show its home address?</h3>
      <p>
        No, if customers do not visit you, Google says to set a service area and hide the address. List the towns you
        serve instead, so assistants can match you to the right neighbourhoods.
      </p>
    </div>
  )
}
