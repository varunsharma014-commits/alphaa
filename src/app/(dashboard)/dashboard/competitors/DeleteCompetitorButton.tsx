"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"

export function DeleteCompetitorButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Remove this competitor?")) return

    setLoading(true)
    try {
      await fetch(`/api/competitors/${id}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Remove competitor"
      className="p-1.5 rounded-[8px] disabled:opacity-40 transition-colors hover:bg-[var(--ds-bad-bg)] hover:text-[var(--ds-bad)]"
      style={{ color: "var(--ds-text-faint)" }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  )
}
