"use client"

import Link from "next/link"
import type { AiCard } from "@/lib/workspace/ai-cards"
import { EngineIcon } from "./EngineIcon"
import { Glyph, Pill } from "./ds"
import { When } from "./ui"
import "./detail.css"

// One AI assistant: what it said the last time I asked it a customer question. Verdict = the same
// evidence as the Briefing cards (getEngineEvidence). The quote is the stored answer itself, never
// a summary, and an AI I haven't asked says so instead of "Not yet".

export function EngineMark({ engine, size = "md" }: { engine: string; size?: "md" | "lg" }) {
  return <span className={`xp-mark xp-mark--${engine}${size === "lg" ? " xp-mark--lg" : ""}`} aria-hidden="true"><EngineIcon engine={engine} size={size === "lg" ? 24 : 17} /></span>
}

export function verdictPill(state: AiCard["state"]) {
  if (state === "yes") return <Pill tone="ok" dot>Names you</Pill>
  if (state === "no") return <Pill tone="warn">Not yet</Pill>
  return <Pill tone="idle">Not checked yet</Pill>
}

/** The part of the stored answer worth reading: the sentence about the owner, else its opening. */
export function answerExcerpt(c: AiCard): string | null {
  if (c.state === "yes" && c.toneQuote) return c.toneQuote
  if (!c.answer) return null
  const flat = c.answer.replace(/[#*_`>]+/g, "").replace(/\s+/g, " ").trim()
  return flat.length > 220 ? `${flat.slice(0, 217).replace(/\s+\S*$/, "")}…` : flat
}

export function EngineCard({ card, href }: { card: AiCard; href?: string }) {
  const quote = answerExcerpt(card)
  return (
    <article className={`xp-eng${href ? " click" : ""}`}>
      {href && <Link className="xp-eng__a" href={href} aria-label={`${card.name}: see every question I asked it`} />}
      <div className="xp-eng__top">
        <span className="xp-eng__name"><EngineMark engine={card.engine} />{card.name}</span>
        <span className="xp-eng__pills">
          {card.state === "yes" && card.tone && <Pill tone={card.tone === "positive" ? "ok" : card.tone === "negative" ? "warn" : "idle"}>{card.tone === "positive" ? "Positive" : card.tone === "negative" ? "Negative" : card.tone === "mixed" ? "Mixed" : "Neutral"}</Pill>}
          {verdictPill(card.state)}
        </span>
      </div>

      {card.state === "unknown" ? (
        <p className="ax-p">I haven’t asked {card.name} a customer question yet. My weekly check runs on Wednesday.</p>
      ) : (
        <>
          {card.question && <div className="xp-eng__q">“{card.question}”</div>}
          {quote && <p className="xp-eng__quote">{quote}</p>}
          {card.names.length > 0 && (
            <div>
              <div className="xp-eng__lbl">{card.state === "yes" ? "Also named" : "Named instead of you"}</div>
              <div className="xp-chips">{card.names.map((n) => <span key={n} className="ax-chip">{n}</span>)}</div>
            </div>
          )}
        </>
      )}

      <div className="xp-eng__foot">
        <span>{card.at ? <When at={card.at} mode="ago" prefix="Asked " fallback="" /> : ""}</span>
        {href && <span className="xp-eng__go">See details <Glyph name="chevron" size={13} /></span>}
      </div>
    </article>
  )
}
