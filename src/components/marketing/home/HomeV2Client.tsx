"use client"

// The interactive bits of the homepage: the agent chat demo, the AI-answer switcher, the cost
// table, the looping feature screens, the brand studio and the autopilot switches. Every
// business, number and answer here is an example and is labelled as one on the page.
import { useEffect, useRef, useState } from "react"

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms))
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

// ── Chat demo ───────────────────────────────────────────────────────────────
const STEPS = [
  "Reading your brand: logo, colours and voice",
  "Checking what’s working: searches, visits and AI answers",
  "Looking up what’s happening this week in Austin",
  "Planning your week",
  "Writing the blog post",
  "Writing 2 Google updates",
  "Writing 3 social posts with images",
]
const ITEMS = [
  { kind: "Blog post", day: "Tue", status: "Published", title: "What to do in a dental emergency on a weekend", text: "Most dental emergencies can wait a few hours. Here’s how to tell, and who to call…", why: "“emergency dentist” seen 420 times, you’re just off page one." },
  { kind: "Google update", day: "Thu", status: "Scheduled", title: "Saturday appointments this month", text: "Need a dentist this Saturday? We’re open mornings for check-ups and urgent visits…", why: "AI names another practice for Saturday questions." },
  { kind: "Social post", day: "Fri", status: "Needs your OK", card: "Saturday visits are back", text: "Need a check-up but can’t miss work? Saturday mornings are open again.", why: "your Saturday post last month got the most likes." },
]
type Msg = { id: number; me?: boolean; kind: "hello" | "said" | "steps" | "done"; text?: string; done?: number }

export function ChatDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, kind: "hello" }])
  const [running, setRunning] = useState(false)
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState("Tap the mic or the button")
  const body = useRef<HTMLDivElement>(null)
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight }) }, [msgs])

  async function run(said = "Run my marketing for this week") {
    if (running) return
    setRunning(true)
    setMsgs((m) => [...m, { id: Date.now(), me: true, kind: "said", text: said }])
    await wait(500)
    const sid = Date.now() + 1
    setMsgs((m) => [...m, { id: sid, kind: "steps", done: 0 }])
    for (let i = 1; i <= STEPS.length; i++) {
      await wait(i === 3 ? 1300 : 800)
      setMsgs((m) => m.map((x) => (x.id === sid ? { ...x, done: i } : x)))
    }
    await wait(300)
    setMsgs((m) => [...m, { id: Date.now() + 2, kind: "done" }])
    setRunning(false)
  }

  // The real app listens through the microphone; here the phrase is typed out to show it.
  async function mic() {
    if (running) return
    setListening(true)
    const phrase = "Hey Alphaa, run my marketing for this week"
    for (let i = 1; i <= phrase.length; i++) { setHeard(phrase.slice(0, i)); await wait(32) }
    await wait(400)
    setListening(false)
    setHeard("Tap the mic or the button")
    void run(phrase)
  }

  return (
    <div className="hv-demo" id="demo">
      <div className="hv-chat" aria-live="polite">
        <div className="hv-chat__top"><span className={`hv-dot ${running ? "hv-dot--live" : ""}`} /><b>Bright Smile Dental</b><span style={{ color: "var(--hv-muted)" }}>· {running ? "working" : "working for you"}</span><span className="hv-example">Example</span></div>
        <div className="hv-chat__body" ref={body}>
          {msgs.map((m) => {
            if (m.kind === "hello") return (
              <div key={m.id} className="hv-msg hv-msg--ag"><div className="hv-big">Good morning.</div><p>You got 3 new Google reviews this week. I’ve written the replies. Want me to run this week’s marketing too?</p></div>
            )
            if (m.kind === "said") return <div key={m.id} className="hv-msg hv-msg--me">{m.text}</div>
            if (m.kind === "steps") return (
              <div key={m.id} className="hv-msg hv-msg--ag">
                <div className="hv-big">On it. You run the business, I’ll handle this week’s marketing.</div>
                <ul className="hv-steps">
                  {STEPS.map((s, i) => {
                    const st = i < (m.done ?? 0) ? "done" : i === (m.done ?? 0) ? "doing" : ""
                    return <li key={s} className={st}><i>{st === "done" ? "✓" : ""}</i><span>{s}</span></li>
                  })}
                </ul>
              </div>
            )
            return (
              <div key={m.id} className="hv-msg hv-msg--ag">
                <div className="hv-big">Your marketing for this week is done.</div>
                <p>This week you’ll show up with a blog post, 2 Google updates and 3 social posts, each aimed at customers you’re missing. 2 are already live. 1 just needs your OK.</p>
                <div className="hv-results">
                  {ITEMS.map((it) => (
                    <div key={it.kind} className="hv-res">
                      <div className="hv-res__meta"><span><b>{it.day}</b> · {it.kind}</span><span>{it.status}</span></div>
                      {it.card ? <SocialCard text={it.card} color="#0b3d91" logo="Bright Smile" /> : <h4>{it.title}</h4>}
                      <p>{it.text}</p>
                      <div className="hv-why"><b>Why:</b> {it.why}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="hv-chat__foot">
          <button type="button" className={`hv-mic ${listening ? "on" : ""}`} onClick={mic} aria-label={listening ? "Listening" : "Talk to Alphaa"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 17v5" /></svg>
          </button>
          <span className="hv-heard">{heard}</span>
          <button type="button" className="hv-pill hv-pill--dark hv-pill--sm" onClick={() => run()} disabled={running}>Run my marketing for this week</button>
        </div>
      </div>
    </div>
  )
}

// ── Cost comparison ─────────────────────────────────────────────────────────
const COSTS: [string, number][] = [["Social media management", 1200], ["Ads management", 1000], ["SEO & AEO", 1500], ["Content writing", 800], ["Email marketing", 600], ["Website fixes", 400], ["Analytics & tracking", 300]]
const ALPHAA = 499
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

export function CostTable() {
  const [vals, setVals] = useState(COSTS.map(([, v]) => String(v)))
  const total = vals.reduce((t, v) => t + (Number(v.replace(/[^\d.]/g, "")) || 0), 0)
  return (
    <div className="hv-cost">
      <div className="hv-cost__wrap">
        <table>
          <thead><tr><th>Service</th><th>Agency, per month</th><th>Alphaa</th></tr></thead>
          <tbody>
            {COSTS.map(([name], i) => (
              <tr key={name}>
                <td>{name}</td>
                <td style={{ whiteSpace: "nowrap" }}>$<input type="text" inputMode="numeric" value={vals[i]} aria-label={`Agency monthly cost for ${name}`} onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))} /></td>
                <td><span className="hv-inc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg><span>Included</span></span></td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td>Total</td><td>{money(total)}</td><td>{money(ALPHAA)}</td></tr></tfoot>
        </table>
      </div>
      <div className="hv-save"><span>You keep, every year</span><b>{money(Math.max(0, (total - ALPHAA) * 12))}</b></div>
      <p className="hv-fine">Agency prices are an example quote. Change them to yours. Alphaa price is the Growth plan.</p>
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
  { title: "Run my ads", sub: "Up to $500 a month, never more", on: false, yes: "Your ads keep running and improving, inside your budget.", no: "Got it. I’ll ask before any new campaign." },
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
