"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  prominent?: boolean
}

export default function AnalyzeGapsButton({ prominent }: Props) {
  const router = useRouter()
  const [competitorUrl, setCompetitorUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!competitorUrl.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/content-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorUrl: competitorUrl.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Please try again.")
        return
      }

      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="url"
          value={competitorUrl}
          onChange={(e) => setCompetitorUrl(e.target.value)}
          placeholder="https://competitor.com"
          required
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !competitorUrl.trim()}
          className={
            prominent
              ? "bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed"
              : "bg-white/10 hover:bg-white/15 disabled:bg-white/5 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed border border-white/10"
          }
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  )
}
