import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "javascript-rendering-ai-crawlers",
  title: "Why AI Can't Read Your JavaScript Website (And How to Fix It)",
  description:
    "Many AI crawlers fetch raw HTML and don't wait for JavaScript to run. If your site renders content client-side, the crawler may see an empty shell. Here's the 60-second test and the fix for each stack.",
  date: "2026-07-29",
  readMins: 10,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of small businesses, and this is
          the single most common technical reason a site comes back invisible. Last updated 29 July 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI crawlers generally fetch your page&apos;s raw HTML and read what
        comes back. Most of them do not run a full browser, so they do not wait for JavaScript to fetch data,
        build the DOM, and paint your content. If your homepage is a React or Vue app that renders
        client-side, what the crawler receives can be a nearly empty shell — a <code>&lt;div id=&quot;root&quot;&gt;</code>,
        a couple of script tags, and no words. Your site looks perfect to a human and blank to the machine
        deciding whether to recommend you. The fix is to make sure the meaningful text exists in the HTML
        <em> before</em> any JavaScript runs.
      </p>

      <h2>Do AI crawlers execute JavaScript?</h2>
      <p>
        Be precise here, because the answer differs by crawler and the honest version has caveats.
      </p>
      <ul>
        <li>
          <strong>Googlebot does render JavaScript.</strong> Google documents a two-pass process: crawl the
          HTML, queue the page for rendering in a headless Chromium, then index the rendered result. See
          Google&apos;s{" "}
          <a
            href="https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics"
            rel="nofollow noopener"
            target="_blank"
          >
            JavaScript SEO Basics
          </a>
          . Rendering is queued, though, so JS-dependent content is indexed later and less reliably than
          server-rendered content. Google AI Overviews draw on that index.
        </li>
        <li>
          <strong>The dedicated AI crawlers are far less documented.</strong> OpenAI (GPTBot, OAI-SearchBot,
          ChatGPT-User), Anthropic (ClaudeBot), and Perplexity (PerplexityBot) all publish user-agent and IP
          documentation, but none of them publish a rendering guarantee comparable to Google&apos;s. In
          practice, what we see when we test pages is consistent with plain HTML fetching: content that only
          appears after client-side hydration frequently does not make it into the answer.
        </li>
      </ul>
      <p>
        So the defensible engineering position is not &quot;AI crawlers never run JS.&quot; It is:{" "}
        <strong>do not depend on JavaScript execution for anything you need an AI engine to know.</strong>{" "}
        Treat rendering as a bonus, not a contract.
      </p>

      <h2>The 60-second test: what does a crawler actually see?</h2>
      <p>
        Do not guess. Fetch your own page the way a simple crawler would, with no browser and no JavaScript:
      </p>
      <pre><code>{`# 1. Fetch the raw HTML your server returns
curl -sL https://yoursite.com/ -o raw.html

# 2. How much visible text is actually in it?
#    (strip tags, collapse whitespace, count words)
sed -e 's/<[^>]*>/ /g' raw.html | tr -s ' \\n' ' ' | wc -w

# 3. Is your key content there at all?
grep -io "emergency plumbing" raw.html
grep -io "serving Austin" raw.html`}</code></pre>
      <p>
        Read the result honestly. A content-bearing page should return hundreds of words in step 2 and hit on
        your core service and location phrases in step 3. If step 2 returns something like 40 words and step 3
        returns nothing, your content is not in the HTML — it is assembled in the visitor&apos;s browser, and
        a plain-HTML crawler walks away with nothing.
      </p>
      <p>
        Two more checks worth 30 seconds each:
      </p>
      <ul>
        <li>
          <strong>Disable JavaScript in your browser</strong> (Chrome DevTools → Command Palette → &quot;Disable
          JavaScript&quot;) and reload. What remains on screen is roughly the floor of what a non-rendering
          crawler gets.
        </li>
        <li>
          <strong>Use view-source, not Inspect.</strong> The Elements panel shows the <em>live DOM</em> after
          JavaScript has run, so it always looks fine. <code>view-source:</code> shows the raw document. This
          distinction is why so many teams insist their content is &quot;definitely there.&quot;
        </li>
      </ul>

      <h2>What a half-invisible site looks like in practice</h2>
      <p>
        A typical case we see: a home-services company on a modern single-page React site. Beautiful, fast to
        click around, service areas and pricing all in the app. Ask ChatGPT or Perplexity who does emergency
        drain work in their city and the company never appears — while a competitor on a plain WordPress theme
        gets named every time. Nothing is wrong with the business. The crawler simply received a shell with a
        title tag and no body copy, so there was no sentence about drains in their city for a model to
        retrieve or quote.
      </p>
      <p>The symptom pattern to look for:</p>
      <ul>
        <li>The page ranks poorly or inconsistently for terms that are visibly all over the page.</li>
        <li>Google&apos;s cached or plain-text view of the page is much thinner than the real page.</li>
        <li>AI engines describe your business generically, or only from your Google Business Profile and
          directory listings, never from your own site&apos;s wording.</li>
        <li>Your title and meta description are correct — those are usually server-rendered — but nothing
          deeper is ever cited.</li>
      </ul>

      <h2>How to fix it, by stack</h2>
      <h3>React / Vue / Angular single-page app</h3>
      <p>
        This is the real problem case. Move to server-side rendering (SSR) or static generation (SSG) for every
        page you want cited. In Next.js that means letting pages be Server Components or statically generated
        rather than fetching content in a <code>useEffect</code> on the client. In Vue that is Nuxt; in
        Angular, Angular SSR. If a rewrite is out of reach, a prerendering service that serves crawlers a
        fully rendered HTML snapshot is a legitimate stopgap — serve the same content to bots and humans, never
        a different, keyword-stuffed version.
      </p>
      <h3>WordPress</h3>
      <p>
        Usually fine by default, since PHP renders the HTML server-side. The exceptions: page builders that
        lazy-render sections on scroll, review or listing widgets injected by third-party scripts, and
        &quot;headless WordPress&quot; setups with a client-rendered front end. Run the curl test — do not
        assume.
      </p>
      <h3>Webflow / Squarespace / Wix / Shopify</h3>
      <p>
        These serve server-rendered HTML for normal page content, so the core copy is usually visible. Watch
        the add-ons: embedded booking tools, review carousels, FAQ apps, and anything loaded through a script
        tag from another domain. That content often lives only in the browser. If your FAQ answers are the
        thing you want quoted, put them in native page text, not in a third-party widget.
      </p>
      <h3>Everything else that hides content</h3>
      <ul>
        <li><strong>Infinite scroll and &quot;load more&quot;</strong> — content beyond the first batch may
          never be requested. Provide paginated URLs that work without JS.</li>
        <li><strong>Text baked into images</strong> — a price list or service menu as a JPEG is not text.
          Repeat it in HTML.</li>
        <li><strong>Interstitials and consent walls</strong> that block the document until dismissed.</li>
        <li><strong>Bot protection</strong> — a WAF or Cloudflare rule returning 403 to GPTBot or ClaudeBot
          makes the rendering question moot. Check your logs and your{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">robots.txt and crawler allow-list</Link> first.</li>
      </ul>

      <h2>Quick answers</h2>
      <h3>Does server-side rendering guarantee I get cited by AI?</h3>
      <p>
        No. It removes a blocker; it does not create demand. Rendering makes your content <em>retrievable</em>.
        Whether a model names you still depends on how specific and verifiable your content is and what
        third-party sources say about you. Anyone promising guaranteed citations from a rendering change is
        overselling.
      </p>
      <h3>Is dynamic rendering (serving bots different HTML) considered cloaking?</h3>
      <p>
        Serving crawlers a prerendered version of <em>the same</em> content is an accepted workaround. Serving
        them different or extra content is cloaking, and it is a policy violation on every major engine. Keep
        the two outputs equivalent.
      </p>
      <h3>Does schema markup help if the page is client-rendered?</h3>
      <p>
        Only if the JSON-LD is in the server response. Schema injected by a tag manager after load has the same
        problem as the rest of your content. Put the{" "}
        <Link href="/blog/schema-markup-for-ai-search">JSON-LD in the initial HTML</Link>.
      </p>
      <h3>How do I know the fix worked?</h3>
      <p>
        Re-run the curl word count — it should jump from tens of words to hundreds. Then watch over the
        following weeks whether AI answers begin using your own phrasing rather than only directory data.
      </p>

      <h2>The bottom line</h2>
      <p>
        Before you invest in content, schema, or reviews, confirm the machines can read the page at all. It is
        the cheapest possible win: one <code>curl</code> command tells you whether an AI crawler is receiving
        your business or an empty div. Fix rendering first, because every other AEO effort is stacked on top of
        it. And be honest with yourself about the ceiling — rendering gets you into the room, it does not win
        the answer.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
