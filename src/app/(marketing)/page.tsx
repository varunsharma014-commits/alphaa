import { HeroSection } from "@/components/marketing/HeroSection"
import { ScrollReveal } from "@/components/marketing/ScrollReveal"
import { AiAnswerMockup } from "@/components/marketing/AiAnswerMockup"
import { PlatformLogos } from "@/components/marketing/PlatformLogos"
import { AgencySection } from "@/components/marketing/AgencySection"
import { AllEnginesSection } from "@/components/marketing/AllEnginesSection"
import { WholeSeoTeamSection } from "@/components/marketing/WholeSeoTeamSection"
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection"
import { MechanismSection } from "@/components/marketing/MechanismSection"
import { HomePricingSection } from "@/components/marketing/HomePricingSection"
import { ComparisonTable } from "@/components/marketing/ComparisonTable"
import { CaseStudiesSection } from "@/components/marketing/CaseStudiesSection"
import { SocialProof } from "@/components/marketing/SocialProof"
import { FaqSection } from "@/components/marketing/FaqSection"
import { CtaBanner } from "@/components/marketing/CtaBanner"

// SoftwareApplication structured data so AI engines / Google can state exactly
// what Alphaa is, its category, and its price. No aggregateRating (we won't
// publish unverifiable review counts).
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Alphaa",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "AI Search Optimization (AEO)",
  operatingSystem: "Web",
  url: "https://alphaa.app",
  description:
    "Automated AI Search Optimization (AEO) that gets your business discovered, cited, and recommended by ChatGPT, Claude, Gemini, Perplexity, and Google AI — for $99/month instead of a $2,000/month SEO agency.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "99",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "99", priceCurrency: "USD", unitText: "MONTH" },
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "199",
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "199", priceCurrency: "USD", unitText: "MONTH" },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <ScrollReveal />
      <HeroSection />
      {/* The AI-answer mockup is the clearest asset on the page — it shows the
          product's whole premise in one glance, so it runs immediately after
          the hero rather than three screens down. */}
      <AiAnswerMockup />
      <PlatformLogos />
      {/* Pain, then the cost comparison that resolves it */}
      <AgencySection />
      {/* Proof cluster: three deep case studies, then the stats bar and the
          star-rated testimonial wall. SolutionSection (a second feature list,
          duplicating WholeSeoTeamSection) stays cut. */}
      <CaseStudiesSection />
      <SocialProof />
      <AllEnginesSection />
      <HowItWorksSection />
      <MechanismSection />
      <WholeSeoTeamSection />
      <HomePricingSection />
      <ComparisonTable />
      <FaqSection />
      <CtaBanner />
    </>
  )
}
