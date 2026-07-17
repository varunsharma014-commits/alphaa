"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

export function ReCrawlButton() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCrawl() {
    setLoading(true)
    setError(null)
    setDone(false)
    try {
      const res = await fetch("/api/crawl", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? "Crawl failed")
      }
      setDone(true)
      // Refresh page after short delay
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
      <button
        onClick={handleCrawl}
        disabled={loading || done}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "transparent",
          border: "1px solid var(--ds-border-3)",
          color: "var(--ds-text-mute)",
          fontSize: "13px",
          fontWeight: 500,
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: loading || done ? "not-allowed" : "pointer",
          opacity: loading || done ? 0.6 : 1,
        }}
      >
        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        {done ? "Check started" : loading ? "Checking…" : "Check my site now"}
      </button>
      {error && (
        <p style={{ color: "var(--ds-warn)", fontSize: "11px", maxWidth: "260px", textAlign: "right", lineHeight: 1.5 }}>
          The check didn&apos;t finish this time. Please try again in a minute — alphaa also checks
          your site automatically every week.
        </p>
      )}
    </div>
  )
}
