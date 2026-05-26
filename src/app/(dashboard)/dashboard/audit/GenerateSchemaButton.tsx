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
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={
          prominent
            ? "bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/40 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed"
            : "bg-white/10 hover:bg-white/15 disabled:bg-white/5 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed border border-white/10"
        }
      >
        {loading ? "Generating..." : prominent ? "Generate Schema Markup" : "Regenerate"}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
