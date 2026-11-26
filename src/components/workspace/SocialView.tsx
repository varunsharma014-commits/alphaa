"use client"

import { useState } from "react"
import type { SocialData, SocialCard } from "@/lib/workspace/social"
import { askAlphaa, toast } from "@/lib/workspace/events"
import { Empty, PlanGate, Tabs, When, useInspector } from "./ui"

const STATUS: Record<SocialCard["status"], { label: string; pc: string }> = {
  scheduled: { label: "Scheduled", pc: "b" },
  draft: { label: "Waiting for your OK", pc: "a" },
  publishing: { label: "Posting now", pc: "b" },
  published: { label: "Posted", pc: "g" },
  partial: { label: "Posted to some", pc: "a" },
  failed: { label: "Didn’t post", pc: "a" },
}

export function SocialView({ data }: { data: SocialData | null }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useState("All")
  const [over, setOver] = useState<Record<string, SocialCard["status"]>>({})
  const [busy, setBusy] = useState<string | null>(null)

  if (!data) {
    return (
      <>
        <h1 className="ax-h1">Social Studio</h1>
        <p className="ax-sub">I write, design and post to Facebook, Instagram, LinkedIn and TikTok in your voice, with your brand on every image.</p>
        <div style={{ marginTop: 26 }}><PlanGate plan="Pro" title="Social media comes with the Pro plan" text="Pro adds branded posts for your social accounts, posted as each platform allows." /></div>
      </>
    )
  }

  async function act(p: SocialCard, op: "stop" | "undo" | "approve") {
    setBusy(p.id)
    const res = op === "approve"
      ? await fetch("/api/agent/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "approve", id: p.id }) }).catch(() => null)
      : await fetch("/api/workspace/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "social", id: p.id, op }) }).catch(() => null)
    const d = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(null)
    if (!res?.ok) return toast(d?.error ?? "That didn’t save. Try again.")
    setOver((o) => ({ ...o, [p.id]: op === "stop" ? "draft" : "scheduled" }))
    toast(op === "stop" ? "Stopped. It won’t go out." : op === "undo" ? "Back on the schedule" : "Scheduled. It goes out on its own.")
  }

  const tabs = ["All", ...data.tabs]
  const posts = data.posts.filter((p) => tab === "All" || p.nets.includes(tab))

  return (
    <>
      <div className="ax-hdr">
        <div><h1 className="ax-h1">Social Studio</h1><p className="ax-sub">I write and design every post in your voice{data.auto ? " and post it on schedule. Stop anything before it goes out." : ". Autopilot for social is off, so each post waits for your OK."}</p></div>
        <button className="ax-btn s" type="button" style={{ marginTop: 12 }} onClick={() => askAlphaa({ topic: "voice", label: "How my images look" })}>Change how images look</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
        {data.accounts.length ? data.accounts.map((a, i) => <span key={i} className="ax-pill n"><span className="ax-dot still" style={{ width: 6, height: 6 }} />{a.platform} · {a.name}</span>) : <span className="ax-t11" style={{ fontSize: 13 }}>No social accounts connected yet.</span>}
        <button className="ax-lnk" type="button" onClick={() => askAlphaa({ topic: "social", label: "My social accounts" })}>{data.accounts.length ? "Manage accounts" : data.canConnect ? "Connect an account" : "See what’s opening soon"}</button>
      </div>
      {tabs.length > 2 && <Tabs value={tab} onChange={setTab} tabs={tabs.map((t) => ({ key: t, label: t }))} />}

      {posts.length ? (
        <div className="ax-g2">
          {posts.map((p) => {
            const status = over[p.id] ?? p.status
            const s = STATUS[status]
            const future = status === "scheduled" || (status === "draft" && !!over[p.id])
            return (
              <article key={p.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600, minWidth: 0 }}><span className="ax-orb" style={{ width: 18, height: 18 }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nets.join(" & ")}</span></span>
                  <span className={`ax-pill ${over[p.id] === "draft" ? "n" : s.pc}`}>{over[p.id] === "draft" ? "Stopped" : s.label}</span>
                </div>
                <div style={{ height: 220, margin: "0 18px", borderRadius: 18, overflow: "hidden", background: p.image ? `url("${p.image}") center/cover` : "linear-gradient(135deg,#0071e3,#af52de,#ff2d55)", display: "flex", alignItems: "flex-end", padding: 16, color: "#fff" }}>
                  {!p.image && <b style={{ fontSize: 22, letterSpacing: "-.02em", lineHeight: 1.2 }}>{p.title}</b>}
                </div>
                <div className="ax-cb">
                  <p className={`ax-ttl${over[p.id] === "draft" ? " st" : ""}`}>{p.title}</p>
                  <p className="ax-p ax-clamp">{p.text}</p>
                  {p.error && status !== "published" && <p className="ax-p" style={{ color: "var(--x-amber)" }}>{p.error}</p>}
                  <div className="ax-ft">
                    <span style={{ fontSize: 12.5, color: "var(--x-mut)", minWidth: 0 }}>
                      {over[p.id] === "draft" ? "Stopped · won’t go out" : p.verb ? <When at={p.at} mode={p.verb === "Posted " ? "ago" : "ahead"} prefix={p.verb} fallback={p.when} /> : p.when}
                      {p.result && <b style={{ color: "var(--x-gink)", marginLeft: 6 }}>{p.result}</b>}
                    </span>
                    <span style={{ display: "flex", gap: 4, alignItems: "center", flex: "none" }}>
                      {p.links.map((l) => <a key={l.url} className="ax-src" href={l.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 6 }}>{l.label} ↗</a>)}
                      <button className="ax-btn s sm" type="button" onClick={() => open({ eb: `${p.nets.join(" & ")} · ${s.label}`, title: p.title, rows: [...(p.image ? [{ k: "Image", v: "", image: p.image }] : []), { k: "Caption", v: p.text, box: true }, { k: "When", v: p.when }, ...(p.result ? [{ k: "Results the platform reports", v: p.result }] : status === "published" ? [{ k: "Results", v: "This platform doesn’t share post numbers with apps." }] : [])], cta: { label: "Open it in chat", topic: "social" } })}>Preview</button>
                      {future && <button className={`ax-btn d sm${over[p.id] === "draft" ? " undo" : ""}`} type="button" disabled={busy === p.id} onClick={() => void act(p, over[p.id] === "draft" ? "undo" : "stop")}>{over[p.id] === "draft" ? "Undo" : "Stop"}</button>}
                      {status === "draft" && !over[p.id] && p.nets[0] !== "No account yet" && <button className="ax-btn p sm" type="button" disabled={busy === p.id} onClick={() => void act(p, "approve")}>Let it go out</button>}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div style={{ marginTop: 22 }}>
          <Empty
            title="No posts yet"
            text={data.accounts.length ? "Ask me to run your week and I’ll plan, write and design your posts." : "Connect Facebook & Instagram (or LinkedIn) and I’ll plan, write and design your posts."}
            acts={data.accounts.length ? [] : [{ label: "Connect an account", topic: "social", primary: true }]}
          />
          {data.accounts.length > 0 && <div style={{ marginTop: 10 }}><button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ say: "Run my marketing for this week" })}>Run my marketing for this week</button></div>}
        </div>
      )}
      {node}
    </>
  )
}
