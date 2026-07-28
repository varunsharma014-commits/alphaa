import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "reddit-and-ai-search",
  title: "Why Reddit and Third-Party Mentions Decide What AI Says About Your Business",
  description:
    "AI assistants lean on Reddit, review sites, forums and directories because independent sources are the only way they can verify a claim. Here is why third-party mentions outweigh your own website, which surfaces matter, and how to earn them without astroturfing.",
  date: "2026-07-28",
  readMins: 10,
  tag: "Off-Page",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        By the alphaa team — we read the raw snippets AI engines produce about businesses every week, and the source
        they quote is usually not the business&apos;s own website.
      </p>
      <p>
        <strong>Short answer:</strong> AI assistants weight third-party sources heavily because your own site tells
        them what you <em>claim</em>, while reviews, forum threads, directories and press tell them what is
        <em> corroborated</em>. When a model has to decide whether to name you, independent agreement across several
        unrelated sources is the strongest evidence it has. Reddit and Quora punch especially far above their weight
        because their content is phrased as questions and answers — the same shape as the query — and because both
        Google and OpenAI have signed content agreements with Reddit (Reuters, 2024; Reddit and OpenAI, 2024).
      </p>

      <h2>Why do AI engines quote Reddit so often?</h2>
      <p>
        Three mechanics compound, and none of them are about Reddit being a better website.
      </p>
      <ul>
        <li>
          <strong>Format match.</strong> Retrieval finds documents whose text resembles the query. Someone asking
          &quot;best HVAC company in Tulsa that actually shows up&quot; is close to verbatim to an existing thread
          title. A services page reading &quot;Excellence in Heating and Cooling Since 1998&quot; matches nothing a
          human would type.
        </li>
        <li>
          <strong>Perceived independence.</strong> The model has no way to audit your claims, but it can observe
          that several strangers with nothing to sell said similar things. That is the closest thing to verification
          available at retrieval time.
        </li>
        <li>
          <strong>Licensing and access.</strong> Reddit has content agreements with both Google and OpenAI, which
          means that corpus is reliably available to those systems rather than sitting behind a blocked crawler.
          Availability is not the same as authority, but a source that cannot be read is never cited.
        </li>
      </ul>
      <p>
        The practical consequence: you can write a flawless service page and still lose to a two-line comment from
        someone in your city, because the comment is retrievable, conversational, and independent.
      </p>

      <h2>The four surfaces that actually move the answer</h2>
      <p>Ranked by how often we see them quoted verbatim in engine snippets.</p>
      <ol>
        <li>
          <strong>Review platforms.</strong> Google Business Profile reviews first, then the category-specific ones —
          Healthgrades, Avvo, Angi, Yelp, G2 depending on your industry. Assistants quote review language directly,
          which means the <em>words</em> in your reviews matter as much as the star average. Reviews that say
          &quot;same-day emergency repair&quot; teach the model a service; reviews that say &quot;great job, thanks&quot;
          teach it nothing.
        </li>
        <li>
          <strong>Forums and community threads.</strong> Reddit, Quora, Nextdoor, and city or trade-specific forums.
          Low volume, disproportionate influence.
        </li>
        <li>
          <strong>Directories and structured listings.</strong> Chamber of commerce, licensing boards, trade
          associations, industry databases. These carry little narrative weight but are how a model confirms you are
          a real, licensed entity at a specific address — and stale ones actively poison the answer.
        </li>
        <li>
          <strong>Editorial and press mentions.</strong> A local news piece or an industry roundup is the rarest and
          strongest signal, because it is both independent and editorially filtered.
        </li>
      </ol>
      <p>
        Notice that three of the four are things you influence rather than control. That is uncomfortable, and it is
        also why this work is durable — the same property that makes it slow makes it hard for a competitor to fake
        overnight.
      </p>

      <h2>A worked example</h2>
      <p>
        A common pattern from scan results: a dental practice with a modern site, correct schema, and a strong 4.8
        Google rating gets named in roughly one in five ChatGPT runs for &quot;best dentist for nervous patients&quot;
        in its city. Reading the snippets shows the model describing it in generic terms — location and rating,
        nothing else — while naming two competitors with specific phrases about sedation and anxiety.
      </p>
      <p>
        The competitors were not doing better SEO. Their reviews and a handful of local forum replies used the words
        patients actually search with. The fix is unglamorous and takes a quarter: ask the patients who came in
        specifically for sedation to mention that in a review, publish a genuinely useful page on what sedation
        options exist and who they suit, answer the real questions in the local subreddit when they come up, and
        make sure the licensing-board listing and the practice&apos;s own site agree on name, address and services.
        None of that is a trick. It is making a true thing about the practice legible to a machine that can only
        read public text. The same entity-consistency logic is covered in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          entity SEO and how AI identifies your business
        </Link>
        .
      </p>

      <h2>How to earn mentions without getting removed</h2>
      <p>
        This is where most businesses either do nothing or do something that backfires. The workflow that holds up:
      </p>
      <ul>
        <li>
          <strong>Ask for specific reviews, not more reviews.</strong> After a job that went well, ask the customer
          to mention what you actually did — the service, the timeframe, the neighborhood. Never script it, never
          offer anything in exchange. Incentivized reviews violate Google&apos;s policies and most platforms&apos;
          terms.
        </li>
        <li>
          <strong>Participate in communities as yourself, with the affiliation disclosed.</strong> Answer questions
          where you are genuinely the expert, and let most of your contributions be ones where you do not mention
          your business at all. A rough 10-to-1 ratio of helpful-to-promotional is the norm that keeps you welcome.
        </li>
        <li>
          <strong>Audit your listings once a quarter.</strong> Search your business name plus your city and open
          every directory result. Fix mismatched addresses, dead phone numbers, and services you no longer offer.
          This is the highest-yield, lowest-effort item on the list and almost nobody does it.
        </li>
        <li>
          <strong>Be quotable on your own site anyway.</strong> Third-party sources dominate, but the model still
          needs somewhere to confirm the specifics. Short, declarative, factual sentences — what you do, for whom,
          where, with what constraints — are what gets lifted. The{" "}
          <Link href="/blog/aeo-checklist">AEO checklist</Link> covers the on-site half.
        </li>
      </ul>

      <h2>What not to do</h2>
      <p>
        Do not buy reviews, do not post as a fake customer, and do not pay for undisclosed positive threads. Beyond
        the legal exposure — the FTC&apos;s 2024 rule on fake reviews and testimonials carries real penalties in the
        US — it is genuinely fragile as a tactic. Communities detect and remove it, platforms filter it, and a model
        reading a suspiciously uniform set of praise is being fed exactly the pattern that consensus checks are
        designed to catch. The honest version is slower and does not get deleted.
      </p>

      <h2>Common questions</h2>
      <p>
        <strong>Should I create a subreddit or post about my own business?</strong> Generally no. Self-promotional
        threads get removed and do not read as independent. Answering existing questions works; announcing yourself
        does not.
      </p>
      <p>
        <strong>Do negative mentions hurt my AI visibility?</strong> They shape the description more than the
        appearance. Being named with a caveat is usually better than not being named. Reply publicly, factually, and
        without arguing — the reply is also retrievable text.
      </p>
      <p>
        <strong>How many mentions is enough?</strong> There is no threshold anyone can honestly quote, and any
        vendor giving you a number is inventing it. What we observe is directional: consistent descriptions across
        several unrelated sources beats volume on one.
      </p>
      <p>
        <strong>Does this matter if my customers still use Google?</strong> They use both. 65% of consumers now use
        AI tools to research products before buying (Clutch, 2026), and the same third-party sources feed Google&apos;s
        own AI answers.
      </p>

      <h2>The bottom line</h2>
      <p>
        You do not get to write your own entry in an AI assistant&apos;s answer. You get to make sure that when it
        reads what other people have written about you, the picture is specific, accurate, and consistent. That is
        slower than editing a meta description and it is the part that actually decides whether you get named — and
        no one, including us, can guarantee a placement, only improve the evidence.
      </p>
      <p>
        <em>Last updated 2026-07-28.</em>
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
