import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-google-ai-overviews-choose-sources",
  title: "How Google AI Overviews Choose Sources (2026 Guide)",
  description:
    "How Google AI Overviews choose sources: query fan-out, the two eligibility rules Google publishes, what schema does and does not do, and how to check citations.",
  subtitle:
    "Google AI Overviews pick sources by running many related searches at once and linking pages that are indexed, snippet-eligible and directly answer a sub-question.",
  date: "2026-10-05",
  updated: "2026-10-05",
  readMins: 8,
  tag: "Guide",
  kind: "guide",
  keyphrase: "how google ai overviews choose sources",
  image: {
    src: "/blog/how-google-ai-overviews-choose-sources.webp",
    alt: "A single beam of light passing through a glass prism and fanning out into many thin rays across a pale surface.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI Overviews use query fan-out: Google runs multiple related searches and builds one answer from the results.",
    "Google publishes two eligibility rules: the page must be indexed and able to show a snippet in Search.",
    "Google says no special schema, AI text file or extra markup is needed to appear in AI Overviews.",
    "Search Console reports generative AI impressions for AI Overviews and AI Mode, without clicks or queries.",
    "The snippet controls nosnippet and max-snippet also limit what AI Overviews can show from a page.",
  ],
  sources: [
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "AI Mode in Google Search: Updates from Google I/O 2025", publisher: "Google", url: "https://blog.google/products/search/google-search-ai-mode-update/" },
    { title: "Top ways to ensure your content performs well in Google's AI experiences on Search", publisher: "Google Search Central Blog", url: "https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search" },
    { title: "Generative AI performance report (Search)", publisher: "Google Search Console Help", url: "https://support.google.com/webmasters/answer/16984139" },
    { title: "Creating Helpful, Reliable, People-First Content", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about
          local businesses. This guide sticks to what Google has published about its own system.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Google AI Overviews choose sources by running several related searches
        behind your one query, a technique Google calls query fan-out, then linking pages from those results that
        support the answer. To be eligible a page only has to be indexed and able to show a snippet. No special
        markup or file is required.
      </p>

      <p>
        Most advice on this topic is guesswork dressed up as a ranking-factor list. Google has actually documented
        the outline of how it works, and the documented version is simpler and more useful than the folklore. This
        guide walks through it and marks clearly where Google stops explaining.
      </p>

      <h2>How do Google AI Overviews choose which sources to show?</h2>
      <p>
        AI Overviews choose sources from normal Google Search results, gathered across several searches instead of
        one. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          documentation on AI features
        </a>{" "}
        says AI Overviews and AI Mode may issue multiple related searches across subtopics and data sources to
        develop a response, and that this lets them show a wider and more diverse set of helpful links than a
        classic results page.
      </p>
      <p>
        In plain terms there are three stages. The system breaks the question into parts. It searches for each
        part using the same index and ranking systems as ordinary Search. Then a Gemini model writes the summary
        and attaches links to pages that back up what it wrote. Google has not published how the final links are
        chosen from the candidates, and anyone who gives you a precise formula for that last step is inventing it.
      </p>

      <h2>What is query fan-out and why does it change who gets cited?</h2>
      <p>
        Query fan-out is Google&apos;s name for turning one question into many searches at the same time. In its{" "}
        <a href="https://blog.google/products/search/google-search-ai-mode-update/" {...ext}>
          May 2025 announcement
        </a>{" "}
        Google described it as breaking your question into subtopics and issuing a multitude of queries
        simultaneously on your behalf.
      </p>
      <p>
        This matters because the page that gets cited does not have to rank for the words the person typed. Take
        &quot;best family dentist near me that takes nervous patients&quot;. The system may look separately for
        family dentists in the area, for sedation options, for what patients say in reviews, and for opening
        hours. A practice with a clear page on treating anxious patients can be picked up by that one sub-search
        even if it is nowhere near the top for &quot;best family dentist&quot;.
      </p>
      <p>
        The consequence is that narrow, specific pages have more ways in than they did with ten blue links. A page
        that answers one sub-question completely is a better candidate than a long page that touches ten of them
        lightly.
      </p>

      <h2>What makes a page eligible to be a source?</h2>
      <p>
        A page is eligible if it is indexed and can be shown in Google Search with a snippet. Those are the only
        two technical requirements Google states, and it adds that there are no additional requirements to appear
        in AI Overviews or AI Mode.
      </p>
      <ul>
        <li>
          <strong>Indexed.</strong> Google has to have crawled and stored the page. A page blocked in robots.txt,
          marked noindex or never discovered cannot be a source.
        </li>
        <li>
          <strong>Snippet-eligible.</strong> Google must be allowed to show text from the page. A{" "}
          <code>nosnippet</code> rule removes the page from consideration as quoted support.
        </li>
        <li>
          <strong>Within Search policies.</strong> The same spam and content policies that apply to ordinary
          results apply here.
        </li>
      </ul>
      <p>
        Eligible is not the same as chosen. Google is explicit that meeting every requirement does not mean a page
        will be crawled, indexed or served. Eligibility gets you into the pool; usefulness for a specific
        sub-question gets you picked.
      </p>

      <h2>Do you need schema markup or an llms.txt file to appear?</h2>
      <p>
        No. Google says you do not need to create new machine-readable files, AI text files or markup to appear in
        these features, and that there is no special schema.org structured data to add. That is a direct statement
        from the documentation, and it rules out a lot of what is sold as AI Overview optimization.
      </p>
      <p>
        Structured data still has a job. In its post on{" "}
        <a href="https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search" {...ext}>
          performing well in AI experiences
        </a>
        , Google asks site owners to make sure structured data matches the visible content on the page. Markup
        helps Google understand a page it already wants to use; it is not a ticket in. We cover what is worth
        adding in <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>. An llms.txt
        file is a separate matter: it can help other assistants navigate your site, as described in{" "}
        <Link href="/blog/how-to-create-llms-txt-file">how to create an llms.txt file</Link>, but Google does not
        use it for AI Overviews.
      </p>

      <h2>How do you make a page easier to pick as a source?</h2>
      <p>
        You make a page easier to pick by letting it answer one specific question completely, in text Google can
        read and quote. None of the steps below is a trick. They follow from fan-out and from Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>
          guidance on helpful, people-first content
        </a>
        .
      </p>
      <ol>
        <li>
          <strong>Confirm the page is indexed.</strong> Use URL Inspection in Search Console. If it is not
          indexed, nothing else on this list matters yet.
        </li>
        <li>
          <strong>Check you have not blocked snippets.</strong> Look for <code>nosnippet</code> or a very low{" "}
          <code>max-snippet</code> value in your meta robots tag. Some themes and SEO plugins set these without
          telling you.
        </li>
        <li>
          <strong>List the sub-questions behind your main query.</strong> For a service business these are usually
          price, area served, availability, qualifications and what happens during the job.
        </li>
        <li>
          <strong>Give each sub-question its own clear answer.</strong> A heading that states the question and a
          first sentence that answers it. Put real figures, places and conditions in the answer.
        </li>
        <li>
          <strong>Keep the answer in the HTML.</strong> Text that only appears after a script runs, inside an
          image or behind a tab is harder for any system to quote.
        </li>
        <li>
          <strong>Say something only you can say.</strong> Google&apos;s advice is to focus on unique,
          non-commodity content rather than restating what every other page says. Your own prices, process and local detail are that
          content.
        </li>
        <li>
          <strong>Keep business facts consistent.</strong> For local queries Google also draws on your Business
          Profile, so hours, services and address should match your site. See{" "}
          <Link href="/blog/google-business-profile-ai-answers">how your Business Profile feeds AI answers</Link>.
        </li>
      </ol>
      <p>
        The writing side of this is covered in detail in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI quotes</Link>.
      </p>

      <h2>How is AI Mode different from AI Overviews?</h2>
      <p>
        AI Mode uses the same fan-out approach as AI Overviews but runs it further, in a separate conversational
        tab. Google says both are powered by a custom version of Gemini 2.5, and that its Deep Search feature in
        AI Mode can issue hundreds of searches to build a fully cited report.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>What</th>
              <th>AI Overviews</th>
              <th>AI Mode</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Where it appears</td>
              <td>Above or within normal results</td>
              <td>Its own tab, as a conversation</td>
            </tr>
            <tr>
              <td>Who triggers it</td>
              <td>Google decides per query</td>
              <td>The user chooses it</td>
            </tr>
            <tr>
              <td>Fan-out depth</td>
              <td>Multiple related searches</td>
              <td>More searches; hundreds in Deep Search</td>
            </tr>
            <tr>
              <td>Eligibility rules</td>
              <td>Indexed and snippet-eligible</td>
              <td>The same</td>
            </tr>
            <tr>
              <td>Search Console reporting</td>
              <td>Counted in Performance, Web search type</td>
              <td>The same</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        For a site owner the practical point is that you do not optimize for them separately. One eligible, clearly
        written page serves both.
      </p>

      <h2>How can you see whether AI Overviews cite your site?</h2>
      <p>
        You can see it in Google Search Console, with limits. Google&apos;s{" "}
        <a href="https://support.google.com/webmasters/answer/16984139" {...ext}>
          generative AI performance report
        </a>{" "}
        shows how many times links to your site were shown in AI Overviews and AI Mode, and which pages earned
        those impressions. It reports impressions only. It does not give clicks, position or the queries involved,
        and Google says not every site has access yet.
      </p>
      <p>
        Traffic from these features is also included in the main Performance report under the Web search type,
        mixed in with ordinary results. For anything more specific you have to run the searches yourself and note
        which pages are linked, repeating it over several days because the answer and its links change. Our guide
        to <Link href="/blog/how-to-measure-ai-visibility">measuring AI visibility</Link> sets out a method.
      </p>
      <p>
        One honest note about our own product: Alphaa checks ChatGPT, Gemini, Claude and Perplexity. It does not
        track Google AI Overviews or AI Mode, so for those two Search Console and manual checks are the tools.
      </p>

      <h2>Can you stop AI Overviews using your content?</h2>
      <p>
        Yes, with the same controls that limit snippets in Search. Google lists <code>nosnippet</code>,{" "}
        <code>data-nosnippet</code>, <code>max-snippet</code> and <code>noindex</code> as the ways to restrict what
        is shown from your pages in AI features.
      </p>
      <p>
        There is no switch that removes you from AI Overviews while keeping full snippets in ordinary results.
        Google points to its separate Google-Extended control for limiting AI training and grounding in some of its
        other systems, which is not a control for AI features in Search. For most businesses opting out is the wrong move anyway. AI Overviews now
        appear in up to about 48% of commercial-intent searches (BrightEdge, 2026), and a link there is one of the
        few ways left to be seen on those pages. The wider picture of who each crawler is and what blocking it
        costs is in <Link href="/blog/ai-crawlers-robots-txt-guide">AI crawlers and robots.txt</Link>.
      </p>

      <h2>What should a local business do first?</h2>
      <p>
        Start by checking that your main service pages are indexed and not blocking snippets, then write one clear
        answer for each question a customer asks before booking. That covers the two published requirements and
        the one thing fan-out rewards.
      </p>
      <p>
        After that the work is the same as for any AI assistant: accurate public facts, specific pages, consistent
        listings. Our guide to{" "}
        <Link href="/blog/google-ai-overviews-local-business">showing up in AI Overviews as a local business</Link>{" "}
        goes through the local signals, and the <Link href="/start">free 60-second check</Link> shows what
        ChatGPT, Gemini, Claude and Perplexity currently say about you.
      </p>

      <h2>What else do people ask about AI Overview sources?</h2>

      <h3>Do AI Overviews only cite pages that rank on page one?</h3>
      <p>
        No, not necessarily. Because of query fan-out, a page can be picked up by one of the related searches
        Google runs even when it does not rank well for the words the person actually typed.
      </p>

      <h3>Does Google use different ranking for AI Overviews?</h3>
      <p>
        Google says AI Overviews draw on its core Search systems and that normal SEO best practices still apply.
        It has not published a separate set of ranking factors for choosing the links inside an overview.
      </p>

      <h3>How many sources does an AI Overview show?</h3>
      <p>
        It varies by query and Google has not published a fixed number. The links shown can also differ between
        two people asking the same thing, or for the same person a day apart.
      </p>

      <h3>Will being cited in an AI Overview bring traffic?</h3>
      <p>
        Sometimes, though many people read the summary and stop. Roughly two-thirds of Google searches now end
        without a click to a website (SparkToro/Similarweb, 2026), so treat a citation as visibility first and
        visits second.
      </p>

      <h3>Does paying for Google Ads help you appear in AI Overviews?</h3>
      <p>
        No. The links in an AI Overview come from organic Search systems, and advertising spend is not an input.
        We go through the evidence in{" "}
        <Link href="/blog/do-paid-ads-affect-ai-recommendations">whether paid ads affect AI recommendations</Link>.
      </p>
    </div>
  )
}
