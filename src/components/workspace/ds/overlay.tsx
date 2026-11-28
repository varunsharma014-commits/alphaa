"use client"

import Link from "next/link"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { Glyph } from "./glyphs"
import { Button } from "./button"

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/** Overlays render into the shell's `.ax` root (so the workspace styles apply and no transformed card traps them). */
function Portal({ children }: { children: ReactNode }) {
  // Resolved on first client render so a popover can measure itself in the same commit.
  // (Overlays open from a click, so the server never renders one open.)
  const [host, setHost] = useState<Element | null>(() => (typeof document === "undefined" ? null : document.querySelector(".ax") ?? document.body))
  useEffect(() => { if (!host) setHost(document.querySelector(".ax") ?? document.body) }, [host])
  return host ? createPortal(children, host) : null
}

/** Escape to close, Tab stays inside, focus returns to where it was. */
function useModalFocus(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void, initial?: RefObject<HTMLElement | null>) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const before = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const t = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const first = initial?.current ?? el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? el).focus()
    }, 20)
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); close.current(); return }
      if (e.key !== "Tab") return
      const el = ref.current
      if (!el) return
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement)
      if (!items.length) { e.preventDefault(); return }
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", key, true)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener("keydown", key, true)
      document.body.style.overflow = prevOverflow
      if (before && document.contains(before)) before.focus()
    }
  }, [open, ref, initial])
}

// One sheet for everything: `side` slides in from the right (inspectors, editors, previews),
// `center` is a dialog (confirmations, consent, credits). On phones both become a bottom sheet.
// Scrim click and Escape close it, Tab stays inside, focus goes back to the button that opened it.
export function Sheet({ open, onClose, title, eyebrow, sub, children, footer, side = "side", wide = false, label, initialFocus, dismissible = true }: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  eyebrow?: ReactNode
  sub?: ReactNode
  children?: ReactNode
  /** Buttons, right-aligned (primary last). */
  footer?: ReactNode
  side?: "side" | "center"
  wide?: boolean
  /** Accessible name when `title` isn't plain text. */
  label?: string
  initialFocus?: RefObject<HTMLElement | null>
  /** false = scrim click and Escape do nothing (e.g. while saving). */
  dismissible?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => { if (dismissible) onClose() }, [dismissible, onClose])
  useModalFocus(open, ref, close, initialFocus)
  if (!open) return null
  return (
    <Portal>
      <div className="xd-scrim" onClick={close} aria-hidden="true" />
      <div ref={ref} className={`xd-sheet ${side}${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={title ? `${id}-t` : undefined} aria-label={title ? undefined : label} tabIndex={-1}>
        {(title || eyebrow) && (
          <div className="xd-sheet__h">
            <div style={{ minWidth: 0 }}>
              {eyebrow && <div className="ax-eb">{eyebrow}</div>}
              {title && <h2 id={`${id}-t`}>{title}</h2>}
              {sub && <p>{sub}</p>}
            </div>
            {dismissible && <button type="button" className="ax-x" aria-label="Close" onClick={onClose}><Glyph name="x" size={14} stroke={2} /></button>}
          </div>
        )}
        <div className="xd-sheet__b">{children}</div>
        {footer && <div className="xd-sheet__f">{footer}</div>}
      </div>
    </Portal>
  )
}

/** Same as Sheet with side="center". */
export const Modal = (p: Omit<Parameters<typeof Sheet>[0], "side">) => <Sheet {...p} side="center" />

// A yes/no question in place of window.confirm. `danger` makes the yes button red.
export function ConfirmSheet({ open, title, text, confirmLabel = "Yes, do it", cancelLabel = "Cancel", danger = false, busy = false, onConfirm, onClose }: {
  open: boolean
  title: ReactNode
  text?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} side="center" title={title} dismissible={!busy}
      footer={<><Button onClick={onClose} disabled={busy}>{cancelLabel}</Button><Button variant={danger ? "danger" : "primary"} loading={busy} onClick={onConfirm}>{confirmLabel}</Button></>}>
      {text && <p style={{ margin: 0, color: "var(--x-mut)" }}>{text}</p>}
    </Sheet>
  )
}

type ConfirmOpts = { title: ReactNode; text?: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean }

/**
 * Promise-style confirm, a drop-in for `window.confirm`:
 *   const { confirm, node } = useConfirm()
 *   if (!(await confirm({ title: "Disconnect Instagram?", danger: true }))) return
 *   ...render {node} once in the component.
 */
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), [])
  const done = (v: boolean) => { state?.resolve(v); setState(null) }
  const node = <ConfirmSheet open={!!state} title={state?.title ?? ""} text={state?.text} confirmLabel={state?.confirmLabel} cancelLabel={state?.cancelLabel} danger={state?.danger} onConfirm={() => done(true)} onClose={() => done(false)} />
  return { confirm, node }
}

// Floating panel anchored to an element. Flips above when there's no room below, stays inside the
// viewport, closes on outside click and Escape. Low level: most callers want Menu.
export function Popover({ open, onClose, anchor, children, align = "start", width, label }: {
  open: boolean
  onClose: () => void
  anchor: RefObject<HTMLElement | null>
  children: ReactNode
  align?: "start" | "end"
  width?: number
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const place = useCallback(() => {
    const a = anchor.current, p = ref.current
    if (!a || !p) return
    const r = a.getBoundingClientRect()
    const w = p.offsetWidth, h = p.offsetHeight
    const vw = window.innerWidth, vh = window.innerHeight
    let left = align === "end" ? r.right - w : r.left
    left = Math.max(12, Math.min(left, vw - w - 12))
    let top = r.bottom + 6
    if (top + h > vh - 12 && r.top - h - 6 > 12) top = r.top - h - 6
    top = Math.max(12, Math.min(top, vh - h - 12))
    setPos({ top, left })
  }, [anchor, align])
  useIso(() => { if (open) place(); else setPos(null) }, [open, place])
  useEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return
      onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { onClose(); anchor.current?.focus() } }
    window.addEventListener("pointerdown", down, true)
    window.addEventListener("keydown", key)
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("pointerdown", down, true)
      window.removeEventListener("keydown", key)
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, onClose, place, anchor])
  if (!open) return null
  return (
    <Portal>
      <div ref={ref} className="xd-pop" role="dialog" aria-label={label} style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, visibility: pos ? "visible" : "hidden" }}>
        {children}
      </div>
    </Portal>
  )
}

export type MenuItem =
  | { label: ReactNode; hint?: ReactNode; onClick?: () => void; href?: string; danger?: boolean; disabled?: boolean; icon?: ReactNode }
  | "sep"

// A visible "⋯" (or custom) button that opens a list of actions. Arrow keys move, Enter picks,
// Escape closes. Replaces hover-only actions and in-flow dropdowns.
export function Menu({ items, label, trigger, triggerClassName, align = "end", width = 220 }: {
  items: MenuItem[]
  /** Accessible name of the trigger, e.g. "More actions for Sample Rival". */
  label: string
  /** Trigger content; default is the ⋯ glyph. */
  trigger?: ReactNode
  /** Default "xd-dots" (round icon button); use "ax-btn s sm" for a text button. */
  triggerClassName?: string
  align?: "start" | "end"
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const focusAt = (i: number) => {
    const els = Array.from(list.current?.querySelectorAll<HTMLElement>(".xd-mi:not(:disabled)") ?? [])
    if (els.length) els[(i + els.length) % els.length].focus()
  }
  useEffect(() => { if (open) requestAnimationFrame(() => focusAt(0)) }, [open])
  const onKey = (e: React.KeyboardEvent) => {
    const els = Array.from(list.current?.querySelectorAll<HTMLElement>(".xd-mi:not(:disabled)") ?? [])
    const i = els.indexOf(document.activeElement as HTMLElement)
    if (e.key === "ArrowDown") { e.preventDefault(); focusAt(i + 1) }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusAt(i - 1) }
    else if (e.key === "Home") { e.preventDefault(); focusAt(0) }
    else if (e.key === "End") { e.preventDefault(); focusAt(els.length - 1) }
    else if (e.key === "Tab") setOpen(false)
  }
  const pick = (it: Exclude<MenuItem, "sep">) => { setOpen(false); btn.current?.focus(); it.onClick?.() }
  return (
    <>
      <button ref={btn} type="button" className={triggerClassName ?? "xd-dots"} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true) } }}>
        {trigger ?? <Glyph name="dots" size={20} stroke={2.2} />}
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={btn} align={align} width={width} label={label}>
        <div ref={list} id={id} role="menu" aria-label={label} onKeyDown={onKey}>
          {items.map((it, i) => it === "sep" ? <div key={i} className="xd-msep" role="separator" /> : it.href && !it.disabled ? (
            <Link key={i} role="menuitem" href={it.href} className={`xd-mi${it.danger ? " danger" : ""}`} onClick={() => setOpen(false)}>
              {it.icon}<span>{it.label}{it.hint && <span className="xd-mi__h">{it.hint}</span>}</span>
            </Link>
          ) : (
            <button key={i} role="menuitem" type="button" className={`xd-mi${it.danger ? " danger" : ""}`} disabled={it.disabled} onClick={() => pick(it)}>
              {it.icon}<span>{it.label}{it.hint && <span className="xd-mi__h">{it.hint}</span>}</span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  )
}
