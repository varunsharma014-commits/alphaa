"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, CheckCircle2 } from "lucide-react"

// Approve-before-post flow:
//   idle       → "Write a reply for me" asks the API for a draft
//   generating → draft request in flight
//   draft      → editable textarea; nothing has been posted yet
//   posting    → post request in flight
//   posted     → Google accepted the reply; page refresh moves the card
type Phase = "idle" | "generating" | "draft" | "posting" | "posted"

const spinnerStyle: React.CSSProperties = {
  width: "12px",
  height: "12px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "#ffffff",
  borderRadius: "50%",
  display: "inline-block",
  animation: "spin 0.7s linear infinite",
}

export function GenerateReplyButton({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("idle")
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setPhase("generating")
    setError(null)
    try {
      const res = await fetch(`/api/gbp/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })
      const data = (await res.json().catch(() => null)) as
        | { reply?: string; error?: string }
        | null
      if (!res.ok || typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error(data?.error ?? "Could not write a draft this time. Please try again.")
      }
      setDraft(data.reply)
      setPhase("draft")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not write a draft this time. Please try again.")
      setPhase("idle")
    }
  }

  async function handlePost() {
    const text = draft.trim()
    if (!text) return
    setPhase("posting")
    setError(null)
    try {
      const res = await fetch(`/api/gbp/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post", text }),
      })
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ??
            "Google did not accept the reply. Please try again — or reply directly on your Google listing."
        )
      }
      setPhase("posted")
      router.refresh()
    } catch (err) {
      // Keep the draft so nothing the owner wrote is lost.
      setError(
        err instanceof Error
          ? err.message
          : "Google did not accept the reply. Please try again — or reply directly on your Google listing."
      )
      setPhase("draft")
    }
  }

  function handleDiscard() {
    setDraft("")
    setError(null)
    setPhase("idle")
  }

  // ── Posted: confirmation of what actually went to Google ──
  if (phase === "posted") {
    return (
      <div style={{ marginTop: "12px" }}>
        <div
          style={{
            background: "#0d2218",
            border: "1px solid #14532d",
            borderRadius: "8px",
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <CheckCircle2 size={13} color="#22c55e" />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#22c55e",
              }}
            >
              Reply posted to your Google listing
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {draft.trim()}
          </p>
        </div>
      </div>
    )
  }

  // ── Draft ready: editable, nothing posted yet ──
  if (phase === "draft" || phase === "posting") {
    const posting = phase === "posting"
    const empty = draft.trim().length === 0
    return (
      <div style={{ marginTop: "12px" }}>
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #222222",
            borderRadius: "8px",
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Sparkles size={12} color="#e05a2b" />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#e05a2b",
              }}
            >
              alphaa&apos;s draft — edit anything before you post
            </span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={posting}
            rows={4}
            aria-label="Reply draft"
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid #333333",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "13px",
              color: "#dddddd",
              lineHeight: 1.6,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              opacity: posting ? 0.6 : 1,
            }}
          />
          <p style={{ fontSize: "11px", color: "#555555", marginTop: "6px" }}>
            Nothing is posted until you approve it.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={handlePost}
            disabled={posting || empty}
            style={{
              background: "#e05a2b",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "none",
              cursor: posting || empty ? "not-allowed" : "pointer",
              opacity: posting || empty ? 0.5 : 1,
            }}
          >
            {posting && <span style={spinnerStyle} />}
            {posting ? "Posting to Google…" : "Post this reply"}
          </button>

          <button
            onClick={handleDiscard}
            disabled={posting}
            style={{
              background: "transparent",
              color: "#888888",
              border: "1px solid #333333",
              borderRadius: "8px",
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: posting ? "not-allowed" : "pointer",
              opacity: posting ? 0.5 : 1,
            }}
          >
            Discard
          </button>
        </div>

        {error && (
          <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "8px", lineHeight: 1.5 }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  // ── Idle / generating: offer to write a draft ──
  const generating = phase === "generating"
  return (
    <div style={{ marginTop: "12px" }}>
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #222222",
          borderRadius: "8px",
          padding: "10px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <Sparkles size={12} color="#e05a2b" />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#e05a2b",
            }}
          >
            alphaa can draft a reply
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6 }}>
          alphaa writes a warm, professional draft for you to read and edit. Nothing is posted
          until you approve it.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            background: "#e05a2b",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            border: "none",
            cursor: generating ? "not-allowed" : "pointer",
            opacity: generating ? 0.5 : 1,
          }}
        >
          {generating && <span style={spinnerStyle} />}
          {generating ? "Writing draft…" : "Write a reply for me"}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "11px", color: "#dc2626", marginTop: "8px", lineHeight: 1.5 }}>
          {error}
        </p>
      )}
    </div>
  )
}
