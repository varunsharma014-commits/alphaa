"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays } from "lucide-react"

export function GenerateMonthButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleGenerate() {
    if (
      !confirm(
        "Generate 8 draft posts for this month? This will use AI to create a mix of Update, Offer, and Event posts."
      )
    )
      return

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/gbp/generate-month", { method: "POST" })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to generate posts")
      }
      const data = (await res.json()) as { count?: number }
      setMessage(`Generated ${data.count ?? 8} draft posts!`)
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <CalendarDays className="w-4 h-4" />
        )}
        {loading ? "Generating…" : "Auto-Generate Month"}
      </button>
      {message && (
        <span className="text-muted text-xs">{message}</span>
      )}
    </div>
  )
}
