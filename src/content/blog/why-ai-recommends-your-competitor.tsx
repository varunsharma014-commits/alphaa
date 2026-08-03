import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "why-ai-recommends-your-competitor",
  title: "Why AI Recommends Your Competitor Instead of You",
  description:
    "If ChatGPT names a competitor and not you, it is rarely because they are better. It is because they are easier to describe. Here is the diff-based diagnostic we run to find the exact missing evidence — and how to close it.",
  date: "2026-08-03",
  readMins: 10,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and compare what the
          engines say about them versus their competitors. Last updated 3 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> An AI assistant names your competitor because it can describe your
        competitor with more confidence, not because it judged them to be better. Assistants recommend whoever
        has the most consistent, specific, verifiable evidence across the sources they retrieve — so the fix is
        never &quot;be better,&quot; it is &quot;be describable.&quot; The practical method is a diff: run the
        query, capture who gets named, then compare their public evidence against yours, field by field.
      </p>

      <h2>What the model is actually doing when it picks a name</h2>
      <p>
        There is no ranking table inside ChatGPT. When someone asks &quot;who is the best commercial cleaner in
        Manchester,&quot; the assistant runs a search, retrieves a handful of documents, and writes a summary
        of what those documents support. It will only name a business it can attach concrete attributes to,
        because a hedged answer — &quot;there are several options&quot; — is a safer output than a specific
        claim it cannot ground.
      </p>
      <p>
        That produces a consistent bias with a name worth knowing: <strong>describability beats quality</strong>.
        A mediocre competitor with published prices, a service-area page, 40 detailed reviews and a slot in two
        &quot;best of&quot; listicles is trivially easy to describe. An excellent business with a beautiful site
        that says &quot;quality service, trusted since 2009&quot; gives the model nothing to say, so it says
        nothing.
      </p>
      <p>
        The same logic explains why the answer moves around between sessions. Different retrieved documents
        produce different summaries — we unpacked that in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>. Before
        concluding you are excluded, run the query more than once.
      </p>

      <h2>The five reasons a competitor gets named instead of you</h2>
      <p>In scan after scan, the cause is one of five things, roughly in order of frequency:</p>
      <ol>
        <li>
          <strong>They appear in third-party lists and you do not.</strong> Roundups, directories, local press,
          Reddit threads and &quot;best X in Y&quot; pages are disproportionately retrieved, because they answer
          the question&apos;s exact shape. If two such pages name your competitor and none name you, the
          candidate set was decided before your website was ever considered.
        </li>
        <li>
          <strong>Their reviews contain specifics and yours contain adjectives.</strong> &quot;They fixed a
          burst pipe at 11pm on a Sunday and charged the quoted price&quot; is evidence. &quot;Great
          service!&quot; is not. Assistants quote review text; specific reviews get quoted, generic ones do not.
        </li>
        <li>
          <strong>They publish the constraint facts you withhold.</strong> Price ranges, hours, service radius,
          who they are for, what they refuse. Most real queries carry a filter — cheap, near, open late,
          beginner-friendly — and a business with no public facts cannot satisfy a filter.
        </li>
        <li>
          <strong>Their entity is unambiguous and yours is fragmented.</strong> Different business names,
          addresses or phone numbers across your site, Google, Bing, Yelp and your Facebook page split one
          strong entity into several weak ones. See{" "}
          <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO</Link> for the mechanics.
        </li>
        <li>
          <strong>They are retrievable and you are not.</strong> Blocked crawlers, key facts rendered only in
          client-side JavaScript, a thin or missing index presence. Rare, but total when it happens.
        </li>
      </ol>

      <h2>The diff diagnostic: 30 minutes, no tools required</h2>
      <p>
        This is the exact workflow we use before recommending anything. Do it manually once — it teaches you
        more about your visibility than any dashboard.
      </p>
      <h3>Step 1 — Collect the answers</h3>
      <p>
        Write down the three to five questions a real customer would ask. Not your brand name — the category
        question: &quot;best [service] in [city],&quot; &quot;who should I call for [problem] in [city],&quot;
        &quot;[service] near me that does [constraint].&quot; Ask each one in ChatGPT, Gemini, Perplexity and
        Claude, in a fresh chat with no memory of you. Record every business named, in order.
      </p>
      <h3>Step 2 — Identify the repeat winner</h3>
      <p>
        One or two names will recur across engines. That is your real competitor for AI visibility — often not
        the competitor you think about commercially. Pick the one that appears most often.
      </p>
      <h3>Step 3 — Build the evidence table</h3>
      <p>
        Open their site and their profiles beside yours and fill in a plain two-column comparison. The rows that
        matter:
      </p>
      <table>
        <thead>
          <tr>
            <th>Evidence row</th>
            <th>What to check</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pricing</td>
            <td>Is any number public — a range, a starting-from, a call-out fee?</td>
          </tr>
          <tr>
            <td>Service area</td>
            <td>Are towns and neighbourhoods named in text, or only implied by a map?</td>
          </tr>
          <tr>
            <td>Who it is for</td>
            <td>Is there an explicit sentence naming the customer served — and refused?</td>
          </tr>
          <tr>
            <td>Review count and text</td>
            <td>How many, and do the recent ones mention services and staff by name?</td>
          </tr>
          <tr>
            <td>Third-party lists</td>
            <td>Search &quot;best [category] [city]&quot; — who is on page one&apos;s roundups?</td>
          </tr>
          <tr>
            <td>Name/address/phone</td>
            <td>Identical across site, Google, Bing, Yelp, Facebook, industry directories?</td>
          </tr>
          <tr>
            <td>Schema</td>
            <td>View source, search for <code>application/ld+json</code>. Present or absent?</td>
          </tr>
        </tbody>
      </table>
      <h3>Step 4 — Read the gaps, not the totals</h3>
      <p>
        You are not scoring who wins overall. You are looking for the two or three rows where they have a fact
        and you have a blank. Those blanks are your work order, in priority order. In most audits we run, the
        top two are third-party list presence and published constraint facts — and both are fixable without
        touching your site design.
      </p>

      <h2>Closing the gap: what actually moves</h2>
      <p>Working the diff in order of effort-to-impact:</p>
      <ul>
        <li>
          <strong>Publish the withheld facts this week.</strong> A price range, a named service-area list, an
          explicit &quot;who we are for / not for&quot; paragraph, response times. This is a one-afternoon
          content change that converts you from undescribable to describable.
        </li>
        <li>
          <strong>Get onto the lists that already decide your category.</strong> Find the roundups being cited,
          then contact the ones with real submission or update processes. The method is in{" "}
          <Link href="/blog/get-into-ai-best-of-lists">how to get into the &quot;best of&quot; lists AI
          recommends from</Link>.
        </li>
        <li>
          <strong>Change how you ask for reviews.</strong> Stop asking for &quot;a review&quot;; ask the
          customer to mention which service they used and what the outcome was. Specific reviews are quotable
          reviews.
        </li>
        <li>
          <strong>Unify the entity.</strong> One exact business name, one address format, one phone number, on
          every profile. Boring, and it is the cheapest confidence gain available.
        </li>
        <li>
          <strong>Add schema and check crawlability.</strong> Typed facts and an unblocked crawler are the floor,
          not the strategy.
        </li>
      </ul>

      <h2>What will not work</h2>
      <p>
        Two temptations are worth naming, because both are common and both backfire. The first is attacking the
        competitor — comparison pages that disparage them, or negative reviews. Assistants summarise the
        consensus; feeding the consensus more sentences that pair your competitor&apos;s name with your category
        strengthens their association, not yours. The second is volume for its own sake: twenty thin blog posts
        that never state a fact add nothing retrievable. One page with real numbers outperforms a month of
        filler.
      </p>
      <p>
        And the honest limit: none of this guarantees you get named. AEO shapes the public evidence an
        assistant reads — it cannot edit the model, and no vendor can insert you into an answer. Outputs vary by
        phrasing, by user, by engine and by model version. What you control is whether the evidence exists at
        all, which is precisely what your competitor got right and you did not.
      </p>

      <h2>Q&amp;A</h2>
      <h3>My competitor is smaller than us. How are they being recommended?</h3>
      <p>
        Because size is invisible to a retrieval system and specificity is not. A small firm that publishes
        prices and collects detailed reviews presents more usable evidence than a large one that publishes
        brochure copy.
      </p>
      <h3>Should I mention my competitor on my own site?</h3>
      <p>
        Only in a genuinely fair comparison where you also state where they are the better choice. Honest
        comparison pages get cited because they read as trustworthy; one-sided ones read as marketing and mostly
        reinforce the competitor&apos;s association with the category.
      </p>
      <h3>How long before the answer changes?</h3>
      <p>
        Indexable on-site changes can be picked up within days to weeks. Shifts driven by reviews and third-party
        mentions typically take a couple of months to accumulate, and they are gradual rather than a flip. Our
        realistic timeline breakdown is in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>
      <h3>Is this happening at enough scale to matter?</h3>
      <p>
        It is a real research channel now: 65% of consumers use AI tools to research products before buying
        (Clutch, 2026), and roughly two-thirds of Google searches now end without a single click to a website
        (SparkToro/Similarweb, 2026). When the answer is the destination, being the named business in it is the
        whole game.
      </p>

      <h2>The bottom line</h2>
      <p>
        Your competitor is not winning a quality contest. They are winning an evidence contest, usually by
        default, usually with a handful of facts you chose not to publish and a couple of pages you never asked
        to be listed on. Run the diff, find the two blanks, fill them. That is the entire mechanism.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
