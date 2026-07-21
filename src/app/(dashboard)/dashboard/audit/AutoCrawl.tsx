"use client"

// Fires the first website crawl automatically when a user lands on Website
// health with no CrawlResult yet. Before this, the "first website check is on
// its way" banner could sit there forever: nothing except onboarding (which
// only fires when a website was entered during signup) ever started a crawl.
//
// sessionStorage guard so a failing crawl doesn't loop on every visit; on
// success we refresh the server component to render the fresh numbers.

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AutoCrawl() {
  const router = useRouter()

  useEffect(() => {
    if (sessionStorage.getItem("alphaa-auto-crawl") === "1") return
    sessionStorage.setItem("alphaa-auto-crawl", "1")
    let cancelled = false
    fetch("/api/crawl", { method: "POST" })
      .then((res) => {
        if (!cancelled && res.ok) router.refresh()
      })
      .catch(() => {
        // Best-effort: the weekly check remains the fallback.
      })
    return () => {
      cancelled = true
    }
  }, [router])

  return null
}
