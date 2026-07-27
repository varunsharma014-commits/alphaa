import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "ai-crawlers-robots-txt-guide",
  title: "Which AI Crawlers Should You Allow? A robots.txt Guide to GPTBot, ClaudeBot and PerplexityBot",
  description:
    "AI companies run two different kinds of bots: training crawlers that feed the models, and retrieval agents that fetch your pages to answer a question right now. Blocking the wrong one quietly removes you from AI answers. Here is what each user agent does and how to configure robots.txt deliberately.",
  date: "2026-07-27",
  readMins: 10,
  tag: "Technical",
}

export function Body() {
  return (
    <div className="article-prose">
      <p>
        By the alphaa team — we crawl and scan thousands of business websites, and misconfigured robots rules are
        one of the most common reasons a business is invisible to AI engines.
      </p>
      <p>
        <strong>Short answer:</strong> allow the retrieval agents that fetch pages to answer live questions —{" "}
        <code>OAI-SearchBot</code>, <code>ChatGPT-User</code>, <code>PerplexityBot</code>,{" "}
        <code>Claude-User</code> — because blocking them makes you ineligible to be cited in AI answers. The
        training crawlers (<code>GPTBot</code>, <code>ClaudeBot</code>, <code>Google-Extended</code>,{" "}
        <code>CCBot</code>) are a separate, genuinely optional decision about whether your content may be used to
        train future models. Most businesses that want to be recommended by AI should allow both; businesses with
        proprietary content sometimes block training while keeping retrieval open.
      </p>

      <h2>Why there are two kinds of AI bot</h2>
      <p>
        An AI crawler is an automated client that requests your pages and identifies itself with a user-agent
        string. The critical distinction, and the one that trips people up, is <em>what the fetch is for</em>:
      </p>
      <ul>
        <li>
          <strong>Training crawlers</strong> collect large volumes of text to build or update a model. The content
          they gather may end up in the model&apos;s frozen knowledge, months later, after the next training run.
        </li>
        <li>
          <strong>Retrieval agents</strong> fetch pages in real time, either to maintain a search index the
          assistant queries, or because a user just asked a question and the assistant is going to read your page
          and cite it in the answer. This is the traffic that produces citations today.
        </li>
      </ul>
      <p>
        These use different user agents, so you can treat them differently. That is the whole point of the design.
        The failure mode we see repeatedly: someone reads a &quot;block AI scrapers&quot; blog post, pastes a
        blanket rule, and unknowingly removes their business from the retrieval layer that AI assistants use to
        answer &quot;who is the best plumber near me?&quot;
      </p>

      <h2>The user agents that actually matter</h2>
      <p>Grouped by operator, with what each one is for:</p>
      <table>
        <thead>
          <tr>
            <th>User agent</th>
            <th>Operator</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GPTBot</code></td>
            <td>OpenAI</td>
            <td>Training crawler</td>
          </tr>
          <tr>
            <td><code>OAI-SearchBot</code></td>
            <td>OpenAI</td>
            <td>Indexes pages for ChatGPT search results and links</td>
          </tr>
          <tr>
            <td><code>ChatGPT-User</code></td>
            <td>OpenAI</td>
            <td>Fetches a page because a user or agent asked for it</td>
          </tr>
          <tr>
            <td><code>ClaudeBot</code></td>
            <td>Anthropic</td>
            <td>Training crawler</td>
          </tr>
          <tr>
            <td><code>Claude-User</code></td>
            <td>Anthropic</td>
            <td>User-initiated fetch during a conversation</td>
          </tr>
          <tr>
            <td><code>Claude-SearchBot</code></td>
            <td>Anthropic</td>
            <td>Indexes pages to improve search results Claude cites</td>
          </tr>
          <tr>
            <td><code>PerplexityBot</code></td>
            <td>Perplexity</td>
            <td>Builds the search index behind Perplexity citations</td>
          </tr>
          <tr>
            <td><code>Perplexity-User</code></td>
            <td>Perplexity</td>
            <td>Live fetch triggered by a user question</td>
          </tr>
          <tr>
            <td><code>Google-Extended</code></td>
            <td>Google</td>
            <td>Permission token for Gemini training and grounding</td>
          </tr>
          <tr>
            <td><code>CCBot</code></td>
            <td>Common Crawl</td>
            <td>Open dataset used by many model builders</td>
          </tr>
          <tr>
            <td><code>Applebot-Extended</code></td>
            <td>Apple</td>
            <td>Permission token for Apple Intelligence training</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each operator publishes its own list, and the lists change — OpenAI documents its bots at{" "}
        <a href="https://platform.openai.com/docs/bots" rel="noopener noreferrer">platform.openai.com/docs/bots</a>,
        Anthropic in its{" "}
        <a
          href="https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"
          rel="noopener noreferrer"
        >
          crawler support article
        </a>
        , Perplexity at{" "}
        <a href="https://docs.perplexity.ai/guides/bots" rel="noopener noreferrer">docs.perplexity.ai/guides/bots</a>,
        and Google at{" "}
        <a
          href="https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers"
          rel="noopener noreferrer"
        >
          developers.google.com
        </a>
        . Check the source rather than trusting a copied list, including this one.
      </p>

      <h2>The Google-Extended misunderstanding</h2>
      <p>
        This one is worth stating precisely, because it is the most common piece of bad advice in circulation.{" "}
        <code>Google-Extended</code> is not a crawler. It is a product token that controls whether content Google
        has already crawled may be used to train Gemini models and to ground Gemini Apps and the Vertex AI API.
        Google&apos;s documentation states plainly that it does not affect a site&apos;s inclusion in Google
        Search and is not a ranking signal.
      </p>
      <p>
        The practical consequence: <strong>blocking <code>Google-Extended</code> does not remove you from AI
        Overviews.</strong> AI Overviews are part of Search and are served from the regular Google index via
        Googlebot. If you want to limit how your content appears there, the levers are snippet controls like{" "}
        <code>nosnippet</code>, <code>max-snippet</code>, and <code>data-nosnippet</code> — and those also reduce
        your normal search snippets, which is usually a bad trade. For how AI Overviews actually pick businesses,
        see <Link href="/blog/google-ai-overviews-local-business">AI Overviews for local businesses</Link>.
      </p>

      <h2>How to configure robots.txt, step by step</h2>
      <p>Here is the workflow we run when auditing a site.</p>

      <h3>Step 1: read what you currently serve</h3>
      <p>
        Open <code>https://yourdomain.com/robots.txt</code> in a browser. Do not trust the file in your repo or
        your plugin&apos;s settings screen — trust what the server actually returns. Plugins, CDNs, and host-level
        rules all silently override each other, and we regularly find a live file that nobody on the team wrote.
      </p>

      <h3>Step 2: look for the blanket block</h3>
      <p>
        The rule that does the damage looks like one of these. If you see either, an AI engine that honors robots
        rules will not read any page on your site:
      </p>
      <pre><code>{`User-agent: *
Disallow: /

# or, more subtly:
User-agent: GPTBot
User-agent: ClaudeBot
User-agent: PerplexityBot
Disallow: /`}</code></pre>
      <p>
        The second block is the one people paste deliberately, then forget. It blocks <code>PerplexityBot</code>,
        which is the index behind every Perplexity citation — so the business opts itself out of Perplexity
        answers entirely while still hoping to show up in them.
      </p>

      <h3>Step 3: write the rules you actually mean</h3>
      <p>
        For a local business or SaaS that wants to be found and recommended, the honest default is to let
        everything in. Public marketing content is meant to be read:
      </p>
      <pre><code>{`# Allow all crawlers, including AI retrieval and training
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml`}</code></pre>
      <p>
        If you genuinely do not want your content training future models but still want to be cited today, split
        the decision by user agent:
      </p>
      <pre><code>{`# Opt out of model training
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

# Stay eligible for citations in AI answers
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml`}</code></pre>
      <p>
        Two mechanics to get right. Robots.txt matching uses the <em>most specific</em> user-agent group, and a
        bot only obeys the one group that matches it — so a bot named in its own group ignores the{" "}
        <code>User-agent: *</code> block entirely. And robots.txt controls <em>crawling</em>, not what a model
        already learned in a previous training run; blocking today does not unlearn yesterday.
      </p>

      <h3>Step 4: verify with your server logs</h3>
      <p>
        This is the step almost everyone skips, and it is the only one that proves anything. Filter your access
        logs or CDN analytics for the user-agent strings above over the last 30 days. You are looking for two
        things: which AI bots are actually visiting, and what status codes they get. A crawler receiving 403s from
        your WAF is being blocked regardless of what robots.txt says — bot-protection rules on Cloudflare and
        similar services frequently catch AI crawlers by default, and that block is invisible in robots.txt.
      </p>

      <h2>Honest limitations</h2>
      <ul>
        <li>
          <strong>robots.txt is voluntary.</strong> It is a request, not enforcement. Major operators state that
          they honor it, but bad actors do not, and the only hard control is blocking at the server or WAF level.
        </li>
        <li>
          <strong>Allowing crawlers does not make you get cited.</strong> Access is necessary, not sufficient. It
          removes a blocker; it does not create the reviews, structured data, and consistent entity signals that
          decide whether an engine names you.
        </li>
        <li>
          <strong>Bot names change.</strong> Operators add and rename agents. A rule list written in 2024 is
          already partly stale. Re-check the official docs every few months.
        </li>
        <li>
          <strong>Nobody can guarantee inclusion in an AI answer.</strong> Engines vary their outputs by phrasing,
          user, and model version. You control the inputs, not the output.
        </li>
      </ul>

      <h2>Frequently asked questions</h2>

      <h3>Will blocking GPTBot hurt my visibility in ChatGPT?</h3>
      <p>
        Not directly, if you leave <code>OAI-SearchBot</code> and <code>ChatGPT-User</code> allowed.{" "}
        <code>GPTBot</code> is the training crawler; the other two handle search and live fetching, which is what
        produces citations in a ChatGPT answer today. Blocking all three does remove you.
      </p>

      <h3>Do I need an llms.txt file as well as robots.txt?</h3>
      <p>
        They do different jobs. robots.txt grants or denies access; <Link href="/blog/how-to-create-llms-txt-file">
        llms.txt</Link> offers a clean summary of who you are and where your key pages live. llms.txt is an
        emerging convention with partial adoption, so treat it as a helpful extra rather than a replacement.
      </p>

      <h3>Should a small local business bother with any of this?</h3>
      <p>
        Yes, but as a five-minute check rather than a project. Confirm your robots.txt is not blocking AI bots,
        confirm your firewall is not either, then spend your remaining effort on reviews, accurate business
        details, and answer-shaped content. Access is the floor, not the strategy.
      </p>

      <h2>The bottom line</h2>
      <p>
        Treat crawler access as two separate decisions. Retrieval agents should almost always be allowed — they
        are the mechanism by which AI assistants find and cite you right now. Training crawlers are a real choice
        with real trade-offs, and blocking them is defensible. What is never defensible is a blanket block pasted
        without knowing which bots it catches. Read your live robots.txt, check your logs for 403s, then go fix
        the signals that actually earn the recommendation.
      </p>
      <p>
        <Link href="/scan">Run a free AI visibility scan →</Link>
      </p>
      <p>
        <em>Last updated July 27, 2026.</em>
      </p>
    </div>
  )
}
