"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

// The AI assistant in the headline changes every couple of seconds. Names in
// plain black (B&W brand; no official logos — their trademark rules restrict it).
const ENGINES = [
  { name: "ChatGPT", color: "#000" },
  { name: "Claude", color: "#000" },
  { name: "Gemini", color: "#000" },
  { name: "Perplexity", color: "#000" },
]

export function EngineRotator() {
  const [i, setI] = useState(0)
  const [w, setW] = useState<number | null>(null)
  const refs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => setI((n) => (n + 1) % ENGINES.length), 2200)
    return () => window.clearInterval(id)
  }, [])

  // Animate the slot's width to the current word so the line doesn't jump.
  useLayoutEffect(() => {
    const el = refs.current[i]
    if (el) setW(el.getBoundingClientRect().width)
  }, [i])

  return (
    <span className="hx-rot" style={w ? { width: w } : undefined} aria-live="off">
      <span className="sr-only">ChatGPT, Claude, Gemini and Perplexity</span>
      {ENGINES.map((e, k) => (
        <span
          key={e.name}
          ref={(el) => { refs.current[k] = el }}
          aria-hidden="true"
          className={`hx-rot__w ${k === i ? "is-on" : k === (i + ENGINES.length - 1) % ENGINES.length ? "is-out" : ""}`}
          style={e.color.startsWith("linear") ? { backgroundImage: e.color, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : { color: e.color }}
        >
          {e.name}
        </span>
      ))}
    </span>
  )
}
