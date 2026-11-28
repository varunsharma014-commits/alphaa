"use client"

import { useState, type ReactNode } from "react"
import { toast } from "@/lib/workspace/events"
import { Button } from "./button"
import { Glyph } from "./glyphs"

// Code the owner (or their web person) copies: a plain title, where it goes, Copy, folded after
// `foldAt` lines, sideways scroll instead of wrapping.
export function CodeBlock({ code, title, where, foldAt = 12, copyLabel = "Copy" }: { code: string; title: ReactNode; where?: ReactNode; foldAt?: number; copyLabel?: string }) {
  const lines = code.split("\n").length
  const [open, setOpen] = useState(lines <= foldAt)
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => { setCopied(true); toast("Copied"); window.setTimeout(() => setCopied(false), 1600) }, () => toast("Couldn’t copy. Select the text and copy it instead."))
  }
  return (
    <div className={`xd-code${open ? "" : " folded"}`}>
      <div className="xd-code__h">
        <div style={{ minWidth: 0, flex: 1 }}><div className="xd-code__t">{title}</div>{where && <div className="xd-code__w">{where}</div>}</div>
        <Button size="sm" onClick={copy} icon={<Glyph name={copied ? "check" : "copy"} size={14} />}>{copied ? "Copied" : copyLabel}</Button>
      </div>
      <pre tabIndex={0}><code>{code}</code></pre>
      {lines > foldAt && <button type="button" className="xd-code__more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : `Show all ${lines} lines`}</button>}
    </div>
  )
}
