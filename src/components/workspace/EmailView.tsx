"use client"

import { useEffect, useState } from "react"
import type { EmailData } from "@/lib/workspace/email"
import { askAlphaa, ISLAND_EVENT } from "@/lib/workspace/events"
import { Empty, PlanGate, Tabs, useInspector } from "./ui"

type Tab = "f" | "l" | "c"

export function EmailView({ data }: { data: EmailData | null }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useState<Tab>("f")
  useEffect(() => {
    if (!data?.island) return
    const t = window.setTimeout(() => window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: data.island })), 0)
    return () => { window.clearTimeout(t); window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: null })) }
  }, [data?.island])
  const head = (
    <div className="ax-hdr">
      <div><h1 className="ax-h1">Email & Flows</h1><p className="ax-sub">Emails to your own customers, written in your voice. Every send carries your address and an unsubscribe link.</p></div>
      <span className="ax-pill n" style={{ marginTop: 12 }}>Pro plan</span>
    </div>
  )
  if (!data) return <>{head}<div style={{ marginTop: 26 }}><PlanGate plan="Pro" title="Email comes with the Pro plan" text="Pro adds email to your past customers, social posts, Google profile posts, review replies and lead tracking." /></div></>

  const lastSent = data.campaigns.find((c) => c.sent != null)
  const nodes = [
    { next: data.listSize === 0, k: "Starts with", t: `Your list · ${data.listSize.toLocaleString("en-US")} people`, d: data.imports[0] ? `Last added ${data.imports[0].when}` : "Paste or upload your customers", color: "var(--x-blue)", go: () => askAlphaa({ chip: data.chips.add }) },
    { next: data.listSize > 0 && !data.address, k: "I write", t: "One email a month", d: "In your voice. Only facts you gave me.", color: "var(--x-ink)", go: () => askAlphaa({ chip: data.chips.write }) },
    { next: false, k: data.auto ? "Goes out" : "Waits for", t: data.auto ? "On its own (autopilot)" : "Your OK", d: data.auto ? "You can stop it in the chat" : "Turn on “Send without asking” to skip this", color: "#af52de", go: () => askAlphaa({ topic: "autopilot", label: "What I send without asking" }) },
    { next: false, k: "Sent", t: lastSent ? `${(lastSent.sent ?? 0).toLocaleString("en-US")} people, ${lastSent.when}` : "Nothing sent yet", d: `${data.campaigns.filter((c) => c.sent != null).length} email${data.campaigns.filter((c) => c.sent != null).length === 1 ? "" : "s"} so far`, color: "var(--x-gink)", go: () => setTab("c") },
    { next: false, k: "Then", t: `${data.optedOut.toLocaleString("en-US")} opted out`, d: "Unsubscribes, bounces and spam reports come off the list for good", color: "var(--x-mut)", go: () => setTab("l") },
  ]

  return (
    <>
      {head}
      {!data.address && (
        <section className="ax-card ax-q" style={{ marginTop: 22 }}>
          <div style={{ flex: 1, minWidth: 0 }}><span className="ax-eb">One question · a new fact</span><p className="t">What’s your business mailing address?</p><p className="s">The law (CAN-SPAM, CASL) needs it at the bottom of every marketing email. <b style={{ color: "var(--x-ink)", fontWeight: 600 }}>No answer = I don’t send any email.</b></p></div>
          <div className="acts"><button className="ax-btn p" type="button" onClick={() => askAlphaa({ chip: data.chips.address })}>Add my address</button></div>
        </section>
      )}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ key: "f", label: "How it runs" }, { key: "l", label: "Your list" }, { key: "c", label: "Emails" }]} />

      {tab === "f" && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 20, alignItems: "center", flexWrap: "wrap" }}>
            <span className="ax-pill b">Monthly note</span>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--x-mut)", display: "flex", gap: 7, alignItems: "center" }}><span className="ax-dot" />{data.nextSend ? `Next send allowed ${data.nextSend} · tap any step to change it` : "Tap any step to change it"}</span>
          </div>
          <section className="ax-card ax-flow">
            {nodes.map((n, i) => (
              <span key={i} style={{ display: "contents" }}>
                {i > 0 && <span className="ax-link" aria-hidden="true" />}
                <div role="button" tabIndex={0} className={`ax-node${n.next ? " next" : ""}`} style={{ flexGrow: n.next ? 1.6 : 1 }} onClick={n.go} onKeyDown={(e) => { if (e.key === "Enter") n.go() }}>
                  <span className="chev" aria-hidden="true">›</span>
                  <div className="k" style={{ color: n.color }}>{n.k}</div>
                  <div className="t">{n.t}</div>
                  <div className="d">{n.d}</div>
                  {n.next && i === 0 && <button type="button" className="ax-btn p sm" style={{ marginTop: 10, whiteSpace: "normal", textAlign: "left" }} onClick={(e) => { e.stopPropagation(); askAlphaa({ chip: data.chips.add }) }}>+ Import CSV / paste emails</button>}
                </div>
              </span>
            ))}
          </section>
          {data.issue ? (
            <section className="ax-card ax-issue" style={{ marginTop: 18, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid var(--x-line)" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="ax-eb">Issue #{data.issue.number} · {data.issue.subject}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{data.listSize ? "Here’s this month’s note for your customers." : "Here’s the first note I wrote for your customers. Add your list to send it."}</div>
                </div>
                {data.listSize ? <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ topic: "email", label: "My email" })}>Review & send</button> : <button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ chip: data.chips.add })}>+ Add my list</button>}
              </div>
              <iframe title={`Issue #${data.issue.number}`} srcDoc={data.issue.html} sandbox="" loading="lazy" />
            </section>
          ) : data.writingIssue ? (
            <section className="ax-card" style={{ marginTop: 18, padding: "18px 20px", display: "flex", gap: 10, alignItems: "center" }}><span className="ax-dot" />I’m writing this month’s note for your customers. It shows up here in a minute or two.</section>
          ) : null}
          <div className="ax-g2" style={{ marginTop: 18 }}>
            <section className="ax-card ax-soon"><span className="ax-pill n" style={{ alignSelf: "flex-start" }}>Coming soon</span><b style={{ fontSize: 15 }}>Welcome email</b><span className="ax-p">A first note for every new customer you add.</span></section>
            <section className="ax-card ax-soon"><span className="ax-pill n" style={{ alignSelf: "flex-start" }}>Coming soon</span><b style={{ fontSize: 15 }}>Win-back note</b><span className="ax-p">A friendly hello to customers you haven’t seen in a while.</span></section>
          </div>
        </>
      )}

      {tab === "l" && (
        data.listSize ? (
          <section className="ax-card ax-list" style={{ padding: "2px 22px", marginTop: 22 }}>
            <div className="ax-grid4" style={{ padding: "12px 0", fontSize: 12, color: "var(--x-ter)", fontWeight: 600 }}><span>Group</span><span>People</span><span>Gets</span><span /></div>
            <div className="ax-grid4" style={{ padding: "14px 0", fontSize: 14 }}><b>Everyone on your list</b><span>{data.listSize.toLocaleString("en-US")}</span><span className="ax-pill n" style={{ justifySelf: "start" }}>Monthly note</span><button className="ax-lnk" type="button" style={{ justifySelf: "end" }} onClick={() => askAlphaa({ chip: data.chips.add })}>Add more</button></div>
            <div className="ax-grid4" style={{ padding: "14px 0", fontSize: 14 }}><b>Opted out</b><span>{data.optedOut.toLocaleString("en-US")}</span><span className="ax-pill n" style={{ justifySelf: "start" }}>Never emailed again</span><span /></div>
            {data.imports.map((i, k) => <div key={k} style={{ padding: "12px 0", fontSize: 13, color: "var(--x-mut)", display: "flex", justifyContent: "space-between", gap: 12 }}><span>{i.text}</span><span>{i.when}</span></div>)}
          </section>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="Your list is empty" text="Paste your customers or upload a CSV. Only people who bought from you or asked to hear from you." act={{ label: "Add my customers", chip: data.chips.add, primary: true }} /></div>
        )
      )}

      {tab === "c" && (
        data.campaigns.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
            {data.campaigns.map((c) => (
              <article key={c.id} className="ax-card hv" style={{ padding: "20px 22px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><b style={{ fontSize: 16 }}>{c.subject}</b><span className={`ax-pill ${c.pc}`}>{c.status}</span></div>
                  <div style={{ fontSize: 13.5, color: "var(--x-mut)", marginTop: 4 }}>{c.preview}</div>
                </div>
                <div style={{ display: "flex", gap: 22, fontSize: 13, textAlign: "right" }}>
                  <div><div className="ax-t11">Sent to</div><b>{c.sent != null ? c.sent.toLocaleString("en-US") : "—"}</b></div>
                  <div><div className="ax-t11">Bounced</div><b>{c.sent != null ? c.bounced : "—"}</b></div>
                  <div><div className="ax-t11">Spam reports</div><b>{c.sent != null ? c.complained : "—"}</b></div>
                </div>
                <button className="ax-btn s sm" type="button" onClick={() => open({ eb: `Email · ${c.status}`, title: c.subject, rows: [{ k: "Preview line", v: c.preview }, { k: "Body", v: c.body.join("\n\n"), box: true }, ...(c.sent != null ? [{ k: "What happened", v: `Sent to ${c.sent.toLocaleString("en-US")}. ${c.bounced} bounced, ${c.complained} marked it as spam.` }] : [])], cta: { label: "Open it in chat", topic: "email" } })}>Read it</button>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="No emails yet" text="I write one in your voice from what’s new at your business. You see it before it goes out." act={{ label: "Write an email", chip: data.chips.write, primary: true }} /></div>
        )
      )}
      {node}
    </>
  )
}
