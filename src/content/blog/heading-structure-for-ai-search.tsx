import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "heading-structure-for-ai-search",
  title: "Heading Structure for AI Search: A Practical Guide",
  description:
    "How to write headings for AI search: what Google actually says about H1 to H6, why question H2s with direct answers get quoted, and a page outline to copy.",
  subtitle:
    "Good heading structure for AI search means one clear H1, H2s phrased as the questions customers ask, each followed by a sentence that answers it, and H3s that nest under them in order, because that makes every section easy to find, lift and quote.",
  date: "2026-11-24",
  updated: "2026-11-24",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "heading structure for ai search",
  takeaways: [
    "Google says heading order does not matter to Google Search, but semantic order helps screen readers and other software read a page.",
    "Google says there are no additional requirements or special optimizations needed to appear in AI Overviews or AI Mode.",
    "AI search tools split one question into several searches, so a heading that names one sub-question gives them a section to match.",
    "The sentence straight after a heading matters most, because it is the easiest part of a section to quote whole.",
    "W3C advises nesting headings by rank and not jumping from an H2 straight to an H4.",
  ],
  sources: [
    {
      title: "SEO Starter Guide: The Basics",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "Headings | Web Accessibility Initiative (WAI) | W3C",
      publisher: "W3C",
      url: "https://www.w3.org/WAI/tutorials/page-structure/headings/",
    },
    {
      title: "<h1>–<h6> HTML section heading elements - HTML | MDN",
      publisher: "MDN Web Docs",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements",
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
        <strong>Short answer:</strong> The best heading structure for AI search is one H1 that names the page, H2s
        written as the questions customers ask, and a first sentence under each H2 that answers it directly. Nest H3s
        in order beneath them. There is no magic markup; headings help AI because they turn a page into findable,
        quotable answers.
      </p>

      <p>
        This guide is for small business owners, marketers and developers editing their own pages. It separates what
        Google and the web standards bodies actually say about headings from the folklore, then gives you an outline
        and a checklist you can apply to a page today.
      </p>

      <h2>Do headings matter for AI search?</h2>
      <p>
        Yes, headings matter for AI search, but as structure for readers and software rather than as a ranking switch.
        A heading tells a reader, a screen reader or an AI tool what the next section is about, which makes it easier to
        find the part of a page that answers a given question.
      </p>
      <p>
        Google is blunt that there is no special trick. Its page on{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features and your website
        </a>{" "}
        says there are no additional requirements to appear in AI Overviews or AI Mode, nor other special optimizations
        necessary, and that the usual SEO basics still apply, including making sure important content is available in
        textual form. Its{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" {...ext}>
          SEO Starter Guide
        </a>{" "}
        recommends breaking up long content into paragraphs and sections, with headings to help users navigate. That is
        the whole official position: write for people, and organise the page so it is easy to follow.
      </p>

      <h2>What does Google say about heading order and H1 tags?</h2>
      <p>
        Google says the number and order of headings do not matter to Google Search: semantic order is good for screen
        readers, but Google does not depend on it, and there is no ideal number of headings for a page. That claim sits
        in the SEO Starter Guide&apos;s list of things not to worry about.
      </p>
      <p>
        So a page will not be penalised for an H3 that comes before an H2. That does not make order pointless. The{" "}
        <a href="https://www.w3.org/WAI/tutorials/page-structure/headings/" {...ext}>
          W3C headings tutorial
        </a>{" "}
        says headings communicate the organisation of a page, that browsers and assistive technology use them for
        in-page navigation, and that skipping ranks, such as an H2 followed directly by an H4, should be avoided where
        possible.{" "}
        <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements" {...ext}>
          MDN&apos;s heading reference
        </a>{" "}
        adds that user agents can build a table of contents from headings, that you should not use a heading just to
        make text bigger, and that a page should generally have a single H1. Clean order costs nothing, helps real
        users and leaves no doubt for any software parsing the page.
      </p>

      <h2>Why do question-shaped H2s help AI engines?</h2>
      <p>
        Question-shaped H2s help because AI search tools break a request into smaller searches, and a heading that
        names one of those sub-questions gives them a section that clearly matches. The heading becomes a label for the
        answer underneath it.
      </p>
      <p>
        Both Google and OpenAI describe this behaviour. Google says AI Overviews and AI Mode may use a &quot;query
        fan-out&quot; technique, issuing multiple related searches across subtopics to build a response. OpenAI&apos;s
        page on{" "}
        <a href="https://help.openai.com/en/articles/9237897-chatgpt-search" {...ext}>
          searching the web with ChatGPT
        </a>{" "}
        says ChatGPT typically rewrites your question into one or more targeted queries for its search partners. Our
        explainer on <Link href="/blog/what-is-query-fan-out">query fan-out</Link> covers the mechanism. In practice, a
        customer asking &quot;who fixes heat pumps in Ottawa and what does it cost?&quot; produces separate searches
        about the service, the area and the price. A page with H2s like &quot;How much does a heat pump repair
        cost?&quot; and &quot;Which areas do we serve?&quot; has a section ready for each one; a page with headings
        like &quot;Our Approach&quot; and &quot;Learn More&quot; does not.
      </p>
      <p>
        Vague labels tell neither a person nor a machine what follows, so replace them first.
      </p>

      <h2>What should the first sentence under a heading say?</h2>
      <p>
        The first sentence under a heading should answer the heading&apos;s question completely, in words that still
        make sense if someone quotes that sentence on its own. Context, caveats and detail can follow in the next
        sentences.
      </p>
      <p>
        This is the single change that does the most work, because the sentence nearest the heading is the easiest to
        lift. Compare two answers to &quot;How long does a roof replacement take?&quot;. A weak one starts &quot;Great
        question! Every roof is different, and there are many factors...&quot;. A strong one starts &quot;Most roof
        replacements on a single-family home take one to three days, depending on size, weather and the material you
        choose.&quot; Only the second can be quoted as an answer. Use your own real figures, not ours; the point is the
        shape. Our guide on <Link href="/blog/how-to-write-content-ai-quotes">writing content AI quotes</Link> goes
        further into answer-first paragraphs.
      </p>

      <h2>How do you build a heading outline step by step?</h2>
      <p>
        Building a good outline takes six steps, starting with the questions your customers actually ask and ending
        with a check that every heading has a real answer under it.
      </p>
      <ol>
        <li>
          <strong>Collect real questions.</strong> Pull them from calls, emails, reviews, Google&apos;s &quot;People
          also ask&quot; box and the questions you type into ChatGPT about your own business.
        </li>
        <li>
          <strong>Write one H1 that names the page.</strong> Match it to the page title so a reader and a crawler agree
          on what the page is about.
        </li>
        <li>
          <strong>Turn each main question into an H2.</strong> Use the customer&apos;s words, one question per heading,
          in the order a customer would ask them.
        </li>
        <li>
          <strong>Answer in the first sentence.</strong> Put the direct answer straight after the H2, then support it.
        </li>
        <li>
          <strong>Use H3s only for sub-questions.</strong> Nest them under the H2 they belong to and never jump from an
          H2 to an H4.
        </li>
        <li>
          <strong>Test the skeleton.</strong> Read only the headings and first sentences. If that skim answers the
          main questions, the structure works.
        </li>
      </ol>

      <h2>What does a good heading structure look like?</h2>
      <p>
        A good structure reads like a short interview with the business: each heading is a customer question and each
        first sentence is the answer. The table below shows a service page before and after.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Level</th>
              <th>Before (vague labels)</th>
              <th>After (customer questions)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>H1</td>
              <td>Welcome</td>
              <td>Furnace Repair in Kanata and West Ottawa</td>
            </tr>
            <tr>
              <td>H2</td>
              <td>Our Services</td>
              <td>Which furnace problems do you repair?</td>
            </tr>
            <tr>
              <td>H3</td>
              <td>Details</td>
              <td>Do you repair high-efficiency furnaces?</td>
            </tr>
            <tr>
              <td>H2</td>
              <td>Pricing</td>
              <td>How much does a furnace repair cost?</td>
            </tr>
            <tr>
              <td>H2</td>
              <td>Coverage</td>
              <td>Which areas do you serve, and how fast can you come?</td>
            </tr>
            <tr>
              <td>H2</td>
              <td>FAQ</td>
              <td>What else do customers ask about furnace repair?</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The example business is invented to show the shape. The same pattern works for a{" "}
        <Link href="/blog/service-page-for-ai-search">service page</Link>, a homepage or a blog post, and it pairs
        naturally with an FAQ section, as our guide to{" "}
        <Link href="/blog/do-faq-pages-work-for-ai-search">FAQ pages for AI search</Link> explains.
      </p>

      <h2>Which heading mistakes hurt AI visibility?</h2>
      <p>
        The mistakes that hurt are the ones that hide meaning: vague labels, headings with no answer under them, and
        text that only looks like a heading. Each makes a section harder for people and software to match to a
        question.
      </p>
      <ul>
        <li>
          <strong>Styled text instead of real headings.</strong> Bold paragraphs sized up with CSS are not headings in
          the HTML, so nothing can navigate by them. MDN warns against the reverse too: do not use heading tags just to
          resize text.
        </li>
        <li>
          <strong>Headings inside images or banners.</strong> Text baked into an image is not text on the page. Google
          asks for important content in textual form.
        </li>
        <li>
          <strong>Headings that load only with JavaScript.</strong> Some AI crawlers do not run scripts, which our
          guide to <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>{" "}
          covers.
        </li>
        <li>
          <strong>One heading, many topics.</strong> A section that covers price, area and warranty under one label
          answers none of those questions cleanly.
        </li>
        <li>
          <strong>Keyword stuffing.</strong> Repeating the same phrase in every heading reads badly and adds nothing a
          reader can use.
        </li>
      </ul>

      <h2>How do you check your current heading structure?</h2>
      <p>
        You can check your headings in a few minutes with free tools: view the page&apos;s outline, then read the
        headings alone and ask whether they answer your customers&apos; main questions.
      </p>
      <p>
        In Chrome, a free accessibility or SEO extension that lists headings will show the outline; you can also search
        the page source for {"<h1"}, {"<h2"} and {"<h3"}. Look for exactly one H1, no skipped levels, no empty headings,
        and no section titles that are really styled paragraphs. Then compare the headings with your page title and
        meta description, which our guide to{" "}
        <Link href="/blog/title-tags-meta-descriptions-ai-search">title tags and meta descriptions for AI search</Link>{" "}
        covers. Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> runs a 23-point check of what
        assistants can read on your site and shows what ChatGPT, Gemini, Claude and Perplexity currently say about your business. Better
        headings make your answers easier to find; they cannot guarantee that any assistant will quote you.
      </p>

      <h2>What else do people ask about headings and AI search?</h2>

      <h3>Should every heading be a question?</h3>
      <p>
        No, but most H2s on an informational or service page work better as questions, because they match how people
        ask AI tools. Your H1 and short navigation sections can stay as plain labels.
      </p>

      <h3>Is it bad to have more than one H1?</h3>
      <p>
        It is not a Google penalty, but MDN says a page should generally have a single H1, and one clear H1 removes any
        doubt about the page&apos;s topic. Most site builders already make the page title the H1.
      </p>

      <h3>How many headings should a page have?</h3>
      <p>
        There is no ideal number, and Google says so directly. Use one H2 for each distinct question the page answers,
        and stop when the questions run out.
      </p>

      <h3>Do H3s and H4s matter for AI search?</h3>
      <p>
        H3s matter when a main question has real sub-questions, because they keep each answer in its own labelled
        section. H4s are rarely needed on a business page, and W3C advises against jumping to them from an H2.
      </p>

      <h3>Does schema markup replace good headings?</h3>
      <p>
        No, structured data and headings do different jobs, and Google says no special schema is needed for its AI
        features. Our guide to <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>{" "}
        explains where structured data still helps.
      </p>
    </div>
  )
}
