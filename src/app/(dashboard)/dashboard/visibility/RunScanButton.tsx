"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

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
        className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-3 transition-colors text-sm"
      >
        {loading ? "Scanning…" : "Run AI Scan"}
      </button>
    )
  }

  return (
    <button
      onClick={handleScan}
      disabled={loading}
      className="bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white font-medium rounded-xl px-4 py-2 transition-colors text-sm border border-white/10 whitespace-nowrap"
    >
      {loading ? "Scanning…" : "Run scan"}
    </button>
  )
}
