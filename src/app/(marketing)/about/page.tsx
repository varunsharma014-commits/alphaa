import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About Alphaa — the AI agent that gets local businesses recommended by AI",
  description:
    "Alphaa (alphaa.app) is an AI agent that works to get local businesses recommended by ChatGPT, Gemini, Claude and Perplexity. What it does, how it works, pricing, research and contact details.",
  alternates: { canonical: "/about" },
}

const org = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Alphaa",
  url: "https://alphaa.app",
  logo: "https://alphaa.app/logo.png",
  email: "hi@alphaa.app",
  description: "Alphaa is an AI agent that works to get local businesses recommended by ChatGPT, Gemini, Claude and Perplexity.",
  address: { "@type": "PostalAddress", streetAddress: "1000 Innovation Dr", addressLocality: "Kanata", addressRegion: "ON", postalCode: "K2K 3E7", addressCountry: "CA" },
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "hi@alphaa.app" },
}

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <section className="ap-sec" style={{ paddingTop: 120 }}>
        <h1 className="ap-h2 ap-center" style={{ fontSize: "clamp(44px, 7.7vw, 88px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
          About Alphaa.
        </h1>
        <p className="ap-lead ap-center">
          Alphaa (alphaa.app) is an AI agent that works to get local businesses recommended by ChatGPT, Gemini, Claude and Perplexity.
        </p>
        <div className="article-prose" style={{ maxWidth: 720, margin: "56px auto 0", padding: "0 22px" }}>
          <h2>What is Alphaa?</h2>
          <p>
            Alphaa is software that does the work an SEO agency would do, aimed at the answers AI assistants give instead of Google&apos;s list of links.
            It is built for local businesses — dentists, plumbers and HVAC companies, law firms, veterinarians, restaurants and clinics — whose customers
            now ask AI who to call.
          </p>
          <h2>What does Alphaa do each week?</h2>
          <p>Alphaa works in four steps, and the business owner approves anything public with one tap:</p>
          <ul>
            <li>Asks ChatGPT, Gemini, Claude and Perplexity the questions customers ask, and reports who got named.</li>
            <li>Checks 23 things AI reads on the business&apos;s website, from crawler access to structured facts and reviews.</li>
            <li>Writes the pages and facts AI needs — FAQ answers, structured data, llms.txt — and drafts Google Business Profile posts and review replies.</li>
            <li>Sends one short, plain-English note: what it did, what changed, and what needs a yes.</li>
          </ul>
          <h2>How much does Alphaa cost?</h2>
          <p>
            Alphaa costs $99 a month for Starter, $199 for Pro and $299 for Full Service, month to month with no contract. There is no free trial; the{" "}
            <Link href="/start">free 60-second check</Link> shows what the AIs say about a business today. See <Link href="/pricing">pricing</Link>.
          </p>
          <h2>Does Alphaa guarantee rankings?</h2>
          <p>
            No. AI assistants decide their own answers, so no one can honestly guarantee a ranking or a timeline. Alphaa improves the public signals
            those assistants read and shows, week by week, whether they name the business.
          </p>
          <h2>What research has Alphaa published?</h2>
          <p>
            In September 2026 Alphaa checked 288 local business websites for AI readiness. Read{" "}
            <Link href="/blog/local-business-ai-readiness-study-2026">the study</Link>, or browse the <Link href="/blog">guides</Link>.
          </p>
          <h2>How do I contact Alphaa?</h2>
          <p>
            Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a>. Alphaa, 1000 Innovation Dr, Kanata, ON K2K 3E7, Canada.
          </p>
          <p>Alphaa is not affiliated with alphaa.ai or with OpenAI, Anthropic, Google or Perplexity.</p>
        </div>
      </section>
    </>
  )
}
