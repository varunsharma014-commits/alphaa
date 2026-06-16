"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

export function GenerateReplyButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gbp/reviews/${reviewId}/reply`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to generate reply")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: "12px" }}>
      {/* alphaa suggested reply box */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #222222",
          borderRadius: "8px",
          padding: "10px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <Sparkles size={12} color="#e05a2b" />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#e05a2b",
            }}
          >
            alphaa suggested reply
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>
          {editing
            ? "Open this review in Google Business Profile to fine-tune the wording, or approve below to let alphaa post its draft for you."
            : "alphaa has written a warm, professional reply for this customer. Approve it and we'll post it to Google for you — no typing needed."}
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            background: "#e05a2b",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading && (
            <span
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#ffffff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
          )}
          {loading ? "Sending…" : "Approve & send"}
        </button>

        <button
          onClick={() => setEditing((v) => !v)}
          disabled={loading}
          style={{
            background: "transparent",
            color: "#888888",
            border: "1px solid #333333",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Edit first
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "8px" }}>
          We couldn&apos;t post that reply just now — alphaa will try again shortly.
        </p>
      )}
    </div>
  )
}
