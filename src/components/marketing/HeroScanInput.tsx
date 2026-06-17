"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

// Embeds the start of the scan in the hero (CRO: reduce friction). Submitting
// jumps to /scan with the URL prefilled into the form.
export function HeroScanInput() {
  const [url, setUrl] = useState("")
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = url.trim()
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
        className="flex-1 bg-bg-tertiary border border-white/10 rounded-full px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-colors"
      />
      <button
        type="submit"
        className="btn-orange px-7 py-3.5 text-sm whitespace-nowrap flex items-center justify-center"
      >
        Scan my business →
      </button>
    </form>
  )
}
