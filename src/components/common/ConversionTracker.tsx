"use client"

import { useEffect } from "react"
import { track } from "@/lib/gtag"

// Fires a GA4 conversion event once per browser session. Drop into any page/
// layout: <ConversionTracker event="sign_up" />. With `whenQueryParam`, only
// fires when that param is present in the URL (e.g. ?upgraded=true).
export function ConversionTracker({
  event,
  whenQueryParam,
}: {
  event: string
  whenQueryParam?: string
}) {
  useEffect(() => {
    if (whenQueryParam) {
      const params = new URLSearchParams(window.location.search)
      if (!params.get(whenQueryParam)) return
    }
    const key = `ga4-fired-${event}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      // storage unavailable — fire anyway
    }
    track(event)
  }, [event, whenQueryParam])

  return null
}
