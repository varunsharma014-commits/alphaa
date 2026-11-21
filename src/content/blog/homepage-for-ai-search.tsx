import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "homepage-for-ai-search",
  title: "How to Write a Homepage for AI Search in 2026",
  description:
    "How to write a homepage for AI search: a plain entity statement, a descriptive title, Organization and WebSite schema, and links that ChatGPT can follow.",
  subtitle:
    "A homepage works for AI search when its first lines say plainly who you are, what you do, where and for whom, and its title, structured data and links confirm the same facts.",
  date: "2026-11-21",
  updated: "2026-11-21",
  readMins: 8,
  tag: "Guide",
  kind: "guide",
  keyphrase: "homepage for ai search",
  takeaways: [
    "AI assistants use your homepage to confirm who the business is, so its first 100 words should state name, service, place and customer.",
    "Google recommends putting Organization structured data on the home page or a single page describing the organization.",
    "Google uses WebSite structured data on the home page as the most important signal for your preferred site name.",
    "Google's title link guidance says to avoid vague titles like \"Home\" for your home page.",
    "Text inside images, sliders and videos is easy for a person to see and easy for an AI crawler to miss.",
  ],
  sources: [
    {
      title: "Organization Schema Markup",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/organization",
    },
    {
      title: "Site Names in Google Search",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/site-names",
    },
    {
      title: "Influencing Title Links in Google Search",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/title-link",
    },
    {
      title: "Creating Helpful, Reliable, People-First Content",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
    },
    {
      title: "Searching the web with ChatGPT",
      publisher: "OpenAI Help Center",
      url: "https://help.openai.com/en/articles/9237897-chatgpt-search",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> A homepage for AI search states, in its first lines of real text, who the
        business is, what it does, where and for whom. It backs that with a descriptive title, Organization and
        WebSite structured data, and clear links to service, about and pricing pages. Start by rewriting the top 100
        words so a stranger could describe you correctly.
      </p>

      <p>
        This guide is for owners and marketers of small and local businesses whose homepage looks good to people but
        says little to ChatGPT, Gemini, Claude or Perplexity. It covers what assistants take from a homepage, what to
        write, the markup that confirms it and the mistakes that hide it.
      </p>

      <h2>Why does your homepage matter for AI search?</h2>
      <p>
        Your homepage matters for AI search because it is the page assistants and search engines treat as the
        official description of the business, the one they use to check who you are before they recommend you. When
        ChatGPT searches the web, OpenAI&apos;s{" "}
        <a href="https://help.openai.com/en/articles/9237897-chatgpt-search" {...ext}>
          help article on ChatGPT search
        </a>{" "}
        explains that it rewrites a question into targeted queries and reads the pages that come back. Your homepage
        is often one of them when the question names you.
      </p>
      <p>
        Google says the same in its own documentation. Its{" "}
        <a href="https://developers.google.com/search/docs/appearance/site-names" {...ext}>
          site names guide
        </a>{" "}
        says the name it shows for a site comes from content on the home page and references to it across the web.
        Its{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/organization" {...ext}>
          Organization markup guide
        </a>{" "}
        recommends placing your organization details on the home page so Google can tell you apart from similar
        names. If the homepage is vague, every system that reads it inherits the vagueness.
      </p>

      <h2>What should the first 100 words of a homepage say?</h2>
      <p>
        The first 100 words should answer five questions in plain text: what the business is called, what it does,
        where it works, who it serves and what makes it specific. Think of it as the sentence you would want an
        assistant to repeat about you.
      </p>
      <p>
        Compare two openings for a made-up clinic. &quot;Your vision, our passion. Excellence in every detail.&quot; tells a reader nothing
        and gives an assistant nothing to quote. &quot;Northside Physio is a physiotherapy clinic in Halifax, Nova
        Scotia, treating running injuries, back pain and post-surgery rehab for adults, with evening appointments
        Monday to Thursday.&quot; is dull to a copywriter and perfect for an engine. It names the entity, the
        category, the place, the specialties and a detail a competitor may not match.
      </p>
      <p>
        Put that statement in the H1 or directly under it, as live HTML text. Keep the brand name exactly as it
        appears on your Google Business Profile and directory listings, because a slightly different spelling can
        read as a different business. Our guide to{" "}
        <Link href="/blog/entity-seo-how-ai-identifies-your-business">entity SEO</Link> explains why one consistent
        name matters so much.
      </p>

      <h2>What makes a weak homepage different from a strong one?</h2>
      <p>
        A weak homepage relies on images and slogans, while a strong one says the facts in text and repeats them in
        markup. The table below compares the elements that most often decide whether an assistant can describe you.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Element</th>
              <th>Weak for AI search</th>
              <th>Strong for AI search</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Title tag</td>
              <td>&quot;Home&quot; or the brand name alone</td>
              <td>Brand, main service and place, e.g. &quot;Northside Physio | Physiotherapy in Halifax&quot;</td>
            </tr>
            <tr>
              <td>H1</td>
              <td>A slogan</td>
              <td>What you are and where</td>
            </tr>
            <tr>
              <td>Opening text</td>
              <td>Inside a hero image or slider</td>
              <td>A plain HTML paragraph with name, service, area, customer</td>
            </tr>
            <tr>
              <td>Services</td>
              <td>Icons with one-word labels</td>
              <td>Named services, each linking to its own page</td>
            </tr>
            <tr>
              <td>Location and contact</td>
              <td>Only in a map embed</td>
              <td>Address or service area, phone and hours in text</td>
            </tr>
            <tr>
              <td>Proof</td>
              <td>&quot;Trusted by thousands&quot;</td>
              <td>Verifiable facts: years trading, licences, named memberships, real review counts</td>
            </tr>
            <tr>
              <td>Structured data</td>
              <td>None, or a generic plugin default</td>
              <td>Organization or the most specific LocalBusiness type, plus WebSite</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>How do you write a homepage for AI search step by step?</h2>
      <p>
        There are seven steps, starting with the plain entity statement and ending with a check of what the
        assistants now say. Work through them in order, because each one builds on the facts set in the first.
      </p>
      <ol>
        <li>
          <strong>Write the entity statement.</strong> One or two sentences with name, category, place, customer and
          one specific detail. Use it as the H1 or the paragraph right below it.
        </li>
        <li>
          <strong>Fix the title tag.</strong> Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/appearance/title-link" {...ext}>
            title link guidance
          </a>{" "}
          says to write descriptive, concise titles and to avoid vague descriptors like &quot;Home&quot; for your home
          page. Brand plus main service plus place is usually enough.
        </li>
        <li>
          <strong>List services as links.</strong> Name each service in words and link it to a page that explains it.
          Assistants follow those links to answer detailed questions, so give each one a real{" "}
          <Link href="/blog/service-page-for-ai-search">service page</Link>.
        </li>
        <li>
          <strong>State where and when.</strong> Put your address or service area, phone number and hours in text,
          matching your Google Business Profile exactly.
        </li>
        <li>
          <strong>Add proof you can verify.</strong> Years in business, licences, named associations, awards with the
          awarding body, and your real review rating with where it comes from. Never invent numbers or quotes.
        </li>
        <li>
          <strong>Add structured data.</strong> Use Organization, or the most specific LocalBusiness subtype, with
          name, URL, logo, address, phone and sameAs links to your official profiles. Add WebSite markup with your
          preferred site name.
        </li>
        <li>
          <strong>Test what assistants say.</strong> After the changes are indexed, ask ChatGPT, Gemini, Claude and
          Perplexity &quot;What is [your business] and what does it do?&quot; and compare the answer with your
          entity statement.
        </li>
      </ol>

      <h2>Which structured data belongs on the homepage?</h2>
      <p>
        The homepage should carry Organization markup, or the most specific LocalBusiness subtype for a local
        business, plus WebSite markup for your site name. Google recommends both for the home page, and both restate
        facts that should already be in the visible text.
      </p>
      <p>
        Google&apos;s Organization guide says you do not need the markup on every page; the home page or a single
        page describing the organization, such as the about page, is enough. It also recommends using the most
        specific subtype that fits, for example a LocalBusiness type for a restaurant or physical store. Include
        sameAs links to the profiles you control, such as your Google Business Profile, LinkedIn page and industry
        directory listings. Those links help engines connect the scattered mentions of your name into one entity.
      </p>
      <p>
        For the site name, Google says WebSite structured data on the home page is the most important way to state
        your preference, alongside og:site_name, the title and headings. Our guide to{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> has copy-ready examples of
        each type.
      </p>

      <h2>What homepage mistakes hide a business from AI assistants?</h2>
      <p>
        The most common mistakes are putting key text inside images, hiding content behind scripts, using a slogan
        instead of a description and contradicting your own listings. Each one leaves an assistant with less to go
        on than a human visitor sees.
      </p>
      <ul>
        <li>
          <strong>Text baked into images.</strong> A hero banner that says &quot;Halifax&apos;s running injury
          clinic&quot; as a picture is invisible to a crawler that reads text. Our guide on whether{" "}
          <Link href="/blog/do-ai-engines-read-pdfs-images">AI engines read PDFs and images</Link> covers the limits.
        </li>
        <li>
          <strong>Content that needs JavaScript to appear.</strong> Some AI crawlers do not run scripts, so text that
          only loads after a click or animation may never be seen.
        </li>
        <li>
          <strong>Different facts in different places.</strong> A phone number on the homepage that differs from the
          Google profile, or hours that changed in one place only, gives engines two versions to choose from.
        </li>
        <li>
          <strong>Claims with nothing behind them.</strong> &quot;Best in the city&quot; and &quot;trusted by
          thousands&quot; are ignored at best. Google&apos;s{" "}
          <a href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content" {...ext}>
            helpful content guidance
          </a>{" "}
          asks you to make it clear who is behind content and why it exists; specific, checkable facts do that.
        </li>
        <li>
          <strong>Everything on one page.</strong> A homepage that tries to answer every question becomes a wall of
          text. Summarise, then link to the{" "}
          <Link href="/blog/about-page-for-ai-search">about page</Link>, service pages and{" "}
          <Link href="/blog/pricing-pages-ai-recommendations">pricing page</Link>.
        </li>
      </ul>

      <h2>How often should you update your homepage for AI search?</h2>
      <p>
        Update the homepage whenever a core fact changes, such as a new service, location, phone number or hours, and
        review it at least once a quarter. The aim is accuracy, not constant edits, because a homepage that
        contradicts your listings does more harm than one that is simply a few months old.
      </p>
      <p>
        When you do change something, change it everywhere on the same day: the homepage text, the structured data,
        the Google Business Profile and your main directory listings. Then ask the assistants again. Answers change
        from one run to the next, so look for a pattern across several checks rather than one reply.
      </p>

      <h2>How can you see what AI assistants say about your homepage now?</h2>
      <p>
        The quickest way is to ask the assistants directly what your business is and does, then compare their answer
        with what your homepage says. If they describe you vaguely, wrongly or not at all, the homepage and the
        profiles around it are where to start.
      </p>
      <p>
        Alphaa&apos;s <Link href="/start">free 60-second AI check</Link> asks ChatGPT, Gemini, Claude and Perplexity
        about your business and runs a 23-point check of what they can read on your site, including the homepage
        title, text and structured data. On a paid plan, from $99 a month, the agent drafts the fixes, and nothing is
        published to your WordPress, Shopify or Webflow site until you approve it. It cannot control what any model
        says; it makes the public facts clearer.
      </p>

      <h2>What else do people ask about homepages and AI search?</h2>

      <h3>Should my homepage have an FAQ section?</h3>
      <p>
        A short FAQ section can help if it answers real customer questions in a sentence or two each. Keep it to the
        three to five questions people ask most, and put the detailed answers on their own pages.
      </p>

      <h3>How long should homepage text be for AI search?</h3>
      <p>
        There is no required length; what matters is that the key facts appear as text near the top. A few hundred
        words that name your services, area, customers and proof usually say more than a long page of general copy.
      </p>

      <h3>Does a one-page website work for AI search?</h3>
      <p>
        A one-page site can be understood if all the facts are in text, but it gives assistants only one page to
        quote. Separate pages for each main service give them specific answers to cite for specific questions.
      </p>

      <h3>Should the homepage title include my city?</h3>
      <p>
        For a local business, including the city or area in the title usually helps both people and engines
        understand where you work. Keep it natural, such as brand, service and city, and avoid stuffing several towns
        into one title.
      </p>

      <h3>Will rewriting my homepage get me recommended by ChatGPT?</h3>
      <p>
        No single change guarantees a recommendation, because assistants weigh many sources beyond your site. A clear
        homepage removes one common reason they leave you out or describe you wrongly, which is why it is a good
        first fix.
      </p>
    </div>
  )
}
