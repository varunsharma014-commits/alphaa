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
        setError(data.error ?? "We couldn't read that website just now. Please check the address and try again.")
        return
      }

      router.refresh()
    } catch {
      setError("Something went wrong on our side. Please try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {prominent && (
        <label
          style={{
            display: "block",
            fontSize: "10px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--ds-text-ghost)",
            marginBottom: "8px",
            textAlign: "left",
          }}
        >
          Find topics your competitors rank for
        </label>
      )}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="url"
          value={competitorUrl}
          onChange={(e) => setCompetitorUrl(e.target.value)}
          placeholder="Paste a competitor website (e.g. competitorbusiness.com)"
          required
          disabled={loading}
          style={{
            flex: 1,
            minWidth: "220px",
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border-2)",
            borderRadius: "8px",
            padding: "9px 12px",
            color: "var(--ds-text)",
            fontSize: "13px",
            outline: "none",
            opacity: loading ? 0.5 : 1,
          }}
        />
        <button
          type="submit"
          disabled={loading || !competitorUrl.trim()}
          style={{
            background: "var(--ds-accent)",
            color: "var(--ds-text)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: loading || !competitorUrl.trim() ? "not-allowed" : "pointer",
            opacity: loading || !competitorUrl.trim() ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Finding your gaps…" : "Find my gaps →"}
        </button>
      </div>
      {prominent && (
        <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "8px", lineHeight: 1.6, textAlign: "left" }}>
          alphaa will find topics they rank for that you are missing — with suggested titles and outlines ready to use.
        </p>
      )}
      {error && (
        <p style={{ fontSize: "12px", color: "var(--ds-bad)", marginTop: "8px", textAlign: "left" }}>
          {error}
        </p>
      )}
    </form>
  )
}
