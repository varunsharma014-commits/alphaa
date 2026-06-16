"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"

export function AddCompetitorButton() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "We couldn't reach that site just now. Please double-check the address and try again.")
        return
      }

      setUrl("")
      router.refresh()
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://competitor.com"
          disabled={loading}
          className="flex-1 rounded-[8px] px-4 focus:outline-none disabled:opacity-50 transition-colors"
          style={{ background: "#1a1a1a", border: "1px solid #222", color: "#fff", fontSize: 13, paddingTop: 8, paddingBottom: 8 }}
          required
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
          style={{ background: "#e05a2b", color: "#fff", fontSize: 13, fontWeight: 500, padding: "8px 18px" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </form>
      {error && (
        <p className="pl-1" style={{ color: "#f87171", fontSize: 11 }}>{error}</p>
      )}
    </div>
  )
}
