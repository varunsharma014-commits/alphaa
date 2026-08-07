import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-financial-advisors-get-recommended-by-ai",
  title: "How Financial Advisors Get Recommended by AI (Without Breaking Compliance)",
  description:
    "AI assistants answer \"who should manage my money\" from regulator filings, fee-only directories and specialist coverage — rarely from an advisor's own website. Here is how advisors become the named recommendation while staying inside the SEC and FINRA marketing rules.",
  date: "2026-08-07",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including regulated
          professional practices. This is marketing guidance, not legal or compliance advice: clear anything below
          with your CCO or compliance counsel before publishing. Last updated 7 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Financial advisors get recommended by AI when a <em>specific, checkable</em>
        description of who they serve exists across the sources assistants actually read — the SEC&apos;s public
        adviser records, fee-only and CFP directories, specialist press, and niche communities — not just on the
        advisor&apos;s own site. And the good news for a regulated profession is that almost none of this requires
        the tactics compliance worries about. The highest-leverage work is making true, already-disclosed facts
        legible and consistent.
      </p>

      <h2>The question your prospect actually asks</h2>
      <p>
        Nobody types &quot;financial advisor&quot; into ChatGPT. They ask something with constraints attached:
        &quot;fee-only fiduciary advisor in Denver who works with tech employees with RSUs,&quot; &quot;advisor who
        specialises in special-needs trusts,&quot; &quot;someone to help me roll over a 401k after being laid off at
        52.&quot;
      </p>
      <p>
        That shift matters more in this profession than almost any other, because 65% of consumers now use AI tools
        to research products before buying (Clutch, 2026), and a wealth-management relationship is exactly the kind
        of high-consideration decision people research heavily before making a single call. The assistant answers by
        matching constraints against descriptions it can verify. &quot;Comprehensive wealth management for
        individuals and families&quot; — the sentence on roughly every advisory homepage — matches nothing, because
        it excludes nobody. It is not that the engine dislikes you. There is no hook to catch on.
      </p>

      <h2>Your Form ADV is an AI visibility asset</h2>
      <p>
        Here is the piece specific to this industry that most advisors have never considered. Your Form ADV and
        firm record on the SEC&apos;s Investment Adviser Public Disclosure system are public, structured, and
        maintained by a regulator. In source terms, that is close to ideal: an authoritative third-party record that
        states your assets under management, client types, fee structure, and disciplinary history in a consistent
        format.
      </p>
      <p>
        Which means Part 2A of your ADV — the plain-English brochure — is quietly one of the most authoritative
        descriptions of your practice in existence. Most advisors treat it as a compliance chore, filled with
        boilerplate written to be unfalsifiable. If your brochure describes generic services while your website
        claims deep specialisation in physician practices, you have given the engines contradictory descriptions of
        the same entity, and the regulator&apos;s version carries more weight.
      </p>
      <p>
        The fix is not to embellish the ADV — it is a legal filing and every word must be accurate. The fix is to
        make sure the true, specific things about your practice appear there in plain language at your next annual
        amendment, and that your website, directory profiles and LinkedIn describe the same practice in the same
        terms. This is entity consistency, and it is the same mechanism we describe in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">how AI identifies your business as an entity</Link>.
      </p>

      <h2>The directories that carry weight here</h2>
      <p>
        Advisory is one of the few local-professional categories with genuinely high-quality, curated directories —
        and AI engines lean on curated lists heavily, because a vetted list is cheap evidence.
      </p>
      <ul>
        <li>
          <strong>NAPFA</strong> — the fee-only network. Membership itself is a filterable credential, which is
          exactly what a constrained query needs.
        </li>
        <li>
          <strong>The CFP Board&apos;s public directory</strong> — an authoritative credential check tied to a
          named professional.
        </li>
        <li>
          <strong>XY Planning Network, Garrett Planning Network, Fee-Only Network</strong> — niche-specific, and
          their profile fields tend to be structured around <em>who you serve</em>, which is precisely the axis AI
          matches on.
        </li>
        <li>
          <strong>Your custodian&apos;s advisor-finder</strong>, if you are on one that publishes one.
        </li>
      </ul>
      <p>
        The work is not joining more of them — it is filling the specialty, minimum, and client-type fields on every
        profile you already hold, with identical wording. Half-empty profiles are the norm in this category, which
        is why filling them is such cheap ground to take.
      </p>

      <h2>What compliance actually permits</h2>
      <p>
        Advisors routinely assume any marketing that mentions clients is prohibited. That has not been true for
        several years. Under the SEC&apos;s Marketing Rule (Rule 206(4)-1), which took effect for registered
        investment advisers in November 2022, testimonials and endorsements <em>are</em> permitted — subject to
        real conditions: required disclosures about client status and compensation, oversight of the promoter, and
        a prohibition on cherry-picking or otherwise misleading presentation. Broker-dealers operate under a
        different regime, FINRA Rule 2210, with its own approval, filing and recordkeeping requirements. Dually
        registered? Both apply.
      </p>
      <p>
        So the honest framing is: reviews and client stories are usually available to you, but only with the
        disclosures and supervision attached, and the details differ by registration type. Run the specific
        execution past your CCO — not the general idea.
      </p>
      <p>
        What is unambiguously safe, and undervalued: <strong>factual, checkable description.</strong> Credentials
        held. Client types served. Fee structure and minimums. Years in practice. Which planning problems you
        handle. None of it is a performance claim, none of it needs a testimonial disclosure, and all of it is
        exactly what the engines are trying to match. The single most effective AEO move available to a compliance-
        constrained advisor is publishing your minimum and your fee model in plain text on a page an engine can
        read.
      </p>

      <h2>The pages that get advisors cited</h2>
      <p>Concretely, in the order we would build them:</p>
      <ol>
        <li>
          <strong>A &quot;who we work with&quot; page with real constraints.</strong> Not a persona essay. Plain
          statements: the client types, the asset minimum, the geography, the situations you handle often. This is
          the page that answers constrained queries.
        </li>
        <li>
          <strong>A fees page stating the actual model.</strong> Percentage of AUM with the breakpoints, flat
          retainer with the number, or hourly with the rate. &quot;Fees vary by engagement&quot; is unmatchable.
          Advisors resist this one hardest and it converts hardest.
        </li>
        <li>
          <strong>Situation pages, not service pages.</strong> &quot;Wealth Management&quot; is a category.
          &quot;What to do with RSUs when your company IPOs&quot; is a question someone asks an assistant at 11pm.
          Write the second kind.
        </li>
        <li>
          <strong>A credentials and disclosures page</strong> listing registrations, CRD number, and a link to your
          IAPD record. It is trust signalling that costs nothing and is trivially verifiable — which is the whole
          point.
        </li>
        <li>
          <strong>A plain FAQ</strong> answering the questions you field on every intro call, each in two or three
          sentences directly under a question-shaped heading.
        </li>
      </ol>
      <p>
        Keep the answers short and self-contained. A paragraph an engine can lift whole beats a beautifully argued
        page it has to summarise.
      </p>

      <h2>Common questions</h2>
      <h3>Is any of this a violation of the advertising rules?</h3>
      <p>
        Publishing accurate factual descriptions of your practice is ordinary marketing and generally fine.
        The parts that attract rules are testimonials, endorsements, third-party ratings and any performance
        presentation — permitted for RIAs under the Marketing Rule with the required disclosures, and separately
        governed for broker-dealers under FINRA 2210. Do not treat this article as clearance; treat it as the list
        of things to bring to your CCO. Also remember recordkeeping applies to marketing content in most setups.
      </p>
      <h3>Can I pay to appear in AI answers?</h3>
      <p>
        No. There is no paid placement into ChatGPT, Claude, Gemini or Perplexity organic answers, and any vendor
        offering &quot;guaranteed placement&quot; in them is selling something that does not exist. In a profession
        where guarantee-flavoured claims carry regulatory risk, that should be an easy vendor filter. We wrote about
        the distinction in <Link href="/blog/is-aeo-real">is AEO real</Link>.
      </p>
      <h3>How long does this take to show up?</h3>
      <p>
        Longer than it does in unregulated categories, because so much of the evidence lives in third-party
        directories and filings that update on their own cycles — an ADV amendment lands annually, directory
        profiles refresh when they refresh. Expect months rather than weeks, and expect answers to vary between
        engines and between phrasings of the same question even once things improve.
      </p>
      <h3>Do I need a blog?</h3>
      <p>
        Only if it answers the specific situations you actually get hired for. Market-commentary posts age badly and
        say nothing about who you serve. Six genuinely useful situation pages beat sixty quarterly outlooks.
      </p>

      <h2>The bottom line</h2>
      <p>
        Advisory is a category where compliance constraints and AI visibility point in the same direction. The
        engines reward specific, verifiable, consistent description — and specific, verifiable, consistent
        description is exactly what a regulator wants from you anyway. Make your ADV brochure, your website, your
        directory profiles and your LinkedIn tell one coherent story about who you serve, publish your fee model and
        your minimum in plain text, and write the situation pages instead of the service pages. No promises about
        outcomes are needed, which in this profession is the point.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
