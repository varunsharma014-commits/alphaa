import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-accountants-get-recommended-by-ai",
  title: "How Accountants and CPA Firms Get Recommended by AI",
  description:
    "AI assistants name accounting firms that are specific about who they serve, verifiable through licence and directory records, and well reviewed. Here's the practical playbook for CPAs, tax preparers and bookkeepers.",
  date: "2026-07-29",
  readMins: 10,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of small businesses, including
          accounting and tax practices. Last updated 29 July 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend the accounting firms they can describe
        confidently. That means three things in practice: your site says <em>specifically</em> who you serve
        and what you charge to do what, your firm details and licence status are consistent and verifiable
        across Google, state board and IRS directories, and other people — reviewers, forum threads, local
        press — say the same things about you. Firms that describe themselves as a &quot;full-service
        accounting firm serving businesses of all sizes&quot; give a model nothing to hold on to, so it names
        someone else.
      </p>

      <h2>What people actually ask AI when they need an accountant</h2>
      <p>
        The queries that matter come in two waves, and most firms only think about the second one.
      </p>
      <ul>
        <li>
          <strong>Wave one — the problem question.</strong> &quot;Do I need a CPA if I just formed an
          S-corp?&quot; &quot;What&apos;s the difference between a bookkeeper and a CPA?&quot; &quot;How much
          should a small business pay for tax prep?&quot; &quot;Can I deduct my home office if I&apos;m a
          1099 contractor?&quot;
        </li>
        <li>
          <strong>Wave two — the who question.</strong> &quot;Find me a CPA in Boise who works with
          restaurants.&quot; &quot;Best accountant for freelancers near me.&quot; &quot;Who handles
          multi-state payroll tax for small employers in Ohio?&quot;
        </li>
      </ul>
      <p>
        Being the source the model used to answer wave one is a large part of how you become the name in wave
        two. This is the same dynamic we described for{" "}
        <Link href="/blog/how-law-firms-get-recommended-by-ai">law firms</Link>: professional services get
        recommended through explanation, not through slogans.
      </p>
      <p>
        Notice too how loaded those wave-two queries are with qualifiers — a city, an entity type, an
        industry, a specific tax problem. A model can only match those qualifiers to firms whose pages
        actually contain them.
      </p>

      <h2>Why accounting firms are unusually invisible to AI</h2>
      <p>Four patterns show up again and again in scans of accounting practices:</p>
      <ul>
        <li>
          <strong>Deliberate vagueness.</strong> Many firms avoid naming a niche because they fear turning
          work away. The result is a homepage that could belong to any of 40,000 US firms. Vagueness is the
          single biggest AEO problem in this profession.
        </li>
        <li>
          <strong>No pricing signal at all.</strong> &quot;Contact us for a quote&quot; is a reasonable
          business decision and a retrieval dead end, because &quot;how much does a CPA cost&quot; is one of
          the highest-volume questions in the category.
        </li>
        <li>
          <strong>Content locked in PDFs and portals.</strong> Tax guides published as downloadable PDFs, or
          behind a client login, are far weaker signals than the same content as a normal web page.
        </li>
        <li>
          <strong>Seasonal silence.</strong> A site that updates in February and goes quiet until the
          following January reads as stale for ten months of the year.
        </li>
      </ul>

      <h2>Step 1 — Fix the entity layer</h2>
      <p>
        Before content, make your firm resolvable as one clear entity. AI engines cross-check what they read,
        and accounting is a category with unusually good public verification sources. Use them.
      </p>
      <ul>
        <li>
          <strong>One exact firm name everywhere.</strong> &quot;Harding &amp; Co. CPAs PLLC&quot; on the
          website, the Google Business Profile, the state board record, LinkedIn, and every directory. Not
          &quot;Harding CPA&quot; in one place and &quot;Harding and Company&quot; in another.
        </li>
        <li>
          <strong>Correct Google Business Profile category.</strong> &quot;Certified Public Accountant&quot;,
          &quot;Accountant&quot;, &quot;Tax Preparation Service&quot; and &quot;Bookkeeping Service&quot; are
          distinct categories that surface for distinct queries. Pick the primary one that matches your actual
          licence and revenue mix, then add the others as secondary.
        </li>
        <li>
          <strong>Be findable in the verification sources.</strong> Your state board of accountancy licence
          lookup, the{" "}
          <a
            href="https://irs.treasury.gov/rpo/rpo.jsf"
            rel="nofollow noopener"
            target="_blank"
          >
            IRS Directory of Federal Tax Return Preparers
          </a>
          , your state CPA society directory, and the AICPA if you are a member. These are exactly the kind of
          authoritative, structured records that make a model comfortable naming you.
        </li>
        <li>
          <strong>State the credential precisely and truthfully.</strong> &quot;CPA licensed in Texas
          (licence #…)&quot;, &quot;Enrolled Agent&quot;, &quot;QuickBooks ProAdvisor&quot;. Never imply a
          credential you do not hold — this is both a regulatory problem and a trust problem, and a
          contradiction between your site and the board record is the fastest way to make a model hedge.
        </li>
      </ul>
      <p>
        The mechanism behind all of this is entity resolution, covered in depth in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          how AI identifies your business as an entity
        </Link>
        .
      </p>

      <h2>Step 2 — Trade vagueness for specificity</h2>
      <p>Here is the rewrite that moves the needle. Before:</p>
      <blockquote>
        We are a full-service accounting firm providing accounting, tax and advisory services to businesses
        and individuals. Our experienced team is committed to excellence and personalised service.
      </blockquote>
      <p>After:</p>
      <blockquote>
        Harding &amp; Co. is a two-partner CPA firm in Boise, Idaho. We do tax preparation, monthly
        bookkeeping and S-corp payroll for independent restaurants, food trucks and craft breweries across
        Idaho and eastern Oregon. Typical engagements: a single-location restaurant on monthly books and an
        1120-S return, from $450/month. We do not take individual-only 1040 clients.
      </blockquote>
      <p>
        The second version is 60 words and contains a city, a state pair, an industry, three named services,
        two form numbers, a starting price, and an explicit exclusion. Every one of those is a hook a
        retrieval system can match against a real question. The first version contains nothing retrievable at
        all. Note that the exclusion helps you: telling a model who you are <em>not</em> for makes it more
        confident recommending you to the people you are for.
      </p>

      <h2>Step 3 — Publish the answers, not brochures</h2>
      <p>Pages that get quoted in this category tend to be:</p>
      <ul>
        <li>
          <strong>Cost pages with real ranges.</strong> &quot;What we charge for a 1065 partnership
          return&quot; — with the ranges and the factors that move them. Caveat them honestly; a range beats
          silence.
        </li>
        <li>
          <strong>Entity and situation guides.</strong> Sole proprietor vs LLC vs S-corp, when the S-corp
          election stops saving money, what changes when you hire your first employee in your state.
        </li>
        <li>
          <strong>Jurisdiction-specific pages.</strong> State-level filing requirements, local business
          licence and franchise tax obligations. National content is a commodity; your state and city are not.
        </li>
        <li>
          <strong>Deadline and process pages</strong> kept current for the filing year, with a visible
          last-updated date. Tax content decays fast, and both readers and models discount undated advice.
        </li>
        <li>
          <strong>A clear FAQ in plain HTML</strong> — short question headings and two-to-four-sentence
          answers, which are easy for an engine to lift verbatim. Pair it with{" "}
          <Link href="/blog/schema-markup-for-ai-search">appropriate schema markup</Link> so the structure is
          machine-readable too.
        </li>
      </ul>

      <h2>Step 4 — Earn the third-party evidence</h2>
      <p>
        Accountants are chosen on trust, and models weight independent corroboration accordingly. Ask every
        client you finish a good year with for a Google review, and encourage specificity — &quot;handled our
        multi-state payroll registration&quot; is worth far more to retrieval than &quot;great service.&quot;
        The mechanism is explained in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why your Google reviews shape your AI visibility</Link>.
        Beyond reviews: be genuinely useful in the places small-business owners ask tax questions, get listed
        with your local chamber and industry associations, and answer reporters&apos; questions when tax
        season stories come around.
      </p>

      <h2>What not to do</h2>
      <ul>
        <li>
          <strong>Do not promise outcomes.</strong> &quot;Guaranteed maximum refund&quot; and &quot;we can cut
          your tax bill in half&quot; are both a compliance risk under state board and IRS advertising rules
          and a credibility problem with AI engines, which increasingly discount pages that read as
          promotional rather than informational.
        </li>
        <li><strong>Do not invent credentials, awards or client logos.</strong> These get cross-checked.</li>
        <li>
          <strong>Do not mass-produce thin city pages.</strong> Fifty near-identical &quot;CPA in [City]&quot;
          pages for cities you do not serve is the oldest trick in local SEO and it degrades trust in
          everything else on your domain.
        </li>
        <li>
          <strong>Do not buy &quot;guaranteed AI placement.&quot;</strong> No vendor, including us, can
          guarantee a mention in ChatGPT. What you can do is improve the evidence a model reads.
        </li>
      </ul>

      <h2>A realistic 30-day plan</h2>
      <ol>
        <li><strong>Days 1–3:</strong> Ask ChatGPT, Claude, Gemini and Perplexity the ten questions a real
          prospect would ask in your city and niche. Record what they say and who they name.</li>
        <li><strong>Days 4–7:</strong> Reconcile your firm name, address, phone and credentials across the
          website, Google Business Profile, state board record, IRS directory and LinkedIn.</li>
        <li><strong>Days 8–14:</strong> Rewrite the homepage and services pages for specificity — niche,
          geography, named services, price signal.</li>
        <li><strong>Days 15–24:</strong> Publish two genuinely useful pages: one cost page, one
          state-specific situation guide. Add an FAQ block to each.</li>
        <li><strong>Days 25–30:</strong> Request reviews from your ten happiest clients, asking them to
          mention the specific work. Re-run the ten questions from day one and note any change.</li>
      </ol>
      <p>
        Be patient about the timeline. Entity and review signals propagate over weeks to months, not days —
        see <Link href="/blog/how-long-does-aeo-take">how long AEO actually takes</Link>.
      </p>

      <h2>Quick answers</h2>
      <h3>Will AI recommend a solo practitioner over a big firm?</h3>
      <p>
        Regularly, yes — when the query has qualifiers the solo firm matches and the big firm does not. A
        two-partner firm that clearly serves restaurants in one state will beat a regional firm with a generic
        site for &quot;CPA for a restaurant in Idaho.&quot; Specificity is the great equaliser here.
      </p>
      <h3>Do I need to publish prices?</h3>
      <p>
        You do not have to, but a range with context materially improves your chances on the highest-intent
        cost queries. If you truly cannot, publish the <em>factors</em> that determine price instead — that is
        still retrievable content.
      </p>
      <h3>Is this different from SEO?</h3>
      <p>
        It overlaps, but the target differs: SEO optimises for a ranked list of links, AEO optimises for being
        the firm a model is confident enough to name. Consistency and verifiability matter more; keyword
        density matters less.
      </p>
      <h3>Can any of this be guaranteed?</h3>
      <p>
        No. AEO shapes the public signals AI systems read. It shifts probability, it does not buy placement,
        and answers vary between engines and over time.
      </p>

      <h2>The bottom line</h2>
      <p>
        Accounting is a category where the winning move is uncomfortable: say precisely who you serve, what you
        do, roughly what it costs, and who you turn away. Make that story identical everywhere a machine can
        check it — your site, Google, your state board, the IRS directory, your reviews. Do that and you stop
        being one of forty thousand indistinguishable firms and start being the specific answer to a specific
        question.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
