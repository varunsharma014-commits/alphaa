import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "google-business-profile-ai-answers",
  title: "Does Your Google Business Profile Feed AI Answers?",
  description:
    "Your Google Business Profile is not plugged directly into ChatGPT — but it is the most widely copied description of your business on the internet, which is why it shapes what every AI assistant says about you. Here is which fields matter, how the data actually travels, and the fields most businesses leave empty.",
  date: "2026-08-05",
  readMins: 10,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of local businesses and manage
          Google Business Profiles as part of the product. Last updated 5 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Not directly, and yes, substantially. No AI assistant queries your
        Google Business Profile (GBP) as a live data source the way Google Maps does. But GBP is the origin
        point for the most-copied description of your business anywhere on the web — it populates your Google
        knowledge panel, gets scraped into directories and aggregators, and is the version of your details that
        appears in the pages assistants actually retrieve. Change GBP and, over weeks, you change what dozens of
        crawlable pages say about you. That is the mechanism.
      </p>

      <h2>How the data actually travels</h2>
      <p>
        It helps to be precise here, because the popular version of this claim is wrong in a way that leads to
        wasted effort. Here is the real chain, in order:
      </p>
      <ol>
        <li>
          <strong>You edit GBP.</strong> Name, categories, hours, services, description, attributes, photos,
          Q&amp;A, posts.
        </li>
        <li>
          <strong>Google renders it publicly.</strong> Your knowledge panel, your Maps listing, and local pack
          results — all crawlable, all indexed.
        </li>
        <li>
          <strong>Aggregators and directories copy it.</strong> Data aggregators, niche directories, and
          &quot;best X in Y&quot; sites either scrape or re-key from the public listing, which is why a typo in
          your GBP address reappears on sites you have never heard of.
        </li>
        <li>
          <strong>AI engines retrieve those copies.</strong> When an assistant runs a live search for
          &quot;dentist in Manchester open Saturdays,&quot; the documents it pulls include those directory
          pages, roundups, and review sites — not the GBP API.
        </li>
        <li>
          <strong>The model synthesises what it read.</strong> Facts repeated identically across many retrieved
          documents get stated confidently. Facts that disagree get hedged or dropped.
        </li>
      </ol>
      <p>
        So GBP&apos;s influence is real but <em>indirect and lagged</em>. It works through propagation and
        consensus, which is why fixes take weeks rather than hours, and why the goal is consistency rather than
        keyword stuffing. The general version of this mechanism is in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          entity SEO and how AI identifies your business
        </Link>
        .
      </p>
      <p>
        One caveat worth stating plainly: Gemini is built by Google and Copilot draws on Bing&apos;s index, so
        the distance between your listing and the answer is shorter on some engines than others. Google has not
        published a mapping of which surfaces read GBP directly, and it changes. Assume propagation, and treat
        any shorter path as a bonus.
      </p>

      <h2>The fields that actually move the needle</h2>
      <p>
        Not all of GBP matters equally for AI answers. Ranked by how often we see each one change a scan
        result:
      </p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Why it matters to an AI engine</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Primary category</td>
            <td>
              The single strongest statement of what you are. It determines which questions you are even a
              candidate for. Wrong category is the most expensive quiet mistake in local AEO.
            </td>
          </tr>
          <tr>
            <td>Business name (exact)</td>
            <td>
              The string every other source keys off. Variants fragment you into several weak entities instead
              of one strong one.
            </td>
          </tr>
          <tr>
            <td>Services / products list</td>
            <td>
              Turns &quot;a plumber&quot; into &quot;a plumber who does boiler replacements and power
              flushing&quot; — the specificity that lets an engine match a narrow query to you.
            </td>
          </tr>
          <tr>
            <td>Hours, including special hours</td>
            <td>
              Assistants answer &quot;open now?&quot; and &quot;open Sunday?&quot; constantly. Unset special
              hours produce confidently wrong answers on exactly the days that matter.
            </td>
          </tr>
          <tr>
            <td>Attributes</td>
            <td>
              Wheelchair accessible, women-owned, free parking, appointment required. These map directly onto
              qualifier queries and are the least-filled section we encounter.
            </td>
          </tr>
          <tr>
            <td>Business description (750 chars)</td>
            <td>
              The one place you write your own summary. It gets reused verbatim across sites, so it is the
              closest thing you have to dictating your own entry.
            </td>
          </tr>
          <tr>
            <td>Reviews and your replies</td>
            <td>
              Third-party corroboration plus quotable specifics. Covered separately in{" "}
              <Link href="/blog/google-reviews-ai-visibility">
                how Google reviews affect your AI visibility
              </Link>
              .
            </td>
          </tr>
          <tr>
            <td>Q&amp;A section</td>
            <td>
              Literally question-and-answer text about your business, on a high-authority indexed page. It is
              the most under-used asset on this list.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>The three gaps we find in almost every audit</h2>
      <h3>1. An empty or hostile Q&amp;A section</h3>
      <p>
        GBP lets anyone ask a public question about your business, and lets anyone answer — including
        competitors and confused strangers. Most owners have never opened the section. The result is a
        question-shaped block of text about your business, sitting on an indexed Google surface, that you did
        not write.
      </p>
      <p>
        The fix takes twenty minutes. Google explicitly permits owners to post their own questions and answers.
        Write out the eight questions your front desk answers weekly — do you take walk-ins, is parking free,
        what does a first appointment cost, do you serve [neighbouring town], what insurance do you take — and
        post each as a question, then answer it from the business account. Answer in complete, standalone
        sentences: &quot;Yes, we accept walk-ins Monday to Friday before 4pm&quot; is quotable, &quot;Yes&quot;
        is not. Then read every existing answer and, where one is wrong, post a correct owner answer beneath it
        rather than arguing with it.
      </p>
      <h3>2. Services left as a category default</h3>
      <p>
        Choosing a category auto-suggests generic service names, and most profiles stop there. Generic services
        make you a generic candidate. Replace them with the specific jobs you are hired for, in the words
        customers use — not &quot;HVAC services&quot; but &quot;emergency boiler repair,&quot; &quot;annual
        boiler service,&quot; &quot;radiator installation.&quot; Each specific service is one more query you
        can plausibly be matched to.
      </p>
      <h3>3. Details that contradict the website</h3>
      <p>
        This is the one that actively costs you answers rather than merely failing to help. When your GBP says
        one thing and your site says another, an engine seeing both has no basis to choose, so it hedges or
        omits. Put your contact page and your GBP on screen together and reconcile, character for character:
        legal name, street format, suite number, phone number formatting, opening hours. Then mirror the
        reconciled version into <code>LocalBusiness</code> schema on your site so the machine-readable copy
        agrees too — see <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h2>A 45-minute GBP pass, in order</h2>
      <ol>
        <li>
          <strong>Verify the primary category</strong> against how customers describe you, not how your
          industry describes itself. Add secondary categories only where you genuinely deliver that service.
        </li>
        <li>
          <strong>Fix the name to your exact legal or trading name.</strong> No appended keywords or cities —
          that violates Google&apos;s naming guidelines and risks suspension, and it fragments your entity.
        </li>
        <li>
          <strong>Fill every service</strong> with a specific, customer-worded item and a one-line description.
        </li>
        <li>
          <strong>Fill every applicable attribute.</strong> Work through the whole list; it is fast and almost
          nobody does it.
        </li>
        <li>
          <strong>Rewrite the description</strong> as plain factual prose: what you do, for whom, where, what
          makes you specifically different, since when. No superlatives — &quot;the best in town&quot; is
          unquotable, &quot;family-run since 1998, specialising in listed-building rewiring&quot; is quotable.
        </li>
        <li>
          <strong>Seed and clean the Q&amp;A</strong> as described above.
        </li>
        <li>
          <strong>Reconcile against your website and top three directories,</strong> then update schema.
        </li>
        <li>
          <strong>Set special hours</strong> for the next twelve months of holidays now, in one sitting.
        </li>
        <li>
          <strong>Re-scan in four to six weeks.</strong> Propagation is slow; judging it after a week tells you
          nothing.
        </li>
      </ol>
      <p>
        If you operate several locations, do this per location and expect the consistency problem to be the
        hard part — that specific failure mode is covered in{" "}
        <Link href="/blog/multi-location-business-ai-visibility">
          AI visibility for multi-location businesses
        </Link>
        .
      </p>

      <h2>What GBP will not do</h2>
      <p>
        Being honest about the ceiling saves you from over-investing. A complete profile makes you an accurate,
        findable candidate. It does not make you the recommended one.
      </p>
      <ul>
        <li>
          <strong>It will not create demand or authority.</strong> Recommendation queries lean heavily on
          third-party evidence — reviews, roundups, press, forum threads. GBP is your entry in the register,
          not your reputation.
        </li>
        <li>
          <strong>It will not fix a site an engine cannot read.</strong> If your service pages are unreadable
          to crawlers, GBP cannot compensate. See{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">
            the AI crawlers and robots.txt guide
          </Link>
          .
        </li>
        <li>
          <strong>It will not produce identical answers every time.</strong> The same question can yield
          different names on different days; that is normal model behaviour, not a failed profile. Why that
          happens is in{" "}
          <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
        </li>
        <li>
          <strong>It guarantees nothing.</strong> No one can promise placement in an AI answer, and GBP posting
          services that imply otherwise are selling certainty they do not have.
        </li>
      </ul>

      <h2>Common questions</h2>
      <h3>Do GBP posts help my AI visibility?</h3>
      <p>
        Modestly, and mostly indirectly. Posts are indexed content attached to a high-authority profile, which
        keeps a stream of current, dated, factual text about you in circulation. They are worth doing as
        maintenance, not as a growth lever — and a post that just says &quot;call us today&quot; adds nothing.
        Write posts that state facts: a new service, a seasonal change in hours, a specific offer with its
        terms.
      </p>
      <h3>How long before GBP changes show up in AI answers?</h3>
      <p>
        Google surfaces update within days. The downstream copies that assistants retrieve take longer —
        typically four to eight weeks for directories and aggregators to reflect a change, sometimes longer for
        sites that refresh rarely. Anything absorbed into a model&apos;s baseline training knowledge waits for
        the next training cycle.
      </p>
      <h3>My business has no physical location. Does GBP still apply?</h3>
      <p>
        Yes, if you serve customers in person at their location — set it up as a service-area business, hide
        the address, and define the areas precisely. If you are fully remote with no service area, GBP is not
        available to you and the equivalent work is your own site&apos;s structured data plus third-party
        listings.
      </p>
      <h3>Someone posted wrong information on my profile. What do I do?</h3>
      <p>
        Use the suggest-an-edit and report flows for user-submitted edits, and post an owner answer beneath any
        wrong Q&amp;A rather than only reporting it — an authoritative correct answer sitting next to a wrong
        one is itself a useful signal. If the bad information has already spread to other sources, the wider
        cleanup process is in{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">
          how to fix wrong AI information about your business
        </Link>
        .
      </p>

      <h2>The bottom line</h2>
      <p>
        Your Google Business Profile is not wired into ChatGPT, and it does not need to be. It is the master
        copy of your business facts, and copies of it are exactly what AI assistants read when they answer
        questions about local businesses. Get the category right, make the services specific, fill the
        attributes, own the Q&amp;A, and make every detail match your website exactly — then wait out the
        propagation. Almost every &quot;the AI got my business wrong&quot; case we scan traces back to a
        contradiction that started here.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
