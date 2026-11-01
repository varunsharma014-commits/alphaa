import Link from "next/link"
import type { PostMeta } from "./types"

export const meta: PostMeta = {
  slug: "how-optometrists-get-recommended-by-ai",
  title: "How Optometrists Get Recommended by AI",
  description:
    "Patients ask ChatGPT which eye doctor takes their vision plan or fits contacts. How optometry practices get named in AI answers, and the fixes that matter most.",
  subtitle:
    "Optometrists get recommended when their insurance plans, exam types, contact lens and specialty services, doctors and hours are written in plain text and match their listings.",
  date: "2026-11-01",
  updated: "2026-11-01",
  readMins: 7,
  tag: "Playbook",
  kind: "industry",
  keyphrase: "how optometrists get recommended by ai",
  image: {
    src: "/blog/how-optometrists-get-recommended-by-ai.webp",
    alt: "Three pairs of eyeglass frames in tortoiseshell, gold and black on a pale wooden shelf, with a phoropter out of focus behind them.",
    width: 1600,
    height: 900,
  },
  takeaways: [
    "Patients ask AI assistants about insurance, exam types, contact lenses and children's eye care, not just for an eye doctor nearby.",
    "The vision and medical plans you accept are the fact AI answers most often need and most practice sites hide.",
    "Schema.org lists Optometric and Optician as MedicalBusiness types, so a practice can describe itself precisely in structured data.",
    "Google ranks local results mainly on relevance, distance and prominence, and says more reviews and good ratings can help.",
    "Each service, such as dry eye care or myopia management, needs its own page with plain facts to be cited for it.",
  ],
  sources: [
    { title: "Comprehensive eye exams", publisher: "American Optometric Association", url: "https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eye-exams" },
    { title: "Optometric - Schema.org Enumeration Member", publisher: "Schema.org", url: "https://schema.org/Optometric" },
    { title: "Optician - Schema.org Type", publisher: "Schema.org", url: "https://schema.org/Optician" },
    { title: "Tips to improve your local ranking on Google", publisher: "Google Help", url: "https://support.google.com/business/answer/7091" },
    { title: "Guidelines for representing your business on Google", publisher: "Google Help", url: "https://support.google.com/business/answer/3038177" },
    {
      title: "Local Business (LocalBusiness) Structured Data",
      publisher: "Google Search Central",
      url: "https://developers.google.com/search/docs/appearance/structured-data/local-business",
    },
  ],
}

const ext = { target: "_blank", rel: "noopener" } as const

export function Body() {
  return (
    <div className="article-prose">
      <p>
        <em>
          By the Alphaa team — we build an AI agent that checks what ChatGPT, Gemini, Claude and Perplexity say about
          local businesses. Published 1 November 2026.
        </em>
      </p>

      <p>
        <strong>Short answer:</strong> Optometrists get recommended by AI when the facts patients ask about are
        written in plain text on their own site and match their listings: the vision and medical insurance plans
        accepted, exam types and prices, contact lens fittings, pediatric and specialty care, doctor names, and
        hours. Start with an insurance page, because that is the question practice sites most often leave unanswered.
      </p>

      <p>
        This playbook is for independent optometry practices and small groups. It covers what patients ask AI
        assistants, what those assistants read, and the specific pages and listings that make a practice easy to
        recommend.
      </p>

      <h2>What do patients ask AI about eye doctors?</h2>
      <p>
        Patients ask AI assistants practical questions about coverage, appointments and specific problems, such as
        which optometrist near them takes a particular vision plan or fits contacts for astigmatism. The questions are
        longer and more specific than a map search, and the answer is a short list of practices with a reason for
        each.
      </p>
      <ul>
        <li>Which eye doctors near me take my vision insurance, and does it cover contact lens exams?</li>
        <li>Where can I get a same-day eye exam on a Saturday?</li>
        <li>Who does pediatric eye exams or myopia management for children in my area?</li>
        <li>Is there an optometrist nearby who treats dry eye?</li>
        <li>Where can I get fitted for contacts if I have astigmatism or wear multifocals?</li>
        <li>What is the difference between an optometrist and an ophthalmologist, and which should I see?</li>
      </ul>
      <p>
        Each of these has a factual answer. The practice whose site states that answer clearly is the one the
        assistant can name with confidence. A homepage that says &quot;comprehensive eye care for the whole family&quot;
        answers none of them.
      </p>

      <h2>Why is optometry harder for AI to recommend than other local businesses?</h2>
      <p>
        Optometry is harder because eye care is health care, insurance is complicated, and the same practice can be a
        medical office and a retail shop at once, so assistants need more specific facts before they will name one.
        Three things make the category unusual.
      </p>
      <ul>
        <li>
          <strong>Two kinds of insurance.</strong> Routine exams and glasses often go through a vision plan, while
          eye disease and injuries may be billed to medical insurance. A patient asking about coverage needs to know
          which of their plans you take, and for what.
        </li>
        <li>
          <strong>Exams versus screenings.</strong> The{" "}
          <a href="https://www.aoa.org/healthy-eyes/caring-for-your-eyes/eye-exams" {...ext}>
            American Optometric Association
          </a>{" "}
          distinguishes a comprehensive eye exam from a vision screening and warns that screenings can miss problems.
          Practices that explain what their exam includes give the assistant something precise to repeat.
        </li>
        <li>
          <strong>Retail and clinic in one.</strong> Many practices sell frames and lenses too. An assistant asked
          for an eye exam and one asked for designer frames are looking for different facts on the same site.
        </li>
      </ul>

      <h2>What do AI assistants read about an optometry practice?</h2>
      <p>
        AI assistants read the practice&apos;s own pages, its Google Business Profile, its reviews, and directory and
        insurance network listings, then favour the facts that agree across them. If your site, your profile and an
        insurer&apos;s directory list different hours or plans, the assistant has less reason to trust any of them.
      </p>
      <p>
        Google&apos;s own guidance on{" "}
        <a href="https://support.google.com/business/answer/7091" {...ext}>
          improving local ranking
        </a>{" "}
        says local results are based mainly on relevance, distance and prominence, and that more reviews and positive
        ratings can help. Those same signals feed the AI answers that rely on Google, and the chat assistants that
        search the web look for similar evidence. Our guide on{" "}
        <Link href="/blog/what-sources-do-ai-engines-cite">what sources AI engines cite</Link> explains which of these
        carry the most weight.
      </p>

      <h2>Which pages should an optometry practice publish?</h2>
      <p>
        An optometry practice should publish one page per question patients actually ask, starting with insurance,
        exams, contact lenses, children&apos;s eye care and each specialty service. The table shows what each page
        needs to say.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Facts to state in plain text</th>
              <th>Question it answers</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Insurance</td>
              <td>Every vision and medical plan by name, what each covers, self-pay prices</td>
              <td>&quot;Do they take my plan?&quot;</td>
            </tr>
            <tr>
              <td>Eye exams</td>
              <td>What a comprehensive exam includes, how long it takes, price without insurance</td>
              <td>&quot;How much is an eye exam?&quot;</td>
            </tr>
            <tr>
              <td>Contact lenses</td>
              <td>Fitting fee, lens types fitted (toric, multifocal, specialty), follow-up visits</td>
              <td>&quot;Who fits contacts for astigmatism?&quot;</td>
            </tr>
            <tr>
              <td>Children&apos;s eye care</td>
              <td>Youngest age seen, myopia management if offered, school-form help</td>
              <td>&quot;Who does kids&apos; eye exams?&quot;</td>
            </tr>
            <tr>
              <td>Specialty services</td>
              <td>Dry eye, emergency visits, low vision, co-management, with what is done in-office</td>
              <td>&quot;Who treats dry eye nearby?&quot;</td>
            </tr>
            <tr>
              <td>Doctors</td>
              <td>Each optometrist&apos;s name, credentials, languages spoken and areas of focus</td>
              <td>&quot;Which doctor should I book?&quot;</td>
            </tr>
            <tr>
              <td>Appointments</td>
              <td>Hours, weekend and same-day availability, how to book, parking and access</td>
              <td>&quot;Can I be seen on Saturday?&quot;</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Only claim what you actually offer. Saying you treat a condition you refer out puts a wrong fact into AI
        answers, and that is harder to fix than a missing one. Our guide to{" "}
        <Link href="/blog/how-to-write-content-ai-quotes">writing content AI quotes</Link> shows how to phrase each
        page so a single sentence can be lifted whole.
      </p>

      <h2>How should an optometry practice set up structured data?</h2>
      <p>
        An optometry practice should mark up each location with a specific Schema.org type, such as Optometric, plus
        the name, address, phone, hours and doctors that appear on the page. Schema.org lists{" "}
        <a href="https://schema.org/Optometric" {...ext}>
          Optometric
        </a>{" "}
        as both a medical specialty and a more specific type of MedicalBusiness, defined as the science or practice of
        testing visual acuity and prescribing corrective lenses.
      </p>
      <p>
        If your location is mainly a shop, Schema.org also has an{" "}
        <a href="https://schema.org/Optician" {...ext}>
          Optician
        </a>{" "}
        type, described as a store that sells reading glasses and similar devices for improving vision. Google&apos;s{" "}
        <a
          href="https://developers.google.com/search/docs/appearance/structured-data/local-business"
          {...ext}
        >
          LocalBusiness structured data documentation
        </a>{" "}
        lists the required and recommended properties. Whatever you mark up must match the visible page. Our guide to{" "}
        <Link href="/blog/schema-markup-for-ai-search">schema markup for AI search</Link> has a working example.
      </p>

      <h2>What should an optometry practice do first, step by step?</h2>
      <p>
        Start with the insurance page and your Google Business Profile, then work through services, reviews and
        listings. Six steps cover most of the gap.
      </p>
      <ol>
        <li>
          <strong>Publish an insurance page.</strong> List every plan by name, say whether each covers routine exams,
          contact lens exams or medical visits, and give self-pay prices.
        </li>
        <li>
          <strong>Fix your Google Business Profile.</strong> Use your real practice name, exact hours and accurate
          services, as Google&apos;s{" "}
          <a href="https://support.google.com/business/answer/3038177" {...ext}>
            guidelines for representing your business
          </a>{" "}
          require. Keyword-stuffed names break those rules.
        </li>
        <li>
          <strong>Give each service its own page.</strong> Dry eye, myopia management, contact lens fittings and
          emergency visits each need a page that says what you do and who it is for.
        </li>
        <li>
          <strong>Ask for specific reviews.</strong> A review that says &quot;fitted my toric lenses in one visit&quot;
          tells an assistant more than five stars alone. Reply to reviews without sharing any patient details.
        </li>
        <li>
          <strong>Make listings agree.</strong> Check insurer provider directories, health directories and
          professional association listings for the same name, address, phone and hours.
        </li>
        <li>
          <strong>Check the answers.</strong> Ask ChatGPT, Gemini, Claude and Perplexity your patients&apos;
          questions and note who is named and why.
        </li>
      </ol>
      <p>
        The same pattern works for other health practices; compare our playbooks for{" "}
        <Link href="/blog/how-dentists-get-recommended-by-ai">dentists</Link> and{" "}
        <Link href="/blog/how-chiropractors-get-recommended-by-ai">chiropractors</Link>.
      </p>

      <h2>How can an optometrist see what AI says about the practice today?</h2>
      <p>
        The fastest way is to ask the assistants directly or run Alphaa&apos;s{" "}
        <Link href="/start">free 60-second AI check</Link>, which shows what ChatGPT, Gemini, Claude and Perplexity
        say about your practice. Alphaa is an AI agent that monitors those answers every week and drafts fixes such
        as insurance and service pages, structured data and review replies. Nothing is published until you approve
        it.
      </p>
      <p>
        It works with WordPress, Shopify and Webflow through{" "}
        <Link href="/integrations">its integrations</Link> and costs from $99 a month. It cannot edit an AI model or
        guarantee a recommendation; it improves the public facts the assistants read.
      </p>

      <h2>What else do optometrists ask about AI visibility?</h2>

      <h3>Should optometrists list prices on their website?</h3>
      <p>
        Yes, listing self-pay prices for exams and contact lens fittings gives AI assistants a concrete fact to quote
        when patients ask about cost. A range is fine if prices vary, as long as it is accurate.
      </p>

      <h3>Do insurance provider directories affect AI recommendations?</h3>
      <p>
        They can, because they are third-party sources that confirm which plans you accept and where you practise.
        Keep your details in each insurer&apos;s directory identical to your website and Google Business Profile.
      </p>

      <h3>Does selling frames online help an optometry practice in AI search?</h3>
      <p>
        It can help for shopping questions, but it is separate from being recommended for eye exams. Keep clinical
        services and retail products on clearly separate pages so each answers its own question.
      </p>

      <h3>Can an optometry practice pay to be recommended by ChatGPT?</h3>
      <p>
        No, there is no way to pay ChatGPT, Gemini, Claude or Perplexity to be included in their organic
        recommendations. What a practice can do is publish clear facts and earn reviews that make it easier to
        recommend.
      </p>

      <h3>How should a practice with several locations handle AI search?</h3>
      <p>
        Give each location its own page with its own address, hours, doctors and services, and its own Google
        Business Profile. Our guide to{" "}
        <Link href="/blog/multi-location-business-ai-visibility">multi-location AI visibility</Link> covers the
        details.
      </p>
    </div>
  )
}
