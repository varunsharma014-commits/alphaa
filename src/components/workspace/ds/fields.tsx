"use client"

import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, type ReactElement, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react"

// A labelled field: the label is wired to the control (htmlFor/id), with helper text and an error
// line read out by screen readers. Put one control inside: TextInput, TextArea or Select.
export function Field({ label, hint, error, optional = false, children, id }: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>
  id?: string
}) {
  const auto = useId()
  const fid = id ?? children.props.id ?? `f${auto}`
  const desc = [hint ? `${fid}-h` : null, error ? `${fid}-e` : null].filter(Boolean).join(" ") || undefined
  const control = isValidElement(children) ? cloneElement(children, { id: fid, "aria-describedby": desc, "aria-invalid": error ? true : undefined }) : children
  return (
    <div className="ax-field">
      <label htmlFor={fid}>{label}{optional && <span className="ax-field__opt">(optional)</span>}</label>
      {control}
      {error ? <div className="ax-field__e" id={`${fid}-e`} role="alert">{error}</div> : hint ? <div className="ax-field__h" id={`${fid}-h`}>{hint}</div> : null}
    </div>
  )
}

/** Text input. `prefix` / `suffix` = a unit inside the box ("$", "/mo"). */
export function TextInput({ prefix, suffix, className = "", ...p }: InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }) {
  const input = <input type="text" {...p} className={`ax-in ${className}`.trim()} />
  if (!prefix && !suffix) return input
  return (
    <span className={`ax-inwrap${prefix ? " has-pre" : ""}${suffix ? " has-suf" : ""}`}>
      {prefix && <span className="pre" aria-hidden="true">{prefix}</span>}
      {input}
      {suffix && <span className="suf" aria-hidden="true">{suffix}</span>}
    </span>
  )
}

/** Textarea that grows with its text (up to `maxRows`). */
export function TextArea({ className = "", maxRows = 14, onInput, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { maxRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const fit = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    const line = parseFloat(getComputedStyle(el).lineHeight) || 20
    const max = line * maxRows + 22
    el.style.height = `${Math.min(el.scrollHeight + 2, max)}px`
    el.style.overflowY = el.scrollHeight + 2 > max ? "auto" : "hidden"
  }, [maxRows])
  useEffect(() => { fit() }, [fit, p.value])
  return <textarea ref={ref} rows={3} {...p} className={`ax-in ${className}`.trim()} onInput={(e) => { fit(); onInput?.(e) }} />
}

/** Native select in the workspace style (keyboard and phone pickers work as usual). */
export function Select({ options, className = "", placeholder, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string; disabled?: boolean }[]; placeholder?: string }) {
  return (
    <span className="ax-sel">
      <select {...p} className={`ax-in ${className}`.trim()}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </span>
  )
}

/**
 * An inline pill select for sentence builders: "Pause any ad when [cost per lead] is over [$40]".
 * Wraps to the next line on phones like the words around it.
 */
export function TokenSelect<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <span className="xd-tok">
      <select value={value} aria-label={label} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </span>
  )
}

/** A sentence built from words and TokenSelects. */
export function Sentence({ children }: { children: ReactNode }) {
  return <p className="xd-sentence" style={{ margin: 0 }}>{children}</p>
}

/** Responsive grid for short fields side by side (City / State / ZIP); stacks on phones. */
export function FieldGrid({ children, min = 180 }: { children: ReactNode; min?: number }) {
  return <div className="xd-fgrid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}>{children}</div>
}
