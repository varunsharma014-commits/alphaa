"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { track } from "@/lib/gtag"
import { cn } from "@/lib/utils"

// Embeds the start of the scan in the hero (CRO: reduce friction). Submitting
// jumps to /scan with the URL prefilled into the form.
// `compact` renders a slimmer variant for embedding inside vertical-page heroes.
// `source` is attached to the GA4 intent event so we can attribute which page
// started the funnel (the canonical scan_started fires on the actual /scan submit).
export function HeroScanInput({
  compact = false,
  source = "home_hero",
  ctaLabel = "Scan my business →",
}: {
  compact?: boolean
  source?: string
  ctaLabel?: string
}) {
  const [url, setUrl] = useState("")
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = url.trim()
    track("scan_input_submit", { source })
    router.push(v ? `/scan?url=${encodeURIComponent(v)}` : "/scan")
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col sm:flex-row items-stretch gap-3 max-w-xl mx-auto"
    >
      <input
        type="text"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter your website URL…"
        aria-label="Your website URL"
        className={cn(
          "flex-1 bg-bg-tertiary border border-white/10 rounded-full text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors",
          compact ? "px-4 py-3" : "px-5 py-3.5"
        )}
      />
      <button
        type="submit"
        className={cn(
          "btn-orange text-sm whitespace-nowrap flex items-center justify-center",
          compact ? "px-6 py-3" : "px-7 py-3.5"
        )}
      >
        {ctaLabel}
      </button>
    </form>
  )
}
