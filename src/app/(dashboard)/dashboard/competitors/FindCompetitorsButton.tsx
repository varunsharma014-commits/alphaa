"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Loader2 } from "lucide-react"

export function FindCompetitorsButton({ city }: { city?: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/competitors/discover", { method: "POST" })

      if (!res.ok) {
        setError("alphaa couldn't finish finding competitors just now. We'll keep trying automatically — check back shortly.")
        return
      }

      router.refresh()
    } catch {
      setError("Network hiccup while finding competitors. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
        style={{ background: "var(--ds-accent)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "9px 20px" }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Finding competitors… this can take a minute
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Find competitors{city ? ` in ${city}` : ""} now
          </>
        )}
      </button>
      {error && (
        <p className="pl-1" style={{ color: "var(--ds-bad-soft)", fontSize: 11, lineHeight: 1.6 }}>{error}</p>
      )}
    </div>
  )
}
