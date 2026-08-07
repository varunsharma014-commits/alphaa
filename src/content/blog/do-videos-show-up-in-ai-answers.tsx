import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "do-videos-show-up-in-ai-answers",
  title: "Do YouTube Videos Show Up in AI Answers? What Engines Actually Read",
  description:
    "AI assistants can and do cite video — but almost never by watching it. They read the text attached to it: the title, the description, the transcript and the pages that quote it. Here is what each engine does, and how to make a video citable.",
  date: "2026-08-07",
  readMins: 10,
  tag: "Mechanism",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and watch which URLs the
          engines actually cite. Last updated 7 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes, YouTube videos show up in AI answers — but the engine is almost never
        watching your video. It is reading the <em>text attached to it</em>: the title, the description, the
        captions or transcript, the chapter markers, and any page that embeds or writes about the video. A video
        with an auto-generated transcript full of &quot;um, so basically&quot; is close to invisible. A video with
        a question-shaped title, a real transcript, and a written companion page on your own site is a citable
        source.
      </p>

      <p>
        That single distinction — <strong>pixels versus text</strong> — explains almost every result you will see,
        and it is the reason most business video does nothing for AI visibility.
      </p>

      <h2>Why AI engines read video instead of watching it</h2>
      <p>
        Retrieval is a text operation. When an assistant answers a question, it runs a search, pulls back a set of
        documents, and reads them. A YouTube URL in that result set is a <em>web page</em> — one with a title, a
        description field, structured metadata, and, if captions exist, a transcript the page exposes. That text is
        what enters the model&apos;s context window. The video file itself is a stream of frames and audio the
        retrieval layer does not process at answer time.
      </p>
      <p>
        There is a real exception, and it matters: multimodal models <em>can</em> process video directly when a
        video is handed to them explicitly. Google&apos;s Gemini will analyse a YouTube link you paste into the
        chat, because Google owns both the model and the platform. But that is a user pasting one URL into one
        conversation. It is not what happens when a stranger asks &quot;how do I stop my dishwasher leaking&quot;
        and the assistant assembles an answer from a live search. In that path — the one that actually brings you
        customers — your video is judged on its text.
      </p>

      <h3>What each engine does with video, honestly</h3>
      <ul>
        <li>
          <strong>Google AI Overviews / Gemini.</strong> Strongest video handling, unsurprisingly. YouTube results
          surface in Overviews for how-to and demonstration queries, and Gemini can process a pasted YouTube URL
          directly.
        </li>
        <li>
          <strong>Perplexity.</strong> Cites YouTube pages as sources and will often show them in a separate video
          section alongside its written answer. It is reading the page, not the footage.
        </li>
        <li>
          <strong>ChatGPT with browsing.</strong> Can fetch a YouTube page and use its title, description and
          visible transcript. In our scans it cites written pages far more often than video pages for local and
          commercial questions.
        </li>
        <li>
          <strong>Claude.</strong> Retrieves and cites web pages; a YouTube page is treated like any other document
          and is only as useful as the text on it.
        </li>
      </ul>
      <p>
        Two caveats worth stating plainly. Engine behaviour changes without notice, so treat any list like this as a
        snapshot rather than a rule. And video is disproportionately cited for <em>procedural</em> questions —
        repairs, demonstrations, walkthroughs — and much less for &quot;who is the best X near me&quot;. If you sell
        a service where the buying question is a recommendation question, video is a supporting signal, not the main
        event.
      </p>

      <h2>The transcript is the asset</h2>
      <p>
        If you take one thing from this article: <strong>the transcript is the thing that gets cited, not the
        video.</strong> Everything else follows from that.
      </p>
      <p>
        YouTube auto-captions most uploads, so a transcript usually exists. The problem is quality. Auto-captions
        have no punctuation, mangle proper nouns and product names, and faithfully record every filler word. Now
        picture the retrieval step: the engine is looking for a clean, quotable sentence that answers the question.
        An unpunctuated wall of &quot;so what youre gonna wanna do here is&quot; contains no such sentence. Your
        business name, transcribed as three different misspellings, teaches the engine nothing about your entity.
      </p>
      <p>
        Uploading your own corrected caption file fixes both problems at once, and it is a fifteen-minute job per
        video. Download the auto-generated track, fix the punctuation, correct every proper noun, and re-upload it.
      </p>

      <h2>The workflow we use, step by step</h2>
      <p>Here is the actual sequence, in the order it matters.</p>
      <ol>
        <li>
          <strong>Title the video as the question, not the topic.</strong> &quot;Why Your Water Heater Makes a
          Banging Noise&quot; is retrievable. &quot;Water Heater Tips | Acme Plumbing Ep. 12&quot; is not. Match the
          phrasing a person would actually type or say.
        </li>
        <li>
          <strong>Answer in the first thirty seconds, in words.</strong> Say the answer out loud, early, in a
          complete sentence — because that sentence lands at the top of the transcript, which is the part most
          likely to be read and lifted. Save the build-up for content where suspense pays.
        </li>
        <li>
          <strong>Upload a corrected transcript.</strong> As above. Non-negotiable if you want the video treated as
          a text source.
        </li>
        <li>
          <strong>Write the description as a short article, not a link dump.</strong> Two or three real paragraphs
          that answer the question in text, followed by your links. Most businesses waste this field on
          &quot;Subscribe!&quot; and a wall of hashtags.
        </li>
        <li>
          <strong>Add chapter markers.</strong> Timestamped chapters are labelled sub-answers — effectively
          headings for a video. They give the engine extractable structure it can point at.
        </li>
        <li>
          <strong>Publish a companion page on your own domain.</strong> Embed the video, then publish the cleaned-up
          transcript underneath it as real prose with headings. This is the step almost nobody does, and it is the
          highest-leverage one — see below.
        </li>
        <li>
          <strong>Mark the companion page up with VideoObject schema.</strong> It tells crawlers unambiguously what
          the page contains.
        </li>
      </ol>

      <h3>Why the companion page beats the video</h3>
      <p>
        A YouTube page is a source you do not control, on a domain that already has millions of competing pages, in
        a format the retrieval layer handles awkwardly. A page on your own domain containing the same answer as
        clean, headed text is easier to retrieve, easier to quote, and — critically — it is <em>your</em> entity
        that accumulates the authority. The video becomes a supporting asset on a page that can be cited, rather
        than the whole bet.
      </p>
      <p>
        The bonus is efficiency: one filmed answer becomes a video, a written page, and the raw material for an FAQ
        entry. If you want the writing side of this done well, our guide on{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI engines actually quote</Link>{" "}
        covers the sentence-level mechanics.
      </p>

      <h3>The schema, minimally</h3>
      <pre><code>{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Why Your Water Heater Makes a Banging Noise",
  "description": "A plumber explains the two causes of banging water heaters and how to fix each.",
  "uploadDate": "2026-08-07",
  "duration": "PT4M32S",
  "embedUrl": "https://www.youtube.com/embed/VIDEO_ID",
  "transcript": "Full corrected transcript text here."
}
</script>`}</code></pre>
      <p>
        Keep every field truthful — an invented duration or a description that does not match the footage is the
        kind of mismatch that gets structured data ignored. More on getting this right in our{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup guide for AI search</Link>.
      </p>

      <h2>Common questions</h2>
      <h3>Do I need to be on YouTube at all?</h3>
      <p>
        Not necessarily. A self-hosted video with an on-page transcript can work fine for AI visibility. YouTube
        adds discovery and a second surface Google already indexes, which is why we usually recommend both — upload
        there, and publish the companion page on your domain.
      </p>
      <h3>Do views, likes or subscribers affect whether AI cites me?</h3>
      <p>
        There is no evidence that engagement metrics are a direct input to citation. What popularity does is
        indirect: popular videos get embedded, quoted and linked from other pages, and <em>those</em> pages are
        retrievable text. Do not chase view counts as an AEO tactic.
      </p>
      <h3>What about Shorts, TikTok and Reels?</h3>
      <p>
        Weak for this purpose. Short-form video usually has minimal description text, no meaningful transcript
        surface, and lives behind interfaces that are harder to retrieve from. Treat it as demand generation, not
        AI visibility.
      </p>
      <h3>Will adding video guarantee I get cited?</h3>
      <p>
        No, and be suspicious of anyone who says otherwise. AEO shapes the public signals engines read; it does not
        control what any model outputs on a given day. Video with clean text attached makes you a candidate for
        procedural questions. It does not make you the answer.
      </p>

      <h2>The bottom line</h2>
      <p>
        Video shows up in AI answers through its text. Title the video as the question, answer it out loud in the
        first thirty seconds, upload a corrected transcript, write the description like an article, add chapters,
        and publish a companion page on your own domain with the transcript in it. The filming was always the
        expensive part — the citable asset is the twenty minutes of typing afterwards that most businesses skip.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
