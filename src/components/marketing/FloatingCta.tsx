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

  // Don't show on scan page — they already have the form
  if (pathname === "/scan") return null

  return (
    <div
      className={`fixed bottom-6 left-4 right-4 z-50 flex md:hidden transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <Link
        href="/scan"
        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-white text-sm shadow-2xl"
        style={{ background: "linear-gradient(135deg, #ff6b1a 0%, #e55a0e 100%)" }}
      >
        Get your free visibility score →
      </Link>
    </div>
  )
}
