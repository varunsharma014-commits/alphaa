"use client"

import { useEffect } from "react"
import { track } from "@/lib/gtag"
import { fbTrack, type MetaEvent } from "@/lib/pixel"

// Fires a conversion event once per browser session — GA4 always, Meta Pixel
// too when `metaEvent` is given. Drop into any page/layout:
// <ConversionTracker event="sign_up" metaEvent="CompleteRegistration" />.
// With `whenQueryParam`, only fires when that param is present in the URL
// (e.g. ?upgraded=true).
export function ConversionTracker({
  event,
  metaEvent,
  whenQueryParam,
}: {
  event: string
  metaEvent?: MetaEvent
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
    if (metaEvent) fbTrack(metaEvent)
  }, [event, metaEvent, whenQueryParam])

  return null
}
