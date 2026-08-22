import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "what-sources-do-ai-engines-cite",
  title: "What Sources Do AI Engines Actually Cite?",
  description:
    "AI engines cite a predictable mix: your own site, review and map platforms, directories and association lists, forums like Reddit, news and trade press, reference sites like Wikipedia, and third-party best-of roundups. Here is what each category is used for, and how to measure the mix for your own category in about twenty minutes.",
  date: "2026-08-22",
  readMins: 10,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and read the citation
          lists that come back. Last updated 22 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI engines cite a fairly predictable set of source types —{" "}
        <strong>your own website, review and map platforms, directories and association listings, community
        forums, news and trade press, reference sites like Wikipedia, and third-party &quot;best of&quot;
        roundups</strong>. The important part is that they are not interchangeable. Each category gets used for a
        different <em>job</em> inside an answer, so the sources you need depend entirely on which question you
        want to be the answer to.
      </p>

      <h2>Why &quot;which sources get cited most&quot; is the wrong question</h2>
      <p>
        Published studies of citation share exist, and they disagree with each other — because they sample
        different queries. A study built on B2B software questions will find review platforms and comparison sites
        everywhere. One built on medical questions will find institutional and government sources. One built on
        local service queries will find maps, directories and forums. All three are correct about their sample and
        none generalises to your category.
      </p>
      <p>
        We are not going to hand you a percentage table, because an honest one for your business does not exist
        until you measure it. What does generalise is the <em>functional</em> pattern: the roles these sources play.
        Understand the roles, then measure your own category — the twenty-minute method is at the end of this post.
      </p>

      <h2>The seven source categories and what each one is used for</h2>

      <h3>1. Your own website — the source of facts about you</h3>
      <p>
        Your site is where an engine goes for the things only you can state: what you sell, where you operate,
        hours, credentials, pricing, process. It is rarely the source that decides whether you get recommended,
        but it is almost always the source of the details <em>inside</em> the recommendation. A business with a
        thin site can still be recommended and will be described vaguely — which usually loses the customer at the
        next question.
      </p>
      <p>
        Practical consequence: your site is a fact sheet before it is a brochure. And the facts have to be in the
        HTML a crawler receives, not assembled by JavaScript after load — see{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">why AI crawlers cannot read your JavaScript site</Link>.
      </p>

      <h3>2. Review and map platforms — the corroboration layer</h3>
      <p>
        Google Business Profile, Apple Maps, Yelp, G2, Capterra, Trustpilot, TripAdvisor and the vertical
        equivalents answer the question the engine cannot take your word on: is this business real, currently
        operating, and do customers rate it. For local and consumer queries this is usually the deciding input.
        Review <em>text</em> matters as much as the star rating, because sentences are retrievable and a number is
        not. Details in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why your Google reviews decide your AI visibility</Link>.
      </p>

      <h3>3. Directories and association listings — the existence and legitimacy layer</h3>
      <p>
        Chambers of commerce, licensing boards, trade associations, industry directories. Low glamour, high value:
        they are independent, structured, non-promotional, and they confirm that a name, address and phone number
        belong together. They are also where contradictions do the most damage, since one stale listing with an old
        address gives the engine a conflict to resolve. See{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">
          directory listings and NAP citations
        </Link>
        .
      </p>

      <h3>4. Community forums — the candid-opinion layer</h3>
      <p>
        Reddit, Quora, Stack Exchange, niche forums and Facebook groups get pulled in when a user asks something
        evaluative: is X worth it, what do people actually think, what went wrong for others. Forums are the source
        engines reach for when the honest answer is not on any company&apos;s website. You cannot manufacture this
        without it backfiring; you can participate genuinely. The boundaries are in{" "}
        <Link href="/blog/reddit-and-ai-search">Reddit and AI search</Link>.
      </p>

      <h3>5. News and trade press — the notability and recency layer</h3>
      <p>
        Press coverage does two things: it establishes that you are notable enough to be mentioned by someone who
        is not you, and it timestamps facts, which matters for anything an engine treats as time-sensitive.
        Trade-press coverage in your own vertical often outperforms general business press here, because it sits
        closer to the questions your customers ask. See{" "}
        <Link href="/blog/press-releases-news-coverage-ai-visibility">
          press releases, news coverage and AI visibility
        </Link>
        .
      </p>

      <h3>6. Reference sites — the entity-resolution layer</h3>
      <p>
        Wikipedia, Wikidata, Crunchbase and similar structured references are less often the visible citation and
        more often the reason the engine knows <em>which</em> entity you are. They anchor names to identities. Most
        small businesses do not qualify for a Wikipedia article and should not chase one; the accessible parts of
        this layer are structured profiles you can legitimately claim. See{" "}
        <Link href="/blog/wikipedia-wikidata-ai-visibility">Wikipedia, Wikidata and AI visibility</Link>.
      </p>

      <h3>7. Third-party roundups — the shortlist layer</h3>
      <p>
        &quot;Best [thing] in [place]&quot; articles from local publications, blogs and niche sites. When a user asks
        for a shortlist, these are pre-made shortlists, so they are cheap for an engine to draw on. This is the
        category most businesses have zero presence in and could realistically enter. See{" "}
        <Link href="/blog/get-into-ai-best-of-lists">how to get into AI best-of lists</Link>.
      </p>

      <h2>The pattern: your site states, everything else confirms</h2>
      <p>
        Six of those seven categories are things you do not own. That is the structural fact of AEO and the reason
        it is not just content marketing. An engine composing an answer is doing something closer to fact-checking
        than to ranking: it retrieves candidate passages, and claims supported from several independent directions
        survive while unsupported ones get hedged or dropped.
      </p>
      <p>
        So the failure mode is rarely &quot;my website is not good enough.&quot; It is usually &quot;nothing outside
        my website says anything about me,&quot; or worse, &quot;the things outside my website disagree with it.&quot;
        Conflicting facts do not average — the safe move for a model facing a contradiction is to assert neither
        version. That is the same mechanism behind{" "}
        <Link href="/blog/why-ai-recommends-your-competitor">why AI recommends your competitor</Link>.
      </p>

      <h2>Measure your own category in twenty minutes</h2>
      <p>Do not take anyone&apos;s citation-share chart, including a chart you might build from this post. Build yours:</p>
      <ol>
        <li>
          <strong>Write down ten real questions.</strong> The ones customers actually ask, phrased the way they
          would type them into an assistant. Include at least three with a filter — a place, a price, a
          constraint, a comparison.
        </li>
        <li>
          <strong>Ask each question in engines that show sources.</strong> Perplexity and Google AI Mode display
          citations directly; ChatGPT and Claude show them when the answer used web search, and Copilot footnotes
          its answers. Ask each engine the same ten questions.
        </li>
        <li>
          <strong>Log every cited domain</strong> in a spreadsheet — one row per citation, with the question, the
          engine, the domain and which of the seven categories it falls into.
        </li>
        <li>
          <strong>Count by category, not by domain.</strong> You now know what your category&apos;s answers are
          built out of. If half your citations are forum threads, your work is participation and reputation. If
          half are roundups, your work is outreach. If half are directories, your work is listing hygiene.
        </li>
        <li>
          <strong>Mark where you appear and where you do not.</strong> The gaps are the work list, in priority
          order, and it is usually short.
        </li>
        <li>
          <strong>Repeat quarterly.</strong> Answers shift as engines change retrieval, and a single run is a
          snapshot, not a measurement — one reason to sample rather than trust one output is{" "}
          <Link href="/blog/why-ai-answers-change-every-time">answer variance</Link>.
        </li>
      </ol>
      <p>
        Twenty minutes of this beats any general study, because it is your queries, your competitors and your
        market. If you would rather not do it by hand for every engine, that sampling and logging is exactly what
        an <Link href="/scan">AI visibility scan</Link> automates.
      </p>

      <h2>Common questions</h2>
      <h3>Do AI engines cite the sites that rank highest on Google?</h3>
      <p>
        There is overlap, since several engines lean on a search index for retrieval, but the correlation is loose.
        Retrieval works at passage level, so a page ranking tenth can be cited over the page ranking first if it
        contains the paragraph that actually answers the question. Details in{" "}
        <Link href="/blog/aeo-vs-seo">AEO vs SEO</Link>.
      </p>
      <h3>Can I pay to be cited?</h3>
      <p>
        Not directly, and be wary of anyone offering it. Paid placements in genuine third-party roundups exist and
        are a normal advertising decision, but the citation is a side effect, not a purchase. See{" "}
        <Link href="/blog/do-paid-ads-affect-ai-recommendations">do paid ads affect AI recommendations</Link>.
      </p>
      <h3>Does the number of sources citing me matter, or the quality?</h3>
      <p>
        Independence matters more than either. Five sources that are all syndicated copies of your own press
        release are one source wearing five hats. Three genuinely independent ones — a review platform, a licensing
        body, a local publication — corroborate far more strongly.
      </p>
      <h3>What if a source cites wrong information about my business?</h3>
      <p>
        Fix it at the source rather than arguing with the engine, then wait for re-crawl. The step-by-step is in{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">
          how to fix wrong AI information about your business
        </Link>
        .
      </p>

      <h2>The bottom line</h2>
      <p>
        There is no universal ranking of the sources AI engines cite, and any single number you are quoted is
        really a statement about someone else&apos;s query sample. What holds everywhere is the division of labour:
        your site supplies the facts, and six other categories decide whether those facts are believed. Spend
        twenty minutes finding out which of those categories your own customers&apos; questions actually pull from,
        and work the gaps in that order.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
