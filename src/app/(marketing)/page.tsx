import { HeroSection } from "@/components/marketing/HeroSection"
import { SocialProof } from "@/components/marketing/SocialProof"
import { ProblemSection } from "@/components/marketing/ProblemSection"
import { SolutionSection } from "@/components/marketing/SolutionSection"
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection"
import { ComparisonTable } from "@/components/marketing/ComparisonTable"
import { FaqSection } from "@/components/marketing/FaqSection"
import { CtaBanner } from "@/components/marketing/CtaBanner"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SocialProof />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <ComparisonTable />
      <FaqSection />
      <CtaBanner />
    </>
  )
}
