"use client"

import { useEffect, useRef, useState } from "react"
import { Button, Modal } from "@/components/workspace/ui"
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
  // Kept while the sheet closes, so the text doesn't blank mid-animation.
  const last = useRef<AutoApproveOpenDetail>({})
  if (open) last.current = open

  useEffect(() => {
    const on = (e: Event) => { setOpen((e as CustomEvent<AutoApproveOpenDetail>).detail ?? {}); setAgreed(false); setError(null) }
    window.addEventListener(AUTO_APPROVE_OPEN, on)
    return () => window.removeEventListener(AUTO_APPROVE_OPEN, on)
  }, [])

  const cur = open ?? last.current
  const scope = { pro, growth, only: cur.key }
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
  async function turnOff() {
    setBusy(true)
    const ok = await turnOffAutoApprove()
    setBusy(false)
    if (ok) setOpen(null)
    else setError("That didn’t save. Try again.")
  }

  // The words below are the recorded declaration (lib/auto-approve-text.ts): shown verbatim.
  return (
    <Modal
      open={!!open}
      onClose={() => setOpen(null)}
      dismissible={!busy}
      label={cur.renew ? "Confirm the updated Autopilot declaration" : CONSENT_TITLE}
      footer={<>
        {cur.renew
          ? <Button disabled={busy} onClick={() => void turnOff()}>Turn Autopilot off</Button>
          : <Button disabled={busy} onClick={() => setOpen(null)}>Cancel</Button>}
        <Button variant="grad" disabled={!agreed} loading={busy} onClick={() => void accept()}>{cur.renew ? "I agree, keep Autopilot on" : CONSENT_CTA}</Button>
      </>}
    >
      <div className="ax-aa">
        <div className="ax-aa__top">
          <span className="ax-orb" style={{ width: 40, height: 40 }} aria-hidden="true" />
          <h2 className="ax-aa__t">{cur.renew ? "Please confirm the updated Autopilot declaration" : CONSENT_TITLE}</h2>
        </div>
        {cur.renew && <p className="ax-aa__mut">The declaration changed. Autopilot keeps your current settings once you confirm, or you can turn it off.</p>}
        <p className="ax-aa__lead">{consentIntro(scope)}</p>
        {later && <p className="ax-aa__mut">{later}</p>}
        <p className="ax-aa__ai">{CONSENT_AI}</p>
        <div className="ax-aa__decl" tabIndex={0} role="region" aria-label="Declaration">
          <p>By turning on Autopilot, I declare that:</p>
          <ol>
            {CONSENT_DECLARATION.map((b) => (
              <li key={b}>{b.includes("Terms of Service") ? <>{b.split("Terms of Service")[0]}<a href="/terms#ai-autopilot" target="_blank" rel="noopener">Terms of Service</a>{b.split("Terms of Service")[1]}</> : b}</li>
            ))}
          </ol>
        </div>
        <p className="ax-aa__money">{CONSENT_MONEY}</p>
        <label className="ax-aa__check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>{CONSENT_CHECKBOX}</span>
        </label>
        {error && <p className="ax-aa__err" role="alert">{error}</p>}
        <p className="ax-aa__fine">Declaration version {CONSENT_VERSION}. Your acceptance is recorded with the time and your browser details.</p>
      </div>
    </Modal>
  )
}
