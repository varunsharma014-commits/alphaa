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
      <div className="w-full flex items-center gap-2 rounded-full border border-black/[0.06] bg-[rgba(251,251,253,0.85)] backdrop-blur-[20px] backdrop-saturate-[1.8] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
        <Link
          href={href}
          className="flex-1 flex items-center justify-center py-3 px-4 rounded-full text-white text-[17px] bg-[#0071e3] active:bg-[#006edb]"
        >
          Run my free AI scan →
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex items-center justify-center w-9 h-9 rounded-full text-fg/40 hover:text-fg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
