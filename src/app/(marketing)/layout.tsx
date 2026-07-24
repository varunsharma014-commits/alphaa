import { MarketingNav } from "@/components/layout/MarketingNav"
import { Footer } from "@/components/layout/Footer"
import { FloatingCta } from "@/components/marketing/FloatingCta"
import { MarketingThemeScope } from "@/components/layout/MarketingThemeScope"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeScope>
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingCta />
    </MarketingThemeScope>
  )
}
