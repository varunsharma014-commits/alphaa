"use client"

// The interactive bits of the homepage: the AI-answer switcher, the cost
// table, the looping feature screens, the brand studio and the autopilot switches. Every
// business, number and answer here is an example and is labelled as one on the page.
import { useEffect, useRef, useState } from "react"
import { PLAN_PRICES } from "@/lib/constants"

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
function lum(hex: string): number {
  const n = [1, 3, 5].map((i) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]
}
const inkFor = (hex: string) => (lum(hex) > 0.42 ? "#111111" : "#ffffff")
const logoTile = (hex: string) => (lum(hex) > 0.6 ? { background: "#111", color: "#fff" } : { background: "#fff", color: hex === "#111111" ? "#111" : hex })

function SocialCard({ text, color, logo }: { text: string; color: string; logo: string }) {
  const ink = inkFor(color)
  return (
    <div className="hv-card" style={{ background: color, color: ink }}>
      <div className="hv-card__bar" style={{ background: ink }} />
      <div className="hv-card__h">{text || " "}</div>
      <div className="hv-card__logo" style={logoTile(color)}>{logo}</div>
    </div>
  )
}

// ── Cost comparison ─────────────────────────────────────────────────────────
// Everything listed is in Pro. Ads management is the Growth plan (early access, not live yet), so its row is left out of both totals.
const COSTS: [string, number][] = [["Social media management", 1200], ["SEO & AEO", 1500], ["Content writing", 800], ["Email marketing", 600], ["Website fixes", 400], ["Analytics & tracking", 300]]
const ALPHAA = PLAN_PRICES.pro.monthly
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

export function CostTable() {
  const [vals, setVals] = useState(COSTS.map(([, v]) => String(v)))
  const total = vals.reduce((t, v) => t + (Number(v.replace(/[^\d.]/g, "")) || 0), 0)
  return (
    <div className="hv-cost">
      <div className="hv-cost__wrap">
        <table>
          <thead><tr><th>Service</th><th>Marketing agency, per month</th><th>Your AI agent</th></tr></thead>
          <tbody>
            {COSTS.map(([name], i) => (
              <tr key={name}>
                <td>{name}</td>
                <td style={{ whiteSpace: "nowrap" }}>$<input type="text" inputMode="numeric" value={vals[i]} aria-label={`Agency monthly cost for ${name}`} onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))} /></td>
                <td><span className="hv-inc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg><span>Included</span></span></td>
              </tr>
            ))}
            <tr className="hv-cost__soon">
              <td>Ads management</td>
              <td>Not counted</td>
              <td><span className="hv-soon-tag">Growth · early access</span></td>
            </tr>
          </tbody>
          <tfoot><tr><td>Total</td><td>{money(total)}</td><td>{money(ALPHAA)}</td></tr></tfoot>
        </table>
      </div>
      <div className="hv-save"><span>You keep, every year</span><b>{money(Math.max(0, (total - ALPHAA) * 12))}</b></div>
      <p className="hv-fine">Agency prices are an example quote. Change them to yours. Alphaa price is the Pro plan. Ads management is on the Growth plan (early access) and isn’t counted.</p>
    </div>
  )
}

// ── Looping feature screens ─────────────────────────────────────────────────
export function FeatureVideo({ color, label, scenes }: { color: string; label: string; scenes: React.ReactNode[] }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [pct, setPct] = useState(0)
  const at = useRef(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  useEffect(() => {
    if (reduced()) { setI(scenes.length - 1); setPaused(true); return }
    let raf = 0, last = performance.now()
    const per = 2600
    const tick = (now: number) => {
      if (!pausedRef.current) {
        at.current += now - last
        if (at.current >= per) { at.current = 0; setI((x) => (x + 1) % scenes.length) }
      }
      last = now
      setPct(at.current / per)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [scenes.length])
  return (
    <div className="hv-vid" style={{ ["--c" as string]: color }}>
      <div className="hv-screen">
        <div className="hv-screen__top"><i /><i /><i /><span>{label}</span></div>
        {scenes.map((s, k) => <div key={k} className={`hv-scene ${k === i ? "on" : ""}`} aria-hidden={k !== i}>{s}</div>)}
      </div>
      <div className="hv-vid__ctl">
        <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>{paused ? "▶" : "❚❚"}</button>
        <div className="hv-vid__prog"><span style={{ width: `${((i + pct) / scenes.length) * 100}%` }} /></div>
      </div>
    </div>
  )
}

// ── AI answers ──────────────────────────────────────────────────────────────
const ANSWERS: Record<string, string[]> = {
  ChatGPT: ["Bright Smile Dental", "Barton Family Dental", "Zilker Smiles"],
  Gemini: ["Barton Family Dental", "Bright Smile Dental", "SmileNow"],
  Claude: ["Bright Smile Dental", "Zilker Smiles"],
  Perplexity: ["SmileNow", "Barton Family Dental", "Bright Smile Dental"],
}
export function AiAnswers() {
  const [eng, setEng] = useState("ChatGPT")
  return (
    <div className="hv-answer">
      <div className="hv-chips" role="group" aria-label="AI assistant">
        {Object.keys(ANSWERS).map((e) => <button key={e} type="button" className="hv-chip" aria-pressed={eng === e} onClick={() => setEng(e)}>{e}</button>)}
      </div>
      <p className="hv-answer__q">“Who’s a good family dentist near me that’s open Saturdays?”</p>
      <ol>{ANSWERS[eng].map((n) => <li key={n}>{n === "Bright Smile Dental" ? <mark>{n}</mark> : n}</li>)}</ol>
      <p style={{ marginTop: 14 }}><span className="hv-example">Example answer</span></p>
    </div>
  )
}

// ── Brand studio ────────────────────────────────────────────────────────────
const SWATCHES = ["#0b3d91", "#00a3a1", "#e4572e", "#f2c94c", "#111111"]
const VOICES: Record<string, { label: string; text: string }> = {
  site: { label: "Like your website", text: "Need a check-up but can’t miss work? Saturday mornings are open again at Bright Smile Dental.\nBook online in two minutes." },
  warm: { label: "Warmer", text: "We know weekdays are packed. That’s why Saturday mornings are back, so the whole family can come in together.\nSee you this weekend!" },
  direct: { label: "Straight to the point", text: "Saturday appointments are open.\nCheck-ups and urgent visits, 9 to 1.\nBook online." },
}
export function BrandStudio() {
  const [color, setColor] = useState(SWATCHES[0])
  const [head, setHead] = useState("Saturday visits are back")
  const [voice, setVoice] = useState("site")
  return (
    <div className="hv-studio">
      <SocialCard text={head} color={color} logo="Bright Smile" />
      <div className="hv-ctrl">
        <div><span className="hv-lbl" id="hv-sw">Your brand colour</span>
          <div className="hv-swatches" role="group" aria-labelledby="hv-sw">
            {SWATCHES.map((c) => <button key={c} type="button" className="hv-sw" style={{ background: c }} aria-pressed={color === c} aria-label={`Colour ${c}`} onClick={() => setColor(c)} />)}
          </div>
        </div>
        <div><label className="hv-lbl" htmlFor="hv-head">Headline on the image</label><input id="hv-head" className="hv-txt" maxLength={48} value={head} onChange={(e) => setHead(e.target.value)} /></div>
        <div><span className="hv-lbl" id="hv-voice">Your voice</span>
          <div className="hv-seg" role="group" aria-labelledby="hv-voice">
            {Object.entries(VOICES).map(([k, v]) => <button key={k} type="button" aria-pressed={voice === k} onClick={() => setVoice(k)}>{v.label}</button>)}
          </div>
        </div>
        <div className="hv-caption">{VOICES[voice].text}</div>
      </div>
    </div>
  )
}

// ── Autopilot switches ──────────────────────────────────────────────────────
const SWITCHES = [
  { title: "Post for me", sub: "Blog posts and Google updates go live on their own", on: true, yes: "Done. Your posts go out on time, every week.", no: "Got it. I’ll check with you before each post." },
  { title: "Thank my happy customers", sub: "Replies to 4 and 5 star reviews", on: true, yes: "Every happy customer hears back the same day.", no: "Got it. Every reply waits for you." },
  { title: "Email my customers", sub: "People who said yes to hearing from you", on: false, yes: "Past customers hear from you, without you writing a word.", no: "Got it. I’ll ask before every email." },
]
export function Autopilot() {
  const [on, setOn] = useState(SWITCHES.map((s) => s.on))
  const [said, setSaid] = useState("")
  return (
    <>
      <div className="hv-toggles">
        {SWITCHES.map((s, i) => (
          <div key={s.title} className="hv-tg">
            <div><b>{s.title}</b><span>{s.sub}</span></div>
            <button type="button" role="switch" className="hv-switch" aria-checked={on[i]} aria-label={s.title} onClick={() => { const v = !on[i]; setOn((o) => o.map((x, j) => (j === i ? v : x))); setSaid(v ? s.yes : s.no) }} />
          </div>
        ))}
      </div>
      <p className="hv-saved" aria-live="polite">{said}</p>
    </>
  )
}
