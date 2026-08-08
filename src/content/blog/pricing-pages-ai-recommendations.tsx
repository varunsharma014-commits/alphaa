import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "pricing-pages-ai-recommendations",
  title: "Should You Publish Your Prices? How Pricing Pages Shape AI Recommendations",
  description:
    "AI assistants answer \"how much does X cost\" whether or not you publish a price — they just use someone else's number. Here is what a quotable pricing page looks like, how to publish ranges honestly, and when hiding price actually costs you the recommendation.",
  date: "2026-08-08",
  readMins: 10,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and read the raw engine
          responses, including the ones where a competitor&apos;s price gets quoted instead of our customer&apos;s.
          Last updated 8 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes — in most categories you should publish something, because the AI
        assistant is going to answer the cost question either way. When your site has no price, the model does
        not say &quot;unknown&quot; and stop; it reaches for whatever number it <em>can</em> retrieve — a
        directory estimate, a competitor&apos;s posted rate, an old forum thread, a national average that has
        nothing to do with your market. Publishing a specific, honestly-qualified range is how you make your
        number the retrievable one. The exception is genuinely bespoke work, where the right move is publishing
        the <em>structure</em> of your pricing rather than a figure.
      </p>

      <h2>Why price is the question AI gets asked most</h2>
      <p>
        Buyers do not ask assistants &quot;who is the best roofer.&quot; They ask &quot;how much does it cost to
        replace a roof in Tampa,&quot; &quot;what do bookkeepers charge for a small business,&quot; &quot;is
        $4,000 reasonable for Invisalign.&quot; Cost is the constraint that makes the rest of the search real,
        so it shows up early and it shows up constantly.
      </p>
      <p>
        That matters because of how the answer is assembled. Modern assistants use retrieval-augmented
        generation: at the moment you ask, they pull live documents from the web, read them, and synthesize a
        response from what those documents actually say. A number that exists as plain text on a crawlable page
        is trivially retrievable. A number that lives behind a &quot;request a quote&quot; form does not exist
        to the retrieval step at all. If you want the mechanism in full, see{" "}
        <Link href="/blog/is-aeo-real">is AEO real</Link>.
      </p>

      <h2>What actually happens when you publish nothing</h2>
      <p>
        Run the experiment yourself — it takes two minutes and it is more convincing than any argument here. Ask
        ChatGPT, Gemini and Perplexity what your service costs in your city, phrased the way a customer would.
        In our scans, the pattern is consistent enough to predict:
      </p>
      <ul>
        <li>
          <strong>A competitor gets quoted by name.</strong> Whoever published a number becomes the concrete
          anchor, and often the recommendation attached to it.
        </li>
        <li>
          <strong>A national average stands in for your market.</strong> Frequently sourced from a home-services
          or cost-estimator directory, and frequently wrong for your area by a wide margin.
        </li>
        <li>
          <strong>You get described as opaque.</strong> Answers include hedges like &quot;they don&apos;t list
          pricing publicly; you&apos;ll need to contact them,&quot; which reads to a buyer as friction next to a
          competitor whose range is right there.
        </li>
      </ul>
      <p>
        None of those outcomes is the engine being unfair. Each one is the engine doing exactly what it is built
        to do — answer from available evidence — with your evidence missing.
      </p>

      <h2>What a quotable pricing page looks like</h2>
      <p>
        &quot;Quotable&quot; is the operative word. A model lifting an answer needs a self-contained sentence
        that survives being pulled out of its page. Compare:
      </p>
      <ul>
        <li>
          <strong>Not quotable:</strong> &quot;Our pricing is competitive and tailored to your needs. Contact us
          for a free consultation.&quot; Nothing here can be extracted.
        </li>
        <li>
          <strong>Quotable:</strong> &quot;A standard asphalt-shingle roof replacement on a 1,800–2,200 sq ft
          single-storey home in the Tampa area runs $11,000–$16,500 as of August 2026, including tear-off and
          disposal. Steep pitches, multiple layers, or decking repair add roughly 10–20%.&quot;
        </li>
      </ul>
      <p>The second version works because it carries five things a model needs to use it confidently:</p>
      <ul>
        <li>
          <strong>A unit.</strong> Per job, per hour, per month, per square foot — the number is meaningless
          without it.
        </li>
        <li>
          <strong>A scope.</strong> What is included, and what is not.
        </li>
        <li>
          <strong>A qualifier.</strong> The conditions under which the range holds, and what pushes it up.
        </li>
        <li>
          <strong>A location.</strong> Cost questions are almost always local; an unlocated price is a weak
          match for a located question.
        </li>
        <li>
          <strong>A date.</strong> Assistants weigh freshness heavily on cost claims, and a stale price is a
          liability. See <Link href="/blog/content-freshness-ai-search">how freshness works in AI search</Link>.
        </li>
      </ul>

      <h3>Put it in text, not in an image</h3>
      <p>
        This is the most common self-inflicted wound we see. Pricing tables exported as PNGs, price lists baked
        into a hero graphic, rates that only appear inside a PDF menu — none of that reliably reaches the
        retrieval step. The same applies to prices that only render after a JavaScript-driven interaction, like
        a slider or a tabbed calculator with no server-rendered default; see{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link> for why.
        Ship the numbers as real HTML text on the page.
      </p>

      <h3>Mark it up with schema where it fits</h3>
      <p>
        For products and defined services, <code>Offer</code> and <code>PriceSpecification</code> in your
        JSON-LD give the price a machine-readable form alongside the prose — including{" "}
        <code>priceCurrency</code>, <code>price</code> or <code>minPrice</code>/<code>maxPrice</code>, and{" "}
        <code>validThrough</code>. Schema is a clarity aid, not a ranking lever: it disambiguates what the number
        means. Only mark up prices that genuinely appear on the page — mismatched markup is a trust problem, not
        a shortcut. Our <Link href="/blog/schema-markup-for-ai-search">schema guide</Link> covers the setup.
      </p>

      <h2>When your work really is bespoke</h2>
      <p>
        Plenty of businesses cannot post a single number honestly — a litigation practice, a custom fabricator,
        an agency scoping six-month engagements. Publishing a fake-precise figure there would be worse than
        silence. But &quot;no fixed price&quot; is not the same as &quot;no information,&quot; and the
        information is what gets retrieved. Publish the structure instead:
      </p>
      <ul>
        <li>
          <strong>The model.</strong> Hourly, retainer, fixed-fee, contingency, percentage of spend, per-seat.
          Say which one you use.
        </li>
        <li>
          <strong>The floor.</strong> &quot;Our smallest engagements start at $6,000&quot; is honest,
          self-qualifying, and enormously useful to a buyer deciding whether to call.
        </li>
        <li>
          <strong>The drivers.</strong> The three or four variables that actually move the number, in plain
          language.
        </li>
        <li>
          <strong>A worked example.</strong> One anonymised, representative engagement with its real shape:
          scope, duration, and what it came to. This is the single most quotable asset a bespoke business can
          publish.
        </li>
      </ul>

      <h2>The honest caveats</h2>
      <p>
        Publishing a price does not guarantee you get recommended, and nobody can promise that it will —
        assistants weigh many signals, answers vary between engines and between runs of the same engine, and
        pricing is one input among reviews, third-party coverage and entity consistency. Two real trade-offs
        deserve naming. First, competitors can read your prices — though in most local categories they already
        can, via quotes customers share. Second, a published price you do not honour is far more damaging than
        no price at all, because it converts a marketing decision into a trust failure. If a number changes,
        change it on the page the same week.
      </p>

      <h2>A 30-minute version you can do today</h2>
      <ol>
        <li>Ask three assistants what your main service costs in your city. Save the answers.</li>
        <li>
          Note who got quoted and what number stood in for yours. That gap is the brief.
        </li>
        <li>
          Write one paragraph per core service, each carrying unit, scope, qualifier, location and date.
        </li>
        <li>Publish it as HTML text on a page linked from your main navigation — not a PDF, not an image.</li>
        <li>Add the same range to your Google Business Profile services and your top directory listings.</li>
        <li>Re-run the three questions in three to four weeks and compare.</li>
      </ol>

      <h2>The bottom line</h2>
      <p>
        The cost question gets answered with or without you. Publishing a specific, qualified, dated range is
        how you make sure the answer is yours rather than a stranger&apos;s guess — and it is one of the few AEO
        moves that also does obvious work for the human reading the page.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
