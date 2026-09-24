// Code-drawn "product shots" for the marketing site. apple.com sells with a
// picture in every tile; we don't have photography, so each scene is a small,
// live-looking piece of what the agent actually does. Pure markup + CSS
// (styles in app/apple.css, prefix .ap-) — no images to download.

import type { ReactNode } from "react"

/** An illustrated panel: soft flat colour with two background blobs. */
export function Panel({ tone, children, tall }: { tone: "lavender" | "sky" | "sage" | "peach" | "mist"; children: ReactNode; tall?: boolean }) {
  return (
    <div className={`ap-panel ap-panel--${tone}${tall ? " ap-panel--tall" : ""}`} aria-hidden="true">
      <span className="ap-blob ap-blob--a" />
      <span className="ap-blob ap-blob--b" />
      <div className="ap-panel__stage">{children}</div>
    </div>
  )
}

/** A ChatGPT-style answer that names the business. */
export function ChatAnswer({ q, name, rest, engine = "ChatGPT" }: { q: string; name: string; rest: string; engine?: string }) {
  return (
    <div className="ap-chat">
      <div className="ap-chat__bar"><span className="ap-chat__dot" />{engine}</div>
      <div className="ap-chat__q">{q}</div>
      <div className="ap-chat__a">
        I’d recommend <mark>{name}</mark>{rest}
      </div>
    </div>
  )
}

/** An iPhone-ish frame. */
export function Phone({ children, time = "9:41" }: { children: ReactNode; time?: string }) {
  return (
    <div className="ap-phone">
      <div className="ap-phone__screen">
        <div className="ap-phone__status"><span>{time}</span><span className="ap-phone__island" /><span className="ap-phone__sig"><i /><i /><i /><b /></span></div>
        {children}
      </div>
    </div>
  )
}

/** A notification / message bubble from the agent inside a phone. */
export function AgentNote({ title, body, actions }: { title: string; body: string; actions?: string[] }) {
  return (
    <div className="ap-note">
      <div className="ap-note__head"><span className="ap-note__icon">✦</span><b>Alphaa</b><span className="ap-note__now">now</span></div>
      <div className="ap-note__title">{title}</div>
      <div className="ap-note__body">{body}</div>
      {actions && (
        <div className="ap-note__actions">
          {actions.map((a, i) => (
            <span key={a} className={i === 0 ? "ap-note__btn ap-note__btn--primary" : "ap-note__btn"}>{a}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Incoming call screen — the end goal. */
export function IncomingCall({ from, sub }: { from: string; sub: string }) {
  return (
    <div className="ap-call">
      <div className="ap-call__label">incoming call…</div>
      <div className="ap-call__who">{from}</div>
      <div className="ap-call__sub">{sub}</div>
      <div className="ap-call__btns">
        <span className="ap-call__btn ap-call__btn--no">✕</span>
        <span className="ap-call__btn ap-call__btn--yes">✆</span>
      </div>
    </div>
  )
}

/** A search-ad price tag, struck through, next to an organic AI badge. */
export function AdVsAi() {
  return (
    <div className="ap-advs">
      <div className="ap-ad">
        <div className="ap-ad__tag">Sponsored</div>
        <div className="ap-ad__price"><s>$15.40</s> per click</div>
        <div className="ap-ad__meta">Google Ads · bidding against 12 others</div>
      </div>
      <div className="ap-badge">
        <span className="ap-badge__star">★</span>
        <div>
          <b>Recommended by ChatGPT</b>
          <span>Free. Earned. Trusted.</span>
        </div>
      </div>
    </div>
  )
}

/** Four engine chips with verdicts. */
export function EngineChips({ items }: { items: { name: string; ok: boolean }[] }) {
  return (
    <div className="ap-engines">
      {items.map((e) => (
        <div key={e.name} className={`ap-engine${e.ok ? " ap-engine--ok" : ""}`}>
          <span className="ap-engine__n">{e.name}</span>
          <span className="ap-engine__v">{e.ok ? "Named you" : "Not yet"}</span>
        </div>
      ))}
    </div>
  )
}

/** A mini checklist card (things AI can read). */
export function Checklist({ rows }: { rows: { label: string; ok: boolean }[] }) {
  return (
    <div className="ap-check">
      {rows.map((r) => (
        <div key={r.label} className="ap-check__row">
          <span className={r.ok ? "ap-check__ok" : "ap-check__no"}>{r.ok ? "✓" : "✕"}</span>
          {r.label}
        </div>
      ))}
    </div>
  )
}

/** A draft document card with a highlighted new line. */
export function DraftDoc({ title, lines, fresh }: { title: string; lines: string[]; fresh: string }) {
  return (
    <div className="ap-doc">
      <div className="ap-doc__bar"><span />{title}<em>draft</em></div>
      {lines.map((l) => <div key={l} className="ap-doc__line">{l}</div>)}
      <div className="ap-doc__fresh">{fresh}</div>
    </div>
  )
}
