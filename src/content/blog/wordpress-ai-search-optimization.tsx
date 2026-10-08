import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "wordpress-ai-search-optimization",
  title: "WordPress AI Search Optimization: A Step-by-Step Guide",
  description:
    "How to make a WordPress site easy for ChatGPT, Claude, Gemini and Perplexity to read and cite: crawler access, robots.txt, schema, llms.txt and answer pages.",
  subtitle:
    "WordPress AI search optimization means letting the AI search crawlers in, putting your answers in plain HTML pages, adding structured business facts and an llms.txt, and checking what the assistants say afterwards.",
  date: "2026-10-08",
  updated: "2026-10-08",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "wordpress ai search optimization",
  image: {
    src: "/blog/wordpress-ai-search-optimization.webp",
    alt: "An empty wooden type case with neat square compartments beside a stack of cream cards with an old brass key on top.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "WordPress's Discourage search engines box adds a noindex, nofollow robots meta tag to every page, so check it first.",
    "OpenAI says sites that block OAI-SearchBot will not be shown in ChatGPT search answers, apart from navigational links.",
    "Blocking GPTBot or ClaudeBot opts out of model training; the search crawlers OAI-SearchBot, Claude-SearchBot and PerplexityBot are separate.",
    "A physical robots.txt file on the server overrides the virtual one that WordPress and its plugins generate.",
    "Yoast SEO can generate an llms.txt file on its free plan, and Google says AI Overviews need no special markup.",
  ],
  sources: [
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Overview of OpenAI Crawlers", publisher: "OpenAI", url: "https://developers.openai.com/api/docs/bots" },
    {
      title: "Does Anthropic crawl data from the web, and how can site owners block the crawler?",
      publisher: "Anthropic",
      url: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
    },
    { title: "Perplexity Crawlers", publisher: "Perplexity", url: "https://docs.perplexity.ai/guides/bots" },
    { title: "Settings Reading screen", publisher: "WordPress.org", url: "https://wordpress.org/documentation/article/settings-reading-screen/" },
    { title: "llms.txt - Yoast SEO Features", publisher: "Yoast", url: "https://yoast.com/features/llms-txt/" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> WordPress AI search optimization comes down to five jobs: let the AI search
        crawlers reach your pages, make sure your answers are in plain HTML, add structured business facts, publish an
        llms.txt, and write pages that answer the questions customers ask. Start by checking that WordPress is not
        telling crawlers to stay away.
      </p>

      <p>
        This guide is for owners and web people running a business site on WordPress. It covers the settings and
        plugins that decide whether ChatGPT, Claude, Gemini and Perplexity can read and quote you, in the order we
        would check them, and the mistakes that quietly block everything.
      </p>

      <h2>What is WordPress AI search optimization?</h2>
      <p>
        WordPress AI search optimization is the work of making a WordPress site easy for AI assistants to crawl,
        understand and cite when they answer a customer&apos;s question. It overlaps heavily with ordinary SEO. Google
        says in{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        that there are no additional requirements to appear in AI Overviews or AI Mode beyond being indexed and
        eligible for a snippet. The differences are in the details: the other assistants use their own crawlers,
        those crawlers have their own robots.txt names, and the content they quote tends to be short, direct answers
        rather than long sales copy. For the wider picture, see{" "}
        <Link href="/blog/what-is-answer-engine-optimization">what answer engine optimization is</Link>.
      </p>

      <h2>How do you optimize a WordPress site for AI search, step by step?</h2>
      <p>
        There are seven steps, and the first two matter most because a blocked crawler makes everything else
        pointless.
      </p>
      <ol>
        <li>
          <strong>Untick &quot;Discourage search engines&quot;.</strong> In Settings → Reading, the Search engine
          visibility box is often left on after a site launch. WordPress&apos;s{" "}
          <a href="https://wordpress.org/documentation/article/settings-reading-screen/" {...ext}>
            Reading screen documentation
          </a>{" "}
          says that, since version 5.3, it adds a <code>noindex,nofollow</code> robots meta tag to your pages.
        </li>
        <li>
          <strong>Allow the AI search crawlers in robots.txt.</strong> Let OAI-SearchBot, Claude-SearchBot and
          PerplexityBot fetch your public pages, and decide separately about the training crawlers. Details below.
        </li>
        <li>
          <strong>Check your firewall and CDN.</strong> Security plugins and services such as Cloudflare can block AI
          crawlers before WordPress ever sees the request. Look for any &quot;block AI bots&quot; or bot-fight setting
          and make sure it does not cover the search crawlers you want.
        </li>
        <li>
          <strong>Make sure key content is in the HTML.</strong> Prices, services, hours and FAQ answers that only
          appear inside tabs, sliders or scripts may be missed by crawlers that do not run JavaScript. View the page
          source and search for the sentence you want quoted. More in{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
        </li>
        <li>
          <strong>Add structured business facts.</strong> Use LocalBusiness or Organization schema for your name,
          address, phone, hours and services, and FAQPage schema on real FAQ content. Yoast, Rank Math and similar
          plugins handle the basics; check the output with Google&apos;s Rich Results Test.
        </li>
        <li>
          <strong>Publish an llms.txt.</strong> A short Markdown file at your root that lists your most useful pages.
          It is optional and unproven as a ranking factor, but it is cheap and some tools read it.
        </li>
        <li>
          <strong>Write answer pages.</strong> One page per service or common question, opening with a direct
          two-sentence answer, then the detail. This is the content assistants actually lift.
        </li>
      </ol>

      <h2>Which AI crawlers should a WordPress site allow?</h2>
      <p>
        Allow the search crawlers if you want to be cited, and treat the training crawlers as a separate choice. Each
        company publishes its own list, and the names are easy to confuse.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Search / citation crawler</th>
              <th>Training crawler</th>
              <th>User-triggered fetcher</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OpenAI</td>
              <td>OAI-SearchBot</td>
              <td>GPTBot</td>
              <td>ChatGPT-User</td>
            </tr>
            <tr>
              <td>Anthropic</td>
              <td>Claude-SearchBot</td>
              <td>ClaudeBot</td>
              <td>Claude-User</td>
            </tr>
            <tr>
              <td>Perplexity</td>
              <td>PerplexityBot</td>
              <td>None listed</td>
              <td>Perplexity-User</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        OpenAI&apos;s{" "}
        <a href="https://developers.openai.com/api/docs/bots" {...ext}>
          crawler overview
        </a>{" "}
        says sites that opt out of OAI-SearchBot will not be shown in ChatGPT search answers, though they can still
        appear as navigational links, and that disallowing GPTBot only signals that content should not be used for
        training. Anthropic&apos;s{" "}
        <a
          href="https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"
          {...ext}
        >
          help article
        </a>{" "}
        says blocking Claude-SearchBot prevents your content being indexed for search, while ClaudeBot collects
        training data. Perplexity&apos;s{" "}
        <a href="https://docs.perplexity.ai/guides/bots" {...ext}>
          crawler documentation
        </a>{" "}
        says PerplexityBot surfaces sites in its results and is not used for training, and that robots.txt changes can
        take up to 24 hours to apply. Gemini draws on Google&apos;s own index, so Googlebot access covers it. A full
        line-by-line file is in the <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers robots.txt guide</Link>.
      </p>

      <h2>How do you edit robots.txt on WordPress?</h2>
      <p>
        Most WordPress sites serve a virtual robots.txt that WordPress generates, and you edit it through an SEO
        plugin such as Yoast or Rank Math rather than a file. A typical block that allows the search crawlers looks
        like this:
      </p>
      <pre>
        <code>
          {`User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /`}
        </code>
      </pre>
      <p>
        The catch: if a physical <code>robots.txt</code> file exists in your site&apos;s root folder, the server sends
        that file and WordPress&apos;s virtual one is never used. If your plugin edits seem to do nothing, visit
        yoursite.com/robots.txt and compare, then ask your host to remove or update the physical file.
      </p>

      <h2>Which WordPress plugins help with AI search?</h2>
      <p>
        A standard SEO plugin covers most of the technical basics, and nothing on WordPress can make an assistant
        recommend you. Here is what the common pieces do.
      </p>
      <ul>
        <li>
          <strong>Yoast SEO or Rank Math.</strong> Titles, meta descriptions, sitemaps, robots.txt editing and core
          schema. Yoast&apos;s{" "}
          <a href="https://yoast.com/features/llms-txt/" {...ext}>
            llms.txt feature
          </a>{" "}
          generates and refreshes an llms.txt automatically and is free for everyone, according to Yoast.
        </li>
        <li>
          <strong>A schema plugin, if your theme lacks it.</strong> Only needed when your SEO plugin cannot output
          LocalBusiness details such as hours and service area.
        </li>
        <li>
          <strong>A caching or performance plugin.</strong> Helps crawlers fetch pages quickly; check it does not
          serve a blank shell to bots.
        </li>
        <li>
          <strong>An agent that does the content work.</strong> The{" "}
          <Link href="/integrations/wordpress">Alphaa Connector plugin</Link> lets Alphaa publish the FAQ pages, posts,
          schema, llms.txt and AI-crawler rules you approve, works alongside Yoast and Rank Math, and puts every change
          behind an undo. It costs from $99 a month as part of Alphaa.
        </li>
      </ul>
      <p>
        Avoid stacking several SEO plugins. Two plugins writing schema or robots rules at once is a common cause of
        duplicated or contradictory markup. The markup itself is covered in{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>, and the file format in{" "}
        <Link href="/blog/how-to-create-llms-txt-file">how to create an llms.txt file</Link>.
      </p>

      <h2>What content should a WordPress site publish for AI answers?</h2>
      <p>
        Publish pages that answer the exact questions customers ask an assistant, each with a direct answer in the
        first two sentences. For a local business that usually means a page per service, a page per area you serve,
        pricing or price ranges where you can give them, and an FAQ page built from questions your staff hear every
        week.
      </p>
      <p>
        Keep facts identical everywhere: the hours on your contact page, your schema, your Google Business Profile and
        your directory listings should match. Assistants compare sources, and a mismatch is a reason to name someone
        else. Use real headings (H2s phrased as questions work well), short paragraphs and tables for anything
        comparative. The writing side is covered in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI will quote</Link>.
      </p>

      <h2>What WordPress settings quietly hurt AI visibility?</h2>
      <p>
        Several ordinary WordPress settings can hide content from AI crawlers without any warning in the dashboard.
        These are the ones worth checking on any business site:
      </p>
      <ul>
        <li>
          <strong>Maintenance or coming-soon mode left on.</strong> Some plugins show crawlers a holding page while
          logged-in admins see the real site, so the owner never notices.
        </li>
        <li>
          <strong>Noindex on pages that matter.</strong> SEO plugins let you noindex single pages, categories or whole
          post types. Service pages and FAQ pages are sometimes caught by a rule meant for thin archive pages.
        </li>
        <li>
          <strong>Password-protected or members-only content.</strong> Anything behind a login is invisible to every
          crawler, so keep your prices, services and policies on public pages.
        </li>
        <li>
          <strong>Staging rules copied to production.</strong> A robots.txt that disallows everything is normal on a
          staging copy and a disaster when a migration carries it to the live site.
        </li>
        <li>
          <strong>Aggressive bot protection at the host.</strong> Managed hosts and security plugins may rate-limit or
          challenge unfamiliar user agents, which can include AI search crawlers.
        </li>
      </ul>
      <p>
        A quick test covers most of these: open a private browser window, visit your key pages while logged out, view
        the source, and confirm the text you want quoted is there and no robots meta tag says noindex. Then check
        yoursite.com/robots.txt for any rule that names the crawlers in the table above.
      </p>

      <h2>How do you check whether it worked?</h2>
      <p>
        Ask the assistants directly, and watch for AI referrals in your analytics. Ask ChatGPT, Claude, Gemini and
        Perplexity the questions a customer would ask, note who they name and which pages they cite, and repeat after
        the crawlers have had time to revisit. Answers vary from one run to the next, so look for a pattern over
        several weeks rather than one result.
      </p>
      <p>
        In Google Analytics, referrals from chatgpt.com, perplexity.ai and similar domains show up as referral
        traffic; the setup is in{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">how to track AI traffic in Google Analytics</Link>.
        For a quick baseline, the <Link href="/start">free 60-second AI check</Link> shows what the four assistants say
        about your business today.
      </p>

      <h2>What else do WordPress owners ask about AI search?</h2>

      <h3>Does WordPress block AI crawlers by default?</h3>
      <p>
        No, a default WordPress install does not block AI crawlers. Blocks usually come from the Discourage search
        engines setting, a security plugin, a hosting firewall or a CDN bot setting, so check each of those.
      </p>

      <h3>Should I block GPTBot on my WordPress site?</h3>
      <p>
        That is a training decision, not a visibility one. OpenAI says GPTBot collects training data, while
        OAI-SearchBot is what decides whether you can appear in ChatGPT search, so you can block one and allow the
        other.
      </p>

      <h3>Do I need a special plugin for ChatGPT?</h3>
      <p>
        No plugin is required for ChatGPT to read your site. It needs OAI-SearchBot access, crawlable HTML and useful
        content; plugins only make the robots.txt, schema and llms.txt parts easier to manage.
      </p>

      <h3>Is llms.txt worth adding to WordPress?</h3>
      <p>
        It is worth adding because it is cheap, not because it is proven. Yoast can generate one for free, and it does
        no harm, but crawler access and clear answer pages matter far more.
      </p>

      <h3>Do page builders like Elementor hurt AI visibility?</h3>
      <p>
        Not by themselves, as long as the text is in the page HTML. Problems start when key content sits only in
        widgets that load through JavaScript, so view the page source to confirm your answers are there.
      </p>
    </div>
  )
}
