import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "original-research-ai-citations",
  title: "Original Research for AI Citations: A 2026 Guide",
  description:
    "How to create original research that ChatGPT, Gemini, Claude and Perplexity cite: picking a question, collecting data, publishing it, and marking it up.",
  subtitle:
    "AI engines cite original research when it answers a specific question with numbers nobody else has published, on a page that states the method and the findings plainly.",
  date: "2026-10-29",
  updated: "2026-10-29",
  readMins: 6,
  tag: "Guide",
  kind: "guide",
  keyphrase: "original research for ai citations",
  image: {
    src: "/blog/original-research-ai-citations.webp",
    alt: "An open notebook with two hand-drawn bar charts beside a magnifying glass and a stack of printed checklist forms",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Original research gives AI engines a fact they can only attribute to you, which makes your page the source to cite.",
    "Google's people-first content guidance asks whether content provides original information, reporting, research or analysis.",
    "In the GEO study, adding statistics, quotations and cited sources improved visibility in generative engine answers; keyword stuffing did not.",
    "A small, well-documented dataset from your own work beats a large survey you cannot explain.",
    "Publish the headline finding in one sentence near the top, then the method, the data and the limits.",
  ],
  sources: [
    { title: "Creating Helpful, Reliable, People-First Content", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content" },
    { title: "GEO: Generative Engine Optimization", publisher: "arXiv (KDD 2024)", url: "https://arxiv.org/abs/2311.09735" },
    { title: "Dataset Structured Data", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/structured-data/dataset" },
    { title: "AI Features and Your Website", publisher: "Google Search Central", url: "https://developers.google.com/search/docs/appearance/ai-features" },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Original research for AI citations works when you publish a fact only you can
        provide, such as data from your own jobs, customers or a survey, on a page that states the finding in one
        sentence and explains the method. AI engines need a source to attribute a number to, and original data makes
        you that source.
      </p>

      <p>
        This guide is for small businesses, SaaS teams and agencies who want ChatGPT, Gemini, Claude and Perplexity
        to quote them rather than a competitor. It covers how to choose a question, where to get data you already
        own, how to write the page so it gets lifted whole, and the mistakes that make research uncitable.
      </p>

      <h2>Why do AI engines cite original research?</h2>
      <p>
        AI engines cite original research because a specific, attributable fact is exactly what an answer needs and
        there is only one place it can come from. When an assistant writes &quot;according to&quot; a source, it is
        looking for the page that first published the claim. If the claim is yours, the citation has nowhere else to
        go.
      </p>
      <p>
        Google says the same thing in classic search terms. Its guide to{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>
          helpful, reliable, people-first content
        </a>{" "}
        asks whether content provides &quot;original information, reporting, research, or analysis&quot; and
        whether it adds substantial value compared with other pages in the results. Google&apos;s page on{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features and your website
        </a>{" "}
        adds that there are no special requirements to appear in AI Overviews and AI Mode beyond normal search best
        practices, so the same quality signals apply.
      </p>

      <h2>What does the research say about statistics and citations in AI answers?</h2>
      <p>
        The research says content with concrete statistics, quotations and cited sources is more visible in
        generative engine answers than content without them. The clearest evidence is the{" "}
        <a href="https://arxiv.org/abs/2311.09735" {...ext}>GEO: Generative Engine Optimization</a> paper, accepted to KDD 2024, which tested how changes to a source page
        affected its visibility in generated answers.
      </p>
      <p>
        Its top-performing methods were adding statistics in place of qualitative claims, adding quotations from
        credible sources, and citing sources. Classic keyword stuffing did not perform well, and the authors note
        that results varied by domain. The lesson for a business is simple: replace adjectives with numbers you can
        stand behind. Original research is the most defensible way to have those numbers.
      </p>

      <h2>What counts as original research for a small business?</h2>
      <p>
        Original research for a small business is any honest count, measurement or survey drawn from your own work
        that nobody else has published. It does not need a research department. It needs a clear question, a
        defined sample and a method you can explain in two sentences.
      </p>
      <ul>
        <li>
          <strong>Job or order data.</strong> A roofer&apos;s median repair cost by roof type, or a bakery&apos;s
          busiest ordering days, taken from its own records.
        </li>
        <li>
          <strong>Customer surveys.</strong> A short survey of your own clients, reported with the sample size and the
          exact question wording.
        </li>
        <li>
          <strong>Audits of public data.</strong> Checking a defined set of public pages or listings and counting what
          you find.
        </li>
        <li>
          <strong>Repeated tests.</strong> Asking the same questions of a tool or service on a schedule and recording
          the results.
        </li>
        <li>
          <strong>Expert tallies.</strong> A count of what your team saw across a season, such as the most common
          causes of a breakdown.
        </li>
      </ul>
      <p>
        Our own{" "}
        <Link href="/blog/local-business-ai-readiness-study-2026">local business AI readiness study</Link> is an
        example of the audit type: a defined sample, a fixed checklist and the method published with the results.
      </p>

      <h2>How do you create original research that AI engines cite, step by step?</h2>
      <p>
        There are six steps, starting with choosing a question your customers already ask an AI assistant. The order
        matters, because a dataset collected without a question rarely produces a finding anyone quotes.
      </p>
      <ol>
        <li>
          <strong>Pick a question buyers ask.</strong> Use the questions you hear on calls, or ask ChatGPT and
          Perplexity what people want to know in your category. Prefer questions that currently get vague answers,
          such as &quot;how much does X usually cost in Y.&quot;
        </li>
        <li>
          <strong>Find data you already own.</strong> Invoices, booking systems, support tickets and quotes are
          usually enough. Strip anything that identifies a customer before you count.
        </li>
        <li>
          <strong>Define the sample and the method.</strong> Write down the date range, the number of records, what
          you included and excluded, and how you calculated each figure. If you cannot explain it, do not publish
          it.
        </li>
        <li>
          <strong>Write one headline finding per question.</strong> A single sentence with a number, a population and
          a date, such as &quot;Across [number] jobs in [year], the median repair took [hours] hours.&quot; That sentence is what
          gets quoted.
        </li>
        <li>
          <strong>Publish on a fetchable page you control.</strong> Put the finding near the top in plain HTML, then
          the method, a table of the data and the limits. Avoid locking it in a PDF or an image.
        </li>
        <li>
          <strong>Mark it up and update it.</strong> Add structured data where it fits, date the page, and refresh
          the numbers on a fixed schedule so the page stays the current source.
        </li>
      </ol>

      <h2>How should a research page be structured so it gets quoted?</h2>
      <p>
        A research page gets quoted when each finding sits in a short, self-contained sentence that makes sense
        without the paragraph around it. AI engines lift passages, not whole pages, so every key number should carry
        its own context: what was measured, in whom, and when.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>What to put in it</th>
              <th>Why it helps citation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Headline finding</td>
              <td>One sentence with the number, sample and date</td>
              <td>Gives the engine a ready-made quote</td>
            </tr>
            <tr>
              <td>Key findings list</td>
              <td>Three to six standalone findings</td>
              <td>Each one can be lifted on its own</td>
            </tr>
            <tr>
              <td>Method</td>
              <td>Sample size, date range, inclusions, calculation</td>
              <td>Makes the claim checkable and trustworthy</td>
            </tr>
            <tr>
              <td>Data table</td>
              <td>The underlying figures in an HTML table</td>
              <td>Readable by crawlers that do not render scripts</td>
            </tr>
            <tr>
              <td>Limits</td>
              <td>What the data cannot tell you</td>
              <td>Signals honesty and prevents misquotes</td>
            </tr>
            <tr>
              <td>Author and date</td>
              <td>Who ran it and when it was last updated</td>
              <td>Supports attribution and freshness</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        For the writing itself, our guide on{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI quotes</Link> covers sentence-level
        patterns in more detail.
      </p>

      <h2>Should you use Dataset structured data for your research?</h2>
      <p>
        You should use Dataset structured data when you publish the underlying data as a downloadable or browsable
        dataset, not just a chart or an article. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/dataset" {...ext}>
          Dataset structured data documentation
        </a>{" "}
        describes the markup for datasets such as tables and files, which helps Google understand and surface them.
      </p>
      <p>
        For the article about the findings, normal Article markup and a clear author and date are enough. Structured
        data does not create authority on its own; it describes what is already on the page. Our{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search guide</Link> explains which types
        matter most for a business.
      </p>

      <h2>How do you get other sites to pick up your research?</h2>
      <p>
        You get other sites to pick it up by sending the headline finding to the people who already write about your
        topic, with the method attached. Trade publications, local news, industry newsletters and associations are
        often looking for fresh, specific numbers.
      </p>
      <p>
        Coverage matters because AI engines weigh what independent sources say about you, not only what you say
        about yourself. A finding repeated by a trade publication with your name attached becomes a brand mention
        that strengthens the original. Our pieces on{" "}
        <Link href="/blog/press-releases-news-coverage-ai-visibility">press coverage and AI visibility</Link> and{" "}
        <Link href="/blog/do-brand-mentions-without-links-help-ai-search">unlinked brand mentions</Link> explain why.
      </p>

      <h2>What mistakes make original research uncitable?</h2>
      <p>
        The mistakes that make research uncitable are hiding the method, inflating the sample, burying the finding
        and publishing it where crawlers cannot read it. Any one of them gives an engine a reason to cite someone
        else.
      </p>
      <ul>
        <li>
          <strong>No method.</strong> A number without a sample size or date range is a claim, not research.
        </li>
        <li>
          <strong>Overreach.</strong> Twenty customer replies cannot describe a whole industry. Say what the sample
          represents.
        </li>
        <li>
          <strong>Findings only in images.</strong> Charts without the numbers in text are hard for crawlers to read.
        </li>
        <li>
          <strong>Gated reports.</strong> A form in front of the PDF hides it from the engines you want to cite it.
        </li>
        <li>
          <strong>Never updated.</strong> Last year&apos;s numbers lose to this year&apos;s. Put the next update date
          in your calendar.
        </li>
      </ul>

      <h2>What else do people ask about original research and AI citations?</h2>

      <h3>How big does a sample need to be for AI engines to cite it?</h3>
      <p>
        There is no published minimum sample size for AI citations; what matters is that the sample is stated and
        fits the claim. A clearly described count of 150 of your own jobs is more useful than a vague claim about
        &quot;thousands of customers.&quot;
      </p>

      <h3>Can I use AI to analyse my data for a research page?</h3>
      <p>
        Yes, you can use AI to help sort and summarise data, but a person should check every published figure
        against the raw records. An incorrect number that gets cited spreads quickly and is hard to correct later.
      </p>

      <h3>How often should I update original research?</h3>
      <p>
        Update original research on a fixed schedule, usually once a year, or sooner if the underlying facts change.
        Keep the same URL, change the date, and note what changed so the page remains the current source.
      </p>

      <h3>Does original research help in Google as well as ChatGPT?</h3>
      <p>
        Yes, original research helps in both, because Google&apos;s own content guidance asks whether a page
        provides original information or research. Research pages also tend to earn links and mentions, which help
        classic search too.
      </p>

      <h3>How do I know if AI engines are citing my research?</h3>
      <p>
        Ask ChatGPT, Gemini, Claude and Perplexity the question your research answers, on a regular schedule, and
        record whether they cite you. A{" "}
        <Link href="/start">free 60-second AI check</Link> shows where you stand today.
      </p>
    </div>
  )
}
