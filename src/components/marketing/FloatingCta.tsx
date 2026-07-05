"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function FloatingCta() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Don't show on scan pages (they already have the form / the results page has
  // its own dominant signup CTA) or on /for/* (they have their own sticky bar).
  if (pathname.startsWith("/scan") || pathname.startsWith("/for/")) return null

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-50 flex md:hidden transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href="/scan"
        className="w-full flex flex-col items-center justify-center py-3.5 px-6 rounded-2xl font-semibold text-white text-sm shadow-2xl"
        style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #e55a0e 100%)" }}
      >
        <span>Run my free AI scan →</span>
        <span className="text-[11px] font-normal text-white/70">60 seconds · no signup · no credit card</span>
      </Link>
    </div>
  )
}
