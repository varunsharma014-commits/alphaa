import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "directory-listings-nap-citations-ai-search",
  title: "Do Yelp, BBB and Angi Still Matter? How Directory Listings Shape AI Recommendations",
  description:
    "Directories are no longer traffic sources — they are corroboration sources. AI assistants use Yelp, BBB, Angi and industry directories to verify that your business is real and that your facts agree. Here is which listings matter, and how to fix the ones that contradict you.",
  date: "2026-08-10",
  readMins: 11,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of local businesses and read the
          sources the engines actually cite back. Last updated 10 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes, directory listings still matter — but for a completely different
        reason than they did in 2015. Almost nobody browses Yelp to find a plumber anymore, so directories are
        weak traffic sources. What they are now is <strong>corroboration</strong>: independent, heavily crawled
        pages that state your name, address, phone, hours, services and category. When an AI assistant is
        deciding whether to name you, it is looking for the same facts in more than one place it did not have
        to take your word for. A handful of accurate, agreeing listings does that job. Forty auto-generated
        listings with three different phone numbers actively does the opposite.
      </p>

      <h2>What changed: from traffic channel to verification layer</h2>
      <p>
        The old citation-building playbook was a link-and-traffic play. You submitted to 300 directories
        because each one was a possible referral and a possible ranking signal. That logic mostly died with the
        click: roughly two-thirds of Google searches now end without a single click to any website
        (SparkToro/Similarweb, 2026), and the searches that do continue increasingly end inside an AI answer
        rather than on a directory page.
      </p>
      <p>
        The listings did not stop mattering, though. They moved jobs. Directory pages are clean, structured,
        frequently re-crawled and — critically — <em>not written by you</em>. That makes them ideal retrieval
        targets when a model needs to confirm a claim. In practice we see this in the citation lists engines
        return: ask Perplexity or ChatGPT for &quot;best pest control in Boise&quot; and the sources under the
        answer are usually a mix of the businesses&apos; own sites, Google Business Profile data, review
        platforms, and two or three directories or local roundups. The directory is rarely the reason you get
        recommended. It is frequently the reason the assistant is confident enough to say your name.
      </p>

      <h2>How an assistant actually uses a listing</h2>
      <p>
        It helps to be precise about the mechanism, because it changes what you should do. Modern assistants
        answer local and service questions through retrieval-augmented generation: the model issues one or more
        searches, pulls back a set of documents, and writes an answer grounded in what those documents say. A
        directory listing enters that process in three ways:
      </p>
      <ul>
        <li>
          <strong>As an entity confirmation.</strong> The listing repeats your business name, address, phone
          and category in a machine-readable layout. Repetition across independent domains is what turns
          &quot;a string of words&quot; into a resolved entity the model can talk about. This is the same
          mechanism described in{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO</Link>.
        </li>
        <li>
          <strong>As a filter answer.</strong> Category, service list, hours, service area and price band are
          fields on most directory listings. When the question contains a constraint — &quot;open Sunday&quot;,
          &quot;does emergency callouts&quot;, &quot;serves the north side&quot; — a listing may be the only
          retrievable document that answers it.
        </li>
        <li>
          <strong>As a trust proxy.</strong> Review counts, ratings, accreditation status and years in business
          give the model something to weigh when it has to choose five names out of forty. Being real and being
          rated are different signals, and directories carry both.
        </li>
      </ul>
      <p>
        Notice what is absent from that list: link equity. Directory backlinks are largely nofollow and are not
        the point here — we cover what backlinks do and do not do for AI search in{" "}
        <Link href="/blog/do-backlinks-matter-for-ai-search">a separate post</Link>. Treat listings as
        <em> statements about you</em>, not as links.
      </p>

      <h2>Which listings are actually worth your time</h2>
      <p>
        Most businesses do not need more listings. They need the right eight to be perfect. In our scans the
        sources that show up in AI citations for local queries cluster tightly, and the long tail of submission
        sites almost never appears. A realistic priority order:
      </p>
      <ul>
        <li>
          <strong>Google Business Profile.</strong> Not a directory in the classic sense, and by a distance the
          highest-leverage record you control — see{" "}
          <Link href="/blog/google-business-profile-ai-answers">how GBP feeds AI answers</Link>. Fix this
          first; everything else is corroboration of it.
        </li>
        <li>
          <strong>Apple Business Connect and Bing Places.</strong> Cheap, fast, and they feed map and
          assistant surfaces beyond Google — Bing data in particular sits close to Copilot.
        </li>
        <li>
          <strong>The one or two review platforms your category actually lives on.</strong> Yelp for food,
          bars, salons and many home services; Healthgrades and Zocdoc for clinicians; Avvo for lawyers;
          TripAdvisor for hospitality; G2 or Capterra for software. One dominant platform beats five thin
          profiles.
        </li>
        <li>
          <strong>Angi, Thumbtack, HomeAdvisor or the equivalent marketplace</strong> if you are in home
          services. These are structured, filterable and constantly crawled — the highest-value listing type
          after GBP for contractors.
        </li>
        <li>
          <strong>Better Business Bureau</strong> where your customers care about it. BBB matters less as a
          consumer destination than it used to, but an accredited, complaint-free profile is a clean
          trust statement in a place the model did not have to trust you for.
        </li>
        <li>
          <strong>Your trade or professional association directory.</strong> State bar, NARI, ACCA, the local
          chamber, your franchise&apos;s locator. These are the most under-used and often the most credible,
          because membership is verified by a third party.
        </li>
        <li>
          <strong>Data aggregators</strong> — the wholesale layer that quietly populates dozens of small
          directories. Correcting your record here fixes downstream copies you will never visit.
        </li>
      </ul>
      <p>
        Everything beyond that is optional. If a directory has no human audience, no editorial standard and no
        chance of being retrieved, adding your business to it adds nothing except one more record you now have
        to keep accurate.
      </p>

      <h2>The real risk: listings that contradict you</h2>
      <p>
        The most common damage we find in scans is not absence. It is disagreement. A typical mid-sized service
        business has moved office once, changed its tracking phone number twice, rebranded from
        &quot;Sons&quot; to &quot;&amp; Sons&quot;, and closed a second location — and every one of those events
        left a stale copy somewhere.
      </p>
      <p>
        When retrieved documents disagree, an assistant does one of three things, none of them good for you:
      </p>
      <ul>
        <li>
          <strong>It hedges.</strong> You get mentioned without the detail that would make you callable —
          no number, no hours, &quot;you may want to confirm directly.&quot;
        </li>
        <li>
          <strong>It picks the wrong one.</strong> Old address, disconnected line, closed location. We have
          seen a business lose calls for months to a number it stopped paying for.
        </li>
        <li>
          <strong>It drops you.</strong> Faced with a contradiction it cannot resolve and four competitors it
          can, the model names the four. This is one of the quieter reasons{" "}
          <Link href="/blog/why-ai-recommends-your-competitor">AI recommends your competitor</Link>.
        </li>
      </ul>
      <p>
        This is why &quot;more listings&quot; is the wrong instinct. Every listing you create is a promise to
        keep it current. Ten accurate records beat sixty records where nine are wrong, because the nine wrong
        ones are the ones that generate the contradiction.
      </p>

      <h2>A worked cleanup, in the order we actually do it</h2>
      <p>
        This takes about two hours for a single-location business and is the highest-return unglamorous work in
        AEO.
      </p>
      <ul>
        <li>
          <strong>1. Write the canonical record first.</strong> One short document: exact legal-and-trading
          name (pick one form and never vary it), street address in one format, one primary phone number, one
          website URL, hours, service area, and a one-sentence category description. Every later decision
          checks against this file. Do not skip this — most inconsistency is caused by having no source of
          truth to copy from.
        </li>
        <li>
          <strong>2. Find what already exists.</strong> Search your business name in quotes, then your phone
          number in quotes, then your old phone number and old address if you have them. The phone-number
          search is the one that surfaces the listings you forgot you had. Put every result in a spreadsheet
          with the URL and what it says.
        </li>
        <li>
          <strong>3. Ask the assistants directly.</strong> Ask ChatGPT, Perplexity and Gemini &quot;what is the
          phone number and address for [business] in [city]?&quot; and, separately, &quot;what sources do you
          have for that?&quot; The wrong answers tell you which stale record is winning retrieval, which tells
          you what to fix first. This is a faster diagnostic than auditing directories one by one.
        </li>
        <li>
          <strong>4. Fix in dependency order.</strong> GBP, then the aggregators, then the platforms your
          category lives on, then the rest. Aggregator fixes propagate slowly but they fix listings you would
          otherwise chase individually.
        </li>
        <li>
          <strong>5. Claim, do not duplicate.</strong> When you find an unclaimed or duplicate listing, claim
          and merge it. Creating a second correct listing next to an incorrect one leaves the contradiction
          intact — now with your fingerprints on both.
        </li>
        <li>
          <strong>6. Close the loop on your own site.</strong> Your contact page and your{" "}
          <Link href="/blog/schema-markup-for-ai-search">LocalBusiness schema</Link> must state the identical
          facts. The site is where the model confirms what the directories claim; if it disagrees, you have
          simply moved the contradiction.
        </li>
        <li>
          <strong>7. Re-check in four to six weeks.</strong> Directory pages are re-crawled often, so
          corrections surface reasonably fast — but aggregator propagation and cached copies lag. Ask the
          assistants the same questions again and compare.
        </li>
      </ul>

      <h2>What about tracking numbers?</h2>
      <p>
        Call-tracking numbers are the single most common self-inflicted inconsistency we see. The rule that
        keeps both things working: use your real main line as the primary number everywhere a machine reads it
        — GBP, directories, schema, contact page — and confine tracking numbers to channels where they belong,
        such as paid ads. If your platform supports it, set the tracking number as a secondary number rather
        than replacing the primary. Never let a tracking number be the only phone number a model can find, and
        never point different directories at different tracking numbers.
      </p>

      <h2>Questions we get asked</h2>

      <h3>Do I need a paid listing or upgraded profile?</h3>
      <p>
        No. Paid placement buys you position within that directory&apos;s own results and sometimes removes
        competitor ads from your page. It does not buy you a mention in an AI answer, and no vendor can sell
        you one. What the model reads — your facts, your categories, your reviews — is on the free profile
        too.
      </p>

      <h3>Are bulk citation-submission services worth it?</h3>
      <p>
        Rarely, and they carry a specific risk: they create records at scale that you are then responsible for
        updating forever. If you use one, use it to <em>correct</em> existing records rather than to manufacture
        new ones, and make sure you keep dashboard access. A cheap one-time blast that you cannot later edit is
        how businesses end up with an un-fixable stale phone number in forty places.
      </p>

      <h3>Do reviews on directories count, or only Google reviews?</h3>
      <p>
        Both, weighted by where your category&apos;s conversation actually happens. Google reviews are the
        broadest signal — see{" "}
        <Link href="/blog/google-reviews-ai-visibility">how reviews shape AI visibility</Link> — but a
        contractor with strong Angi reviews or a lawyer with substantive Avvo reviews gives the model
        category-appropriate evidence it will use.
      </p>

      <h3>How much of my AI visibility does this explain?</h3>
      <p>
        Honestly: it is necessary, not sufficient. Consistent listings remove the reasons an engine would
        exclude or hedge on you. They do not by themselves make you the recommendation — that comes from being
        genuinely well-reviewed, specific about what you do, and described by third parties. We cannot give you
        a percentage, and you should be suspicious of anyone who does. What we can say is that in scans, the
        businesses that are invisible for their own brand name almost always have a consistency problem first.
      </p>

      <h2>The bottom line</h2>
      <p>
        Directories stopped being a traffic strategy and became a fact-checking layer. That means the goal is
        not coverage, it is agreement: a small set of listings on platforms that are actually retrieved, every
        one of them stating exactly what your website and your Google profile state. Do that and you remove the
        cheapest reason for an AI engine to leave you out of an answer. It is unglamorous work, and it is the
        work that most often moves the needle first.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
