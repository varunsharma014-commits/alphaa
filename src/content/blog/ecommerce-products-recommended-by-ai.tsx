import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ecommerce-products-recommended-by-ai",
  title: "How Ecommerce Brands Get Their Products Recommended by AI",
  description:
    "AI assistants recommend products they can describe with specifics — price, materials, sizing, returns, warranty — sourced from your product pages, your feed, and third-party reviews. Here is the exact product-page and off-site setup we use to make a catalogue quotable.",
  date: "2026-08-03",
  readMins: 10,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including online
          stores, and compare what the engines say about their products versus their competitors&apos;. Last
          updated 3 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend the products they can describe with confident
        specifics — exact price, materials, dimensions, sizing, shipping and return terms — pulled live from
        product pages, structured product data, and third-party reviews. Ecommerce brands win AI
        recommendations by publishing those attributes as machine-readable facts on a crawlable page, and by
        being independently described in the places assistants retrieve from. A gorgeous product photo and a
        two-line poetic description are, to a retrieval system, an empty page.
      </p>

      <h2>Why product recommendations work differently from local recommendations</h2>
      <p>
        When someone asks an assistant &quot;who is the best plumber near me,&quot; the model needs one entity
        with consistent details. When someone asks &quot;what is a good waterproof merino base layer under
        $120,&quot; it needs something harder: a set of <em>constrained matches</em>. It has to satisfy a
        category, a material, a use case, and a price ceiling simultaneously, and every one of those
        constraints has to be verifiable in a retrieved document.
      </p>
      <p>
        That is the whole game for ecommerce. Most product queries carry filters — price, size, material,
        compatibility, dietary restriction, delivery speed. If your page does not state the attribute the
        filter is about, you are not excluded because the model dislikes you. You are excluded because you
        never entered the comparison. The competitor who listed &quot;merino/nylon blend, 190gsm, $98, ships
        free over $75&quot; is the one that can be named.
      </p>
      <p>
        This channel is no longer marginal. Traffic to retail sites from AI assistants grew over 1,200% in
        under a year, and those visitors convert better than traditional search traffic (Adobe Analytics,
        2025–26). Separately, 65% of consumers now use AI tools to research products before buying (Clutch,
        2026). The research step increasingly happens inside the assistant; the click is what is left over.
      </p>

      <h2>What an AI assistant actually reads on a product page</h2>
      <p>
        Run this test yourself before changing anything: open one of your best product pages, disable
        JavaScript in your browser, and read what remains. That stripped-down version is roughly what many
        crawlers get on first pass. On a lot of storefronts — especially heavily app-laden Shopify themes and
        headless React builds — price, variants, and reviews all vanish, because they are injected client-side
        after load. If those elements are gone, they are not part of the retrievable document. We cover the
        general failure mode in{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">
          JavaScript rendering and AI crawlers
        </Link>
        , and it hits ecommerce hardest, because the specifics that decide a recommendation are exactly the
        ones themes load dynamically.
      </p>
      <p>The attributes worth having in server-rendered HTML, in rough order of how often they decide a match:</p>
      <ul>
        <li>
          <strong>Price and currency</strong>, as text, not only inside a widget. Include the variant price
          range if variants differ.
        </li>
        <li>
          <strong>Availability</strong> — in stock, backordered, made to order, with lead time in days.
        </li>
        <li>
          <strong>Material, composition, weight, dimensions.</strong> Numbers, units, and named materials.
          &quot;Premium fabric&quot; is unusable; &quot;190gsm merino wool, 82% wool / 18% nylon&quot; is
          quotable.
        </li>
        <li>
          <strong>Sizing and fit</strong>, including a real size table and a plain sentence about whether it
          runs small.
        </li>
        <li>
          <strong>Compatibility or use case</strong> — what it fits, who it is for, what it is not for.
        </li>
        <li>
          <strong>Shipping, returns, warranty.</strong> Assistants get asked &quot;which of these has free
          returns?&quot; constantly, and will only answer for brands that state it.
        </li>
        <li>
          <strong>Review count and average rating</strong>, rendered in the page, not only in a third-party
          script.
        </li>
      </ul>

      <h2>The structured data layer</h2>
      <p>
        Schema.org <code>Product</code> markup is the machine-readable version of everything above, and for
        ecommerce it is not optional. A minimal useful implementation includes <code>name</code>,{" "}
        <code>description</code>, <code>brand</code>, <code>sku</code>, a <code>gtin</code> where one exists,
        an <code>image</code>, and an <code>offers</code> block containing <code>price</code>,{" "}
        <code>priceCurrency</code>, and <code>availability</code>. Add <code>aggregateRating</code> and{" "}
        <code>review</code> only when they reflect genuine reviews you actually collected — inventing them is
        both a policy violation and, more practically, a fast route to being contradicted by a review site.
      </p>
      <p>
        Two details we see broken constantly in audits. First, the marked-up price must match the visible
        price; when a sale price renders in the DOM but stale markup says otherwise, you have handed the
        retrieval layer a contradiction, and contradictions produce hedging. Second, variants need their own
        addressable pages or a properly modelled <code>ProductGroup</code>; otherwise &quot;does it come in
        wide?&quot; has no document to resolve against. The broader mechanics are in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>
      <p>
        Keep the merchant feed consistent with the page, too. If your Google Merchant Center or Shopping feed
        says one price and the page says another, you are the unreliable source in a comparison where
        reliability is the selection criterion.
      </p>

      <h2>The off-site half nobody wants to do</h2>
      <p>
        Here is the uncomfortable part: assistants rarely recommend a product on the strength of the brand&apos;s
        own page alone. Product queries pull heavily from independent sources — review sites, roundups,
        forums, subreddits, YouTube teardowns, and buyer&apos;s guides — because a page selling something is a
        biased witness about it. When we scan a store that is invisible to AI, the on-site fixes usually take a
        week and the off-site gap is the real reason.
      </p>
      <p>Practical, honest ways to close it:</p>
      <ul>
        <li>
          <strong>Get into category roundups.</strong> &quot;Best X for Y&quot; articles are what assistants
          retrieve for shortlist queries. See{" "}
          <Link href="/blog/get-into-ai-best-of-lists">how to get into the best-of lists AI recommends from</Link>{" "}
          for the outreach approach.
        </li>
        <li>
          <strong>Collect reviews on platforms with public, crawlable pages</strong> — not only an on-site
          widget whose contents never appear in HTML.
        </li>
        <li>
          <strong>Be present where your category is discussed.</strong> Genuine participation in the relevant
          subreddit or forum, not astroturfing; the engines read those threads and so do humans who will call
          out fakes.
        </li>
        <li>
          <strong>Publish specification pages worth citing</strong> — a materials guide, a real sizing
          methodology, a care and repair page. These get quoted, and quoted pages carry your brand name with
          them.
        </li>
      </ul>

      <h2>A two-week worked sequence</h2>
      <ol>
        <li>
          <strong>Days 1–2.</strong> Pick your ten highest-margin products. For each, ask ChatGPT, Claude,
          Gemini, and Perplexity the buyer query you actually want to win, phrased with a real constraint.
          Record who gets named. This is your baseline.
        </li>
        <li>
          <strong>Days 3–4.</strong> View-source each of the ten pages. List which of the attributes above are
          missing from the raw HTML. Expect price and reviews to be the common casualties.
        </li>
        <li>
          <strong>Days 5–8.</strong> Fix the template once rather than the pages ten times: server-render
          price, availability, specs, and rating, and add or repair <code>Product</code> schema. Reconcile the
          feed.
        </li>
        <li>
          <strong>Days 9–12.</strong> Write the specifics your category&apos;s buyers filter on into the
          product copy — a short, factual spec paragraph above the fold beats another adjective.
        </li>
        <li>
          <strong>Days 13–14.</strong> Send five roundup pitches and set up a post-purchase review request on
          a public platform.
        </li>
      </ol>
      <p>
        Then re-run the same queries monthly with the same wording. Answers vary between runs by design, so
        judge the trend across several runs rather than any single result — the reasons are in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>

      <h2>Questions store owners ask us</h2>
      <h3>Can I pay to have my product recommended?</h3>
      <p>
        Not in the organic answer. Assistants surface products from retrieval and training, and no vendor can
        insert your SKU into a model&apos;s output. Some platforms are building separate, labelled ad and
        shopping surfaces; those are advertising, and distinct from being recommended in the answer text.
        Anyone selling guaranteed placement in the answer itself is selling something they cannot deliver.
      </p>
      <h3>How long does it take?</h3>
      <p>
        In our experience, technical fixes — rendering and schema — can change what an assistant is able to say
        about a product within days to a few weeks, because live retrieval reads the current page. Off-site
        evidence moves on the timescale of the publications and reviewers involved, which is months. We cannot
        promise a citation on any timeline, and neither can anyone else.
      </p>
      <h3>Does this help traditional SEO too?</h3>
      <p>
        Yes, largely the same work. Server-rendered specs, accurate <code>Product</code> markup, and real
        reviews have been product-SEO fundamentals for a decade. AI retrieval raised the penalty for skipping
        them.
      </p>

      <h2>The bottom line</h2>
      <p>
        Ecommerce AI visibility is mostly a specificity problem wearing a technology costume. The assistant is
        not judging your brand; it is filling in a comparison table, and it can only use cells you filled in
        first. Publish the numbers, make them survive with JavaScript off, mark them up honestly, keep the feed
        in agreement, and get described by someone other than yourself.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
