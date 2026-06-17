"use client"

import { Download } from "lucide-react"

export function DownloadLlmsButton({ content }: { content: string }) {
  const download = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "llms.txt"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: "transparent",
        border: "1px solid #333",
        color: "#888",
        borderRadius: "8px",
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <Download size={13} /> Download llms.txt
    </button>
  )
}
