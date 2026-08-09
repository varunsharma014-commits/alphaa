import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-wedding-vendors-get-recommended-by-ai",
  title: "How Wedding Venues, Photographers and Planners Get Recommended by AI",
  description:
    "Couples now ask ChatGPT for shortlists before they open The Knot. AI assistants answer from marketplace profiles, capacity and pricing facts, and real reviews — here is how wedding vendors become the named recommendation.",
  date: "2026-08-09",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of local businesses, including
          venues and event vendors. Last updated 9 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Wedding vendors get recommended by AI when the four facts every couple
        filters on — <em>date availability, capacity, price basis and style</em> — exist as plain retrievable
        text and agree across your site, your marketplace profiles and your Google Business Profile. This
        category loses more AI recommendations to hidden pricing than to anything else. &quot;Contact us for
        pricing&quot; is not a negotiating position to an assistant; it is a missing field, and the vendor who
        published a starting number gets named instead.
      </p>

      <h2>What couples actually ask</h2>
      <p>
        Wedding queries are unusually constraint-dense, because planning is a filtering exercise from day one.
        Real question shapes look like this:
      </p>
      <ul>
        <li>&quot;outdoor wedding venues near Asheville for 120 guests under $10,000&quot;</li>
        <li>&quot;barn venues within an hour of Austin that allow outside catering&quot;</li>
        <li>&quot;documentary style wedding photographers in Chicago, two shooters, around $4,500&quot;</li>
        <li>&quot;wedding planners who do full-service coordination for destination weddings in Portugal&quot;</li>
        <li>&quot;venues with an indoor rain backup for October in the Hudson Valley&quot;</li>
      </ul>
      <p>
        Every one of those is a filter set: location radius, guest count, budget ceiling, style, and a policy or
        logistics constraint. An assistant can only name you if it can confirm enough of those filters from text
        it retrieved. A gallery-first site with a splash video, a contact form and no numbers matches none of
        them — which is why some of the most beautiful portfolios in a market are invisible in AI answers.
      </p>

      <h2>Where the answer comes from in this category</h2>
      <p>
        When an assistant answers a wedding query it synthesizes from retrieved documents, and the retrievable
        set here is marketplace-heavy:
      </p>
      <ul>
        <li>
          <strong>Wedding marketplaces.</strong> The Knot, WeddingWire, Zola, Hitched and regional equivalents.
          These are structured, filterable, heavily crawled, and they publish the exact fields the question asks
          about — capacity, price range, amenities, catering policy. Most named recommendations start here.
        </li>
        <li>
          <strong>Google Business Profile and Maps.</strong> Category, service area, hours, photos and the
          review corpus. This is the local-intent backbone, covered in{" "}
          <Link href="/blog/google-business-profile-ai-answers">how GBP feeds AI answers</Link>.
        </li>
        <li>
          <strong>Reviews, everywhere.</strong> Weddings are a one-shot, high-anxiety purchase, so review text
          is weighted heavily and read for <em>content</em>, not just star count. Reviews that mention rain
          plans, vendor coordination or timeline management are answering the constraint in the query.
        </li>
        <li>
          <strong>Editorial features and real-wedding blogs.</strong> Being featured on a wedding publication or
          a photographer&apos;s real-wedding post creates third-party mentions that tie your venue name to a
          style, a season and a guest count — genuinely useful corroboration.
        </li>
        <li>
          <strong>Your own site.</strong> Where the specifics live, and where an engine verifies the marketplace
          picture holds up. It rarely originates the shortlist on its own.
        </li>
      </ul>

      <h2>The five fixes, in order of leverage</h2>

      <h3>1. Publish a real price basis</h3>
      <p>
        You do not have to publish a full price list, and for custom work you should not pretend to. Publish the
        <em> basis</em>: &quot;Saturday receptions May–October start at $9,800 for up to 150 guests, including
        eight hours of venue access, tables, chairs and an on-site coordinator; Friday and Sunday from $6,400;
        off-season from $4,900.&quot; That single sentence answers budget, capacity, season, day-of-week and
        what is included — five filters at once, in a form an assistant can quote. Vendors who withhold it are
        not protecting margin; they are opting out of the shortlist. This is the dynamic we cover in{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">how pricing pages shape AI recommendations</Link>.
      </p>

      <h3>2. State capacity and logistics as numbers, not adjectives</h3>
      <p>
        Replace &quot;intimate&quot; and &quot;grand&quot; with figures: seated capacity, standing capacity,
        ceremony capacity, parking spaces, on-site accommodation beds, noise curfew time, load-in access,
        wheelchair access, and whether there is a covered indoor backup for how many people. Add the policies
        couples screen on early — outside catering permitted or not, approved vendor list or open, alcohol and
        corkage rules, candle and confetti restrictions, pet policy. Each is a common query constraint and each
        one you leave unstated is a question you lose by default.
      </p>

      <h3>3. Name your style in words, not only in photographs</h3>
      <p>
        Style is the single most-used filter and the one this industry communicates almost entirely visually.
        Models retrieve text. Write the style out: documentary and unposed rather than editorial and directed;
        warm film-toned rather than bright and airy; restored 1890s barn with original timber and string
        lighting rather than &quot;rustic elegance.&quot; Then use it consistently on your site, your
        marketplace profiles and your image alt text. Alt text is real content here — it is often the only text
        attached to a portfolio page.
      </p>

      <h3>4. Make availability legible</h3>
      <p>
        Dates are the hardest constraint in the category and the one vendors handle worst. You will not get a
        live calendar into a model&apos;s answer, but you can publish the shape of it: which seasons you book,
        typical lead time, how many weddings you take per year or per weekend, and which dates remain in the
        current booking year with a date-stamped note. A line like &quot;as of 9 August 2026, four Saturdays
        remain in the 2027 season&quot; is retrievable, honest, and creates the freshness signal explained in{" "}
        <Link href="/blog/content-freshness-ai-search">content freshness and AI search</Link>. Update it or
        remove it — a stale availability claim is worse than none.
      </p>

      <h3>5. Complete every marketplace field, including the dull ones</h3>
      <p>
        Most vendors write a lovely marketplace bio and leave half the checkboxes empty. Those checkboxes —
        price tier, guest-count range, venue type, amenities, catering policy, service area radius — are the
        structured data a retrieval step matches against a constrained query. A complete profile with an average
        bio beats a beautiful bio with blank fields, consistently. And make the checkable facts identical to
        your website: one business name spelling, one phone number, one address, one capacity figure.
      </p>

      <h2>Schema worth adding</h2>
      <p>
        For a venue, mark up the location as <code>LocalBusiness</code> (or <code>EventVenue</code>) with{" "}
        <code>address</code>, <code>geo</code>, <code>maximumAttendeeCapacity</code>,{" "}
        <code>amenityFeature</code> and <code>priceRange</code>. For photographers and planners, use{" "}
        <code>ProfessionalService</code> with <code>areaServed</code> and <code>makesOffer</code> pointing at
        your packages. Add <code>FAQPage</code> markup to a genuine FAQ that answers the policy questions above.
        Only mark up facts that are visibly on the page — invented capacity numbers or a{" "}
        <code>priceRange</code> that contradicts your packages does damage. The full pattern is in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h2>What not to do</h2>
      <p>
        Do not buy or solicit incentivised reviews — marketplaces police it, and reviews are read for content in
        this category, so a wall of generic five-star text is worth less than a dozen specific ones. Do not list
        a capacity you cannot legally seat or an amenity you do not have; the first venue tour ends the booking
        and the review that follows is public and permanent. Do not publish a starting price you will never
        honour to get onto shortlists. And be wary of anyone promising a guaranteed spot in ChatGPT&apos;s
        answer for your city — answers vary by phrasing, by engine and over time, and nobody controls them.
      </p>

      <h2>Common questions</h2>

      <h3>Do I have to publish exact prices?</h3>
      <p>
        No. A starting figure with what it includes, plus the variables that move it, is enough — and it is more
        useful to a couple than a full price list they cannot interpret. The goal is a quotable basis, not a
        quote.
      </p>

      <h3>My bookings all come from The Knot. Why bother with my own site?</h3>
      <p>
        Because assistants corroborate. The marketplace profile often triggers the mention; your site is where
        the model confirms the facts and finds the detail that separates you from the next listing. If the two
        disagree, you get hedged out of the answer rather than named.
      </p>

      <h3>How long before this shows up in answers?</h3>
      <p>
        Marketplace and GBP corrections can surface within days because those pages are re-retrieved frequently;
        site content and third-party mentions build over weeks to months. Wedding queries are also seasonal, so
        do the work well before your enquiry season rather than during it. The honest limits are set out in{" "}
        <Link href="/blog/is-aeo-real">is AEO real</Link>.
      </p>

      <h2>The bottom line</h2>
      <p>
        Wedding vendors lose AI recommendations to withheld information, not to competition. Couples ask in
        numbers — guests, dollars, dates, miles — and assistants can only answer with the numbers they can find.
        Publish your capacity, your price basis, your policies and your style in plain sentences, make every
        profile agree, and you become answerable. That is also, not coincidentally, what makes an enquiry
        arrive already qualified.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
