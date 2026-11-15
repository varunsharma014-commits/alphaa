"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { pathLang } from "@/lib/path-lang"

// Keeps <html lang dir> right on client-side navigation. The first paint is
// set by the inline script in the root layout (same pathLang rule), because the
// root layout is shared and static and can't read the path on the server.
export function HtmlLang() {
  const path = usePathname()
  useEffect(() => {
    const { lang, dir } = pathLang(path ?? "/")
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [path])
  return null
}
