import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "cloudflare-blocking-ai-crawlers",
  title: "Is Cloudflare Blocking AI Crawlers From Your Site?",
  description:
    "How to tell if Cloudflare is blocking AI crawlers like OAI-SearchBot, where the 2026 Search, Agent and Training settings live, and which to allow for AI search.",
  subtitle:
    "Cloudflare can block AI crawlers by default or through settings you never touched, so open Security settings, allow the Search category, and decide on Training separately, because blocking Training now also blocks Googlebot and Bingbot.",
  date: "2026-11-18",
  updated: "2026-11-18",
  readMins: 5,
  tag: "Guide",
  kind: "guide",
  keyphrase: "cloudflare blocking ai crawlers",
  takeaways: [
    "Since July 2025, Cloudflare has asked every new domain whether to allow AI crawlers, with blocking as the starting default.",
    "In July 2026 Cloudflare split AI bot controls into Search, Agent and Training, available on every plan including Free.",
    "Cloudflare now applies the most restrictive matching rule to multi-purpose crawlers, so blocking Training also blocks Googlebot, Applebot and Bingbot.",
    "OpenAI says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers.",
    "Content Signals in robots.txt state your preferences but do not block bots; the access policies do.",
  ],
  sources: [
    {
      title:
        "Cloudflare Just Changed How AI Crawlers Scrape the Internet-at-Large;  Permission-Based Approach Makes Way for A New Business Model | Cloudflare",
      publisher: "Cloudflare",
      url: "https://www.cloudflare.com/press/press-releases/2025/cloudflare-just-changed-how-ai-crawlers-scrape-the-internet-at-large/",
    },
    {
      title: "Your site, your rules: new AI traffic options for all customers | Cloudflare Blog",
      publisher: "Cloudflare",
      url: "https://blog.cloudflare.com/content-independence-day-ai-options/",
    },
    {
      title: "AI Crawler and Agent access policies · Cloudflare bot solutions docs",
      publisher: "Cloudflare",
      url: "https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/",
    },
    {
      title: "Overview · Cloudflare AI Crawl Control docs",
      publisher: "Cloudflare",
      url: "https://developers.cloudflare.com/ai-crawl-control/",
    },
    {
      title: "Overview of OpenAI Crawlers",
      publisher: "OpenAI",
      url: "https://developers.openai.com/api/docs/bots",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Cloudflare may be blocking AI crawlers from your site if your domain was set up
        after July 2025 or someone switched on AI bot blocking. Open Security settings, find AI Crawler and Agent
        access policies, and set Search to Allow. Decide Training on its own, because blocking it now also blocks
        Googlebot and Bingbot.
      </p>

      <p>
        This guide is for business owners and web people whose site sits behind Cloudflare, which many hosts and
        website builders switch on for you. It covers how the defaults changed, how to check yours in five minutes and
        which settings matter for ChatGPT, Gemini, Claude and Perplexity. Everything here comes from Cloudflare&apos;s
        and OpenAI&apos;s own pages, read on 18 November 2026.
      </p>

      <h2>Does Cloudflare block AI crawlers by default?</h2>
      <p>
        Cloudflare has blocked AI crawlers by default for new domains since 1 July 2025, when it began asking every new
        domain at signup whether to allow them. Its{" "}
        <a
          href="https://www.cloudflare.com/press/press-releases/2025/cloudflare-just-changed-how-ai-crawlers-scrape-the-internet-at-large/"
          {...ext}
        >
          press release
        </a>{" "}
        said every new domain would start with blocking as the default, and that owners could change the choice later.
        Existing domains kept their settings but got a one-click option to block.
      </p>
      <p>
        That matters for small businesses because the person who set up the domain is often a web designer, a host&apos;s
        onboarding wizard or an owner clicking through quickly. If blocking was accepted at signup, nothing on the
        website looks wrong. Visitors see the site normally; only AI crawlers are turned away.
      </p>

      <h2>What changed in Cloudflare&apos;s AI crawler settings in 2026?</h2>
      <p>
        In July 2026 Cloudflare replaced its single AI bot switch with separate controls for Search, Agent and Training
        crawlers, open to every plan including Free. Cloudflare&apos;s blog post{" "}
        <a href="https://blog.cloudflare.com/content-independence-day-ai-options/" {...ext}>
          Your site, your rules
        </a>{" "}
        describes the three behaviors:
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>What the bot does</th>
              <th>Effect of blocking it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Search</td>
              <td>Indexes your pages so an AI can answer later questions with them</td>
              <td>AI search answers cannot cite pages they never fetched</td>
            </tr>
            <tr>
              <td>Agent</td>
              <td>Fetches a page in real time for a person, such as ChatGPT-User or a browser agent</td>
              <td>An assistant cannot open your page when a user asks it to</td>
            </tr>
            <tr>
              <td>Training</td>
              <td>Collects content to train or fine-tune models</td>
              <td>Your content is left out of training; multi-purpose crawlers are blocked too</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The same post set two changes from 15 September 2026. For new domains, Training and Agent bots are blocked by
        default on pages that show ads, while Search stays allowed. And multi-purpose crawlers, which Cloudflare names
        as Googlebot, Applebot and Bingbot, are now handled by the most restrictive rule that applies to them. So a site
        that blocks Training also blocks those three, which can pull it out of Google and Bing search, not only AI.
        Cloudflare says existing customers were notified and could opt out in Security settings before the date.
      </p>
      <p>
        Bingbot deserves particular care. Bing&apos;s index feeds several AI answer surfaces, as our guide to{" "}
        <Link href="/blog/does-chatgpt-use-bing">whether ChatGPT uses Bing</Link> explains, so blocking it can cost you
        more than one search engine.
      </p>

      <h2>How do you check if Cloudflare is blocking AI crawlers?</h2>
      <p>
        You check by opening your domain&apos;s Security settings in Cloudflare and reading the AI Crawler and Agent
        access policies, then confirming in AI Crawl Control which bots were actually stopped. It takes about five
        minutes.
      </p>
      <ol>
        <li>
          <strong>Log in and pick the domain.</strong> If you do not know whether your site uses Cloudflare, ask your
          host or web designer; many sites are on it without the owner knowing.
        </li>
        <li>
          <strong>Open Security, then Settings.</strong> Cloudflare&apos;s{" "}
          <a href="https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/" {...ext}>
            access policy docs
          </a>{" "}
          say to filter by &quot;Bot traffic&quot; and select &quot;AI Crawler and Agent access policies&quot;.
        </li>
        <li>
          <strong>Read the action for each category.</strong> The options are Block, Block on pages with ads, Allow
          (do not block) and, for Training only, Disallow, which asks crawlers through robots.txt rather than blocking
          them.
        </li>
        <li>
          <strong>Open AI Crawl Control.</strong> Cloudflare&apos;s{" "}
          <a href="https://developers.cloudflare.com/ai-crawl-control/" {...ext}>
            AI Crawl Control
          </a>{" "}
          is on all plans and shows crawler activity, lets you allow or block individual crawlers and tracks which
          ones follow your robots.txt.
        </li>
        <li>
          <strong>Check the other security rules.</strong> A custom WAF rule, Bot Fight Mode or a country block can
          still stop AI crawlers even when the access policy says Allow. Look for blocked requests from AI user agents.
        </li>
        <li>
          <strong>Look at your live robots.txt.</strong> Visit yourdomain.com/robots.txt and read what it says to
          OAI-SearchBot, ClaudeBot, PerplexityBot and Googlebot. Our{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt guide</Link> covers each line.
        </li>
      </ol>

      <h2>Which Cloudflare settings should a business choose for AI search?</h2>
      <p>
        Most businesses that want to be recommended by AI should allow Search and Agent, and then choose Training on its
        own merits, knowing that a full Block on Training now also blocks Googlebot, Applebot and Bingbot. A sensible
        starting point:
      </p>
      <ul>
        <li>
          <strong>Search: Allow.</strong> This is the category that lets AI search engines read the pages they quote.
        </li>
        <li>
          <strong>Agent: Allow.</strong> When a customer asks ChatGPT to check your hours or menu, an agent fetches the
          page. Cloudflare&apos;s docs recommend allowing personal agents.
        </li>
        <li>
          <strong>Training: your call.</strong> If you do not want your content used for training, Disallow asks
          politely through robots.txt without the edge block. A hard Block takes the multi-purpose crawlers with it.
        </li>
        <li>
          <strong>Block on pages with ads: check what counts.</strong> If your site runs ads, this action can apply to
          more pages than you expect.
        </li>
      </ul>
      <p>
        OpenAI&apos;s own{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          crawler overview
        </a>{" "}
        shows why the split matters. It says sites opted out of OAI-SearchBot will not be shown in ChatGPT search
        answers, while disallowing GPTBot only says the content should not be used to train its models. The two are
        independent, so you can refuse training and still appear in ChatGPT search.
      </p>

      <h2>Do Cloudflare&apos;s content signals in robots.txt block AI bots?</h2>
      <p>
        No, content signals in robots.txt express your preferences but do not block any bot; only the access policies
        and security rules do. If you use Cloudflare&apos;s managed robots.txt, it can add a line such as{" "}
        <code>Content-Signal: search=yes,ai-train=no</code>, and the 2026 blog post says a test value,{" "}
        <code>use=reference</code>, is now added by default.
      </p>
      <p>
        Cloudflare says it will track how verified bots use content and that a bot which abuses the signals can lose
        its verified status. That is an incentive, not a wall. Read the signals as instructions to well-behaved
        crawlers, and read the access policies as the setting that actually decides who gets through.
      </p>

      <h2>How do you confirm AI crawlers can reach your site after the change?</h2>
      <p>
        You confirm it by watching AI Crawl Control for allowed requests from search crawlers over the following days,
        and by testing whether the assistants can read a page they could not before. Crawlers do not return instantly,
        so give it time before judging.
      </p>
      <p>
        A faster first signal is Alphaa&apos;s <Link href="/start">free 60-second AI check</Link>, which requests your
        homepage with the user agents ChatGPT, Claude and Perplexity send, reads your robots.txt and flags
        Cloudflare&apos;s content signal lines. Because those requests come from our server rather than the real bots,
        Cloudflare may treat them differently, so use the check as a pointer and Cloudflare&apos;s own logs as proof.
        For the wider picture, our <Link href="/blog/ai-visibility-audit">AI visibility audit</Link> walks through every
        access check, and our note on{" "}
        <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link> covers the next
        thing that can hide a page once the crawler is let in.
      </p>

      <h2>What else do site owners ask about Cloudflare and AI crawlers?</h2>

      <h3>Will allowing AI crawlers guarantee that ChatGPT recommends my business?</h3>
      <p>
        No, allowing crawlers only makes your pages readable; it does not make an assistant choose you. What the pages
        say, your reviews and your listings still decide whether you are named.
      </p>

      <h3>Does Cloudflare&apos;s free plan include the AI crawler settings?</h3>
      <p>
        Yes, Cloudflare says the Search, Agent and Training options are available to all customers, including the Free
        tier. AI Crawl Control is also listed as available on all plans.
      </p>

      <h3>Can I block AI training but still appear in AI search?</h3>
      <p>
        Yes, with care: use Disallow for Training rather than Block, and keep Search allowed. A full Block on Training
        also blocks multi-purpose crawlers such as Googlebot and Bingbot under Cloudflare&apos;s 2026 rules.
      </p>

      <h3>Does robots.txt stop ChatGPT-User from opening my page?</h3>
      <p>
        Not always, because OpenAI says ChatGPT-User visits are started by a user and robots.txt rules may not apply to
        them. Cloudflare&apos;s Agent policy is the setting that actually allows or blocks that traffic.
      </p>

      <h3>My site isn&apos;t on Cloudflare. Can AI crawlers still be blocked?</h3>
      <p>
        Yes, other hosts, firewalls and security plugins can block AI user agents too, and so can a robots.txt rule.
        The same check applies: read robots.txt, then look for blocked AI requests in your host&apos;s logs.
      </p>
    </div>
  )
}
