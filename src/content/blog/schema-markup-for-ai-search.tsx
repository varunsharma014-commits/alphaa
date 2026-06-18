import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "schema-markup-for-ai-search",
  title: "Schema Markup for AI Search: A Practical Guide (With Examples)",
  description:
    "What schema markup (JSON-LD) is, why it matters for AI search, and copy-paste examples for LocalBusiness, FAQPage, and Organization — plus where to place and how to validate it.",
  date: "2026-06-17",
  readMins: 8,
  tag: "Technical Guide",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> schema markup is structured data — usually written as JSON-LD — that
        you add to your web pages to state your facts in a format machines can read directly. It tells search
        engines and AI assistants exactly what your business is, where it operates, and what it offers, instead
        of forcing them to guess from your page text. It doesn&apos;t guarantee you&apos;ll be cited, but it
        makes your facts consistent and verifiable — the qualities AI engines favor when they decide what to
        trust and repeat.
      </p>

      <h2>What is schema markup (and JSON-LD)?</h2>
      <p>
        Schema markup is a shared vocabulary defined at{" "}
        <a href="https://schema.org" target="_blank" rel="noopener noreferrer">schema.org</a> — a standard
        backed by Google, Microsoft, Yahoo, and Yandex — for describing things on the web: businesses,
        products, articles, events, people, FAQs, and more. <strong>JSON-LD</strong> (JavaScript Object
        Notation for Linked Data) is the recommended way to write it: a small block of structured JSON you
        drop into your page. It doesn&apos;t change how the page looks to humans — it&apos;s a hidden,
        machine-readable summary of the same facts.
      </p>
      <p>
        Without schema, a crawler reads &quot;Open Mon–Fri, call us at 555-0100&quot; as ordinary prose and
        has to infer what it means. With schema, the same facts are labelled: this is the
        <code> telephone</code>, these are the <code>openingHours</code>, this is the{" "}
        <code>address</code>. Nothing is left to interpretation.
      </p>

      <h2>Why it matters for AI search</h2>
      <p>
        AI assistants like ChatGPT, Perplexity, and Google&apos;s AI overviews answer questions by retrieving
        sources and summarizing them. When they assemble an answer, they lean on facts that are{" "}
        <em>explicit</em>, <em>consistent</em>, and <em>verifiable</em>. Schema markup feeds all three:
      </p>
      <ul>
        <li>
          <strong>Explicit:</strong> your name, address, phone, hours, and services are labelled, not buried
          in sentences an engine has to parse.
        </li>
        <li>
          <strong>Consistent:</strong> the same machine-readable facts appear on your site and can match your
          Google Business Profile, directories, and other listings — reducing the contradictions that make AI
          hedge or omit you.
        </li>
        <li>
          <strong>Verifiable:</strong> structured data is easy to cross-check, so an engine has more
          confidence stating your details in an answer.
        </li>
      </ul>
      <p>
        To be clear: schema is not a ranking trick and it does not guarantee citations. What it does is remove
        ambiguity, so that when an AI engine does reach for your information, it gets the right facts. It works
        alongside the other things that matter — see{" "}
        <Link href="/blog/what-is-answer-engine-optimization">what answer engine optimization is</Link> for the
        bigger picture.
      </p>

      <h2>Example 1 — LocalBusiness</h2>
      <p>
        If you serve customers in a specific area, <code>LocalBusiness</code> (or a more specific subtype like{" "}
        <code>Plumber</code>, <code>Dentist</code>, or <code>Restaurant</code>) is the most important schema to
        get right. It states your name, location, contact details, and hours unambiguously:
      </p>
      <pre><code>{`{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Riverside Plumbing Co.",
  "image": "https://www.riversideplumbing.com/storefront.jpg",
  "url": "https://www.riversideplumbing.com",
  "telephone": "+1-555-0100",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "120 Market Street",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 30.2672,
    "longitude": -97.7431
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "08:00",
      "closes": "18:00"
    }
  ]
}`}</code></pre>
      <p>
        Use the most specific <code>@type</code> that fits your business, and make sure the values match what
        you publish everywhere else (especially your Google Business Profile). A mismatched phone number or
        address is exactly the kind of inconsistency that erodes trust.
      </p>

      <h2>Example 2 — FAQPage</h2>
      <p>
        An <code>FAQPage</code> turns your questions and answers into structured pairs. This is well suited to
        AI search because the question-and-answer shape mirrors how people prompt assistants — and your answer
        is already written in a directly quotable form. Only mark up Q&amp;As that genuinely appear on the page
        for users:
      </p>
      <pre><code>{`{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do you offer emergency plumbing service?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We provide 24/7 emergency plumbing across the Austin area, with same-day response for burst pipes and major leaks."
      }
    },
    {
      "@type": "Question",
      "name": "What areas do you serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We serve Austin and surrounding communities including Round Rock, Cedar Park, and Pflugerville."
      }
    }
  ]
}`}</code></pre>
      <p>
        Keep answers accurate and self-contained. An assistant may lift a single answer verbatim, so each one
        should make sense on its own.
      </p>

      <h2>Example 3 — Organization</h2>
      <p>
        For a company that isn&apos;t tied to a single physical location, <code>Organization</code> describes
        the entity itself — its name, logo, and the official profiles that confirm who you are. The{" "}
        <code>sameAs</code> array is especially valuable: it links your site to your authoritative profiles
        elsewhere, helping engines connect the dots and confirm your identity.
      </p>
      <pre><code>{`{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Alphaa",
  "url": "https://www.alphaa.ai",
  "logo": "https://www.alphaa.ai/logo.png",
  "description": "An answer engine optimization platform that helps businesses get found and recommended by AI assistants.",
  "sameAs": [
    "https://www.linkedin.com/company/alphaa",
    "https://x.com/alphaa"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "hello@alphaa.ai"
  }
}`}</code></pre>
      <p>
        If you sell a specific product, <code>Product</code> works the same way — describe the{" "}
        <code>name</code>, <code>description</code>, <code>brand</code>, and (if relevant){" "}
        <code>offers</code> and <code>aggregateRating</code> — but only include a rating if it reflects real
        reviews shown on the page. Inventing ratings is both against the guidelines and the kind of thing that
        gets you distrusted.
      </p>

      <h2>Where to place the markup</h2>
      <p>
        JSON-LD goes inside a <code>script</code> tag with the type{" "}
        <code>application/ld+json</code>. The recommended spot is the page&apos;s <code>head</code>, though
        engines also read it in the <code>body</code>. It looks like this:
      </p>
      <pre><code>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Riverside Plumbing Co."
}
</script>`}</code></pre>
      <ul>
        <li>
          <strong>WordPress:</strong> a plugin like Yoast or Rank Math generates much of this automatically;
          you can also add custom JSON-LD in your theme header.
        </li>
        <li>
          <strong>Next.js / custom sites:</strong> render the JSON-LD in a <code>script</code> tag in your
          page or layout. Put the markup on the page whose facts it describes — your homepage or contact page
          for <code>LocalBusiness</code>, your FAQ page for <code>FAQPage</code>.
        </li>
        <li>
          <strong>Squarespace / Wix / Webflow:</strong> use a code-injection or embed block to paste the{" "}
          <code>script</code> into the page or site header.
        </li>
      </ul>
      <p>
        One <code>@type</code> per block is cleanest. You can include several scripts on a page if it
        legitimately represents multiple things (for example, an <code>Organization</code> block and an{" "}
        <code>FAQPage</code> block).
      </p>

      <h2>How to validate it</h2>
      <p>
        Always test before you ship — a typo can silently break the whole block. Two free tools:
      </p>
      <ul>
        <li>
          <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">
            Google&apos;s Rich Results Test
          </a>{" "}
          — paste a URL or code and it reports which structured-data types it detected and flags errors and
          warnings relevant to Google.
        </li>
        <li>
          <a href="https://validator.schema.org" target="_blank" rel="noopener noreferrer">
            the Schema.org Validator
          </a>{" "}
          — checks your markup against the schema.org vocabulary itself, independent of any one search engine.
        </li>
      </ul>
      <p>
        Run both. The first tells you how Google reads it; the second confirms the markup is technically valid.
        Fix every error and review the warnings, then re-test until it&apos;s clean.
      </p>

      <h2>A realistic bottom line</h2>
      <p>
        Schema markup won&apos;t single-handedly get you recommended by AI. But it removes guesswork: it states
        your facts in the precise, consistent, verifiable form that AI engines reward. Pair it with an accurate
        Google Business Profile, clear content, and consistent listings, and you give every engine — search or
        AI — the same trustworthy story about your business.
      </p>

      <hr />
      <p>
        <strong>Not sure how AI engines currently see your business?</strong> Alphaa checks your schema, your
        profiles, and the other signals AI assistants read — then shows you exactly what to fix.{" "}
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
