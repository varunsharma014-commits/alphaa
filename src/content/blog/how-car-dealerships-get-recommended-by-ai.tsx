import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-car-dealerships-get-recommended-by-ai",
  title: "How Car Dealerships Get Recommended by AI",
  description:
    "AI assistants recommend dealerships whose website states the actual out-the-door pricing policy, live inventory in crawlable text, financing terms and service-department specifics — corroborated by reviews and marketplace listings. Here is the playbook, including the VDP problem almost every dealer has.",
  date: "2026-08-25",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, franchise and
          independent car dealerships among them. Last updated 25 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend the dealerships whose site publishes{" "}
        <strong>real inventory in crawlable text, an explicit pricing and fee policy, named financing options
        including subprime and first-time-buyer terms, and specific service-department capabilities</strong> —
        all corroborated by Google reviews, marketplace listings and the manufacturer&apos;s own dealer locator.
        The obstacle is structural: most dealership websites hide their entire inventory behind a JavaScript
        search widget, so the assistant sees a homepage of stock photography and nothing else. Fix the
        crawlability problem and you are ahead of most of your market, because your competitors have not.
      </p>

      <h2>What car buyers actually ask an assistant</h2>
      <p>
        Buyers no longer start on your website. They start with a question they would have been embarrassed to
        ask a salesperson, and they ask it in full sentences:
      </p>
      <ul>
        <li>&quot;Which dealers near [city] will give me an out-the-door price over email without making me come in?&quot;</li>
        <li>&quot;I have a 580 credit score and $2,000 down — which dealerships in [metro] actually work with that?&quot;</li>
        <li>&quot;Where can I find a used [model] under $18,000 with under 60,000 miles within 50 miles of [zip]?&quot;</li>
        <li>&quot;Do any dealers near me not charge dealer prep or market adjustment fees?&quot;</li>
        <li>&quot;Which [brand] dealer in [city] has a service department that can do warranty work on an EV battery?&quot;</li>
        <li>&quot;Is [dealership] trustworthy? What do reviews say about their finance office?&quot;</li>
      </ul>
      <p>
        Every one of those is a filter, not a keyword. Credit tier. Fee policy. Mileage ceiling. Certification.
        Service capability. The assistant answers by retrieving passages that satisfy the filter and then naming
        businesses it can verify. If your site never states a fact in text, you cannot be matched on it — and in
        a category this crowded, an unmatched dealer is simply not mentioned.
      </p>

      <h2>The VDP problem: your inventory is invisible</h2>
      <p>
        This is the single biggest technical issue in the category. A vehicle detail page (VDP) on a typical
        dealer platform is generated client-side: the page shell loads, then JavaScript calls an inventory API,
        then the year, make, model, trim, mileage, VIN and price appear in the browser. A human sees a full
        listing. A crawler that does not execute JavaScript sees an empty container.
      </p>
      <p>
        This matters more for AI answers than it did for classic search. Google has rendered JavaScript for years.
        Several AI crawlers do not, or do so inconsistently, and an assistant answering live will typically fetch a
        page, read what comes back in the HTML, and move on. We cover the general mechanism in{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">how JavaScript rendering affects AI crawlers</Link>.
        For a dealership the consequence is specific and expensive: the inventory that makes you worth
        recommending is the exact part of your site machines cannot read.
      </p>
      <p>How to check yours in two minutes, without any tooling beyond a terminal:</p>
      <ol>
        <li>Open a VDP for a car you have in stock and copy the URL.</li>
        <li>
          Run <code>curl -s &quot;YOUR_VDP_URL&quot; | grep -i &quot;VIN_OF_THAT_CAR&quot;</code> in a terminal.
        </li>
        <li>
          If the VIN, price and mileage come back, your listings are server-rendered and readable. If nothing comes
          back, everything a buyer would filter on is invisible to any crawler that does not run scripts.
        </li>
      </ol>
      <p>
        The fix is a platform conversation, not a content one. Ask your website vendor for server-side rendered
        VDPs, or at minimum a static, crawlable inventory index that lists every vehicle in plain HTML with its
        year, make, model, trim, mileage, VIN, stock number and price. Most major dealer platforms can enable this;
        it is usually a setting nobody has asked them to turn on.
      </p>

      <h2>Add Vehicle and Offer schema — and keep it truthful</h2>
      <p>
        Structured data does not make an assistant recommend you, but it does make your facts unambiguous. Two
        types matter here: <code>Vehicle</code> (with <code>vehicleIdentificationNumber</code>,{" "}
        <code>mileageFromOdometer</code>, <code>vehicleTransmission</code>, <code>bodyType</code>,{" "}
        <code>modelDate</code>) and <code>Offer</code> (with <code>price</code>, <code>priceCurrency</code>,{" "}
        <code>availability</code>, <code>priceValidUntil</code>). Add <code>AutoDealer</code> markup on the
        homepage with your address, phone, opening hours and — if you are a franchise — the brands you sell.
      </p>
      <p>
        One caveat worth taking seriously: schema that disagrees with the visible page is worse than no schema. If
        your markup says $21,995 and the page says &quot;call for price,&quot; you have taught every system reading
        you that your data cannot be trusted. Sold vehicles left marked <code>InStock</code> cause the same damage
        at scale. Our broader guidance is in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h2>Publish the page that decides trust: your fee and pricing policy</h2>
      <p>
        Ask any assistant which dealers are transparent about pricing and watch what it does — it looks for a page
        that says so in words. Almost no dealership has one. Write it, put it at a stable URL, and be specific:
      </p>
      <ul>
        <li>Whether the advertised price is the price before tax, title, and registration.</li>
        <li>Your documentation fee, as a number, and whether your state caps it.</li>
        <li>Whether you add market adjustments, dealer prep, nitrogen, or reconditioning fees — and if so, when.</li>
        <li>Whether accessory or protection packages are pre-installed and non-negotiable.</li>
        <li>Whether you will send an out-the-door quote by email before a visit.</li>
      </ul>
      <p>
        This page does two jobs. It is the passage an assistant can lift verbatim when a buyer asks about hidden
        fees, and it is a commitment that shows up in reviews when you honour it. If your answer to some of those
        is unflattering, say the true thing anyway — a stated $799 doc fee beats an unstated one, because the
        alternative is being unverifiable rather than being cheap.
      </p>

      <h2>Financing pages that answer real credit questions</h2>
      <p>
        &quot;Bad credit? No problem!&quot; is unusable to a language model — it contains no fact to match against.
        A credit-challenged buyer&apos;s question has parameters, so your page should too: which score bands your
        lenders work with, minimum down payment, whether you have buy-here-pay-here financing, whether you accept
        ITIN applicants, typical term lengths, and what documents a first-time buyer should bring. Write it as
        plain prose under a question-shaped heading, and avoid the two failure modes: gating the information behind
        a credit application form, and publishing a payment calculator instead of an explanation.
      </p>

      <h2>Your service department is a second business — treat it that way</h2>
      <p>
        Service queries are high-frequency, local, and far less contested than sales queries. &quot;Who can do a
        transmission service on a [model] near me,&quot; &quot;which shop is certified for EV high-voltage
        work,&quot; &quot;does anyone near [city] have loaner cars.&quot; Give service its own crawlable pages
        stating the makes you service, whether you service vehicles you did not sell, certifications held (including
        EV and hybrid), loaner and shuttle availability, hours including Saturdays, and whether you do recall and
        warranty work. This is the cheapest visibility in the category.
      </p>

      <h2>The off-site half: where AI checks you</h2>
      <p>
        Your website establishes claims; other sources verify them. For dealerships the corroborating set is
        unusually well-defined:
      </p>
      <ul>
        <li>
          <strong>Google Business Profile</strong> — separate profiles for sales and service if they have separate
          hours, with categories set correctly. See{" "}
          <Link href="/blog/google-business-profile-ai-answers">how your Google Business Profile feeds AI answers</Link>.
        </li>
        <li>
          <strong>Marketplaces</strong> — Cars.com, CarGurus, Autotrader, Carfax listings. These rank well, are
          heavily retrieved, and repeat your inventory and pricing in crawlable text.
        </li>
        <li>
          <strong>The manufacturer&apos;s dealer locator</strong> — an authoritative entity record for franchise
          stores. Make sure your name, address and phone match your site exactly.
        </li>
        <li>
          <strong>Reviews</strong> — volume and recency both matter, and finance-office complaints are the pattern
          assistants surface most in this category. <Link href="/blog/google-reviews-ai-visibility">Why reviews now shape AI visibility</Link>.
        </li>
      </ul>
      <p>
        Consistency across those sources is the whole game. &quot;Riverside Ford&quot; on your site,
        &quot;Riverside Ford Lincoln&quot; on the locator and &quot;Riverside Auto Group — Ford&quot; on Cars.com
        splits one dealership into three weakly-attested entities.
      </p>

      <h2>Questions dealers ask</h2>
      <h3>Should we publish prices if our competitors do not?</h3>
      <p>
        For AI visibility, yes — an assistant cannot recommend a price it cannot read, and &quot;call for
        price&quot; removes you from every budget-filtered question. Whether that is right for your gross strategy
        is your call, not ours.
      </p>
      <h3>Does our inventory feed to marketplaces cover us?</h3>
      <p>
        Partially. It gets your vehicles into sources assistants retrieve, which is genuinely valuable, but the
        answer then names the marketplace as the destination. Your own crawlable inventory is what gets your
        dealership named.
      </p>
      <h3>How fast does this work?</h3>
      <p>
        Technical fixes such as server-rendered VDPs can be picked up within days to weeks as pages are recrawled.
        Reputation and corroboration signals move over months. Nobody can guarantee you a mention in any specific
        answer, and answers vary between engines and between phrasings of the same question — see{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>

      <h2>The bottom line</h2>
      <p>
        Dealership AI visibility is unusually winnable because the category&apos;s biggest problem is technical
        rather than competitive. Make your inventory readable without JavaScript, state your fees in words, answer
        credit questions with numbers, give service its own pages, and keep your name and address identical
        everywhere. That is a short list, and most of your market has done none of it.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
