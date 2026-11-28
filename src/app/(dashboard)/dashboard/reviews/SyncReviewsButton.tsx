"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/workspace/ui"
import { toast } from "@/lib/workspace/events"

export function SyncReviewsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function sync() {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations/sync", { method: "POST" })
      if (!res.ok) throw new Error("sync")
      const data = (await res.json()) as { synced?: { reviews?: number } }
      const n = data.synced?.reviews ?? 0
      toast(n ? `Found ${n} new review${n === 1 ? "" : "s"}` : "No new reviews since my last check")
      router.refresh()
    } catch {
      toast("I couldn’t reach Google just now. I check again on my own every day.")
    } finally {
      setLoading(false)
    }
  }

  return <Button loading={loading} onClick={sync}>{loading ? "Checking Google" : "Check for new reviews"}</Button>
}
