"use client"
import { useEffect } from "react"

export function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => { if (auto) { const t = setTimeout(() => window.print(), 600); return () => clearTimeout(t) } }, [auto])
  return <button type="button" onClick={() => window.print()} className="rounded-full bg-black px-4 py-2 text-sm text-white">Save as PDF</button>
}
