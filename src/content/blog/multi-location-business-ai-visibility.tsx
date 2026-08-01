import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "multi-location-business-ai-visibility",
  title: "How Multi-Location Businesses Get Recommended by AI",
  description:
    "AI assistants recommend a specific branch, not a brand. Multi-location businesses lose because their locations are interchangeable to a model — same page template, same copy, no distinguishing facts. Here's how to make each location its own retrievable entity.",
  date: "2026-08-01",
  readMins: 10,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including chains,
          franchises and multi-branch practices. Last updated 1 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants almost never recommend a brand — they recommend a specific
        branch that can serve the person asking. Multi-location businesses lose because their location pages are
        template clones with the city name swapped in, which gives a retrieval system nothing to tell branch
        seven apart from branch two. The fix is to make every location a distinct, fully described entity: its
        own page with its own facts, its own claimed profile, its own reviews, and its own schema — all
        consistent with the parent brand but not identical to each other.
      </p>

      <h2>Why multi-location is a different problem</h2>
      <p>
        A single-location business has one job: be describable. A ten-location business has that job ten times
        over, plus a new one — <strong>disambiguation</strong>. When someone asks &quot;physical therapy clinic
        in Round Rock that takes Medicare,&quot; the engine has to decide not only whether your brand is
        relevant but <em>which</em> of your ten clinics to name, with what address, hours and phone number. If
        your locations are indistinguishable in the source material, the model does one of three unhelpful
        things:
      </p>
      <ul>
        <li>
          <strong>It names the brand vaguely</strong> — &quot;you could try Meridian Physical Therapy, they
          have several locations&quot; — which is a much weaker recommendation than a named branch with an
          address.
        </li>
        <li>
          <strong>It picks the wrong branch,</strong> usually the flagship or whichever one has the most
          citations, and sends the customer across town.
        </li>
        <li>
          <strong>It blends details across branches,</strong> attaching one location&apos;s hours or phone
          number to another. This is the most damaging outcome and the hardest to notice, because the answer
          looks confident and correct.
        </li>
      </ul>

      <h2>The template trap</h2>
      <p>
        Nearly every multi-location site we scan has the same architecture: one location template, populated
        from a database, producing pages that differ only in the city name, the map embed and the phone number.
        Three hundred words of identical body copy across forty pages.
      </p>
      <p>
        For traditional SEO this was merely thin. For AI search it is worse than thin, because retrieval works
        on semantic similarity. Forty near-identical pages are forty documents competing to be the closest match
        to the same query, and none of them contains a distinguishing fact that would resolve the tie. The
        engine either picks arbitrarily or backs off to the brand level.
      </p>
      <p>
        The rule we use: <strong>every location page needs at least five facts that are true of that location
        and not true of the others.</strong> Not stylistic variation — facts. For example:
      </p>
      <ul>
        <li>Which services or equipment this branch actually has that others do not (the 3T MRI is only at the north clinic)</li>
        <li>Named staff at that location, with their credentials and specialisms</li>
        <li>Parking, transit, and access specifics — which garage, which entrance, whether there is street parking after 6pm</li>
        <li>The neighbourhoods and suburbs this branch genuinely serves, named</li>
        <li>Hours that are actually this branch&apos;s hours, including the Saturday one that differs</li>
        <li>Languages spoken, insurances or payment types accepted, appointment lead time</li>
      </ul>
      <p>
        Every one of those is a sentence a model can lift to answer a real question. &quot;Serving the greater
        metro area with quality care&quot; is not.
      </p>

      <h2>The five-layer checklist for each location</h2>
      <p>
        Run this per branch, not per brand. It is tedious the first time and mostly maintenance afterwards.
      </p>
      <ol>
        <li>
          <strong>A real page with a stable URL.</strong> One indexable page per location at a predictable path
          (<code>/locations/round-rock</code>), linked from a locations index and from the site header or
          footer. Not a modal, not a store-locator that renders results only after a JavaScript fetch — if the
          address only appears after a click, many crawlers never see it. See{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">why AI can&apos;t read your JavaScript website</Link>{" "}
          for how to check whether yours is visible.
        </li>
        <li>
          <strong>Its own LocalBusiness schema.</strong> Each location page gets its own structured data block
          with that branch&apos;s <code>name</code>, <code>address</code>, <code>telephone</code>,{" "}
          <code>openingHoursSpecification</code> and <code>geo</code>, plus a{" "}
          <code>parentOrganization</code> pointing at the brand. Do not put every location into one blob on the
          homepage. Our{" "}
          <Link href="/blog/schema-markup-for-ai-search">practical schema markup guide</Link> has the patterns.
        </li>
        <li>
          <strong>Its own claimed profiles.</strong> A separate Google Business Profile per location is
          non-negotiable, and the same goes for Apple Business Connect, Bing Places and any vertical directory
          in your category. Each profile&apos;s NAP — name, address, phone — must match the location page
          exactly, character for character.
        </li>
        <li>
          <strong>Its own reviews.</strong> Reviews are location-scoped in every major platform, and they are
          the strongest third-party evidence a branch can have. A chain where three branches have 200 reviews
          and seven have four is a chain where AI recommends three branches.
        </li>
        <li>
          <strong>Its own local content, sparingly.</strong> One or two genuinely local pieces per branch — the
          guide to the neighbourhood, the local event you sponsor, the case study from a nearby customer. This
          is not a content-farm quota; two real pages beat twenty spun ones.
        </li>
      </ol>

      <h2>Naming consistency: the boring thing that breaks everything</h2>
      <p>
        Decide, once, how each location is named, and then use that exact string everywhere:{" "}
        <strong>&quot;Meridian Physical Therapy — Round Rock&quot;</strong>. Not &quot;Meridian PT Round
        Rock&quot; on Yelp, &quot;Meridian Physical Therapy of Round Rock&quot; on the website and
        &quot;Meridian Round Rock Clinic&quot; on Facebook. Every variant is a candidate entity a model has to
        try to reconcile, and reconciliation failures are exactly how you end up with the wrong phone number in
        an AI answer. The same discipline applies to suite numbers, street abbreviations and phone formatting.
      </p>
      <p>
        If you are a franchise, this is where the friction lives: franchisees edit their own profiles, add their
        own suffixes, and post their own hours. A short, enforced naming standard in the franchise operations
        manual is worth more to AI visibility than most of the marketing budget above it.
      </p>

      <h2>How to audit this yourself in an afternoon</h2>
      <p>Pick your three most commercially important locations and, for each one:</p>
      <ol>
        <li>
          Ask ChatGPT, Gemini, Claude and Perplexity the question a local customer would ask — the service plus
          the suburb, not the brand name. Record whether a branch is named, and which.
        </li>
        <li>
          Ask directly: &quot;What are the hours and address of [brand] in [suburb]?&quot; This is the fastest
          way to catch cross-branch detail bleed. Check every returned fact against the truth.
        </li>
        <li>
          Open the location page with JavaScript disabled and confirm the address, phone and hours are still in
          the HTML.
        </li>
        <li>
          Search the exact business name string and count how many naming variants come back across profiles and
          directories.
        </li>
      </ol>
      <p>
        Run each prompt three or four times. Answers vary between runs, so one result is an anecdote, not a
        measurement — the reasoning is in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why ChatGPT gives a different answer every time</Link>
        .
      </p>

      <h2>What to expect, honestly</h2>
      <p>
        None of this guarantees that an AI engine will name your branch — nothing does, and any vendor promising
        guaranteed AI placement is selling something that does not exist. What it does is remove the reasons a
        model currently has to hedge, blend or pick a competitor. In our experience the two changes that move
        the needle fastest are the per-location profile cleanup (because it fixes contradictions the engine is
        actively tripping over) and the five-distinguishing-facts rewrite (because it gives retrieval something
        to match). Both take weeks, not days, to show up in answers — profiles have to be re-crawled and
        third-party sources have to catch up.
      </p>
      <p>
        And prioritise. If you have forty locations, do not do all forty at once. Do the five that drive the
        most revenue, verify the pattern works, then roll it out as a template that <em>requires</em> unique
        fields rather than one that permits them.
      </p>

      <h2>Q&amp;A</h2>
      <p>
        <strong>Should each location have its own website?</strong> Almost never. Separate domains split your
        authority and multiply the maintenance. One brand domain with strong, distinct location pages is the
        better structure in nearly every case.
      </p>
      <p>
        <strong>Do I need a Google Business Profile for every location?</strong> Yes, one per physical location
        with a distinct address, each individually verified. It is the single highest-leverage item on this
        list.
      </p>
      <p>
        <strong>What about service-area businesses with no storefront?</strong> Define non-overlapping service
        areas per branch and say so explicitly in the page copy and in schema. Overlapping, vaguely-worded
        service areas are the service-business version of the template trap — the same logic in{" "}
        <Link href="/blog/get-recommended-by-ai-local-service-business">
          our local service business playbook
        </Link>{" "}
        applies per branch.
      </p>
      <p>
        <strong>How many location pages is too many?</strong> There is no page-count limit — there is a
        uniqueness limit. If a page has nothing true and specific to say, it should not exist.
      </p>

      <h2>The bottom line</h2>
      <p>
        For a multi-location business, AI visibility is not a brand problem. It is the same entity problem
        repeated once per branch, and the brands that win are the ones that treat each location as a business
        that has to earn its own description, its own profile and its own reviews.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
