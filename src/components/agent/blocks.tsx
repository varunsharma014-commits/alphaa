"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Block, Chip } from "@/lib/agent/types"
import { ENGINE_LABEL } from "@/lib/agent/types"

// ── helpers ────────────────────────────────────────────────────────────────

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Engines return markdown; the card shows plain text. */
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*\s?\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\((?:https?:\/\/)[^)]+\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Wrap the business name (green) and named competitors (grey) in <mark>. */
function highlight(answer: string, you: string, them: string[]): string {
  let html = escapeHtml(stripMarkdown(answer))
  const youRe = you.trim().length > 2 ? new RegExp(escapeRe(escapeHtml(you.trim())), "gi") : null
  if (youRe) html = html.replace(youRe, (m) => `<mark>${m}</mark>`)
  for (const t of them) {
    if (!t || t.trim().length < 3 || (you && t.toLowerCase() === you.toLowerCase())) continue
    const re = new RegExp(`(?<!<mark[^>]*>)${escapeRe(escapeHtml(t.trim()))}`, "gi")
    html = html.replace(re, (m) => `<mark class="ag-them">${m}</mark>`)
  }
  return html
}

// ── text with typewriter ───────────────────────────────────────────────────

export function TextBlock({
  text,
  big,
  typing,
  onDone,
}: {
  text: string
  big?: boolean
  typing: boolean
  onDone?: () => void
}) {
  const [shown, setShown] = useState(typing && !reduced() ? "" : text)
  const done = useRef(false)
  useEffect(() => {
    if (!typing || reduced()) {
      if (!done.current) {
        done.current = true
        onDone?.()
      }
      return
    }
    let i = 0
    const speed = text.length > 160 ? 6 : 12
    const id = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        window.clearInterval(id)
        if (!done.current) {
          done.current = true
          onDone?.()
        }
      }
    }, speed)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, typing])
  const live = typing && shown.length < text.length
  return <p className={`${big ? "ag-big" : ""} ${live ? "ag-caret" : ""}`.trim()}>{shown}</p>
}

// ── steps ──────────────────────────────────────────────────────────────────

export function StepsBlock({ items, done }: { items: string[]; done?: number }) {
  const n = done ?? items.length
  return (
    <div className="ag-steps">
      {items.map((t, i) => {
        const state = i < n ? "done" : i === n ? "doing" : "todo"
        return (
          <div key={i} className={`ag-step ag-step--${state}`}>
            <span className="ag-step__ic">{state === "done" ? "✓" : ""}</span>
            <span dangerouslySetInnerHTML={{ __html: t }} />
          </div>
        )
      })}
    </div>
  )
}

// ── verdicts ───────────────────────────────────────────────────────────────

const VERDICT_TEXT = {
  found: "Named you",
  partial: "Sometimes",
  missing: "Didn’t name you",
  unknown: "Not checked yet",
} as const

export function VerdictsBlock({ items }: { items: Extract<Block, { kind: "verdicts" }>["items"] }) {
  return (
    <div className="ag-verdicts">
      {items.map((v) => (
        <div key={v.engine} className={`ag-v ag-v--${v.state}`}>
          <div className="ag-v__n">{ENGINE_LABEL[v.engine]}</div>
          <div className="ag-v__s">{VERDICT_TEXT[v.state]}</div>
          {v.note && <div className="ag-v__w">{v.note}</div>}
        </div>
      ))}
    </div>
  )
}

// ── AI answer card ─────────────────────────────────────────────────────────

export function AnswerBlock(b: Extract<Block, { kind: "answer" }>) {
  const [open, setOpen] = useState(false)
  const html = useMemo(() => highlight(b.answer, b.businessName, b.mentioned), [b.answer, b.businessName, b.mentioned])
  const long = b.answer.length > 520
  return (
    <div className="ag-gpt">
      <div className="ag-gpt__q">
        <span>
          Asked <b>{ENGINE_LABEL[b.engine]}</b>
        </span>
        <span>as a customer would</span>
      </div>
      <div style={{ fontWeight: 500 }}>“{b.query}”</div>
      <div className={`ag-gpt__body ${open || !long ? "ag-gpt__body--open" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
      {long && !open && (
        <button className="ag-gpt__more" onClick={() => setOpen(true)}>
          Show the full answer
        </button>
      )}
      {b.sources && b.sources.length > 0 && (
        <div className="ag-gpt__src">
          Sources it used:{" "}
          {b.sources.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}
      <div className={`ag-gpt__you ${b.appeared ? "ag-gpt__you--ok" : ""}`}>
        {b.businessName || "You"} — {b.appeared ? "named" : "not mentioned"}
      </div>
    </div>
  )
}

// ── sources ────────────────────────────────────────────────────────────────

export function SourcesBlock({ items, title }: { items: Extract<Block, { kind: "sources" }>["items"]; title?: string }) {
  return (
    <div className="ag-sources">
      {title && <div className="ag-sources__h">{title}</div>}
      {items.map((s, i) => {
        const cls = `ag-src ${s.ok ? "ag-src--ok" : s.status.toLowerCase().includes("check") ? "ag-src--unknown" : ""}`
        const inner = (
          <>
            <span className="ag-src__ic">{s.ok ? "✓" : "✕"}</span>
            <span className="ag-src__t">
              {s.name}
              {s.detail && <small>{s.detail}</small>}
            </span>
            <span className="ag-src__a">{s.status}</span>
          </>
        )
        return s.href ? (
          <a key={i} className={cls} href={s.href} target="_blank" rel="noopener noreferrer">
            {inner}
          </a>
        ) : (
          <div key={i} className={cls}>
            {inner}
          </div>
        )
      })}
    </div>
  )
}

// ── stat / doc / diff / receipt ────────────────────────────────────────────

export function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="ag-stat">
      <span className="ag-stat__n">{value}</span>
      <span className="ag-stat__l">{label}</span>
    </div>
  )
}

export function DocBlock({
  b,
  onEdit,
}: {
  b: Extract<Block, { kind: "doc" }>
  onEdit?: (docId: string, text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(b.text ?? "")
  return (
    <div className="ag-doc">
      <div className="ag-doc__h">
        <b>{b.title}</b>
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {b.meta ?? ""}
          {b.editable && b.docId && !b.html && (
            <button
              type="button"
              className="ag-gpt__more"
              style={{ padding: 0 }}
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? "Done" : "Edit"}
            </button>
          )}
        </span>
      </div>
      {editing && b.docId ? (
        <textarea
          id={`doc-${b.docId}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onEdit?.(b.docId!, e.target.value)
          }}
        />
      ) : b.html ? (
        <div className="ag-doc__b" style={{ whiteSpace: "normal" }} dangerouslySetInnerHTML={{ __html: b.html }} />
      ) : (
        <div className="ag-doc__b">{text}</div>
      )}
    </div>
  )
}

export function DiffBlock(b: Extract<Block, { kind: "diff" }>) {
  const mark = (s: string) =>
    b.highlight && s.toLowerCase().includes(b.highlight.toLowerCase()) ? <mark>{s}</mark> : s
  return (
    <div className="ag-diff">
      <div className="ag-diff__c">
        <div className="ag-diff__k">{b.beforeLabel}</div>
        <ol>{b.before.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </div>
      <div className="ag-diff__c ag-diff__c--now">
        <div className="ag-diff__k">{b.afterLabel}</div>
        <ol>{b.after.map((s, i) => <li key={i}>{mark(s)}</li>)}</ol>
      </div>
    </div>
  )
}

export function ReceiptBlock(b: Extract<Block, { kind: "receipt" }>) {
  return (
    <div className="ag-receipt">
      <details open>
        <summary>
          {b.title} {b.sub && <span>{b.sub}</span>}
        </summary>
        <ul>{b.items.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </details>
    </div>
  )
}

// ── chips ──────────────────────────────────────────────────────────────────

export function ChipsBlock({
  items,
  onPick,
  disabled,
}: {
  items: Chip[]
  onPick: (chip: Chip) => void
  disabled?: boolean
}) {
  return (
    <div className="ag-chips">
      {items.map((c, i) => (
        <button
          key={i}
          type="button"
          className={`ag-chip ${c.primary || (i === 0 && c.primary !== false) ? "ag-chip--primary" : ""}`}
          disabled={disabled}
          onClick={() => onPick(c)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

// ── inline email ask ───────────────────────────────────────────────────────

export function EmailBlock({
  b,
  onSubmit,
}: {
  b: Extract<Block, { kind: "email" }>
  onSubmit: (email: string) => Promise<string | null>
}) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  if (sent) return null
  return (
    <form
      className="ag-ask"
      onSubmit={async (e) => {
        e.preventDefault()
        const v = value.trim()
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
          setErr("That doesn’t look like an email address.")
          return
        }
        setBusy(true)
        setErr(null)
        const problem = await onSubmit(v)
        setBusy(false)
        if (problem) setErr(problem)
        else setSent(true)
      }}
    >
      <label htmlFor="ag-email">{b.label}</label>
      <div className="ag-ask__row">
        <input
          id="ag-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={b.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
        />
        <button className="ag-pill ag-pill--blue" type="submit" disabled={busy}>
          {busy ? "Sending…" : b.cta}
        </button>
      </div>
      {err && <div className="ag-error">{err}</div>}
      <p className="ag-ask__fine">{b.fine}</p>
    </form>
  )
}

export function Typing() {
  return (
    <div className="ag-msg">
      <div className="ag-msg__av">a</div>
      <div className="ag-typing">
        <i />
        <i />
        <i />
      </div>
    </div>
  )
}
