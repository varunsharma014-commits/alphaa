import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "wikipedia-wikidata-ai-visibility",
  title: "Do Wikipedia and Wikidata Affect Your AI Visibility?",
  description:
    "Wikipedia and Wikidata are unusually influential sources for AI assistants — but most businesses do not qualify for either, and trying to force it backfires. Here is what each one actually does, who realistically qualifies, and the substitutes that work for everyone else.",
  date: "2026-08-03",
  readMins: 9,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and spend a lot of
          time on why an engine can or cannot identify one. Last updated 3 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes — Wikipedia and Wikidata carry outsized weight with AI assistants,
        because both are heavily represented in training data and are structured, permissively licensed, and
        widely mirrored. But the honest caveat matters more than the fact: the overwhelming majority of small
        and mid-sized businesses do not meet Wikipedia&apos;s notability bar, and creating a page about
        yourself is against its conflict-of-interest guidance and usually ends in deletion. The useful move for
        most companies is to reproduce what those sources <em>provide</em> — a stable, structured, independently
        corroborated identity — using assets you are actually entitled to control.
      </p>

      <h2>Why these two sources punch above their weight</h2>
      <p>
        Wikipedia and Wikidata are sister projects of the Wikimedia Foundation, and they do different jobs.
        Wikipedia is prose: an encyclopedic article with inline citations to independent sources. Wikidata is a
        structured knowledge base: machine-readable statements about an entity — founding date, headquarters,
        industry, parent company, official website — each with its own identifier and, ideally, its own
        reference.
      </p>
      <p>Three properties make them disproportionately influential for AI systems:</p>
      <ul>
        <li>
          <strong>Training weight.</strong> Wikipedia text is present in essentially every large-scale public
          web corpus used to train language models, often deduplicated and quality-weighted upward. A model&apos;s
          baseline &quot;prior&quot; about an entity is substantially shaped by whether an article existed at
          training time.
        </li>
        <li>
          <strong>Structure and identifiers.</strong> Wikidata assigns each entity a stable Q-number and links
          it to other identifier systems. That gives a machine an unambiguous handle for disambiguation — the
          difference between recognising your company and guessing between three similarly named ones.
        </li>
        <li>
          <strong>Downstream propagation.</strong> Both are openly licensed and mirrored across countless
          sites, aggregators, and knowledge panels. A statement there does not stay there; it reappears in the
          retrieval pool many times over, which reads to a system as corroboration.
        </li>
      </ul>
      <p>
        The mechanism this feeds is the one behind every AI recommendation: multi-source consensus about a
        clearly identified entity. We unpack the general version in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          entity SEO and how AI identifies your business
        </Link>
        .
      </p>

      <h2>The part most articles skip: you probably do not qualify</h2>
      <p>
        Wikipedia&apos;s inclusion standard is notability, and for companies it broadly requires significant
        coverage in multiple reliable, independent, secondary sources — meaning substantial journalism or
        published analysis <em>about</em> the company, not press releases, funding announcements, listicles,
        directory entries, or interviews you arranged. Wikipedia also has explicit conflict-of-interest and
        paid-contribution rules: you are discouraged from writing about your own organisation, and paid editing
        must be disclosed.
      </p>
      <p>
        What actually happens when a business ignores this is predictable, and we have watched it more than
        once. A page appears. Within days a new-page reviewer tags it for notability. The sources turn out to
        be the company&apos;s own blog, a paid placement, and a local roundup. It goes to deletion discussion
        and is removed — and the deletion record itself is public, indexed, and rather less flattering than
        having no page at all. Agencies selling &quot;we&apos;ll get you a Wikipedia page&quot; are usually
        selling that outcome.
      </p>
      <p>
        So the practical test is simple: can you list three or four substantial, independent published pieces
        that are principally <em>about</em> your company, written by people with no relationship to it? If not,
        Wikipedia is not currently a lever available to you, and no amount of budget changes that. Notability
        is earned upstream, in coverage, not downstream, in editing.
      </p>

      <h2>Wikidata is a different, and much lower, bar</h2>
      <p>
        Wikidata does not use Wikipedia&apos;s notability standard. Its own criteria are looser: an item may be
        created if it refers to a clearly identifiable conceptual or material entity that can be described
        using serious, publicly available references, or if it is needed to structure other data. Plenty of
        organisations exist on Wikidata with no Wikipedia article at all.
      </p>
      <p>
        That said, treat it with the same honesty. Add only statements you can reference — official website,
        legal registration or company number, founding date, headquarters location, industry classification —
        and cite where each comes from. Unsourced promotional items get merged or deleted, and Wikidata editors
        notice marketing language quickly. Done properly, the value is disambiguation: an identifier that ties
        your name to your domain and your registration, so systems stop confusing you with the similarly named
        firm two countries over.
      </p>
      <p>
        Be realistic about magnitude. A Wikidata item is a small, structural signal, not a visibility switch. It
        helps a machine resolve <em>which</em> entity you are once it already has reason to mention you. It does
        not create the reason.
      </p>

      <h2>What to do instead — reproducing the same signals</h2>
      <p>
        Strip away the brand names and Wikipedia and Wikidata give an AI system four things. Every one has an
        accessible substitute.
      </p>
      <table>
        <thead>
          <tr>
            <th>What the Wikimedia sources provide</th>
            <th>The substitute available to any business</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A canonical, structured entity record</td>
            <td>
              <code>Organization</code> or <code>LocalBusiness</code> schema on your site, with{" "}
              <code>sameAs</code> pointing at every profile you control
            </td>
          </tr>
          <tr>
            <td>A stable identifier for disambiguation</td>
            <td>
              One consistent legal name, address, and domain used identically everywhere — plus your company
              registration number where it is public
            </td>
          </tr>
          <tr>
            <td>Independent description by third parties</td>
            <td>
              Reviews, trade-press mentions, industry directories, conference listings, podcast appearances
            </td>
          </tr>
          <tr>
            <td>Wide propagation of the same facts</td>
            <td>
              Deliberate consistency across profiles that are themselves widely crawled and mirrored
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The concrete version of the first row is a single, well-formed <code>Organization</code> block whose{" "}
        <code>sameAs</code> array lists your LinkedIn company page, Crunchbase profile, Google Business
        Profile, G2 or Capterra listing, GitHub organisation, and social accounts. That array is the closest
        thing most companies have to a Q-number: it is an explicit, machine-readable assertion that all these
        identities are one entity. Details of the markup are in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>
      <p>
        And keep the spelling identical everywhere. Fragmented naming is the single most common cause of the
        wrong-entity problem we see in scans — three variants of a company name produce three weak entities
        instead of one strong one. If an engine has already blended you with someone else, the repair process
        is in{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">
          how to fix wrong AI information about your business
        </Link>
        .
      </p>

      <h2>Common questions</h2>
      <h3>Will a Wikipedia page make ChatGPT recommend me?</h3>
      <p>
        On its own, no. It strengthens the model&apos;s baseline knowledge and gives retrieval a high-trust
        document to lean on, which makes a mention more likely and more accurate. It does not create demand,
        and recommendations for commercial queries still lean heavily on reviews, roundups, and current web
        results.
      </p>
      <h3>Should I hire someone to write my Wikipedia article?</h3>
      <p>
        Only if you genuinely meet notability, and then only with the paid-contribution disclosure Wikipedia
        requires — normally by proposing a draft rather than publishing directly. If a vendor offers to skip
        that, they are proposing to break the site&apos;s rules on your behalf, with your brand attached to the
        record.
      </p>
      <h3>How long until a Wikidata item shows any effect?</h3>
      <p>
        Wikidata edits propagate to mirrors and dumps over weeks to months, and models only absorb them into
        baseline knowledge at their next training cycle. Live retrieval can pick them up sooner. Treat it as a
        slow, structural investment with a small effect, and do not build a plan around it. Realistic timelines
        for AEO work generally are in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>

      <h2>The bottom line</h2>
      <p>
        Wikipedia and Wikidata matter because they give machines something rare: a structured, corroborated,
        widely copied statement of who an entity is. If you legitimately qualify for Wikipedia, that is a
        durable asset — pursue it through coverage, not through editing. If you do not, a referenced Wikidata
        item is a modest and honest option, and the rest of the benefit is reproducible with schema, identifier
        consistency, and independent mentions. Nobody can promise you an article, and anyone who does is
        promising you a deletion discussion.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
