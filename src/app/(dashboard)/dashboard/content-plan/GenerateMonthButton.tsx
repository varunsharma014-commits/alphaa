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
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--ds-accent)",
          color: "var(--ds-text)",
          border: "none",
          borderRadius: "8px",
          padding: "8px 18px",
          fontSize: "13px",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
          transition: "opacity 200ms",
        }}
      >
        {loading ? (
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "var(--ds-text)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <CalendarDays style={{ width: "16px", height: "16px" }} />
        )}
        {loading ? "Generating…" : "Generate my first month →"}
      </button>
      {message && <span style={{ fontSize: "11px", color: "var(--ds-text-mute)" }}>{message}</span>}
    </div>
  )
}
