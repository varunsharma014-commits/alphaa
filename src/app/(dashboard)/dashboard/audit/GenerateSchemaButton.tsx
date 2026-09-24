"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  prominent?: boolean
}

export default function GenerateSchemaButton({ prominent }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/schema/generate", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Generation failed. Please try again.")
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
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: prominent ? "center" : "flex-end" }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={
          prominent
            ? {
                background: "var(--ds-accent)",
                color: "var(--ds-text)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "8px 18px",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }
            : {
                background: "transparent",
                color: "var(--ds-text-mute)",
                fontSize: "13px",
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid var(--ds-border-3)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }
        }
      >
        {loading ? "Generating…" : prominent ? "Generate structured data" : "Regenerate"}
      </button>
      {error && <p style={{ color: "var(--ds-bad)", fontSize: "11px" }}>{error}</p>}
    </div>
  )
}
