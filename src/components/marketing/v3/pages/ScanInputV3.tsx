"use client"

// v3 copy of HeroScanInput (same behaviour and GA event): the website typed here opens the
// agent at /start, which starts working on it straight away.
import { useState } from "react"
import { useRouter } from "next/navigation"
import { track } from "@/lib/gtag"

export function ScanInputV3({ source, ctaLabel = "Get started →" }: { source: string; ctaLabel?: string }) {
  const [url, setUrl] = useState("")
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = url.trim()
    track("scan_input_submit", { source })
    router.push(v ? `/start?site=${encodeURIComponent(v)}` : "/start")
  }

  return (
    <form onSubmit={submit} className="v3-scan">
      <input
        type="text"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter your website URL…"
        aria-label="Your website URL"
      />
      <button type="submit" className="v3-btn">{ctaLabel}</button>
    </form>
  )
}
