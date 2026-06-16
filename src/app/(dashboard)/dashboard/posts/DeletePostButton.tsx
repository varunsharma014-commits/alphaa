"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this draft post?")) return
    setLoading(true)
    try {
      await fetch(`/api/gbp/posts/${postId}`, { method: "DELETE" })
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        border: "1px solid #333333",
        color: "#888888",
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "11px",
        fontWeight: 500,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? (
        <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      {loading ? "Deleting…" : "Discard"}
    </button>
  )
}
