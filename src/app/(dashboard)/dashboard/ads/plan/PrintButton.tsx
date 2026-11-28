"use client"
import { useEffect } from "react"
import { Button } from "@/components/workspace/ui"

export function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => { if (auto) { const t = setTimeout(() => window.print(), 600); return () => clearTimeout(t) } }, [auto])
  return <Button variant="primary" onClick={() => window.print()}>Save as PDF</Button>
}
