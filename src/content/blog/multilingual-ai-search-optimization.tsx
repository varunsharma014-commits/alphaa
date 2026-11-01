import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "multilingual-ai-search-optimization",
  title: "Multilingual AI Search Optimization: A 2026 Guide",
  description:
    "How to get recommended by ChatGPT, Gemini and Perplexity in more than one language: separate URLs, hreflang, local facts and reviews, step by step for 2026.",
  subtitle:
    "To be recommended in another language, publish a real page in that language at its own URL, link the versions with hreflang, and make your facts match in every language.",
  date: "2026-11-01",
  updated: "2026-11-01",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "multilingual ai search optimization",
  image: {
    src: "/blog/multilingual-ai-search-optimization.webp",
    alt: "A brass desk globe beside a stack of blank cream card bundles tied with ribbons in different colours.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI assistants can only cite a page in a customer's language if that page exists at a URL they can fetch.",
    "Google says it detects a page's language from its visible content, not from lang attributes or the URL.",
    "Each language version needs its own URL, and hreflang tags only work when every version links to every other.",
    "Google announced AI Overviews in more than 40 languages and over 200 countries and territories in May 2025.",
    "Keep the name, address, phone, prices and services identical across every language version and listing.",
  ],
  sources: [
    {
      title: "Managing Multi-Regional and Multilingual Sites",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites",
    },
    {
      title: "Localized Versions of your Pages",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/specialty/international/localized-versions",
    },
    {
      title: "How Google Crawls Locale-Adaptive Pages",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages",
    },
    {
      title: "AI Overviews expand to over 200 countries and territories, more than 40 languages",
      publisher: "Google",
      url: "https://blog.google/products/search/ai-overview-expansion-may-2025-update/",
    },
    {
      title: "availableLanguage - Schema.org Property",
      publisher: "Schema.org",
      url: "https://schema.org/availableLanguage",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Multilingual AI search optimization means giving AI assistants a real page in
        each language your customers ask in. Publish every language at its own URL, link the versions with hreflang,
        write the content natively rather than as a thin translation, and keep your business facts identical across
        languages. An engine cannot recommend you in Spanish from an English-only page.
      </p>

      <p>
        This guide is for businesses whose customers ask ChatGPT, Gemini, Claude or Perplexity in more than one
        language: a clinic serving Spanish and English speakers, a hotel taking bookings from abroad, a shop selling
        into several countries. It covers the technical setup, the content, and the off-site signals, in that order.
      </p>

      <h2>Why does language matter for AI search?</h2>
      <p>
        Language matters because AI assistants answer in the language of the question and draw on sources that
        match it, so a business with no content in that language has little for the engine to cite. When someone
        asks in Portuguese for a dentist who takes walk-ins, the assistant searches, reads what it finds, and writes
        a Portuguese answer. Pages that exist in Portuguese and say the right things are the easiest to use.
      </p>
      <p>
        The reach is already wide. In May 2025 Google announced that{" "}
        <a href="https://blog.google/products/search/ai-overview-expansion-may-2025-update/" {...ext}>
          AI Overviews had expanded to more than 200 countries and territories and more than 40 languages
        </a>
        , adding Arabic, Chinese, Malay and Urdu among others. For a business with customers outside its main
        language, that means AI answers are being written in their language whether or not you have content for
        them.
      </p>

      <h2>How do AI engines tell what language a page is in?</h2>
      <p>
        Search engines decide a page&apos;s language mainly from its visible text, so a page has to actually be
        written in that language to count. Google is explicit about this in{" "}
        <a
          href="https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites"
          {...ext}
        >
          Managing Multi-Regional and Multilingual Sites
        </a>
        : it uses the visible content of the page and does not use code-level signals such as the lang attribute or
        the URL to determine language.
      </p>
      <p>
        Two consequences follow. A page with a translated menu and footer but English body text is still an English
        page. And Google recommends one language per page, because mixing languages makes the page harder to match to
        anyone. The AI engines that ground answers in search results, which is most of them for local and commercial
        questions, inherit these decisions from the indexes they search. Our explainer on{" "}
        <Link href="/blog/training-data-vs-live-retrieval-ai-search">training data vs live retrieval</Link> covers why
        the search index matters so much.
      </p>

      <h2>How do you set up a multilingual site for AI search, step by step?</h2>
      <p>
        There are seven steps, starting with giving each language its own URL and ending with checking what the
        assistants say in each language. Do them in order; the later steps depend on the earlier ones.
      </p>
      <ol>
        <li>
          <strong>Give each language its own URL.</strong> Use subdirectories such as /es/ and /fr/, subdomains, or
          country domains. Google does not recommend URL parameters, and it advises against switching language with
          cookies or browser settings on a single URL.
        </li>
        <li>
          <strong>Do not auto-redirect by language or location.</strong> Google says automatic redirects between
          language versions can stop users and search engines from seeing all versions. Offer a visible language
          switcher instead.
        </li>
        <li>
          <strong>Add hreflang annotations.</strong> In the HTML head, HTTP headers or the sitemap, list every
          language version on every version, including the page itself, with fully qualified URLs. Add an x-default
          for visitors whose language you do not cover.
        </li>
        <li>
          <strong>Translate the whole page, not the template.</strong> Headings, body copy, FAQs, prices, opening
          hours and calls to action all need to be in the target language.
        </li>
        <li>
          <strong>Localise the facts.</strong> Use the local currency, date format, phone format and the words
          customers really use for your service in that language.
        </li>
        <li>
          <strong>Mark up languages in structured data.</strong> Add schema to each version in its own language, and
          state the languages you serve customers in.
        </li>
        <li>
          <strong>Check the answers in each language.</strong> Ask ChatGPT, Gemini, Claude and Perplexity your
          customers&apos; questions in each language and note who is named and which pages are cited.
        </li>
      </ol>

      <h2>What are the hreflang rules that most sites get wrong?</h2>
      <p>
        The rule most sites break is reciprocity: every language version must list itself and all the others, or
        Google ignores the tags. Google&apos;s page on{" "}
        <a
          href="https://developers.google.com/search/docs/specialty/international/localized-versions"
          {...ext}
        >
          localized versions of your pages
        </a>{" "}
        says that if two pages do not both point to each other, the tags will be ignored.
      </p>
      <p>The other common mistakes are smaller but just as fatal to the annotation.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mistake</th>
              <th>What goes wrong</th>
              <th>Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>One-way links</td>
              <td>English points to Spanish, Spanish does not point back</td>
              <td>List every version, including itself, on every version</td>
            </tr>
            <tr>
              <td>Relative URLs</td>
              <td>Alternates written as /es/page</td>
              <td>Use fully qualified URLs with https</td>
            </tr>
            <tr>
              <td>Country code alone</td>
              <td>hreflang=&quot;mx&quot; with no language</td>
              <td>Use a language code, optionally with a region, such as es-MX</td>
            </tr>
            <tr>
              <td>Wrong code lists</td>
              <td>Invented or three-letter codes</td>
              <td>Use ISO 639-1 for language and ISO 3166-1 Alpha 2 for region</td>
            </tr>
            <tr>
              <td>All three methods at once</td>
              <td>HTML, headers and sitemap drift out of sync</td>
              <td>Pick one method; Google treats them as equivalent</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Can AI crawlers see your other languages?</h2>
      <p>
        Crawlers can only see your other languages if each one is reachable at a stable URL without depending on the
        visitor&apos;s location or browser settings. Google&apos;s page on{" "}
        <a
          href="https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages"
          {...ext}
        >
          locale-adaptive pages
        </a>{" "}
        notes that Googlebot&apos;s default crawl comes from IP addresses that appear to be in the USA and sends no
        Accept-Language header, so content that changes by location or browser language can be missed. Google
        recommends separate locale URLs with hreflang instead.
      </p>
      <p>
        AI crawlers have the same problem in a stronger form. Most fetch a page once, from one place, and many do not
        run JavaScript. If your Spanish content only appears after a script reads the browser language, an AI
        crawler may never see it. Our guide to{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link> explains how
        to check what a crawler receives, and the{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> covers making sure
        each language path is not blocked.
      </p>

      <h2>How should structured data handle multiple languages?</h2>
      <p>
        Structured data should be written in the language of each page and should state which languages you serve
        customers in. Put the LocalBusiness or Organization markup on each language version with the name,
        description and services in that language, and keep the address, phone and identifiers identical.
      </p>
      <p>
        To say which languages your staff speak, Schema.org defines{" "}
        <a href="https://schema.org/availableLanguage" {...ext}>
          availableLanguage
        </a>{" "}
        as a language someone may use with the item, service or place, using IETF BCP 47 codes. It applies to types
        such as ContactPoint, so the usual pattern is a contactPoint on your business with availableLanguage set to,
        for example, &quot;en&quot; and &quot;es&quot;. Our{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> guide shows the base
        markup to start from.
      </p>

      <h2>Do off-site signals need to be in each language too?</h2>
      <p>
        Yes, off-site signals count for more when they exist in the language the customer is asking in, because the
        assistant looks for agreement among sources it can read in that language. A business with Spanish-language
        reviews, a Spanish description on its Google Business Profile and mentions in Spanish-language local
        directories gives the engine sources that confirm the facts on its own Spanish page.
      </p>
      <ul>
        <li>
          <strong>Reviews.</strong> Let customers review in their own language, and reply in the language they wrote
          in.
        </li>
        <li>
          <strong>Directories.</strong> List the business in directories and community sites used by speakers of
          that language, with the same name, address and phone as everywhere else.
        </li>
        <li>
          <strong>Profiles.</strong> Say on your Google Business Profile and social profiles which languages you
          serve customers in.
        </li>
        <li>
          <strong>Consistency.</strong> A different phone number or address on the Spanish page than on the English
          one makes the engine less sure which is right.
        </li>
      </ul>
      <p>
        These are the same consistency rules that apply in one language, described in our guide to{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings and NAP citations</Link>,
        applied once per language. Businesses with several branches should also read{" "}
        <Link href="/blog/multi-location-business-ai-visibility">AI visibility for multi-location businesses</Link>.
      </p>

      <h2>How do you check whether it is working?</h2>
      <p>
        You check by asking the AI assistants your customers&apos; questions in each language and recording whether
        your business is named and which of your pages are cited. Use the phrasing a native speaker would use, not a
        literal translation of your English prompts, and repeat the check over several weeks because answers vary
        from one run to the next.
      </p>
      <p>
        Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> shows what ChatGPT, Gemini, Claude and
        Perplexity say about your business today, which is a quick baseline before you add languages. Alphaa itself
        is an AI agent that monitors those answers weekly and drafts fixes such as FAQ pages and structured data for
        the owner to approve, from $99 a month. It does not guarantee any recommendation in any language.
      </p>

      <h2>What else do businesses ask about multilingual AI search?</h2>

      <h3>Is machine translation good enough for AI search?</h3>
      <p>
        Machine translation is a reasonable first draft, but a native speaker should review it before it goes live.
        Awkward phrasing and wrong local terms make a page less likely to match how customers ask, and errors in
        prices or hours spread into AI answers.
      </p>

      <h3>Should I use subdirectories or separate domains for each language?</h3>
      <p>
        Subdirectories such as /es/ are usually the simplest choice for a small business, because they are easy to set
        up and maintain on one site. Google lists country domains as the clearest geotargeting signal, but they cost
        more and target only one country each.
      </p>

      <h3>Does the lang attribute help AI engines?</h3>
      <p>
        Google says it does not use the lang attribute to determine a page&apos;s language, so it is not a ranking
        lever there. It is still worth setting correctly for accessibility and for other tools, but the visible text
        is what counts.
      </p>

      <h3>Do I need a separate llms.txt file for each language?</h3>
      <p>
        No, one llms.txt file at the root of the site is enough, and it can link to the key pages in each language.
        Our guide to <Link href="/blog/how-to-create-llms-txt-file">creating an llms.txt file</Link> shows the format.
      </p>

      <h3>Which language should I add first?</h3>
      <p>
        Add the language your existing customers already use most after your main one. Your call logs, booking
        forms and review languages usually show it, and it is the language where you can get real reviews fastest.
      </p>
    </div>
  )
}
