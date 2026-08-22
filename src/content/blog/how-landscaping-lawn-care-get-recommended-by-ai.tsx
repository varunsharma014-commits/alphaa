import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-landscaping-lawn-care-get-recommended-by-ai",
  title: "How Landscaping and Lawn Care Companies Get Recommended by AI",
  description:
    "AI assistants recommend landscaping and lawn care companies that publish what they actually do, where, in which season, and at roughly what price — and whose reviews and listings agree. Here is the seasonal, service-area playbook that gets a green-industry business named in AI answers.",
  date: "2026-08-22",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including a lot of
          green-industry ones. Last updated 22 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend the landscaping and lawn care companies whose
        services, service area, seasons and rough pricing are stated in plain text somewhere a crawler can read
        — and confirmed by reviews and listings that agree with each other. Nothing about the green industry is
        special except two things that trip everyone up: <strong>the work is seasonal</strong>, and{" "}
        <strong>&quot;landscaping&quot; means six different jobs to six different customers</strong>. Fix those
        two and you are ahead of most of your market.
      </p>

      <h2>What a customer actually asks an assistant</h2>
      <p>
        Almost nobody types &quot;landscaper near me&quot; into ChatGPT. The questions we see people bring to
        assistants are long, specific and full of constraints:
      </p>
      <ul>
        <li>&quot;Who does weekly lawn mowing in [suburb] and takes on properties under a quarter acre?&quot;</li>
        <li>&quot;I need a retaining wall rebuilt before winter — who in [city] does hardscaping, not just mowing?&quot;</li>
        <li>&quot;Is there a lawn care company near [city] that uses organic or pet-safe treatments?&quot;</li>
        <li>&quot;Who handles snow removal for a small commercial lot in [town], and do they do seasonal contracts?&quot;</li>
        <li>&quot;Roughly what does a full landscape design cost in [metro]?&quot;</li>
      </ul>
      <p>
        Every one of those contains a filter — service type, property type, chemical preference, contract
        structure, season, price. The assistant answers by retrieving passages that match those filters. If your
        website says &quot;full-service landscaping for residential and commercial properties,&quot; you have
        matched none of them. You have written a category, not an answer.
      </p>

      <h2>The single biggest fix: split &quot;landscaping&quot; into named services</h2>
      <p>
        Most green-industry sites have one Services page listing eight bullet points. That is one document
        covering eight jobs, which means it is a weak match for all eight. The businesses that get named in AI
        answers have a real page — 400 words minimum — for each service they genuinely want to sell:
      </p>
      <ul>
        <li>
          <strong>Lawn maintenance</strong> — mowing, edging, blowing. State the cadence you offer (weekly,
          biweekly), the property sizes you take, and whether it is contract or per-visit.
        </li>
        <li>
          <strong>Lawn treatment</strong> — fertilisation, weed control, grub control, aeration and
          overseeding. Say which programme steps happen in which month, and name your products or state that
          you use pet- and child-safe applications, if true.
        </li>
        <li>
          <strong>Landscape design and installation</strong> — planting, beds, sod, irrigation. This is a
          high-ticket query and deserves its own page with a real project walkthrough.
        </li>
        <li>
          <strong>Hardscaping</strong> — patios, walls, walkways, drainage. Different crew, different customer,
          different question. Never bury it in a bullet.
        </li>
        <li>
          <strong>Tree and shrub care</strong> — pruning, removal, stump grinding. Say plainly whether you are
          a certified arborist or subcontract removals; this distinction is exactly what a careful customer asks
          an assistant to check.
        </li>
        <li>
          <strong>Seasonal work</strong> — spring and fall cleanups, leaf removal, snow and ice management,
          holiday lighting.
        </li>
      </ul>
      <p>
        Each page should open with a 40–60 word paragraph that answers the question standing alone, because that
        is the passage an engine lifts. The mechanics of writing extractable paragraphs are in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI engines will quote</Link>.
      </p>

      <h2>Publish the seasonal calendar — it is the content nobody writes</h2>
      <p>
        Green-industry demand is a calendar, and almost no landscaping site publishes one. That is an open
        opportunity, because &quot;when should I aerate my lawn in [region]&quot; and &quot;when do I need to
        book fall cleanup&quot; are exactly the questions people ask assistants, and the assistant has to cite
        somebody.
      </p>
      <p>
        Write one page: your service calendar for your climate zone. Month by month, what happens to a lawn in
        your region, what you do about it, and when a customer should book to get a slot. Something like:
        pre-emergent goes down when soil temperatures hold near 55°F, which in your area is usually mid-March;
        aeration and overseeding land in early September for cool-season grass; snow contracts close in October.
      </p>
      <p>
        Two things make this page work. First, it is genuinely regional — a Minnesota calendar and a Georgia
        calendar are different documents, so yours is not duplicative. Second, it is operator knowledge you
        already have and a content generator does not. Put your actual dates on it, with the caveat that they
        shift with the weather — the honesty is a{" "}
        <Link href="/blog/eeat-author-bios-ai-search">trust signal</Link>, not a hedge.
      </p>
      <p>
        Keep it updated each year. Seasonal content that visibly went stale is a weak citation candidate, for
        the reasons covered in{" "}
        <Link href="/blog/content-freshness-ai-search">content freshness and AI search</Link>.
      </p>

      <h2>Define your service area honestly, in text</h2>
      <p>
        Landscaping is drive-time economics: you will not cross a metro for a $60 mow. Assistants answering
        &quot;who serves [town]&quot; need a text list of the towns, suburbs and ZIP codes you cover — not a map
        widget, which is usually an image or a script and contributes nothing readable.
      </p>
      <p>
        Put the list on the site as plain text, and mirror it in the <em>areaServed</em> property of your
        LocalBusiness schema (see{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>). If you also want
        dedicated pages for your strongest towns, build only the ones you can fill with something locally true —
        soil type, common turf grass, an HOA rule, a municipal watering restriction. The test and the trap are
        both in{" "}
        <Link href="/blog/do-city-landing-pages-work-ai-search">do city landing pages still work for AI search</Link>.
      </p>

      <h2>Pricing: give a range or get skipped</h2>
      <p>
        Price filters heavily in these questions, and a page with no numbers cannot be cited on price. You do
        not have to publish a rate card. A range with the variables named does the job: what a weekly mow runs
        for a typical quarter-acre lot in your market, what a season-long treatment programme costs, what a
        paver patio runs per square foot and what moves it — access, grade, material, drainage.
      </p>
      <p>
        Ranges also protect you. An assistant that cannot find your numbers will still answer the question, using
        someone else&apos;s. The reasoning is in{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link>.
      </p>

      <h2>Reviews are the corroboration, and they should name the work</h2>
      <p>
        For local service work, off-property confirmation usually decides the answer. What matters is not only
        the star average but <em>what the reviews say</em> — review text is retrievable, and reviews that name a
        service and a place turn into evidence the engine can use.
      </p>
      <p>
        So when you ask, ask specifically: after a hardscape job, ask the customer to mention the patio and the
        neighbourhood. After a season of treatments, ask them to mention the programme and the results. Twenty
        reviews that all say &quot;great job, very professional&quot; corroborate nothing in particular. Six that
        name retaining walls in a named suburb make you the obvious answer for retaining walls in that suburb.
        More on the mechanism in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why your Google reviews decide your AI visibility</Link>.
      </p>

      <h2>The listings that matter for green-industry businesses</h2>
      <p>
        Your name, address and phone number must be identical everywhere — Google Business Profile first, then
        Apple Business Connect, Bing Places, Yelp, Angi, Thumbtack, HomeAdvisor, Nextdoor, and your state
        landscape or nursery association directory. Association and licensing listings are worth real effort:
        they are the kind of independent, non-promotional source engines lean on when a user asks whether a
        company is legitimate or licensed.
      </p>
      <p>
        If you carry a pesticide applicator licence, an ICPI or NCMA hardscape certification, or an ISA arborist
        credential, state the credential and the issuing body by name on the site. Conflicting or missing details
        suppress rather than average out — see{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">
          directory listings and NAP consistency for AI search
        </Link>
        .
      </p>

      <h2>Common questions</h2>
      <h3>Does posting photos of my work help?</h3>
      <p>
        Photos help humans convert and they help your Google Business Profile, but an engine reading your site
        gets little from an image on its own. Caption each project in text: service, town, property type, what the
        problem was, what you did. The caption is the retrievable part.
      </p>
      <h3>I am a one-person mowing operation. Is this worth it?</h3>
      <p>
        The service-area list, one honest services page per job you want, a seasonal calendar and consistent
        listings are perhaps a weekend of work, and they are most of the benefit. Solo operators often do better
        than big firms here, because a real person writing about their own routes produces more specific text
        than a template ever will.
      </p>
      <h3>Will this get me ranked at the top for &quot;landscaping near me&quot;?</h3>
      <p>
        No one can promise that, and anyone who does is selling you something. AEO changes the public signals AI
        systems read about you; it does not control what any engine outputs, and answers vary between engines and
        between runs for reasons explained in{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time you ask</Link>. What
        you can reasonably expect is to be a candidate for the specific, filtered questions you have actually
        answered.
      </p>
      <h3>How long before anything changes?</h3>
      <p>
        Crawl, index and refresh cycles mean weeks, not days, and seasonal pages may need a season to prove
        themselves. Realistic timelines are in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
      </p>

      <h2>The bottom line</h2>
      <p>
        The landscaping companies that get recommended by AI are the ones that stopped writing
        &quot;full-service&quot; and started writing which service, which town, which month, and roughly what it
        costs. That information already exists — it is in your head, your route sheet and your quoting
        spreadsheet. Getting it onto pages a crawler can read, and making sure your listings and reviews say the
        same thing, is the entire job.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
