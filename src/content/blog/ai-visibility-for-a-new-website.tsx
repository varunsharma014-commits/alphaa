import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ai-visibility-for-a-new-website",
  title: "How to Get AI Visibility for a Brand-New Website",
  description:
    "A new site has no backlinks, no review history and no mentions anywhere — the exact signals AI engines rely on. Here is the cold-start problem explained honestly, and the order of operations that gets a new business named fastest.",
  date: "2026-08-26",
  readMins: 11,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including a lot of sites
          that launched last month. Last updated 26 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> A brand-new site can get into AI answers faster than it can rank on Google,
        but only through a different door.{" "}
        <strong>Ranking takes accumulated authority; being cited takes being findable, readable, and corroborated
        by at least one source the engine already trusts.</strong> So the fastest path for a new business is not
        publishing thirty blog posts — it is establishing a clean, consistent entity record across a handful of
        places engines already read, and then writing the two or three pages that answer the specific questions
        your buyers ask. Expect weeks, not days, and expect to be reachable through live retrieval long before you
        show up in a model&apos;s baked-in knowledge.
      </p>

      <h2>Why a new site is at a disadvantage — precisely which one</h2>
      <p>
        It is worth being exact about the handicap, because it is narrower than most people assume. A new site is
        not penalised. It is simply missing inputs. There are three:
      </p>
      <ul>
        <li>
          <strong>No corroboration.</strong> Nothing outside your own domain confirms you exist, what you do, or
          where. Engines weight independent sources heavily precisely because a business&apos;s own claims about
          itself are the weakest evidence available.
        </li>
        <li>
          <strong>No entity record.</strong> There is no settled understanding of &quot;who&quot; you are — no
          consistent name, category, location, and set of associations for the model to attach anything to. This
          is the mechanism we describe in{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">how AI identifies your business</Link>.
        </li>
        <li>
          <strong>No presence in training data.</strong> Model weights are frozen at a cutoff. Anything published
          after it can only reach an answer through live retrieval — search, browsing, or a connected index. This
          is the one thing you genuinely cannot shortcut.
        </li>
      </ul>
      <p>
        Notice what is <em>not</em> on that list: domain age as a ranking factor, a backlink threshold, or a
        minimum content volume. The handicap is evidentiary, not a scoring penalty, which is why it can be closed
        much faster than a classic SEO deficit.
      </p>

      <h2>The two doors into an AI answer</h2>
      <p>
        Understanding these separately is what makes the sequence below make sense.
      </p>
      <p>
        <strong>Door one: live retrieval.</strong> Someone asks a question, the assistant searches or browses, it
        fetches a few candidate pages, and it summarises them. This door is open to a site published yesterday. It
        requires only that your page is fetchable, contains the answer in the initial HTML, and turns up in whatever
        search index the engine queries. This is where a new business gets its first citations.
      </p>
      <p>
        <strong>Door two: parametric knowledge.</strong> The model answers from what it absorbed during training,
        with no lookup. This door is closed to you until a training cycle happens that includes material about you.
        You cannot make that happen on a schedule; you can only make sure that when it happens, the material is
        accurate and consistent. Chasing this is the most common way new businesses waste their first three months.
      </p>
      <p>
        Practical consequence: optimise for door one now, and treat door two as a by-product of doing door one well
        for long enough.
      </p>

      <h2>The order of operations</h2>

      <h3>Step 1 — Make sure you are fetchable at all (day one)</h3>
      <p>
        Before anything else, confirm an AI crawler can actually read you. New sites fail this constantly, usually
        because of a leftover staging configuration.
      </p>
      <ul>
        <li>
          Check that <code>robots.txt</code> does not still carry a blanket <code>Disallow: /</code> from
          pre-launch, and that it does not block GPTBot, ClaudeBot, PerplexityBot, or Google-Extended. See{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">the AI crawlers and robots.txt guide</Link>.
        </li>
        <li>
          Check there is no <code>noindex</code> meta tag or <code>X-Robots-Tag</code> header still set from the
          template.
        </li>
        <li>
          Confirm your content is in the HTML rather than injected by JavaScript. Run{" "}
          <code>curl -s https://yoursite.com | grep -c &quot;a distinctive sentence from your homepage&quot;</code>{" "}
          — a zero means crawlers see an empty shell. Details in{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
        </li>
        <li>
          Verify your host&apos;s bot protection is not returning 403 to AI user agents while serving browsers
          normally. This is a default-on setting at several popular hosts.
        </li>
      </ul>
      <p>
        None of this improves your standing. All of it is a prerequisite, and getting it wrong makes everything
        after it pointless.
      </p>

      <h3>Step 2 — Fix your name before you use it anywhere (week one)</h3>
      <p>
        Decide the exact string that is your business name — spelling, spacing, capitalisation, whether the legal
        suffix is included — and never deviate. Every variant you introduce splits your evidence between two
        entities that each look half as established. We enforce this on our own brand for exactly this reason.
        Same for address format and phone number. This is free, takes an afternoon, and is the highest-leverage
        thing a new business can do.
      </p>

      <h3>Step 3 — Create corroboration in the places engines already read (weeks 1–3)</h3>
      <p>
        You need independent records that confirm your own claims. In rough order of value for most businesses:
      </p>
      <ol>
        <li>
          <strong>Google Business Profile</strong>, if you serve a location. Complete every field, choose the
          category precisely, and match your name and address exactly. See{" "}
          <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link>.
        </li>
        <li>
          <strong>The two or three directories that matter in your category</strong> — an industry association, a
          licensing register, the marketplace your buyers actually use. Quality over quantity; mass directory
          submission is noise.
        </li>
        <li>
          <strong>Your own profiles</strong> on LinkedIn, and wherever your category congregates. These are weak
          evidence individually but they corroborate the basics.
        </li>
        <li>
          <strong>Your first reviews.</strong> Not for the star rating — for the text. Five reviews that describe
          what you actually did are worth more to an engine than fifty that say &quot;great service.&quot;
        </li>
        <li>
          <strong>One genuine third-party mention.</strong> A local news piece, a trade publication, a podcast, a
          partner&apos;s customer list. A single credible independent mention does more than a hundred
          self-published pages. Even unlinked mentions carry weight —{" "}
          <Link href="/blog/do-brand-mentions-without-links-help-ai-search">we cover why here</Link>.
        </li>
      </ol>

      <h3>Step 4 — Add structured data that states the facts machine-readably (week 2)</h3>
      <p>
        Organization or LocalBusiness schema with your name, URL, logo, address, and{" "}
        <code>sameAs</code> links pointing at every profile from step 3. The <code>sameAs</code> array is doing
        the real work: it explicitly tells a parser that these scattered records are one entity, rather than
        leaving it to be inferred. For a new site with no other associations, that is the closest thing to a
        shortcut that exists. Implementation details in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h3>Step 5 — Write three pages, not thirty (weeks 2–4)</h3>
      <p>
        Volume is the wrong instinct at this stage. Write:
      </p>
      <ul>
        <li>
          <strong>A page that says exactly what you do, for whom, and where</strong>, in the words a customer would
          use — not a mission statement. This is the page that gets summarised when someone asks about you by name.
        </li>
        <li>
          <strong>A page answering the highest-intent question in your category</strong>, the one prospects ask
          before they are ready to buy. Answer it in the first two sentences, then support it.
        </li>
        <li>
          <strong>A page of specifics only you have</strong> — your pricing model, your process, your local
          conditions, your real numbers. Generic content has infinite competition; specific content has almost
          none, and specificity is what gets quoted.
        </li>
      </ul>
      <p>
        Publishing thirty thin pages in month one is actively counterproductive: it dilutes the few pages worth
        citing and makes the site look automated. Three genuinely useful pages beat thirty adequate ones every
        time.
      </p>

      <h3>Step 6 — Measure the right thing (from week 4)</h3>
      <p>
        Your first indicator is not traffic. It is whether an assistant, asked a question your business answers,
        can find and correctly describe you when it searches. Test by name first (&quot;what is [your business]&quot;),
        then by category and location. Watch for the intermediate wins: being fetched but not cited, being cited but
        described wrongly, being named alongside competitors. Each is a different fix. Set up AI referral tracking
        early so you catch the first visits —{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">here is how</Link>.
      </p>

      <h2>An honest timeline</h2>
      <p>
        From what we observe across new sites, roughly:
      </p>
      <ul>
        <li>
          <strong>Days 1–14:</strong> crawlable, indexed, and retrievable by name if someone searches for you
          specifically. Nothing more.
        </li>
        <li>
          <strong>Weeks 3–8:</strong> occasional citations in live-retrieval answers for narrow, specific queries
          where you are one of few sources with a real answer.
        </li>
        <li>
          <strong>Months 2–6:</strong> a settled entity record — the engine describes you consistently and
          correctly — and appearances in comparative or &quot;best X in Y&quot; answers as corroboration
          accumulates.
        </li>
        <li>
          <strong>Beyond:</strong> parametric presence, if enough independent material about you exists by the
          time of a future training cycle. Not schedulable.
        </li>
      </ul>
      <p>
        These are patterns, not promises. Category competitiveness changes them substantially, and no one can
        guarantee a placement in an AI answer — the engines do not sell one and the outputs are not deterministic.
        We say more about that in <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link> and{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time you ask</Link>.
      </p>

      <h2>Questions we get asked</h2>
      <h3>Should I buy an aged domain instead?</h3>
      <p>
        No. The value you are missing is corroboration and entity clarity, and an aged domain with an unrelated
        history gives you neither — it gives you conflicting signals about what the domain represents, which is
        worse than a clean start.
      </p>
      <h3>Do I need backlinks first?</h3>
      <p>
        Not in the way SEO trained you to think. What you need is independent mentions; links are one form of
        those and not the only one. A new site with three credible unlinked mentions and clean structured data
        typically outperforms one with a pile of low-quality links. See{" "}
        <Link href="/blog/do-backlinks-matter-for-ai-search">do backlinks matter for AI search</Link>.
      </p>
      <h3>Will an llms.txt file help a new site?</h3>
      <p>
        It is cheap and worth adding, but be realistic: adoption by engines is still limited and it is not a
        substitute for having readable HTML and real corroboration. Add it once the basics are done, not before —{" "}
        <Link href="/blog/how-to-create-llms-txt-file">the how-to is here</Link>.
      </p>
      <h3>Is it faster to get into AI answers than to rank on Google?</h3>
      <p>
        For narrow, specific questions, often yes, because live retrieval does not require accumulated authority
        the way ranking does. For broad competitive queries, no — the same authority dynamics reassert themselves,
        because the pages an engine retrieves are largely the pages that already rank.
      </p>
      <h3>What is the single biggest mistake new sites make?</h3>
      <p>
        Producing content before being readable and identifiable. We regularly scan brand-new sites with forty blog
        posts, a JavaScript-rendered homepage that returns no text to a crawler, and three different spellings of
        the company name across their profiles. Fixing the first two costs a day and changes more than the forty
        posts did.
      </p>

      <h2>The bottom line</h2>
      <p>
        A new website&apos;s problem is missing evidence, not a penalty — and evidence can be assembled
        deliberately. Be fetchable, pick one exact name and use it everywhere, create a small set of independent
        records that confirm your basics, tie them together with structured data, and write the three pages only
        you could write. That sequence, done properly in a month, beats a year of publishing into a void.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
