import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-locksmiths-get-recommended-by-ai",
  title: "How Locksmiths Get Recommended by AI",
  description:
    "Locked-out customers now ask ChatGPT who to call. Why trust signals decide which locksmiths AI names, and the licence, pricing and listing fixes that help.",
  subtitle:
    "Locksmiths get recommended by AI when their real business name, address, licence, services and price ranges are published in plain text and match their listings everywhere.",
  date: "2026-10-23",
  updated: "2026-10-23",
  readMins: 7,
  tag: "Playbook",
  kind: "industry",
  keyphrase: "how locksmiths get recommended by ai",
  image: {
    src: "/blog/how-locksmiths-get-recommended-by-ai.webp",
    alt: "Five brass keys hanging in a row on a cream wall above a brass lock cylinder and a file lying on a wooden shelf.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Locksmithing is a category Google treats as fraud-prone: its ads require Advanced Verification for locksmith services in the US and Canada.",
    "Google's guidelines say a business name should reflect its real-world name, and virtual offices are not eligible for a profile.",
    "Service-area locksmiths without a storefront should hide their address and set a service area, according to Google.",
    "Schema.org has a dedicated Locksmith type under LocalBusiness and HomeAndConstructionBusiness.",
    "Published price ranges, licence details and a named owner are the trust facts assistants can actually check.",
  ],
  sources: [
    { title: "Advanced Verification policies - Advertising Policies Help", publisher: "Google", url: "https://support.google.com/adspolicy/answer/7167922?hl=en" },
    { title: "Guidelines for representing your business on Google", publisher: "Google Business Profile Help", url: "https://support.google.com/business/answer/3038177" },
    { title: "Locksmith - Schema.org Type", publisher: "Schema.org", url: "https://schema.org/Locksmith" },
    { title: "Locksmith Companies and Employees", publisher: "California Bureau of Security and Investigative Services", url: "https://www.bsis.ca.gov/industries/locksmith.shtml" },
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Locksmiths get recommended by AI when assistants can verify that they are a real,
        local, licensed business with clear prices. That means a real business name, a consistent address or service
        area, licence details in text, named services and price ranges on fetchable pages, and reviews that mention real
        jobs. Start by fixing mismatched listings.
      </p>

      <p>
        This playbook is for independent locksmiths and small locksmith companies. It explains why trust weighs more in
        this trade than almost any other, what ChatGPT, Gemini, Claude and Perplexity can read about you, and the fixes
        in the order we would make them.
      </p>

      <h2>What do people ask AI about locksmiths?</h2>
      <p>
        They ask urgent, specific questions about a lock or a situation, often before they ask for a name. Typical
        prompts look like this:
      </p>
      <ul>
        <li>&quot;Locked out of my house at 11pm in Denver, who can come now and roughly what will it cost?&quot;</li>
        <li>&quot;Should I rekey or replace my locks after buying a house?&quot;</li>
        <li>&quot;Can a locksmith program a new key fob for a 2019 Honda, or do I need the dealer?&quot;</li>
        <li>&quot;Which locksmiths near me install smart locks and keep the existing deadbolt?&quot;</li>
        <li>&quot;How do I avoid locksmith scams?&quot;</li>
      </ul>
      <p>
        Two patterns matter. First, the opening question is usually about the job, so the locksmith whose site already
        explains rekeying versus replacing, or car key programming, is the one the assistant has material on. Second,
        &quot;how do I avoid locksmith scams&quot; is a common question, which tells you assistants are primed to be
        cautious in this category.
      </p>

      <h2>Why is trust the deciding factor for locksmiths?</h2>
      <p>
        Trust decides it because locksmithing is one of the categories most affected by fake listings and lead-generation
        operators, and the platforms treat it that way. Google&apos;s{" "}
        <a href="https://support.google.com/adspolicy/answer/7167922?hl=en" {...ext}>
          Advanced Verification policies
        </a>{" "}
        require Advanced Verification for locksmith services in the United States and Canada for both Google Ads and
        Local Services advertisers.
      </p>
      <p>
        Assistants inherit that caution from the sources they read. A locksmith with a generic name, no address, no
        licence information and a call-centre number looks the same as a lead-generation listing, so an assistant that
        is trying to avoid sending someone to a scam has no reason to name it. A locksmith with a named owner, a real
        location and published prices gives the assistant facts it can repeat with confidence.
      </p>

      <h2>What can AI engines actually read about a locksmith business?</h2>
      <p>
        AI engines read your public web pages, your Google Business Profile, directory listings, review text and any
        local mentions, and they compare them. Gemini and Google&apos;s AI features draw on Google&apos;s own index and
        business data; Google says in{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        that no special markup is needed beyond being indexed. ChatGPT, Claude and Perplexity use their own search
        crawlers and web results.
      </p>
      <p>
        What they cannot read matters just as much: prices given only on the phone, service areas shown only on an image
        map, and reviews that sit inside a script widget. If a fact is not in text on a public page or a listing, assume
        the assistant does not know it. For how this works across engines, see{" "}
        <Link href="/blog/what-sources-do-ai-engines-cite">what sources AI engines cite</Link>.
      </p>

      <h2>Which facts decide whether a locksmith makes the AI shortlist?</h2>
      <p>
        Six facts do most of the work, and each one is something an assistant can cross-check against another source.
      </p>
      <ol>
        <li>
          <strong>Your real business name, everywhere.</strong> Google&apos;s{" "}
          <a href="https://support.google.com/business/answer/3038177" {...ext}>
            guidelines for representing your business
          </a>{" "}
          say the name should reflect the real-world name, without taglines, service descriptions or location details.
          &quot;Smith &amp; Sons Locksmiths&quot; beats &quot;24/7 Emergency Locksmith Denver Cheap&quot;.
        </li>
        <li>
          <strong>A real location or a declared service area.</strong> Google says a business that serves customers at its address needs a location staffed during its stated
          hours, while one without a storefront should hide its address and set a service area. It also says virtual offices are not eligible for a profile.
        </li>
        <li>
          <strong>Licence details in text, where your state or province requires one.</strong> Some jurisdictions
          license locksmiths; California&apos;s{" "}
          <a href="https://www.bsis.ca.gov/industries/locksmith.shtml" {...ext}>
            Bureau of Security and Investigative Services
          </a>{" "}
          licenses locksmith companies, for example. Put the licence number and issuing body on your site and listings.
        </li>
        <li>
          <strong>Named services in customers&apos; words.</strong> Lockouts, rekeying, lock replacement, smart lock
          installation, car key and fob programming, safe opening, master key systems, commercial access control. One
          page or section each.
        </li>
        <li>
          <strong>Price ranges and call-out fees.</strong> A range such as a call-out fee plus a typical rekey cost per
          lock is the single most reassuring fact in this trade, because surprise pricing is the classic complaint.
        </li>
        <li>
          <strong>Hours that are true.</strong> If you offer emergency service, say which hours and which areas. If
          nights cost more, say so.
        </li>
      </ol>

      <h2>How do honest locksmiths compare with lead-generation listings to an AI?</h2>
      <p>
        To an assistant, the difference shows up as checkable facts versus vague claims. This is how the same signals
        tend to look on each side:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>Established local locksmith</th>
              <th>Lead-generation listing</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Business name</td>
              <td>Registered trading name</td>
              <td>Keyword phrase with a city name</td>
            </tr>
            <tr>
              <td>Address</td>
              <td>Real shop, or hidden with a set service area</td>
              <td>Virtual office or a different address per listing</td>
            </tr>
            <tr>
              <td>Phone</td>
              <td>Local number that matches every listing</td>
              <td>Shared call-centre number</td>
            </tr>
            <tr>
              <td>Prices</td>
              <td>Call-out fee and typical ranges published</td>
              <td>&quot;From $19&quot; with no detail</td>
            </tr>
            <tr>
              <td>Licence</td>
              <td>Number and issuing body shown</td>
              <td>Not mentioned</td>
            </tr>
            <tr>
              <td>Reviews</td>
              <td>Mention named technicians and specific jobs</td>
              <td>Short, generic, or none</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        You do not need to beat lead-generation sites on volume. You need to be the listing whose facts agree with each
        other, because inconsistency is the main thing that makes an assistant skip a business. The mechanics are in{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings and NAP citations</Link>.
      </p>

      <h2>What does a better locksmith web page look like?</h2>
      <p>
        A better page puts a checkable fact in every sentence instead of slogans. Compare two versions of the same
        service page opening.
      </p>
      <p>
        <em>Weak:</em> &quot;Fast, reliable, affordable locksmith services for all your residential, commercial and
        automotive needs. Call now!&quot;
      </p>
      <p>
        <em>Better:</em> &quot;We rekey house locks across north Denver, typically the same day. Our call-out fee is
        listed below, plus a per-lock rekey price, and we tell you the total before we start. Licence number below,
        owner-operated by Jane Smith since 2011.&quot;
      </p>
      <p>
        The second version answers the questions a worried customer and a cautious assistant both have: where, how fast,
        how much, and who. Use your real numbers and facts, of course; the wording above is only a pattern. More on
        structure is in <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI will quote</Link>.
      </p>

      <h2>What schema and technical work helps locksmiths?</h2>
      <p>
        Use the Locksmith structured data type, keep your answers in plain HTML, and let the AI search crawlers in.
        Schema.org has a dedicated{" "}
        <a href="https://schema.org/Locksmith" {...ext}>
          Locksmith type
        </a>
        , which sits under LocalBusiness and HomeAndConstructionBusiness, so you can mark up name, address or service
        area, phone, hours and services precisely.
      </p>
      <ul>
        <li>
          <strong>Locksmith schema</strong> on the homepage and contact page, matching your Google Business Profile.
        </li>
        <li>
          <strong>FAQPage markup</strong> on a real FAQ page about pricing, lockouts and rekeying.
        </li>
        <li>
          <strong>Crawler access</strong> for OAI-SearchBot, Claude-SearchBot and PerplexityBot; see the{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers robots.txt guide</Link>.
        </li>
        <li>
          <strong>No prices in images.</strong> Price tables as text, not as a graphic.
        </li>
      </ul>
      <p>
        The markup itself is covered in <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h2>How should locksmiths ask for reviews?</h2>
      <p>
        Ask every customer, soon after the job, and ask them to say what you did. A review that says &quot;rekeyed all
        four locks the day we moved in, quoted the price upfront&quot; gives an assistant the service, the situation and
        the trust signal in one sentence. A five-star review that says only &quot;great&quot; gives it nothing.
      </p>
      <p>
        Reply to reviews with specifics too, including the negative ones, and never buy reviews or offer anything in
        return for them. The full approach is in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why Google reviews now decide your AI visibility</Link>.
      </p>

      <h2>What else do locksmiths ask about AI visibility?</h2>

      <h3>Do I need a website if I have a Google Business Profile?</h3>
      <p>
        Yes, a simple website helps because ChatGPT, Claude and Perplexity rely on web pages, not only on Google&apos;s
        business data. A few clear pages covering services, prices, area and licence are enough to start.
      </p>

      <h3>Should I list every suburb I cover?</h3>
      <p>
        List the areas you genuinely serve, in text, on one service-area page. Thin near-duplicate pages for each suburb
        rarely help and can look like the lead-generation pattern assistants are wary of.
      </p>

      <h3>Will publishing prices lose me jobs to cheaper competitors?</h3>
      <p>
        Usually not, because published ranges build the trust that cheap teaser prices destroy. Customers and assistants
        both read a clear call-out fee as a sign of an honest business.
      </p>

      <h3>How long before ChatGPT starts naming my locksmith business?</h3>
      <p>
        There is no fixed timeline, and nobody can guarantee it. Crawlers need to revisit your pages and listings, and
        answers vary between runs, so check the assistants over several weeks rather than once.
      </p>

      <h3>How can I see what AI says about my locksmith business today?</h3>
      <p>
        Ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, and note who they name. The{" "}
        <Link href="/start">free 60-second AI check</Link> runs those questions across all four for you.
      </p>
    </div>
  )
}
