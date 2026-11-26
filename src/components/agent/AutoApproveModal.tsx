"use client"

import { useEffect, useRef, useState } from "react"
import {
  AUTO_APPROVE_CHANGED, AUTO_APPROVE_OPEN, CONSENT_AI, CONSENT_DECLARATION, CONSENT_CHECKBOX, CONSENT_CTA, CONSENT_MONEY, CONSENT_TITLE, CONSENT_VERSION,
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
      body: JSON.stringify(open.renew ? { op: "auto_renew", accept: true } : { op: "auto_on", accept: true, ...(open.key ? { key: open.key, value: open.value } : {}) }),
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
        <h2 id="aa-title">{open.renew ? "Please confirm the updated Autopilot declaration" : CONSENT_TITLE}</h2>
        {open.renew && <p className="ag-modal__muted">We updated the declaration. Autopilot keeps your current settings once you confirm, or you can turn it off.</p>}
        <p>{consentIntro(scope)}</p>
        {later && <p className="ag-modal__muted">{later}</p>}
        <p><b>{CONSENT_AI}</b></p>
        <p style={{ marginBottom: 4 }}>By turning on Autopilot, I declare that:</p>
        <ol type="i" style={{ maxHeight: "38vh", overflowY: "auto", paddingLeft: 30, listStyleType: "lower-roman", marginBottom: 12 }}>
          {CONSENT_DECLARATION.map((b) => (
            <li key={b} style={{ marginBottom: 6 }}>{b.includes("Terms of Service") ? <>{b.split("Terms of Service")[0]}<a href="/terms#ai-autopilot" target="_blank" rel="noopener">Terms of Service</a>{b.split("Terms of Service")[1]}</> : b}</li>
          ))}
        </ol>
        <p className="ag-modal__money">{CONSENT_MONEY}</p>
        <label className="ag-modal__check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>{CONSENT_CHECKBOX}</span>
        </label>
        {error && <p className="ag-modal__err">{error}</p>}
        <p className="ag-modal__muted" style={{ fontSize: 12 }}>Declaration version {CONSENT_VERSION}. Your acceptance is recorded with the time and your browser details.</p>
        <div className="ag-modal__btns">
          <button type="button" className="ag-btn-primary" disabled={!agreed || busy} onClick={accept}>{busy ? "Saving…" : open.renew ? "I agree, keep Autopilot on" : CONSENT_CTA}</button>
          {open.renew
            ? <button type="button" className="ag-btn-ghost" disabled={busy} onClick={async () => { setBusy(true); const ok = await turnOffAutoApprove(); setBusy(false); if (ok) setOpen(null); else setError("That didn’t save. Try again.") }}>Turn Autopilot off</button>
            : <button type="button" className="ag-btn-ghost" disabled={busy} onClick={() => setOpen(null)}>Cancel</button>}
        </div>
      </div>
    </div>
  )
}
