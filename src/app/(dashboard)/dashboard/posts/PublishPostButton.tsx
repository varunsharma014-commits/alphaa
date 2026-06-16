"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"

export function PublishPostButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePublish() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gbp/posts/${postId}/publish`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to publish post")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePublish}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#0d2218",
          border: "1px solid #14532d",
          color: "#22c55e",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "11px",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? (
          <div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
        ) : (
          <Send className="w-3 h-3" />
        )}
        {loading ? "Publishing…" : "Publish now"}
      </button>
      {error && <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px" }}>{error}</p>}
    </div>
  )
}
