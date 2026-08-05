import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "content-freshness-ai-search",
  title: "Does Content Freshness Matter for AI Search? How Often to Update Your Pages",
  description:
    "Freshness matters to AI engines, but not the way SEO folklore suggests — it is about retrievability and verifiable dates, not edit frequency. Here is which pages actually decay, how often to update each type, and why changing a date without changing the content does nothing.",
  date: "2026-08-05",
  readMins: 9,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and re-run them over
          time, so we watch the same pages get cited, dropped, and re-cited. Last updated 5 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes, content freshness affects whether AI engines cite you — but it is
        the <em>substance</em> of the update that matters, not the timestamp. AI assistants that retrieve live
        web results tend to favour pages that are recent, dated, and factually current for time-sensitive
        questions, and they largely ignore recency for stable, definitional ones. Bumping a
        &quot;last updated&quot; date on unchanged text does not help and can quietly hurt you, because the
        engine can compare your claimed date against content that plainly has not moved.
      </p>

      <h2>Why freshness matters to an AI engine at all</h2>
      <p>
        Modern assistants answer in two modes. For general knowledge they lean on training data, which is
        frozen at a cutoff. For anything current, they run a retrieval step: search the live web, pull a
        handful of documents, read them, and synthesise. Freshness only enters through that second path.
      </p>
      <p>
        Inside the retrieval step, recency is used as a <strong>tiebreaker and a trust filter</strong>, not as
        a ranking factor in the classical SEO sense. When two pages say roughly the same thing, the one whose
        content is verifiably current is the safer thing for a model to repeat, because stating something
        outdated is a visible failure. So the practical question is not &quot;how often should I publish?&quot;
        It is &quot;if a model retrieves my page today, does anything on it look stale enough to make quoting
        it risky?&quot;
      </p>
      <p>
        That is why freshness behaves so differently by query type. Ask an assistant &quot;what is answer
        engine optimization&quot; and a solid 2024 explainer is still perfectly citable. Ask it &quot;what does
        an emergency plumber in Leeds charge in 2026&quot; and a 2024 price page is a liability. Same engine,
        opposite treatment.
      </p>

      <h2>What actually decays on a business website</h2>
      <p>
        In scans, the pages that lose citations are rarely the ones that &quot;stopped being updated.&quot;
        They are the ones carrying a specific, checkable fact that has since become wrong. The four we see
        most:
      </p>
      <ul>
        <li>
          <strong>Prices and packages.</strong> The single most common stale fact. An engine that finds two
          different prices for you — one on your site, one on a directory — will usually hedge or drop the
          number entirely rather than pick.
        </li>
        <li>
          <strong>Hours, locations, and service areas.</strong> Anything an assistant might state confidently
          on your behalf. Wrong here does not just cost a citation, it costs a customer who drives to a closed
          door.
        </li>
        <li>
          <strong>Staff, credentials, and named people.</strong> A team page listing someone who left two years
          ago undermines the authorship signals the same page is supposed to provide.
        </li>
        <li>
          <strong>Year-stamped and version-stamped claims.</strong> &quot;Our 2024 guide,&quot; &quot;compliant
          with the 2023 standard,&quot; &quot;as of last year.&quot; These date a page far more aggressively
          than the file&apos;s modification time does.
        </li>
      </ul>
      <p>
        Notice what is absent from that list: blog cadence. Publishing weekly does not refresh a stale pricing
        page. The decay is per-fact, not per-site.
      </p>

      <h2>How often to update, by page type</h2>
      <p>
        This is the cadence we actually run for clients. Treat it as a maintenance schedule, not a content
        quota — the review is mandatory, the edit only happens if something changed.
      </p>
      <table>
        <thead>
          <tr>
            <th>Page type</th>
            <th>Review cadence</th>
            <th>What you are checking</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pricing, packages, offers</td>
            <td>Monthly</td>
            <td>Every figure matches what you actually charge today, and matches your other profiles</td>
          </tr>
          <tr>
            <td>Hours, address, service area, phone</td>
            <td>Monthly, plus immediately on any change</td>
            <td>Site, Google Business Profile, and directories all agree exactly</td>
          </tr>
          <tr>
            <td>Core service pages</td>
            <td>Quarterly</td>
            <td>Services listed are services you still sell; no dead links; specifics still true</td>
          </tr>
          <tr>
            <td>Team, credentials, licences, certifications</td>
            <td>Quarterly</td>
            <td>Named people are current; licence and registration numbers still valid</td>
          </tr>
          <tr>
            <td>Statistics, market claims, comparisons</td>
            <td>Every 6 months</td>
            <td>Source still exists, figure has not been superseded, attribution intact</td>
          </tr>
          <tr>
            <td>Definitional and how-to explainers</td>
            <td>Annually</td>
            <td>Mechanism still accurate; only rewrite if the underlying reality changed</td>
          </tr>
        </tbody>
      </table>

      <h2>A worked example: the audit we run first</h2>
      <p>
        Before touching anything, find out what is actually stale. This takes about thirty minutes on a
        typical small-business site.
      </p>
      <ol>
        <li>
          <strong>List every page carrying a checkable fact.</strong> Pricing, contact, hours, services, team,
          any page with a year in the title. For most local businesses this is under fifteen URLs.
        </li>
        <li>
          <strong>Search your own site for stale year strings.</strong> In Google:{" "}
          <code>site:yourdomain.com &quot;2024&quot;</code>, then repeat for 2023 and 2025. Every hit is a page
          announcing its own age to a retrieval system.
        </li>
        <li>
          <strong>Cross-check the facts against your other profiles.</strong> Open your Google Business Profile
          and your two biggest directory listings side by side with your contact page. Note every mismatch —
          contradictions cost you more than staleness does.
        </li>
        <li>
          <strong>Ask an assistant directly.</strong> Prompt ChatGPT or Perplexity with &quot;what does
          [your business] charge for [service], and when was that information last confirmed?&quot; If the
          answer is wrong or hedged, you have located the page to fix. The method in detail is in{" "}
          <Link href="/blog/how-to-see-what-chatgpt-says-about-your-business">
            how to see what ChatGPT says about your business
          </Link>
          .
        </li>
        <li>
          <strong>Fix the fact, then let the date move on its own.</strong> Edit the content, update any{" "}
          <code>dateModified</code> in your schema so it reflects the real change, and resubmit the URL in
          Google Search Console.
        </li>
      </ol>

      <h2>Dates, schema, and the thing not to do</h2>
      <p>
        Give machines an honest, machine-readable date. In practice that means three things agreeing: a visible
        &quot;last updated&quot; line in the page text, <code>datePublished</code> and <code>dateModified</code>{" "}
        in your <code>Article</code> or <code>BlogPosting</code> schema, and the actual{" "}
        <code>Last-Modified</code> header your server sends. When those agree, a retrieval system has an
        unambiguous signal. When they contradict each other, it has a reason to distrust all three. The markup
        details are in <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>
      <p>
        The thing not to do is the one many agencies automate: rewriting <code>dateModified</code> on a
        schedule while the page itself never changes. It is easy to do, it feels productive, and it fails in
        both directions. Retrieval systems read the content, not just the metadata, so a &quot;2026&quot; stamp
        on a page discussing 2023 realities reads as a contradiction rather than as freshness. And a site where
        every page claims to have been updated yesterday has made its dates meaningless as a signal.
      </p>
      <p>
        Be equally honest about the limits here. Nobody outside the engine teams can see how heavily recency is
        weighted, and the weighting differs between assistants and changes with model versions. What is well
        established is the direction: retrieval-based systems prefer current, internally consistent, dated
        documents for time-sensitive questions. That is enough to act on. It is not enough to promise anyone a
        citation, and any vendor pricing &quot;freshness updates&quot; as a guaranteed ranking lever is selling
        you a date field.
      </p>

      <h2>Updating an existing page vs publishing a new one</h2>
      <p>
        When a topic you already cover needs new information, updating the existing URL is almost always the
        better move. It concentrates whatever authority and links the page has accumulated instead of splitting
        them, and it avoids putting two of your own pages into competition for the same retrieval slot.
      </p>
      <p>Publish something new instead when:</p>
      <ul>
        <li>The question is genuinely different, not a newer version of the same question.</li>
        <li>
          The existing page would have to answer two unrelated queries to absorb it — a page that hedges
          between topics is harder to quote cleanly.
        </li>
        <li>
          The old page has enough independent value that gutting it would destroy something that already works.
        </li>
      </ul>
      <p>
        If you do replace a page, redirect the old URL rather than deleting it. Broken URLs strand any
        third-party citation pointing at them, and those third-party mentions are doing more work for your AI
        visibility than the page itself.
      </p>

      <h2>Common questions</h2>
      <h3>Does publishing more blog posts improve my AI visibility?</h3>
      <p>
        Only if the posts answer questions people actually ask and are specific enough to quote. Volume alone
        does not register — engines retrieve per query, not per site. Ten thin posts add ten weak documents to
        the pool. What makes a page quotable is covered in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI actually quotes</Link>.
      </p>
      <h3>How quickly does an updated page show up in AI answers?</h3>
      <p>
        For assistants doing live retrieval, as soon as the page is re-crawled and re-indexed — commonly days
        to a few weeks, faster if you resubmit in Search Console. For a model&apos;s baseline training
        knowledge, not until its next training cycle, which you cannot schedule around. Realistic timelines are
        in <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>
      <h3>Should I remove old content that is out of date?</h3>
      <p>
        Fix it or merge it before deleting it. An outdated page that still gets found is a repairable asset; a
        deleted one takes its links and citations with it. Delete only content that is genuinely obsolete and
        that you would not want an engine quoting under any circumstances.
      </p>
      <h3>Does adding a &quot;last updated&quot; date help even on evergreen pages?</h3>
      <p>
        Yes, when it is true. A dated page is easier to trust and easier to cite than an undated one, and it
        lets a system see that the age is intentional rather than abandoned. The value comes from accuracy, not
        from the date being recent.
      </p>

      <h2>The bottom line</h2>
      <p>
        Freshness is real, narrow, and frequently mis-sold. AI engines care whether the specific facts they are
        about to repeat are still true, and they use dates to judge that — which makes accuracy, internal
        consistency, and honest timestamps the whole job. Build a maintenance schedule around the facts that
        decay, keep your dates truthful, and stop paying for date-field churn. If your answers about your own
        business are still wrong after that, the problem is usually contradictions across sources rather than
        age, and the repair path is in{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">
          how to fix wrong AI information about your business
        </Link>
        .
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
