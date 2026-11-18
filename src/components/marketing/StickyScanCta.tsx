"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import "@/components/marketing/v3/pages/vertical.css"

// Slim, dismissible mobile bottom bar for /for/[vertical] pages. Appears after
// ~600px of scroll and jumps back to the embedded scan input in the hero.
// v3 styles (vertical.css); must sit inside a .v3 root.
export function StickyScanCta({ href = "#scan-input" }: { href?: string }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (dismissed) return null

  return (
    <div className={`vt3-sticky ${visible ? "" : "vt3-sticky--off"}`}>
      <div className="vt3-sticky__in">
        <Link href={href} tabIndex={visible ? 0 : -1}>Check my business free →</Link>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" tabIndex={visible ? 0 : -1}>
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
