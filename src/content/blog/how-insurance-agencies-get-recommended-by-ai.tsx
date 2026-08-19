import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-insurance-agencies-get-recommended-by-ai",
  title: "How Insurance Agencies and Brokers Get Recommended by AI",
  description:
    "When someone asks ChatGPT for an agent who writes contractor general liability in Georgia, the engines answer from what agencies have published. Here is what actually decides whether an insurance agency or broker gets named.",
  date: "2026-08-19",
  readMins: 10,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including
          independent agencies, brokers and MGAs. Last updated 19 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend the insurance agencies whose{" "}
        <strong>lines, carriers, states and client types are written in plain, crawlable text</strong>. For
        this category four facts decide almost everything: the specific coverages you place (not
        &quot;business insurance&quot;), the carriers and markets you have appointments with, the states you
        are licensed in, and the customer profile you actually write — trade, revenue band, fleet size,
        payroll. Most agency websites publish none of these, which is precisely why this vertical is
        winnable by anyone willing to write them down.
      </p>

      <h2>What insurance buyers actually ask an assistant</h2>
      <p>
        Nobody types &quot;best insurance agency.&quot; Insurance questions arrive loaded with constraints,
        because the person asking is trying to find out, quickly, whether anyone can even write their risk:
      </p>
      <ul>
        <li>&quot;Agent who writes general liability for a roofing contractor in Georgia&quot;</li>
        <li>&quot;Who can get commercial auto for a 12-truck box truck fleet with two at-fault claims?&quot;</li>
        <li>&quot;Broker for a restaurant with a liquor licence in Illinois&quot;</li>
        <li>&quot;Independent agent that handles workers comp for staffing agencies&quot;</li>
        <li>&quot;Cyber liability for a 60-person medical billing company&quot;</li>
        <li>&quot;Someone who can shop my home and auto in Florida after a non-renewal&quot;</li>
      </ul>
      <p>
        Every one of those is a filter: line of business, class code, state, loss history, size. If the
        filter never appears as text on a page a model can reach, you are not ranked badly for that query —
        you are <strong>unmatchable</strong>. The agencies that get named are rarely the biggest. They are
        the ones that published the qualifying details their competitors treat as first-phone-call material.
      </p>

      <h2>Why insurance is unusually hard — and unusually winnable</h2>
      <p>
        Two things make this category different from a dentist or a plumber.
      </p>
      <p>
        First, <strong>carrier-supplied websites are near-invisible</strong>. Thousands of agencies run a
        template site provided by a carrier or an agency-management vendor, with the same boilerplate copy as
        every other agency on that platform. When a retrieval system pulls twenty pages that all say
        &quot;we shop multiple carriers to find you the best rate,&quot; there is nothing in any of them to
        distinguish or cite. Duplicate, undifferentiated text is the single most common cause of invisibility
        we see in this vertical.
      </p>
      <p>
        Second, <strong>compliance nervousness suppresses specifics</strong>. Agencies avoid naming carriers,
        quoting price ranges or describing appetite because they worry about approval or about being held to
        a statement. The instinct is reasonable; the blanket application of it is what makes an agency
        unmatchable. You can be precise about the things that are genuinely stable — lines placed, states
        licensed, industries served, the process a client goes through — without quoting a premium or
        implying a guarantee of coverage.
      </p>

      <h2>The six facts that decide insurance recommendations</h2>

      <h3>1. Lines of business, named individually</h3>
      <p>
        &quot;Commercial insurance&quot; matches nothing, because every agency says it. List the actual
        coverages you place, as separate named items with a sentence each: general liability, commercial
        auto, workers compensation, professional liability / E&amp;O, cyber liability, EPLI, inland marine,
        builder&apos;s risk, umbrella, bonds, group benefits. A model handling &quot;who writes builder&apos;s
        risk&quot; can only match text that contains those words.
      </p>

      <h3>2. Appetite — the classes you actually write</h3>
      <p>
        Appetite is the most valuable and least-published fact in the entire category. Write it out:
        &quot;we place general liability and workers comp for trade contractors — roofing, HVAC, electrical,
        plumbing — with payrolls between $250K and $5M, primarily in Georgia and Alabama.&quot; That single
        sentence answers half a dozen distinct buyer questions. Include what you <em>do not</em> write too;
        honest exclusions build trust and stop unqualified calls.
      </p>

      <h3>3. Carriers and markets you are appointed with</h3>
      <p>
        Where your agreements permit it, name the carriers and wholesale markets you access. Buyers and
        assistants both use carrier names as a proxy for whether you can actually place a risk. If naming
        specific carriers is restricted for you, publish the shape of the access instead — &quot;standard
        market appointments plus three excess and surplus wholesalers for hard-to-place property&quot; — which
        is still far more matchable than silence.
      </p>

      <h3>4. Licensed states, listed explicitly</h3>
      <p>
        Insurance is state-regulated, so geography is not a nice-to-have — it is a hard eligibility gate.
        Write the states you are licensed in as an explicit list, not a map graphic. Models cannot read an
        image, and a decorative map is one of the most common reasons an otherwise well-optimised agency
        never surfaces. Include your NPN or state licence numbers if you are comfortable doing so; verifiable
        identifiers are strong trust signals.
      </p>

      <h3>5. Who you are, in entity terms</h3>
      <p>
        Agencies change names, merge and get acquired more than almost any other local business, which leaves
        AI engines holding several half-correct versions of you. Pick one legal-and-trading name and make it
        identical on your website, Google Business Profile, your state DOI listing, your carrier
        agency-locator entries, LinkedIn and every directory. This is entity consolidation, and for insurance
        it does more work than any amount of new content — see{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          how AI engines identify your business as an entity
        </Link>
        .
      </p>

      <h3>6. Process and turnaround, described concretely</h3>
      <p>
        &quot;Fast, friendly service&quot; is not extractable. &quot;Send us your loss runs and current dec
        page; we market your account to appointed carriers and return options within two business days&quot;
        is. Describe the steps, the documents you need, and realistic timelines. Process copy is the single
        easiest thing to write and one of the most quotable things an assistant can lift.
      </p>

      <h2>A page structure that works</h2>
      <p>
        The structure that performs in this vertical is boring and specific: one page per{" "}
        <strong>line-of-business plus audience</strong> combination you genuinely serve. Not sixty thin pages
        — six to fifteen real ones.
      </p>
      <ul>
        <li>&quot;General liability insurance for roofing contractors in Georgia&quot;</li>
        <li>&quot;Commercial auto for local delivery fleets&quot;</li>
        <li>&quot;Workers compensation for staffing agencies&quot;</li>
        <li>&quot;Cyber liability for medical billing and healthcare vendors&quot;</li>
      </ul>
      <p>
        Each page should open with a two-sentence definitional answer, then cover: who it is for, what the
        coverage does and does not do, typical limits requested in that trade, what underwriters ask for,
        what makes a submission get declined, and what happens next. Add{" "}
        <Link href="/blog/schema-markup-for-ai-search">InsuranceAgency and FAQPage schema</Link> so the
        machine-readable layer matches the text.
      </p>

      <h2>Reviews and third-party evidence</h2>
      <p>
        Insurance reviews are unusual: they cluster around claims moments, so they skew to either relief or
        anger. What helps an assistant is not the star average alone but reviews that contain{" "}
        <strong>specifics</strong> — &quot;placed our GL and workers comp for a five-truck HVAC company after
        our carrier non-renewed.&quot; When asking for reviews, ask about the situation you solved, not for
        praise. Those sentences are what gets quoted back when a buyer with the same situation asks.
      </p>
      <p>
        Beyond reviews, the third-party sources AI engines lean on for this category are your state
        department-of-insurance licensee lookup, carrier agency locators, your local chamber and trade
        association listings, and any independent-agent network directory you belong to. Every one of those
        should carry the same name, address, phone and website. Inconsistency there quietly costs more than
        most agencies realise.
      </p>

      <h2>What this cannot do</h2>
      <p>
        Being honest about limits matters more in a regulated category than anywhere else. Publishing your
        appetite does not guarantee you appear in any given AI answer — outputs vary by phrasing, by user,
        and by model version, and no vendor can insert you into ChatGPT. It also cannot fix an agency whose
        actual availability is poor; assistants increasingly reflect review content, and a pattern of
        complaints about unanswered claims calls will surface. AEO shapes the public signals AI reads. It
        does not manufacture a reputation you have not earned. If you want the honest mechanism behind that
        claim, read{" "}
        <Link href="/blog/is-aeo-real">is AEO real</Link>.
      </p>

      <h2>Where to start this week</h2>
      <ul>
        <li>Write one appetite paragraph — lines, classes, size bands, states — and put it on your homepage.</li>
        <li>Replace any map graphic with a written list of licensed states.</li>
        <li>Pick your two most profitable niches and build one real page for each.</li>
        <li>Make your agency name identical across your site, GBP, DOI listing and carrier locators.</li>
        <li>Ask your next three renewals for a review that names the situation you solved.</li>
      </ul>
      <p>
        None of this is clever. It is the unglamorous work of writing down what you already know, in the
        words a buyer would use, on a page a machine can read.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
