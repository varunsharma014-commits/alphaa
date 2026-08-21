import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "do-city-landing-pages-work-ai-search",
  title: "Do City Landing Pages Still Work for AI Search?",
  description:
    "City landing pages still work for AI search, but only when each page contains facts that are true of that place and nowhere else. Templated pages that swap a city name are actively counterproductive. Here is the test, the build, and how many pages you should actually publish.",
  date: "2026-08-21",
  readMins: 10,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and look at a lot of
          city-page templates. Last updated 21 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> yes, city landing pages still work for AI search —{" "}
        <strong>but only the ones that contain something true about that specific city</strong>. An AI
        assistant retrieves passages, not pages, so a page earns a citation by containing a passage worth
        lifting. Fifty pages generated from one template with the place name swapped contain one passage
        repeated fifty times, which gives the engine nothing to choose and gives your site a duplication
        problem. Three genuinely local pages beat fifty templated ones, reliably.
      </p>

      <h2>Why the honest answer is &quot;it depends on the page,&quot; not &quot;yes&quot; or &quot;no&quot;</h2>
      <p>
        The advice you will find is split, and both camps are half right. &quot;City pages are dead&quot;
        comes from people who watched Google devalue doorway pages. &quot;City pages are essential&quot; comes
        from agencies whose product is producing them at volume.
      </p>
      <p>
        The mechanism explains the split. When an AI assistant answers &quot;best [service] in
        [city],&quot; roughly this happens:
      </p>
      <ol>
        <li>
          The query is expanded into several related searches — the service, the city, sometimes the
          neighbourhood or a modifier the user did not type.
        </li>
        <li>
          Those searches run against a retrieval layer — a search index, the engine&apos;s own crawl, a maps
          or business dataset, or some combination.
        </li>
        <li>
          Candidate passages come back and are ranked mostly on how well they <em>answer the specific
          question</em>, not on how well the page is optimised.
        </li>
        <li>
          The model composes an answer from the passages that survive, and cites the ones it leaned on.
        </li>
      </ol>
      <p>
        Every step of that rewards <strong>distinctive, specific text</strong> and punishes near-duplicate
        text. A templated city page is near-duplicate by construction. That is the whole story: the format is
        not the problem, the sameness is.
      </p>

      <h2>The one-sentence test for a city page</h2>
      <p>
        Before you publish, apply this: <strong>if you swapped the city name for a different city, would any
        sentence on the page become false?</strong>
      </p>
      <p>
        If the answer is no, the page has no local content — it is a template with a variable in it, and it
        will not earn a citation, because there is nothing on it that a model could only have learned from
        that page. If the answer is yes, and yes several times over, you have a real page.
      </p>
      <p>
        This is a stricter test than it sounds. &quot;We proudly serve the Tucson area with reliable, honest
        service&quot; survives no swap. &quot;Our Tucson crews carry permits for the historic Barrio Viejo
        district, where trucks over 24 feet cannot access most streets&quot; survives it emphatically.
      </p>

      <h2>What actually goes on a city page that earns citations</h2>
      <p>
        Facts that are true of that place and nowhere else. In practice, a page that works usually contains
        four or five of these:
      </p>
      <ul>
        <li>
          <strong>Local operating facts.</strong> Which crew or office covers it, response times from where
          you are actually based, days or seasons you run there, the neighbourhoods and adjacent towns
          included.
        </li>
        <li>
          <strong>Local regulatory or logistical detail.</strong> Permits, HOA rules, building certificate-of-insurance
          requirements, parking and access restrictions, county inspection quirks, state licensing that
          differs. This is the highest-value category, because almost nobody publishes it and it is exactly
          what a person asking an assistant wants to know.
        </li>
        <li>
          <strong>Local pricing reality.</strong> What a job in that market typically runs and why it differs
          from the next market over. Ranges with the variables named, not invented precision.
        </li>
        <li>
          <strong>Named local proof.</strong> Reviews from customers in that area, projects with the
          neighbourhood named, a local partner, a local trade association or chamber membership.
        </li>
        <li>
          <strong>Local contact reality.</strong> If you have a real staffed address there, say so with hours.
          If you do not, say you serve it from your main location — that is a{" "}
          <Link href="/blog/eeat-author-bios-ai-search">trust signal</Link>, not a weakness, and inventing a
          virtual office is the fastest way to create the contradictory-address problem below.
        </li>
      </ul>

      <h2>How templated pages actively hurt</h2>
      <p>Three concrete failure modes, all of which we see in scans:</p>
      <h3>Entity dilution</h3>
      <p>
        Engines build a picture of your business as an entity: one name, one identity, a defined service area.
        Eighty pages each claiming a different city as home blur that picture rather than extend it, and a
        blurred entity is harder to retrieve for <em>any</em> query, including the one city where you are
        genuinely strong. The mechanics are in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          entity SEO and how AI identifies your business
        </Link>
        .
      </p>
      <h3>Contradictory addresses and phone numbers</h3>
      <p>
        Templated city pages very often carry a per-city phone number or a virtual-office address. Those
        details then propagate into directories, and now the engines have several conflicting records for one
        business. Conflicting facts do not average — they suppress, because the safest thing for a model to do
        with a contradiction is not to assert either version. See{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">
          directory listings and NAP consistency
        </Link>
        .
      </p>
      <h3>Crowding out the pages that would have worked</h3>
      <p>
        Retrieval is competitive within your own domain as well as across the web. Fifty thin pages sit
        between an engine and your three good ones. This is the most common version of the problem: the good
        page exists, and it is buried in a template farm.
      </p>

      <h2>How many city pages should you actually have?</h2>
      <p>
        A rule of thumb that holds up: <strong>one page per place where you could write 400 words of true,
        specific detail without straining, and no more.</strong> For most single-location businesses that is
        one to five pages. For a business with real crews or offices in multiple markets, it is one per market
        — which is a different job, closer to the one described in{" "}
        <Link href="/blog/multi-location-business-ai-visibility">multi-location AI visibility</Link>.
      </p>
      <p>
        If you serve thirty towns but only have things to say about four of them, the right structure is four
        real pages plus one honest service-area page that lists the other twenty-six as places you cover. The
        list still helps — it gives an engine a literal string match for those town names — but it does so
        without thirty near-duplicate documents attached.
      </p>

      <h2>Building one: a worked structure</h2>
      <ol>
        <li>
          <strong>H1 with the plain query.</strong> &quot;[Service] in [City], [State]&quot;. Not clever, not
          a slogan.
        </li>
        <li>
          <strong>A 40–60 word answer-first paragraph.</strong> Who you are, what you do in that city, the
          area covered, and one qualifying fact. This paragraph is the passage most likely to be lifted, so it
          should stand alone and be true out of context.
        </li>
        <li>
          <strong>Coverage.</strong> Neighbourhoods, ZIP codes, adjacent towns — as text, in a list.
        </li>
        <li>
          <strong>The local specifics.</strong> Two or three sections from the fact list above, each under a
          question-shaped heading a customer would actually type.
        </li>
        <li>
          <strong>Local proof.</strong> Two or three reviews or project notes from that area, with the area
          named.
        </li>
        <li>
          <strong>A short FAQ.</strong> Three or four questions specific to that market, answered in two to
          four sentences each — the extractable format described in{" "}
          <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI engines will quote</Link>.
        </li>
        <li>
          <strong>Schema.</strong> LocalBusiness (or the right subtype) with <em>areaServed</em> naming the
          city. Use one canonical address — your real one — across every city page rather than a per-page
          address. The full pattern is in{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
        </li>
      </ol>
      <p>
        And make sure the text is in the HTML the crawler receives. City pages are frequently built as
        client-rendered components fed by a data file, which can leave AI crawlers with an empty shell — see{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">
          why AI crawlers cannot read your JavaScript site
        </Link>
        .
      </p>

      <h2>Common questions</h2>
      <h3>Will AI engines penalise my city pages?</h3>
      <p>
        There is no penalty in the sense classic SEO uses the word. Retrieval simply does not surface passages
        that are duplicative and unspecific, and a diluted entity is harder to match. The effect is exclusion
        by irrelevance rather than punishment — which is worth understanding, because it means there is no
        penalty to &quot;lift&quot; either. Improving the pages is the only lever.
      </p>
      <h3>Should I delete the templated city pages I already have?</h3>
      <p>
        Consolidate rather than delete outright. Keep the handful you can make genuinely specific, improve
        those, and redirect the rest into a single service-area page. Preserve any page that has real
        backlinks or real traffic. Then re-check your visibility after a few weeks — the re-crawl and
        re-indexing lag is real, as covered in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
      </p>
      <h3>Can I use AI to write the city pages?</h3>
      <p>
        For structure and drafting, yes. For the local facts, no — a model does not know your permit rules,
        your crew locations or your market pricing, and if it invents them you have published errors under
        your own name. The part that earns the citation is precisely the part a generator cannot supply. Use
        it to write around facts you provide.
      </p>
      <h3>Do city pages help if I have no reviews in that city yet?</h3>
      <p>
        Less than you would like. Off-property corroboration is usually the deciding signal in local AI
        answers, and a page asserting presence with nothing outside your own domain confirming it is a weak
        input. Build the page, then get two or three reviews that mention the area — see{" "}
        <Link href="/blog/google-reviews-ai-visibility">why Google reviews decide your AI visibility</Link>.
      </p>
      <h3>Are city pages better than a Google Business Profile service area?</h3>
      <p>
        They are complements, and the profile usually matters more for near-me style queries. Set the service
        area properly first — it feeds the map and business datasets engines lean on — then use pages to
        answer the questions a profile cannot hold. The profile side is in{" "}
        <Link href="/blog/google-business-profile-ai-answers">
          Google Business Profile and AI answers
        </Link>
        .
      </p>

      <h2>The bottom line</h2>
      <p>
        City pages are not dead and they are not magic. They are a container, and AI search only rewards
        containers with something specific inside them. The test is the swap test: change the city name, and
        if nothing on the page becomes false, the page was never about that city. Write the four pages you can
        genuinely fill, list the rest honestly, keep one canonical address, and put the local knowledge you
        already have in your head onto the page — that knowledge is the part no competitor and no generator
        can copy.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
