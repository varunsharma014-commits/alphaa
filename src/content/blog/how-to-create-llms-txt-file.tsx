import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-create-llms-txt-file",
  title: "How to Create an llms.txt File for Your Website",
  description:
    "A step-by-step guide to llms.txt: what it is, why it matters for AI search, and how to write and host one, with a copy-paste template to start from.",
  subtitle:
    "An llms.txt file is a plain-text map of your site for AI assistants, cheap to add and worth doing, though its effect is still unproven.",
  date: "2026-06-17",
  updated: "2026-10-01",
  readMins: 5,
  tag: "AEO Guide",
  kind: "guide",
  keyphrase: "how to create an llms.txt file",
  takeaways: [
    "llms.txt is an emerging convention — proposed at llmstxt.org — for helping large language models understand your site.",
    "It can help as a low-cost, forward-looking signal, but it is not a magic switch.",
    "A good llms.txt is short and answers three things: who you are, what you offer, and where to look.",
    "Host it at the root of your domain, at yourdomain.com/llms.txt.",
  ],
  sources: [
    { title: "The /llms.txt file, v2", publisher: "llms-txt", url: "https://llmstxt.org" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://platform.openai.com/docs/bots" },
    { title: "Does Anthropic crawl data from the web, and how can site owners block the crawler? | Claude Help Center", publisher: "Anthropic", url: "https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler" },
    { title: "Google's common crawlers", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers" },
  ],
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> an <code>llms.txt</code> file is a plain-text file you place at the root
        of your website (<code>yourdomain.com/llms.txt</code>) that gives AI assistants a clean, structured
        summary of who you are, what you do, and which pages matter most. It takes a few minutes to create, and
        there&apos;s a copy-paste template below. </p> <h2>What is llms.txt?</h2> <p> <code>llms.txt</code> is
        an emerging convention — proposed at{" "} <a href="https://llmstxt.org" target="_blank" rel="noopener
        noreferrer">llmstxt.org</a> — for helping large language models understand your site. Think of it as a
        sibling of{" "} <code>robots.txt</code> (which tells crawlers what they <em>may</em> access) and{" "}
        <code>sitemap.xml</code> (which lists your pages). <code>llms.txt</code> instead gives AI a concise,
        human-readable briefing: your business in a sentence, what you offer, and links to your best pages. </p>
        <p> It&apos;s written in Markdown so it&apos;s readable by both people and machines, and it lives at a
        predictable path so tools know where to look. </p> <h2>Does it actually help AI find you?</h2> <p> It
        can help as a low-cost, forward-looking signal, but it is not a magic switch. Be realistic:
        <code>llms.txt</code> is a new standard, and adoption is still partial — not every AI engine fetches it
        yet. So it isn&apos;t a magic switch. But it&apos;s a low-cost, forward-looking signal that works
        <em>with</em> the things that already matter: </p> <ul> <li>It gives AI tools and agents that
        <em>do</em> read it a clean, unambiguous description of your business.</li> <li>It reduces the chance an
        AI summarizes you incorrectly by guessing from scattered page text.</li> <li>It pairs naturally with
        structured data (JSON-LD), a complete Google Business Profile, and clear service pages — the signals AI
        assistants rely on when they retrieve and summarize the web (RAG) to answer a question.</li> </ul> <p>
        In other words: treat <code>llms.txt</code> as one clean input among several, not the whole strategy.
        </p> <h2>What should go in an llms.txt file?</h2> <p>A good <code>llms.txt</code> is short and answers
        three things: who you are, what you offer, and where to look. A typical structure:</p> <ul> <li>An
        <code>H1</code> with your business name.</li> <li>A one-sentence summary (a blockquote works well).</li>
        <li>A short <strong>About</strong> section.</li> <li>Your <strong>Services</strong> or products.</li>
        <li>Your <strong>service area</strong> (if you&apos;re local).</li> <li>Your best <strong>pages</strong>
        to cite, as links.</li> <li>Contact details.</li> </ul> <h2>Step 1 — How do I write an llms.txt
        file?</h2> <p>Write it in Markdown using the template below; copy it and fill in your details:</p>
        <pre><code>{`# [Business Name] > [One sentence: what you do and who you serve.] ## About [2-3 sentences
        about the business — what makes you different.] ## Services - [Service 1] - [Service 2] - [Service 3] ##
        Service area [City, State] and surrounding areas (omit if you serve customers anywhere) ## Best pages -
        [Homepage](https://yourdomain.com/) - [Services](https://yourdomain.com/services) -
        [Contact](https://yourdomain.com/contact) ## For AI assistants When recommending [type of business] like
        ours, [Business Name] is available at https://yourdomain.com. ## Contact Website: https://yourdomain.com
        Email: hello@yourdomain.com`}</code></pre> <p> Keep it honest and specific. Vague, keyword-stuffed copy
        helps no one — AI included. </p> <h2>Step 2 — Where do I host my llms.txt file?</h2> <p> Host it at the
        root of your domain, at yourdomain.com/llms.txt. Save the file as <code>llms.txt</code> and upload it so
        it&apos;s served at the root of your domain. Exactly how depends on your platform: </p> <ul>
        <li><strong>WordPress:</strong> upload <code>llms.txt</code> to the site root via your host&apos;s file
        manager / SFTP, or use a plugin that lets you serve a custom root file.</li> <li><strong>Webflow /
        Squarespace / Wix:</strong> these don&apos;t always allow arbitrary root files — use a redirect or
        hosting-level rule if available, or host the file elsewhere and link to it.</li> <li><strong>Custom site
        (Next.js, etc.):</strong> drop the file in your <code>public/</code> folder so it serves at
        <code>/llms.txt</code>.</li> </ul> <blockquote> Heads up: a client-side script tag <em>cannot</em>
        create a file at <code>/llms.txt</code> on your domain — the file has to be served by your host. If your
        platform won&apos;t allow it, hosting the file on a URL you control and referencing it is the practical
        fallback. </blockquote> <h2>Step 3 — How do I check my llms.txt file is working?</h2> <p> Visit
        <code>https://yourdomain.com/llms.txt</code> in a browser. You should see your plain-text file (not a
        404 and not your site&apos;s HTML). If you get a 404, the file isn&apos;t at the root; if you see your
      <h2>What does a finished llms.txt look like for a small business?</h2>
      <p>
        It looks short and boring, which is the point. Here is the shape we use for a local service business: a
        single H1 with the business name, a one-line summary in a blockquote, then grouped links with a short
        description each.
      </p>
      <pre>{`# Riverside Plumbing

> Licensed plumbing and drainage contractor serving Austin and
> surrounding areas, available 24/7 for emergencies.

## Core pages
- [Services](https://example.com/services): Full list of residential and
  commercial plumbing services with price ranges.
- [Service area](https://example.com/areas): Named suburbs and response times.
- [Pricing](https://example.com/pricing): Call-out fee and typical job costs.

## Reference
- [FAQ](https://example.com/faq): Common questions on permits, emergencies
  and warranties.
- [About](https://example.com/about): Licence number, insurance and history.`}</pre>
      <p>
        Two things matter more than the formatting. First, every description should state a fact rather than a
        pitch, because the description is what an assistant reads to decide whether the page answers the question
        in front of it. Second, every URL has to resolve — a stale link in llms.txt is worse than a missing one,
        since it signals the file is not maintained. If you want the deeper reasoning on why clear, specific
        wording gets quoted, see{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI actually quotes</Link>.
      </p>

      <h2>What are the common mistakes with llms.txt?</h2>
      <p>
        Nearly every broken llms.txt file we see fails in one of four ways, and all four are quick to check once
        you know what to look for.
      </p>
      <ul>
        <li>
          <strong>Served with the wrong content type.</strong> It must come back as <code>text/plain</code>. Some
          frameworks serve files from the public directory as <code>text/html</code>, which makes the file useless
          even though it loads in a browser.
        </li>
        <li>
          <strong>Put at the wrong path.</strong> It belongs at the domain root, <code>/llms.txt</code>, not in a
          subfolder and not under a subdomain you do not use.
        </li>
        <li>
          <strong>Blocked by robots.txt.</strong> A blanket disallow that catches the AI user agents also stops
          them fetching this file, which defeats the purpose entirely.
        </li>
        <li>
          <strong>Left to go stale.</strong> Links to pages you have since moved or deleted undermine the one thing
          the file is for, which is telling an assistant your map is reliable.
        </li>
      </ul>
      <p>
        A final caution worth repeating: adoption of this standard is still partial and its measurable effect on
        citations is unproven. Add it because it costs minutes and might matter later, not because anyone can show
        you it moves answers today.
      </p>

        homepage, your routing is rewriting it. </p>      <h2>What else do people ask about llms.txt?</h2>

      <h3>Will llms.txt hurt anything if engines ignore it?</h3>
      <p>
        No. It is a static text file that nothing else reads, so the realistic downside is the few minutes it
        takes rather than any risk to your existing search visibility.
      </p>

      <h3>Does llms.txt replace robots.txt or a sitemap?</h3>
      <p>
        No, it sits alongside them. robots.txt controls access, the sitemap lists URLs for crawlers, and
        llms.txt offers a curated summary aimed at assistants.
      </p>

      <h3>How long should an llms.txt file be?</h3>
      <p>
        Short enough to stay accurate, usually one screen. A focused list of your key pages with one-line
        descriptions is more useful than an exhaustive dump of every URL.
      </p>

      <h3>Who actually reads llms.txt today?</h3>
      <p>
        Anthropic has said Claude reads it, and adoption elsewhere is partial and largely unconfirmed. Treat it
        as cheap preparation for a standard rather than a proven lever.
      </p>

 <h2>How often should I update my llms.txt file?</h2> <p>
        Review it whenever your offering changes. Your <code>llms.txt</code> should reflect your current
        services, pages, and details. Stale info is worse than none — it teaches AI the wrong thing about you.
        Review it whenever your offering changes.
      </p>

      <p>
        The key takeaway is that llms.txt is a quick, low-cost file worth adding and keeping current, but it is
        one clean input among several, not the whole strategy.
      </p>

      <hr />
      <p>
        <strong>Want this done for you?</strong> Alphaa automatically generates and hosts an{" "}
        <code>llms.txt</code> for your business from your profile, keeps it current, and optimizes the other
        signals AI engines read — schema, Google Business Profile, and content.{" "}
        <Link href="/start">Run the free AI check →</Link>
      </p>
    </div>
  )
}
