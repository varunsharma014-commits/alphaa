"use client"

import { useEffect, type ReactNode } from "react"
import { Button } from "./button"

// A settings card: title + one line on the left, fields on the right (stacked on phones),
// optional footer with its own Save.
export function SettingsSection({ title, text, children, footer, id }: { title: ReactNode; text?: ReactNode; children: ReactNode; footer?: ReactNode; id?: string }) {
  return (
    <section className="ax-card xd-set" id={id}>
      <div className="xd-set__d"><h2>{title}</h2>{text && <p>{text}</p>}</div>
      <div className="xd-set__f">{children}</div>
      {footer && <div className="xd-set__ft">{footer}</div>}
    </section>
  )
}

// Floating "unsaved changes" bar. Shows only while `dirty`; warns before leaving the page.
export function SaveBar({ dirty, saving = false, onSave, onDiscard, text = "You have unsaved changes", saveLabel = "Save changes" }: {
  dirty: boolean
  saving?: boolean
  onSave: () => void
  onDiscard?: () => void
  text?: string
  saveLabel?: string
}) {
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
  if (!dirty && !saving) return null
  return (
    <div className="xd-save" role="region" aria-label="Unsaved changes">
      <span>{text}</span>
      {onDiscard && <Button size="sm" onClick={onDiscard} disabled={saving}>Discard</Button>}
      <Button size="sm" variant="primary" loading={saving} onClick={onSave}>{saveLabel}</Button>
    </div>
  )
}
