import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "local-business-ai-readiness-study-2026",
  title: "We Checked 288 Local Business Websites for AI Readiness. Here’s What We Found (2026)",
  description:
    "Original research: Alphaa ran its 23-point AI-readiness check on 288 dentist, plumber/HVAC, law firm, veterinary and restaurant websites across six US cities. 17% turned away an automated reader, 71% had missing or incomplete structured business facts, and fewer than 2% passed 20 of 23 checks.",
  date: "2026-09-25",
  readMins: 7,
  tag: "Research",
}

const industries: [string, number, number, string, string, string, string, string][] = [
  // name, sites sampled, readable, avg checks passed (of 23), no/incomplete-schema %, facts missing %, no FAQ %, no readable reviews %
  ["Dentists", 60, 50, "15.3", "36%", "38%", "62%", "42%"],
  ["Plumbers & HVAC", 48, 33, "15.1", "36%", "48%", "64%", "48%"],
  ["Law firms", 60, 51, "15.5", "25%", "55%", "51%", "33%"],
  ["Veterinarians", 60, 57, "14.3", "32%", "30%", "67%", "67%"],
  ["Restaurants", 60, 48, "11.2", "54%", "65%", "85%", "88%"],
]

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Most local business websites are only partly readable by AI assistants. In
        September 2026 we ran Alphaa&apos;s 23-point AI-readiness check on 288 real local business websites: 17% turned
        away an automated reader entirely, 71% of the readable sites had missing or incomplete structured business
        facts, 46% didn&apos;t show a phone number, address or hours in text AI can read, and fewer than 2% passed 20 of
        the 23 checks.
      </p>

      <h2>What did we check, and on which businesses?</h2>
      <p>
        We checked 288 websites belonging to dentists, plumbers and HVAC companies, law firms, veterinarians and
        restaurants in Austin, Denver, Phoenix, Miami, Seattle and Chicago. The businesses came from OpenStreetMap
        (public listings that include a website), sampled at random — up to 60 per industry — and each site was checked
        once on September 25, 2026.
      </p>
      <ul>
        <li>
          <strong>The check:</strong> the same 23 checks Alphaa runs in its free{" "}
          <Link href="/start">60-second AI check</Link> — whether AI crawlers can get in, whether the content is readable
          without JavaScript, structured data, phone/address/hours, FAQ content, reviews readable as text, profile links,
          freshness and more.
        </li>
        <li>
          <strong>How:</strong> plain HTTP requests for the homepage, robots.txt, sitemap, llms.txt and one inner page,
          plus homepage requests using the ChatGPT, Claude and Perplexity crawler identities.
        </li>
        <li>
          <strong>Limits:</strong> one snapshot, one network location, homepages only for most checks. A firewall can
          treat our requests differently from the real crawlers, so &quot;blocked&quot; means <em>likely</em> blocked.
          Bing verification by DNS can&apos;t be seen from outside, so that figure is an upper bound.
        </li>
      </ul>

      <h2>How many local business websites can AI actually read?</h2>
      <p>
        About four in five: 239 of the 288 sites (83%) returned a readable homepage, while 49 (17%) refused an automated
        visitor with an error or a bot challenge. A site that turns away automated readers is invisible to any AI
        assistant that gets the same treatment, so the assistant falls back on what other websites say about the
        business.
      </p>
      <ul>
        <li>Plumbing and HVAC sites turned readers away most often: 15 of 48 (31%).</li>
        <li>
          Of the 239 readable sites, 17% served a block or challenge to at least one AI crawler identity (ChatGPT,
          Claude or Perplexity) while letting a normal browser in.
        </li>
        <li>10% showed almost no readable text before JavaScript runs — and most AI crawlers don&apos;t run it.</li>
      </ul>

      <h2>What are local websites most often missing?</h2>
      <p>
        The most common gaps are the ones AI relies on to describe and trust a business: complete structured facts, FAQ
        answers, reviews in plain text and fresh content. Among the 239 readable sites:
      </p>
      <table>
        <thead>
          <tr>
            <th>Check</th>
            <th>Sites failing</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>No fresh blog or news content in the last 90 days</td><td>80%</td></tr>
          <tr><td>No llms.txt file</td><td>75%</td></tr>
          <tr><td>Structured business facts missing or incomplete (address, phone, hours, map location, profiles)</td><td>71%</td></tr>
          <tr><td>No FAQ content</td><td>66%</td></tr>
          <tr><td>No reviews or testimonials readable as text</td><td>56%</td></tr>
          <tr><td>No Google Maps link, or fewer than two profile links</td><td>52%</td></tr>
          <tr><td>Phone, address or hours not readable on the homepage</td><td>46%</td></tr>
          <tr><td>No business structured data at all</td><td>36%</td></tr>
          <tr><td>Weak or missing page title and description</td><td>36%</td></tr>
          <tr><td>Slow first response (over 1.5 seconds)</td><td>23%</td></tr>
          <tr><td>No main heading (H1)</td><td>23%</td></tr>
          <tr><td>No secure, single address (http/https or www split)</td><td>13%</td></tr>
          <tr><td>Canonical tags pointing at the wrong page</td><td>5%</td></tr>
        </tbody>
      </table>
      <p>
        Two failures deserve a note. Google says its AI features don&apos;t require an llms.txt file; other assistants
        can use it, which is why we check it, but it&apos;s the least critical item on this list. And 88% showed no sign
        of Bing Webmaster Tools — worth fixing because ChatGPT search results have been found to overlap heavily with
        Bing&apos;s — but some of those sites may be verified by DNS, which we can&apos;t see.
      </p>

      <h2>Which industries are most ready for AI search?</h2>
      <p>
        Law firms, dentists and plumbers scored about the same — roughly 15 of 23 checks — while restaurants scored
        lowest at 11 of 23. Restaurants were the most likely to lack structured data, readable reviews, FAQ answers and
        profile links, which matters because diners ask AI for recommendations constantly.
      </p>
      <table>
        <thead>
          <tr>
            <th>Industry</th>
            <th>Sampled</th>
            <th>Readable</th>
            <th>Avg. checks passed (of 23)</th>
            <th>No business schema</th>
            <th>Phone/address/hours missing</th>
            <th>No FAQ</th>
            <th>No readable reviews</th>
          </tr>
        </thead>
        <tbody>
          {industries.map(([n, s, r, avg, sc, f, faq, rev]) => (
            <tr key={n}>
              <td>{n}</td><td>{s}</td><td>{r}</td><td>{avg}</td><td>{sc}</td><td>{f}</td><td>{faq}</td><td>{rev}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>How many sites are fully ready?</h2>
      <p>
        Almost none: only 4 of the 239 readable sites (under 2%) passed 20 or more of the 23 checks, and the median site
        passed 15. In practice that means most local businesses are leaving AI to guess — or to recommend the competitor
        whose facts are easier to read.
      </p>

      <h2>What should a local business fix first?</h2>
      <p>
        Fix access first, then facts, then trust: make sure AI can read your site at all, put your phone, address and
        hours on the homepage in plain text and in structured data, then add FAQ answers and a few real reviews as text.
      </p>
      <ol>
        <li>Check that your host or firewall isn&apos;t turning away AI crawlers, and that your homepage text loads without JavaScript.</li>
        <li>Put your name, phone, address, hours and service area on the homepage — as text, not an image.</li>
        <li>Add LocalBusiness structured data with address, phone, hours, map location and links to your Google, Yelp and social profiles.</li>
        <li>Publish answers to the five questions customers ask before they call.</li>
        <li>Show a handful of real reviews as text, not only inside a widget.</li>
      </ol>
      <p>
        The key takeaway is that the gap is rarely exotic: most local sites fail on basics — access, facts and plain-text
        trust signals — that AI needs before it will recommend anyone, and those are fixable in a week.
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
