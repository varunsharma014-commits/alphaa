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
      setMessage(`Synced ${count} review${count !== 1 ? "s" : ""}`)
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sync failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fg/5 hover:bg-fg/10 border border-line/10 text-fg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing…" : "Sync Reviews"}
      </button>
      {message && <span className="text-muted text-xs">{message}</span>}
    </div>
  )
}
