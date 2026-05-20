import { ScanForm } from "@/components/scan/ScanForm"
import { SectionLabel } from "@/components/common/SectionLabel"

export const metadata = { title: "Free Visibility Scan" }

export default function ScanPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel className="mb-3 block">Free scan</SectionLabel>
          <h1 className="text-[32px] sm:text-[40px] font-semibold text-white leading-tight mb-4">
            See why customers can't{" "}
            <span className="serif-italic text-brand-orange">find you</span>
          </h1>
          <p className="text-muted text-base">
            Enter your business info. We'll check Google, ChatGPT, Maps, and your website — and show you exactly what's missing. Takes 60 seconds.
          </p>
        </div>
        <ScanForm />
        <p className="text-center text-muted/50 text-xs mt-6">
          No signup required · Results emailed to you · No credit card
        </p>
      </div>
    </div>
  )
}
