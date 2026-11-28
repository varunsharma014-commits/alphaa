"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/workspace/ui"
import { toast } from "@/lib/workspace/events"

// Asks all four AIs again now (POST /api/dashboard/scan saves a new weekly-style check).
export default function RunScanButton({ primary = false, label = "Check again now" }: { primary?: boolean; label?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function run() {
    setLoading(true)
    try {
      const res = await fetch("/api/dashboard/scan", { method: "POST" })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "")
      }
      toast("Done. Here’s what the AIs said this time.")
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "The check didn’t finish this time. Try again in a minute. I also check every week on my own."
      toast(msg)
    } finally {
      setLoading(false)
    }
  }

  return <Button variant={primary ? "primary" : "secondary"} loading={loading} onClick={run}>{loading ? "Asking the AIs" : label}</Button>
}
