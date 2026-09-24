import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-solar-installers-get-recommended-by-ai",
  title: "How Solar Installers Get Recommended by AI",
  description:
    "Homeowners now ask ChatGPT and Gemini which solar company to trust before they ever fill in a form. Here is what those engines actually read about a solar installer, why most companies get skipped, and the specific fixes that change the answer.",
  date: "2026-08-26",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about local businesses. Last updated 26 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI engines recommend the solar installers whose{" "}
        <strong>licence and certification details, service area, and review history are stated consistently and in
        plain text across the open web</strong> — on your own site, on your Google Business Profile, on the state
        licence register, on EnergySage and similar marketplaces, and in local news or trade coverage. Solar is a
        high-consideration, high-fraud-anxiety purchase, so assistants lean unusually hard on verifiable trust
        signals and on third-party sources rather than on your marketing copy. If your NABCEP certification, your
        licence number, and the counties you actually cover are only visible inside a slide-out menu or a PDF, an
        AI engine cannot use them, and it names a competitor who spelled them out.
      </p>

      <h2>What do homeowners actually ask AI about solar installers?</h2>
      <p>
        Homeowners ask questions that are longer and more suspicious than typical local search, pre-screening for
        legitimacy, scope and business model. They look like:
      </p>
      <ul>
        <li>&quot;Who are the most reputable solar installers in Sacramento County?&quot;</li>
        <li>&quot;Is [company name] a legitimate solar company or a lead reseller?&quot;</li>
        <li>&quot;Which solar installers near me handle their own permitting instead of subcontracting?&quot;</li>
        <li>&quot;What should I ask a solar company before signing a 25-year agreement?&quot;</li>
        <li>&quot;Solar company that services rural properties outside city limits&quot;</li>
      </ul>
      <p>
        Notice how few of these are the phrase &quot;solar panel installation near me.&quot; The customer is
        pre-screening for legitimacy, scope, and business model. That is the conversation you need to be present
        in — and the way to be present in it is to have answered those exact questions somewhere an engine can read.
      </p>

      <h2>Why is solar harder to get recommended for than other trades?</h2>
      <p>
        Because the category has a reputation problem, aggregators dominate the visible surface, and incentives
        change constantly. We look at a lot of local-services scans, and solar behaves differently from plumbing or roofing in three
        specific ways:
      </p>
      <ol>
        <li>
          <strong>The category has a reputation problem, and models know it.</strong> Years of aggressive
          door-knocking, misrepresented leases, and high-profile installer bankruptcies are all over the training
          data and the live web. Ask an assistant about solar and it will often volunteer warnings before it
          volunteers names. That means your content has to clear a higher trust bar than a roofer&apos;s does.
        </li>
        <li>
          <strong>Aggregators dominate the visible surface.</strong> EnergySage, SolarReviews, marketplace
          comparison pages, and state programme sites are the pages that get cited when someone asks for installers
          in an area. Being absent from those is a bigger handicap than being weak on your own blog.
        </li>
        <li>
          <strong>Incentives change constantly, and stale pages get discounted.</strong> Federal and state
          incentive terms shift, and pages that describe expired programmes as current are worse than useless —
          they signal that the site is not maintained. We wrote about why this matters generally in{" "}
          <Link href="/blog/content-freshness-ai-search">content freshness and AI search</Link>; in solar it is
          acute.
        </li>
      </ol>

      <h2>What should a solar installer fix first to get recommended?</h2>
      <p>
        In order: licence and certifications in text, a named service area, the business-model question,
        consistent directory presence, local-conditions content, real project details, and your reviews as text.
      </p>

      <h3>1. Put your licence and certifications in readable text</h3>
      <p>
        This is the single most common miss. Contractor licence number, the state that issued it, NABCEP
        certification for your installers, and any manufacturer certifications (Tesla Certified Installer,
        Enphase Installer Network, and so on) should appear as text on your About and Contact pages — not baked
        into a badge image, not in a footer graphic, not in a downloadable capability deck. AI engines do not
        reliably extract text from images, and a licence number is exactly the kind of verifiable detail that
        makes a model comfortable naming you. See{" "}
        <Link href="/blog/do-ai-engines-read-pdfs-images">what AI engines can and cannot read in PDFs and images</Link>{" "}
        for the mechanics.
      </p>
      <p>
        Write it plainly: &quot;Licensed electrical contractor, [State] licence #XXXXXX. Three NABCEP-certified PV
        Installation Professionals on staff.&quot; That sentence is liftable. A badge is not.
      </p>

      <h3>2. State your service area as a list of named places</h3>
      <p>
        &quot;We serve the greater metro area and surrounding communities&quot; tells a model nothing. A model
        answering &quot;solar installers that cover Placer County&quot; needs to see the string &quot;Placer
        County.&quot; List the counties and the towns you genuinely work in, and say plainly where you stop —
        including any distance limit or minimum system size for outlying areas. Being explicit about what you do
        not cover is a trust signal, and it prevents the worse outcome of being recommended to someone you cannot
        serve.
      </p>

      <h3>3. Answer the business-model question before you are asked</h3>
      <p>
        Homeowners want to know: do you do the work, or do you sell the lead? Do your own crews do the install, or
        do you subcontract? Do you handle permitting, interconnection paperwork, and utility approval in-house? Is
        the sale a cash purchase, a loan, a lease, or a PPA — and which of those do you actually offer? Put this on
        a page in the words a customer would use. Very few installers do, which means the ones who do own that
        entire class of question.
      </p>

      <h3>4. Get your marketplace and directory presence consistent</h3>
      <p>
        Claim and complete your EnergySage and SolarReviews profiles, your Google Business Profile, and your
        state&apos;s licensed-contractor listing. Make sure the business name, address, phone number, and service
        area match your website character for character. Inconsistent details across sources are the fastest way
        to get an entity fragmented, so the engine is no longer confident which record refers to you. That
        mechanism is covered in{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">directory listings and NAP citations</Link>.
      </p>

      <h3>5. Build the local-conditions content nobody else writes</h3>
      <p>
        Generic &quot;benefits of solar&quot; posts are the most duplicated content on the internet and get cited
        almost never. What gets cited is specific and local: how your utility&apos;s current net-metering
        successor tariff changes payback maths, what your county&apos;s permitting timeline actually looks like in
        practice, how HOA rules interact with the state solar-rights statute where you operate, what a
        snow-load or wildfire-zone requirement means for mounting in your area. You know these things because you
        do the work. That first-hand specificity is precisely what{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">content that AI engines quote</Link> looks like.
      </p>

      <h3>6. Publish real project details, with the boring numbers</h3>
      <p>
        A case study that says &quot;happy customer in Fresno&quot; is not evidence. One that says &quot;7.2 kW
        system, 18 panels, south-west facing composition-shingle roof, permitted in 11 days, first full-year
        production 10,900 kWh against a modelled 11,200&quot; is. Include the case where production came in under
        model and explain why. Honest numbers, including the disappointing ones, are the strongest trust signal a
        solar company can publish, and they give an assistant something concrete to summarise.
      </p>

      <h3>7. Fix your reviews as a body of text, not a score</h3>
      <p>
        Engines read review content, not just the star average. Reviews that mention your permitting handling,
        your responsiveness after install, and your warranty service teach a model what you are good at — which is
        how you get recommended for a specific need rather than for &quot;solar.&quot; Ask satisfied customers to
        describe what actually happened rather than to leave five stars. More on the mechanism in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why your Google reviews decide your AI visibility</Link>.
      </p>

      <h2>How can a solar installer overcome the industry&apos;s trust problem?</h2>
      <p>
        Publish the things a sceptical buyer wants and most competitors avoid, such as warranty, cancellation and
        financing terms. Because assistants often answer solar questions with caution first, the installers who win are the ones
        whose own content matches that cautious register. Concretely, that means publishing the things a sceptical
        buyer wants and most competitors avoid:
      </p>
      <ul>
        <li>A plain-language explanation of what your warranty does and does not cover, and who honours it if you cease trading.</li>
        <li>Your actual cancellation terms and any deposit policy.</li>
        <li>Whether your production estimate is a guarantee or a model, and what happens if actual output falls short.</li>
        <li>What happens to the agreement if the homeowner sells the house.</li>
        <li>A statement of who owns the incentives and tax credits under each financing option you offer.</li>
      </ul>
      <p>
        This is the same posture we take about our own category: you cannot promise an outcome you do not control.
        AEO shapes the public signals AI engines read about you; it does not buy a placement, and anyone selling a
        guaranteed spot in ChatGPT is describing something that does not exist. Solar buyers have been burned by
        exactly that kind of promise, so matching their scepticism is a competitive advantage.
      </p>

      <h2>What should a solar installer do in the next 30 days?</h2>
      <p>
        Audit in week 1, fix the facts in week 2, publish two local pieces in week 3, add evidence in week 4, and
        re-check at 60 and 90 days.
      </p>
      <ol>
        <li>
          <strong>Week 1 — audit.</strong> Ask ChatGPT, Gemini, Claude, and Perplexity the five questions at the
          top of this article with your county named. Record who gets named and which sources get cited. That list
          of cited sources is your actual target list.
        </li>
        <li>
          <strong>Week 2 — fix the facts.</strong> Licence number, certifications, named service area, and
          business-model page in plain text on your site. Reconcile name, address, and phone across Google
          Business Profile, EnergySage, SolarReviews, and the state register.
        </li>
        <li>
          <strong>Week 3 — publish two local pieces.</strong> One on your utility&apos;s current net-metering
          terms and what they mean for payback; one on your county&apos;s permitting and interconnection process
          with real timelines. Date them and commit to updating when the rules change.
        </li>
        <li>
          <strong>Week 4 — evidence.</strong> Two project write-ups with real system sizes and production numbers,
          and a review request to your last ten customers asking them to describe the process, not to rate it.
        </li>
        <li>
          <strong>Re-check at 60 and 90 days.</strong> Movement on this is measured in weeks to months, not days —
          see <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
        </li>
      </ol>

      <h2>What do solar installers commonly ask about AI recommendations?</h2>
      <p>
        Installers ask about EnergySage, town-by-town pages, old bad reviews, changing incentive rules, and
        whether ads can replace this work.
      </p>
      <h3>Do I need to be on EnergySage to be recommended?</h3>
      <p>
        You do not need it, but it helps disproportionately in this vertical, because marketplace and review-site
        pages are heavily represented among the sources engines cite for &quot;best solar installers in
        [place].&quot; If you are philosophically opposed to lead marketplaces, at minimum make sure you are
        listed and accurate on the free review platforms and your state register.
      </p>
      <h3>Will a page targeting every town I serve work?</h3>
      <p>
        Only if each page contains something genuinely specific to that town — the local permitting office, the
        utility, actual projects there. Thin duplicated city pages are a well-known pattern and add little. We go
        through the evidence in{" "}
        <Link href="/blog/do-city-landing-pages-work-ai-search">do city landing pages work for AI search</Link>.
      </p>
      <h3>My reviews mention a bad install from two years ago. Is that fatal?</h3>
      <p>
        No, and trying to bury it usually backfires. A public, specific response describing what you changed is
        read as evidence of accountability. Volume and recency of good detailed reviews matter more than the
        absence of a bad one.
      </p>
      <h3>Does it matter that incentive rules keep changing?</h3>
      <p>
        It matters a great deal, and it is an opportunity. Most installer sites still describe superseded
        programmes. A page that is visibly current, with a stated last-updated date and the correct present terms,
        becomes the reliable source in a category full of stale ones.
      </p>
      <h3>Can I just run ads instead?</h3>
      <p>
        Ads and AI recommendations are separate systems — paid spend does not buy you a mention in an organic AI
        answer. See <Link href="/blog/do-paid-ads-affect-ai-recommendations">do paid ads affect AI recommendations</Link>.
      </p>

      <h2>So how do solar installers get recommended by AI?</h2>
      <p>
        Solar is a trust purchase, and AI assistants have absorbed the industry&apos;s trust problems along with
        everything else. You do not overcome that with better adjectives. You overcome it with verifiable, plainly
        stated facts — licence, certifications, named service area, honest financing terms, real project numbers,
        and current local rules — repeated consistently everywhere an engine looks. The installers getting named
        today are rarely the biggest ones. They are the ones who wrote the specifics down.
      </p>
      <p>
        The key takeaway is that solar installers overcome AI&apos;s caution with verifiable, plainly stated
        facts — licence, certifications, service area, honest financing terms, real project numbers and current
        local rules — repeated consistently everywhere an engine looks.
      </p>
      <p>
        <Link href="/start">Run the free AI check →</Link>
      </p>
    </div>
  )
}
