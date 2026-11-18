"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import "@/components/marketing/v3/v3.css"

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
    <div className="v3">
      <div className={`v3-float ${visible ? "" : "v3-float--off"}`}>
        <Link href="/start" tabIndex={visible ? 0 : -1}>
          Get started
          <span>Your AI marketing agent, set up in minutes</span>
        </Link>
      </div>
    </div>
  )
}
