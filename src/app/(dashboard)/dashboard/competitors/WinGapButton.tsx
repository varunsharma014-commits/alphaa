"use client"

import { useState } from "react"
import Link from "next/link"
import { PenLine, Check, Copy } from "lucide-react"

type Draft = {
  title: string
  format: string
  targetQuestion: string
  draft: string
}

export function WinGapButton({ competitorId, gap }: { competitorId: string; gap: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleWrite() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/competitors/${competitorId}/win-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gap }),
      })
      const data = (await res.json().catch(() => ({}))) as Partial<Draft> & { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? "Could not write a draft.")
      }
      setDraft({
        title: data.title ?? gap,
        format: data.format ?? "Blog post",
        targetQuestion: data.targetQuestion ?? gap,
        draft: data.draft ?? "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!draft) return
    try {
      await navigator.clipboard.writeText(`${draft.title}\n\n${draft.draft}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Your browser blocked the copy. Select the text above and copy it manually.")
    }
  }

  if (draft) {
    return (
      <div
        className="rounded-[8px]"
        style={{
          background: "var(--ds-surface)",
          border: ".5px solid var(--ds-border-2)",
          padding: "12px",
          marginTop: 8,
        }}
      >
        <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
          <Check className="w-3 h-3 flex-shrink-0" style={{ color: "var(--ds-ok)" }} />
          <span style={{ color: "var(--ds-ok)", fontSize: 11, fontWeight: 500 }}>
            Draft ready — {draft.format}
          </span>
        </div>

        <h4 style={{ color: "var(--ds-text)", fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
          {draft.title}
        </h4>

        <p style={{ color: "var(--ds-text-faint)", fontSize: 11, lineHeight: 1.6, marginTop: 6 }}>
          Answers the customer question: &quot;{draft.targetQuestion}&quot;
        </p>

        <pre
          style={{
            color: "var(--ds-text-mute)",
            fontSize: 12,
            lineHeight: 1.7,
            marginTop: 10,
            maxHeight: 320,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "inherit",
            background: "var(--ds-surface-2)",
            border: ".5px solid var(--ds-border)",
            borderRadius: 8,
            padding: 10,
          }}
        >
          {draft.draft}
        </pre>

        <p style={{ color: "var(--ds-text-faint)", fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
          alphaa can&apos;t publish to your website. Copy this into your site, or send it to whoever
          manages your website. Anything in [square brackets] is a detail only you know — fill it in
          before publishing.
        </p>

        {error && (
          <p style={{ color: "var(--ds-bad)", fontSize: 11, marginTop: 8 }}>{error}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 10 }}>
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--ds-accent)",
              color: "var(--ds-text)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <Link
            href="/dashboard/content-gaps"
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "transparent",
              color: "var(--ds-text-mute)",
              border: ".5px solid var(--ds-border-2)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Saved to Content ideas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={handleWrite}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          color: "var(--ds-accent)",
          border: ".5px solid var(--ds-border-2)",
          borderRadius: 8,
          padding: "5px 10px",
          fontSize: 11,
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <>
            <span
              className="w-3 h-3 rounded-full animate-spin flex-shrink-0"
              style={{ border: "2px solid var(--ds-accent)", borderTopColor: "transparent" }}
            />
            Writing your draft…
          </>
        ) : (
          <>
            <PenLine className="w-3 h-3" />
            Write content to win this
          </>
        )}
      </button>
      {loading && (
        <p style={{ color: "var(--ds-text-faint)", fontSize: 10, marginTop: 6 }}>
          This takes about 20 seconds.
        </p>
      )}
      {error && <p style={{ color: "var(--ds-bad)", fontSize: 11, marginTop: 6 }}>{error}</p>}
    </div>
  )
}
