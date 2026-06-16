"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

interface RunScanButtonProps {
  prominent?: boolean
}

export default function RunScanButton({ prominent = false }: RunScanButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleScan() {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/scan", { method: "POST" })
      if (!res.ok) throw new Error("Scan failed")
      router.refresh()
    } catch (err) {
      console.error("Scan error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (prominent) {
    return (
      <button
        onClick={handleScan}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#e05a2b",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 500,
          borderRadius: "8px",
          padding: "9px 18px",
          border: "none",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading && <RefreshCw size={13} className="animate-spin" />}
        {loading ? "Re-checking the AI engines…" : "Check the AI engines now"}
      </button>
    )
  }

  return (
    <button
      onClick={handleScan}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        background: "transparent",
        color: "#888888",
        fontSize: "13px",
        fontWeight: 500,
        borderRadius: "8px",
        padding: "8px 16px",
        border: "1px solid #333333",
        whiteSpace: "nowrap",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading && <RefreshCw size={12} className="animate-spin" />}
      {loading ? "Re-checking…" : "Check again now"}
    </button>
  )
}
