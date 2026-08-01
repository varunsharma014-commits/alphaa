import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "do-backlinks-matter-for-ai-search",
  title: "Do Backlinks Still Matter for AI Search?",
  description:
    "Backlinks still matter for AI search, but indirectly and less than they did for Google rankings. What AI engines actually reward is being mentioned and described by credible third parties — with or without a link. Here's the mechanism, and what to build instead of a link-buying budget.",
  date: "2026-08-01",
  readMins: 9,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and read the sources
          the engines actually cite back. Last updated 1 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes, but indirectly — and the thing that really moves an AI
        recommendation is the <em>mention</em>, not the hyperlink. A link helps because it feeds the classic
        search rankings that AI engines retrieve from, and because links tend to come attached to a sentence
        describing who you are. Strip the link away and leave the sentence, and you keep most of the value. Strip
        the sentence away and leave a bare link in a footer directory, and you keep almost none of it.
      </p>

      <h2>Why the question comes up at all</h2>
      <p>
        For twenty years, link building was the load-bearing wall of SEO. So the first thing agencies did when
        AI search arrived was to rename their existing link packages &quot;AEO&quot; and keep selling them.
        That is worth being skeptical about. The honest position is that links are one input among several, and
        they are no longer the dominant one — but they are not worthless either, and anyone telling you links
        are completely dead is oversimplifying in the other direction.
      </p>

      <h2>How a link actually reaches an AI answer</h2>
      <p>
        When you ask ChatGPT, Gemini, Claude or Perplexity for a recommendation, most modern assistants run a
        live retrieval step: they issue one or more search queries, pull back a set of pages, read them, and
        synthesize an answer from what those pages say. A backlink can influence that chain in three distinct
        places, and it is worth separating them because they respond to different work:
      </p>
      <ul>
        <li>
          <strong>Retrieval reach (indirect).</strong> The retrieval step usually runs over a conventional
          search index. Links still contribute to how those indexes rank pages, so a well-linked page is more
          likely to be in the set of documents the model reads. This is the one genuinely link-shaped effect,
          and it is entirely secondhand: the link helps the ranking, and the ranking helps the retrieval.
        </li>
        <li>
          <strong>The surrounding sentence (direct).</strong> When a model reads the linking page, it reads
          the words around the link. &quot;Northside Dental, a Portland practice that does same-day
          CEREC crowns&quot; is a usable, quotable description that the model can lift and attribute. That
          sentence would work just as well with no <code>href</code> on it at all.
        </li>
        <li>
          <strong>Entity confirmation (direct).</strong> A page that names you, locates you, and describes what
          you do — on a domain that is not yours — is independent corroboration. It helps the engine resolve
          &quot;which business is this?&quot; and raises its confidence that you exist as described. We cover
          that resolution process in{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">
            entity SEO: how AI engines figure out who your business is
          </Link>
          .
        </li>
      </ul>
      <p>
        Two of those three benefits do not require a link. That is the whole point, and it is why the practical
        strategy changes.
      </p>

      <h2>Mentions vs. links: what the difference looks like in practice</h2>
      <p>
        Here is a concrete pair. Both are &quot;off-page signals&quot; in the old vocabulary; they behave
        completely differently in an AI answer.
      </p>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>What an engine can do with it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A dofollow link from a paid guest post: &quot;check out this great company&quot;</td>
            <td>
              Adds a small amount of ranking signal to one page. Provides no describable fact. Nothing here can
              be quoted in an answer.
            </td>
          </tr>
          <tr>
            <td>
              An unlinked Reddit comment: &quot;We used Northside for a cracked molar — same-day crown, $1,400,
              done in one visit&quot;
            </td>
            <td>
              Names you, states a service, a price, and a turnaround, in a user&apos;s own voice, on a domain
              engines retrieve from constantly. Directly quotable and directly attributable.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        If you have a fixed budget and have to choose, the second one wins for AI visibility. We go deeper on
        why third-party discussion carries so much weight in{" "}
        <Link href="/blog/reddit-and-ai-search">
          why Reddit and third-party mentions decide what AI says about your business
        </Link>
        .
      </p>

      <h2>So should you stop building links?</h2>
      <p>
        No — you should stop building the <em>kind</em> of links that only ever existed to move a ranking. The
        test we apply to any placement is a single question:{" "}
        <strong>if you deleted the hyperlink, would this page still be worth having?</strong>
      </p>
      <ul>
        <li>
          <strong>Worth having.</strong> A trade-association member page listing your certifications. A local
          news piece that quotes you by name. A supplier&apos;s &quot;where to buy&quot; page. A podcast
          episode with a description. A review site profile with real reviews. A directory that is genuinely
          used by humans in your category.
        </li>
        <li>
          <strong>Not worth having.</strong> Private blog networks, paid link marketplaces, mass directory
          submissions, comment-spam links, and the &quot;100 backlinks for $99&quot; tier of any offer. These
          were declining in value for Google long before AI search, and they give a language model nothing at
          all to say about you.
        </li>
      </ul>

      <h2>What to do instead: five things that earn mentions</h2>
      <p>These are the plays we actually run, in rough order of effort-to-payoff:</p>
      <ol>
        <li>
          <strong>Fix your own describability first.</strong> Third parties describe you using the words you
          gave them. If your site says &quot;quality service you can trust,&quot; that is what gets repeated —
          and it matches no one&apos;s question. Publish the specifics: services, service area, prices or price
          ranges, hours, credentials, brands you work with.
        </li>
        <li>
          <strong>Claim and complete every profile in your category.</strong> Google Business Profile, Apple
          Business Connect, Bing Places, Yelp, and the two or three vertical directories that matter to your
          trade. Same name, same address, same phone, same service list on every one. Inconsistency here is the
          single most common cause of an engine hedging or getting your details wrong.
        </li>
        <li>
          <strong>Earn reviews continuously, and reply to them.</strong> Review text is the richest source of
          third-party language about your business, and it is one of the few signals you can reliably grow every
          month. See{" "}
          <Link href="/blog/google-reviews-ai-visibility">why your Google reviews now decide your AI visibility</Link>
          .
        </li>
        <li>
          <strong>Be useful where your category is discussed.</strong> Answer real questions in the subreddits,
          forums and Facebook groups where your customers already ask them. Not link drops — answers. A helpful
          answer that names your business once is worth more than fifty submitted directory listings.
        </li>
        <li>
          <strong>Publish one genuinely citable asset.</strong> Original data, a real price breakdown, a
          documented process, a local guide only you could write. This is the thing that earns unprompted
          mentions and, incidentally, the links too.
        </li>
      </ol>

      <h2>How to check whether any of it is working</h2>
      <p>
        Do not measure this with a backlink counter. Measure it the way the engine sees it: ask the assistants
        the questions your customers ask, repeatedly, and record whether you get named and what sources get
        cited. Two honest caveats. First, answers vary run to run — a single screenshot proves nothing, which we
        explain in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why ChatGPT gives a different answer every time</Link>
        . Second, this is slow: third-party signals need time to accumulate and to be re-crawled.
      </p>

      <h2>Q&amp;A</h2>
      <p>
        <strong>Do backlinks directly improve AI citations?</strong> Not directly. They improve the search
        rankings that AI retrieval draws from, which indirectly raises your odds of being retrieved. The
        descriptive text around a link matters more than the link attribute itself.
      </p>
      <p>
        <strong>Do unlinked brand mentions count?</strong> Yes. A named, described mention on a page an engine
        retrieves is usable evidence with or without a hyperlink. That is the core reason AI-era off-page work
        looks more like PR than like link building.
      </p>
      <p>
        <strong>Does nofollow matter?</strong> Far less than it did. A model reading a page does not care about
        the rel attribute; it reads the sentence. Nofollow mentions on Reddit, Wikipedia talk pages and review
        sites are demonstrably influential in AI answers.
      </p>
      <p>
        <strong>Will buying links get me into ChatGPT?</strong> No, and no one can guarantee placement in any AI
        answer. You can only improve the evidence the engines read. Any vendor promising guaranteed AI
        recommendations is selling something that does not exist — see{" "}
        <Link href="/blog/is-aeo-real">is AEO real?</Link> for how to tell the difference.
      </p>

      <h2>The bottom line</h2>
      <p>
        Backlinks have gone from the main event to a supporting signal. What replaced them is not a new trick —
        it is the older, harder discipline of being described accurately and often by people who are not you.
        Build the mentions and the useful links follow; buy the links and you get neither.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
