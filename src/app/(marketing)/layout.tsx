import { MarketingNav } from "@/components/layout/MarketingNav"
import { Footer } from "@/components/layout/Footer"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="radial-bg min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
