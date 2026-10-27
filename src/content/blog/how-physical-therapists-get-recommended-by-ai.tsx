import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-physical-therapists-get-recommended-by-ai",
  title: "How Physical Therapists Get Recommended by AI",
  description:
    "Patients now ask ChatGPT which physical therapist treats their injury and takes their insurance. What decides who gets named, and a 30-day plan for clinics.",
  subtitle:
    "Physical therapy clinics get recommended by AI when conditions treated, specialties, insurance, direct-access rules and therapist credentials are stated plainly and match what reviews and listings say.",
  date: "2026-10-27",
  updated: "2026-10-27",
  readMins: 6,
  tag: "Playbook",
  kind: "industry",
  keyphrase: "how physical therapists get recommended by ai",
  image: {
    src: "/blog/how-physical-therapists-get-recommended-by-ai.webp",
    alt: "An empty, bright physical therapy room with a padded treatment table, resistance bands hanging on the wall and a foam roller by a large window.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Patients ask AI assistants for physical therapy with a constraint attached: an injury, a specialty, an insurer, a schedule or a referral question.",
    "APTA says all 50 states, DC and the US Virgin Islands allowed provisional or unrestricted direct access to physical therapists as of July 2025.",
    "Clinics should state their state's direct-access rules in plain words, because patients ask AI whether they need a referral.",
    "Google lets individual practitioners have their own Business Profile, separate from the clinic's.",
    "Schema.org has a Physiotherapy type under MedicalBusiness and LocalBusiness that a clinic can use in its structured data.",
  ],
  sources: [
    { title: "Direct Access Advocacy | APTA", publisher: "American Physical Therapy Association", url: "https://www.apta.org/advocacy/issues/direct-access-advocacy" },
    { title: "APTA Find a PT | Choose PT", publisher: "American Physical Therapy Association", url: "https://www.choosept.com/find-a-pt" },
    { title: "Guidelines for representing your business on Google - Google Business Profile Help", publisher: "Google Help", url: "https://support.google.com/business/answer/3038177" },
    { title: "Physiotherapy - Schema.org Enumeration Member", publisher: "Schema.org", url: "https://schema.org/Physiotherapy" },
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team. We build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about
          local businesses. Last updated 27 October 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Physical therapists get recommended by AI when the assistant can read and
        verify the specifics a patient asks about: conditions treated, specialties such as pelvic floor or vestibular
        rehab, insurance accepted, whether a referral is needed, and therapist credentials. Put those in plain text on
        your site and Google Business Profile, and earn reviews that mention them.
      </p>

      <p>
        This playbook is for owners and managers of outpatient physical therapy clinics, from single-therapist
        practices to small groups. It covers what patients ask, which facts decide the answer, how reviews and
        structured data help, and what to do in the first 30 days.
      </p>

      <h2>What do patients ask AI about physical therapists?</h2>
      <p>
        Patients ask with a constraint attached: an injury or condition, a specialty, an insurer, a schedule or a
        question about referrals. Very few type &quot;best physical therapist&quot;. Typical questions look like this:
      </p>
      <ul>
        <li>&quot;Physical therapist near me for ACL rehab after surgery that takes Blue Cross.&quot;</li>
        <li>&quot;Do I need a doctor&apos;s referral to see a physical therapist in Ohio?&quot;</li>
        <li>&quot;Pelvic floor physical therapy for postpartum, women therapist, evening appointments.&quot;</li>
        <li>&quot;PT for vertigo and dizziness, vestibular specialist, close to downtown.&quot;</li>
        <li>&quot;Sports physical therapist for a runner with IT band pain, cash price per session.&quot;</li>
      </ul>
      <p>
        Each constraint is a filter. If your site never says you treat vestibular disorders, accept that insurer or
        see patients after 5pm, the assistant has nothing to match and will name the clinic that does say so. AI
        assistants also rewrite these questions into shorter searches before they look anything up, which is
        explained in <Link href="/blog/what-is-query-fan-out">what query fan-out is</Link>.
      </p>

      <h2>Which facts decide whether AI recommends a physical therapy clinic?</h2>
      <p>
        Six facts do most of the work: conditions treated, specialties, insurance and payment, referral and direct
        access, practical access details, and therapist credentials. Each should be written as plain text that an
        engine can quote.
      </p>
      <ol>
        <li>
          <strong>Conditions treated, by name.</strong> List the injuries and conditions you see most: post-surgical
          knee and shoulder rehab, low back pain, sciatica, rotator cuff injuries, ankle sprains, concussion, vertigo,
          pelvic pain. A page per major condition, or a clear list on one services page, beats a generic &quot;we
          treat a wide range of conditions&quot;.
        </li>
        <li>
          <strong>Specialties and populations.</strong> Say plainly if you offer pelvic floor, vestibular, sports,
          pediatric, neurological, aquatic or geriatric therapy, and who on the team provides it.
        </li>
        <li>
          <strong>Insurance and payment.</strong> Name the insurers you are in network with, whether you see Medicare
          or workers&apos; compensation patients, and your self-pay price for an evaluation and a follow-up session if
          you publish one. &quot;Most major insurance accepted&quot; gives an engine nothing to match.
        </li>
        <li>
          <strong>Referral and direct access.</strong> State whether a patient can book without a doctor&apos;s
          referral in your state, and any limits. This is one of the most common questions patients ask, and the next
          section explains why the answer needs care.
        </li>
        <li>
          <strong>Access details.</strong> Hours including early and evening slots, typical wait for a first
          appointment, session length, parking, accessibility, telehealth and home visits.
        </li>
        <li>
          <strong>Credentials as checkable facts.</strong> Each therapist&apos;s degree, licence, any board
          certification as a clinical specialist and areas of focus, written as facts rather than adjectives.
        </li>
      </ol>

      <h2>Do patients need a referral to see a physical therapist?</h2>
      <p>
        In every US state a patient can see a physical therapist without a referral in at least some circumstances,
        but the conditions vary by state. The{" "}
        <a href="https://www.apta.org/advocacy/issues/direct-access-advocacy" {...ext}>
          American Physical Therapy Association
        </a>{" "}
        says that as of July 1, 2025, all 50 states, the District of Columbia and the US Virgin Islands have either
        provisional or unrestricted direct access to physical therapists for evaluation and treatment.
      </p>
      <p>
        &quot;Provisional&quot; is the word that matters. In some states direct access comes with limits, such as a
        cap on visits or days before a referral is needed, and insurers can set their own referral rules regardless of
        state law. So the best page answers for your state and your payers specifically: &quot;In [state] you can book
        an evaluation without a referral. After [the state&apos;s limit], we will need one from your doctor. Some
        insurance plans require a referral regardless; call us and we will check yours.&quot; Check your state
        practice act or your state chapter for the exact rule before you publish it. A clear, correct answer here is
        precisely the kind of passage AI assistants quote, and a wrong one can send patients elsewhere.
      </p>

      <h2>How do reviews affect AI recommendations for physical therapists?</h2>
      <p>
        Reviews help most when they describe the condition, the specialty, the therapist and the outcome in the
        patient&apos;s own words, because that text is what engines match to a specific question. &quot;Great
        staff&quot; confirms you exist; &quot;Sarah got me running again eight weeks after my ACL surgery, and they
        handled my Aetna paperwork&quot; answers three filters at once.
      </p>
      <p>
        You cannot write reviews for patients, but you can make specific ones more likely. Ask at discharge, when the
        result is fresh, and suggest that patients mention what brought them in and what changed, if they are
        comfortable sharing. Spread requests across therapists and specialties so your pelvic floor and vestibular work
        shows up in reviews, not only your sports rehab. Reply to reviews too, but health privacy rules apply: thank
        the reviewer without confirming they are a patient or discussing their care, and check your approach with your
        compliance adviser. More on how review text feeds AI answers is in{" "}
        <Link href="/blog/google-reviews-ai-visibility">why Google reviews now decide your AI visibility</Link>.
      </p>

      <h2>Should individual physical therapists have their own Google Business Profiles?</h2>
      <p>
        They can, and for therapists with a distinct specialty it is often worth it. Google&apos;s{" "}
        <a href="https://support.google.com/business/answer/3038177" {...ext}>
          Business Profile guidelines
        </a>{" "}
        say individual practitioners, such as doctors, may have separate pages from the business they work in, under
        specific practitioner rules.
      </p>
      <p>
        A practitioner profile for your pelvic floor specialist, for example, gives Google and the assistants that use
        its data a second, specific entity to match to &quot;pelvic floor physical therapist near me&quot;. Keep the
        clinic profile as the main listing, choose the most specific category that applies, and make sure name,
        address, phone and hours match your website exactly. Google also says not to use categories as keywords. The
        clinic profile itself deserves attention; see{" "}
        <Link href="/blog/google-business-profile-ai-answers">how your Google Business Profile shapes AI answers</Link>.
      </p>
      <p>
        Directories matter as well. The APTA&apos;s{" "}
        <a href="https://www.choosept.com/find-a-pt" {...ext}>
          Find a PT
        </a>{" "}
        directory lets patients search by focus area, treatment and condition, and filter for board-certified
        specialists. Being listed there accurately adds an authoritative, independent source that agrees with your
        site.
      </p>

      <h2>What structured data should a physical therapy clinic add?</h2>
      <p>
        Use LocalBusiness structured data with the Physiotherapy type, which schema.org defines under MedicalBusiness
        and LocalBusiness. The{" "}
        <a href="https://schema.org/Physiotherapy" {...ext}>
          schema.org Physiotherapy page
        </a>{" "}
        shows that hierarchy and describes the practice as treating disease, injury or deformity by physical methods
        such as massage, heat treatment and exercise.
      </p>
      <p>The fields that matter most for AI answers are:</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>What to put in it</th>
              <th>Why it helps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>name, address, telephone</td>
              <td>Exactly as on your Business Profile</td>
              <td>Lets engines join your site to your listing</td>
            </tr>
            <tr>
              <td>openingHoursSpecification</td>
              <td>Real hours, including early and late days</td>
              <td>Answers &quot;evening appointments&quot; questions</td>
            </tr>
            <tr>
              <td>areaServed</td>
              <td>Your city and nearby neighbourhoods</td>
              <td>Matches location-based queries</td>
            </tr>
            <tr>
              <td>employee or founder</td>
              <td>Therapists by name with their credentials</td>
              <td>Connects people to the clinic</td>
            </tr>
            <tr>
              <td>sameAs</td>
              <td>Your Business Profile, Find a PT and other listings</td>
              <td>Confirms all of them are one entity</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Markup must match what is visible on the page; it supports the text rather than replacing it. Google says its
        AI features draw on indexed pages and need no special markup, according to its{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features documentation
        </a>
        , so the plain-text facts above come first. The technical detail is in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>.
      </p>

      <h2>Can overclaiming hurt a physical therapist&apos;s AI visibility?</h2>
      <p>
        Yes. Health content is held to a higher standard, and pages that promise outcomes give engines a reason to
        prefer a more careful source. &quot;Pain-free in three visits&quot; or &quot;avoid surgery guaranteed&quot;
        are claims an assistant cannot verify and may not want to repeat.
      </p>
      <p>
        Write what you do and for whom, not what will happen. &quot;We treat post-surgical knee patients with a
        structured return-to-sport program; sessions are 45 minutes with the same therapist each visit&quot; is
        specific, checkable and quotable. If you cite research on a treatment, link the study. This is the same
        principle that applies to chiropractors, covered in{" "}
        <Link href="/blog/how-chiropractors-get-recommended-by-ai">how chiropractors get recommended by AI</Link>.
      </p>

      <h2>What should a physical therapy clinic do in its first 30 days?</h2>
      <p>
        Start by checking what the assistants say today, then fix the facts in the order patients ask about them. A
        workable 30-day plan:
      </p>
      <ol>
        <li>
          <strong>Week 1: Check.</strong> Ask ChatGPT, Gemini, Claude and Perplexity five questions a real patient
          would ask, with your city in each. Note who they name and whether anything they say about you is wrong. The{" "}
          <Link href="/start">free 60-second AI check</Link> does this across all four.
        </li>
        <li>
          <strong>Week 1: Fix the listing.</strong> Update your Business Profile hours, categories, services and
          insurance details, and make name, address and phone identical everywhere.
        </li>
        <li>
          <strong>Week 2: Write the facts down.</strong> Publish or rewrite your services page with conditions,
          specialties, insurers, self-pay prices if you publish them, and the direct-access answer for your state.
        </li>
        <li>
          <strong>Week 3: Add structured data and therapist bios.</strong> Physiotherapy markup, plus a short bio for
          each therapist with credentials and focus areas.
        </li>
        <li>
          <strong>Week 4: Start the review habit.</strong> Ask discharged patients for a review, and check your
          listings on Find a PT and other directories match your site.
        </li>
      </ol>
      <p>
        If an assistant states something wrong, such as an old address or an insurer you dropped, fix the source it
        is likely reading first; see{" "}
        <Link href="/blog/fix-wrong-ai-information-about-your-business">how to fix wrong AI information about your business</Link>.
        Clinics with several sites should also read{" "}
        <Link href="/blog/multi-location-business-ai-visibility">AI visibility for multi-location businesses</Link>.
        None of this guarantees a recommendation, because the assistants decide what to say, but it gives them clear,
        consistent facts to work with.
      </p>

      <h2>What else do physical therapists ask about AI recommendations?</h2>

      <h3>Will blogging about injuries get my clinic recommended?</h3>
      <p>
        Only if the posts answer the specific questions your patients ask and connect back to the services you offer.
        A clear condition page with who you treat, how, and how to book usually does more than generic injury
        articles.
      </p>

      <h3>Does it matter which insurance companies I list?</h3>
      <p>
        Yes, because insurance is one of the most common filters patients add to their questions. Name each insurer
        you are in network with, in words on a page that engines can read, and keep the list current.
      </p>

      <h3>Should each therapist have a bio page?</h3>
      <p>
        Yes, a short page per therapist with credentials, specialties and the conditions they focus on helps both
        patients and engines. It also gives patients a name to mention in reviews, which links the specialty to your
        clinic.
      </p>

      <h3>Do cash-pay prices help with AI recommendations?</h3>
      <p>
        Published prices help with price-specific questions, because an engine can only quote a number it can find.
        If you publish one, keep it current and say what it covers, such as an evaluation or a 45-minute follow-up.
      </p>

      <h3>How long does it take for AI assistants to notice changes?</h3>
      <p>
        There is no fixed timeline. Assistants that search the web can pick up a change once the page is crawled and
        indexed, while answers based on training data change only when the model is updated.
      </p>
    </div>
  )
}
