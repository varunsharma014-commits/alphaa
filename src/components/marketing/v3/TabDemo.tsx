"use client"

// The tab-row demo: picks a service, plays a short example agent conversation with an
// animated cursor, tints the stage in that service's colour, then moves to the next tab.
// Auto-cycles only while on screen and only until the visitor picks a tab. Keyboard: arrow
// keys / Home / End move between tabs (roving tabindex). Reduced motion: no cycling, no cursor.
import { useCallback, useEffect, useRef, useState } from "react"
import type { SvcKey } from "./services-v3"

export type DemoItem = { key: SvcKey; tab: string; ask: string; steps: string[]; res: string[] }

export function TabDemo({ items, label = "Example screens", agent = "Alphaa · AI agent" }: { items: DemoItem[]; label?: string; agent?: string }) {
  const [cur, setCur] = useState(0)
  const [run, setRun] = useState(0)
  const [picked, setPicked] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [cursorAt, setCursorAt] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    const el = root.current
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Cursor glides from the bottom right to the request bubble on each new run.
  useEffect(() => {
    setCursorAt(false)
    const t = window.setTimeout(() => setCursorAt(true), 350)
    return () => window.clearTimeout(t)
  }, [cur, run])

  useEffect(() => {
    if (picked || reduced || !visible) return
    const t = window.setTimeout(() => { setCur((c) => (c + 1) % items.length); setRun((r) => r + 1) }, 5200)
    return () => window.clearTimeout(t)
  }, [cur, run, picked, reduced, visible, items.length])

  const pick = useCallback((i: number, focus = false) => {
    setPicked(true)
    setCur(i)
    setRun((r) => r + 1)
    if (focus) tabs.current[i]?.focus()
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    const n = items.length
    const map: Record<string, number> = { ArrowRight: (cur + 1) % n, ArrowDown: (cur + 1) % n, ArrowLeft: (cur - 1 + n) % n, ArrowUp: (cur - 1 + n) % n, Home: 0, End: n - 1 }
    if (e.key in map) { e.preventDefault(); pick(map[e.key], true) }
  }

  const t = items[cur]
  return (
    <div ref={root} className={`v3-c-${t.key}`}>
      <div className="v3-tabs" role="tablist" aria-label="Pick what the agent does" onKeyDown={onKey}>
        {items.map((it, i) => (
          <button
            key={it.tab}
            ref={(el) => { tabs.current[i] = el }}
            type="button"
            role="tab"
            id={`v3-tab-${i}`}
            aria-selected={i === cur}
            aria-controls="v3-tabpanel"
            tabIndex={i === cur ? 0 : -1}
            className={`v3-tab v3-c-${it.key}`}
            onClick={() => pick(i)}
          >
            {it.tab}
          </button>
        ))}
      </div>
      <div className="v3-stage">
        <div className="v3-app" id="v3-tabpanel" role="tabpanel" aria-labelledby={`v3-tab-${cur}`} aria-live={picked ? "polite" : "off"}>
          <div className="v3-app__bar" aria-hidden="true"><i /><i /><i /><span>{agent}</span></div>
          <div key={`${cur}-${run}`}>
            <div className="v3-msg v3-msg--me"><div className="v3-bubble">{t.ask}</div></div>
            {t.steps.map((s, k) => (
              <div key={s} className="v3-msg" style={{ animationDelay: `${0.5 + k * 0.5}s` }}>
                <div className="v3-av" aria-hidden="true">a</div>
                <div className="v3-bubble">
                  <span className="v3-ok" aria-hidden="true">✓</span>{s}
                  {k === t.steps.length - 1 && <div className="v3-res">{t.res.map((r) => <span key={r}>{r}</span>)}</div>}
                </div>
              </div>
            ))}
          </div>
          {!reduced && (
            <svg className="v3-cursor" viewBox="0 0 24 24" aria-hidden="true" style={cursorAt ? { left: "62%", top: "13%" } : { left: "86%", top: "84%" }}>
              <path d="M3 2l7 19 2.5-7.5L20 11z" fill="#111" stroke="#fff" strokeWidth="1.5" />
            </svg>
          )}
        </div>
      </div>
      <p className="v3-fine v3-center">{label}</p>
    </div>
  )
}
