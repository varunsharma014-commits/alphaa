import { HeroSection } from "@/components/marketing/HeroSection"
import { AiAnswerMockup } from "@/components/marketing/AiAnswerMockup"
import { DashboardPreview } from "@/components/marketing/DashboardPreview"
import { PlatformLogos } from "@/components/marketing/PlatformLogos"
import { AiShiftSection } from "@/components/marketing/AiShiftSection"
import { AgencySection } from "@/components/marketing/AgencySection"
import { AllEnginesSection } from "@/components/marketing/AllEnginesSection"
import { SolutionSection } from "@/components/marketing/SolutionSection"
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection"
import { SocialProof } from "@/components/marketing/SocialProof"
import { ComparisonTable } from "@/components/marketing/ComparisonTable"
import { CaseStudiesSection } from "@/components/marketing/CaseStudiesSection"
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
    "Automated AI Search Optimization (AEO) that gets your business discovered, cited, and recommended by ChatGPT, Claude, Gemini, Perplexity, and Google AI — for $99/month instead of a $1,000/month SEO agency.",
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
      <HeroSection />
      <PlatformLogos />
      <AiShiftSection />
      <AiAnswerMockup />
      <AgencySection />
      <AllEnginesSection />
      <SolutionSection />
      <HowItWorksSection />
      <DashboardPreview />
      <SocialProof />
      <ComparisonTable />
      <CaseStudiesSection />
      <FaqSection />
      <CtaBanner />
    </>
  )
}
