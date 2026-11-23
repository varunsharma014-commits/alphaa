import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-photographers-get-recommended-by-ai",
  title: "How Photographers Get Recommended by AI",
  description:
    "How photographers get recommended by ChatGPT, Gemini, Claude and Perplexity: write your genres, packages, area and turnaround as text, not just images.",
  subtitle:
    "Photographers get recommended by AI when assistants can read, in plain text, which kinds of photography they do, what their packages include, where they shoot, how fast they deliver and what past clients said, backed by a complete Google profile.",
  date: "2026-11-23",
  updated: "2026-11-23",
  readMins: 5,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how photographers get recommended by ai",
  takeaways: [
    "AI assistants cannot judge a portfolio by looking at it the way a client does, so every gallery needs written context.",
    "Clients ask for a photographer by genre, location, budget and date in one question, so each fact needs its own sentence.",
    "Google says it uses alt text, captions, filenames and nearby page text to understand what an image shows.",
    "Google says local results are based mainly on relevance, distance and prominence, and that more reviews and positive ratings can help.",
    "Stating starting prices, package contents and delivery times helps AI match you to the right client.",
  ],
  sources: [
    {
      title: "Image SEO Best Practices",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/google-images",
    },
    {
      title: "Tips to improve your local ranking on Google - Google Business Profile Help",
      publisher: "Google Business Profile Help",
      url: "https://support.google.com/business/answer/7091",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
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
        <strong>Short answer:</strong> Photographers get recommended by AI when ChatGPT, Gemini, Claude and Perplexity
        can read what you shoot, where you work, what a session costs and what clients said about you, in plain text.
        Most photography sites are almost all images. Add written genres, packages, area and project summaries first.
      </p>

      <p>
        This guide is for wedding, portrait, family, newborn, headshot, event, product and real estate photographers
        who want to show up when a client asks an AI assistant who to book. It covers what the assistants look for,
        what to write and a short checklist.
      </p>

      <h2>How do clients ask AI to find a photographer?</h2>
      <p>
        Clients ask AI for a photographer the way they would ask a friend, packing genre, place, style, budget and date
        into one question. A typical request is &quot;a natural-light newborn photographer in Calgary who does home
        sessions, under $600&quot;, or &quot;a corporate headshot photographer in Toronto who can shoot 20 staff on
        site next week&quot;.
      </p>
      <p>
        For local questions, ChatGPT turns that request into a search. OpenAI&apos;s help page,{" "}
        <a href="https://help.openai.com/en/articles/9237897-chatgpt-search" {...ext}>
          Searching the web with ChatGPT
        </a>
        , explains that it may rewrite a question using your approximate location and send it to third-party search
        providers. The assistant then reads the pages that come back and picks the businesses whose text matches the
        details in the question. A site that says only &quot;capturing life&apos;s moments&quot; matches none of
        them.
      </p>

      <h2>Why do AI assistants overlook photographers with great portfolios?</h2>
      <p>
        AI assistants overlook strong portfolios because they recommend from text, and a gallery of uncaptioned images
        tells them very little about what you do, where or for whom. Your best work may be on the page, but the facts
        a client asked about are not.
      </p>
      <p>
        Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/google-images" {...ext}>
          Image SEO Best Practices
        </a>{" "}
        says it uses alt text along with computer vision and page content to understand an image, that it pulls
        information from captions and image titles, and that a descriptive filename gives light clues about the
        subject. A file called IMG_4821.jpg on a page with no words is the hardest case for any engine. Our guide on{" "}
        <Link href="/blog/do-ai-engines-read-pdfs-images">whether AI engines read PDFs and images</Link> covers the
        wider point.
      </p>

      <h2>What should a photographer&apos;s website say for AI to recommend it?</h2>
      <p>
        A photographer&apos;s website should state, in sentences, the genres you shoot, your service area, your
        packages and starting prices, your delivery times and what each type of session involves. These are the
        details clients put in their questions, so they are the details an assistant needs to match.
      </p>
      <ul>
        <li>
          <strong>Genres, one page each.</strong> Weddings, newborns, family, headshots, events or products, each with
          its own page and a plain first paragraph saying what is included.
        </li>
        <li>
          <strong>Where you shoot.</strong> Your city, the towns you travel to, whether you have a studio, and any
          travel fee.
        </li>
        <li>
          <strong>Packages and starting prices.</strong> Hours of coverage, number of edited images, prints or albums,
          and a &quot;from&quot; price. Our guide to{" "}
          <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link> explains why a
          starting price helps.
        </li>
        <li>
          <strong>Turnaround.</strong> When clients get a preview and the full gallery, and how files are delivered.
        </li>
        <li>
          <strong>Style in words.</strong> &quot;Bright and airy&quot;, &quot;documentary&quot;, &quot;moody
          film-style edits&quot;: assistants can only match a style request to a style you describe.
        </li>
        <li>
          <strong>Booking basics.</strong> How far ahead you book, the deposit, and what happens if a date changes.
        </li>
      </ul>

      <h2>How should photographers describe past shoots for AI?</h2>
      <p>
        Describe each featured shoot with a short written summary: the type of session, the location, the brief and
        what was delivered. Two or three sentences per gallery turn a set of images into something an assistant can
        read and quote.
      </p>
      <p>
        A good summary reads like &quot;A winter elopement at Lake Louise for a couple from Edmonton: two hours of
        coverage, 180 edited images delivered in three weeks.&quot; Give each image descriptive alt text and filenames,
        and use real captions. Only name clients or venues when they have agreed to it. For more on turning work into
        readable proof, see our guide to <Link href="/blog/case-study-pages-ai-search">case study pages for AI
        search</Link>.
      </p>

      <h2>Do Google reviews and your Business Profile matter for photographers?</h2>
      <p>
        Yes, your Google Business Profile and reviews matter a great deal, because assistants answering local questions
        draw on the same public signals Google uses. Google&apos;s help page,{" "}
        <a href="https://support.google.com/business/answer/7091" {...ext}>
          Tips to improve your local ranking on Google
        </a>
        , says local results are based mainly on relevance, distance and prominence, and that more reviews and positive
        ratings can help.
      </p>
      <p>
        Pick the most specific category available, list each service, add photos and keep hours current. If you work
        on location only, set a service area rather than showing a home address. Ask happy clients to mention the type
        of shoot and the place in their review, since &quot;our newborn session in Kanata&quot; is far more useful to
        an AI than &quot;great experience&quot;. Our guides on{" "}
        <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link> and{" "}
        <Link href="/blog/google-reviews-ai-visibility">Google reviews and AI visibility</Link> go deeper.
      </p>

      <h2>Which structured data helps a photography business?</h2>
      <p>
        LocalBusiness structured data helps, because it states your name, address or area, hours, phone number and
        prices in a format search engines read directly. Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
          LocalBusiness structured data guide
        </a>{" "}
        lists the properties it supports and recommends using the most specific type that fits.
      </p>
      <p>
        Add it to your homepage and contact page, and keep it identical to your Google profile and directory listings.
        Our guide to <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> walks through the
        fields.
      </p>

      <h2>What is the AI visibility checklist for photographers?</h2>
      <p>
        The checklist is seven steps, starting with asking the assistants what they say about you today. Work through
        them in order and recheck after a few weeks, because AI answers change as new pages are found.
      </p>
      <ol>
        <li>
          <strong>Ask the assistants.</strong> Type three client-style questions into ChatGPT, Gemini, Claude and
          Perplexity and note who is named.
        </li>
        <li>
          <strong>Give each genre its own page.</strong> One page per kind of photography, each opening with a
          two-sentence plain answer.
        </li>
        <li>
          <strong>Write packages and starting prices.</strong> Put them in text on the page, not in a downloadable PDF.
        </li>
        <li>
          <strong>Caption your galleries.</strong> A summary per shoot, alt text per image and descriptive filenames.
        </li>
        <li>
          <strong>Complete your Google profile.</strong> Specific category, services, service area, photos and hours.
        </li>
        <li>
          <strong>Ask for specific reviews.</strong> Invite clients to mention the shoot type and location.
        </li>
        <li>
          <strong>Add LocalBusiness schema.</strong> Match it exactly to your profile and listings.
        </li>
      </ol>
      <p>
        Wedding photographers will find more on venue and vendor questions in our guide to{" "}
        <Link href="/blog/how-wedding-vendors-get-recommended-by-ai">how wedding vendors get recommended by AI</Link>.
        You can run step one in about a minute with the <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else do photographers ask about AI recommendations?</h2>

      <h3>Can ChatGPT see my photos and judge my style?</h3>
      <p>
        Not in the way a client does, so do not rely on it. Search systems use alt text, captions and page text to
        understand images, which is why your style needs describing in words.
      </p>

      <h3>Should I put my prices on my photography website?</h3>
      <p>
        Yes, a starting price helps, because clients often include a budget in their question and an assistant can
        only match a price it can read. A &quot;from&quot; price per package is enough.
      </p>

      <h3>Does Instagram help photographers get recommended by AI?</h3>
      <p>
        It can help a little as a public profile that confirms you exist, but your website and Google profile carry
        far more weight. Make sure the facts on Instagram match your site.
      </p>

      <h3>How long does it take for AI to start recommending my studio?</h3>
      <p>
        There is no fixed timeline, because each assistant finds and weighs new pages on its own schedule. Clear pages,
        a complete profile and specific reviews make you easier to find, but nobody can guarantee when.
      </p>

      <h3>Can Alphaa do this work for a photography business?</h3>
      <p>
        Yes, Alphaa checks what ChatGPT, Gemini, Claude and Perplexity say about you weekly and drafts page fixes,
        Google posts and review replies for your approval, from $99 a month. It works with WordPress, Shopify and
        Webflow.
      </p>
    </div>
  )
}
