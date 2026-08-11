import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "do-ai-engines-read-pdfs-images",
  title: "Do AI Engines Read PDFs, Menus and Images? What Actually Gets Extracted",
  description:
    "AI assistants read PDFs reasonably well and images barely at all. If your menu, price list, service area or hours only exist inside a JPG or a scanned PDF, the engines answering questions about you are working from an incomplete picture. Here is what gets extracted, what does not, and how to fix it.",
  date: "2026-08-11",
  readMins: 11,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of local businesses and inspect what
          the engines actually retrieve from their sites. Last updated 11 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> PDFs usually get read. Images usually do not. Text-layer PDFs are
        crawled, parsed and cited much like web pages, so a price list or brochure in PDF form can end up in an
        AI answer. A photograph of that same price list is, to most retrieval pipelines, an opaque file with a
        filename and maybe some alt text. Scanned PDFs sit in between and are unreliable. If a fact about your
        business exists only inside pixels — the menu, the hours sign, the service-area map, the rate card —
        assume the assistants answering questions about you do not have it.
      </p>

      <h2>Why the distinction exists at all</h2>
      <p>
        It is tempting to assume that because ChatGPT, Claude and Gemini are all multimodal — they can look at
        an image you upload — they must also look at the images on your website. They are two different
        systems. The model can see pixels when a user hands it pixels. The <em>retrieval</em> layer that fetches
        pages when someone asks &quot;what does this business charge?&quot; is a search-and-fetch pipeline, and
        that pipeline is built around text.
      </p>
      <p>
        Concretely, when an assistant answers a question about your business it typically runs a search, pulls
        back a handful of URLs, extracts the text of those documents, and writes an answer grounded in the
        extracted text. Running vision inference on every image on every fetched page would be enormously more
        expensive than reading the HTML, and it is not what these pipelines do at scale. What survives the
        extraction step is what the model gets to use. The same principle governs{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript-rendered content</Link>: it is not a
        question of whether a model <em>could</em> understand it, but whether it ever arrives.
      </p>

      <h2>What actually gets extracted, format by format</h2>

      <h3>HTML text — fully extracted</h3>
      <p>
        Server-rendered text in the page body is the gold standard. It is cheap to fetch, trivially parsed,
        and directly quotable. Everything you want an engine to be able to say about you should exist here in
        some form, even if a prettier version exists elsewhere.
      </p>

      <h3>Text-layer PDFs — usually extracted, sometimes cited</h3>
      <p>
        A PDF exported from Word, Google Docs, InDesign or a web page carries a real text layer. Search engines
        have indexed these for two decades and AI crawlers parse them too. In scans we regularly see PDFs turn
        up as cited sources — annual reports, service brochures, fee schedules, council documents. The caveats
        are real, though: PDFs are re-crawled less often than HTML pages, they carry no internal navigation the
        crawler can follow onward, their titles are often garbage (&quot;Untitled-2 final FINAL v3&quot;), and
        multi-column layouts scramble into confusing reading orders when extracted. A PDF is a usable source,
        not a good one.
      </p>

      <h3>Scanned PDFs — unreliable</h3>
      <p>
        A scanned document is images wrapped in a PDF container. Whether any text comes out depends entirely on
        whether an OCR pass ran, and you have no control over and no visibility into that. Treat scanned PDFs
        as invisible until proven otherwise. The two-second test: open the file and try to select a sentence
        with your cursor. If nothing highlights, there is no text layer.
      </p>

      <h3>Images — effectively not extracted</h3>
      <p>
        The text inside a JPG or PNG is not available to the retrieval layer. What <em>is</em> available is the
        surrounding HTML: the <code>alt</code> attribute, the filename, the caption, nearby headings and body
        copy. That is a description of the image, not its contents — a 40-item menu cannot be reconstructed
        from <code>alt=&quot;Our menu&quot;</code>.
      </p>

      <h3>Embedded widgets and iframes — usually not extracted</h3>
      <p>
        Third-party booking widgets, embedded PDF viewers, review carousels and menu platforms load their
        content from another origin after the page loads. The crawler fetches your page and gets a container
        with nothing in it. This is why a restaurant whose menu lives in an embedded viewer and a clinic whose
        hours live in a booking widget both look, to an engine, like businesses that never published a menu or
        their hours.
      </p>

      <h3>SVG and HTML tables — extracted better than people expect</h3>
      <p>
        SVG text is real text in the markup and generally survives extraction. Plain HTML tables extract
        cleanly and are one of the most quotable structures you can publish — a two-column table of service and
        starting price is close to ideal input for an answer engine.
      </p>

      <h2>The failure we see most often</h2>
      <p>
        The single most common version of this problem in our scans is a business whose most decision-relevant
        information — the exact thing a customer asks an assistant about — exists only as an image. A few real
        shapes of it:
      </p>
      <ul>
        <li>
          A restaurant with a beautifully designed menu uploaded as a photo. Ask an assistant &quot;do they
          have gluten-free options?&quot; and it cannot say, so it names a competitor whose menu is HTML. This
          is a large part of why{" "}
          <Link href="/blog/ai-recommendations-for-restaurants">restaurant AI visibility</Link> is so uneven.
        </li>
        <li>
          A contractor whose service area is a map graphic. The engine knows the city the business is in and
          nothing about the twelve suburbs it serves, so every &quot;near me&quot; question in those suburbs
          resolves to someone else.
        </li>
        <li>
          A clinic with holiday hours posted as a graphic. The assistant confidently states the regular hours
          it found in structured data, and the customer arrives at a closed door.
        </li>
        <li>
          A studio whose entire price list is a PDF rate card with no HTML equivalent. Better than an image,
          but the PDF is stale, re-crawled rarely, and the numbers in AI answers lag reality by months. We
          cover the general case in{" "}
          <Link href="/blog/pricing-pages-ai-recommendations">how pricing pages shape AI recommendations</Link>.
        </li>
      </ul>
      <p>
        In every case the business believes it has published the information. It has — for humans. The machine
        reading the page sees a heading, a paragraph of marketing copy, and a file it cannot open.
      </p>

      <h2>The fix, in the order we do it</h2>
      <p>
        This is a couple of hours of unglamorous work and it is often the highest-return change on the whole
        site.
      </p>
      <ul>
        <li>
          <strong>1. Audit what a text-only reader sees.</strong> Open your key pages with images and
          JavaScript disabled, or view the page source and read only what is between the tags. Anything a
          customer needs that is missing from that view is a gap. Do this for your menu or services page,
          pricing, hours and contact, and your service-area page.
        </li>
        <li>
          <strong>2. Give every image-only fact an HTML twin.</strong> Keep the pretty graphic. Add the same
          information as real text on the same page — a list, a table, a paragraph. You are not replacing the
          design, you are adding a machine-readable copy underneath it. This alone closes most of the gap.
        </li>
        <li>
          <strong>3. Convert critical PDFs into pages.</strong> If a PDF is the only home of something people
          ask about — fees, services, eligibility, specifications — publish an HTML version and link the PDF
          from it rather than the other way around. The HTML page gets crawled more often, can be updated in
          seconds, and can link onward to the rest of your site.
        </li>
        <li>
          <strong>4. Un-embed what you can.</strong> Where a third-party widget holds important content, put a
          plain-text summary next to it. The widget stays for booking; the text carries the facts.
        </li>
        <li>
          <strong>5. Write alt text that states facts, not decoration.</strong> Alt text will not carry a full
          menu, but &quot;Emergency callout rate card: $149 diagnostic, waived if you book the repair&quot; is
          strictly more useful than &quot;pricing image&quot;. Write it for a person who cannot see the image,
          which is exactly what the crawler is.
        </li>
        <li>
          <strong>6. Mirror it in structured data.</strong> Hours, price ranges, menus and services all have
          schema types. Structured data is the most reliable way to hand a fact to a machine without relying on
          prose extraction — see{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
        </li>
        <li>
          <strong>7. Re-ask the assistants a month later.</strong> Ask ChatGPT, Perplexity and Gemini the
          specific question the image used to answer. If the answer now matches your page, the extraction gap
          was the problem.
        </li>
      </ul>

      <h2>Questions we get asked</h2>

      <h3>Should I stop using PDFs entirely?</h3>
      <p>
        No. PDFs are fine for things that are genuinely documents — reports, forms, specification sheets,
        anything meant to be printed or archived. The rule is that a PDF should never be the <em>only</em> place
        a customer-facing fact lives. Publish the fact in HTML; offer the PDF as a download.
      </p>

      <h3>Does this hurt my Google rankings too, or only AI answers?</h3>
      <p>
        Both, for the same underlying reason, though AI answers are less forgiving. Google has decades of
        infrastructure for guessing at images and can lean on your Google Business Profile for hours and
        location. An assistant composing a paragraph from a handful of retrieved documents has far less to fall
        back on — if the fact is not in the extracted text, it usually does not appear in the answer.
      </p>

      <h3>What about images the model can see — do they ever help?</h3>
      <p>
        Yes, in the situations where a user hands the image over directly: someone photographs your storefront
        sign and asks what it is, or uploads your brochure and asks a question about it. That is a real and
        growing path, and it is a reason to keep visual assets clear and legible. It is not, however, the path
        that decides whether you get named when someone asks &quot;who should I call?&quot; — that one runs on
        retrieved text.
      </p>

      <h3>Will fixing this get me recommended?</h3>
      <p>
        Honestly: it removes a reason you are being left out, which is not the same as being chosen. If an
        assistant cannot confirm you offer the thing being asked about, you are excluded before any judgment
        about quality happens. Making your facts machine-readable puts you into the candidate set. Reviews,
        third-party corroboration and genuine specificity decide what happens next. Nobody can guarantee a
        recommendation, and you should be wary of anyone who says otherwise.
      </p>

      <h2>The bottom line</h2>
      <p>
        Answer engines can only recommend what they can read. A design decision made for humans — put the menu
        in the pretty graphic, put the rate card in the PDF — quietly removes your most persuasive information
        from the only version of your site a machine ever sees. The fix is not a redesign. It is a text twin
        for every fact that currently lives in pixels, and it usually takes an afternoon.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
