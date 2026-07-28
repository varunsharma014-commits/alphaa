import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "why-ai-answers-change-every-time",
  title: "Why ChatGPT Gives a Different Answer Every Time (And How to Measure AI Visibility Anyway)",
  description:
    "AI assistants are non-deterministic and re-retrieve the web on every question, so the same prompt can name your business once and skip you the next time. Here is why that happens, and the sampling protocol we use to turn a moving target into a number you can actually track.",
  date: "2026-07-28",
  readMins: 10,
  tag: "Measurement",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        By the alphaa team — we run AI-visibility scans across thousands of businesses, and the question we get
        asked most is why yesterday&apos;s result did not reproduce today.
      </p>
      <p>
        <strong>Short answer:</strong> AI assistants give different answers to the same question because they are
        non-deterministic by design — they sample their next word from a probability distribution — and because
        most of them re-run a live web search on every question, so the source documents themselves change between
        asks. The fix is not to chase a stable answer. It is to stop treating a single screenshot as data and start
        measuring a <strong>mention rate</strong>: how often you appear across a fixed set of prompts, repeated
        several times, on a fixed schedule.
      </p>

      <h2>Why does ChatGPT give different answers to the same question?</h2>
      <p>
        Four independent sources of variance stack on top of each other. Understanding which one is moving matters,
        because only some of them are things you can influence.
      </p>
      <ul>
        <li>
          <strong>Sampling.</strong> A language model does not pick the single most likely next token every time. It
          samples from a distribution, which is what makes the writing feel natural rather than robotic. Two runs of
          an identical prompt can diverge at the first sentence and never reconverge. If three plumbers are roughly
          tied in the model&apos;s evidence, which one gets named first is close to a coin flip.
        </li>
        <li>
          <strong>Live retrieval.</strong> ChatGPT, Perplexity, Gemini and Claude answer many business questions by
          running a search first and reading the results — retrieval-augmented generation. The search index moves
          hourly. A new Reddit thread, a re-crawled directory page, or a competitor publishing a &quot;best X in
          your city&quot; roundup changes the document set the model reads, and therefore the answer.
        </li>
        <li>
          <strong>Session context.</strong> Memory, custom instructions, earlier turns in the same chat, and coarse
          location signals all condition the response. Asking &quot;who else?&quot; after a first answer produces a
          deliberately different list — that is the assistant working correctly, not a visibility change.
        </li>
        <li>
          <strong>Model and routing changes.</strong> Providers ship new model versions and silently route queries
          between fast and slow variants. A step change in your results that lands on the same day across several
          prompts is usually a provider change, not something you did.
        </li>
      </ul>
      <p>
        Only the second one — the evidence available to retrieve — is what{" "}
        <Link href="/blog/is-aeo-real">answer engine optimization</Link> actually works on. The other three are
        noise you have to measure through.
      </p>

      <h2>Why a single screenshot is not a measurement</h2>
      <p>
        Suppose your business genuinely gets named in 40% of answers to &quot;best emergency plumber in
        Sacramento.&quot; Ask once and you have a 40% chance of seeing yourself and a 60% chance of concluding you
        are invisible. Ask once next month, see yourself, and conclude your AEO worked. Neither conclusion is
        supported — you have drawn two samples from a coin and declared a trend.
      </p>
      <p>
        This is also how vendors produce misleading proof in both directions. A screenshot showing a business named
        in ChatGPT is a real event; it is not evidence of a stable position. Treat any &quot;we got you ranked #1 in
        ChatGPT&quot; claim backed by one screenshot as unmeasured.
      </p>

      <h2>The protocol we use to measure it</h2>
      <p>
        This is the same shape as the scan we run, and you can execute it by hand in about 30 minutes. It replaces
        an anecdote with a rate.
      </p>
      <ol>
        <li>
          <strong>Fix a prompt set of 5–10 buyer-intent questions</strong> and never edit it once measurement starts.
          Changing the wording resets your baseline. Write them the way a customer would type them, not the way a
          marketer would: &quot;who is the best orthodontist for adults in Round Rock,&quot; &quot;emergency AC
          repair near me open Sunday,&quot; &quot;affordable estate planning attorney Boise.&quot;
        </li>
        <li>
          <strong>Neutralize the session.</strong> Use a temporary or logged-out chat, memory off, no custom
          instructions, fresh conversation per prompt. Otherwise you are measuring your own history with the
          assistant, and you are the least representative user of your own business.
        </li>
        <li>
          <strong>Run each prompt five times per engine.</strong> Five is the smallest sample that distinguishes
          &quot;usually&quot; from &quot;occasionally.&quot; Cover the engines your customers actually use — ChatGPT,
          Google&apos;s AI answers, Perplexity, Claude, Copilot.
        </li>
        <li>
          <strong>Record three fields per run:</strong> appeared (yes/no), rough position in the list if named, and
          the exact snippet describing you. The snippet is the most valuable column and the one everyone skips —
          it tells you which source the model is reading from and whether the description is even accurate.
        </li>
        <li>
          <strong>Compute mention rate per engine:</strong> appearances divided by runs. Fifty runs total gives you
          a number like &quot;named in 12 of 25 ChatGPT runs, 3 of 25 Perplexity runs.&quot;
        </li>
        <li>
          <strong>Repeat monthly, same prompts, same conditions.</strong> Movement across a month of identical
          prompts is signal. Movement within an afternoon is sampling.
        </li>
      </ol>

      <h3>What the snippet column tells you</h3>
      <p>
        When we read snippets across a batch, the failure modes are consistent and specific. A business gets
        described with a service it dropped two years ago — the model is reading a stale directory listing. A
        business gets named but placed in the wrong city — the entity has fragmented across inconsistent addresses.
        A business is described almost entirely in the words of one review site — that site is the only third-party
        source with anything substantive to say. Each of those is a concrete fix, and none of them is visible from
        a yes/no appearance count.
      </p>

      <h2>How much movement is real?</h2>
      <p>
        Be honest about the statistics. With 5 runs per engine, only large swings mean anything — going from 0/5 to
        4/5 is real; 2/5 to 3/5 is not. If you want to make a confident claim about a small improvement, you need
        more runs, not more conviction. We would rather tell a customer &quot;this is within noise, ask again next
        month&quot; than sell them a decimal point.
      </p>
      <p>
        Also expect asymmetry between engines. It is normal to be named consistently by one assistant and never by
        another, because they retrieve from different indexes and weight sources differently. Track each engine
        separately; a blended &quot;AI visibility score&quot; that hides which engine moved is less useful than four
        honest columns.
      </p>

      <h2>Questions people ask us about this</h2>
      <p>
        <strong>Can I make the answer deterministic?</strong> No. You cannot set the temperature of a consumer
        assistant, and you should not want to — you are trying to influence what the average customer sees, and the
        average customer gets a sampled answer.
      </p>
      <p>
        <strong>Does asking repeatedly train the model to mention me?</strong> No. Your questions do not update the
        model&apos;s weights, and they do not add you to a retrieval index. Repeated asking measures; it does not
        move the number.
      </p>
      <p>
        <strong>Why do I see my business but my customer does not?</strong> Memory, prior chats, and location.
        Your account has told the assistant a great deal about your business. Always verify from a clean session.
      </p>
      <p>
        <strong>How long until a change shows up in the rate?</strong> Longer than most people expect — the
        constraint is re-crawl and re-index time on the sources, not your publishing speed. We walk through the
        realistic timeline in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes to work</Link>.
      </p>

      <h2>The limits of this method</h2>
      <p>
        A mention rate measures what assistants say, not what it earns you. It cannot tell you how many people asked
        that question, and no public dataset does either — the assistants do not publish query volume the way Search
        Console does. It also misses the majority of AI influence that never becomes a click: roughly two-thirds of
        Google searches now end without a single click to a website (SparkToro/Similarweb, 2026), and an answer a
        customer reads and acts on leaves no trace in your analytics. Mention rate is the best available proxy, and
        it is still a proxy. Anyone quoting you an exact revenue figure from AI answers is guessing.
      </p>

      <h2>The bottom line</h2>
      <p>
        The variance is not a bug you can engineer away, and it is not evidence that AI visibility is unmeasurable.
        It just means the unit of measurement is a rate over repeated samples, not a screenshot. Fix your prompts,
        neutralize your session, run five times, log the snippet, repeat monthly. If you want to see what the
        assistants say about you right now, the manual version is in{" "}
        <Link href="/blog/how-to-see-what-chatgpt-says-about-your-business">
          how to see what ChatGPT says about your business
        </Link>
        .
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
