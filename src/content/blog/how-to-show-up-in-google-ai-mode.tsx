import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-to-show-up-in-google-ai-mode",
  title: "How to Show Up in Google AI Mode (2026 Guide)",
  description:
    "Google says AI Mode needs no special markup, but it picks sources by query fan-out. What to publish, which pages get cited and how to measure it.",
  subtitle:
    "You show up in Google AI Mode by being indexed, answering the sub-questions AI Mode fans out to, and making each answer liftable in the first lines of a page Google can read.",
  date: "2026-10-06",
  updated: "2026-10-06",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "how to show up in google ai mode",
  image: {
    src: "/blog/how-to-show-up-in-google-ai-mode.webp",
    alt: "A clear glass prism on a pale surface splitting one beam of light into several thin beams that fan out across the table.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Google states there are no additional requirements or special optimisations to appear in AI Mode or AI Overviews.",
    "AI Mode uses query fan-out: it issues many related searches across subtopics, so a page that answers one sub-question can be cited.",
    "Search Console's generative AI performance report shows AI Mode impressions by page, country and device, with no query data.",
    "Pages that answer a specific question in their first lines, in plain HTML, are the ones a fan-out search can lift whole.",
    "The same public signals that move AI Mode also move ChatGPT, Gemini, Claude and Perplexity, so the work is not duplicated.",
  ],
  sources: [
    { title: "AI features and your website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
    { title: "Expanding AI Overviews and introducing AI Mode", publisher: "Google (The Keyword)", url: "https://blog.google/products/search/ai-mode-search/" },
    { title: "AI in Search: Going beyond information to intelligence", publisher: "Google (The Keyword)", url: "https://blog.google/products/search/google-search-ai-mode-update/" },
    { title: "Get AI-powered responses with AI Mode in Google Search", publisher: "Google Search Help", url: "https://support.google.com/websearch/answer/16011537" },
    { title: "Generative AI performance report (Search)", publisher: "Google Search Console Help", url: "https://support.google.com/webmasters/answer/16984139" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say
          about local businesses. Alphaa does not track Google AI Mode itself; this guide is built from
          Google&apos;s own documentation and from what we see working across the other engines.
        </em>
      </p>
      <p>
        <strong>Short answer:</strong> To show up in Google AI Mode, your pages must be indexed in Google Search,
        answer the specific sub-questions AI Mode breaks a prompt into, and state each answer plainly in the first
        lines of a page Google can read. Google says no special markup or AI file is required. Measure results in
        Search Console&apos;s generative AI performance report.
      </p>
      <p>
        This guide is for business owners and marketers who have watched AI Mode answer a customer&apos;s question
        and cite someone else. It explains how AI Mode selects pages, in Google&apos;s own words, what that means
        for what you publish, and how to check whether it is working, without inventing rules Google has never
        stated.
      </p>

      <h2>What is Google AI Mode?</h2>
      <p>
        AI Mode is a conversational search experience inside Google Search that answers a question directly, lets
        you ask follow-ups in the same thread and links out to supporting web pages. Google introduced it as a
        Labs experiment on 5 March 2025, describing it as an expansion of &quot;what AI Overviews can do with more
        advanced reasoning, thinking and multimodal capabilities&quot;, and at I/O on 20 May 2025 announced it was
        bringing{" "}
        <a href="https://blog.google/products/search/google-search-ai-mode-update/" {...ext}>
          a custom version of Gemini 2.5
        </a>{" "}
        into Search for both AI Mode and AI Overviews. Google&apos;s{" "}
        <a href="https://support.google.com/websearch/answer/16011537" {...ext}>
          help page
        </a>{" "}
        now lists it as available in more than 100 languages across the Americas, Asia-Pacific and Europe, Middle
        East and Africa.
      </p>
      <p>
        The distinction from AI Overviews is depth and persistence. An AI Overview is a summary above the normal
        results for a single query. AI Mode is a separate tab where the whole session is an AI answer, which means
        the ten blue links are not underneath it as a fallback. If your business is not in the answer, it is not
        on the page. We cover the Overview side in{" "}
        <Link href="/blog/google-ai-overviews-local-business">Google AI Overviews for local businesses</Link>.
      </p>

      <h2>How does AI Mode choose which pages to show?</h2>
      <p>
        AI Mode selects pages through what Google calls query fan-out: it breaks your question into subtopics and
        issues many related searches at once, then assembles the answer and its links from those results. The
        March 2025 announcement describes it as &quot;issuing multiple related searches concurrently across
        subtopics and multiple data sources and then brings those results together&quot;, and Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          Search Central documentation
        </a>{" "}
        says the technique lets AI features show &quot;a wider and more diverse set of helpful links&quot; than a
        classic results page.
      </p>
      <p>
        The practical consequence is that you are not competing for one query. A prompt like &quot;which
        orthodontist near me does clear aligners for adults and takes my insurance&quot; becomes several searches:
        adult clear aligner providers in the area, which practices accept that insurer, typical costs, reviews.
        A page that answers one of those sub-questions well can be cited even if it would never rank first for the
        original prompt. A page that answers none of them specifically, because it is a general homepage, usually
        is not. Google also notes that the responses draw on its Knowledge Graph and real-world data alongside web
        pages, so the facts it holds about your business as an entity matter as much as your copy; see{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO</Link>.
      </p>

      <h2>Does AI Mode need special markup or an AI file?</h2>
      <p>
        No. Google&apos;s documentation states: &quot;There are no additional requirements to appear in AI
        Overviews or AI Mode, nor other special optimizations necessary.&quot; The requirements are the ordinary
        ones for Google Search: the page must be crawlable, indexable and eligible to show a snippet. Structured
        data is not a condition of inclusion, and neither is an <code>llms.txt</code> file.
      </p>
      <p>
        That does not make structured data useless. It still helps Google confirm who you are, what you offer and
        where, and the same facts feed the Knowledge Graph that AI Mode consults. The honest framing is that
        schema cannot buy a citation but can stop a misread; see{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link>. One control does work
        the other way: the <code>nosnippet</code>, <code>data-nosnippet</code> and <code>max-snippet</code> rules
        limit what Google may show from your page in AI features, and <code>noindex</code> removes it entirely.
        Check that an old snippet rule is not quietly keeping you out.
      </p>

      <h2>How do you show up in Google AI Mode step by step?</h2>
      <p>
        There are six steps, and the first three are checks rather than content work. Do them in order; most
        businesses that are absent from AI Mode fail at step one or two.
      </p>
      <ol>
        <li>
          <strong>Confirm Google can index the pages that matter.</strong> In Search Console, inspect your service
          pages and location pages. If the answer is rendered by JavaScript after load, or blocked in{" "}
          <code>robots.txt</code>, nothing else below applies; see{" "}
          <Link href="/blog/javascript-rendering-ai-crawlers">JavaScript rendering and AI crawlers</Link>.
        </li>
        <li>
          <strong>Check your snippet controls.</strong> Search page source for <code>nosnippet</code> and{" "}
          <code>max-snippet</code>. A restrictive rule set years ago for a different reason now limits what AI Mode
          can quote.
        </li>
        <li>
          <strong>Write down the sub-questions.</strong> For each service, list the questions a customer would ask
          an assistant: cost, timeline, eligibility, who it is for, what goes wrong, how you compare. These are the
          searches fan-out is likely to run. Our method is in{" "}
          <Link href="/blog/keyword-research-for-ai-search">keyword research for AI search</Link>.
        </li>
        <li>
          <strong>Give each sub-question a plain answer at the top of a page.</strong> One page per question, the
          answer in the first two or three sentences, specific figures and places rather than adjectives, in HTML
          text. The question can be the heading. This is the single change that makes a page liftable.
        </li>
        <li>
          <strong>Make the entity facts consistent.</strong> Name, address, phone, hours, services and service area
          identical across your site, Google Business Profile and the directories Google reads. Add{" "}
          <code>LocalBusiness</code> or a more specific type so the facts are machine-readable.
        </li>
        <li>
          <strong>Measure in Search Console, then iterate monthly.</strong> Use the generative AI performance
          report described below. Compare page-level impressions before and after, and keep a change log so you
          know which edit moved what.
        </li>
      </ol>

      <h2>What kind of page does AI Mode actually cite?</h2>
      <p>
        AI Mode cites pages whose content resolves one of the fan-out searches cleanly, which in practice means a
        specific question, a direct answer and checkable detail. Google&apos;s help page says AI Mode responses are
        &quot;supported by high quality web content to improve factuality&quot;, and that when confidence is low
        it falls back to showing a set of web links instead. That tells you what to be: the page that makes the
        answer confident.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Page type</th>
              <th>Why fan-out tends to skip it</th>
              <th>What to do instead</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Generic homepage</td>
              <td>Answers no specific sub-question</td>
              <td>Link to one page per service question</td>
            </tr>
            <tr>
              <td>Service page with no prices or specifics</td>
              <td>Nothing checkable to lift</td>
              <td>Add ranges, timelines, eligibility, exclusions</td>
            </tr>
            <tr>
              <td>Long post that answers after 800 words</td>
              <td>The answer is buried below the fold</td>
              <td>Move the answer into the first paragraph</td>
            </tr>
            <tr>
              <td>FAQ page with a dozen one-line answers</td>
              <td>Too thin to support a confident response</td>
              <td>Two to three sentences per answer with a fact in each</td>
            </tr>
            <tr>
              <td>Reviews only in a widget</td>
              <td>Loaded by script, not in the HTML Google indexes</td>
              <td>Publish review text on the page itself</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The writing pattern is the same one that gets a page quoted by the other assistants, which we detail in{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI quotes</Link>.
      </p>

      <h2>What signals beyond the page does AI Mode use?</h2>
      <p>
        AI Mode draws on Google&apos;s Knowledge Graph and real-world data as well as web pages, so the facts
        Google holds about your business as an entity shape the answer alongside your copy. The March 2025
        announcement says AI Mode can access &quot;fresh, real-time sources like the Knowledge Graph, info about
        the real world, and shopping data for billions of products&quot;. For a local business that means the
        Google Business Profile, the reviews attached to it, and the directories Google uses to corroborate a
        name, address and phone number are all inputs, not just the website.
      </p>
      <ul>
        <li>
          <strong>Google Business Profile.</strong> Category, service area, hours and attributes are the
          structured record Google already trusts; keep it complete and identical to the site. See{" "}
          <Link href="/blog/google-business-profile-ai-answers">does your Google Business Profile feed AI answers</Link>.
        </li>
        <li>
          <strong>Reviews.</strong> Review text is evidence an answer can summarise, and a response from the owner
          is part of that record. Our guide is{" "}
          <Link href="/blog/google-reviews-ai-visibility">why your Google reviews decide your AI visibility</Link>.
        </li>
        <li>
          <strong>Corroborating pages.</strong> Consistent details on third-party sites let Google state a fact
          with confidence rather than hedge; inconsistency does the reverse.
        </li>
        <li>
          <strong>Images and video.</strong> Google&apos;s guidance recommends supporting text with high-quality
          images and video where applicable, and AI Mode accepts image and multimodal queries, so a well-captioned
          photo of the work is not wasted.
        </li>
      </ul>

      <h2>What mistakes keep businesses out of AI Mode?</h2>
      <p>
        The common ones are technical and self-inflicted: blocking the crawler, hiding the answer behind script,
        restrictive snippet rules, and facts that disagree with each other. A few deserve spelling out because
        they are easy to get wrong.
      </p>
      <ul>
        <li>
          <strong>Confusing Google-Extended with Googlebot.</strong> Google-Extended is a separate control for AI
          training and grounding in Google&apos;s other products. Google&apos;s documentation points to it as a
          different setting from the Search controls, so blocking it does not remove you from AI Mode, and
          blocking Googlebot removes you from Search entirely. Check which one your{" "}
          <Link href="/blog/ai-crawlers-robots-txt-guide">robots.txt</Link> actually names.
        </li>
        <li>
          <strong>Answers that only exist in a PDF or an image.</strong> A price list as a PDF or a licence number
          as a badge is weak evidence compared with the same fact in HTML text. See{" "}
          <Link href="/blog/do-ai-engines-read-pdfs-images">do AI engines read PDFs and images</Link>.
        </li>
        <li>
          <strong>One page trying to answer everything.</strong> Fan-out runs specific searches, and a single
          services page that mentions twelve services in passing matches none of them well.
        </li>
        <li>
          <strong>Stale facts.</strong> Old hours, a closed location or last year&apos;s prices still on the page
          lower Google&apos;s confidence and invite the fallback to plain links.
        </li>
        <li>
          <strong>Measuring the wrong thing.</strong> Watching classic rankings while AI Mode impressions sit
          unread in Search Console. Fix the report before judging the work.
        </li>
      </ul>

      <h2>How do you measure whether you show up in AI Mode?</h2>
      <p>
        Use the generative AI performance report in Google Search Console, which reports impressions for links to
        your site shown in AI Overviews and AI Mode. Google&apos;s{" "}
        <a href="https://support.google.com/webmasters/answer/16984139" {...ext}>
          help page
        </a>{" "}
        defines an impression as &quot;how many times links to your site were shown to a user in a generative AI
        feature on Google Search&quot;, broken down by page, country, date, device and search type. It does not
        show the queries, and Google says the report may be empty if your site has not received enough impressions
        in those features.
      </p>
      <p>
        Clicks from AI features are not separated out; they sit inside the ordinary Web search type in the main
        Performance report, where Google says clicks from pages with AI Overviews are higher quality. For the
        rest of the picture, segment AI referrals in analytics as we show in{" "}
        <Link href="/blog/how-to-track-ai-traffic-google-analytics">how to track AI traffic in Google Analytics</Link>,
        and remember that most AI answers resolve the question without a click, so impressions are the honest
        metric here.
      </p>

      <h2>Does the same work help with ChatGPT, Gemini and Perplexity?</h2>
      <p>
        Yes. Every step above improves the public signals that ChatGPT, Gemini, Claude and Perplexity read too:
        indexable HTML, specific answers near the top, consistent entity facts, readable reviews. The engines
        differ in what they retrieve from and how much they cite, but none of them rewards a vague page. That is
        why Alphaa&apos;s weekly check, which asks those four engines a real customer question and runs a 23-point
        check on your site, tends to surface the same fixes an AI Mode audit would. It does not measure AI Mode,
        so pair it with the Search Console report. You can run the{" "}
        <Link href="/start">free 60-second check</Link> to see what the four assistants say about your business
        today.
      </p>

      <h2>What else do people ask about showing up in Google AI Mode?</h2>

      <h3>Is Google AI Mode the same as AI Overviews?</h3>
      <p>
        No. AI Overviews is a summary shown above the normal results for some queries, while AI Mode is a separate
        conversational tab where the whole response is AI-generated with follow-ups. Both now run on a custom
        Gemini model and both appear in the same Search Console report.
      </p>

      <h3>Do I need llms.txt to appear in AI Mode?</h3>
      <p>
        No. Google&apos;s documentation says no AI text file, special markup or structured data is required. An{" "}
        <Link href="/blog/how-to-create-llms-txt-file">llms.txt file</Link> is harmless and may help other tools,
        but it is not an AI Mode requirement.
      </p>

      <h3>Can I see which queries triggered my AI Mode impressions?</h3>
      <p>
        Not in Search Console. The generative AI performance report shows impressions by page, country, date,
        device and search type, and Google states that query data is not included. Third-party trackers estimate
        it by running their own prompts.
      </p>

      <h3>Why does a competitor appear in AI Mode when I rank above them in normal results?</h3>
      <p>
        Because fan-out runs several related searches, and their page answered one of those sub-questions more
        directly than yours. Ranking for the head term does not carry over automatically. See{" "}
        <Link href="/blog/why-ai-recommends-your-competitor">why AI recommends your competitor</Link>.
      </p>

      <h3>How long does it take to show up in Google AI Mode after changes?</h3>
      <p>
        Google does not publish a timeline, and it depends on how quickly your pages are recrawled and
        reprocessed. Google&apos;s documentation only says to allow time for recrawling after a change; in our
        experience with the other engines, weeks is normal, as we explain in{" "}
        <Link href="/blog/how-long-does-aeo-take">how long AEO takes</Link>.
      </p>

      <h3>Can I block my content from AI Mode but stay in Google Search?</h3>
      <p>
        Partly. Google says the <code>nosnippet</code>, <code>data-nosnippet</code> and <code>max-snippet</code>{" "}
        controls limit what it shows from your page in AI features while the page stays indexed, and{" "}
        <code>noindex</code> removes it from Search entirely.
      </p>
    </div>
  )
}
