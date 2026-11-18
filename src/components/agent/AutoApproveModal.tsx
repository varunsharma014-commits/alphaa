"use client"

import { useEffect, useRef, useState } from "react"
import {
  AUTO_APPROVE_CHANGED, AUTO_APPROVE_OPEN, CONSENT_AI, CONSENT_BULLETS, CONSENT_CHECKBOX, CONSENT_CTA, CONSENT_MONEY, CONSENT_TITLE,
  consentIntro, consentTurnsOn, type AutoApproveChangedDetail, type AutoApproveOpenDetail,
} from "@/lib/auto-approve-text"

// "Let me post without asking?": the owner has to tick the box themselves before auto-approve
// turns on. Opened from anywhere with window.dispatchEvent(new CustomEvent(AUTO_APPROVE_OPEN)).

export function openAutoApprove(detail: AutoApproveOpenDetail = {}) {
  window.dispatchEvent(new CustomEvent<AutoApproveOpenDetail>(AUTO_APPROVE_OPEN, { detail }))
}

/** Turn it off (no warning needed); the page hears AUTO_APPROVE_CHANGED. */
export async function turnOffAutoApprove(): Promise<boolean> {
  const res = await fetch("/api/agent/autopilot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "auto_off" }) }).catch(() => null)
  const data = (await res?.json().catch(() => null)) as { messages?: AutoApproveChangedDetail["messages"] } | null
  if (!res?.ok) return false
  window.dispatchEvent(new CustomEvent<AutoApproveChangedDetail>(AUTO_APPROVE_CHANGED, { detail: { on: false, messages: data?.messages } }))
  return true
}

export function AutoApproveModal({ pro, growth }: { pro: boolean; growth: boolean }) {
  const [open, setOpen] = useState<AutoApproveOpenDetail | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const on = (e: Event) => { setOpen((e as CustomEvent<AutoApproveOpenDetail>).detail ?? {}); setAgreed(false); setError(null) }
    window.addEventListener(AUTO_APPROVE_OPEN, on)
    return () => window.removeEventListener(AUTO_APPROVE_OPEN, on)
  }, [])
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    box.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) setOpen(null) }
    window.addEventListener("keydown", esc)
    return () => { window.removeEventListener("keydown", esc); prev?.focus?.() }
  }, [open, busy])

  if (!open) return null
  const scope = { pro, growth, only: open.key }
  const { later } = consentTurnsOn(scope)

  async function accept() {
    if (!agreed || !open) return
    setBusy(true)
    setError(null)
    const res = await fetch("/api/agent/autopilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "auto_on", accept: true, ...(open.key ? { key: open.key, value: open.value } : {}) }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { error?: string; messages?: AutoApproveChangedDetail["messages"] } | null
    setBusy(false)
    if (!res?.ok) return setError(data?.error ?? "That didn’t save. Nothing changed. Try again.")
    window.dispatchEvent(new CustomEvent<AutoApproveChangedDetail>(AUTO_APPROVE_CHANGED, { detail: { on: true, messages: data?.messages } }))
    setOpen(null)
  }

  return (
    <div className="ag-modal" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !busy) setOpen(null) }}>
      <div className="ag-modal__box" role="dialog" aria-modal="true" aria-labelledby="aa-title" tabIndex={-1} ref={box}>
        <h2 id="aa-title">{CONSENT_TITLE}</h2>
        <p>{consentIntro(scope)}</p>
        {later && <p className="ag-modal__muted">{later}</p>}
        <p>{CONSENT_AI}</p>
        <ul>
          {CONSENT_BULLETS.map((b) => (
            <li key={b}>{b.includes("our Terms") ? <>{b.split("our Terms")[0]}our <a href="/terms" target="_blank" rel="noopener">Terms</a>{b.split("our Terms")[1]}</> : b}</li>
          ))}
        </ul>
        <p className="ag-modal__money">{CONSENT_MONEY}</p>
        <label className="ag-modal__check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>{CONSENT_CHECKBOX}</span>
        </label>
        {error && <p className="ag-modal__err">{error}</p>}
        <div className="ag-modal__btns">
          <button type="button" className="ag-btn-primary" disabled={!agreed || busy} onClick={accept}>{busy ? "Turning it on…" : CONSENT_CTA}</button>
          <button type="button" className="ag-btn-ghost" disabled={busy} onClick={() => setOpen(null)}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
