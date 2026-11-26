"use client"

import { useEffect, useRef, useState } from "react"
import { mdToHtml } from "@/lib/markdown"
import { AI_NOTE, askAlphaa, toast } from "@/lib/workspace/events"
import type { IdeaRow, WorkingCard } from "@/lib/workspace/research"
import type { Made } from "@/lib/workspace/make"

// X-Ray / Make my version / Write it: the hook, why it worked (from the data), my ready version
// for the owner's brand, and ONE action. Autopilot on = "Add to Going out soon" (stoppable for up
// to 3 days); off = "Schedule" (the owner's tap is the approval). Nothing goes out from here otherwise.

export type ReadySource = { kind: "niche"; card: WorkingCard } | { kind: "idea"; idea: IdeaRow }
type Flags = { autopilot: boolean; siteConnected: boolean; hasSocialAccounts: boolean; gmbConnected: boolean }

export function ReadySheet({ source, make, flags, onClose }: { source: ReadySource; make: boolean; flags: Flags; onClose: () => void }) {
  const [made, setMade] = useState<Made | null>(null)
  const [writing, setWriting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const started = useRef(false)

  async function write() {
    setWriting(true)
    setError(null)
    const body = source.kind === "niche" ? { kind: "niche", id: source.card.id } : { kind: "idea", title: source.idea.text, format: source.idea.format ?? "blog" }
    const res = await fetch("/api/workspace/make", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as (Made & { error?: string }) | null
    setWriting(false)
    if (!res?.ok || !d?.text) return setError(d?.error ?? "I couldn’t write that just now. Try again in a minute.")
    setMade(d)
  }
  useEffect(() => {
    if (!make || started.current) return
    started.current = true
    void write()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [make])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose() }
    window.addEventListener("keydown", k)
    return () => window.removeEventListener("keydown", k)
  }, [busy, onClose])

  async function go(window: boolean) {
    if (!made?.id || made.kind === "copy") return
    setBusy(true)
    const res = await fetch("/api/workspace/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: made.kind, id: made.id, window }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string; at?: string | null; url?: string | null } | null
    setBusy(false)
    if (!res?.ok) return toast(d?.error ?? "That didn’t go through. Nothing changed.")
    const when = d?.at ? new Date(d.at).toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit" }) : null
    setDone(d?.url ? `Live: ${d.url}` : when ? `In “Going out soon”. It goes out ${when}${window ? " unless you stop it" : ""}.` : "Done.")
    toast(window ? "Added to Going out soon" : "Scheduled")
  }

  const title = source.kind === "niche" ? source.card.title : source.idea.text
  const eb = source.kind === "niche" ? `${source.card.where}${source.card.format ? ` · ${source.card.format}` : ""}` : `${source.idea.kind}${source.idea.proof ? ` · ${source.idea.proof}` : ""}`

  // The single action, by what was made and what's connected.
  const action = (() => {
    if (!made) return null
    if (made.kind === "copy") return <button className="ax-btn p" type="button" onClick={() => { navigator.clipboard?.writeText(made.text).then(() => toast("Copied"), () => toast("Couldn’t copy")) }}>Copy it</button>
    if (made.kind === "social" && !made.accounts) return <button className="ax-btn p" type="button" onClick={() => { onClose(); askAlphaa({ topic: "social", label: "Connect a social account" }) }}>Connect an account to post it</button>
    if (made.kind === "gbp" && !flags.gmbConnected) return <a className="ax-btn p" href="/api/integrations/google/connect?go=1">Connect your Google listing</a>
    if (made.kind === "site" && !flags.siteConnected) return <button className="ax-btn p" type="button" onClick={() => { onClose(); askAlphaa({ chip: { label: "Email it to my web person", action: { type: "handoff", what: "post", title: made.title, text: made.text, draftId: made.id ?? undefined } } }) }}>Send it to my web person</button>
    if (/\[[^\]]{2,}\]/.test(made.text)) return <button className="ax-btn p" type="button" onClick={() => { onClose(); askAlphaa({ topic: made.kind === "social" ? "social" : "content", label: "My drafts" }) }}>Fill in the facts</button>
    return flags.autopilot
      ? <button className="ax-btn p" type="button" disabled={busy} onClick={() => void go(true)}>{busy ? "Adding…" : "Add to Going out soon"}</button>
      : <button className="ax-btn p" type="button" disabled={busy} onClick={() => void go(false)}>{busy ? "Scheduling…" : "Schedule"}</button>
  })()

  return (
    <>
      <div className="ax-bk" onClick={() => { if (!busy) onClose() }} aria-hidden="true" />
      <aside className="ax-insp ax-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div style={{ minWidth: 0 }}><div className="ax-eb">{eb}</div><h3>{title}</h3></div>
          <button className="ax-x" type="button" aria-label="Close" onClick={onClose} disabled={busy}>✕</button>
        </header>
        <div className="bd">
          {source.kind === "niche" ? (
            <>
              <div className="box">
                <div className="ax-eb" style={{ marginBottom: 6 }}>The hook</div>
                <div className="v">{source.card.hook ? `“${source.card.hook}”` : source.card.title}</div>
                <div className="ax-t11" style={{ marginTop: 6 }}>{[source.card.format, source.card.duration, source.card.badge].filter(Boolean).join(" · ")}</div>
              </div>
              {source.card.why && <div><div className="ax-eb" style={{ marginBottom: 6 }}>Why it worked</div><div className="v">{source.card.why}</div>{source.card.stats.length > 0 && <div className="ax-t11" style={{ marginTop: 6 }}>{source.card.stats.map((x) => `${x.v} ${x.k.toLowerCase()}`).join(" · ")}</div>}</div>}
              <a className="ax-src" href={source.card.url} target="_blank" rel="noopener noreferrer">See the original ↗</a>
            </>
          ) : (
            <>
              <div className="box">
                <div className="ax-eb" style={{ marginBottom: 6 }}>The hook</div>
                <div className="v" style={{ fontWeight: 650 }}>{source.idea.hook ? `“${source.idea.hook}”` : source.idea.text}</div>
              </div>
              <div><div className="ax-eb" style={{ marginBottom: 6 }}>Why this, now</div><div className="v">{source.idea.why}</div>{source.idea.proof && <span className="ax-proof" style={{ marginTop: 8 }}>{source.idea.proof}</span>}</div>
            </>
          )}
          <div>
            <div className="ax-eb" style={{ marginBottom: 6 }}>My version for you</div>
            {!made && !writing && !error && <button className="ax-btn s sm" type="button" onClick={() => void write()}>Write my version</button>}
            {writing && <div className="ax-steps"><div className="now"><span className="mk" aria-hidden="true" />Writing it in your voice, with your brand</div></div>}
            {error && <div className="box"><div className="v">{error}</div><button className="ax-btn s sm" type="button" style={{ marginTop: 10 }} onClick={() => void write()}>Try again</button></div>}
            {made && (
              <>
                {made.image && <img src={made.image} alt="" />}
                {made.kind === "site"
                  ? <div className="ax-md ax-reveal" dangerouslySetInnerHTML={{ __html: mdToHtml(made.text, { highlightPlaceholders: true }) }} />
                  : <div className="v ax-reveal" style={{ whiteSpace: "pre-line" }}>{made.text}</div>}
              </>
            )}
          </div>
          <p className="ax-note" role="note" style={{ marginTop: 0 }}>{AI_NOTE}</p>
        </div>
        <footer>
          {done ? <><span style={{ flex: 1, fontSize: 13, color: "var(--x-mut)", alignSelf: "center" }}>{done}</span><button className="ax-btn s" type="button" onClick={onClose}>Close</button></>
            : action ?? <button className="ax-btn s" type="button" onClick={onClose}>Close</button>}
        </footer>
      </aside>
    </>
  )
}
