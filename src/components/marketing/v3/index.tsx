// Marketing v3 building blocks (server components). Styles: ./v3.css (scoped under .v3).
// Usage: wrap a page in <V3Page>, then <Frame> with <Section>s inside.
import Link from "next/link"
import type { ReactNode, CSSProperties } from "react"
import "./v3.css"
import { SERVICE_BY_SLUG, type ServiceSlug } from "@/content/services"
import { SVC, SVC_ORDER, type SvcKey } from "./services-v3"

export { SVC, SVC_ORDER } from "./services-v3"
export type { SvcKey } from "./services-v3"

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ")

/** Page root: turns on the v3 tokens and lets the page follow the OS dark mode. */
export function V3Page({ children, className, tone }: { children: ReactNode; className?: string; tone?: SvcKey }) {
  return <div className={cx("v3 v3-page", tone && `v3-c-${tone}`, className)}>{children}</div>
}

/** The centred content column (no side lines). `top` clears the fixed nav. */
export function Frame({ children, top = false, className }: { children: ReactNode; top?: boolean; className?: string }) {
  return <div className={cx("v3-frame", top && "v3-frame--top", className)}>{children}</div>
}

export function Section({ children, id, className, center, flush, tight, tone, style, label }: {
  children: ReactNode; id?: string; className?: string; center?: boolean; flush?: boolean; tight?: boolean; tone?: SvcKey | "ink"; style?: CSSProperties; label?: string
}) {
  return (
    <section id={id} aria-label={label} style={style} className={cx("v3-sec", center && "v3-center", flush && "v3-sec--flush", tight && "v3-sec--tight", tone && `v3-c-${tone}`, className)}>
      {children}
    </section>
  )
}

export const Tick = () => (
  <span className="v3-tick" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg></span>
)

export function Points({ items }: { items: ReactNode[] }) {
  return <ul className="v3-points">{items.map((p, i) => <li key={i}><Tick /><span>{p}</span></li>)}</ul>
}

/** The five coloured service pills. Links to each service page unless `links={false}`. */
export function ServicePills({ links = true, only }: { links?: boolean; only?: ServiceSlug[] }) {
  return (
    <ul className="v3-pills" aria-label="What your AI agent does">
      {(only ?? SVC_ORDER).map((slug) => {
        const s = SVC[slug]
        return (
          <li key={slug} className={`v3-c-${s.key}`}>
            {links ? <Link className="v3-pill" href={`/services/${slug}`}>{s.pill}{s.soon && <small className="v3-pill__soon">· early access</small>}</Link> : <span className="v3-pill">{s.pill}{s.soon && <small className="v3-pill__soon">· early access</small>}</span>}
          </li>
        )
      })}
    </ul>
  )
}

/** Footnote marker: a small superscript linking to a note in a <Notes> block on the same page. */
export function NoteRef({ n }: { n: number }) {
  return <sup className="v3-sup"><a href={`#note-${n}`} aria-label={`Note ${n}`}>{n}</a></sup>
}

/** The numbered notes block (page bottom). Each item's anchor is #note-N, N = its position. */
export function Notes({ items, title = "Notes" }: { items: ReactNode[]; title?: string }) {
  return (
    <section className="v3-sec v3-notes" aria-labelledby="v3-notes-h">
      <h2 id="v3-notes-h">{title}</h2>
      <ol>{items.map((t, i) => <li key={i} id={`note-${i + 1}`}>{t}</li>)}</ol>
    </section>
  )
}

/** Soft drifting colour shapes with a few live-status cards. Cards are examples. `mark` replaces
 *  the "Example" chip with a footnote marker (the note itself lives in the page's Notes block). */
export function HeroShapes({ cards = [], tones = ["mk", "ad", "se", "ct"], note = "Example", mark }: { cards?: string[]; tones?: SvcKey[]; note?: string | null; mark?: ReactNode }) {
  const spots: CSSProperties[] = [
    { width: "46%", height: "46%", left: "8%", top: "10%" },
    { width: "34%", height: "34%", right: "6%", top: "4%", animationDelay: "-2s" },
    { width: "40%", height: "40%", right: "12%", bottom: "6%", animationDelay: "-4s" },
    { width: "24%", height: "24%", left: "18%", bottom: "12%", animationDelay: "-1s" },
  ]
  const cardSpots: CSSProperties[] = [
    { left: "22%", top: "36%" },
    { right: "6%", top: "60%", animationDelay: "-3s" },
    { left: "6%", top: "12%", animationDelay: "-1.5s" },
  ]
  return (
    <div className="v3-shapes" aria-hidden={mark ? undefined : true}>
      {spots.map((st, i) => <div key={i} aria-hidden="true" className="v3-sh" style={{ ...st, background: `var(--${tones[i % tones.length]}-2)` }} />)}
      {cards.slice(0, 3).map((c, i) => (
        <div key={c} aria-hidden="true" className={`v3-vcard v3-c-${tones[i % tones.length]}`} style={cardSpots[i]}><span className="v3-dot">✓</span>{c}</div>
      ))}
      {mark && cards.length > 0 ? <div className="v3-shapes__mark">{mark}</div> : note && cards.length > 0 && <div className="v3-shapes__note"><span className="v3-example">{note}</span></div>}
    </div>
  )
}

/** Floating example cards inside a chapter visual. */
export function CardsVisual({ cards, note = "Example", mark }: { cards: string[]; note?: string | null; mark?: ReactNode }) {
  const spots: CSSProperties[] = [
    { left: "8%", top: "14%" },
    { right: "8%", top: "42%", animationDelay: "-2s" },
    { left: "16%", bottom: "14%", animationDelay: "-4s" },
  ]
  return (
    <div className="v3-visual" aria-hidden={mark ? undefined : true}>
      {cards.slice(0, 3).map((c, i) => <div key={c} aria-hidden="true" className="v3-vcard" style={spots[i]}><span className="v3-dot">✓</span>{c}</div>)}
      {mark ? <div className="v3-visual__mark">{mark}</div> : note && <div className="v3-visual__note"><span className="v3-example">{note}</span></div>}
    </div>
  )
}

/** Eyebrow pill with two overlapping tint dots. */
export function Eyebrow({ children, small }: { children: ReactNode; small?: ReactNode }) {
  return (
    <span className="v3-eyebrow"><span className="v3-eyebrow__dots" aria-hidden="true"><i /><i /></span><b>{children}</b>{small && <small>{small}</small>}</span>
  )
}

/** A big rounded colour panel. Text left, visual right (or flipped). */
export function Chapter({ tone, eyebrow, eyebrowNote, a, b, as = "h2", body, points, proof, note, href, hrefLabel = "Learn more", visual, flip, id, children }: {
  tone: SvcKey | "ink"; eyebrow: ReactNode; eyebrowNote?: ReactNode; a: ReactNode; b?: ReactNode; as?: "h2" | "h3"; body?: ReactNode; points?: ReactNode[]
  proof?: { n: string; t: ReactNode }; note?: ReactNode; href?: string; hrefLabel?: string; visual?: ReactNode; flip?: boolean; id?: string; children?: ReactNode
}) {
  const H = as
  return (
    <div id={id} className={cx("v3-chapter", `v3-c-${tone}`, flip && "v3-chapter--flip", !visual && "v3-chapter--solo")}>
      <div>
        <Eyebrow small={eyebrowNote}>{eyebrow}</Eyebrow>
        <H className="v3-h2">{a}{b && <><br /><em>{b}</em></>}</H>
        {body && <p className="v3-chapter__body">{body}</p>}
        {points && <Points items={points} />}
        {proof && <div className="v3-proof"><span className="n">{proof.n}</span><span>{proof.t}</span></div>}
        {children}
        {note && <p className="v3-note">{note}</p>}
        {href && <Link className="v3-more" href={href}>{hrefLabel} ›</Link>}
      </div>
      {visual}
    </div>
  )
}

/** One chapter per service, built from content/services.tsx. */
/** `marks` (homepage): footnote markers instead of the "Example" chip (visual) and the
 *  availability line (note, shown after the body). The notes live in the page's Notes block. */
export function ServiceChapter({ slug, growthNote, flip, visual, as, home, marks }: { slug: ServiceSlug; growthNote?: string; flip?: boolean; visual?: ReactNode; as?: "h2" | "h3"; home?: boolean; marks?: { visual?: ReactNode; note?: ReactNode } }) {
  const sv = SERVICE_BY_SLUG[slug]
  const v = SVC[slug]
  return (
    <Chapter
      tone={v.key}
      eyebrow={v.pill}
      eyebrowNote={sv.plan === "growth" ? (growthNote ?? "Growth plan · early access") : sv.plan === "pro" ? "Pro and Growth plans" : "Every plan, from $99/month"}
      a={home ? v.home.a : v.a}
      b={home ? v.home.b : v.b}
      as={as}
      body={<>{home ? v.home.body : sv.feature.body}{marks?.note}</>}
      points={sv.feature.points}
      proof={v.proof}
      note={sv.plan !== "starter" && !marks?.note ? sv.availability : undefined}
      href={`/services/${slug}`}
      hrefLabel={`Learn more about ${v.pill.toLowerCase().replace("seo & ai", "SEO & AI")}`}
      visual={visual ?? <CardsVisual cards={v.cards} mark={marks?.visual} />}
      flip={flip}
    />
  )
}

export type Tile = { big: ReactNode; small: ReactNode; wide?: boolean; ink?: boolean }
/** Proof mosaic. Only facts that are true and stated elsewhere on the site. */
export function ProofMosaic({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="v3-mosaic">
      {tiles.map((t, i) => (
        <div key={i} className={cx("v3-tile", t.wide && "v3-tile--wide", t.ink && "v3-tile--ink")}>
          <span className="big">{t.big}</span><small>{t.small}</small>
        </div>
      ))}
    </div>
  )
}

/** The black closing panel. */
export function FinalCta({ title, sub, href = "/start", label = "Get started", secondary, children, arrow = "→" }: {
  title: ReactNode; sub?: ReactNode; href?: string; label?: string; secondary?: { href: string; label: string }; children?: ReactNode; arrow?: string
}) {
  return (
    <Section flush>
      <div className="v3-final">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
        <div className="v3-btns" style={{ justifyContent: "center", marginTop: 0 }}>
          {href.startsWith("mailto:") ? <a className="v3-btn" href={href}>{label} {arrow}</a> : <Link className="v3-btn" href={href}>{label} {arrow}</Link>}
          {secondary && <Link className="v3-btn v3-btn--ghost" href={secondary.href}>{secondary.label}</Link>}
        </div>
        {children && <div className="v3-final__extra">{children}</div>}
      </div>
    </Section>
  )
}

/** Simple centred section heading. */
export function Head({ kicker, title, lede, as = "h2", size }: { kicker?: ReactNode; title: ReactNode; lede?: ReactNode; as?: "h1" | "h2"; size?: "sm" | "md" }) {
  const H = as
  const cls = as === "h1" ? cx("v3-h1", size === "md" && "v3-h1--md") : cx("v3-h2", size === "sm" && "v3-h2--sm")
  return (
    <>
      {kicker && <p className="v3-kicker">{kicker}</p>}
      <H className={cls}>{title}</H>
      {lede && <p className="v3-lede">{lede}</p>}
    </>
  )
}

/** FAQ list with native details/summary (no JS). */
export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return <div className="v3-faq">{items.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
}
