import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-see-what-chatgpt-says-about-your-business",
  title: "How to See What ChatGPT Says About Your Business (Free Methods + One Fast One)",
  description:
    "To see what ChatGPT says about your business, just ask it directly — then repeat the test across Claude, Gemini, and Perplexity. Here are the exact prompts, the free methods, and one faster way to check every engine at once.",
  date: "2026-07-06",
  readMins: 8,
  tag: "How-to",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> The fastest free way to see what ChatGPT says about your business is to
        open ChatGPT and ask it directly — by name and by category. Type &quot;What do you know about [your
        business name] in [your city]?&quot; and then &quot;Who are the best [your service] in [your city]?&quot;
        to see whether you get named at all. Because AI answers vary by wording, engine, and user, one check
        isn&apos;t enough: repeat the same prompts in Claude, Gemini, and Perplexity, and run each a few times.
        Below are the exact prompts, what to look for, and one faster method that checks every engine at once.
      </p>

      <h2>Why you can&apos;t assume ChatGPT knows you</h2>
      <p>
        When someone asks an AI assistant to recommend a plumber, a dentist, or a software vendor, the model
        assembles an answer from what it learned in training plus, increasingly, live web results it retrieves
        the moment you ask. Your business shows up only if it&apos;s described clearly and consistently across the
        sources those engines read. So the real question isn&apos;t &quot;am I on page one of Google?&quot; — it&apos;s
        &quot;when a buyer asks an AI for a recommendation in my category, does my name come out of the model&apos;s
        mouth?&quot; The only way to know is to look. And you have to look in more than one place, because each
        engine draws on different data.
      </p>

      <h2>Method 1: Ask ChatGPT directly (the two prompts that matter)</h2>
      <p>
        Open ChatGPT and run these two prompts. They test two different things, and both matter.
      </p>
      <ul>
        <li>
          <strong>The recognition test.</strong> &quot;What do you know about [business name] in [city]?&quot;
          This tells you whether the model has any concept of your business at all — and whether the details it
          returns are accurate. If it invents your services, gets your location wrong, or says it has no
          information, that&apos;s a signal your public footprint is thin or inconsistent.
        </li>
        <li>
          <strong>The recommendation test.</strong> &quot;Who are the best [service] in [city]?&quot; or
          &quot;I need a [service] near [neighborhood] — who should I call?&quot; This is the one that actually
          drives revenue. Note whether you appear, in what position, and who gets named ahead of you. Those
          names are your real AI-visibility competitors, which may not be the same as your Google competitors.
        </li>
      </ul>
      <p>
        One critical detail: don&apos;t run each prompt once and stop. AI models are probabilistic — the same
        question can produce a different list on the next try. Run each prompt three to five times, ideally in
        fresh chats, and note how often you appear. Appearing in one of five answers is a very different reality
        from appearing in five of five.
      </p>

      <h2>Method 2: Turn on web browsing and re-test</h2>
      <p>
        ChatGPT can answer from frozen training knowledge or from live web retrieval, and the two can disagree.
        If your version offers a browsing or &quot;search the web&quot; mode, run the recommendation prompt with
        it on and off. If you appear only when browsing is on, your presence depends on current web content
        (your site, reviews, directories) rather than being &quot;baked in&quot; from training — useful to know,
        because fresh, retrievable content is something you can actually influence. If you don&apos;t appear
        either way, you have a visibility gap to close, not just a wording problem.
      </p>

      <h2>Method 3: Check every engine, not just ChatGPT</h2>
      <p>
        ChatGPT is the loudest name, but your buyers use whatever assistant is in front of them. Run the same
        two prompts in each of these, because they pull from different sources and will often disagree:
      </p>
      <ul>
        <li>
          <strong>Claude</strong> — strong at synthesizing structured, well-described pages.
        </li>
        <li>
          <strong>Gemini</strong> — tightly connected to Google&apos;s index and your Google Business Profile,
          so it often mirrors what shows in Google AI Overviews.
        </li>
        <li>
          <strong>Perplexity</strong> — retrieval-first and citation-heavy; it shows you exactly which pages it
          pulled, which makes it the best engine for diagnosing <em>why</em> you did or didn&apos;t appear.
        </li>
      </ul>
      <p>
        Perplexity deserves special attention here: because it lists its sources, you can see whether it&apos;s
        citing your own site, a review platform, a directory, or a competitor&apos;s page. That&apos;s a free
        window into how AI engines perceive your category. If you want to go deeper on that engine specifically,
        see <Link href="/blog/how-to-get-cited-on-perplexity">how to get cited on Perplexity</Link>.
      </p>

      <h2>What your results actually mean</h2>
      <table>
        <thead>
          <tr>
            <th>What you see</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Named consistently in recommendation prompts</td>
            <td>Strong AI visibility — protect it and keep sources fresh</td>
          </tr>
          <tr>
            <td>Recognized by name, but never recommended</td>
            <td>The model knows you exist but doesn&apos;t see enough evidence to vouch for you</td>
          </tr>
          <tr>
            <td>Details returned are wrong or outdated</td>
            <td>Inconsistent public data — your sources disagree with each other</td>
          </tr>
          <tr>
            <td>&quot;I don&apos;t have information about that business&quot;</td>
            <td>Thin footprint — few retrievable, verifiable sources describe you</td>
          </tr>
        </tbody>
      </table>
      <p>
        Notice what none of these results can be fixed by: there is no button that inserts you into ChatGPT. AEO
        works by improving the public signals AI engines read — your website clarity, schema, reviews, and
        cross-source consistency — so the model has better evidence to name you. It shifts the odds in your
        favor; it doesn&apos;t guarantee a spot. If a vendor promises guaranteed placement, read{" "}
        <Link href="/blog/is-aeo-real">the honest breakdown of what AEO can and can&apos;t do</Link> before you
        sign anything.
      </p>

      <h2>The one fast method: check all four engines at once</h2>
      <p>
        Doing the manual test well — two prompts, several runs, four engines — takes real time, and it&apos;s easy
        to fool yourself by running a prompt once and calling it a day. That&apos;s the exact job a scan
        automates. Alphaa runs your recognition and recommendation prompts across ChatGPT, Claude, Gemini, and
        Perplexity, repeats them, and reports where you appear, where you don&apos;t, and who gets named instead
        — in about a minute, with no login required. It&apos;s the manual method above, done consistently and
        without the guesswork.
      </p>
      <p>
        Whichever route you take, do the check before you spend another dollar on marketing. You can&apos;t fix a
        visibility gap you haven&apos;t measured, and &quot;I assume ChatGPT knows us&quot; is not a measurement.
      </p>

      <h2>FAQ</h2>
      <p>
        <strong>Is it really free to check what ChatGPT says about my business?</strong> Yes. Asking ChatGPT,
        Claude, Gemini, and Perplexity directly costs nothing beyond your time. The prompts above are all you
        need to start.
      </p>
      <p>
        <strong>Why do I get a different answer every time I ask?</strong> AI models are probabilistic, and many
        now retrieve live web results, so answers shift by wording, timing, and user. That&apos;s expected — it&apos;s
        why you run each prompt several times and look at how often you appear, not whether you appeared once.
      </p>
      <p>
        <strong>ChatGPT gave wrong details about my business. How do I correct it?</strong> You can&apos;t edit
        the model directly. You fix it at the source: make your website, Google Business Profile, and directory
        listings state the correct, consistent details, so the next time the model retrieves information about
        you, the accurate version is what it finds.
      </p>

      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
