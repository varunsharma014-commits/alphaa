import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-write-content-ai-quotes",
  title: "How to Write Content AI Actually Quotes (The Passage-Level Guide)",
  description:
    "AI engines don't cite pages — they cite passages. Here's how retrieval chunking works, and the paragraph-level writing rules that make your content liftable into a ChatGPT, Perplexity or Gemini answer.",
  date: "2026-07-30",
  readMins: 11,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of small businesses and read the raw
          passages engines quote back. Last updated 30 July 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> AI engines almost never quote a whole page — they quote a{" "}
        <em>passage</em>, a few hundred words of text that was retrieved on its own and had to make sense
        without the rest of the article around it. So the unit of AEO writing is not the page, it is the
        self-contained paragraph. Write each section so that if you cut it out and handed it to a stranger with
        no title, no headline, and no surrounding context, it would still answer one specific question
        completely and name the business it is about.
      </p>

      <h2>Why passages, not pages, get cited</h2>
      <p>
        A <strong>passage</strong> (or &quot;chunk&quot;) is the slice of your page that a retrieval system
        stores and scores as one unit. Retrieval-augmented generation — the process most assistants use to
        answer with live web content — works in three steps, and each one operates below page level:
      </p>
      <ol>
        <li>
          <strong>Chunking.</strong> A page is split into segments, usually a few hundred words each, often
          along heading and paragraph boundaries.
        </li>
        <li>
          <strong>Embedding and matching.</strong> Each chunk is converted into a vector — a numeric
          representation of its meaning — and matched against a vector of the user&apos;s question. Chunks that
          are semantically close to the question are pulled.
        </li>
        <li>
          <strong>Synthesis.</strong> The model reads the handful of retrieved chunks and writes an answer,
          citing the ones it leaned on.
        </li>
      </ol>
      <p>
        The consequence is blunt: your best paragraph competes on its own. It does not inherit credibility from
        your headline, your hero section, or the paragraph three screens above it. If your explanation of
        emergency call-out fees only makes sense after reading the intro, the chunk containing it reads as
        vague and gets passed over for a competitor&apos;s chunk that stands alone.
      </p>

      <h2>What makes a passage liftable?</h2>
      <p>
        A liftable passage is one a model can quote verbatim without editing, hedging, or guessing what it
        refers to. In practice, five properties do most of the work:
      </p>
      <ul>
        <li>
          <strong>It answers one question.</strong> One question per section. Two questions in a paragraph
          halves its match score against both.
        </li>
        <li>
          <strong>It leads with the answer.</strong> The first sentence is the claim; the rest is support. A
          model that quotes only your first sentence should still have said something true and useful.
        </li>
        <li>
          <strong>It re-states its subject.</strong> Names the business, the service, and the place, rather
          than &quot;we&quot; and &quot;our team.&quot; Pronouns break when the chunk travels alone.
        </li>
        <li>
          <strong>It contains checkable specifics.</strong> Numbers, ranges, timeframes, conditions,
          qualifications — the things a model can attribute.
        </li>
        <li>
          <strong>It is bounded.</strong> Roughly 40–120 words. Long enough to be complete, short enough to be
          quoted whole.
        </li>
      </ul>

      <h2>A worked example: the same fact, written two ways</h2>
      <p>Here is a paragraph from a typical service page:</p>
      <blockquote>
        <p>
          We pride ourselves on fast response times and transparent pricing. Our experienced team is available
          around the clock, and we always aim to get to you as quickly as possible — because we know how
          stressful these situations can be.
        </p>
      </blockquote>
      <p>
        Extract that chunk and it says nothing checkable. Who is &quot;we&quot;? Where? How fast is fast? What
        price? A model asked &quot;who does emergency plumbing in Tucson at night, and what does it cost?&quot;
        has nothing to quote. Now the same facts, written to be lifted:
      </p>
      <blockquote>
        <p>
          Cardinal Plumbing is an emergency plumber serving Tucson and Oro Valley, Arizona, available 24 hours a
          day including weekends and public holidays. Overnight call-outs between 8pm and 6am carry a flat $145
          call-out fee, quoted before a technician is dispatched, with labour billed separately at an hourly
          rate agreed on the call. Typical arrival time within the Tucson city limits is 60 to 90 minutes.
        </p>
      </blockquote>
      <p>
        Same business, same truth, but the second version survives extraction. It names the entity, the
        service, the geography, the hours, the fee, the conditions, and the caveat — and every one of those is
        a term a question might match against. This is also why{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity clarity</Link> and passage writing
        reinforce each other: repeating your name and location inside the chunk is not clumsy, it is what keeps
        the chunk attributable.
      </p>
      <p>
        One caution: only write specifics you will keep current. A stale price quoted confidently by an AI
        engine is worse than no price, because a customer arrives expecting it. Put a review date on any page
        carrying numbers.
      </p>

      <h2>How to structure a page for chunking</h2>
      <p>
        Chunk boundaries usually fall on headings, so headings are how you control what gets stored together.
        The practical rules:
      </p>
      <ul>
        <li>
          <strong>Make every H2 and H3 a real question or a precise noun phrase.</strong> &quot;How much does
          an emergency call-out cost at night?&quot; retrieves. &quot;Our Promise&quot; does not.
        </li>
        <li>
          <strong>Put a definitional sentence directly under each heading.</strong> No throat-clearing, no
          &quot;in this section we&apos;ll look at.&quot; The first sentence after a heading is the sentence
          most likely to be quoted.
        </li>
        <li>
          <strong>Keep sections short and parallel.</strong> Roughly one screen each. A 900-word section under
          one heading gets split arbitrarily, and you lose control of where.
        </li>
        <li>
          <strong>Do not bury facts in tables or images alone.</strong> A table is fine, but state the key
          number in a sentence too — sentences survive chunking more reliably than layout does.
        </li>
        <li>
          <strong>Add a short FAQ block of genuine questions.</strong> A question heading with a two-to-four
          sentence answer is the single most extractable shape on the web, because it mirrors the query-answer
          pair the retriever is matching.
        </li>
      </ul>

      <h2>A 30-minute rewrite workflow you can run today</h2>
      <ol>
        <li>
          <strong>Pick one page that matters</strong> — the service or location page you would most want named
          in an AI answer.
        </li>
        <li>
          <strong>List the five questions a customer actually asks</strong> before buying. Use the wording they
          use, not your marketing wording.
        </li>
        <li>
          <strong>Turn each into an H2.</strong> If the page has no section answering one of the five, that gap
          is your highest-value edit.
        </li>
        <li>
          <strong>Rewrite the first sentence under each H2</strong> so it answers the heading outright and
          names the business and place.
        </li>
        <li>
          <strong>Run the isolation test.</strong> Copy each section into a blank document with the heading
          removed. Read it cold. If you cannot tell who it is about or what it commits to, it fails — fix it.
        </li>
        <li>
          <strong>Check it is in the HTML.</strong> None of this counts if the text is client-rendered; see{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">why AI can&apos;t read your JavaScript site</Link>{" "}
          for the one-command check.
        </li>
      </ol>
      <p>
        The isolation test is the whole method in one step. It is the closest thing to seeing your page the way
        a retriever sees it, and it costs nothing.
      </p>

      <h2>Questions people ask about writing for AI extraction</h2>
      <h3>Does this mean I should write shorter articles?</h3>
      <p>
        No — write shorter <em>sections</em>. Length at the page level is fine and often helps, because more
        sections means more chances to match a question. What hurts is one undifferentiated wall of prose,
        where no single chunk resolves cleanly.
      </p>
      <h3>Should I stuff keywords into every paragraph?</h3>
      <p>
        No. Matching is semantic, not literal — the retriever compares meaning vectors, so a naturally worded
        sentence about overnight plumbing call-outs matches a query about night-time emergency plumbers without
        containing those exact words. Repeat your <em>entity</em> (name, service, place) for attribution;
        do not repeat keywords for their own sake.
      </p>
      <h3>Is this different from writing for Google?</h3>
      <p>
        It overlaps heavily but is not identical. Google has ranked passages for years, so the work compounds.
        The difference is the failure mode: a weak page can still rank on domain strength and get a click,
        whereas a weak passage simply is not quoted, and there is no second chance further down the answer. For
        the broader contrast see{" "}
        <Link href="/blog/aeo-vs-seo-why-agencies-fail">AEO vs SEO and why old-school agencies fall short</Link>
        .
      </p>
      <h3>Will good passages guarantee I get cited?</h3>
      <p>
        No, and be wary of anyone who says otherwise. Extractable writing makes you eligible and raises the
        odds; whether you are chosen also depends on third-party evidence, reviews, competing sources, and the
        model&apos;s own variation between runs — see{" "}
        <Link href="/blog/why-ai-answers-change-every-time">why AI answers change every time</Link>. Passage
        writing is the part of the system you fully control, which is exactly why it is worth doing first.
      </p>

      <h2>The bottom line</h2>
      <p>
        Stop optimising pages and start optimising paragraphs. Every section should answer one question, lead
        with the answer, name the business and place, carry a specific you will keep accurate, and stand up
        when read in isolation. That is not a trick for machines — it is also how a hurried human reads. The
        rewrite costs an afternoon per page and it is the highest-leverage AEO work most businesses have not
        done.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
