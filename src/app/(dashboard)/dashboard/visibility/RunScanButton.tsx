"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

interface RunScanButtonProps {
  prominent?: boolean
}

export default function RunScanButton({ prominent = false }: RunScanButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleScan() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/dashboard/scan", { method: "POST" })
      if (!res.ok) throw new Error("Scan failed")
      router.refresh()
    } catch {
      setError("The check didn't finish this time. Please try again in a minute — alphaa also re-checks automatically every week.")
    } finally {
      setLoading(false)
    }
  }

  const errorNote = error ? (
    <p style={{ fontSize: "11px", color: "#f59e0b", marginTop: "6px", maxWidth: "260px", textAlign: "right", lineHeight: 1.5 }}>
      {error}
    </p>
  ) : null

  if (prominent) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
      {errorNote}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
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
    {errorNote}
    </div>
  )
}
