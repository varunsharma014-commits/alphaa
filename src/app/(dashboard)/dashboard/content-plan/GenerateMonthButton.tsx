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
        "Want me to draft 8 posts for this month? I’ll write a mix of updates, offers and events for you to approve."
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
      setMessage(`I’ve drafted ${data.count ?? 8} posts. They’re waiting for your approval.`)
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
          color: "var(--ds-on-accent)",
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
              border: "2px solid rgb(127 127 127 / 0.4)",
              borderTopColor: "var(--ds-on-accent)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <CalendarDays style={{ width: "16px", height: "16px" }} />
        )}
        {loading ? "I’m drafting this month’s posts…" : "Draft my first month of posts →"}
      </button>
      {message && <span style={{ fontSize: "11px", color: "var(--ds-text-mute)" }}>{message}</span>}
    </div>
  )
}
