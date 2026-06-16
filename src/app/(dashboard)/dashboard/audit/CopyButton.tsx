"use client"

import { useState } from "react"

interface Props {
  text: string
}

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: do nothing
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "transparent",
        border: "1px solid #333333",
        color: copied ? "#22c55e" : "#888888",
        fontSize: "11px",
        fontWeight: 500,
        padding: "4px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "Copied" : "Copy code"}
    </button>
  )
}
