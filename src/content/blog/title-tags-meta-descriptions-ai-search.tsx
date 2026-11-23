import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "title-tags-meta-descriptions-ai-search",
  title: "Title Tags and Meta Descriptions for AI Search (2026)",
  description:
    "Do title tags and meta descriptions still matter for AI search? What Google and OpenAI say, what AI engines read instead, and how to write both in 2026.",
  subtitle:
    "Title tags and meta descriptions still matter for AI search because they help search systems find and label a page, but AI answers are written from your visible page text, so the title must name the page plainly and the facts must live in the body.",
  date: "2026-11-23",
  updated: "2026-11-23",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "title tags and meta descriptions for ai search",
  takeaways: [
    "Google says there are no special optimizations needed for AI Overviews or AI Mode beyond normal SEO best practices.",
    "Google builds title links from the title element, headings and prominent text, and can fall back to anchor text from other sites.",
    "Google says snippets come primarily from page content and only sometimes from the meta description.",
    "ChatGPT search rewrites questions into search queries and runs them through third-party search providers.",
    "Write a unique, plain title per page and put every fact you want quoted in visible body text, not only in meta tags.",
  ],
  sources: [
    {
      title: "Influencing Title Links in Google Search",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/title-link",
    },
    {
      title: "How to Write Meta Descriptions",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/snippet",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "Searching the web with ChatGPT | OpenAI Help Center",
      publisher: "OpenAI",
      url: "https://help.openai.com/en/articles/9237897-chatgpt-search",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Title tags and meta descriptions for AI search still matter, but less than most
        SEO advice suggests. They help search systems find and label your page before an AI engine reads it. The
        answer itself is written from your visible text, so name each page plainly in its title and put the facts you
        want quoted in the body.
      </p>

      <p>
        This guide is for owners and marketers who keep being told to &quot;optimize meta tags for ChatGPT&quot;. It
        covers what Google and OpenAI actually say, where titles and descriptions still earn their keep, and a simple
        way to write both.
      </p>

      <h2>Do title tags and meta descriptions affect AI search at all?</h2>
      <p>
        Yes, they affect AI search indirectly, because most AI answers that cite the web start with an ordinary search
        step, and titles and descriptions shape how a page is found and labelled in that step. They do not decide what
        the AI says about you; the page body does.
      </p>
      <p>
        Google is direct about this. Its page{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        says there are no additional requirements to appear in AI Overviews or AI Mode, nor other special
        optimizations, and that you do not need new machine-readable files or special schema. The same foundational
        SEO practices apply, and a good title is one of the oldest of those.
      </p>
      <p>
        ChatGPT works in a similar two-stage way. OpenAI&apos;s help page,{" "}
        <a href="https://help.openai.com/en/articles/9237897-chatgpt-search" {...ext}>
          Searching the web with ChatGPT
        </a>
        , explains that ChatGPT may rewrite a question into a search query, giving the example of &quot;What are some
        good restaurants near me?&quot; becoming &quot;top restaurants San Francisco&quot;, and that it sends those
        queries to third-party search providers. Whatever the provider returns, a page title and a short description
        are usually the first things any search result carries. Our guide on{" "}
        <Link href="/blog/does-chatgpt-use-bing">whether ChatGPT uses Bing</Link> covers the provider side in more
        detail.
      </p>

      <h2>How does Google decide the title it shows for a page?</h2>
      <p>
        Google builds the title link from several sources, with the HTML title element as the main one, so a clear
        title is still the strongest signal you control. Its guide,{" "}
        <a href="https://developers.google.com/search/docs/appearance/title-link" {...ext}>
          Influencing Title Links in Google Search
        </a>
        , says it also looks at the main visual title, heading elements and other prominent text.
      </p>
      <p>
        The same page asks for descriptive, concise titles, warns against keyword stuffing and repeated boilerplate,
        and says each page needs distinct title text. If Google cannot read a page, it may fall back on off-page text
        such as the anchor text other sites use to link to it. That last point matters for AI too: if your title is
        vague, other people&apos;s descriptions of your page start to stand in for your own.
      </p>

      <h2>Does Google use your meta description in AI answers?</h2>
      <p>
        Not reliably: Google says it primarily uses page content to create snippets and only sometimes uses the meta
        description, when that describes the page better than the page text does. That is from its own guide,{" "}
        <a href="https://developers.google.com/search/docs/appearance/snippet" {...ext}>
          How to Write Meta Descriptions
        </a>
        .
      </p>
      <p>
        Google also says snippets are chosen to match each specific search, so one page can show different snippets
        for different queries. An AI answer goes further still: it pulls sentences from the page, combines them with
        other sources and rewrites them. A fact that appears only in your meta description, such as your price range
        or service area, is invisible to that process. Treat the description as a label for people scanning results,
        not as a place to store information.
      </p>

      <h2>What do AI engines read instead of your meta tags?</h2>
      <p>
        AI engines mainly read the visible text of your page: headings, paragraphs, lists, tables and the answers to
        questions. They also use structured data and what other sites say about you, but the body text is where a
        quotable sentence has to live.
      </p>
      <ul>
        <li>
          <strong>Your H1 and H2 headings.</strong> Question-shaped headings followed by a direct answer give an engine
          a ready-made passage to lift.
        </li>
        <li>
          <strong>The first paragraph.</strong> A short, plain answer near the top is the easiest thing on a page to
          quote.
        </li>
        <li>
          <strong>Concrete facts in sentences.</strong> Prices, hours, service areas and credentials written as text,
          not hidden in images or tabs.
        </li>
        <li>
          <strong>Structured data.</strong> Schema helps confirm facts, as our guide to{" "}
          <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> explains, though Google says
          none is required.
        </li>
        <li>
          <strong>Text that renders without scripts.</strong> Some AI crawlers do not run JavaScript, which our guide
          to <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link> covers.
        </li>
      </ul>

      <h2>How should title tags and meta descriptions differ for AI search?</h2>
      <p>
        For AI search, the title should name the page&apos;s subject the way a customer would ask about it, and the
        description should summarise the page honestly rather than carry facts the body lacks. This table sets the two
        side by side.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Element</th>
              <th>What Google says it does</th>
              <th>What to do for AI search</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Title element</td>
              <td>Main source for the title link, alongside headings and prominent text</td>
              <td>One unique, plain title per page that names the service, product or question</td>
            </tr>
            <tr>
              <td>H1 heading</td>
              <td>Also used when Google builds title links</td>
              <td>Match the title&apos;s meaning so every signal points the same way</td>
            </tr>
            <tr>
              <td>Meta description</td>
              <td>Sometimes used for the snippet; page content comes first</td>
              <td>A one-sentence summary for people; repeat nothing that is missing from the body</td>
            </tr>
            <tr>
              <td>Body text</td>
              <td>Primary source of snippets</td>
              <td>Put every fact you want an AI to quote here, in full sentences</td>
            </tr>
            <tr>
              <td>Anchor text from other sites</td>
              <td>A fallback when Google cannot read the page</td>
              <td>Make the title clear enough that others describe the page the same way</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How do you write title tags and meta descriptions for AI search?</h2>
      <p>
        Write them in five steps, starting with the question the page answers. The goal is a title a customer would
        recognise as their own question and a description that previews a body which already contains the answer.
      </p>
      <ol>
        <li>
          <strong>Name the question or service.</strong> Write down the one thing the page is about, in customer
          words: &quot;emergency plumber in Ottawa&quot;, not &quot;Solutions | Home&quot;.
        </li>
        <li>
          <strong>Put that first in the title.</strong> Lead with the subject, add your brand after a separator, and
          keep it short enough that the main words survive truncation.
        </li>
        <li>
          <strong>Make every title unique.</strong> Google calls out repeated titles across a site; a unique title per
          page also stops an AI from confusing your service pages with each other.
        </li>
        <li>
          <strong>Write a one-sentence description.</strong> Say what the page covers and who it is for. Google notes
          that a description can list factual details, such as an author or date, but only ones the page itself
          supports.
        </li>
        <li>
          <strong>Move the facts into the body.</strong> Check that every claim in the title and description is
          stated in visible text on the page, ideally in the first paragraph.
        </li>
      </ol>
      <p>
        For page-type specifics, see our guides to a{" "}
        <Link href="/blog/homepage-for-ai-search">homepage for AI search</Link> and a{" "}
        <Link href="/blog/service-page-for-ai-search">service page for AI search</Link>.
      </p>

      <h2>What title and meta description mistakes hurt AI visibility?</h2>
      <p>
        The mistakes that hurt most are vague or duplicated titles and descriptions that promise facts the page never
        states. Each one makes it harder for a search step to pick the right page, or for an AI to find a sentence to
        quote.
      </p>
      <ul>
        <li>
          <strong>Generic titles</strong> such as &quot;Home&quot;, &quot;Services&quot; or the same brand name on
          every page.
        </li>
        <li>
          <strong>Keyword lists</strong> instead of a readable title, which Google explicitly warns against.
        </li>
        <li>
          <strong>Facts only in the description</strong>, such as prices or areas served, with nothing in the body to
          quote.
        </li>
        <li>
          <strong>A title and H1 that disagree</strong>, so Google and AI engines get mixed signals about the subject.
        </li>
        <li>
          <strong>Blocking the page</strong> from search crawlers, which leaves engines to describe it from
          other sites&apos; links.
        </li>
      </ul>
      <p>
        If you are not sure how your pages look to the assistants, the{" "}
        <Link href="/start">free 60-second AI check</Link> shows what ChatGPT, Gemini, Claude and Perplexity currently
        say about your business.
      </p>

      <h2>What else do people ask about meta tags and AI search?</h2>

      <h3>Should I write my meta description for ChatGPT?</h3>
      <p>
        No, write it for the person scanning search results, because ChatGPT builds its answers from page content
        rather than from the description. A clear summary still helps the search step that comes first.
      </p>

      <h3>Is there a special meta tag for AI Overviews?</h3>
      <p>
        No, Google says there are no special optimizations or markup needed for AI Overviews or AI Mode. The controls
        it does document, such as nosnippet and max-snippet, limit how much of your page can appear rather than
        promote it.
      </p>

      <h3>How long should a title tag be for AI search?</h3>
      <p>
        There is no fixed length, and Google says titles are truncated to fit the device width rather than cut at a
        set character count. Keep the main subject in the first few words so it survives truncation everywhere.
      </p>

      <h3>Do meta keywords help with AI search?</h3>
      <p>
        No, nothing in Google&apos;s or OpenAI&apos;s documentation suggests a keywords tag plays any role in AI
        answers. Spend the time on clear headings and answer-first paragraphs instead.
      </p>

      <h3>Can a good title get my business recommended by AI?</h3>
      <p>
        A good title alone will not get you recommended, because AI engines weigh what the page says and what other
        sources say about you. It does make the right page easier to find, which is the first step.
      </p>
    </div>
  )
}
