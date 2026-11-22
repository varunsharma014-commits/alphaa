import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-interior-designers-get-recommended-by-ai",
  title: "How Interior Designers Get Recommended by AI",
  description:
    "How interior designers get recommended by ChatGPT, Gemini, Claude and Perplexity: put services, fees, style, service area and projects in readable text.",
  subtitle:
    "Interior designers get recommended by AI when assistants can read, in plain text, what services they offer, how they charge, which styles and project types they take on, where they work and what past projects involved, backed by a complete Google profile and specific reviews.",
  date: "2026-11-22",
  updated: "2026-11-22",
  readMins: 7,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how interior designers get recommended by ai",
  takeaways: [
    "Clients ask AI for a designer by style, room, budget approach and location in one question, so each fact needs its own sentence.",
    "A portfolio of photos with no captions gives AI assistants almost nothing to quote; every project needs a written summary.",
    "Google says it uses alt text, captions and nearby page text to understand what an image shows.",
    "Google says local results are based mainly on relevance, distance and prominence, and that more reviews and positive ratings can help.",
    "Stating how you charge, such as flat fee, hourly or a minimum project size, helps AI match you to the right client.",
  ],
  sources: [
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
      title: "Image SEO Best Practices",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/google-images",
    },
    {
      title: "Searching the web with ChatGPT | OpenAI Help Center",
      publisher: "OpenAI",
      url: "https://help.openai.com/en/articles/9237897-chatgpt-search",
    },
    {
      title: "CIDQ",
      publisher: "Council for Interior Design Qualification",
      url: "https://www.cidq.org/",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Interior designers get recommended by AI when ChatGPT, Gemini, Claude and
        Perplexity can read what you design, how you charge, where you work and what past projects involved, in plain
        text rather than only photos. Start by writing a short summary under every portfolio project and a services
        page that states your fee approach.
      </p>

      <p>
        This guide is for independent designers and small studios doing residential or commercial work. It covers
        what clients ask AI assistants, why many talented designers are invisible to them, and the fixes to make
        first.
      </p>

      <h2>What do clients ask AI about interior designers?</h2>
      <p>
        Clients ask AI assistants for a designer who matches a style, a room, a budget approach and a location, often
        all in one sentence. These questions are more specific than a classic search for &quot;interior designer near
        me&quot;, and the assistant answers them by matching details it can find in writing.
      </p>
      <ul>
        <li>&quot;Interior designer in Denver who does warm modern kitchens and works with contractors.&quot;</li>
        <li>&quot;Who offers e-design for a small apartment living room under a flat fee?&quot;</li>
        <li>&quot;Best interior designers for a full home renovation in Toronto, not just decorating.&quot;</li>
        <li>&quot;Commercial interior designer for a dental office fit-out near Phoenix.&quot;</li>
        <li>&quot;Does this designer charge hourly or a percentage of the project?&quot;</li>
      </ul>
      <p>
        OpenAI&apos;s help page on{" "}
        <a href="https://help.openai.com/en/articles/9237897-chatgpt-search" {...ext}>
          searching the web with ChatGPT
        </a>{" "}
        says ChatGPT can use an approximate location to find local results. So the location part is handled for the
        client; your job is to make the style, scope and fee details findable.
      </p>

      <h2>Why do AI assistants skip many interior designers?</h2>
      <p>
        AI assistants skip many designers because their websites show beautiful work but say very little in words.
        Design sites are built around images, and an image gallery with no captions leaves an assistant guessing what
        the room is, where it is and what the designer actually did.
      </p>
      <p>The usual gaps look like this:</p>
      <ul>
        <li>
          <strong>Portfolio without text.</strong> Projects titled &quot;Project 07&quot; with a slideshow and no
          description of scope, rooms, style or location.
        </li>
        <li>
          <strong>Vague services.</strong> &quot;Bespoke interiors&quot; with no list of what is included, such as
          space planning, furnishing, renovation drawings or project management.
        </li>
        <li>
          <strong>No fee information.</strong> Nothing on how you charge, so an assistant cannot match you to a client
          asking about flat-fee or hourly design.
        </li>
        <li>
          <strong>Unclear service area.</strong> A city in the footer but no statement of which neighborhoods or
          regions you take on, or whether you work remotely.
        </li>
        <li>
          <strong>Mismatched profiles.</strong> Different business names, phone numbers or descriptions across the
          website, Google profile, Houzz and Instagram.
        </li>
      </ul>

      <h2>Which facts should an interior design website publish?</h2>
      <p>
        An interior design website should publish, in plain text, the facts a client uses to shortlist a designer:
        services, styles, project types, fee approach, service area, process and credentials. This table shows what
        to write and where.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fact</th>
              <th>What to write</th>
              <th>Where it goes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Services</td>
              <td>Full-service design, consultations, e-design, renovation design, styling, procurement</td>
              <td>Services page, one section each</td>
            </tr>
            <tr>
              <td>Project types</td>
              <td>Kitchens, bathrooms, whole homes, rentals, offices, clinics, hospitality</td>
              <td>Services page and portfolio filters</td>
            </tr>
            <tr>
              <td>Styles</td>
              <td>The two or three styles you are known for, described in plain words</td>
              <td>Homepage and About page</td>
            </tr>
            <tr>
              <td>Fee approach</td>
              <td>Flat fee, hourly, percentage or package, plus any minimum project size</td>
              <td>Services or pricing page</td>
            </tr>
            <tr>
              <td>Service area</td>
              <td>Cities and regions you work in, and whether you take remote projects</td>
              <td>Homepage, contact page, Google profile</td>
            </tr>
            <tr>
              <td>Process and timeline</td>
              <td>Steps from first call to install, with typical durations if you track them</td>
              <td>Process or FAQ page</td>
            </tr>
            <tr>
              <td>Credentials</td>
              <td>Certifications, memberships and years in practice, stated accurately</td>
              <td>About page and author bios</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        You do not have to publish exact prices to be useful. &quot;Flat-fee e-design per room, and full-service
        projects billed hourly with a minimum scope&quot; is already enough for an assistant to match you to the
        right question. Our guide to{" "}
        <Link href="/blog/pricing-pages-ai-recommendations">pricing pages and AI recommendations</Link> covers how to
        describe pricing without boxing yourself in.
      </p>

      <h2>How should designers write portfolio pages for AI?</h2>
      <p>
        Designers should give every portfolio project its own page with a written summary of the brief, the rooms,
        the style, the location and what the designer did. Photos sell the work to people; the words are what an
        assistant reads and repeats.
      </p>
      <p>
        Google&apos;s{" "}
        <a href="https://developers.google.com/search/docs/appearance/google-images" {...ext}>
          Image SEO Best Practices
        </a>{" "}
        says Google extracts information about an image from the page content, including captions and image titles,
        and that alt text is the most important attribute for describing an image. A useful project page includes:
      </p>
      <ol>
        <li>
          <strong>A descriptive title.</strong> &quot;Warm modern kitchen renovation in a 1960s bungalow, Denver&quot;
          rather than &quot;The Smith Project&quot;.
        </li>
        <li>
          <strong>A three to five sentence summary.</strong> The brief, the constraints, what you changed and who you
          worked with, such as the contractor or architect.
        </li>
        <li>
          <strong>Scope in a short list.</strong> Space planning, cabinetry design, lighting plan, furniture sourcing,
          styling.
        </li>
        <li>
          <strong>Alt text on every photo.</strong> Describe what the photo shows, for example &quot;walnut kitchen
          island with white oak floor and brass pendant lights&quot;.
        </li>
        <li>
          <strong>Client words only with permission.</strong> A short quote from the client adds weight, but only with
          their written consent, and never edited to change its meaning.
        </li>
      </ol>
      <p>
        Leave out client names and addresses unless the client has agreed. Our guide to{" "}
        <Link href="/blog/case-study-pages-ai-search">case study pages for AI search</Link> has a full template.
      </p>

      <h2>How should an interior designer set up a Google Business Profile?</h2>
      <p>
        An interior designer should complete every field of a Google Business Profile, choose the category that
        matches the core service, and state the service area clearly. Google&apos;s help page{" "}
        <a href="https://support.google.com/business/answer/7091" {...ext}>
          Tips to improve your local ranking on Google
        </a>{" "}
        says local results are based mainly on relevance, distance and prominence, and that complete, detailed
        business information helps Google match a profile to relevant searches.
      </p>
      <p>
        If you work from a home studio and visit clients, set a service area rather than showing a home address.
        Write the description the way you would answer &quot;what do you do?&quot;, add your own project photos, and
        post updates about recent projects with a sentence of context each. Our guide on{" "}
        <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link> explains
        how profiles feed assistant responses.
      </p>

      <h2>Which structured data should a design studio use?</h2>
      <p>
        A design studio should use LocalBusiness structured data, or the more specific ProfessionalService type, with
        the business name, address or service area, phone, hours, website and links to official profiles. Google&apos;s{" "}
        <a
          href="https://developers.google.com/search/docs/appearance/structured-data/local-business"
          {...ext}
        >
          LocalBusiness structured data documentation
        </a>{" "}
        lists the properties it reads, such as name, address, telephone, opening hours and URL.
      </p>
      <p>
        Keep the markup identical to what the page says and what your Google profile says. Use the sameAs property to
        link your Houzz, Instagram and LinkedIn profiles so engines can connect them to one business. Our{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup guide</Link> has examples you can adapt.
      </p>

      <h2>How do reviews and credentials affect AI recommendations?</h2>
      <p>
        Reviews and credentials help AI assistants decide whether to trust a designer, and specific ones are easier
        to repeat than general praise. Google says more reviews and positive ratings can help a business&apos;s local
        ranking.
      </p>
      <p>
        A review that says &quot;she redesigned our small kitchen, worked with our contractor and kept to the
        budget&quot; gives an assistant a fact to repeat. When you ask for reviews, ask clients to mention the room,
        the style or how the project ran. Reply to each review with the same specifics.
      </p>
      <p>
        State credentials exactly. CIDQ, the{" "}
        <a href="https://www.cidq.org/" {...ext}>
          Council for Interior Design Qualification
        </a>
        , develops and administers the NCIDQ Examination and works with regulatory boards in the United States and
        Canada. If you hold a certification or membership, name it on your About page; if your jurisdiction
        regulates the &quot;interior designer&quot; title, describe yourself in line with those rules.
      </p>

      <h2>What should an interior designer fix first?</h2>
      <p>
        Fix the pages that answer &quot;who are you, what do you do and how do you charge&quot; first, then the
        portfolio, then everything else. This order gets the most important facts readable fastest.
      </p>
      <ol>
        <li>
          <strong>Ask the assistants.</strong> Type three client questions into ChatGPT, Gemini, Claude and
          Perplexity, and note who is named and what is said about you.
        </li>
        <li>
          <strong>Write the services page.</strong> One section per service, with project types and fee approach.
        </li>
        <li>
          <strong>Caption the top ten projects.</strong> Title, summary, scope list and alt text on every photo.
        </li>
        <li>
          <strong>Complete the Google profile.</strong> Category, service area, description, photos and a recent post.
        </li>
        <li>
          <strong>Align every profile.</strong> Same name, phone, website and description on Houzz, Instagram and
          directories.
        </li>
        <li>
          <strong>Add an FAQ.</strong> Answer the questions clients ask on the first call, such as timelines, working
          with contractors and remote projects.
        </li>
      </ol>
      <p>
        For the wider picture, see our guide to{" "}
        <Link href="/blog/get-recommended-by-ai-local-service-business">getting a local service business recommended
        by AI</Link> and the related page on{" "}
        <Link href="/blog/how-general-contractors-get-recommended-by-ai">how general contractors get recommended by
        AI</Link>, since many design projects are won alongside a builder.
      </p>

      <h2>How can Alphaa help an interior design studio?</h2>
      <p>
        Alphaa helps by checking what ChatGPT, Gemini, Claude and Perplexity say about your studio each week and
        drafting the fixes for you to approve. It is an AI agent, from $99 a month, that writes FAQ content,
        structured data, Google Business Profile posts and review replies, and publishes approved changes to
        WordPress, Shopify or Webflow.
      </p>
      <p>
        It cannot edit what an AI model says and does not promise a recommendation. It changes the public facts the
        assistants read, and shows you what changed. You can start with the{" "}
        <Link href="/start">free 60-second AI check</Link>.
      </p>

      <h2>What else do interior designers ask about AI visibility?</h2>

      <h3>Can AI assistants see my portfolio photos?</h3>
      <p>
        AI assistants rely mostly on the text around your photos to understand them, so captions, titles and alt text
        matter. A gallery with no words gives them very little to describe or recommend.
      </p>

      <h3>Do I need to publish my design fees?</h3>
      <p>
        No, you do not need exact prices, but you should say how you charge. Stating flat fee, hourly or percentage,
        plus any minimum project size, helps an assistant match you to clients who fit.
      </p>

      <h3>Does my Houzz or Instagram profile affect AI recommendations?</h3>
      <p>
        Profiles on Houzz and Instagram can be read as extra evidence about your business when they are public and
        consistent with your website. Use the same name, phone and description everywhere and link them with sameAs
        markup.
      </p>

      <h3>Should I create a page for every city I work in?</h3>
      <p>
        Only create a city page when you have real projects or a real service offering there to describe. Thin pages
        that swap the city name add little; one strong service-area section often works better.
      </p>

      <h3>How long does it take for AI to recommend my studio?</h3>
      <p>
        There is no fixed timeline, because each assistant refreshes its sources on its own schedule. Making your
        facts readable and consistent improves the odds, and weekly checks show when answers start to change.
      </p>
    </div>
  )
}
