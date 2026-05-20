import { MarketingNav } from "@/components/layout/MarketingNav"
import { Footer } from "@/components/layout/Footer"
import { FloatingCta } from "@/components/marketing/FloatingCta"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="radial-bg min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingCta />
    </div>
  )
}
