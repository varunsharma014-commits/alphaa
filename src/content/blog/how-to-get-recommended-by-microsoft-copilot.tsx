import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-get-recommended-by-microsoft-copilot",
  title: "How to Get Recommended by Microsoft Copilot (and Bing's AI Answers)",
  description:
    "Copilot answers are grounded in the Bing index, which means the levers are different from ChatGPT or Perplexity: bingbot access, Bing Webmaster Tools, IndexNow, and a claimed Bing Places listing most businesses have never touched.",
  date: "2026-08-03",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and check what each
          major assistant says about them. Last updated 3 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Microsoft Copilot grounds its answers in Microsoft&apos;s own search
        index, so the fastest way to be recommended by Copilot is to make sure Bing can crawl you, knows your
        pages exist, and has a claimed Bing Places listing to match against. That is a genuinely different
        checklist from ChatGPT or Perplexity — and it is the one almost nobody runs, because most businesses
        stopped thinking about Bing a decade ago.
      </p>

      <h2>What is Microsoft Copilot, in retrieval terms?</h2>
      <p>
        Copilot is Microsoft&apos;s assistant layer — it appears in Windows, in the Edge sidebar, at
        copilot.microsoft.com, and inside Microsoft 365. Underneath the chat interface it does what other
        assistants do: it takes your question, decides whether it needs live information, runs a search, reads
        the returned documents, and writes an answer with links back to sources.
      </p>
      <p>
        The part that matters to you is <em>which</em> search. Copilot&apos;s web grounding comes from
        Microsoft&apos;s index — the same index behind Bing. That single fact reorganises the whole playbook:
      </p>
      <ul>
        <li>
          If <code>bingbot</code> cannot crawl a page, that page cannot ground a Copilot answer, no matter how
          well it ranks on Google.
        </li>
        <li>
          If a page is not in the Bing index at all, it is invisible to Copilot even if it is indexed in Google
          within hours of publishing.
        </li>
        <li>
          For local questions, Microsoft has its own business listing product —{" "}
          <a href="https://www.bingplaces.com" target="_blank" rel="noopener noreferrer">
            Bing Places for Business
          </a>{" "}
          — which is separate from your Google Business Profile and which a large share of local businesses have
          never claimed.
        </li>
      </ul>
      <p>
        Contrast that with ChatGPT and Claude, where the retrieval layer is a mix of their own crawlers and
        third-party search partners, or with Perplexity, which runs its own index. Being strong in one engine
        does not automatically carry to Copilot. In our scans, a business found by ChatGPT and missing from
        Copilot is one of the most common asymmetries we see — and the cause is nearly always an indexing
        problem, not a content problem.
      </p>

      <h2>Step 1: Confirm Bing can actually see you</h2>
      <p>
        Do this before anything else, because every later step depends on it. Two checks, five minutes.
      </p>
      <p>
        <strong>Check your robots.txt.</strong> Open <code>yourdomain.com/robots.txt</code> and look for any
        rule that disallows <code>bingbot</code>, or a blanket <code>User-agent: *</code> disallow that catches
        it. A surprising number of sites picked up an aggressive bot-blocking snippet during the 2024–25 panic
        about AI scraping and blocked Bing along with the AI crawlers. Blocking <code>bingbot</code> does not
        just cost you Bing rankings — it removes you from Copilot&apos;s grounding pool. If you want the full
        map of which bots do what, we covered it in{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">the AI crawlers and robots.txt guide</Link>.
      </p>
      <p>
        <strong>Check the index.</strong> Search <code>site:yourdomain.com</code> on Bing. Count the results.
        If Google shows 80 pages and Bing shows 6, you have found your Copilot problem. This gap is common on
        newer sites and on JavaScript-heavy sites, because Microsoft&apos;s crawl budget for a small unknown
        domain is thin and its rendering queue is slower than Google&apos;s.
      </p>

      <h2>Step 2: Set up Bing Webmaster Tools and import from Google</h2>
      <p>
        <a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer">
          Bing Webmaster Tools
        </a>{" "}
        is free and takes about ten minutes. What makes it worth the time is a feature Google has no equivalent
        of: you can verify ownership by importing your site directly from Google Search Console, which skips
        the DNS and meta-tag dance entirely.
      </p>
      <p>Once you are in, do exactly three things:</p>
      <ol>
        <li>
          <strong>Submit your sitemap.</strong> Sitemaps &gt; Submit sitemap &gt;{" "}
          <code>https://yourdomain.com/sitemap.xml</code>. If you do not have one, generate it — every modern
          CMS and framework does this automatically.
        </li>
        <li>
          <strong>Run URL Inspection on your five most important pages.</strong> Homepage, main service pages,
          pricing, contact. It tells you whether each URL is indexed and whether Bing hit an error fetching it.
        </li>
        <li>
          <strong>Use &quot;Submit URLs&quot; for anything missing.</strong> Bing lets verified sites submit
          URLs for direct indexing, with a daily quota. Use it on the pages you actually want quoted.
        </li>
      </ol>

      <h2>Step 3: Turn on IndexNow so new pages reach Copilot in hours</h2>
      <p>
        <a href="https://www.indexnow.org" target="_blank" rel="noopener noreferrer">IndexNow</a> is an open
        protocol Microsoft co-created. Instead of waiting for a crawler to rediscover a changed page, your site
        pings the participating search engines the moment a page is published or updated, and they come and
        fetch it. Bing is a participant; so is Yandex. Google has run tests but has not committed to it.
      </p>
      <p>
        This is the single highest-leverage technical step for Copilot visibility, because it attacks the exact
        bottleneck — Bing&apos;s slower rediscovery of small sites. In practice you have two options:
      </p>
      <ul>
        <li>
          <strong>Plugin route.</strong> WordPress, Wix, Duda and Cloudflare all have first-party IndexNow
          integrations. Enable it and you are done.
        </li>
        <li>
          <strong>Manual route.</strong> Generate a key, host it as a text file at your domain root (the file
          name is the key, the contents are the key), and POST your changed URLs to the IndexNow endpoint on
          publish. It is one HTTP call and roughly fifteen lines in a deploy hook.
        </li>
      </ul>
      <p>
        Honest caveat: IndexNow gets pages <em>looked at</em> faster. It does not force them to be indexed, and
        it does not make thin pages worth quoting. It removes a delay; it does not create authority.
      </p>

      <h2>Step 4: Claim Bing Places — the step nearly everyone skips</h2>
      <p>
        For any question with local intent — &quot;best dentist in Leeds,&quot; &quot;emergency electrician near
        me&quot; — Copilot needs a business record with a name, address, phone, hours and category. Google
        Business Profile does not feed Microsoft. Bing Places does.
      </p>
      <p>
        Bing Places has an import-from-Google option that pulls your existing profile across in a few clicks,
        which is why this is a twenty-minute task rather than a project. After importing, check three fields by
        hand, because imports drift:
      </p>
      <ul>
        <li>
          <strong>Categories</strong> — Microsoft&apos;s category list is not identical to Google&apos;s, and a
          mismatched primary category is the difference between being in the candidate set for a query and not.
        </li>
        <li>
          <strong>Hours</strong> — including holiday hours. Contradictory hours between your site, Google and
          Bing is exactly the kind of inconsistency that makes an assistant hedge instead of recommending you.
        </li>
        <li>
          <strong>Business name</strong> — character-for-character identical to everywhere else. &quot;Smith
          &amp; Sons Plumbing Ltd&quot; and &quot;Smith and Sons Plumbing&quot; can resolve as two weaker
          entities instead of one strong one. This is the fragmentation problem we unpack in{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO</Link>.
        </li>
      </ul>

      <h2>Step 5: Make the page itself quotable</h2>
      <p>
        Once Copilot can retrieve you, the remaining question is whether it can lift a clean sentence. The
        content rules here are the same ones that work across every assistant, and they are not exotic:
      </p>
      <ul>
        <li>
          <strong>Answer in the first two sentences.</strong> A retrieved page is skimmed, not read. Lead with
          the direct answer, then support it.
        </li>
        <li>
          <strong>Publish the specifics competitors hide.</strong> Prices or price ranges, service areas by name,
          response times, what you do <em>not</em> do. Assistants recommend what they can describe concretely.
        </li>
        <li>
          <strong>Add schema.</strong> Bing has supported <a href="https://schema.org" target="_blank" rel="noopener noreferrer">schema.org</a>{" "}
          markup for years. <code>LocalBusiness</code> (or the right subtype), <code>Organization</code>,{" "}
          <code>FAQPage</code> and <code>Product</code> give the index typed facts instead of guessed ones. See{" "}
          <Link href="/blog/schema-markup-for-ai-search">our schema guide</Link> for what to implement first.
        </li>
        <li>
          <strong>Do not hide the answer behind JavaScript.</strong> If the key facts only appear after a
          client-side fetch, assume Bing may not see them.
        </li>
      </ul>

      <h2>Does Copilot deserve the effort?</h2>
      <p>
        Be honest about the trade-off. Bing&apos;s share of raw web search is small next to Google&apos;s. The
        reason Copilot still earns a place on the list is distribution: it is built into Windows and Edge and
        surfaced inside Microsoft 365, so it reaches a lot of people at work who never chose an assistant at
        all. For B2B and professional services in particular, that is your buyer sitting at a work laptop.
      </p>
      <p>
        The wider context is that assistants are now a real research channel: 65% of consumers now use AI tools
        to research products before buying (Clutch, 2026). Copilot is one of the places that happens — and it
        is the one where the barrier to entry is a free webmaster tools account rather than a content war.
      </p>

      <h2>Frequently asked questions</h2>
      <h3>Is optimising for Copilot the same as optimising for Bing?</h3>
      <p>
        Largely, yes, at the retrieval layer — Copilot grounds in Microsoft&apos;s index, so getting indexed and
        ranked in Bing is the prerequisite. The difference is in what gets used once retrieved: Bing shows you a
        list of links, while Copilot picks a small number of sources and paraphrases them, which puts a much
        higher premium on being the clearest, most specific page rather than merely a top-ten one.
      </p>
      <h3>Do I need a separate Bing sitemap or separate content?</h3>
      <p>No. Same sitemap, same content. What differs is submission, verification and the local listing.</p>
      <h3>How long does it take to show up?</h3>
      <p>
        Indexing changes can land within days once IndexNow and Webmaster Tools are in place. Being{" "}
        <em>recommended</em> takes longer, because that depends on reviews, third-party mentions and consistency
        accumulating. We wrote up realistic timelines in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>
      <h3>Can I pay to be included in Copilot answers?</h3>
      <p>
        No. Microsoft sells advertising placements around and within some AI surfaces, but you cannot buy your
        way into the organic recommendation itself, and no vendor can insert you into one. Anyone claiming
        otherwise is selling something that does not exist.
      </p>

      <h2>The bottom line</h2>
      <p>
        Copilot visibility is mostly an indexing problem wearing an AI costume. Unblock <code>bingbot</code>,
        verify in Bing Webmaster Tools, submit your sitemap, wire up IndexNow, claim and correct Bing Places,
        and make the page answer its question in the first two sentences. None of that guarantees a citation —
        outputs vary by phrasing, user and model version, and we will not pretend otherwise. But it moves you
        from &quot;cannot be retrieved&quot; to &quot;eligible to be quoted,&quot; and on Copilot that gap is
        where most businesses are still stuck.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
