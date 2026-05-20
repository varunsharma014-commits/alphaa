import { HeroSection } from "@/components/marketing/HeroSection"
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

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PlatformLogos />
      <AiShiftSection />
      <AgencySection />
      <AllEnginesSection />
      <SolutionSection />
      <HowItWorksSection />
      <SocialProof />
      <ComparisonTable />
      <CaseStudiesSection />
      <FaqSection />
      <CtaBanner />
    </>
  )
}
