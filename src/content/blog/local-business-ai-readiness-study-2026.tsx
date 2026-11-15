import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "local-business-ai-readiness-study-2026",
  title: "Local Business AI Readiness: What I Keep Seeing",
  description:
    "An opinion piece on why so many local business websites are hard for AI assistants to read, the gaps that come up again and again, and what to fix first.",
  subtitle:
    "Most local business websites I look at are only partly readable by AI assistants, and the same few basics are usually what's missing.",
  date: "2026-09-25",
  updated: "2026-11-14",
  readMins: 5,
  tag: "Opinion",
  kind: "guide",
  keyphrase: "local business ai readiness",
  takeaways: [
    "This is opinion and observation from running AI-readiness checks, not a statistical study.",
    "A site an AI crawler can't get into, or can't read without JavaScript, is effectively invisible to that assistant.",
    "The gaps that come up most are the basics: plain-text phone, address and hours, complete structured business facts, FAQ answers and reviews readable as text.",
    "Businesses that lean on menus in PDFs, photo galleries and review widgets tend to give AI the least to work with.",
    "Fix access first, then facts, then trust signals. Most of it is a week of work, not a rebuild.",
  ],
  sources: [
    { title: "Local Business (LocalBusiness) Structured Data", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/structured-data/local-business" },
    { title: "Understand JavaScript SEO Basics", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics" },
    { title: "Guidelines for representing your business on Google", publisher: "Google Help", url: "https://support.google.com/business/answer/3038177" },
    { title: "Build and Submit a Sitemap", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap" },
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
  ],
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> In my experience most local business websites are only partly readable by AI
        assistants. Some turn automated readers away entirely, many hide their key facts in images, widgets or
        JavaScript, and very few have the structured business facts, FAQ answers and plain-text reviews that make an
        assistant confident enough to recommend them.
      </p>
      <p>
        <em>
          A note on this page: it was rewritten on November 14, 2026 as an opinion piece. It shares what I see when
          running AI-readiness checks; it doesn&apos;t report statistics from a formal study.
        </em>
      </p>

      <h2>What did we check, and on which businesses?</h2>
      <p>
        The checks are the same 23 that Alphaa runs in its free{" "}
        <Link href="/start">60-second AI check</Link>, and the businesses I think about most are the ones that depend
        on local customers: dentists, plumbers and HVAC companies, law firms, veterinarians and restaurants.
      </p>
      <ul>
        <li>
          <strong>Access:</strong> can AI crawlers get in, and is the content readable without JavaScript?
        </li>
        <li>
          <strong>Facts:</strong> structured data, and phone, address and hours in plain text.
        </li>
        <li>
          <strong>Trust:</strong> FAQ content, reviews readable as text, profile links and fresh content.
        </li>
        <li>
          <strong>Limits:</strong> a check from outside is a snapshot. A firewall can treat an automated check
          differently from the real crawlers, so &quot;blocked&quot; means <em>likely</em> blocked, and some things,
          like Bing verification by DNS, can&apos;t be seen from outside at all.
        </li>
      </ul>

      <h2>How many local business websites can AI actually read?</h2>
      <p>
        I don&apos;t have a reliable number to give you, and I&apos;d be wary of anyone who quotes one without
        publishing their data. What I can say is that a site turning away automated readers is common enough to check
        first. A site that refuses an automated visitor with an error or a bot challenge is invisible to any AI
        assistant that gets the same treatment, so the assistant falls back on what other websites say about the
        business.
      </p>
      <ul>
        <li>Hosting firewalls and bot-protection settings are the usual cause, often switched on by default.</li>
        <li>
          Some sites let a normal browser in but serve a block or challenge to AI crawler identities such as ChatGPT,
          Claude or Perplexity.
        </li>
        <li>
          Sites built so the text only appears after JavaScript runs can look almost empty to crawlers that don&apos;t
          run it.
        </li>
      </ul>

      <h2>What are local websites most often missing?</h2>
      <p>
        The gaps I see most are the ones AI relies on to describe and trust a business: complete structured facts, FAQ
        answers, reviews in plain text and fresh content. In no particular order:
      </p>
      <ul>
        <li>No fresh blog or news content in months.</li>
        <li>Structured business facts missing or incomplete (address, phone, hours, map location, profiles).</li>
        <li>No FAQ content answering what customers ask before they call.</li>
        <li>Reviews shown only inside a widget, with none readable as text.</li>
        <li>No Google Maps link, or few links to the business&apos;s other profiles.</li>
        <li>Phone, address or hours shown only in an image, a PDF or a footer script.</li>
        <li>Weak or missing page titles, descriptions and main headings.</li>
        <li>No llms.txt file.</li>
      </ul>
      <p>
        Two notes on that list. Google says there&apos;s nothing special you need to add for its AI features, and that
        includes llms.txt; other assistants can use it, which is why we check it, but it&apos;s the least critical
        item here. And Bing Webmaster Tools is worth setting up, but a site may already be verified by DNS, which a
        check from outside can&apos;t see.
      </p>

      <h2>Which industries are most ready for AI search?</h2>
      <p>
        I don&apos;t rank industries, because I haven&apos;t measured them in a way I&apos;d stand behind. My
        impression is that the businesses that struggle most are the ones whose sites lean on visuals: restaurants
        with menus in PDFs and reviews in widgets, and contractors with photo galleries and a quote form. That matters
        because people ask AI for exactly these recommendations.
      </p>

      <h2>How many sites are fully ready?</h2>
      <p>
        Again, I won&apos;t put a number on it. In practice the bar isn&apos;t high, and the sites that clear it
        usually just have their basics in order. Most local businesses are leaving AI to guess, or to recommend the
        competitor whose facts are easier to read.
      </p>

      <h2>What should a local business fix first?</h2>
      <p>
        Fix access first, then facts, then trust: make sure AI can read your site at all, put your phone, address and
        hours on the homepage in plain text and in structured data, then add FAQ answers and a few real reviews as text.
      </p>
      <ol>
        <li>Check that your host or firewall isn&apos;t turning away AI crawlers, and that your homepage text loads without JavaScript.</li>
        <li>Put your name, phone, address, hours and service area on the homepage, as text, not an image.</li>
        <li>Add LocalBusiness structured data with address, phone, hours, map location and links to your Google, Yelp and social profiles.</li>
        <li>Publish answers to the five questions customers ask before they call.</li>
        <li>Show a handful of real reviews as text, not only inside a widget.</li>
      </ol>
      <p>
        The key takeaway is that the gap is rarely exotic: most local sites fall short on basics (access, facts and
        plain-text trust signals) that AI needs before it will recommend anyone, and those are fixable in a week.
      </p>

      <h2>What else do people ask about the AI readiness study?</h2>

      <h3>Is this based on a formal study?</h3>
      <p>
        No. It&apos;s opinion and observation from running AI-readiness checks. If we publish numbers in future, we
        will publish the method and the data with them.
      </p>

      <h3>Does a low readiness score mean a business is invisible?</h3>
      <p>
        No. Readiness measures what an engine can read from the site itself, and many businesses are still named
        from their profile and reviews alone.
      </p>

      <h3>Which failure comes up most often?</h3>
      <p>
        In my experience, key facts not present in crawlable text, usually because pricing, service areas or hours
        lived only in an image, a PDF or a client-side widget.
      </p>

      <h3>How often should a local business re-check its site?</h3>
      <p>
        After any website change, and otherwise every few months. Redesigns, new hosting, a new booking widget or a
        security plugin can quietly block crawlers or move your phone number and hours into a script, and nobody
        notices until customers stop hearing your name from AI assistants.
      </p>

      <h3>Can I fix these gaps without rebuilding my website?</h3>
      <p>
        Usually, yes. Most of the fixes are edits to the site you already have: a line of text with your phone,
        address and hours, a block of structured data, an FAQ section and a few reviews copied in as text. A
        firewall setting is often a single switch in your hosting dashboard.
      </p>

      <h2>How do you see where your own site stands?</h2>
      <p>
        Run the same 23 checks on your site, plus a live question to ChatGPT, Gemini, Claude and Perplexity, with the{" "}
        <Link href="/start">free 60-second check</Link>. For what each check means, see{" "}
        <Link href="/blog/aeo-checklist">the AEO checklist</Link> and{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">why JavaScript-only pages are invisible to AI</Link>.
      </p>
    </div>
  )
}
