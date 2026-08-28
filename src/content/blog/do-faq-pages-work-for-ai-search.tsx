import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "do-faq-pages-work-for-ai-search",
  title: "Do FAQ Pages Still Work for AI Search?",
  description:
    "Google deprecated FAQ rich results in 2023, so most SEO advice now says skip them. For AI search the calculus is different: the Q&A format is the closest thing on the web to a pre-extracted answer. Here is what still works, what never did, and how to write one an engine will quote.",
  date: "2026-08-28",
  readMins: 11,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and read a great many
          FAQ pages. Last updated 28 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes — but for a completely different reason than they used to.{" "}
        <strong>FAQ pages no longer earn you anything in Google&apos;s search results</strong>; Google removed FAQ
        rich results for almost all sites in 2023 and the visual reward is gone. What they do earn is{" "}
        <strong>extraction</strong>. A question-shaped heading followed by a short, self-contained answer is
        structurally identical to what a retrieval system is trying to build, so it can be lifted into an AI answer
        with minimal rewriting. The catch is that this only holds for real questions with real answers. The
        marketing-fluff FAQ — &quot;Why choose us?&quot; &quot;Are you the best in the business?&quot; — is worse
        than nothing, because it teaches an engine that your page contains no facts.
      </p>

      <h2>What actually changed, and when</h2>
      <p>
        Two separate things get conflated, so it is worth being precise.
      </p>
      <p>
        In August 2023 Google announced it was reducing FAQ rich results to a small number of
        authoritative government and health sites, and rolling them back everywhere else. Google&apos;s own{" "}
        <a
          href="https://developers.google.com/search/docs/appearance/structured-data/faqpage"
          target="_blank"
          rel="noopener noreferrer"
        >
          FAQPage structured data documentation
        </a>{" "}
        still describes the markup, but the expanding-accordion snippet most sites were chasing is no longer
        available to them. That is a change to a <em>search-result display feature</em>.
      </p>
      <p>
        It is not a statement about whether question-and-answer content is useful. The content format and the rich
        result were always separate things, and only one of them went away. AI assistants are not reading
        Google&apos;s SERP features — they run their own retrieval, fetch pages, and extract passages. What a
        deprecated snippet type does or does not render has no bearing on whether a passage on your page is a good
        candidate for that extraction.
      </p>

      <h2>Why the Q&amp;A format suits retrieval so well</h2>
      <p>
        When an assistant answers a question, it needs a passage that (a) is topically matched to the query, (b)
        makes sense removed from its surroundings, and (c) is short enough to quote without summarising. A
        well-formed FAQ entry satisfies all three by construction:
      </p>
      <ul>
        <li>
          <strong>The heading is already the query.</strong> Retrieval matches semantically, and a heading phrased
          as the literal question a person would ask is the closest possible match to that person&apos;s query.
        </li>
        <li>
          <strong>The answer is self-contained.</strong> A good FAQ answer does not depend on the paragraph above
          it. That is exactly the property that makes a passage safe to quote — the extraction does not lose
          meaning.
        </li>
        <li>
          <strong>Boundaries are unambiguous.</strong> Heading, answer, next heading. A chunker splitting your page
          into passages will get the split right, which is much less certain inside a long flowing narrative.
        </li>
      </ul>
      <p>
        This is the same mechanism behind{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">writing content AI engines will quote</Link> — the FAQ is
        simply the most mechanical way to produce it.
      </p>

      <h2>The FAQ that fails, and why it fails</h2>
      <p>
        Roughly the pattern we see on most small-business sites:
      </p>
      <ul>
        <li>&quot;Why should I choose [company]?&quot;</li>
        <li>&quot;Are you licensed and insured?&quot; — answered &quot;Yes, absolutely!&quot;</li>
        <li>&quot;Do you offer free estimates?&quot; — answered &quot;Yes! Contact us today.&quot;</li>
        <li>&quot;What areas do you serve?&quot; — answered &quot;We proudly serve the greater metro area.&quot;</li>
      </ul>
      <p>
        Four questions, zero extractable facts. Nobody has ever asked an assistant &quot;why should I choose
        Acme,&quot; so question one can never be matched. Questions two through four match real queries and then
        supply an answer that cannot be quoted usefully — &quot;yes, absolutely&quot; is not information, and
        &quot;the greater metro area&quot; is not a place. An engine that fetches this page comes away with
        nothing, and pages that repeatedly yield nothing stop being selected.
      </p>
      <p>
        There is a second failure mode worth naming: the FAQ as a dumping ground. Twenty-five questions on one
        page, each answered in a sentence, covering everything from payment methods to company history. This
        dilutes the page&apos;s topical focus so much that it competes with itself — nothing on it is
        <em> about</em> anything in particular, so it is a weak match for every query.
      </p>

      <h2>How to write an FAQ entry that gets quoted</h2>
      <p>
        The rules are simple and almost nobody follows them.
      </p>
      <ol>
        <li>
          <strong>Use the question people actually ask, verbatim.</strong> Not &quot;Pricing information&quot; but
          &quot;How much does a 200 amp panel upgrade cost?&quot; Source these from your own inbox, your phone
          notes, and your sales calls — the real phrasing is always messier and more specific than the phrasing you
          would invent.
        </li>
        <li>
          <strong>Answer in the first sentence.</strong> Lead with the answer, then qualify. &quot;Most panel
          upgrades run $2,200–$4,500. The range widens when the mast and meter base need replacing…&quot; If your
          first sentence is throat-clearing, the quotable part is buried where extraction will not reach it.
        </li>
        <li>
          <strong>Keep each answer 40–120 words.</strong> Long enough to contain a real fact and its caveat, short
          enough to lift whole. Below that you have a slogan; above it you have an article that needs summarising.
        </li>
        <li>
          <strong>Make it standalone.</strong> No &quot;as mentioned above,&quot; no &quot;this,&quot; no
          &quot;we.&quot; Write each answer as if it will be read with no surrounding context, because it will be.
        </li>
        <li>
          <strong>Include a number, a name or a condition in every answer.</strong> If an answer contains no
          specific, delete the question — it is not a question, it is an advert.
        </li>
        <li>
          <strong>Answer the awkward ones.</strong> The questions you would rather not answer in writing — cost,
          how long it really takes, what you do not do, what goes wrong — are the highest-value entries, because
          they are the ones people ask assistants precisely <em>because</em> nobody publishes them.
        </li>
      </ol>

      <h2>Where the FAQ should live</h2>
      <p>
        This is where most sites go wrong structurally. A single sitewide <code>/faq</code> page collecting every
        question you have ever been asked is the weakest arrangement. Better:
      </p>
      <ul>
        <li>
          <strong>Put four to eight questions at the bottom of each service page</strong>, specific to that
          service. This concentrates topical signal — the page is about panel upgrades, and its FAQ is about panel
          upgrades — instead of diluting it.
        </li>
        <li>
          <strong>Give genuinely big questions their own page.</strong> If &quot;how much does X cost&quot; needs
          800 words, it is an article, not an FAQ entry. Write the article, and keep a short summary answer in the
          FAQ that links to it.
        </li>
        <li>
          <strong>Keep a sitewide FAQ only for genuinely cross-cutting things</strong> — payment, insurance,
          scheduling, service area — and keep it short.
        </li>
      </ul>
      <p>
        One practical note: if your FAQ answers are hidden inside an accordion that only injects text into the DOM
        after a click, verify that the answers are present in the raw HTML. Most accordion components ship the text
        and merely hide it with CSS, which is fine. Some fetch it on demand, which means several crawlers see the
        questions and none of the answers. Check with{" "}
        <code>curl -s https://yoursite.com/your-page | grep -c &quot;a phrase from an answer&quot;</code>, and see{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link> if it comes
        back zero.
      </p>

      <h2>Should you still add FAQPage schema?</h2>
      <p>
        It is cheap and low-risk, so yes — with realistic expectations. It will not produce a rich result for a
        typical business site any more. What it does is make the question-and-answer relationship explicit and
        machine-readable rather than inferred from your HTML structure, which is a small, real help to any system
        parsing your page. Follow Google&apos;s documented rules regardless: the marked-up content must be visible
        on the page, and the format is for genuine FAQ content, not for promotional copy dressed as questions.
      </p>
      <p>
        Do not mark up an FAQ that does not exist visibly, and do not stuff keywords into question headings. Both
        are content-quality problems that outlast any single search feature. Our{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup guide</Link> covers which types earn their
        keep.
      </p>

      <h2>How to tell whether yours is working</h2>
      <p>
        You cannot measure this in Search Console, because most of the value shows up in answers that never
        generate a click. What you can do:
      </p>
      <ol>
        <li>
          <strong>Ask the question yourself.</strong> Take an FAQ entry, paste the question into ChatGPT,
          Perplexity, Gemini and Claude with search enabled, and read the citation list. If your page is cited,
          the entry is doing its job. If a competitor or a directory is cited, read their answer and ask what it
          contains that yours does not — it is almost always a number.
        </li>
        <li>
          <strong>Repeat it several times.</strong> A single run is not a measurement; answers vary between
          identical prompts for reasons unrelated to you, as we explain in{" "}
          <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
        </li>
        <li>
          <strong>Watch referral traffic from assistant domains</strong> in your analytics. It will be small, but
          the trend and the landing pages tell you which answers are being surfaced —{" "}
          <Link href="/blog/how-to-track-ai-traffic-google-analytics">tracking AI traffic</Link> has the setup.
        </li>
      </ol>

      <h2>Questions we get asked</h2>

      <h3>Didn&apos;t Google say FAQ pages are spam?</h3>
      <p>
        No. Google reduced the FAQ rich result to a narrow set of sites, which is a display decision. It has never
        said question-and-answer content is bad, and its guidance continues to describe the markup for sites that
        qualify. What Google does discourage is FAQ content written purely to trigger a search feature — which is
        a fair complaint, and describes most of the FAQs written between 2019 and 2023.
      </p>

      <h3>How many questions should a page have?</h3>
      <p>
        Four to eight per service page. Enough to cover the real decision points, few enough that each one is
        substantive. If you find yourself padding to reach a number, stop — the padding questions are the ones that
        signal an empty page.
      </p>

      <h3>Can I generate FAQs with AI?</h3>
      <p>
        You can draft the structure with AI, but the specifics have to come from you, because the whole value of
        the format is the facts — your prices, your process, your constraints — and a model does not know those. A
        generated FAQ full of plausible generalities is precisely the low-information page that fails. See{" "}
        <Link href="/blog/does-ai-generated-content-hurt-ai-visibility">
          does AI-generated content hurt your AI visibility
        </Link>{" "}
        for where the line actually sits.
      </p>

      <h3>Will an FAQ get me recommended by ChatGPT?</h3>
      <p>
        On its own, no. An FAQ makes your existing facts extractable; it does not create authority, fix a site an
        engine cannot fetch, or override the third-party sources an engine trusts for your category. It is one of
        the highest-return formatting changes available, which is not the same as a strategy. And nobody can
        guarantee placement in an AI answer — AEO shapes the public signals engines read, it does not control their
        output.
      </p>

      <h2>The bottom line</h2>
      <p>
        The FAQ page lost its search-result reward and quietly gained a better one. For AI search, question-shaped
        headings with short, standalone, fact-carrying answers are the most directly extractable content you can
        write — a pre-chunked, pre-matched passage handed to a retrieval system that was going to have to build one
        anyway. The format is not the point, though. The facts are. An FAQ full of specifics is the cheapest AEO
        win on most sites; an FAQ full of &quot;yes, absolutely!&quot; is a page that teaches engines to skip you.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
