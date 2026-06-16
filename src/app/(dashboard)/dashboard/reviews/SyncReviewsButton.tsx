"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export function SyncReviewsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/integrations/sync", { method: "POST" })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Sync failed")
      }
      const data = (await res.json()) as { synced?: { reviews?: number } }
      const count = data.synced?.reviews ?? 0
      setMessage(`Found ${count} new review${count !== 1 ? "s" : ""}`)
      router.refresh()
    } catch {
      setMessage("alphaa will check again automatically")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {message && <span style={{ fontSize: "11px", color: "#555555" }}>{message}</span>}
      <button
        onClick={handleSync}
        disabled={loading}
        style={{
          background: "transparent",
          color: "#888888",
          border: "1px solid #333333",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "Checking…" : "Check now"}
      </button>
    </div>
  )
}
