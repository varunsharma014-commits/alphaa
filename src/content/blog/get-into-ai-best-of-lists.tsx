import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "get-into-ai-best-of-lists",
  title: "How to Get Into the \"Best Of\" Lists AI Recommends From",
  description:
    "When ChatGPT names the best plumber, dentist or CRM, it is usually paraphrasing a third-party roundup rather than judging your website. Here is how those lists get built, how to get considered for them legitimately, and what never works.",
  date: "2026-08-02",
  readMins: 11,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and read the sources
          the engines actually cite. Last updated 2 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> when an AI assistant says &quot;the best options are X, Y and Z,&quot; it
        is rarely forming its own opinion of your business — it is compressing what third-party sources already
        say, and roundups, directories and &quot;best of&quot; lists are the densest such sources in existence.
        Getting into those lists is therefore one of the highest-leverage AEO moves available, and the way in is
        unglamorous: be findable to the people who compile them, give them the specific facts they need, and ask
        properly.
      </p>

      <h2>Why &quot;best of&quot; pages carry so much weight</h2>
      <p>
        A superlative question — &quot;best accountant in Leeds,&quot; &quot;best project management tool for
        agencies&quot; — has no factual answer sitting in a single document. The model has to synthesise a
        ranking. The cheapest way for any retrieval system to do that is to find documents that have already
        done the ranking work and merge them.
      </p>
      <p>
        That gives roundup pages three properties nothing on your own site can match:
      </p>
      <ul>
        <li>
          <strong>They are structurally aligned with the question.</strong> A page titled &quot;12 best X in
          Y&quot; is a near-verbatim match for the query, in a way your homepage never is.
        </li>
        <li>
          <strong>They are third-party.</strong> Your site claiming you are the best is a claim; someone
          else&apos;s list saying it is evidence. Models weight independent corroboration heavily, for the same
          reason people do.
        </li>
        <li>
          <strong>They name many entities at once,</strong> which makes them efficient context. One retrieved
          roundup can populate an entire answer, so retrieval systems reach for them repeatedly.
        </li>
      </ul>
      <p>
        This is the same mechanism we described in{" "}
        <Link href="/blog/do-backlinks-matter-for-ai-search">do backlinks matter for AI search</Link> — but with
        an important difference. For AI answers, the <em>mention</em> is doing the work, not the link. Being
        named in the body text of a credible roundup helps even when the list gives you no hyperlink at all.
      </p>

      <h2>The four kinds of list that actually get cited</h2>
      <p>Not all lists are equal. In the citation panels we look at, four types keep appearing:</p>
      <ol>
        <li>
          <strong>Editorial roundups</strong> — a publication, trade magazine or established blog compiling
          &quot;best X&quot; with genuine commentary. Highest value, hardest to get into, and the ones with real
          editorial standards.
        </li>
        <li>
          <strong>Category directories and marketplaces</strong> — Yelp, Google&apos;s own local pack, Clutch,
          G2, Capterra, Houzz, Avvo, Healthgrades, and the vertical equivalent in your niche. These are
          structured, constantly re-crawled, and heavily quoted when someone asks for options.
        </li>
        <li>
          <strong>Community threads</strong> — a Reddit or forum thread where real people name businesses.
          Chaotic, unbuyable, and disproportionately influential; we covered the dynamics in{" "}
          <Link href="/blog/reddit-and-ai-search">Reddit and AI search</Link>.
        </li>
        <li>
          <strong>Local media and association lists</strong> — the city paper&apos;s &quot;best of&quot;
          readers&apos; poll, the chamber of commerce directory, the professional body&apos;s member register.
          Underrated, because they are trusted, local and rarely spammed.
        </li>
      </ol>

      <h2>The workflow: find the lists that already decide your category</h2>
      <p>
        Do this before you write a single outreach email. It takes about an hour and it tells you which twenty
        pages matter instead of guessing.
      </p>
      <ol>
        <li>
          <strong>Ask the engines the buying question, not your brand name.</strong> In ChatGPT, Gemini, Claude
          and Perplexity, ask &quot;what are the best [your category] in [your city]?&quot; or &quot;best [tool
          category] for [customer type]?&quot; Ask it three or four different ways.
        </li>
        <li>
          <strong>Open the citations, not just the answer.</strong> Perplexity and Gemini show sources
          explicitly; in ChatGPT, ask a follow-up: &quot;which sources did you use for that?&quot; Note every URL
          that comes back.
        </li>
        <li>
          <strong>Build a list of the repeat offenders.</strong> Across a dozen prompt variations, the same five
          to fifteen pages will surface again and again. Those are your targets. Everything else is noise.
        </li>
        <li>
          <strong>Mark your status on each one.</strong> Three buckets: already listed and accurate, already
          listed but wrong or outdated, and not listed at all.
        </li>
        <li>
          <strong>Fix bucket two first.</strong> Correcting an existing entry — wrong phone number, closed
          location, old pricing, stale service list — is faster and higher yield than earning a new placement,
          and it is the single most common thing we find. If AI is repeating something false about you, the
          repair playbook is in{" "}
          <Link href="/blog/fix-wrong-ai-information-about-your-business">
            fixing wrong AI information about your business
          </Link>
          .
        </li>
      </ol>
      <p>
        Run each prompt several times. Answers vary run to run, so treat a single result as an anecdote — the
        reasoning is in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>.
      </p>

      <h2>How to earn a place on a list you are not on</h2>
      <p>
        Compilers — whether a journalist, a niche blogger or a directory&apos;s editorial team — are solving a
        research problem under time pressure. Make yourself the easiest correct answer to include.
      </p>

      <h3>1. Be verifiable in ninety seconds</h3>
      <p>
        Before anyone lists you, they check whether you are real and current. That check is: your website, your
        Google Business Profile, your reviews, and one directory entry. If your hours conflict across those four,
        or your site last updated in 2023, you get quietly dropped from the shortlist and never hear about it.
        This is the entity-consistency work described in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          entity SEO: how AI identifies your business
        </Link>
        .
      </p>

      <h3>2. Publish the facts a compiler needs, in one place</h3>
      <p>
        Create a page — an about, press or &quot;for reviewers&quot; page — that states plainly: what you do,
        exactly who you serve, service areas or supported regions, price range or pricing model, year founded,
        team size, credentials and licence numbers, notable clients or case results you are permitted to name,
        and a contact for press. Every one of those is a field a roundup entry needs filled. Handing them over
        removes the main reason you get skipped.
      </p>

      <h3>3. Claim and complete every directory in bucket three</h3>
      <p>
        Directories rank their own listings partly on profile completeness. A half-filled G2 or Yelp profile with
        no photos, no service list and no categories will lose to a complete one regardless of quality. Fill
        every field, choose categories precisely rather than broadly, and keep the business name string identical
        everywhere.
      </p>

      <h3>4. Ask — specifically, and with something to offer</h3>
      <p>
        A useful pitch to a compiler is three sentences: which exact list you are asking to be considered for,
        one concrete differentiator with evidence, and the facts they need pre-formatted. What does not work is a
        generic &quot;please add my business&quot; email. For editorial lists, being genuinely useful — offering
        a data point, an expert quote, an interview — converts far better than asking for the placement outright.
        HARO-style press-request platforms exist for exactly this trade.
      </p>

      <h3>5. Give customers the vocabulary to name you</h3>
      <p>
        Community threads cannot be bought, but they can be earned. Customers who can describe <em>what you are
        specifically good at</em> recommend you more precisely than customers who just liked you. The same
        applies to review text: a review that says &quot;same-day emergency boiler repair, arrived in two
        hours&quot; is a citable fact; &quot;great service&quot; is not. See{" "}
        <Link href="/blog/google-reviews-ai-visibility">
          why your Google reviews now decide your AI visibility
        </Link>
        .
      </p>

      <h2>What does not work — and what will hurt you</h2>
      <ul>
        <li>
          <strong>Paying for &quot;top 10&quot; badge placements on obscure sites.</strong> These pages exist to
          sell badges, get almost no independent traffic, and are rarely retrieved. You are buying an image file.
        </li>
        <li>
          <strong>Mass-generating your own roundups that place you first.</strong> Self-serving lists on
          satellite domains are exactly the pattern spam classifiers are built to catch, and they are
          third-party in form only.
        </li>
        <li>
          <strong>Review incentives.</strong> Beyond breaching most platforms&apos; terms and, in several
          jurisdictions, consumer-protection law, incentivised reviews cluster in ways that get them filtered —
          taking your legitimate reviews down with them.
        </li>
        <li>
          <strong>Chasing volume over relevance.</strong> Fifty entries in generic global directories move less
          than three entries in the directories your buyers and the engines actually consult.
        </li>
      </ul>

      <h2>How long this takes, honestly</h2>
      <p>
        Directory claims and corrections propagate in days to weeks. Editorial placements run on the
        publication&apos;s schedule, which can be months, and many pitches simply go unanswered. Once a mention
        exists, the engines still need to re-crawl the page and, for the parts of a model&apos;s behaviour driven
        by training rather than live retrieval, the lag is longer still — see{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
      </p>
      <p>
        And the honest caveat: no amount of this guarantees an AI engine will name you. AEO shapes the public
        signals models read; it does not control their output, and anyone selling guaranteed AI placement is
        selling something that does not exist. What this work reliably does is make you eligible — you cannot be
        summarised from sources you appear in nowhere.
      </p>

      <h2>Q&amp;A</h2>
      <p>
        <strong>Does the list need to link to my site?</strong> No. For AI answers, being named in the text is
        what matters most; the link is a bonus that also helps classic search.
      </p>
      <p>
        <strong>Should I pay for a sponsored spot in a directory?</strong> Sometimes — if the directory has real
        audience and editorial standing, a paid tier can be worth it for the traffic. Do not buy it expecting AI
        visibility specifically; completeness and reviews on a free profile usually do more.
      </p>
      <p>
        <strong>What if a list ranks a competitor above me?</strong> That is normal and not worth fighting. Being
        named at all puts you in the candidate set, which is the part that decides whether you appear in an
        answer.
      </p>
      <p>
        <strong>How many lists is enough?</strong> Aim to be accurately present on every source that repeatedly
        showed up in your citation audit. That is usually five to fifteen pages, not fifty.
      </p>

      <h2>The bottom line</h2>
      <p>
        AI assistants answer superlative questions by summarising other people&apos;s judgements. If you want to
        be in those answers, the work is not writing more about yourself — it is being accurately present,
        described in specifics, on the handful of third-party pages the engines keep returning to. Audit which
        pages those are, fix what is wrong on them first, then earn the ones you are missing.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
