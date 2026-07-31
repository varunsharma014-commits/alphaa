import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "fix-wrong-ai-information-about-your-business",
  title: "ChatGPT Is Wrong About My Business. How Do I Fix It?",
  description:
    "You can't edit an AI model's memory — you fix the public sources it reads and re-checks. Here's how to diagnose whether an error comes from stale training or bad retrieval, the correction workflow in priority order, and how long each fix actually takes.",
  date: "2026-07-31",
  readMins: 11,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of small businesses and see the same
          wrong answers repeat. Last updated 31 July 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> You cannot edit what an AI model says, because there is no dashboard,
        support ticket or API that reaches inside ChatGPT, Claude, Gemini or Perplexity to correct a fact about
        you. What you can do — and what actually works — is fix the public sources those engines read, make
        every one of them agree, and then re-check the answer over the following weeks. The fix is upstream of
        the model, not inside it.
      </p>

      <h2>First: which kind of wrong is it?</h2>
      <p>
        Before you change anything, work out where the error is coming from. There are two mechanisms, and they
        have completely different repair times.
      </p>
      <ul>
        <li>
          <strong>Stale training memory.</strong> The model absorbed a slice of the public web during training,
          and that snapshot is frozen at a cutoff date. If it says you are &quot;permanently closed&quot;
          because you were, briefly, in 2023, it is reciting an old snapshot. Nothing you publish today edits
          that snapshot.
        </li>
        <li>
          <strong>Bad retrieval.</strong> Most assistants now fetch live web pages at the moment you ask and
          summarise what they find — retrieval-augmented generation. If a stale directory listing, an old
          location page or a competitor&apos;s comparison article is what gets retrieved, the model faithfully
          repeats a wrong source. This is the fixable case, and it is the more common one.
        </li>
      </ul>

      <h3>How to tell them apart in two minutes</h3>
      <p>Run this test in the engine that is getting it wrong:</p>
      <ol>
        <li>
          Ask the question plainly: <em>&quot;What are the opening hours for [business name] in [city]?&quot;</em>
        </li>
        <li>
          Ask it again with an explicit instruction to search and cite:{" "}
          <em>&quot;Search the web and give me your sources for that.&quot;</em>
        </li>
        <li>Read the citations it returns.</li>
      </ol>
      <p>
        If the second answer is correct and cites your website, the error was training memory surfacing when no
        search ran — annoying, but it fades as engines lean harder on live retrieval. If the second answer is
        still wrong <em>and</em> names a source, you have found your culprit: that specific page is what needs
        fixing. If it cites nothing and hedges, the engine has too little to go on about you at all, which is a
        different problem — see{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          how AI actually identifies your business
        </Link>
        .
      </p>

      <h2>The six errors we see most often</h2>
      <ul>
        <li>
          <strong>Closed or moved.</strong> An old &quot;permanently closed&quot; flag or a previous address
          that still lives on a directory nobody has logged into for four years.
        </li>
        <li>
          <strong>Wrong hours or phone number.</strong> Usually a legacy listing with a disconnected line, or
          holiday hours that were never reverted.
        </li>
        <li>
          <strong>Entity collision.</strong> The model has merged you with a similarly named business — a
          different franchise of the same chain, or a company with your name in another state. This is the
          hardest one, and the one that most often produces confidently wrong detail.
        </li>
        <li>
          <strong>Invented services.</strong> The model lists something you do not offer, generally because it
          generalised from your category rather than reading your page.
        </li>
        <li>
          <strong>Stale pricing.</strong> A three-year-old blog post or an old PDF price list still ranks and
          still gets retrieved.
        </li>
        <li>
          <strong>Wrong ownership or staff.</strong> A departed partner still named as principal, usually
          because a press release or bar/association directory outlived them.
        </li>
      </ul>

      <h2>The correction workflow, in priority order</h2>
      <p>
        Work top to bottom. The order matters — the earlier items are re-crawled most often and carry the most
        weight, so fixing them first changes answers soonest.
      </p>
      <ol>
        <li>
          <strong>Google Business Profile.</strong> Claim it if you have not, then correct name, address,
          phone, hours, and category. If it is wrongly marked closed, use the reinstatement flow rather than
          creating a second profile — duplicates make entity collision worse, not better.
        </li>
        <li>
          <strong>Your own site&apos;s canonical facts.</strong> Put your legal name, address, phone, hours and
          service list in plain HTML text on a page that is easy to find, and mirror it in{" "}
          <Link href="/blog/schema-markup-for-ai-search">LocalBusiness JSON-LD schema</Link> with{" "}
          <code>name</code>, <code>address</code>, <code>telephone</code> and <code>openingHoursSpecification</code>
          . Add a <code>sameAs</code> array pointing at your own verified profiles — that is the machine-readable
          way of saying &quot;these listings are all me.&quot;
        </li>
        <li>
          <strong>The specific source the engine cited.</strong> If step one of the diagnosis named a page, go
          fix that page. Most directories have a &quot;suggest an edit&quot; or claim flow. This single step
          resolves more cases than everything below it.
        </li>
        <li>
          <strong>The other major listings.</strong> Apple Business Connect, Bing Places, Yelp, and the two or
          three directories that dominate your industry. Stale entries here keep re-seeding the wrong fact
          after you have fixed everything else.
        </li>
        <li>
          <strong>Old pages on your own domain.</strong> Do not simply delete a stale location or pricing page
          — a deleted page can linger in caches and third-party copies with no corrected version to replace it.
          Update it in place, or 301-redirect it to the current page so the correct fact inherits the link.
        </li>
        <li>
          <strong>An explicit disambiguation sentence</strong> when you have an entity collision. One plain
          line on your about page — &quot;[Your business] in [city] is independently owned and is not
          affiliated with [similarly named company]&quot; — gives a retrieval system something concrete to
          separate you on. It reads as helpful to humans too, which is the test for whether a tactic is
          legitimate.
        </li>
      </ol>

      <h2>How long does a correction take?</h2>
      <p>Honestly: it depends on the mechanism, and nobody can promise you a date.</p>
      <ul>
        <li>
          <strong>Retrieval-driven errors:</strong> often days to a few weeks, once the corrected page has been
          re-crawled. The engine is reading live; when the source changes, the answer can change.
        </li>
        <li>
          <strong>Directory-driven errors:</strong> gated by that directory&apos;s own moderation queue, which
          can run from 48 hours to several weeks.
        </li>
        <li>
          <strong>Training-baked errors:</strong> persist until the model is retrained or until live retrieval
          reliably overrides them. You do not control that schedule. What you can do is make the correct
          version so consistent and easy to retrieve that the model prefers it.
        </li>
      </ul>
      <p>
        Expect variation between engines and between phrasings of the same question — that is normal model
        behaviour, not a sign your fix failed. We wrote about why identical questions produce different answers
        in <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>

      <h2>What you cannot fix, and should stop trying to</h2>
      <ul>
        <li>
          <strong>The model&apos;s weights.</strong> No vendor can reach in and rewrite them. If someone offers
          to, that is the clearest snake-oil signal there is.
        </li>
        <li>
          <strong>Honest negative reviews.</strong> You can respond to them; you cannot make an engine ignore
          them, and attempting to suppress them tends to backfire publicly.
        </li>
        <li>
          <strong>Guaranteed wording.</strong> Even with perfect sources, you influence probabilities, not
          output. Anyone selling a guaranteed AI answer is selling something that does not exist.
        </li>
      </ul>

      <h2>Close the loop: re-check on a schedule</h2>
      <p>
        A correction is not done when you submit the edit; it is done when the answer changes. Keep a simple
        log: the exact question, the engine, the date, and the answer you got. Re-run the same three or four
        questions monthly across ChatGPT, Claude, Gemini and Perplexity, and record the result verbatim. That
        log is the only real evidence you have — and it is also what tells you which of your fixes did the
        work. If you want the manual method for capturing those answers, see{" "}
        <Link href="/blog/how-to-see-what-chatgpt-says-about-your-business">
          how to see what ChatGPT says about your business
        </Link>
        .
      </p>

      <h2>The bottom line</h2>
      <p>
        A wrong AI answer is almost always a wrong source, not a broken model. Diagnose which source, fix it at
        the origin, make every other public record agree, and then verify over weeks rather than hours. That is
        unglamorous work, and it is the only version of this that actually holds — because the next time an
        engine looks you up, it reads the same public record you just corrected.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
