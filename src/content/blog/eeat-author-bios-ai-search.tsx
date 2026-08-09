import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "eeat-author-bios-ai-search",
  title: "Do Author Bios and About Pages Affect AI Search? How Engines Judge Credibility",
  description:
    "AI engines do not score E-E-A-T directly, but they retrieve and quote the pages that carry it. Here is what an author bio, an About page and a named source actually do to whether an assistant is willing to name you.",
  date: "2026-08-09",
  readMins: 10,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and read what the
          engines actually say back. Last updated 9 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes, but not the way most people assume. No AI engine computes an
        &quot;E-E-A-T score&quot; for your site. What actually happens is narrower and more mechanical: an
        assistant retrieves a handful of documents, then decides which claims it is willing to repeat under its
        own name. Pages that identify a real, checkable author and a real, checkable organisation give it
        something to attribute. Pages that do not are quietly harder to cite — not penalised, just less usable.
      </p>

      <h2>What E-E-A-T actually is, precisely</h2>
      <p>
        E-E-A-T stands for Experience, Expertise, Authoritativeness and Trustworthiness. It is not an algorithm
        and it is not a ranking factor. It is a set of criteria from Google&apos;s publicly published{" "}
        <a
          href="https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf"
          rel="noopener noreferrer"
        >
          Search Quality Rater Guidelines
        </a>
        , written for the human contractors who evaluate search results so Google can tell whether a system
        change made results better or worse. Raters score pages; those scores tune systems; the systems then
        approximate what raters reward. So E-E-A-T describes a target, not a mechanism.
      </p>
      <p>
        That distinction matters for AI search because generative engines inherit the target through a different
        route. A model answering &quot;who should I hire for X&quot; is doing retrieval plus synthesis, and its
        training and safety tuning push it toward sourced, attributable, low-risk statements. The practical
        effect converges on the same thing raters were asked to look for: can you tell who is behind this, and
        does it check out?
      </p>

      <h2>The three things an engine can actually verify</h2>
      <p>
        Strip away the acronym and an assistant is doing three concrete checks against retrieved text:
      </p>
      <ul>
        <li>
          <strong>Is there a named entity behind this claim?</strong> A person or organisation with a name that
          resolves — appears elsewhere, has a consistent description, is not a stock-photo byline.
        </li>
        <li>
          <strong>Does the claim carry its own qualifiers?</strong> Scope, date, jurisdiction, price basis. A
          sentence that survives being lifted out of context is safe to quote; one that needs the surrounding
          page to be true is not.
        </li>
        <li>
          <strong>Do independent sources agree?</strong> The same facts stated the same way across your site, a
          directory, a licence registry, a review platform. This is the multi-source consensus we cover in the{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity guide</Link>.
        </li>
      </ul>
      <p>
        Nothing in that list requires a photo, a word count, or the phrase &quot;with over 20 years of
        experience.&quot; All of it requires specificity.
      </p>

      <h2>What a useful author bio contains</h2>
      <p>
        Most bios are written for reassurance and are useless for attribution. Here is the difference, using the
        same person.
      </p>
      <p>
        <strong>Not useful:</strong> &quot;Sarah is a passionate marketing expert with years of experience
        helping businesses grow. She loves coffee and hiking.&quot; Nothing here is checkable, and nothing
        licenses an assistant to attribute a claim to her.
      </p>
      <p>
        <strong>Useful:</strong> &quot;Sarah Okonjo, CPA (Illinois licence #XXXXXX), has led R&amp;D tax credit
        filings for software companies since 2014 and reviews all tax content on this site. She is a member of
        the AICPA and speaks annually at the Illinois CPA Society tax conference.&quot; Every clause is a fact
        another source could confirm — a licence lookup, a membership roster, a conference agenda.
      </p>
      <p>
        Put the bio where it can be retrieved with the content: a short line at the top or bottom of the article
        itself, linking to a fuller author page. A bio that lives only on a separate team page rarely travels
        with the passage an engine lifts.
      </p>

      <h3>Mark it up so the connection is explicit</h3>
      <p>
        Structured data does not create credibility, but it removes ambiguity about who wrote what. Use{" "}
        <code>Article</code> with an <code>author</code> property pointing at a <code>Person</code> that has its
        own <code>url</code> and <code>sameAs</code> links to profiles that genuinely belong to that person. On
        the About page, use <code>Organization</code> with <code>foundingDate</code>, <code>address</code> and
        real <code>sameAs</code> entries. The rule we apply in our own generator applies here too: never
        list a <code>sameAs</code> profile you do not control, and never invent a field to fill a slot. See{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> for the full pattern.
      </p>

      <h2>The About page is doing more work than your homepage</h2>
      <p>
        In scans, the About page is disproportionately the document that gets retrieved when a question is about
        the business rather than the service — &quot;is [company] legitimate&quot;, &quot;how long has [company]
        been around&quot;, &quot;who owns [company]&quot;. Those are exactly the questions a cautious buyer asks
        an assistant before making contact, and a vague About page produces a vague, hedged answer.
      </p>
      <p>A retrievable About page states, in plain sentences a model can lift:</p>
      <ul>
        <li>Legal entity name, founding year, and where you are physically based</li>
        <li>Who runs it, by name, with credentials that can be looked up</li>
        <li>What you do and — just as usefully — what you do not do or serve</li>
        <li>Licences, registrations, insurance, certifications, with issuing bodies named</li>
        <li>How to reach a human: address, phone, email, hours</li>
      </ul>
      <p>
        Two things routinely break this page. First, the founding story told with no dates or places, which reads
        warm to a human and blank to a machine. Second, contact details rendered inside an image or loaded by
        script after page load — invisible to most crawlers, as covered in{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
      </p>

      <h2>The trustworthiness signals people skip</h2>
      <p>
        Trustworthiness is the load-bearing letter — the other three matter mostly because they feed it. The
        signals that move it are unglamorous:
      </p>
      <ul>
        <li>
          <strong>Dates on everything.</strong> A published date and a genuine last-updated date. Backdating or
          bulk-refreshing dates without changing content is detectable and corrosive; do not do it.
        </li>
        <li>
          <strong>Named sources for external claims.</strong> Link out to the primary source, not to a blog that
          summarised it. Assistants follow those links, and a page that cites verifiable sources is safer to
          quote than one that asserts numbers from nowhere.
        </li>
        <li>
          <strong>Visible limits.</strong> Saying who you are not right for, what a service does not include, or
          where an approach fails reads as expertise to a human and as precision to a model.
        </li>
        <li>
          <strong>Corrections handled openly.</strong> If you fix a material error, say so on the page. This is
          also the cheapest way to keep your own record straight when an engine has picked up something wrong —
          see <Link href="/blog/fix-wrong-ai-information-about-your-business">fixing wrong AI information</Link>.
        </li>
      </ul>

      <h2>What does not work</h2>
      <p>
        Fabricated credentials and invented author personas are the obvious failure, and they fail hardest here
        because credential claims are the most checkable thing on the page — licence registries and membership
        rosters are public. An author who exists nowhere else is a dead end for attribution, so the bio adds
        nothing even before anyone catches it.
      </p>
      <p>
        Two subtler wastes of effort: adding a &quot;reviewed by&quot; line naming someone who did not review it,
        and padding a bio with adjectives instead of facts. Neither adds a checkable claim, and one of them is a
        lie. Also skip the idea that E-E-A-T can be bought as a package — there is no field to fill in, only
        facts to make true and then make visible.
      </p>

      <h2>Common questions</h2>

      <h3>Do I need a named human author, or can content be attributed to the company?</h3>
      <p>
        Organisation attribution is fine for informational and service pages. A named human matters most where
        the topic carries risk to a reader — health, legal, financial, safety — because that is where an
        assistant is most conservative about repeating a claim without a source it can point at.
      </p>

      <h3>Does a headshot help?</h3>
      <p>
        Not directly; text is what gets retrieved. It helps indirectly by making the person look like a real
        person to human readers, which affects the third-party mentions and reviews that do get retrieved.
      </p>

      <h3>How fast does this show up in answers?</h3>
      <p>
        Author and About changes are re-read whenever those pages are next crawled, so they can surface within
        days — but their effect is cumulative, not switch-like, and it competes with everything else the engine
        retrieved. Answers also vary by engine and by phrasing, and no one can guarantee placement in any
        assistant&apos;s response. <Link href="/blog/is-aeo-real">Is AEO real</Link> sets out those limits
        honestly.
      </p>

      <h2>The bottom line</h2>
      <p>
        AI engines do not reward the appearance of credibility. They reward attributability: a real name, a
        checkable claim, and agreement across sources. Write the bio so a stranger could verify every clause in
        ten minutes, make the About page state facts instead of feelings, and cite your sources. That is the
        whole of E-E-A-T that a machine can see.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
