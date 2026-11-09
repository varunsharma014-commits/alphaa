import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-tutoring-centers-get-recommended-by-ai",
  title: "How Tutoring Centers Get Recommended by AI (2026)",
  description:
    "How tutoring centers and tutors get recommended by ChatGPT, Gemini, Claude and Perplexity: publish subjects, grades, prices and formats in plain text.",
  subtitle:
    "Tutoring centers get recommended by AI when assistants can read exactly which subjects, grades, formats, prices and areas they cover, backed by consistent profiles and specific parent reviews.",
  date: "2026-11-08",
  updated: "2026-11-08",
  readMins: 5,
  tag: "Industry",
  kind: "industry",
  keyphrase: "how tutoring centers get recommended by ai",
  image: {
    src: "/blog/how-tutoring-centers-get-recommended-by-ai.webp",
    alt: "A spiral notebook, a yellow pencil and a wooden ruler on a cream desk beside a lamp, a small plant and a stack of books.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "AI assistants match a parent's question to subjects, grade levels, location and format, so each must be written on your site in plain text.",
    "Google Business Profile allows a profile for a business with a location customers visit or one that travels to customers.",
    "Home-visit tutors who do not serve customers at their address should remove it and list up to 20 service areas.",
    "A page per subject or exam gives assistants a specific answer to quote, instead of one vague services list.",
    "Reviews that name the subject, grade and result give assistants concrete evidence to repeat.",
  ],
  sources: [
    {
      title: "Guidelines for representing your business on Google - Google Business Profile Help",
      publisher: "Google Business Profile Help",
      url: "https://support.google.com/business/answer/3038177",
    },
    {
      title: "Manage your service areas for service-area & hybrid businesses - Google Business Profile Help",
      publisher: "Google Business Profile Help",
      url: "https://support.google.com/business/answer/9157481",
    },
    {
      title: "EducationalOrganization - Schema.org Type",
      publisher: "Schema.org",
      url: "https://schema.org/EducationalOrganization",
    },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
    {
      title: "AI Features and Your Website",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/ai-features",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <strong>Short answer:</strong> Tutoring centers get recommended by AI when ChatGPT, Gemini, Claude and
        Perplexity can read exactly what they teach, for which grades, in what format, at what price and where. Start
        by giving each subject or exam its own page with those facts in plain text, then make your Google Business
        Profile match it.
      </p>

      <p>
        This guide is for tutoring centers, learning centers and independent tutors, whether you teach in a
        classroom, in students&apos; homes or online. It explains how assistants pick tutors to recommend and what to
        change first.
      </p>

      <h2>Why are parents asking AI to find a tutor?</h2>
      <p>
        Parents ask AI because a tutoring question is specific and an assistant can answer the specifics in one
        reply. &quot;Find a GCSE maths tutor near me who does evenings&quot; or &quot;best SAT prep in Austin for a
        junior aiming for 1400&quot; is the kind of question a list of blue links handles badly and a chat answer
        handles well. 65% of consumers now use AI tools to research products before buying (Clutch, 2026), and
        services that families compare carefully are a natural fit for that habit.
      </p>
      <p>
        For a tutoring business, that changes what &quot;being found&quot; means. You are no longer only competing for a
        ranking. You are competing to be one of the two or three names an assistant is confident enough to suggest,
        with a reason attached. Our explainer on{" "}
        <Link href="/blog/your-next-customer-is-asking-chatgpt-first">customers asking ChatGPT first</Link> covers
        the shift in more detail.
      </p>

      <h2>How do AI assistants decide which tutors to recommend?</h2>
      <p>
        AI assistants recommend the tutors whose public information best matches every part of the question and
        is corroborated by other sources. When they search the web for an answer, they look for pages that state the
        subject, grade, location and format directly, then check profiles and reviews to decide who seems
        trustworthy.
      </p>
      <ul>
        <li>
          <strong>Match:</strong> does a page say you teach this subject, at this level, in this area or online?
        </li>
        <li>
          <strong>Specifics:</strong> are prices, session lengths, schedules and tutor qualifications stated, or do
          visitors have to call?
        </li>
        <li>
          <strong>Corroboration:</strong> do your Google Business Profile, directories and website agree on your
          name, address, phone and services?
        </li>
        <li>
          <strong>Evidence:</strong> do reviews and case examples mention real subjects, grades and outcomes?
        </li>
      </ul>
      <p>
        Google says there are no special requirements for its AI features beyond normal search eligibility, in its{" "}
        <a href="https://developers.google.com/search/docs/appearance/ai-features" {...ext}>
          AI Features and Your Website
        </a>{" "}
        guidance. The other assistants work differently, but the practical lesson is the same: clear, crawlable,
        consistent facts win. Our guide to{" "}
        <Link href="/blog/what-sources-do-ai-engines-cite">what sources AI engines cite</Link> explains where those
        facts get picked up.
      </p>

      <h2>Which parent questions should your website answer?</h2>
      <p>
        Your website should answer the questions parents actually type, each in a sentence an assistant can lift
        whole. If a fact only lives in a PDF, a booking widget or a phone call, assume the assistant cannot see it.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Parent question</th>
              <th>What to publish</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Do you teach my child&apos;s subject and level?</td>
              <td>A page per subject or exam listing grades or year groups covered</td>
            </tr>
            <tr>
              <td>How much does it cost?</td>
              <td>Hourly or package prices, or a clear starting price, as text</td>
            </tr>
            <tr>
              <td>In person, at home or online?</td>
              <td>Each format offered, with the areas you travel to</td>
            </tr>
            <tr>
              <td>Who are the tutors?</td>
              <td>Short tutor bios with subjects, qualifications and experience</td>
            </tr>
            <tr>
              <td>When are sessions?</td>
              <td>Days and hours, including evenings, weekends and school holidays</td>
            </tr>
            <tr>
              <td>How do you track progress?</td>
              <td>Your assessment and reporting method, in plain words</td>
            </tr>
            <tr>
              <td>Are tutors background checked?</td>
              <td>Your actual safeguarding process, stated accurately</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Specific pages beat one long services list. &quot;SAT math tutoring for grades 10 to 12, in person in Round
        Rock or online, with the hourly price listed&quot; is a sentence an assistant can repeat. &quot;We help students reach their
        potential&quot; is not. Our guide on{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">writing content AI will quote</Link> goes deeper on that
        style.
      </p>

      <h2>How should a tutoring business set up its Google Business Profile?</h2>
      <p>
        Set it up to match how you actually meet students, because Google&apos;s rules differ for centers, home-visit
        tutors and online-only tutors. Google&apos;s{" "}
        <a href="https://support.google.com/business/answer/3038177" {...ext}>
          guidelines for representing your business
        </a>{" "}
        allow a profile for a business with a physical location customers can visit, or one that travels to
        customers where they are, and say a virtual office is not eligible.
      </p>
      <ol>
        <li>
          <strong>Tutoring center with a classroom:</strong> list the storefront address and the hours staff are
          there. If you also teach in homes, Google treats you as a hybrid business that can show the address and a
          service area.
        </li>
        <li>
          <strong>Home-visit tutor:</strong> Google&apos;s{" "}
          <a href="https://support.google.com/business/answer/9157481" {...ext}>
            service-area guidance
          </a>{" "}
          says to remove your address if you do not serve customers there. You can list up to 20 service areas, and
          the overall area should not be more than about two hours&apos; drive.
        </li>
        <li>
          <strong>Online-only tutor:</strong> with no location students visit and no travel to them, you do not fit
          Google&apos;s eligibility rules, so put the effort into your website, directories and reviews instead.
        </li>
        <li>
          <strong>Name:</strong> use your real business name. Google says unnecessary information in the business
          name is not permitted, so leave out &quot;best SAT tutor&quot; style keywords.
        </li>
      </ol>
      <p>
        Fill in categories, services, a description that names your subjects and grades, and photos of the real
        space. Our guide to{" "}
        <Link href="/blog/google-business-profile-ai-answers">Google Business Profile and AI answers</Link> covers
        each field.
      </p>

      <h2>What structured data should a tutoring center use?</h2>
      <p>
        A tutoring center should use LocalBusiness structured data with its name, address or service area, phone,
        hours and URL, matching the profile exactly. Google documents the required and recommended properties in its{" "}
        <a href="https://developers.google.com/search/docs/appearance/structured-data/local-business" {...ext}>
          Local Business structured data
        </a>{" "}
        guide.
      </p>
      <p>
        Schema.org also has an{" "}
        <a href="https://schema.org/EducationalOrganization" {...ext}>
          EducationalOrganization
        </a>{" "}
        type for organizations that teach. JSON-LD lets one entity carry more than one type, so a center can be marked
        up as both LocalBusiness and EducationalOrganization. Add an FAQ section in plain HTML for your top parent
        questions. Markup only helps when it repeats what the visible page already says. Our{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup guide</Link> has examples.
      </p>

      <h2>How can a tutoring center get recommended by AI step by step?</h2>
      <p>
        There are six steps, and the first is simply finding out what the assistants say about you today. Do them in
        this order.
      </p>
      <ol>
        <li>
          <strong>Ask the assistants.</strong> Type three questions a parent in your area would ask into ChatGPT,
          Gemini, Claude and Perplexity. Note who is named and why.
        </li>
        <li>
          <strong>Build subject pages.</strong> One page per subject or exam, with grades, formats, prices and
          schedule in the first paragraph.
        </li>
        <li>
          <strong>Publish tutor bios.</strong> Subjects, qualifications and experience for each tutor, stated
          accurately.
        </li>
        <li>
          <strong>Align your profiles.</strong> Make your Google Business Profile, Bing Places, Apple Business Connect
          and any tutoring directories match your site.
        </li>
        <li>
          <strong>Ask for specific reviews.</strong> After a good term, ask parents to mention the subject, grade and
          what changed. Never offer incentives or write reviews yourself.
        </li>
        <li>
          <strong>Keep it current.</strong> Update prices, exam dates and seasonal programmes such as summer camps
          before each term, so assistants are not repeating last year&apos;s details.
        </li>
      </ol>
      <p>
        Alphaa does this work for owners who do not have time for it. It asks ChatGPT, Gemini, Claude and
        Perplexity about your business every week, runs a 23-point check of your site, and drafts subject pages,
        FAQs, structured data and review replies for you to approve. Approved changes publish to WordPress, Shopify
        or Webflow, from $99 a month. It cannot control what an AI says; it improves the public facts the assistants
        read. Our wider guide for{" "}
        <Link href="/blog/get-recommended-by-ai-local-service-business">local service businesses</Link> covers the
        same mechanics for other trades.
      </p>

      <h2>What should tutoring businesses avoid when chasing AI visibility?</h2>
      <p>
        Avoid outcome promises, fake reviews and vague pages, because each one either breaks a rule or gives an
        assistant nothing trustworthy to repeat. Claims like &quot;guaranteed grade improvement&quot; are risky in
        education marketing and hard for any engine to verify. Paying for reviews or writing them yourself breaks
        platform policies.
      </p>
      <p>
        Also avoid hiding prices entirely, publishing dozens of near-identical town pages, and letting old
        programmes linger online. If you serve several towns, our guide on{" "}
        <Link href="/blog/do-city-landing-pages-work-ai-search">whether city landing pages work for AI search</Link>{" "}
        explains when they help and when they hurt.
      </p>

      <h2>What else do tutors ask about AI recommendations?</h2>

      <h3>Can an online-only tutor get recommended by AI?</h3>
      <p>
        Yes, an online-only tutor can be recommended for questions like &quot;online chemistry tutor for A-level&quot;,
        but it relies on the website, directories and reviews rather than a Google Business Profile. Make the subject
        pages, prices and tutor credentials especially clear.
      </p>

      <h3>Should we publish our tutoring prices?</h3>
      <p>
        Publishing prices, or at least a starting price, gives assistants a fact to quote when parents ask about cost.
        If prices vary, explain what drives the difference, such as level, session length or package size.
      </p>

      <h3>Do franchise tutoring centers have an advantage in AI answers?</h3>
      <p>
        Large brands are mentioned widely, which helps, but an independent center that answers a specific local
        question better can still be named. Specific subject pages and detailed parent reviews are where smaller
        centers can compete.
      </p>

      <h3>Do tutoring directory listings matter for AI?</h3>
      <p>
        Directory listings matter because assistants use them to corroborate your details. Keep your name, phone,
        address or service area and subjects identical everywhere, and remove duplicates you no longer control.
      </p>

      <h3>How long does it take for AI assistants to reflect changes?</h3>
      <p>
        There is no fixed timeline, because each assistant recrawls and refreshes sources on its own schedule. Check
        again a few weeks after publishing, and keep the pages current so the facts stay right when they are picked
        up.
      </p>
    </div>
  )
}
