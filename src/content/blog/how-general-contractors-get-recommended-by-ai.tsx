import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-general-contractors-get-recommended-by-ai",
  title: "How General Contractors Get Recommended by AI",
  description:
    "Homeowners now ask ChatGPT which remodeler to call. What general contractors must publish: license, project types, price ranges and service area, as facts.",
  subtitle:
    "General contractors get recommended by AI when their license number, project types, realistic price ranges and service area are published as plain facts an assistant can verify and quote.",
  date: "2026-10-06",
  updated: "2026-10-06",
  readMins: 6,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how general contractors get recommended by ai",
  image: {
    src: "/blog/how-general-contractors-get-recommended-by-ai.webp",
    alt: "A spirit level and a folded wooden rule resting on a sanded pale oak plank in a white, half-renovated room.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Homeowners ask assistants about cost, timeline and trust before they ask for a company name, so the project pages decide the recommendation.",
    "Publish your license number, insurance status and project types where an engine can read and cross-check them against the state licensing board.",
    "A service-area Google Business Profile with the right primary category is the record assistants match your business to.",
    "Realistic price ranges per project type, with what is excluded, beat a quote form that gives an engine nothing to quote.",
    "Reviews that name the project, the town and the outcome are the evidence that moves a contractor recommendation.",
  ],
  sources: [
    { title: "Guidelines for representing your business on Google", publisher: "Google Business Profile Help", url: "https://support.google.com/business/answer/3038177" },
    { title: "Local Business (LocalBusiness) Structured Data", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/structured-data/local-business" },
    { title: "HomeAndConstructionBusiness - Schema.org Type", publisher: "Schema.org", url: "https://schema.org/HomeAndConstructionBusiness" },
    { title: "Check a Contractor License or Home Improvement Salesperson (HIS) Registration", publisher: "California Contractors State License Board", url: "https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx" },
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say
          about local businesses. Last updated 6 October 2026.
        </em>
      </p>
      <p>
        <strong>Short answer:</strong> General contractors get recommended by AI when an assistant can verify who
        they are and what they do from public facts: a license number that matches the state board, named project
        types, realistic price ranges, a defined service area and reviews that describe finished jobs. Most
        contractor websites publish none of this in readable form, so the engines recommend the few that do.
      </p>
      <p>
        This guide is for general contractors, remodelers and design-build firms. It covers what homeowners ask
        AI before they ever search a company name, why most contractor sites are invisible to those questions, and
        what to publish first, in the order that matters.
      </p>

      <h2>What do homeowners actually ask AI about contractors?</h2>
      <p>
        Homeowners ask assistants about cost, timeline, trust and process long before they ask for a company, and
        the company they end up with is often the one the assistant mentioned while answering those earlier
        questions. The pattern we see in weekly checks across the four assistants runs roughly in this order.
      </p>
      <ul>
        <li>
          <strong>Cost questions.</strong> &quot;How much does a kitchen remodel cost in Denver?&quot; &quot;What
          does a second-storey addition run per square foot?&quot; The assistant answers with ranges, and it cites
          whoever published ranges.
        </li>
        <li>
          <strong>Trust questions.</strong> &quot;How do I check if a contractor is licensed?&quot; &quot;What
          should be in a remodeling contract?&quot; &quot;Red flags when hiring a GC?&quot; The assistant explains,
          and often names firms whose pages explained it first.
        </li>
        <li>
          <strong>Process questions.</strong> &quot;How long does a bathroom remodel take?&quot; &quot;Do I need a
          permit to remove a wall?&quot; &quot;Can I live in the house during a renovation?&quot;
        </li>
        <li>
          <strong>Shortlist questions.</strong> &quot;Best remodeling contractors in Raleigh for a kitchen&quot;,
          &quot;design-build firm near me that does ADUs&quot;. Only now does the assistant produce names, and it
          produces them from the evidence gathered above.
        </li>
      </ul>
      <p>
        Every one of these is a question your site could answer in a paragraph. Almost none do, because
        contractor marketing has been built around a photo gallery and a quote form. See{" "}
        <Link href="/blog/your-next-customer-is-asking-chatgpt-first">your next customer is asking ChatGPT first</Link>{" "}
        for how common this behaviour has become.
      </p>

      <h2>Why do assistants skip most contractor websites?</h2>
      <p>
        Because the typical contractor site gives an engine nothing checkable: a hero image, a slogan, a gallery
        loaded by script, and a form. There is no license number in the text, no list of project types, no price
        range, no service area beyond &quot;and surrounding areas&quot;, and the reviews live in a third-party
        widget the crawler cannot read. In our September 2026 check of 288 local business sites across five
        service industries, 17% turned away an automated reader outright, and most of the rest were missing
        structured business facts; the details are in{" "}
        <Link href="/blog/local-business-ai-readiness-study-2026">the local business AI readiness study</Link>.
      </p>
      <p>
        Assistants are built to avoid confident mistakes about a trade where a bad recommendation costs a homeowner
        tens of thousands of dollars. When a firm cannot be verified, the engine does not guess; it recommends the
        firm it can verify, or it recommends a national marketplace instead. That is the whole mechanism. It is
        not about keywords, and{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          Google states
        </a>{" "}
        that no markup or special optimisation buys inclusion in its AI features. Verifiable facts do the work.
      </p>

      <h2>What should a general contractor publish first?</h2>
      <p>
        Publish the facts a homeowner would check before signing, in plain HTML text on your own site, starting
        with the license. In order of leverage:
      </p>
      <ol>
        <li>
          <strong>License number, class and issuing board.</strong> Write it in text, not just in the footer image.
          State boards such as the{" "}
          <a href="https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx" {...ext}>
            California CSLB
          </a>{" "}
          let anyone look up a license by number or business name, and assistants cross-check exactly that way.
          A number that matches the board record is the strongest trust signal you own.
        </li>
        <li>
          <strong>Insurance and bonding, stated plainly.</strong> General liability and workers&apos; compensation,
          with the fact that certificates are available on request. No amounts you cannot back up.
        </li>
        <li>
          <strong>Project types, one page each.</strong> Kitchens, bathrooms, additions, whole-house, ADUs,
          basements, decks, commercial tenant improvements. Each page answers: what is included, typical timeline,
          typical price range, what affects the price, permits, and whether you do design as well as build.
        </li>
        <li>
          <strong>Realistic price ranges.</strong> &quot;Mid-range kitchen remodels we complete in the metro area
          typically run from X to Y; the range depends on cabinetry, layout changes and whether plumbing moves.&quot;
          A range with its drivers is liftable; &quot;contact us for a quote&quot; is not. See the argument in{" "}
          <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link>.
        </li>
        <li>
          <strong>Service area, named.</strong> The cities and counties you take jobs in, as a list, matching what
          your Google Business Profile says.
        </li>
        <li>
          <strong>Who is accountable.</strong> The owner&apos;s name, years in the trade, and the team. Assistants
          weigh a named, checkable person over an anonymous brand.
        </li>
      </ol>
      <p>
        Then add structured data so the facts are machine-readable. Schema.org defines{" "}
        <a href="https://schema.org/HomeAndConstructionBusiness" {...ext}>
          HomeAndConstructionBusiness
        </a>{" "}
        as &quot;a LocalBusiness that provides services around homes and buildings&quot;, with{" "}
        <code>GeneralContractor</code> as a specific sub-type alongside Plumber, Electrician, RoofingContractor
        and HousePainter. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
          LocalBusiness documentation
        </a>{" "}
        asks you to use the most specific sub-type possible and recommends <code>telephone</code>,{" "}
        <code>url</code>, <code>priceRange</code>, <code>openingHoursSpecification</code>, <code>geo</code> and{" "}
        <code>aggregateRating</code>. The basics are in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h2>How should a contractor set up Google and the directories?</h2>
      <p>
        As a service-area business with one profile, a hidden address, the right primary category and a name that
        matches your license. Google&apos;s{" "}
        <a href="https://support.google.com/business/answer/3038177" {...ext}>
          guidelines
        </a>{" "}
        say businesses that serve customers at their locations &quot;should have one profile for the central office
        or location with a designated service area&quot; and should hide the address from customers. They also say
        the name must reflect your real-world name as used on your storefront, website and stationery, with no
        taglines, service words or towns added. &quot;Smith Construction&quot; is right; &quot;Smith Construction
        Kitchen Remodeling Austin&quot; is a violation and a mismatch with your license record.
      </p>
      <p>
        Choose the primary category by what the business <em>is</em> rather than what it <em>has</em>, as Google
        puts it: General Contractor, Remodeler, Kitchen Remodeler, Bathroom Remodeler or Custom Home Builder,
        depending on your core work, with the others as secondary. Then make the name, phone, service area and
        license identical on the state board record, your site, Google, Houzz, the Better Business Bureau and
        your local builders&apos; association listing. Inconsistent records are the most common reason an
        assistant hedges on a firm it otherwise has good evidence for; the mechanics are in{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings and NAP citations</Link>.
      </p>

      <h2>Which reviews actually matter for a contractor recommendation?</h2>
      <p>
        Reviews that name the project type, the town, the timeline and how problems were handled, and that are
        readable as text on your own site as well as on Google. An assistant answering &quot;who should I trust
        with a kitchen remodel in Boise&quot; is looking for evidence that you have done kitchen remodels in Boise
        and that the client would do it again. Thirty five-star reviews that say &quot;great job&quot; prove less
        than ten that say what the job was.
      </p>
      <p>
        Ask for reviews at the final walk-through, suggest the client mention the project and the town, and
        republish a selection as text on the matching project page with the client&apos;s permission. Respond to
        every review, especially the critical ones, because the response is part of the record an engine reads.
        The fuller playbook is in <Link href="/blog/google-reviews-ai-visibility">why your Google reviews decide your AI visibility</Link>.
      </p>

      <h2>How should remodelers handle project galleries and case studies?</h2>
      <p>
        Turn each gallery entry into a short written case study, because a photo without text is invisible to a
        retrieval system and a case study is exactly the evidence it wants. For each project: the town, the
        project type, the scope, the duration, the approximate budget band, the one problem that came up and how
        it was solved, and a line from the client. Six of these do more than two hundred captioned photos.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>What most contractor sites publish</th>
              <th>What an assistant can use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Photo gallery with no captions</td>
              <td>Case study: town, scope, duration, budget band, outcome</td>
            </tr>
            <tr>
              <td>&quot;Licensed and insured&quot; badge image</td>
              <td>License number and class in text, matching the state board</td>
            </tr>
            <tr>
              <td>&quot;Serving the greater metro area&quot;</td>
              <td>Named list of cities and counties, matching Google</td>
            </tr>
            <tr>
              <td>&quot;Request a free quote&quot;</td>
              <td>Price range per project type with the factors that move it</td>
            </tr>
            <tr>
              <td>Review widget loaded by script</td>
              <td>Review text on the page, with project and town named</td>
            </tr>
            <tr>
              <td>One page listing every service</td>
              <td>One page per project type answering cost, time and permits</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Does the answer change for design-build, commercial or specialty trades?</h2>
      <p>
        The mechanism is identical and the facts differ. Design-build firms should state that design is included
        and how the fee works, because &quot;do I need an architect first&quot; is one of the most common homeowner
        questions. Commercial contractors should publish project size bands, delivery methods and bonding capacity,
        since those are what a facilities manager asks an assistant. Specialty trades have their own pages:{" "}
        <Link href="/blog/how-roofing-contractors-get-recommended-by-ai">roofing contractors</Link>,{" "}
        <Link href="/blog/how-hvac-plumbing-companies-get-recommended-by-ai">HVAC and plumbing companies</Link> and{" "}
        <Link href="/blog/how-electricians-get-recommended-by-ai">electricians</Link>. A general contractor who
        subcontracts those trades should say so and name the licensed partners where allowed; it is a trust
        signal, not a weakness.
      </p>

      <h2>What should a general contractor do in the first week?</h2>
      <p>
        Check what the assistants currently say, fix the license and service-area facts, and write one project
        page properly. In order:
      </p>
      <ol>
        <li>
          Ask ChatGPT, Gemini, Claude and Perplexity &quot;who is a good general contractor for a kitchen remodel
          in [your city]&quot; and note who is named and what evidence is cited.
        </li>
        <li>
          Put your license number, class and board on your site in text, and confirm it matches the board record
          and your Google Business Profile name.
        </li>
        <li>
          Fix the Google profile: service-area setup, hidden address, primary category, named service area.
        </li>
        <li>
          Rewrite your highest-volume project page with a price range, timeline, permit note and two written case
          studies.
        </li>
        <li>
          Add <code>GeneralContractor</code> structured data with the recommended properties.
        </li>
        <li>
          Ask the last five finished clients for a review that names the project and the town.
        </li>
      </ol>
      <p>
        If you would rather have this checked and written for you, Alphaa runs a 23-point check on what the
        assistants can read on your site, asks the four engines about you weekly, drafts the pages and structured
        data, and publishes once you approve, through <Link href="/integrations">WordPress, Shopify or Webflow</Link>{" "}
        or by sending the change to your web person. Start with the{" "}
        <Link href="/start">free 60-second check</Link> to see who the assistants name in your area today.
      </p>

      <h2>What else do general contractors ask about AI search?</h2>

      <h3>Will publishing price ranges scare off homeowners or help competitors?</h3>
      <p>
        In our experience it does the opposite: a range qualifies leads before the first call and gives an
        assistant something to quote, while competitors already know roughly what you charge. Publish ranges with
        the drivers, not fixed prices.
      </p>

      <h3>Do assistants recommend Angi, Houzz and Thumbtack over local contractors?</h3>
      <p>
        Often, when no local firm is verifiable, because the marketplaces publish structured, consistent data about
        thousands of contractors. A local firm with a matching license record, named project pages and readable
        reviews is competing on the same terms and frequently gets named alongside or instead of them.
      </p>

      <h3>Does my license number really need to be in text?</h3>
      <p>
        Yes. Text in the HTML is what a crawler reads and cross-checks; a badge image or a PDF certificate is
        usually not. Many states also require the number on advertising, so the text version satisfies both.
      </p>

      <h3>Is a Houzz or BBB profile necessary to get recommended?</h3>
      <p>
        Not necessary, but useful as corroboration: assistants weigh consistent details across independent
        records, and those profiles are records they already read. Keep the name, phone and service area
        identical to your site and license.
      </p>

      <h3>How long does it take for AI to start recommending a contractor?</h3>
      <p>
        Weeks rather than days, because the engines must recrawl your pages and the corroborating records, and
        nobody can promise a result. The honest timeline is in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>
    </div>
  )
}
