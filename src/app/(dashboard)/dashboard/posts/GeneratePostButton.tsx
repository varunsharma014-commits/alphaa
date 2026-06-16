"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, X, ChevronDown } from "lucide-react"

export function GeneratePostButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [postType, setPostType] = useState("UPDATE")
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/gbp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType, topic: topic.trim() || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to generate post")
      }
      setOpen(false)
      setTopic("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#e05a2b",
          color: "#ffffff",
          borderRadius: "8px",
          padding: "8px 18px",
          fontSize: "13px",
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
        }}
      >
        <Sparkles className="w-4 h-4" />
        Generate posts
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "8px",
            zIndex: 20,
            width: "320px",
            background: "#161616",
            border: "0.5px solid #222222",
            borderRadius: "10px",
            padding: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>Generate a new post</h3>
            <button
              onClick={() => setOpen(false)}
              style={{ color: "#888888", background: "none", border: "none", cursor: "pointer", display: "flex" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  color: "#444444",
                  fontSize: "10px",
                  marginBottom: "6px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Post Type
              </label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #222222",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                }}
              >
                <option value="UPDATE">Update</option>
                <option value="OFFER">Offer</option>
                <option value="EVENT">Event</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  color: "#444444",
                  fontSize: "10px",
                  marginBottom: "6px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Topic <span style={{ color: "#555555", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. summer sale, new menu items..."
                style={{
                  width: "100%",
                  background: "#1a1a1a",
                  border: "1px solid #222222",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {error && <p style={{ color: "#dc2626", fontSize: "11px" }}>{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                width: "100%",
                background: "#e05a2b",
                color: "#ffffff",
                borderRadius: "8px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 500,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-line/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
