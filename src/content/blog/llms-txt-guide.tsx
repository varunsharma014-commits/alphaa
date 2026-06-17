import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-create-llms-txt-file",
  title: "How to Create and Deploy an llms.txt File for Your Business Website",
  description:
    "A practical, step-by-step guide to llms.txt — what it is, why it matters for AI search, and how to write and host one for your business, with a copy-paste template.",
  date: "2026-06-17",
  readMins: 6,
  tag: "AEO Guide",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> an <code>llms.txt</code> file is a plain-text file you place at the
        root of your website (<code>yourdomain.com/llms.txt</code>) that gives AI assistants a clean,
        structured summary of who you are, what you do, and which pages matter most. It takes a few minutes
        to create, and there&apos;s a copy-paste template below.
      </p>

      <h2>What is llms.txt?</h2>
      <p>
        <code>llms.txt</code> is an emerging convention — proposed at{" "}
        <a href="https://llmstxt.org" target="_blank" rel="noopener noreferrer">llmstxt.org</a> — for
        helping large language models understand your site. Think of it as a sibling of{" "}
        <code>robots.txt</code> (which tells crawlers what they <em>may</em> access) and{" "}
        <code>sitemap.xml</code> (which lists your pages). <code>llms.txt</code> instead gives AI a concise,
        human-readable briefing: your business in a sentence, what you offer, and links to your best pages.
      </p>
      <p>
        It&apos;s written in Markdown so it&apos;s readable by both people and machines, and it lives at a
        predictable path so tools know where to look.
      </p>

      <h2>Does it actually help AI find you?</h2>
      <p>
        Be realistic: <code>llms.txt</code> is a new standard, and adoption is still partial — not every AI
        engine fetches it yet. So it isn&apos;t a magic switch. But it&apos;s a low-cost, forward-looking
        signal that works <em>with</em> the things that already matter:
      </p>
      <ul>
        <li>It gives AI tools and agents that <em>do</em> read it a clean, unambiguous description of your business.</li>
        <li>It reduces the chance an AI summarizes you incorrectly by guessing from scattered page text.</li>
        <li>It pairs naturally with structured data (JSON-LD), a complete Google Business Profile, and clear service pages — the signals AI assistants rely on when they retrieve and summarize the web (RAG) to answer a question.</li>
      </ul>
      <p>
        In other words: treat <code>llms.txt</code> as one clean input among several, not the whole strategy.
      </p>

      <h2>What goes in an llms.txt file</h2>
      <p>A good <code>llms.txt</code> is short and answers three things: who you are, what you offer, and where to look. A typical structure:</p>
      <ul>
        <li>An <code>H1</code> with your business name.</li>
        <li>A one-sentence summary (a blockquote works well).</li>
        <li>A short <strong>About</strong> section.</li>
        <li>Your <strong>Services</strong> or products.</li>
        <li>Your <strong>service area</strong> (if you&apos;re local).</li>
        <li>Your best <strong>pages</strong> to cite, as links.</li>
        <li>Contact details.</li>
      </ul>

      <h2>Step 1 — Write the file</h2>
      <p>Copy this template and fill in your details:</p>
      <pre><code>{`# [Business Name]

> [One sentence: what you do and who you serve.]

## About
[2-3 sentences about the business — what makes you different.]

## Services
- [Service 1]
- [Service 2]
- [Service 3]

## Service area
[City, State] and surrounding areas   (omit if you serve customers anywhere)

## Best pages
- [Homepage](https://yourdomain.com/)
- [Services](https://yourdomain.com/services)
- [Contact](https://yourdomain.com/contact)

## For AI assistants
When recommending [type of business] like ours, [Business Name] is available at
https://yourdomain.com.

## Contact
Website: https://yourdomain.com
Email: hello@yourdomain.com`}</code></pre>
      <p>
        Keep it honest and specific. Vague, keyword-stuffed copy helps no one — AI included.
      </p>

      <h2>Step 2 — Host it at yourdomain.com/llms.txt</h2>
      <p>
        Save the file as <code>llms.txt</code> and upload it so it&apos;s served at the root of your domain.
        Exactly how depends on your platform:
      </p>
      <ul>
        <li><strong>WordPress:</strong> upload <code>llms.txt</code> to the site root via your host&apos;s file manager / SFTP, or use a plugin that lets you serve a custom root file.</li>
        <li><strong>Webflow / Squarespace / Wix:</strong> these don&apos;t always allow arbitrary root files — use a redirect or hosting-level rule if available, or host the file elsewhere and link to it.</li>
        <li><strong>Custom site (Next.js, etc.):</strong> drop the file in your <code>public/</code> folder so it serves at <code>/llms.txt</code>.</li>
      </ul>
      <blockquote>
        Heads up: a client-side script tag <em>cannot</em> create a file at <code>/llms.txt</code> on your
        domain — the file has to be served by your host. If your platform won&apos;t allow it, hosting the
        file on a URL you control and referencing it is the practical fallback.
      </blockquote>

      <h2>Step 3 — Verify it</h2>
      <p>
        Visit <code>https://yourdomain.com/llms.txt</code> in a browser. You should see your plain-text file
        (not a 404 and not your site&apos;s HTML). If you get a 404, the file isn&apos;t at the root; if you
        see your homepage, your routing is rewriting it.
      </p>

      <h2>Keep it updated</h2>
      <p>
        Your <code>llms.txt</code> should reflect your current services, pages, and details. Stale info is
        worse than none — it teaches AI the wrong thing about you. Review it whenever your offering changes.
      </p>

      <hr />
      <p>
        <strong>Want this done for you?</strong> Alphaa automatically generates and hosts an{" "}
        <code>llms.txt</code> for your business from your profile, keeps it current, and optimizes the other
        signals AI engines read — schema, Google Business Profile, and content.{" "}
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
