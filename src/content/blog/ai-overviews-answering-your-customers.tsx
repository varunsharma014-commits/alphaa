import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ai-overviews-answering-your-customers",
  title: "AI Overviews Are Answering Your Customers Before They Reach Your Website",
  description:
    "Google's AI Overviews now answer many commercial searches on the results page itself — often without a click. Here's how they work, why they cut traffic, and how to become the business the overview cites.",
  date: "2026-07-22",
  readMins: 9,
  tag: "Death of the Blue Link",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Google&apos;s AI Overviews — the AI-generated summary that now sits above
        the classic blue links — increasingly answer your customer&apos;s question right on the results page,
        citing a handful of sources and often ending the search before anyone clicks through to a website. For
        local and commercial searches, that means the overview, not your homepage, is frequently the first (and
        sometimes only) impression a prospect gets. The businesses named and cited inside that overview win; the
        ones ranked #4 below it may never be seen. Your job has shifted from &quot;rank on the page&quot; to
        &quot;be in the answer.&quot;
      </p>

      <p>
        By the alphaa team — we track how AI engines cite local businesses across thousands of scans. This is part
        of our{" "}
        <Link href="/blog/death-of-the-blue-link">Death of the Blue Link</Link> series on the shift from ranked
        links to AI answers. Last updated July 22, 2026.
      </p>

      <h2>What is an AI Overview?</h2>
      <p>
        An AI Overview is a short, AI-generated answer Google places at the top of the search results for many
        queries. Instead of ten blue links you scan yourself, you get a synthesized paragraph or list that
        directly answers the question, with a few cited sources linked beside or beneath it. It&apos;s built the
        same way other AI answers are: Google retrieves relevant pages, reads them, and generates a summary,
        surfacing the sources it leaned on. For the searcher, the effect is that the answer arrives before the
        list of websites does.
      </p>

      <h2>How often do they actually appear? (An honest number)</h2>
      <p>
        This is where a lot of marketing gets sloppy, so here&apos;s the careful version. AI Overviews now appear
        in up to ~48% of commercial-intent searches (BrightEdge, 2026) — the exact kind of &quot;best,&quot;
        &quot;near me,&quot; and &quot;how do I choose&quot; queries that precede a purchase. That is not the same
        as &quot;half of all searches.&quot; Broad-panel studies that measure every query type (Semrush, for
        example) have put overview presence closer to ~16–25% of all searches. Both can be true at once: overviews
        are far more common on the buying-intent queries that matter to your business than they are across search
        as a whole. Anyone quoting &quot;AI Overviews in 50% of all searches&quot; is overstating it — but on the
        searches where a customer is deciding who to hire, they&apos;re already the norm.
      </p>

      <h2>Why this cuts your website traffic</h2>
      <p>
        When the answer is on the results page, fewer people click anything at all. This is the zero-click
        pattern: roughly two-thirds of Google searches now end without a single click to a website
        (SparkToro/Similarweb, 2026), and AI Overviews accelerate it. The searcher reads the summary, gets what
        they need — a recommendation, a comparison, a direct answer — and stops.
      </p>
      <p>The consequences for a local or commercial business are concrete:</p>
      <ul>
        <li>
          <strong>Ranking #1 no longer guarantees the click.</strong> If the overview sits above you and answers
          the question, your top organic position may go unseen. We unpack this shift in{" "}
          <Link href="/blog/death-of-the-blue-link">why ranking #1 no longer brings the customers it used to</Link>.
        </li>
        <li>
          <strong>Being <em>cited</em> beats being <em>ranked</em>.</strong> A business named inside the overview
          gets the impression — and often the visit — even if a competitor ranks higher in the blue links below.
        </li>
        <li>
          <strong>Informational content loses clicks first.</strong> &quot;How much does X cost&quot; and
          &quot;what to look for in a Y&quot; pages are prime overview fodder; the answer gets summarized and the
          click evaporates.
        </li>
      </ul>

      <h2>The reframe: from &quot;rank on the page&quot; to &quot;be in the answer&quot;</h2>
      <p>
        The strategic shift is simple to state and hard to ignore. Optimizing to rank below an AI Overview is
        optimizing for a spot people increasingly skip. The work now is to be one of the sources the overview
        pulls from and names. That&apos;s the same discipline as getting recommended by ChatGPT or cited on
        Perplexity — because they run on the same retrieval-and-synthesis machinery. Win the answer in one, and
        you&apos;re usually building the signals that help in all of them.
      </p>

      <h2>How to become the business an AI Overview cites</h2>
      <p>
        You can&apos;t buy your way into an overview or guarantee a citation — Google decides per query, and
        results vary. What you <em>can</em> do is make your business the most retrievable, verifiable, quotable
        source for the questions your customers ask. In practice:</p>
      <ol>
        <li>
          <strong>Answer real questions directly, up top.</strong> Structure pages so the first sentence answers
          the question a customer would type. Overviews lift clean, self-contained answers — give them one to
          lift. (This article does the same thing: the answer is in the first two sentences.)
        </li>
        <li>
          <strong>Add structured data.</strong> Schema markup helps engines understand exactly what you offer,
          where, and for whom — see{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>. Clear structure makes
          your content easier to retrieve and quote.
        </li>
        <li>
          <strong>Build third-party consensus.</strong> Reviews, directory listings, and mentions describe you in
          other people&apos;s words. Overviews favor businesses that many trusted sources describe consistently —
          which is also why{" "}
          <Link href="/blog/google-reviews-ai-visibility">your Google reviews now decide your AI visibility</Link>.
        </li>
        <li>
          <strong>Keep your entity details identical everywhere.</strong> Name, address, phone, hours, and
          services must match across Google, your site, and every directory. Conflicting details make the model
          less confident about naming you.
        </li>
        <li>
          <strong>Publish specific, current content.</strong> Concrete pages — pricing ranges, service areas,
          real FAQs — give an overview something precise to cite. Vague marketing copy gives it nothing.
        </li>
      </ol>

      <h2>Frequently asked questions</h2>
      <p>
        <strong>Are AI Overviews the same as ChatGPT?</strong> No — AI Overviews are Google&apos;s feature inside
        search results, while ChatGPT is a separate assistant. But they work on the same underlying idea:
        retrieve sources, synthesize an answer, cite a few. Optimizing for one tends to help with the other.
      </p>
      <p>
        <strong>Can I opt my business out of AI Overviews?</strong> Not meaningfully — they summarize the public
        web. The productive move isn&apos;t to hide from them; it&apos;s to become a source they cite, so the
        summary sends attention your way rather than a competitor&apos;s.
      </p>
      <p>
        <strong>Do AI Overviews really reduce clicks?</strong> On the query types where they appear, yes —
        they&apos;re part of why roughly two-thirds of Google searches now end without a click
        (SparkToro/Similarweb, 2026). The offset is that being cited in the overview can drive high-intent
        attention even without a traditional ranking.
      </p>
      <p>
        <strong>Is traditional SEO now pointless?</strong> No. Crawlable, well-structured, authoritative pages are
        exactly what overviews retrieve from. The fundamentals still matter — the goal they serve has shifted from
        ranking to being cited.
      </p>

      <h2>The bottom line</h2>
      <p>
        AI Overviews have quietly moved the moment of decision from your website to Google&apos;s results page. On
        the commercial searches that lead to a sale, they&apos;re already the norm, and they&apos;re a major
        driver of the zero-click era. You can&apos;t control the overview, but you can earn your way into it — with
        direct answers, clean structure, strong reviews, and consistent details that make your business the
        obvious, verifiable source. The first step is knowing what the AI engines currently say about you.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
