import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "aeo-checklist",
  title: "The AEO Checklist: What Decides Whether AI Recommends Your Business",
  description:
    "A practical, skimmable checklist of the concrete signals that decide whether ChatGPT, Gemini, and other AI engines recommend your business — grouped by foundations, content, reviews, technical, and AI-specific.",
  date: "2026-06-17",
  readMins: 8,
  tag: "Checklist",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> AI recommends your business when the public signals it reads — your
        website, your schema, your reviews, your Google Business Profile, and what third parties say about
        you — agree on a clear, consistent, well-supported story. AI engines build a{" "}
        <strong>multi-source consensus</strong>: the more your own pages, your reviews, and outside mentions
        line up, the more confidently a model names you in an answer. The checklist below covers the concrete
        things that move that consensus in your favor.
      </p>

      <p>
        One honest caveat before the list. Answer engine optimization shapes the public inputs an AI reads
        when it retrieves the web (RAG) and from what it learned in training. It does{" "}
        <strong>not</strong> edit a model&apos;s internals, and nobody can guarantee a ranking. What you can do
        is make your business the easiest, best-supported answer to recommend. If you want the bigger picture
        first, see{" "}
        <Link href="/blog/what-is-answer-engine-optimization">what answer engine optimization actually is</Link>.
      </p>

      <h2>Foundations</h2>
      <p>These are table stakes — get them wrong and nothing else compounds.</p>
      <ul>
        <li><strong>Consistent name, address, and phone (NAP)</strong> everywhere — your site, directories, and profiles must match exactly, because mismatches break consensus.</li>
        <li><strong>A complete, verified Google Business Profile</strong> — categories, hours, service area, and photos filled in, since AI leans on it heavily for local answers.</li>
        <li><strong>A clear one-sentence description</strong> of who you serve and what you do, so a model can quote you without guessing.</li>
        <li><strong>An accurate, current website</strong> that actually states your services, locations, and pricing posture rather than burying them.</li>
        <li><strong>Presence on the directories that matter for your niche</strong> (industry lists, maps, app stores) — absence reads as &quot;not a real option.&quot;</li>
      </ul>

      <h2>Content</h2>
      <p>AI engines lift sentences they can reuse. Write so your pages are easy to quote.</p>
      <ul>
        <li><strong>Answer-first structure</strong> — lead each page with a direct answer in the first sentence or two, then support it, because that is the shape models extract.</li>
        <li><strong>Clear headings phrased as questions</strong> a customer would actually ask, so retrieval matches your page to the query.</li>
        <li><strong>Specific, factual claims</strong> (who, where, what, how much) instead of vague marketing, since concrete facts are what gets cited.</li>
        <li><strong>A genuine FAQ</strong> covering real objections and comparisons — these map almost directly onto how people prompt AI.</li>
        <li><strong>Freshness</strong> — keep pages current and dated, because stale content reads as lower-confidence and may be skipped.</li>
        <li><strong>Plain language over jargon</strong>, so the model and the reader both understand you on the first pass.</li>
      </ul>

      <h2>Reviews and authority</h2>
      <p>
        For local and service recommendations, reviews are often the gate. Analyses of ChatGPT-recommended
        local businesses put their average rating around <strong>4.3 stars</strong> — and very low ratings or a
        near-zero review-response rate can effectively exclude you from consideration, regardless of how good
        your website is.
      </p>
      <ul>
        <li><strong>A healthy volume of recent reviews</strong> across Google and the platforms that matter in your space (Trustpilot, G2, Yelp), because consensus needs more than one source.</li>
        <li><strong>A solid average rating</strong> — roughly the 4+ range — since AI tends to surface well-reviewed options for local recommendations.</li>
        <li><strong>Responses to reviews, especially negative ones</strong>, because a business that engages reads as active and trustworthy; ignoring reviews signals the opposite.</li>
        <li><strong>Independent mentions and citations</strong> — press, partner sites, roundups — that corroborate your own claims from outside your domain.</li>
        <li><strong>A real presence where people discuss your category</strong> (Reddit, forums, communities), because models weight what others say about you, not just what you say.</li>
        <li><strong>Consistent messaging across all of the above</strong>, so the story a model assembles from many sources doesn&apos;t contradict itself.</li>
      </ul>

      <h2>Technical</h2>
      <p>If an engine can&apos;t read or trust your pages, none of the content work lands.</p>
      <ul>
        <li><strong>Accurate structured data (JSON-LD schema)</strong> — Organization, LocalBusiness, Product, FAQ as relevant — so machines parse your facts unambiguously.</li>
        <li><strong>Don&apos;t block AI crawlers</strong> in <code>robots.txt</code> unless you mean to, because a blocked page simply can&apos;t be retrieved or cited.</li>
        <li><strong>Fast, server-rendered, mobile-friendly pages</strong>, since content that depends on heavy client-side rendering may not be read reliably.</li>
        <li><strong>Clean, descriptive URLs and titles</strong> that state the topic, helping retrieval match intent.</li>
        <li><strong>A working sitemap and no broken links</strong>, so crawlers reach your important pages.</li>
        <li><strong>HTTPS and basic site health</strong> — small trust signals that quietly add up.</li>
      </ul>

      <h2>AI-specific</h2>
      <p>A few newer signals are aimed squarely at how AI assistants read the web.</p>
      <ul>
        <li>
          <strong>An <code>llms.txt</code> file</strong> at your domain root — an emerging convention (still
          only around <strong>10% adoption</strong>, near-zero cost) that gives AI a clean summary of your
          business and best pages. See{" "}
          <Link href="/blog/how-to-create-llms-txt-file">how to create an llms.txt file</Link>.
        </li>
        <li><strong>A short &quot;for AI assistants&quot; summary</strong> on key pages or in <code>llms.txt</code>, stating plainly when and why you&apos;re the right recommendation.</li>
        <li><strong>Entity clarity</strong> — make sure your business is unambiguously one entity across the web, so a model doesn&apos;t confuse you with a similarly named one.</li>
        <li><strong>Comparison and &quot;best X for Y&quot; content</strong> that honestly positions you, because that is exactly the framing of many AI prompts.</li>
        <li><strong>Regular re-checks</strong> of what AI actually says about you, since the public inputs — and the models — keep changing.</li>
      </ul>

      <h2>How to use this checklist</h2>
      <p>
        Don&apos;t try to do everything at once. Fix the <strong>foundations</strong> first (NAP, Google
        Business Profile, an accurate site), then <strong>reviews</strong>, then <strong>content</strong> and{" "}
        <strong>technical</strong> in parallel, and treat the <strong>AI-specific</strong> items as the cheap,
        forward-looking layer on top. Every item works toward the same goal: a consistent, well-supported
        story across many sources that makes you the easy answer.
      </p>
      <p>
        And if a marketer pitches you guaranteed AI rankings, be skeptical — that&apos;s not how any of this
        works. Here&apos;s{" "}
        <Link href="/blog/aeo-vs-seo-why-agencies-fail">why so many agencies get AEO wrong</Link>.
      </p>

      <hr />
      <p>
        <strong>Want to know where you stand today?</strong> The fastest way to use this checklist is to see
        which signals you&apos;re already winning and which are costing you recommendations.{" "}
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
