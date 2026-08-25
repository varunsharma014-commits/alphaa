import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "does-page-speed-matter-for-ai-search",
  title: "Does Page Speed Matter for AI Search?",
  description:
    "Page speed matters for AI search, but not the way Core Web Vitals matter for Google. What counts is whether a crawler gets complete HTML back quickly enough, before it gives up. Here is what actually breaks, how to test it, and what to fix first.",
  date: "2026-08-25",
  readMins: 10,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the alphaa team — we run AI-visibility scans across thousands of businesses and fetch their pages the
          way AI crawlers do. Last updated 25 August 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Yes, but it is a different kind of speed than the one your SEO report
        measures. AI engines do not appear to score you on Core Web Vitals — nobody has shown that a Largest
        Contentful Paint of 3.1s versus 1.8s changes whether ChatGPT names your business. What does matter is{" "}
        <strong>whether a crawler receives your complete content in the initial HTML response, fast enough that it
        does not time out or give up</strong>. Speed is a gating factor for retrieval, not a ranking factor for
        quality. A slow page that still returns full HTML is usually fine. A fast-feeling page that returns an
        empty shell and fills it in with JavaScript half a second later is invisible.
      </p>

      <h2>Two different meanings of &quot;speed&quot;</h2>
      <p>Separating these is most of the answer:</p>
      <ul>
        <li>
          <strong>Perceived speed (Core Web Vitals).</strong> LCP, INP, CLS — metrics about how a page feels to a
          human in a browser. They involve layout, images, fonts, and interactivity. Google uses them as a minor
          ranking input. They are largely irrelevant to a crawler, which never paints anything.
        </li>
        <li>
          <strong>Fetch speed (TTFB and total response time).</strong> How long your server takes to return the
          bytes, and whether those bytes contain the content. This is the one that decides whether an AI engine
          reads you at all.
        </li>
      </ul>
      <p>
        A page can score 98 on a Lighthouse audit and be useless to an assistant, and score 40 and be read
        perfectly. The two measurements are not testing the same thing.
      </p>

      <h2>What actually happens when an AI engine fetches your page</h2>
      <p>
        There are two distinct moments where speed can cost you, and they behave differently.
      </p>
      <p>
        <strong>The indexing crawl.</strong> Bots such as GPTBot, ClaudeBot, PerplexityBot and Google-Extended
        fetch pages on their own schedule to build a corpus. These are patient — a slow response mostly costs you
        crawl budget rather than inclusion. But persistent slowness has a compounding effect: crawlers back off from
        origins that respond slowly or return errors under load, so your pages get fetched less often, and your
        newer content takes longer to be seen. If freshness matters to your category, that lag is the real cost.
        We cover which bots exist and how to admit them in{" "}
        <Link href="/blog/ai-crawlers-robots-txt-guide">the AI crawlers and robots.txt guide</Link>.
      </p>
      <p>
        <strong>The live retrieval fetch.</strong> This is the moment that hurts. When someone asks an assistant a
        question and it browses the web to answer, it fetches a handful of candidate pages while a user waits. That
        request operates under a tight practical budget — a few seconds at most — and a page that has not responded
        gets dropped in favour of one that has. There is no queue and no retry. Your competitor&apos;s page, which
        answered in 400ms, gets summarised instead. Engines do not publish their timeout values, so treat any
        specific number you see quoted as a guess; the safe posture is to be comfortably fast rather than to aim at
        an assumed threshold.
      </p>

      <h2>The failure that looks like slowness but is not</h2>
      <p>
        By far the most common problem we see is not a slow server. It is a fast server returning an empty page. A
        client-rendered site sends a minimal HTML shell, then JavaScript fetches the content and injects it. A
        human perceives this as quick. A crawler that does not execute JavaScript sees a document with no words in
        it — and several AI crawlers do not execute JavaScript, or do so inconsistently. This is a rendering
        problem wearing a performance costume, and it is covered in detail in{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">how JavaScript rendering affects AI crawlers</Link>.
      </p>
      <p>
        The reason it belongs in a speed article is that teams reach for the wrong fix. They compress images and
        buy a bigger server, the Lighthouse score improves, and nothing changes in AI answers — because the content
        was never in the response to begin with.
      </p>

      <h2>How to test what a crawler actually gets</h2>
      <p>
        Skip the performance dashboards for this. Use curl, which behaves like a simple crawler: it makes one
        request, runs no JavaScript, and shows you exactly what came back.
      </p>
      <ol>
        <li>
          <strong>Measure time to first byte and total time.</strong>
          <br />
          <code>
            curl -o /dev/null -s -w &quot;ttfb:%&#123;time_starttransfer&#125;s total:%&#123;time_total&#125;s\n&quot; https://yoursite.com/your-page
          </code>
          <br />
          Under ~0.8s total is comfortable. Over ~2.5s, fix it. Over 5s, you are being dropped from live retrieval.
        </li>
        <li>
          <strong>Check the content is actually there.</strong>
          <br />
          <code>curl -s https://yoursite.com/your-page | grep -c &quot;a distinctive sentence from the page&quot;</code>
          <br />
          A zero means the sentence is not in the HTML, and no amount of speed tuning will help.
        </li>
        <li>
          <strong>Test as a bot, not as a browser.</strong>
          <br />
          <code>curl -s -A &quot;GPTBot/1.0&quot; -o /dev/null -w &quot;%&#123;http_code&#125; %&#123;time_total&#125;s\n&quot; https://yoursite.com/your-page</code>
          <br />
          If this returns 403, 429, or a challenge page while a normal browser fetch returns 200, your CDN or bot
          protection is blocking AI crawlers. That is the most severe finding on this list and it has nothing to do
          with speed.
        </li>
        <li>
          <strong>Test cold, not warm.</strong> Request a page nobody has visited recently. Cached pages lie; the
          crawler frequently hits an uncached URL.
        </li>
        <li>
          <strong>Test from far away.</strong> If your server is in Virginia and your CDN is not caching HTML, a
          crawler egressing from elsewhere pays the full round trip every time.
        </li>
      </ol>

      <h2>What to fix, in order</h2>
      <ol>
        <li>
          <strong>Bot blocking.</strong> Verify GPTBot, ClaudeBot, PerplexityBot and friends get a 200. Aggressive
          WAF rules and &quot;protect against AI scrapers&quot; toggles are switched on by default at some hosts.
        </li>
        <li>
          <strong>Content in the initial HTML.</strong> Server-side render or statically generate the pages you want
          cited. This is the highest-value change on the list for most sites.
        </li>
        <li>
          <strong>Time to first byte.</strong> Cache HTML at the edge, fix the slow database query on your template,
          and stop rendering pages on demand that could be built at deploy time.
        </li>
        <li>
          <strong>Redirect chains.</strong> Each hop is another round trip inside the same budget. Point links at
          final URLs; collapse http → www → https chains into one redirect.
        </li>
        <li>
          <strong>Reliability under load.</strong> Intermittent 5xx responses are worse than consistent slowness,
          because a crawler treats them as a reason to come back less often.
        </li>
        <li>
          <strong>Image and font optimisation.</strong> Worth doing for your human visitors and for Google. Close to
          irrelevant for an AI crawler reading text.
        </li>
      </ol>

      <h2>Questions we get asked</h2>
      <h3>Do Core Web Vitals affect AI Overviews?</h3>
      <p>
        Indirectly at most. AI Overviews draw heavily on pages that already rank in Google&apos;s index, and Core
        Web Vitals are a small ranking input there — so there is a chain of influence, but it runs through
        conventional ranking rather than through any AI-specific evaluation. Do not expect a Vitals improvement to
        move your citation rate on its own.
      </p>
      <h3>Is a slow site penalised by AI engines?</h3>
      <p>
        There is no evidence of a penalty in the SEO sense. The mechanism is exclusion by timeout during live
        retrieval and reduced crawl frequency over time — both practical consequences, not a quality score.
      </p>
      <h3>Does a CDN help?</h3>
      <p>
        Yes, if it caches HTML rather than only static assets, and if its bot rules allow AI crawlers through. A CDN
        configured to block unknown user agents makes your AI visibility worse while making your speed report look
        better.
      </p>
      <h3>What about very large pages?</h3>
      <p>
        Page weight matters less than you would think for text extraction, but a 2MB HTML document full of inline
        scripts and tracking payloads takes longer to transfer and buries your actual content. Keeping the readable
        substance high in the document is a reasonable habit; it is not a magic threshold.
      </p>
      <h3>How much of AI visibility is technical at all?</h3>
      <p>
        Honestly, a minority of it. Being fetchable is a prerequisite, not an advantage — once your pages are
        readable, what decides whether you get named is what your content says and what other sources say about
        you. See <Link href="/blog/what-sources-do-ai-engines-cite">what sources AI engines actually cite</Link>.
      </p>

      <h2>The bottom line</h2>
      <p>
        Treat speed as a gate, not a lever. Your job is to make sure a crawler can get your complete content, in
        one request, without JavaScript, without being blocked, in well under a second — and then stop optimising,
        because past that point the returns collapse and the real work is elsewhere. Test with curl, not with a
        performance score, because the performance score is measuring an experience no AI engine ever has.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
    </div>
  )
}
