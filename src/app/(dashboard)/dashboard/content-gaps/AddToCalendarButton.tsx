"use client"

import { useState } from "react"
import { CalendarPlus, Check } from "lucide-react"

interface Props {
  title: string
}

type State = "idle" | "loading" | "done" | "error"

export default function AddToCalendarButton({ title }: Props) {
  const [state, setState] = useState<State>("idle")

  async function handleClick() {
    if (state === "loading" || state === "done") return

    setState("loading")

    try {
      const res = await fetch("/api/gbp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: title }),
      })

      if (!res.ok) {
        setState("error")
        return
      }

      setState("done")
    } catch {
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Check size={14} color="#22c55e" />
        <span style={{ fontSize: "12px", fontWeight: 500, color: "#22c55e" }}>
          Added to your content calendar
        </span>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "loading"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#e05a2b",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "7px 14px",
          fontSize: "12px",
          fontWeight: 500,
          cursor: state === "loading" ? "not-allowed" : "pointer",
          opacity: state === "loading" ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        <CalendarPlus size={13} />
        {state === "loading" ? "Adding…" : "Add to content calendar →"}
      </button>
      {state === "error" && (
        <p style={{ fontSize: "11px", color: "#888888", marginTop: "6px", lineHeight: 1.6 }}>
          We couldn&apos;t add that just now. Please try again in a moment.
        </p>
      )}
    </div>
  )
}
