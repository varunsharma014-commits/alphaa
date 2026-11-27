import Link from "next/link"
import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section, ServicePills, FinalCta } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/pages.css"

export const metadata = pageMeta({
  title: "About Alphaa: the AI marketing agent for small businesses",
  description:
    "Alphaa (alphaa.app) is an AI agent that runs a small business's marketing: SEO and AI search, content, social media and email, with ads in early access. What it does, pricing and contact.",
  path: "/about",
})

const org = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Alphaa",
  legalName: "9629033 Canada INC",
  url: "https://alphaa.app",
  logo: "https://alphaa.app/logo.png",
  email: "hi@alphaa.app",
  description: "Alphaa is an AI agent that runs marketing for small businesses: SEO and AI search, blog and Google posts, review replies, social media and email, with Google and Meta ads management in early access.",
  address: { "@type": "PostalAddress", streetAddress: "1000 Innovation Drive, Suite 500", addressLocality: "Kanata", addressRegion: "ON", postalCode: "K2K 3E7", addressCountry: "CA" },
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "hi@alphaa.app" },
}

export default function AboutPage() {
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <Frame top>
      <Section center>
        <ServicePills />
        <h1 className="v3-h1">
          About Alphaa.
        </h1>
        <p className="v3-lede">
          Alphaa (alphaa.app) is an AI agent that runs your entire marketing, so small business owners get customers without hiring an agency.
        </p>
      </Section>
      <Section>
        <div className="pg-prose">
          <h2>What is Alphaa?</h2>
          <p>
            Alphaa is software that does the work a marketing agency would do: social media, ads, SEO and AI search, blog posts, Google posts, review
            replies and email. It writes in the owner&apos;s own voice and brand, and the owner approves with one tap. It is built for small, owner-run
            businesses (dentists, plumbers and HVAC companies, law firms, veterinarians, restaurants and clinics) that want customers, not another
            agency bill.
          </p>
          <h2>What does Alphaa do each week?</h2>
          <p>Alphaa plans the week from the business&apos;s own data and current trends, does the work, and the owner approves anything public with one tap:</p>
          <ul>
            <li>Writes blog posts in the owner&apos;s voice.</li>
            <li>Fixes the website for Google and AI search: it checks 23 things AI reads, from crawler access to structured facts, and writes FAQ answers, structured data and llms.txt.</li>
            <li>Asks ChatGPT, Gemini, Claude and Perplexity the questions customers ask, and reports who got named.</li>
            <li>On the Pro plan: writes Google Business Profile posts and social media posts with images in the business&apos;s brand, ready to publish in one tap, replies to reviews, tracks leads and sends emails that bring past customers back.</li>
            <li>On the Growth plan (early access): runs Google or Meta ads for 1 ad account, when ads open.</li>
            <li>Sends one short, plain-English note: what it did, what worked, and what needs a yes.</li>
          </ul>
          <h2>How much does Alphaa cost?</h2>
          <p>
            Alphaa costs $99 a month for Starter, which covers AI search, and $499 for Pro, which adds everything except ads: social media, Google posts, review replies, email and lead tracking. Both are month to month with no contract, or 15% off billed yearly. Growth, which adds Google or Meta ads for 1 ad account, is $799 a month in early access, plus $200 a month per additional ad account (Google or Meta). There is no free trial; the{" "}
            <Link href="/start">free check</Link> shows what the AIs say about a business today and plans its first week of marketing. See <Link href="/pricing">pricing</Link>.
          </p>
          <h2>Does Alphaa guarantee rankings?</h2>
          <p>
            No. AI assistants decide their own answers, so no one can honestly guarantee a ranking or a timeline. Alphaa improves the public signals
            those assistants read and shows, week by week, whether they name the business. If none of the four AIs names the business in any weekly
            check during its first 90 days on a paid plan, the next month is free.
          </p>
          <h2>What guides has Alphaa published?</h2>
          <p>
            Alphaa publishes practical marketing guides for small businesses, including how to get named by AI assistants, such as{" "}
            <Link href="/blog/local-business-ai-readiness-study-2026">what local business sites most often miss</Link>. Browse the <Link href="/blog">guides</Link>.
          </p>
          <h2>Who founded Alphaa?</h2>
          <p>
            Alphaa was founded by <Link href="/author/varun-sharma">Varun Sharma</Link>, who has spent over a decade in performance marketing.
          </p>
          <h2>How do I contact Alphaa?</h2>
          <p>
            Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a>. Alphaa, 1000 Innovation Dr, Kanata, ON K2K 3E7, Canada.
          </p>
          <p>Alphaa is not affiliated with alphaa.ai or with OpenAI, Anthropic, Google or Perplexity.</p>
        </div>
      </Section>
      <FinalCta title={<>Running a business is hard.<br /><span>Alphaa can help!</span></>} sub="Month to month. Cancel online in a minute." />
      </Frame>
    </V3Page>
  )
}
