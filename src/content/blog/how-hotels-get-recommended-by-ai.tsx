import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-hotels-get-recommended-by-ai",
  title: "How Hotels, B&Bs and Short-Term Rentals Get Recommended by AI",
  description:
    "Travellers now plan trips by asking an AI assistant, and the assistant answers from booking sites, review platforms and travel guides rather than your own website. Here is how hospitality properties get named in those answers, and the specificity problem that keeps most of them out.",
  date: "2026-08-06",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of local businesses, including
          hospitality properties competing against booking platforms. Last updated 6 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Hotels get recommended by AI when a property is described in specific,
        matchable terms across the sources assistants actually read — booking platforms, review sites, travel
        guides and local roundups — rather than on the hotel&apos;s own site. Ask an assistant &quot;where should
        I stay in Bath with a dog and free parking&quot; and it answers from those third-party descriptions. If
        your listing says &quot;charming boutique hotel in the heart of the city,&quot; you are unmatchable. If it
        says &quot;dog-friendly, on-site parking, 8 minutes&apos; walk from the Roman Baths,&quot; you are a
        candidate.
      </p>

      <h2>Why hospitality is a harder case than other local businesses</h2>
      <p>
        Three structural things make this vertical different, and they are worth naming before any tactics.
      </p>
      <p>
        <strong>The intermediaries own the descriptions.</strong> For a plumber, the most detailed public
        description of the business is usually its own website. For a hotel, it is an online travel agency listing
        the hotel did not write and only partly controls. Assistants retrieve those listings heavily because they
        are structured, complete and comparable. Your beautifully written homepage is competing with a
        machine-readable amenity table.
      </p>
      <p>
        <strong>The queries are unusually constrained.</strong> Nobody asks &quot;good hotel.&quot; They ask for a
        city, dates, a budget band, and two or three hard constraints: dogs, parking, family room, late check-in,
        step-free access, kitchenette, walkable to a specific landmark. Every constraint is a filter you either
        pass or fail on the evidence available. Hospitality is the vertical where vague copy costs the most.
      </p>
      <p>
        <strong>Review volume is the reputation layer.</strong> Travel is one of the most heavily reviewed
        categories on the internet, and assistants lean on that corpus for the qualitative half of an answer —
        quiet, clean, friendly staff, thin walls, slow lift. You cannot write your way past what a thousand guests
        have already written. That mechanism is covered generally in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why Google reviews now decide your AI visibility</Link>.
      </p>

      <h2>Where the answer actually comes from</h2>
      <p>
        When an assistant answers a stay question, the documents it pulls typically come from four places, in
        rough order of influence:
      </p>
      <ol>
        <li>
          <strong>Booking platform listings.</strong> Structured, amenity-complete, constantly updated. This is
          where most of the factual matching happens.
        </li>
        <li>
          <strong>Review platforms.</strong> Ratings plus the language guests use, which supplies the adjectives in
          the answer.
        </li>
        <li>
          <strong>Editorial travel guides and city roundups.</strong> &quot;Best boutique hotels in Porto&quot;
          articles are the exact shape of the query, so they get lifted nearly verbatim.
        </li>
        <li>
          <strong>Your own site, plus Google Maps and your Business Profile.</strong> Used for confirmation, direct
          booking links and location facts more than for discovery.
        </li>
      </ol>
      <p>
        The strategic implication is uncomfortable but simple: most of the work is off your own website. The site
        still matters — it is where a traveller lands to book direct, and where you avoid another commission — but
        it is rarely what got you named.
      </p>

      <h2>The specificity pass — the highest-value hour</h2>
      <p>
        Do this on every listing you control, starting with the platform that sends you the most bookings. Open
        the description field and rewrite it against this test: <em>could an assistant use this sentence to answer
        a constrained question?</em>
      </p>
      <p>
        Unusable: &quot;A charming family-run guesthouse offering a warm welcome and a home from home
        experience.&quot; Nothing in that sentence filters.
      </p>
      <p>
        Usable: &quot;A nine-room family-run guesthouse in the Old Town, 6 minutes&apos; walk from the cathedral.
        Two ground-floor rooms with step-free access, dogs welcome in three rooms at £15 per stay, free on-site
        parking for six cars, breakfast served 7–9.30am with vegan and gluten-free options, self check-in until
        11pm.&quot;
      </p>
      <p>
        The second version answers roughly eight different constrained queries. That is the entire technique. Then
        make sure the same facts appear:
      </p>
      <ul>
        <li>
          In every <strong>amenity checkbox</strong> on every platform — these are read as structured data and are
          frequently left half-completed. Work through the whole list, including accessibility.
        </li>
        <li>
          On your <strong>Google Business Profile</strong>, with matching attributes and hotel-specific fields. The
          propagation mechanism is in{" "}
          <Link href="/blog/google-business-profile-ai-answers">
            does your Google Business Profile feed AI answers
          </Link>
          .
        </li>
        <li>
          On your <strong>own site</strong>, in text rather than only in icons — a parking icon with no alt text or
          label is invisible to a crawler.
        </li>
        <li>
          In <code>Hotel</code> or <code>LodgingBusiness</code> schema, with{" "}
          <code>amenityFeature</code>, <code>checkinTime</code>, <code>petsAllowed</code> and address filled
          accurately. Never mark up an amenity you do not have.
        </li>
      </ul>

      <h2>Own the questions your guests actually ask</h2>
      <p>
        Hospitality has an unusually predictable question set, and almost nobody publishes the answers in plain
        text. Your front desk answers these weekly — put each one on your site as a real heading with a complete
        one-paragraph answer:
      </p>
      <ul>
        <li>What time is check-in and check-out, and can we arrive late or leave luggage?</li>
        <li>Is parking available, is it free, and is it on site or nearby?</li>
        <li>Are dogs allowed, in which rooms, and what does it cost?</li>
        <li>Is the property step-free, is there a lift, and which rooms are accessible?</li>
        <li>How far is it from the station, the airport, and the main attraction people visit?</li>
        <li>Is breakfast included, when is it served, and what are the dietary options?</li>
        <li>Can families share a room, and are cots and extra beds available?</li>
        <li>What is the cancellation policy in plain words?</li>
      </ul>
      <p>
        Answer in complete standalone sentences that make sense lifted out of context, because that is exactly how
        they will be used. &quot;Check-in is from 3pm and self check-in is available until 11pm; earlier arrivals
        can leave luggage at reception from 11am&quot; is quotable. &quot;3pm&quot; is not. The general craft of
        writing extractable answers is in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI quotes</Link>.
      </p>

      <h2>Get into the roundups</h2>
      <p>
        &quot;Best places to stay in [city]&quot; articles are, structurally, pre-written answers to the most
        common travel query there is — and assistants use them accordingly. Getting into them is a real, workable
        project:
      </p>
      <ol>
        <li>
          <strong>Find the actual list.</strong> Ask three assistants where to stay in your city under two or three
          different constraints, and record every publication and blog they cite or name. That is your target
          list — evidence, not guesswork.
        </li>
        <li>
          <strong>Pitch a specific angle, not the property.</strong> Roundups are themed: dog-friendly, adults-only,
          under £120, best for a first visit, walkable to the festival site. Pitch yourself into the theme you
          genuinely win, with the facts pre-written so the writer can paste them.
        </li>
        <li>
          <strong>Ask for the correction when you are listed wrong.</strong> Outdated prices, wrong distances and
          dead amenities in an old roundup keep being retrieved. A polite email to the editor fixes a document that
          may be feeding answers for years.
        </li>
      </ol>
      <p>
        Short-term rental hosts have a narrower version of this: your platform listing is doing nearly all the
        work, so the specificity pass matters more, and the neighbourhood-level detail — which street, which
        transit stop, what is walkable — is your main differentiator, since the property name itself rarely carries
        any recognition.
      </p>

      <h2>Being honest about the ceiling</h2>
      <p>
        Some of this is out of reach, and knowing which parts saves money.
      </p>
      <ul>
        <li>
          <strong>Live availability and price are not yours to influence.</strong> When an assistant surfaces rates
          or rooms, it is reading a booking system. Optimisation does not change what that system returns.
        </li>
        <li>
          <strong>You cannot outrank a chain on brand recognition.</strong> You can win on constraints — dogs,
          accessibility, parking, family rooms, a specific neighbourhood — which is precisely why the specificity
          pass, not general polish, is the leverage.
        </li>
        <li>
          <strong>Answers vary between engines and between attempts.</strong> Being named once is not proof of a
          fixed position, and being missed once is not proof of failure. Why that happens is in{" "}
          <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
        </li>
        <li>
          <strong>Nobody can guarantee placement.</strong> Any agency promising your property a permanent spot in
          an AI recommendation is describing something they cannot control.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Should I still bother with my own website if the platforms dominate?</h3>
      <p>
        Yes, for two reasons. It is where a traveller who has just heard your name confirms details and books
        direct at full margin, and it is the authoritative source when facts conflict across platforms. Treat it as
        the reference copy every other listing must agree with.
      </p>
      <h3>Do assistants use my star rating?</h3>
      <p>
        They use the ratings and review text published on platforms they can retrieve, and those numbers shape the
        qualitative framing of an answer. There is no way to influence that other than by running a property guests
        rate well and by responding to reviews, which adds your own words to the record.
      </p>
      <h3>How long before changes show up?</h3>
      <p>
        Listing edits appear on the platform immediately, but the copies and roundups assistants retrieve lag. Plan
        on several weeks before a re-scan tells you anything, and longer for editorial coverage to be written and
        indexed.
      </p>
      <h3>Does a blog on the hotel site help?</h3>
      <p>
        Only if it answers real trip-planning questions with local specifics — getting from the airport, where to
        eat within ten minutes&apos; walk, what is on in each season. Generic travel-inspiration posts add nothing
        an assistant needs. One genuinely useful local guide beats twenty.
      </p>

      <h2>The bottom line</h2>
      <p>
        Hospitality AI visibility is won on constraints. Travellers ask with filters attached, and assistants answer
        from third-party descriptions of your property. So rewrite every listing description into checkable facts,
        complete every amenity field on every platform, publish plain-text answers to the questions your front desk
        already fields, and work your way into the city roundups the engines are already citing. That is the whole
        job, and it is mostly a writing job.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
