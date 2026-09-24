import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-home-care-agencies-get-recommended-by-ai",
  title: "How Home Care and Senior Care Agencies Get Recommended by AI",
  description:
    "AI assistants recommend home care agencies that publish their state license number, the exact level of care they provide, who pays for it, and how fast they can start — in plain readable text. Here is the playbook, including the payer page almost no agency has.",
  date: "2026-08-24",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about local businesses. Last updated 24 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI assistants recommend the home care agencies whose website states{" "}
        <strong>the state license or registration number, the specific level of care provided, which payment
        sources are accepted, the exact service area, and how quickly care can start</strong> — in crawlable
        text, corroborated by reviews, directory listings and the state licensing register. Senior care is a
        high-stakes category, and assistants behave accordingly: they are conservative, they prefer sources they
        can verify, and they will decline to name a provider they cannot corroborate. That conservatism is the
        opportunity. The verifiable agency wins by default, because most of its competitors publish a photograph
        of a smiling caregiver and the phrase &quot;compassionate care you can trust.&quot;
      </p>

      <h2>Who searches for home care with AI, and what do they ask?</h2>
      <p>
        Usually an adult child, often in another state, asking what kind of care a parent needs, who pays for it and who provides it locally. The person searching is almost never the person receiving care. It is an adult child, often in another
        state, often at 11pm after a fall or a hospital discharge call. They do not know the vocabulary. They ask
        an assistant because it will translate for them. The questions look like this:
      </p>
      <ul>
        <li>&quot;My mother is being discharged Friday and needs help bathing and with meals — what kind of care is that, and who provides it in [city]?&quot;</li>
        <li>&quot;Does Medicare pay for a caregiver at home? If not, what does?&quot;</li>
        <li>&quot;Which home care agencies in [county] accept the [state] Medicaid waiver?&quot;</li>
        <li>&quot;I need overnight care for a parent with dementia in [town] starting this weekend — who can actually start that fast?&quot;</li>
        <li>&quot;What is the difference between home care and home health, and which one do we need after a hip replacement?&quot;</li>
        <li>&quot;Are caregivers at [agency] employees or contractors, and are they bonded and insured?&quot;</li>
      </ul>
      <p>
        Note what these have in common: every one is a <em>filter</em>, not a keyword. Level of care. Payer.
        Timing. Condition. Employment model. An assistant answers by retrieving passages that satisfy those
        filters and then naming providers it can verify. If your site does not state a fact, you cannot be
        matched on it — and in this category the unmatched provider is simply not mentioned.
      </p>

      <h2>Why must you say whether you offer home care or home health?</h2>
      <p>
        Assistants clearly separate non-medical home care from skilled home health, so you need to say plainly which one you provide. Home care (non-medical: bathing, dressing, meals, transport, companionship) and home health (skilled
        nursing, physical therapy, ordered by a physician) are different services, differently licensed and
        differently paid for. Families conflate them constantly. Assistants do not — they are quite good at this
        distinction, because it is well documented in authoritative sources.
      </p>
      <p>
        So say plainly, near the top of your homepage and on a dedicated page, which one you are. &quot;We are a
        licensed non-medical home care agency. We do not provide skilled nursing; if your parent needs wound care
        or physical therapy at home, that is home health, and here is how the two differ.&quot; Explaining the
        thing you <em>do not</em> do is not lost business. It is the single most quotable paragraph on the site,
        because it answers the question the family actually opened with — and it gets your name attached to the
        answer.
      </p>

      <h2>Should a home care agency publish its license number?</h2>
      <p>
        Yes. Put your license or registration number and the issuing agency in readable text. Most states license or register home care agencies, and the register is public. AI systems weight
        official records heavily because they are the sort of source that resolves a conflict — this is the
        entity-corroboration mechanism described in{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">
          how AI identifies your business as an entity
        </Link>
        .
      </p>
      <p>Put these in readable text in your footer and on an About or Credentials page:</p>
      <ul>
        <li>Legal business name exactly as it appears on the state register — not the marketing name, if they differ</li>
        <li>State license or registration number, and the issuing agency by name</li>
        <li>Whether caregivers are W-2 employees (say so — families ask, and it is a real differentiator against registries)</li>
        <li>Bonding and liability insurance, and that background checks are run, with the standard you use</li>
        <li>Any accreditation you actually hold, spelled out in full the first time</li>
      </ul>
      <p>
        Two rules here. Put it in text, not inside a scanned certificate image — see{" "}
        <Link href="/blog/do-ai-engines-read-pdfs-images">whether AI engines read PDFs and images</Link>. And make
        the name on your site byte-identical to the name on the register, or you are two entities with half the
        trust each.
      </p>

      <h2>Why does a home care agency need a payer page?</h2>
      <p>
        Because &quot;Does Medicare cover this?&quot; is the first question every family asks, and an honest state-specific answer makes you the source. This is the highest-return page in the category and we almost never find it. &quot;Does Medicare cover
        this?&quot; is the question every family asks first, and the honest answer is uncomfortable: original
        Medicare generally does not pay for long-term non-medical home care. Agencies avoid saying it. So the
        assistant answers from a government page, cites that, and no provider gets named.
      </p>
      <p>
        Write the page that answers it honestly, for your state, and you become the source. Cover each payer as
        its own short section: private pay with your actual hourly range; long-term care insurance and which
        carriers you bill directly; VA benefits including Aid and Attendance if you serve veterans; your state
        Medicaid waiver by its real program name if you are an approved provider; and Medicare Advantage
        supplemental benefits, with the plans you work with. Then state plainly what is not covered.
      </p>
      <p>
        Two caveats worth respecting. Payer rules change, so date the page and review it quarterly. And do not
        drift into giving benefits advice you are not qualified to give — describe what you accept and link to the
        official program pages for eligibility. Trustworthiness here is not a tone; it is refusing to overstate.
      </p>

      <h2>Should home care agencies publish their price ranges?</h2>
      <p>
        Yes. A published range is retrievable where a consultation form is not, and it gets you named in the answers families with budget are reading. Cost is the second question and the most common silence. &quot;Contact us for a free consultation&quot;
        is not retrievable. A range is: &quot;In [county], our rates run $34–$42 per hour depending on level of
        care and schedule, with a 4-hour minimum visit. Live-in care is quoted daily, typically $[x]–$[y]. Rates
        as of August 2026.&quot;
      </p>
      <p>
        Agencies fear this. In practice, publishing a range filters out the families who were never going to
        proceed and gets you named in the answers that families with budget are reading. The mechanism is the
        same one in{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">why pricing pages affect AI recommendations</Link>: a
        number is a fact an assistant can use, and a slogan is not.
      </p>

      <h2>How should agencies answer how fast they can start?</h2>
      <p>
        Answer it explicitly with a real sentence on the site about how quickly you can staff a new case and whether you cover nights and weekends. &quot;How fast can you start?&quot; is a decisive filter in a discharge scenario and it is nearly always
        unanswered. Put a real sentence on the site: how quickly you can typically staff a new case, whether you
        cover nights and weekends, whether you take same-week starts, and how the intake assessment works and how
        long it takes. If you have a genuine 24/7 answering line staffed by a person, say that in those words.
      </p>

      <h2>Should home care pages be organized by condition or by service?</h2>
      <p>
        Families search by the condition in front of them, not by your service menu. One &quot;Our Services&quot;
        page with nine bullets is one weak document competing for nine different questions. Give each of these its
        own real page of 400–700 words: dementia and Alzheimer&apos;s care, post-hospital and post-surgical
        recovery, Parkinson&apos;s, stroke recovery, fall risk and mobility, end-of-life and hospice support at
        home, and respite care for family caregivers.
      </p>
      <p>
        Each page should say what care actually looks like day to day, what training your caregivers have for it,
        and what you do not handle. Concrete beats warm: &quot;For dementia clients we keep the same two
        caregivers on a case wherever possible, because rotation increases agitation&quot; is a sentence an
        assistant can lift. &quot;We provide compassionate memory care&quot; is not.
      </p>

      <h2>Which reviews help home care agencies most with AI?</h2>
      <p>
        Reviews from adult children after the first month that name the city, level of care, condition and how quickly you started help most. Reviews are corroboration, and in senior care they are also the closest thing to outcome evidence. Ask
        adult children after the first month, not at the end of service. Ask them to name the specifics — the
        city, the level of care, the condition, how quickly you started. A review that says &quot;they staffed
        overnight dementia care for my dad in [town] within 48 hours of discharge&quot; corroborates four claims
        on your site at once. See{" "}
        <Link href="/blog/google-reviews-ai-visibility">why Google reviews now decide your AI visibility</Link>.
      </p>
      <p>
        Do not chase volume by asking clients with cognitive impairment to write reviews, and never draft one for
        a family. In a YMYL category, a pattern of thin or suspiciously similar reviews reads as a risk signal,
        not a trust signal.
      </p>

      <h2>Where else do AI assistants look for home care agencies?</h2>
      <p>
        Beyond your own site, make sure your listing is complete and consistent on your Google Business Profile,
        the state licensing register, Medicare&apos;s Care Compare if you are also a certified home health
        provider, the major senior care directories your region actually uses, and your local Area Agency on
        Aging provider list. Identical name, address, phone and service area everywhere — the reasons are in{" "}
        <Link href="/blog/directory-listings-nap-citations-ai-search">
          directory listings, NAP citations and AI search
        </Link>
        .
      </p>

      <h2>What else do home care agency owners ask?</h2>
      <p>
        Owners usually ask whether publishing rates loses business, whether HIPAA gets in the way, whether this works for franchise locations, and how long it takes.
      </p>

      <h3>Will publishing rates lose us to cheaper competitors?</h3>
      <p>
        Sometimes, and those were price-shoppers. The larger effect is that you get named in answers where
        silence would have excluded you entirely. Publish a range with the factors that move it, not a single
        rate.
      </p>

      <h3>Can HIPAA stop us from doing any of this?</h3>
      <p>
        Nothing here requires client information. Describe services, credentials, coverage and process — never a
        specific client&apos;s situation, and get written consent before any testimonial that identifies a family.
      </p>

      <h3>We are a franchise location. Does this still work?</h3>
      <p>
        Yes, and it matters more, because your corporate site competes with you. Your location page needs your own
        license number, your own service area by town, your own rates and your own reviews. The multi-entity
        problem is covered in{" "}
        <Link href="/blog/multi-location-business-ai-visibility">multi-location business AI visibility</Link>.
      </p>

      <h3>How long before this shows up in answers?</h3>
      <p>
        Expect weeks, not days, and no honest provider can guarantee an outcome — assistants rebuild answers from
        sources that change and vary between engines. What you control is whether the facts exist to be found.
      </p>

      <h2>How do AI systems judge a home care agency?</h2>
      <p>
        Home care is judged by AI systems the way a cautious person judges it: license first, specifics second,
        corroboration third, warmth last. Publish the license number, name the level of care, state who pays,
        give a price range, say how fast you can start — and make every one of those facts match what the state
        register and your reviews already say.
      </p>
      <p>
        The key takeaway is to publish your license number, level of care, payers, price range and start time, and make every one of those facts match the state register and your reviews.
      </p>
      <p>
        <Link href="/start">Run the free AI check →</Link>
      </p>
    </div>
  )
}
