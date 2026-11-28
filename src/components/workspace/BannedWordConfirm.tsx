"use client"

// "Publish it anyway?" when the owner's own text uses one of their banned words. Mounted once in
// WorkspaceShell (and on the no-login /approve page). It watches every same-origin /api/ answer: a
// 409 with { confirmBanned: true } (lib/owner-edit-check.ts) waits for the owner's answer; "Publish
// anyway" sends the very same request again with the x-alphaa-ok-banned header and hands that
// answer back to whoever asked, "Let me fix it" hands back the 409 (its message is shown as usual).
import { useEffect, useState } from "react"

const OK_HEADER = "x-alphaa-ok-banned"
type Ask = { word: string; text: string; answer: (yes: boolean) => void }
let patched = false
let show: ((a: Ask) => void) | null = null

function watch() {
  if (patched || typeof window === "undefined") return
  patched = true
  const orig = window.fetch.bind(window)
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const res = await orig(...args)
    if (res.status !== 409 || !show) return res
    try {
      const raw = typeof args[0] === "string" ? args[0] : args[0] instanceof URL ? args[0].href : (args[0] as Request).url
      const url = new URL(raw, window.location.href)
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return res
      const j = (await res.clone().json().catch(() => null)) as { confirmBanned?: boolean; banned?: string; error?: string } | null
      if (!j?.confirmBanned || !j.banned) return res
      // A Request object's body can't be sent twice: only plain (url, init) calls are retried.
      if (typeof args[0] !== "string" && !(args[0] instanceof URL)) return res
      const yes = await new Promise<boolean>((answer) => show?.({ word: j.banned!, text: j.error ?? "", answer }))
      if (!yes) return res
      const init = { ...(args[1] ?? {}) }
      const headers = new Headers(init.headers)
      headers.set(OK_HEADER, "1")
      return orig(args[0], { ...init, headers })
    } catch {
      return res
    }
  }
}

export function BannedWordConfirm() {
  const [ask, setAsk] = useState<Ask | null>(null)
  useEffect(() => {
    watch()
    show = (a) => setAsk(a)
    return () => { show = null }
  }, [])
  if (!ask) return null
  const done = (yes: boolean) => { ask.answer(yes); setAsk(null) }
  return (
    <div role="dialog" aria-modal="true" aria-label="A word on your list" onClick={() => done(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#1d1d1f", borderRadius: 20, maxWidth: 420, width: "100%", padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>“{ask.word}” is on your list</h2>
        <p style={{ fontSize: 14, color: "#3a3a40", margin: "8px 0 0", lineHeight: 1.5 }}>
          You asked me never to use “{ask.word}”, and it’s in the text you’re about to publish. I can send it as it is, or you can change it first.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>
          <button type="button" onClick={() => done(false)} style={{ padding: "9px 16px", borderRadius: 999, background: "#f2f2f5", color: "#1d1d1f", fontSize: 14, border: 0, cursor: "pointer" }}>Let me fix it</button>
          <button type="button" autoFocus onClick={() => done(true)} style={{ padding: "9px 16px", borderRadius: 999, background: "#000", color: "#fff", fontSize: 14, border: 0, cursor: "pointer" }}>Publish anyway</button>
        </div>
      </div>
    </div>
  )
}
