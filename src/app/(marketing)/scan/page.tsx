import { ScanForm } from "@/components/scan/ScanForm"
import { SectionLabel } from "@/components/common/SectionLabel"
import { Bot } from "lucide-react"

export const metadata = { title: "Free Visibility Scan" }

export default function ScanPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <SectionLabel className="mb-3 block">Free scan</SectionLabel>
          <h1 className="text-[34px] sm:text-[48px] font-semibold text-white leading-[1.08] tracking-[-0.02em] mb-4 text-balance">
            See your free{" "}
            <span className="serif-italic text-brand-orange">visibility score</span>
          </h1>
          <p className="text-muted text-base">
            We check Google, ChatGPT, Maps, and your website — and show you exactly what's stopping customers from finding you. Takes 60 seconds.
          </p>
        </div>

        {/* What the scan checks — honest, no invented numbers */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Bot className="w-4 h-4 text-brand-orange" />
          <p className="text-muted/70 text-xs">
            Live check across <span className="text-white font-medium">4 AI assistants</span> plus your website
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
