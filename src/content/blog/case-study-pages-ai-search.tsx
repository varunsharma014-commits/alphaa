import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "case-study-pages-ai-search",
  title: "Case Study Pages for AI Search: How to Write Them",
  description:
    "How to write case study pages for AI search that ChatGPT, Gemini, Claude and Perplexity can quote: named problem, method, dated results, consent and schema.",
  subtitle:
    "A case study page helps in AI search when it states, in plain text, who the client was, what the problem was, what you did, what changed and when, with permission and without claiming the result is typical.",
  date: "2026-11-15",
  updated: "2026-11-15",
  readMins: 7,
  tag: "Guide",
  kind: "guide",
  keyphrase: "case study pages for ai search",
  takeaways: [
    "AI assistants can only repeat proof they can read, so a case study must state the problem, the work and the result in text.",
    "Google asks whether content shows first-hand expertise and provides original information, which a real case study does by nature.",
    "The FTC says specific results imply they are typical unless you have proof or clearly disclose generally expected results.",
    "Google does not show review stars for reviews a business hosts about itself on LocalBusiness or Organization pages.",
    "One case study per service and situation gives assistants a specific page to cite for a specific question.",
  ],
  sources: [
    {
      title: "Creating Helpful, Reliable, People-First Content",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    },
    {
      title: "Review Snippet (Review, AggregateRating) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/review-snippet",
    },
    {
      title: "FTC's Endorsement Guides: What People Are Asking",
      publisher: "Federal Trade Commission",
      url: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
    {
      title: "Image SEO Best Practices",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/google-images",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Case study pages for AI search work when each one states, in plain text, who
        the client was, the problem, what you did, the result and the date. Write one page per service and situation,
        get the client&apos;s written permission, label results as that client&apos;s, and link each case study from
        the matching service page.
      </p>

      <p>
        This guide is for service businesses, agencies, contractors, clinics and B2B firms that already have good work
        to show. It covers why case studies help with ChatGPT, Gemini, Claude and Perplexity, the structure that makes
        them quotable, the legal limits on results claims, and the mistakes that make proof invisible to AI.
      </p>

      <h2>Why do case study pages matter for AI search?</h2>
      <p>
        Case study pages matter because AI assistants recommend businesses whose claims they can check, and a case
        study is the most specific proof a business can publish. When someone asks &quot;which roofer has handled
        insurance claims for hail damage&quot; or &quot;which agency has built Shopify stores for furniture
        brands&quot;, the assistant looks for a page that answers exactly that. A testimonial that says &quot;great
        service&quot; does not. A case study that says what was done, for whom and with what outcome does.
      </p>
      <p>
        Google&apos;s guide to{" "}
        <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>
          creating helpful, reliable, people-first content
        </a>{" "}
        asks whether content provides original information, reporting, research or analysis, and whether it clearly
        demonstrates first-hand expertise. A real case study does both by nature, because nobody else can write about
        your project. Google also says in its guide to{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI features and your website
        </a>{" "}
        that there are no extra requirements for AI Overviews beyond normal SEO best practices, so a well-made case
        study helps in classic search and AI answers at once.
      </p>

      <h2>What should a case study page include?</h2>
      <p>
        A case study page should include seven parts, each written as text an assistant can lift: the client, the
        problem, the constraints, the work, the result, the date and the proof. This structure works for almost any
        service business.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Part</th>
              <th>What to write</th>
              <th>Example sentence</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Client</td>
              <td>Type, size and location, or a name with permission</td>
              <td>A two-location dental practice in Calgary</td>
            </tr>
            <tr>
              <td>Problem</td>
              <td>The situation in the client&apos;s words</td>
              <td>New-patient calls had dropped after a website rebuild</td>
            </tr>
            <tr>
              <td>Constraints</td>
              <td>Budget, timing, access or rules that shaped the job</td>
              <td>The practice could not close during the work</td>
            </tr>
            <tr>
              <td>Work</td>
              <td>What you did, in order, with named methods or tools</td>
              <td>We restored redirects, rewrote service pages and fixed the booking form</td>
            </tr>
            <tr>
              <td>Result</td>
              <td>What changed, measured where you can, with the period</td>
              <td>Booked calls returned to the earlier level within the quarter</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>When the work happened and when results were measured</td>
              <td>Work completed March 2026; results measured to June 2026</td>
            </tr>
            <tr>
              <td>Proof</td>
              <td>A quote with consent, photos you own, a link to the live work</td>
              <td>A short quote from the practice manager, used with permission</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Open the page with a two-sentence summary that contains the whole story, because assistants often quote the
        first clear statement they find. Then expand each part under its own heading. Our guide on{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">how to write content AI quotes</Link> covers that answer-first
        style in more depth.
      </p>

      <h2>How do you write a case study AI assistants can quote, step by step?</h2>
      <p>
        You can write a quotable case study in eight steps, starting with picking one specific job and ending with
        linking it from the right service page.
      </p>
      <ol>
        <li>
          <strong>Pick one job that matches a question customers ask.</strong> Choose work that maps to a real search,
          such as &quot;emergency tree removal after a storm&quot; or &quot;migrating a store from Wix to
          Shopify&quot;, rather than your most impressive project.
        </li>
        <li>
          <strong>Get written permission.</strong> Ask the client whether you may name them, quote them and show
          photos. If not, describe them by type and location.
        </li>
        <li>
          <strong>Write the summary first.</strong> Two sentences: who, what problem, what you did, what changed, and
          when. If the summary is vague, the job is not ready to publish.
        </li>
        <li>
          <strong>Use the client&apos;s words for the problem.</strong> Customers search in their own language. A
          problem written as the client described it matches more questions than industry jargon.
        </li>
        <li>
          <strong>Describe the work in order.</strong> Name the methods, materials, tools or standards you used, so
          the page shows how you work rather than only that you did.
        </li>
        <li>
          <strong>State results with their period and source.</strong> &quot;Up 40%&quot; means nothing without a
          baseline and dates. Say what was measured, where the number came from and over what time.
        </li>
        <li>
          <strong>Caption every image in text.</strong> Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/google-images" {...ext}>
            image SEO best practices
          </a>{" "}
          say it extracts information about an image from captions, titles and nearby text. Before-and-after photos
          help only when the caption says what they show.
        </li>
        <li>
          <strong>Link it both ways.</strong> Link the case study from the matching service page, and link back from
          the case study to that service. This tells assistants which service the proof supports.
        </li>
      </ol>

      <h2>What are the legal limits on results in case studies?</h2>
      <p>
        The main legal limit is that a specific result implies other customers can expect it, so you need proof it is
        typical or a clear statement of what is generally expected. The Federal Trade Commission&apos;s{" "}
        <a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" {...ext}>
          endorsement guides Q&amp;A
        </a>{" "}
        says endorsements claiming specific results will usually be read as reflecting what others can expect, and
        that lines like &quot;results not typical&quot; or &quot;individual results may vary&quot; do not change that.
        It describes two choices: have adequate proof that the results are typical, or clearly disclose the generally
        expected results.
      </p>
      <p>That has practical consequences for how you write a case study.</p>
      <ul>
        <li>
          <strong>Real clients only.</strong> Never invent a client, a quote or a number, and never combine several
          jobs into one &quot;composite&quot; story presented as real.
        </li>
        <li>
          <strong>Consent on file.</strong> Keep written permission for names, quotes, logos and photos of people.
        </li>
        <li>
          <strong>Disclose relationships.</strong> If the quoted client got a discount, free work or anything else for
          taking part, say so on the page.
        </li>
        <li>
          <strong>No guarantees.</strong> Frame results as what happened for that client, not as what a reader will
          get.
        </li>
        <li>
          <strong>Regulated fields need extra care.</strong> Health, legal and financial services often have their own
          rules on testimonials and outcomes. Check your regulator or professional body before publishing.
        </li>
      </ul>
      <p>
        This guide is general information, not legal advice. If you are unsure whether a claim is allowed, ask a
        lawyer before it goes live.
      </p>

      <h2>Should case studies use review or testimonial schema?</h2>
      <p>
        Case studies should not rely on review schema for stars, because Google does not show review rich results for
        reviews a business hosts about itself. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/review-snippet" {...ext}>
          review snippet documentation
        </a>{" "}
        says LocalBusiness and Organization review markup is only for sites that capture reviews about other
        businesses, and points to its guidelines on self-serving reviews.
      </p>
      <p>
        What does help is ordinary, accurate markup. Mark the page up as an Article with a clear headline, author and
        date published, keep your Organization or LocalBusiness markup on the site consistent, and let the text carry
        the proof. Our guide to <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> shows
        which types matter, and <Link href="/blog/google-reviews-ai-visibility">how Google reviews affect AI
        visibility</Link> covers where third-party reviews fit.
      </p>

      <h2>How many case studies does a business need for AI visibility?</h2>
      <p>
        A business needs at least one case study for each main service and each customer situation it wants to be
        recommended for, rather than a fixed number. Assistants answer specific questions, so a roofer with one case
        study on hail damage, one on flat roofs and one on insurance claims covers three questions; ten case studies
        about the same kind of job cover one.
      </p>
      <p>
        Freshness matters too. A dated case study from this year shows that you still do the work. Review older ones
        once a year, update details that have changed, and keep the original date of the work visible. Our guide to{" "}
        <Link href="/blog/content-freshness-ai-search">content freshness in AI search</Link> explains why dates help.
      </p>

      <h2>What mistakes make case studies invisible to AI?</h2>
      <p>
        The most common mistake is putting the proof somewhere an assistant cannot read it, such as a PDF download, a
        video with no transcript, or a slide image. These are the others to avoid.
      </p>
      <ul>
        <li>A logo wall with no text explaining what you did for each client.</li>
        <li>Results with no baseline, no period and no source.</li>
        <li>Case studies that link to no service page, so they support nothing specific.</li>
        <li>The whole story in a carousel or tabbed widget that loads only after a click.</li>
        <li>Vague titles such as &quot;Project 14&quot; instead of the service, client type and place.</li>
        <li>Testimonials edited until they no longer say what the client said.</li>
      </ul>
      <p>
        If your proof lives in PDFs today, our guide on{" "}
        <Link href="/blog/do-ai-engines-read-pdfs-images">whether AI engines read PDFs and images</Link> explains what to
        move into HTML first. Strong author bios help as well; see{" "}
        <Link href="/blog/eeat-author-bios-ai-search">E-E-A-T and author bios for AI search</Link>.
      </p>

      <h2>How does Alphaa help with case study pages?</h2>
      <p>
        Alphaa helps by showing which customer questions AI assistants answer with a competitor instead of you, and by
        drafting the pages that fill those gaps for your approval. It asks ChatGPT, Gemini, Claude and Perplexity what
        they say about your business every week and runs a 23-point check of your site. When the gap is missing proof
        for a service, it can draft the page structure and questions for you to fill with your real client details.
        It never invents clients or results, and nothing publishes until you approve it, on WordPress, Shopify or
        Webflow, from $99 a month.
      </p>
      <p>
        To see which of your services lack proof that AI can read, start with the{" "}
        <Link href="/start">free 60-second AI check</Link>. Related reading:{" "}
        <Link href="/blog/service-page-for-ai-search">the service page AI search can quote</Link> and{" "}
        <Link href="/blog/original-research-ai-citations">original research for AI citations</Link>.
      </p>

      <h2>What else do people ask about case studies and AI search?</h2>

      <h3>Can I publish a case study without naming the client?</h3>
      <p>
        Yes, an anonymous case study can still work if it describes the client by type, size and location and gives
        specific details of the work. Say clearly that the client is not named, and never present an invented client
        as real.
      </p>

      <h3>How long should a case study page be?</h3>
      <p>
        A case study should be as long as it takes to cover the seven parts clearly, which is often 500 to 1,000
        words. A clear two-sentence summary at the top matters more than length.
      </p>

      <h3>Do video case studies help with AI search?</h3>
      <p>
        Video case studies help people, but assistants mostly rely on text. Publish a written summary and a transcript
        on the same page as the video so the facts can be read and quoted.
      </p>

      <h3>Should case studies go on the blog or a separate section?</h3>
      <p>
        A separate case studies section, linked from each service page, usually works best because it keeps proof
        close to the service it supports. The address matters less than clear titles and links both ways.
      </p>

      <h3>Will a case study get my business recommended by ChatGPT?</h3>
      <p>
        No single page can guarantee a recommendation, and nobody can promise one. A specific, dated case study gives
        assistants verifiable proof for a question, which makes your business easier to recommend accurately.
      </p>
    </div>
  )
}
