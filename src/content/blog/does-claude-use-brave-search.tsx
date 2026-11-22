import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "does-claude-use-brave-search",
  title: "Does Claude Use Brave Search? What Businesses Should Know",
  description:
    "Does Claude use Brave Search? Anthropic lists Brave as a web search subprocessor. Here is what that means and how to make your business findable by Claude.",
  subtitle:
    "Yes: Anthropic's own subprocessor list names Brave Search as a web search provider for all Claude products, so a business that Brave can crawl and index, and that Claude's own bots can reach, has a better chance of being found when Claude searches.",
  date: "2026-11-22",
  updated: "2026-11-22",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "does claude use brave search",
  takeaways: [
    "Anthropic's Trust Center lists Brave Search as a subprocessor for web search across all Claude products, operating in the United States.",
    "The same list names TurboPuffer for web search on all products except Claude for Government.",
    "Brave's crawler will not crawl a page that Googlebot is blocked from, and it uses noindex, not robots.txt, to delist pages.",
    "Claude-SearchBot and Claude-User are separate from the ClaudeBot training crawler, and blocking them may reduce your visibility in Claude.",
    "Claude's help center says every web search response includes citations, so a findable, quotable page can earn a visible link.",
  ],
  sources: [
    {
      title: "Trust Center - Anthropic",
      publisher: "Anthropic",
      url: "https://trust.anthropic.com/subprocessors",
    },
    {
      title: "Enable and use web search | Claude Help Center",
      publisher: "Anthropic",
      url: "https://support.claude.com/en/articles/10684626-enabling-and-using-web-search",
    },
    {
      title:
        "Does Anthropic crawl data from the web, and how can site owners block the crawler? | Claude Help Center",
      publisher: "Anthropic",
      url: "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler",
    },
    {
      title: "Brave Search Crawler | Brave Search",
      publisher: "Brave",
      url: "https://search.brave.com/help/brave-search-crawler",
    },
    {
      title: "Brave Search API | Brave",
      publisher: "Brave",
      url: "https://brave.com/search/api/",
    },
    {
      title: "Anthropic appears to be using Brave to power web search for its Claude chatbot | TechCrunch",
      publisher: "TechCrunch",
      url: "https://techcrunch.com/2025/03/21/anthropic-appears-to-be-using-brave-to-power-web-searches-for-its-claude-chatbot/",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Yes, Claude uses Brave Search for web search. Anthropic&apos;s own subprocessor
        list names Brave Search as its web search provider for all Claude products. For a business, that means two
        things matter: Brave must be able to crawl and index your pages, and Claude&apos;s own bots must be allowed to
        read them.
      </p>

      <p>
        This guide is for owners and marketers who want Claude to find and cite their business. It covers what
        Anthropic and Brave actually publish, what is still unknown, and the checks that make your site findable
        through both.
      </p>

      <h2>What does Anthropic say about Brave Search?</h2>
      <p>
        Anthropic lists Brave Search on the subprocessor page of its{" "}
        <a href="https://trust.anthropic.com/subprocessors" {...ext}>
          Trust Center
        </a>
        , with the purpose given as &quot;Web Search&quot;, the products given as all products, and the location as
        the United States. A subprocessor is a company that processes data on Anthropic&apos;s behalf, so this is
        Anthropic confirming that search queries from Claude are handled by Brave.
      </p>
      <p>
        The listing first drew attention in March 2025.{" "}
        <a
          href="https://techcrunch.com/2025/03/21/anthropic-appears-to-be-using-brave-to-power-web-searches-for-its-claude-chatbot/"
          {...ext}
        >
          TechCrunch reported
        </a>{" "}
        that Brave Search had been added to the list that week, and that programmer Simon Willison found at least one
        search in Claude returned the same citations as the same search on Brave. As of November 2026, Brave is still
        on the list.
      </p>
      <p>
        The same page also lists TurboPuffer for web search, on all products except Claude for Government.
        Anthropic does not explain on that page how the two are used together, so treat Brave as the confirmed
        source of web results and do not assume Brave is the only input into what Claude says.
      </p>

      <h2>How does Claude search the web?</h2>
      <p>
        Claude searches the web by calling a search tool when a question benefits from current information, then
        writing its answer from the pages it found, with citations. Anthropic&apos;s help article{" "}
        <a href="https://support.claude.com/en/articles/10684626-enabling-and-using-web-search" {...ext}>
          Enable and use web search
        </a>{" "}
        says Claude uses the tool to &quot;ground its generated responses with content from the live web&quot; and
        that every response includes citations.
      </p>
      <p>
        The same article describes web fetch: when someone gives Claude a specific URL, it can retrieve the full page
        directly. So there are two routes to your content. A search query goes to the search provider and returns a
        set of results Claude then reads. A pasted link skips the search step and fetches your page directly. Both
        depend on your page being readable. If grounding is a new idea, our explainer on{" "}
        <Link href="/blog/what-is-grounding-in-ai-search">grounding in AI search</Link> covers the basics, and{" "}
        <Link href="/blog/training-data-vs-live-retrieval-ai-search">training data vs live retrieval</Link> explains
        why a model&apos;s built-in knowledge and its live searches can disagree.
      </p>

      <h2>How does Brave find and index websites?</h2>
      <p>
        Brave finds websites with its own crawler and builds its own index rather than renting Google&apos;s or
        Bing&apos;s. Brave&apos;s{" "}
        <a href="https://brave.com/search/api/" {...ext}>
          Search API page
        </a>{" "}
        says it answers every query from its own index, with no pass-through to Google or Bing.
      </p>
      <p>
        Its help page on the{" "}
        <a href="https://search.brave.com/help/brave-search-crawler" {...ext}>
          Brave Search Crawler
        </a>{" "}
        has three details that matter for site owners:
      </p>
      <ul>
        <li>
          <strong>No separate user agent.</strong> Brave&apos;s crawler does not advertise its own name, so you cannot
          allow or block it by name in robots.txt.
        </li>
        <li>
          <strong>It follows Googlebot&apos;s rules.</strong> If a domain or page is not crawlable by Googlebot,
          Brave&apos;s bot will not crawl it either.
        </li>
        <li>
          <strong>Noindex removes pages, robots.txt does not.</strong> Brave says robots.txt is not used to prevent
          indexing; a robots noindex directive is, once Brave re-fetches the page.
        </li>
      </ul>
      <p>
        Brave adds that its crawler is partly powered by the Web Discovery Project, an opt-in setting in the Brave
        browser that shares anonymous browsing signals. The practical upshot is simple: if you block Googlebot from a
        page, you are probably blocking Brave too, and with it one of Claude&apos;s routes to that page.
      </p>

      <h2>Which Claude bots should you allow in robots.txt?</h2>
      <p>
        To stay visible in Claude, allow Claude-SearchBot and Claude-User; blocking ClaudeBot is a separate choice that
        only affects AI training. Anthropic&apos;s help article on{" "}
        <a
          href="https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"
          {...ext}
        >
          how site owners can block its crawlers
        </a>{" "}
        describes three bots.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bot</th>
              <th>What Anthropic says it does</th>
              <th>Effect of blocking it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ClaudeBot</td>
              <td>Collects web content that could contribute to model training</td>
              <td>Your future content is excluded from training datasets</td>
            </tr>
            <tr>
              <td>Claude-SearchBot</td>
              <td>Analyzes content to improve the relevance and accuracy of search responses</td>
              <td>May reduce your visibility and accuracy in Claude search results</td>
            </tr>
            <tr>
              <td>Claude-User</td>
              <td>Fetches pages when a user&apos;s question needs them</td>
              <td>Claude cannot retrieve your page for that user, which may reduce visibility</td>
            </tr>
            <tr>
              <td>Brave&apos;s crawler</td>
              <td>Builds the Brave Search index; no distinct user agent</td>
              <td>Blocking Googlebot also stops Brave from crawling the page</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Anthropic says its bots honor robots.txt and the Crawl-delay extension, and warns that blocking by IP address
        may not work reliably. Our <Link href="/blog/ai-crawlers-robots-txt-guide">guide to AI crawlers and
        robots.txt</Link> has copy-paste rules for every major assistant, and{" "}
        <Link href="/blog/cloudflare-blocking-ai-crawlers">Cloudflare blocking AI crawlers</Link> covers the setting
        that blocks these bots without anyone editing robots.txt.
      </p>

      <h2>How do you check whether Brave can find your business?</h2>
      <p>
        You can check in a few minutes by searching for your business on search.brave.com, because Brave is Claude&apos;s listed web
        search provider. Work through these steps.
      </p>
      <ol>
        <li>
          <strong>Search your brand name.</strong> Type your exact business name and city into Brave Search. Note
          whether your site, your Google profile or a directory comes first.
        </li>
        <li>
          <strong>Search your domain.</strong> Brave supports the site: operator, so &quot;site:yourdomain.com&quot;
          shows which of your pages are in its index. Brave labels its operators experimental, so treat the count as
          a rough guide.
        </li>
        <li>
          <strong>Search a customer question.</strong> Try the question a customer would ask, such as &quot;emergency
          plumber open Sunday in Leeds&quot;, and see which pages Brave returns.
        </li>
        <li>
          <strong>Check your robots rules.</strong> Make sure Googlebot, Claude-SearchBot and Claude-User are not
          disallowed, and that important pages do not carry a noindex tag.
        </li>
        <li>
          <strong>Ask Claude directly.</strong> With web search on, ask Claude the same customer question and look at
          the citations it shows. Compare them with the Brave results from step 3.
        </li>
      </ol>
      <p>
        If a key page is missing from Brave, Brave&apos;s crawler help page links a form to submit pages for
        re-fetching. That asks Brave to look again; it does not promise inclusion.
      </p>

      <h2>What makes Claude more likely to cite your page?</h2>
      <p>
        Claude is more likely to cite a page that is in the search results it reads and that answers the question in
        clear, quotable text. Being indexed only gets you into the pool; the content decides whether you are quoted.
      </p>
      <ul>
        <li>
          <strong>Put the answer first.</strong> Open service and FAQ pages with a direct, specific answer that names
          what you do, where and for whom.
        </li>
        <li>
          <strong>Keep facts in plain text.</strong> Prices, hours, service areas and credentials hidden in images or
          scripts are easy for crawlers to miss.
        </li>
        <li>
          <strong>Match your facts everywhere.</strong> The same name, address, phone and hours on your site, Google
          profile and directories help an engine confirm it has the right business.
        </li>
        <li>
          <strong>Earn mentions on pages Brave ranks.</strong> Directories, local news and review sites often appear
          in Brave results for local questions; being described accurately there matters.
        </li>
      </ul>
      <p>
        Our full guide to <Link href="/blog/how-to-get-recommended-by-claude">how to get recommended by Claude</Link>{" "}
        goes further, and <Link href="/blog/does-chatgpt-use-bing">does ChatGPT use Bing</Link> covers the matching
        question for ChatGPT, which relies on a different set of search providers.
      </p>

      <h2>What is still unknown about Claude and Brave?</h2>
      <p>
        Anthropic has not published how Claude chooses which Brave results to read, how many it reads or how it
        weighs them, so any claim of a precise &quot;Claude ranking formula&quot; is guesswork. What is published is
        enough to act on: Brave is a listed web search provider, Claude&apos;s answers cite their sources, and
        Anthropic&apos;s bots respect robots.txt.
      </p>
      <p>
        It is also worth remembering that Claude answers some questions from what it learned in training, without
        searching at all. Improving your public information helps both routes over time, but neither Brave nor
        Anthropic offers a way to buy or request a placement in Claude&apos;s answers.
      </p>

      <h2>What else do people ask about Claude and Brave Search?</h2>

      <h3>Does Claude use Google or Bing for web search?</h3>
      <p>
        Anthropic&apos;s subprocessor list names Brave Search and TurboPuffer for web search, not Google or Bing.
        Brave says its API answers queries from its own index without passing them to Google or Bing.
      </p>

      <h3>Can I block Brave from crawling my site in robots.txt?</h3>
      <p>
        Not by name, because Brave&apos;s crawler does not use a distinct user agent. Brave says it will not crawl a
        page that Googlebot is blocked from, and it uses the noindex directive, not robots.txt, to remove pages from
        its index.
      </p>

      <h3>If I block ClaudeBot, will Claude stop recommending my business?</h3>
      <p>
        Blocking ClaudeBot only signals that your content should be left out of AI training, according to Anthropic.
        Claude-SearchBot and Claude-User are separate bots, and Anthropic says blocking those may reduce your
        visibility in Claude&apos;s search results.
      </p>

      <h3>Does Claude always search the web before answering?</h3>
      <p>
        No, Claude searches when a question benefits from current information, and answers others from its training.
        Anthropic&apos;s help center says that when Claude does search, every response includes citations.
      </p>

      <h3>How can I see what Claude says about my business?</h3>
      <p>
        Ask Claude the questions your customers ask, with web search on, and check which businesses and sources it
        cites. Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> runs that for Claude, ChatGPT, Gemini
        and Perplexity at once.
      </p>
    </div>
  )
}
