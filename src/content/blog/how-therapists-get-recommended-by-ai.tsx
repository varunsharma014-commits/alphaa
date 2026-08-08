import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-therapists-get-recommended-by-ai",
  title: "How Therapists and Mental Health Practices Get Recommended by AI",
  description:
    "AI assistants answer \"find me a therapist\" mostly from directory profiles, insurance and licence records — rarely from a practice website. Here is how therapists become the named recommendation without review-farming, false claims, or crossing an ethics line.",
  date: "2026-08-08",
  readMins: 11,
  tag: "Playbook",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses, including licensed
          clinical practices. This is marketing guidance, not legal, clinical or ethics advice; check anything
          below against your licensing board&apos;s advertising rules and your professional code before
          publishing. Last updated 8 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Therapists get recommended by AI when a <em>specific and verifiable</em>
        description of who they treat, how, and under what payment terms exists across the sources assistants
        actually retrieve — directory profiles, licence registries, insurance provider lists, specialist
        associations — and matches what is on their own site. The counterintuitive part is that the practice
        website is usually the <em>least</em> influential of those sources. And unlike most industries, the
        highest-leverage work here is almost entirely ethics-safe: it is factual precision, not persuasion.
      </p>

      <h2>What people actually ask</h2>
      <p>
        Nobody types &quot;therapist&quot; into ChatGPT. Every real query we see carries three or four
        constraints stacked together, because that is how someone in distress narrows a decision:
      </p>
      <ul>
        <li>&quot;EMDR therapist in Portland who takes Aetna and does evening sessions&quot;</li>
        <li>&quot;affirming couples counsellor near me, sliding scale&quot;</li>
        <li>&quot;child psychologist who assesses ADHD, Spanish-speaking, accepting new patients&quot;</li>
        <li>&quot;online therapy licensed in both Texas and New Mexico&quot;</li>
      </ul>
      <p>
        Read those again as a machine would. Each one is a filter set: modality, population, location or licence
        jurisdiction, payment, language, availability. An assistant can only name you if it can verify enough of
        those filters from retrievable text. A page that says &quot;compassionate, client-centred care in a
        warm, non-judgemental space&quot; matches none of them. That sentence appears on tens of thousands of
        practice sites, and it is why so many perfectly good clinicians are invisible to AI search.
      </p>

      <h2>Where the answer actually comes from</h2>
      <p>
        When an assistant answers a therapist query, it retrieves live documents and synthesizes from what they
        say. In this category the retrievable set is unusually directory-heavy, roughly in this order of
        influence:
      </p>
      <ul>
        <li>
          <strong>Clinical directories.</strong> Psychology Today, Inclusive Therapists, TherapyDen, Zencare,
          Open Path and their regional equivalents. These are structured, densely filterable, heavily crawled,
          and they publish exactly the fields the question asks about. This is where most named recommendations
          come from.
        </li>
        <li>
          <strong>Licence and registry records.</strong> State board look-ups and national registries establish
          that you exist, in what discipline, in which jurisdictions, in good standing. This is the entity
          backbone — it is what lets a model treat &quot;Dr. Rivera, LCSW&quot; as a real, resolvable
          professional rather than a name on a website.
        </li>
        <li>
          <strong>Insurance provider directories.</strong> Payer-side listings resolve the single most decisive
          filter in the query. If your panel participation is not listed accurately, you lose every
          insurance-qualified question by default.
        </li>
        <li>
          <strong>Association and training rosters.</strong> Modality-specific bodies — EMDR certification
          registries, gottman referral lists, ABCT or BACP-type directories depending on your country. These are
          how a model verifies a modality claim rather than just repeating it.
        </li>
        <li>
          <strong>Your own site.</strong> Real, but mostly as the confirming source. It corroborates the
          directory picture and supplies detail; it rarely originates the recommendation.
        </li>
      </ul>
      <p>
        This is the same multi-source consensus mechanism that governs every category — assistants trust facts
        that several independent sources state the same way. Our{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity guide</Link> covers how that
        resolution works in general.
      </p>

      <h2>The five fixes, in order of leverage</h2>

      <h3>1. Make one canonical fact set, then propagate it</h3>
      <p>
        Write down, once: legal practice name, clinician name with credentials exactly as licensed, licence type
        and number per state, address (or &quot;telehealth only, licensed in X and Y&quot;), phone, modalities,
        populations, languages, insurance panels, session fee or range, and current intake status. Then make
        every directory profile, your Google Business Profile, and your website agree word-for-word on the
        checkable fields. Fragmentation — three name spellings, two phone numbers, one stale address — is the
        most common reason a model hedges instead of naming you. Fixing it is unglamorous and it is the single
        highest-return hour in this list.
      </p>

      <h3>2. Fill every structured directory field, especially the unloved ones</h3>
      <p>
        Most clinicians complete the narrative bio and skip the checkbox fields — session length, sliding-scale
        availability, telehealth platform, accessibility, evening or weekend hours, accepting-new-clients
        status. Those checkboxes are precisely the structured data a retrieval step can match against a
        constrained query. A complete profile with a mediocre bio outperforms a beautiful bio with half the
        fields blank, every time.
      </p>

      <h3>3. Write one specific page per modality and population</h3>
      <p>
        Replace the single &quot;Services&quot; page with pages that answer a real question: what EMDR sessions
        involve and who they suit, what a perinatal-mood intake looks like, how ADHD assessment works for adults
        and what it costs. Lead each with a short definitional paragraph a model can lift verbatim — this is the
        core of writing{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">content AI engines actually quote</Link>. Say plainly
        who the approach is <em>not</em> right for; scope-limiting language reads as expertise to a human and as
        precision to a machine.
      </p>

      <h3>4. Publish fees and access terms as plain text</h3>
      <p>
        &quot;$180 per 50-minute individual session; sliding scale from $95 for six concurrent slots, currently
        two available; in-network with Aetna and Cigna; superbills provided for out-of-network&quot; answers
        several filters at once and is the kind of sentence assistants quote. Buried, image-based or
        omitted fee information hands the answer to whoever published theirs — the same dynamic we cover in{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">how pricing pages shape AI recommendations</Link>.
      </p>

      <h3>5. Keep intake status current</h3>
      <p>
        &quot;Accepting new clients&quot; is a freshness signal with an unusually short half-life, and it is
        weighted heavily because the query almost always implies availability. Stale &quot;accepting&quot; flags
        waste referrals and erode the accuracy that earns you the next one. Update directory status monthly, and
        date-stamp the waitlist line on your site.
      </p>

      <h2>What not to do</h2>
      <p>
        This category has real ethical and legal constraints, and the AEO advice that ignores them is dangerous.
        Do not solicit or incentivise client reviews — most codes of ethics restrict testimonials from current
        or recent clients precisely because of the power imbalance, and no visibility gain is worth a board
        complaint. Do not claim a modality you are not trained in; the certification registries that verify
        modality claims are the same ones a model checks. Do not imply guaranteed outcomes, and do not publish
        anything that could identify a client, including composite case studies detailed enough to be recognised.
        Do not let a marketing vendor put condition-treatment claims on your site that your licence or local
        advertising rules would not support.
      </p>

      <h2>Common questions</h2>

      <h3>Does my practice website matter at all?</h3>
      <p>
        Yes — as corroboration and depth. It is where a model verifies that the directory claims hold up and
        finds the specifics no directory field captures. It is simply not usually the source that produces the
        first recommendation.
      </p>

      <h3>I am telehealth-only across several states. How should that be handled?</h3>
      <p>
        State it explicitly and per-jurisdiction: &quot;licensed in Texas (LPC #XXXXX) and New Mexico (LPCC
        #XXXXX); telehealth only.&quot; Cross-state licence questions are frequent and models answer them
        conservatively — vague geography usually means exclusion rather than a guess in your favour.
      </p>

      <h3>How long before this shows up in answers?</h3>
      <p>
        Directory and profile corrections can surface within days because those pages are re-retrieved live;
        content and third-party signals build over weeks to months. Results vary by engine, by phrasing and over
        time, and no one can guarantee you a place in any assistant&apos;s answer — see{" "}
        <Link href="/blog/is-aeo-real">is AEO real</Link> for the honest limits.
      </p>

      <h2>The bottom line</h2>
      <p>
        Therapists lose AI recommendations to vagueness, not to competition. Say which modalities you practise,
        which populations you serve, where you are licensed, what you charge, whether you are open — then make
        every public record agree. That is the same information a person in a difficult week needs in order to
        pick up the phone. Writing it down clearly serves both readers at once.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
