"use client"

import { useState } from "react"
import type { AdsData } from "@/lib/workspace/ads"
import { askAlphaa } from "@/lib/workspace/events"
import { Empty, PlanGate, Tabs, useInspector } from "./ui"

type Tab = "r" | "a" | "t"

export function AdsView({ data }: { data: AdsData | null }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useState<Tab>("r")
  const head = (
    <div className="ax-hdr">
      <div><h1 className="ax-h1">Ads</h1><p className="ax-sub">I build, run and tune your ads on Google, Instagram and Facebook, inside the monthly limit you set.</p></div>
      <span className="ax-pill n" style={{ marginTop: 12 }}>Top plan</span>
    </div>
  )
  if (!data) return <>{head}<div style={{ marginTop: 26 }}><PlanGate plan="Growth" title="Ads come with the top plan" text="I build your Google and Meta ads from what your competitors run, keep them inside your limit, and pause what stops working." /></div></>
  const none = !data.metaConnected && !data.googleConnected

  return (
    <>
      {head}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ key: "r", label: "Results" }, { key: "a", label: "Ads running" }, { key: "t", label: "What I changed" }]} />

      {tab === "r" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: 18, marginTop: 22 }} className="ax-adsgrid">
          <section className="ax-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div><b style={{ fontSize: 16 }}>Results · last 30 days</b><div className="ax-t11" style={{ fontSize: 12.5, marginTop: 2 }}>Straight from your ad accounts.</div></div>
            {data.results.length ? data.results.map((r) => (
              <div key={r.platform}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}><b style={{ fontSize: 14 }}>{r.platform}</b>{r.extra && <span className="ax-t11">{r.extra}</span>}</div>
                <div className="ax-g3" style={{ gap: 8 }}>
                  <div className="ax-tile"><div className="k">Spent</div><b style={{ fontSize: 20 }}>{r.spend}</b></div>
                  <div className="ax-tile"><div className="k">{r.platform === "Google Ads" ? "Conversions" : "Leads"}</div><b style={{ fontSize: 20, color: "var(--x-gink)" }}>{r.leads ?? "—"}</b></div>
                  <div className="ax-tile"><div className="k">Per {r.platform === "Google Ads" ? "conversion" : "lead"}</div><b style={{ fontSize: 20 }}>{r.perLead ?? "—"}</b></div>
                </div>
                <div className="ax-t11" style={{ marginTop: 6 }}>{r.clicks} clicks</div>
              </div>
            )) : (
              <p className="ax-p">{none ? "No ad account is connected yet, so there’s nothing to show. Connect Meta or Google Ads and I’ll show real spend and leads here." : "Your accounts are connected, but there are no results to show yet (no campaign I built is live, or the platform didn’t answer just now)."}</p>
            )}
            {none && <div><button className="ax-btn p sm" type="button" onClick={() => askAlphaa({ topic: "ads", label: "Connect my ad accounts" })}>Connect my ad accounts</button></div>}
          </section>
          <section className="ax-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="ax-eb" style={{ color: "#af52de", display: "flex", gap: 6, alignItems: "center" }}><span className="ax-orb" style={{ width: 12, height: 12 }} />Your limit</div>
            <div><b style={{ fontSize: 17 }}>Monthly limit, Google and Meta together</b><div style={{ fontSize: 13, color: "var(--x-mut)", marginTop: 3 }}>I never spend more than this without asking you. Google and Meta bill you directly.</div></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 13, color: "var(--x-mut)" }}>Monthly limit</span><b style={{ fontSize: 30, letterSpacing: "-.03em" }}>{data.budget != null ? data.budget.toLocaleString("en-US") : "Not set"}</b></div>
            <button className={`ax-btn ${data.budget ? "s" : "grad"}`} type="button" style={{ padding: 11 }} onClick={() => askAlphaa({ chip: data.budgetChip })}>{data.budget ? "Change my limit" : "Set my monthly limit"}</button>
            <div style={{ fontSize: 12, color: "var(--x-mut)", textAlign: "center" }}>{data.budget ? "Raising it is your call, so I won’t ask again." : "No limit = I don’t run any ads."}</div>
            {data.plan && (
              <div style={{ borderTop: "1px solid var(--x-line)", paddingTop: 12 }}>
                <div className="ax-eb" style={{ marginBottom: 6 }}>Your ad plan’s split</div>
                {data.plan.split.map((s) => <div key={s.platform} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>{s.platform}</span><b>{s.monthly ?? "—"}</b></div>)}
                <a className="ax-src" href="/dashboard/ad-strategy" style={{ display: "inline-block", marginTop: 8 }}>Open the full plan</a>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === "a" && (
        data.campaigns.length ? (
          <div className="ax-g3" style={{ marginTop: 22 }}>
            {data.campaigns.map((a) => (
              <article key={a.id} className="ax-card hv" style={{ display: "flex", flexDirection: "column" }}>
                <div className={`ax-art${a.image ? " img" : ""}`} style={{ height: 170, background: a.image ? `url("${a.image}") center/cover` : a.art }}>
                  <span className="ax-pill w" style={{ alignSelf: "flex-start" }}>{a.platform}</span>
                  {!a.image && <div><b style={{ fontSize: 20 }}>{a.head}</b></div>}
                </div>
                <div className="ax-cb">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><b style={{ fontSize: 14.5, minWidth: 0 }}>{a.name}</b><span className={`ax-pill ${a.pc}`}>{a.status}</span></div>
                  <p className="ax-p ax-clamp">{a.text}</p>
                  <div className="ax-ft"><span style={{ fontSize: 12.5, color: "var(--x-mut)" }}>{a.daily ?? ""}</span><button className="ax-lnk" type="button" onClick={() => open({ eb: a.platform, title: a.name, rows: [...(a.image ? [{ k: "Image", v: "", image: a.image }] : []), { k: "Status", v: a.status }, { k: "Ad text", v: a.text, box: true }, ...(a.daily ? [{ k: "Budget", v: a.daily }] : [])], cta: { label: "Open it in chat", topic: "ads" } })}>Details</button></div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="No campaigns yet" text={data.plan ? "Your ad plan is ready. Once your ad accounts are connected and your limit is set, I build the first campaign and show it here." : "I start with an ad plan built from what your competitors run, then build the campaigns."} acts={[{ label: data.plan ? "Build my first campaign" : "Make my ad plan", topic: data.plan ? "ads" : "adplan", primary: true }, ...(data.plan ? [{ label: "See the plan", href: "/dashboard/ad-strategy" }] : [])]} /></div>
        )
      )}

      {tab === "t" && (
        data.changes.length ? (
          <section className="ax-card ax-list" style={{ padding: "2px 22px", marginTop: 22 }}>
            {data.changes.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "16px 0", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}><b style={{ fontSize: 14.5 }}>{c.text}</b><div className="ax-t11" style={{ fontSize: 12.5, marginTop: 3 }}>{c.by === "Me" ? "I did this" : "You did this"} · {c.when}</div></div>
                <span className="ax-pill n">{c.platform}</span>
              </div>
            ))}
          </section>
        ) : (
          <div style={{ marginTop: 22 }}><Empty title="No changes yet" text="Every campaign I build, pause or tune shows up here, with an Undo in the chat where one is possible." /></div>
        )
      )}
      {node}
    </>
  )
}
