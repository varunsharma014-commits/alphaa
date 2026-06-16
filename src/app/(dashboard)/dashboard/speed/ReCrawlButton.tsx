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
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCrawl}
        disabled={loading || done}
        className="inline-flex items-center gap-2 bg-fg/[0.06] hover:bg-fg/[0.1] disabled:opacity-50 disabled:cursor-not-allowed text-fg text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-line/[0.08]"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {done ? "Crawl started!" : loading ? "Crawling…" : "Re-crawl site"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
