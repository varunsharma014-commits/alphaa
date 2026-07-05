"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

// Slim, dismissible mobile bottom bar for /for/[vertical] pages. Appears after
// ~600px of scroll and jumps back to the embedded scan input in the hero.
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
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 flex md:hidden transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-full flex items-center gap-2 rounded-2xl border border-white/10 bg-bg-secondary/95 backdrop-blur-md p-2 shadow-2xl">
        <Link
          href={href}
          className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-semibold text-white text-sm"
          style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #e55a0e 100%)" }}
        >
          Run my free AI scan →
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/40 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
