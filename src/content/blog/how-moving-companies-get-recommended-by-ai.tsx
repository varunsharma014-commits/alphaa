import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-moving-companies-get-recommended-by-ai",
  title: "How Moving Companies Get Recommended by AI",
  description:
    "AI assistants recommend movers that publish a verifiable USDOT or state licence number, a specific service radius and move type, and a consistent review record across Google, Yelp and moving directories. Here is the playbook for movers, including the trust problem that decides most of these answers.",
  date: "2026-08-21",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including local and
          long-distance moving companies. Last updated 21 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend moving companies that are{" "}
        <strong>verifiably licensed, unambiguously specific about what kind of move they do and where, and
        corroborated by a recent, consistent review record the mover does not control</strong>. Movers are one
        of the few categories where an assistant will actively hedge — it has been trained on a large body of
        consumer-protection material about rogue movers, so it tends to recommend cautiously and prefers
        businesses whose licence numbers and identity check out. Publishing your USDOT or state licence number
        in machine-readable text is the single highest-leverage thing most movers are missing.
      </p>

      <h2>What do customers actually ask an AI assistant about movers?</h2>
      <p>
        Moving queries arrive far more specific than &quot;best movers near me,&quot; because a move has hard
        constraints — a date, an origin, a destination, a size, and usually one awkward item. In practice they
        look like this:
      </p>
      <ul>
        <li>&quot;Best moving company for a 2 bedroom apartment from Austin to Denver&quot;</li>
        <li>&quot;Who can move a piano in Portland&quot;</li>
        <li>&quot;Licensed interstate movers from New Jersey to Florida that give binding estimates&quot;</li>
        <li>&quot;How do I check if a moving company is legitimate&quot;</li>
        <li>&quot;Cheapest way to move a studio 40 miles, movers or a truck rental&quot;</li>
        <li>&quot;Movers in Chicago that can do a same-week job with a certificate of insurance for my building&quot;</li>
      </ul>
      <p>
        Every one of those contains a <strong>move type, a distance class and usually a constraint</strong> —
        piano, high-rise COI, storage-in-transit, binding estimate, same week. An assistant matches on those
        axes. If your website says you offer &quot;residential and commercial moving services with
        professional, reliable service,&quot; you match none of them, because there is nothing there to match
        against. This is the same specificity problem we describe for other service categories in{" "}
        <Link href="/blog/get-recommended-by-ai-local-service-business">
          getting recommended by AI as a local service business
        </Link>
        , and it is more acute for movers because the constraint <em>is</em> the query.
      </p>

      <h2>Why movers face a trust filter other verticals do not</h2>
      <p>
        Ask an assistant to recommend a dentist and it will usually just recommend one. Ask it to recommend an
        interstate mover and it will often lead with a warning: check the USDOT number, get it in writing,
        avoid large deposits, beware of estimates given without an inventory.
      </p>
      <p>
        That is not the model being unhelpful. Moving fraud is a well-documented consumer-protection topic —
        the U.S. Federal Motor Carrier Safety Administration runs a public campaign and complaint database on
        it at{" "}
        <a href="https://www.fmcsa.dot.gov/protect-your-move" rel="nofollow">
          Protect Your Move
        </a>
        , and the Better Business Bureau publishes moving-scam guidance every year. A model trained on that
        corpus has learned that the correct shape of an answer about movers includes a verification step.
      </p>
      <p>
        The practical consequence for you: <strong>the answer has a checklist embedded in it, and you either
        satisfy the checklist in public or you get filtered out of the recommendation.</strong> The movers that
        get named are the ones whose licence, insurance and identity are trivially confirmable from the text
        the assistant retrieved. Everything below follows from that.
      </p>

      <h2>The five signals that decide whether a mover gets named</h2>

      <h3>1. A licence number in crawlable text, on the page</h3>
      <p>
        Put your <strong>USDOT number and MC number</strong> (for interstate) and your{" "}
        <strong>state household-goods licence number</strong> (for intrastate — CAL-T in California, HHG in
        Florida, DOT numbers vary by state) as plain text in your site footer and on your About page. Not in a
        logo image, not in a PDF, not only in the footer of an emailed estimate.
      </p>
      <p>
        Two reasons this matters more than it looks. First, an assistant extracting an answer can only quote
        text it actually parsed — a licence number rendered inside a badge graphic is invisible to it, as we
        explain in{" "}
        <Link href="/blog/do-ai-engines-read-pdfs-images">whether AI engines read PDFs and images</Link>.
        Second, that number is an <strong>entity anchor</strong>: it is a globally unique string tied to your
        company in a public federal register, which is exactly the kind of identifier that helps an engine
        resolve &quot;Smith Moving&quot; in your city from the eleven other Smith Movings in the country. See{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          entity SEO and how AI identifies your business
        </Link>{" "}
        for why unique identifiers punch above their weight.
      </p>
      <p>
        Write it exactly as it appears in the federal record: <em>USDOT 1234567 · MC 987654</em>. Consistent
        formatting across your site, your Google Business Profile description and your directory listings
        makes the match unambiguous.
      </p>

      <h3>2. Distance class and service radius stated in words</h3>
      <p>
        &quot;Local, long distance and interstate&quot; is three categories with three different regulators,
        three different pricing models and three different customer questions. Say which ones you do, and name
        the geography in the way a customer would say it:
      </p>
      <ul>
        <li>
          <strong>Local:</strong> the counties or metro you actually serve, plus the hourly-rate model and
          minimum. &quot;Local moves within 50 miles of Mesa, billed hourly with a three-hour minimum.&quot;
        </li>
        <li>
          <strong>Long distance / interstate:</strong> the corridors you run regularly. &quot;Arizona to
          Texas, Colorado and Nevada&quot; is retrievable. &quot;Nationwide&quot; is not — it matches nothing
          specific and reads as filler.
        </li>
        <li>
          <strong>What you do not do.</strong> Stating &quot;we do not handle vehicle transport or
          international shipping&quot; is a trust signal and, counter-intuitively, improves matching, because
          it sharpens the entity rather than blurring it.
        </li>
      </ul>

      <h3>3. Specialty items and building constraints, named literally</h3>
      <p>
        The awkward item is usually why someone asks an assistant instead of clicking an ad. Pianos, gun
        safes, pool tables, hot tubs, aquariums, art, laboratory and medical equipment, server racks,
        third-floor walk-ups, high-rise buildings requiring a certificate of insurance, elevator reservations,
        shuttle service for streets a 53-footer cannot enter, storage-in-transit.
      </p>
      <p>
        Each of those is a page or a clearly headed section, not a bullet in a list of twenty. If you move
        pianos, a page titled &quot;Piano moving in [your city]&quot; that explains the process, the equipment,
        what you charge for stairs and how you handle a spinet versus a baby grand is a genuinely useful page
        for a human and an extractable one for a model. That is the pattern in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI engines will quote</Link>.
      </p>

      <h3>4. Estimate type and pricing transparency</h3>
      <p>
        Binding, non-binding, and binding-not-to-exceed are the three estimate types customers are told to ask
        about, and most movers never mention which they offer. Saying so in text — along with your deposit
        policy, your cancellation window, and whether you charge for stairs, long carries and shuttle — puts
        you on the right side of the checklist the assistant is running. Pricing pages are one of the more
        reliably cited page types in this category; the mechanics are in{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link>.
      </p>
      <p>
        You do not have to publish a full rate card. A range plus the variables that move it (&quot;most
        two-bedroom local moves run $900–$1,600 depending on stairs, access and packing&quot;) is more useful
        and more quotable than either a hidden price or a fake-precise one.
      </p>

      <h3>5. A recent, consistent review record you did not write</h3>
      <p>
        Movers live and die by reviews more than almost any local category, and AI answers reflect that.
        Recency matters as much as volume: a company with 400 reviews whose last one is from 2024 reads as
        dormant, while 60 reviews spread evenly across the last twelve months reads as an operating business.
        The mechanism is unpacked in{" "}
        <Link href="/blog/google-reviews-ai-visibility">
          why your Google reviews now decide your AI visibility
        </Link>
        .
      </p>
      <p>
        For movers specifically, spread matters too. Google, Yelp, the BBB profile and the moving-specific
        directories are all in play, and a wildly different picture across them — 4.9 on Google, 2.1 on the
        BBB — is a contradiction that suppresses recommendation rather than averaging out.
      </p>

      <h2>A worked example: what a scan usually finds</h2>
      <p>
        A typical mid-size local mover we scan looks like this. The site has a hero image reading &quot;Fully
        licensed and insured,&quot; a services page listing residential, commercial, packing and storage, a
        contact form, and no licence number anywhere in the HTML. Google Business Profile is claimed but the
        category is set to &quot;Mover&quot; with no secondary categories and no service-area list. There are
        180 Google reviews, 140 of them from a two-month push in 2025. Yelp shows a different phone number
        from a previous answering service.
      </p>
      <p>Ask four assistants &quot;best movers in [city]&quot; and the pattern is consistent:</p>
      <ul>
        <li>The business does not appear in any of the four answers.</li>
        <li>
          Three of the four recommend the same two or three national booking platforms and aggregators, not
          local companies — because those pages contain the comparison structure the model wants.
        </li>
        <li>
          Asked directly, &quot;tell me about [business name],&quot; two assistants describe it with the old
          phone number, and one confuses it with a similarly named company two states away.
        </li>
      </ul>
      <p>
        None of that is a content problem. It is an identity and verification problem, and it is why the fix
        order below starts where it does. If assistants are getting your basic facts wrong, start with{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">
          fixing wrong AI information about your business
        </Link>{" "}
        before you write anything new.
      </p>

      <h2>The 30-day fix order for a moving company</h2>
      <ol>
        <li>
          <strong>Week 1 — identity.</strong> Licence numbers as text in the footer and About page. One phone
          number and one address everywhere. Fix the Yelp and directory records that disagree. Claim and
          complete Google Business Profile with primary and secondary categories and an explicit service-area
          list.
        </li>
        <li>
          <strong>Week 2 — structured data.</strong> Add <em>MovingCompany</em> schema (a recognised
          schema.org subtype of LocalBusiness) with your address, phone, service area, hours and the same
          licence identifiers. The how-to is in{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
        </li>
        <li>
          <strong>Week 3 — the specific pages.</strong> One page per specialty item you genuinely do, one page
          per major corridor you genuinely run, and a pricing page with ranges and variables. Four good pages
          beat forty thin ones.
        </li>
        <li>
          <strong>Week 4 — reviews and re-check.</strong> Start a per-job review request that runs forever,
          not a campaign. Then re-run the same assistant queries from week 1 and compare. Expect movement in
          weeks, not days — the realistic curve is in{" "}
          <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
        </li>
      </ol>

      <h2>Common questions</h2>
      <h3>Do the moving aggregator and lead-broker sites help or hurt?</h3>
      <p>
        Both. A listing on a large moving directory is a corroborating third-party mention and worth having.
        But those platforms also compete with you directly in AI answers, and they often win, because their
        pages are built as comparisons. The counter is to be the specific answer they are not: the mover that
        handles pianos in your city, on a page that says so. Being present in third-party lists is covered in{" "}
        <Link href="/blog/get-into-ai-best-of-lists">getting into AI best-of lists</Link>.
      </p>
      <h3>My licence is in good standing but AI still warns people about movers. Can I stop that?</h3>
      <p>
        No, and you should not try. The caution is generic to the category and it is not aimed at you. What
        you can do is satisfy it — when the assistant says &quot;check the USDOT number,&quot; the mover whose
        USDOT number is right there in the retrieved text is the one that survives the check.
      </p>
      <h3>Should I create a landing page for every city I serve?</h3>
      <p>
        Only for places where you genuinely operate and can say something true and specific — crews based
        there, corridors you run weekly, building or permit rules you actually know. Mass-produced city pages
        that differ only by a swapped place name are a well-known low-quality pattern and tend to dilute your
        entity rather than extend it.
      </p>
      <h3>Can I pay ChatGPT or Perplexity to recommend my moving company?</h3>
      <p>
        No. There is nothing to buy that changes an organic recommendation. Paid placements inside AI products
        exist and are separate from it — see{" "}
        <Link href="/blog/do-paid-ads-affect-ai-recommendations">
          does paid advertising affect AI recommendations
        </Link>
        . Anyone guaranteeing you a spot in an AI answer is selling something they cannot deliver.
      </p>
      <h3>How much of this can I do myself?</h3>
      <p>
        Most of it. The licence numbers, the profile cleanup, the review habit and three specific pages are
        free and are the bulk of the result. A developer is only needed if your site renders content
        client-side, which can leave crawlers seeing an empty page.
      </p>

      <h2>The honest limits</h2>
      <p>
        None of this guarantees a recommendation. AI answers are generated per query and vary between runs,
        even for the same question asked twice — the reasons are in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>. What you
        control is the input: whether a model that goes looking for a licensed, specific, well-reviewed mover
        in your city finds an unambiguous record of one. Movers who fix identity and specificity move from
        &quot;not mentioned&quot; to &quot;sometimes mentioned&quot; far more often than they move to
        &quot;always first,&quot; and sometimes-mentioned in a category where the alternative is a lead broker
        is worth real money.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
