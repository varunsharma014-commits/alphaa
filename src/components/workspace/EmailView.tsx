"use client"

import { useEffect } from "react"
import type { EmailData, CampaignCard } from "@/lib/workspace/email"
import { askAlphaa, ISLAND_EVENT } from "@/lib/workspace/events"
import { Button, DataTable, EmptyState, Glyph, List, ListRow, PageHeader, Pill, PlanGate, SectionHeader, Skeleton, Tabs, useInspector, useTabParam } from "./ui"
import "./p3.css"

// Email & Flows: how the monthly note runs (5 steps you can tap), this month's note as the real
// email, the list, and every email with what happened to it. Opens and clicks aren't tracked,
// so they're never shown.

type Tab = "flow" | "list" | "emails"
const TABS = ["flow", "list", "emails"] as const
const tone = (pc: CampaignCard["pc"]) => (pc === "g" ? "ok" : pc === "b" ? "info" : pc === "a" ? "warn" : "idle") as "ok" | "info" | "warn" | "idle"

export function EmailView({ data }: { data: EmailData | null }) {
  const { node, open } = useInspector()
  const [tab, setTab] = useTabParam<Tab>(TABS, "flow")
  useEffect(() => {
    if (!data?.island) return
    const t = window.setTimeout(() => window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: data.island })), 0)
    return () => { window.clearTimeout(t); window.dispatchEvent(new CustomEvent<string | null>(ISLAND_EVENT, { detail: null })) }
  }, [data?.island])

  const sub = "Emails to your own customers, written in your voice. Every send carries your address and an unsubscribe link."
  const pill = <Pill tone="info">Pro</Pill>
  if (!data) {
    return (
      <>
        <PageHeader title="Email & Flows" sub={sub} pill={pill} />
        <PlanGate plan="Pro" title="Email comes with the Pro plan" text="Pro adds email to your past customers, social posts, Google profile posts, review replies and lead tracking." />
      </>
    )
  }

  const sentCount = data.campaigns.filter((c) => c.sent != null).length
  const lastSent = data.campaigns.find((c) => c.sent != null)
  const nodes = [
    { next: data.listSize === 0, k: "Starts with", t: `Your list · ${data.listSize.toLocaleString("en-US")} ${data.listSize === 1 ? "person" : "people"}`, d: data.imports[0] ? `Last added ${data.imports[0].when}` : "Paste or upload your customers", go: () => askAlphaa({ chip: data.chips.add }) },
    { next: data.listSize > 0 && !data.address, k: "I write", t: "One email a month", d: "In your voice, only facts you gave me", go: () => (data.issue ? document.getElementById("issue")?.scrollIntoView({ behavior: "smooth", block: "start" }) : askAlphaa({ chip: data.chips.write })) },
    { next: false, k: data.auto ? "Goes out" : "Waits for", t: data.auto ? "On its own" : "Your OK", d: data.auto ? "Autopilot sends it. Stop it any time" : "Turn on “Send without asking” to skip this", go: () => askAlphaa({ topic: "autopilot", label: "What I send without asking" }) },
    { next: false, k: "Sent", t: lastSent ? `${(lastSent.sent ?? 0).toLocaleString("en-US")} people, ${lastSent.when}` : "Nothing sent yet", d: `${sentCount} email${sentCount === 1 ? "" : "s"} so far`, go: () => setTab("emails") },
    { next: false, k: "Then", t: `${data.optedOut.toLocaleString("en-US")} opted out`, d: "Unsubscribes, bounces and spam reports come off the list for good", go: () => setTab("list") },
  ]

  // The drafted issue is the first row under Emails, even before the list loads it as a campaign.
  const issueRow = data.issue && !data.campaigns.some((c) => c.id === data.issue!.id) ? data.issue : null
  const openCampaign = (c: CampaignCard) => open({ eb: `Email · ${c.status}`, title: c.subject, rows: [{ k: "Preview line", v: c.preview }, { k: "Body", v: c.body.join("\n\n"), box: true }, ...(c.sent != null ? [{ k: "What happened", v: `Sent to ${c.sent.toLocaleString("en-US")}. ${c.bounced} bounced, ${c.complained} marked it as spam.` }] : [])], cta: { label: "Open it in chat", topic: "email" } })

  return (
    <>
      <PageHeader
        title="Email & Flows"
        sub={sub}
        pill={pill}
        meta={data.nextSend ? <span className="ax-t11">Next send allowed {data.nextSend}</span> : undefined}
        tabs={<Tabs<Tab> label="Email sections" value={tab} onChange={setTab} tabs={[{ key: "flow", label: "How it runs" }, { key: "list", label: "Your list", count: data.listSize || undefined }, { key: "emails", label: "Emails", count: (data.campaigns.length + (issueRow ? 1 : 0)) || undefined }]} />}
      />

      {!data.address && (
        <section className="ax-card ax-q x3-top">
          <div className="x3-qb">
            <span className="ax-eb">One question · a new fact</span>
            <p className="t">What’s your business mailing address?</p>
            <p className="s">The law (CAN-SPAM, CASL) needs it at the bottom of every marketing email. Until I have it, I don’t send any email.</p>
          </div>
          <div className="acts"><Button variant="primary" onClick={() => askAlphaa({ chip: data.chips.address })}>Add my address</Button></div>
        </section>
      )}

      {tab === "flow" && (
        <div className="x3-col x3-top">
          <section>
            <SectionHeader first title="The monthly note" sub="Tap any step to change it." />
            <div className="ax-card x3-flow" role="list" aria-label="How the monthly note runs">
              {nodes.map((n, i) => (
                <button key={i} type="button" role="listitem" className={`x3-node${n.next ? " next" : ""}`} onClick={n.go}>
                  <span className="x3-node__n"><i>{i + 1}</i>{n.k}</span>
                  <span className="x3-node__t">{n.t}</span>
                  <span className="x3-node__d">{n.d}</span>
                </button>
              ))}
            </div>
          </section>

          {data.issue ? (
            <section className="ax-card x3-issue" id="issue">
              <div className="x3-issue__h">
                <div>
                  <div className="ax-eb">Issue #{data.issue.number} · {data.issue.subject}</div>
                  <div className="x3-issue__t">{data.listSize ? "This month’s note for your customers." : "The first note I wrote for your customers. Add your list to send it."}</div>
                </div>
                {data.listSize ? <Button variant="primary" onClick={() => askAlphaa({ topic: "email", label: "My email" })}>Review & send</Button> : <Button variant="primary" onClick={() => askAlphaa({ chip: data.chips.add })}>Add my list</Button>}
              </div>
              <iframe title={`Issue #${data.issue.number}`} srcDoc={data.issue.html} sandbox="" loading="lazy" />
            </section>
          ) : data.writingIssue ? (
            <section className="ax-card x3-pad" aria-busy="true">
              <div className="x3-row"><b>I’m writing this month’s note</b><Pill tone="info" dot>Writing</Pill></div>
              <Skeleton kind="line" width="60%" /><Skeleton kind="line" /><Skeleton kind="line" width="80%" />
              <div className="ax-t11">It shows up here in a minute or two.</div>
            </section>
          ) : null}

          <div className="x3-next"><Glyph name="clock" size={16} /><span><b>Next:</b> a welcome email for each new customer, and a win back note for customers you haven’t seen in a while.</span></div>
        </div>
      )}

      {tab === "list" && (
        <div className="x3-col x3-top">
          {data.listSize ? (
            <>
              <DataTable<{ key: string; group: string; people: number; gets: string }>
                label="Your list"
                rowKey={(r) => r.key}
                rows={[
                  { key: "all", group: "Everyone on your list", people: data.listSize, gets: "Monthly note" },
                  { key: "out", group: "Opted out", people: data.optedOut, gets: "Never emailed again" },
                ]}
                columns={[
                  { key: "group", label: "Group", render: (r) => <b>{r.group}</b>, value: (r) => r.group },
                  { key: "people", label: "People", num: true, render: (r) => r.people.toLocaleString("en-US"), value: (r) => r.people },
                  { key: "gets", label: "Gets", render: (r) => <Pill tone={r.key === "all" ? "info" : "idle"}>{r.gets}</Pill>, value: (r) => r.gets },
                ]}
              />
              <div className="x3-acts"><Button variant="primary" onClick={() => askAlphaa({ chip: data.chips.add })}>Add more customers</Button></div>
              {data.imports.length > 0 && (
                <section>
                  <SectionHeader title="What you added" />
                  <List card label="Imports">
                    {data.imports.map((i, k) => <ListRow key={k} lead={<span className="xd-row__ic"><Glyph name="mail" size={16} /></span>} title={i.text} meta={i.when} />)}
                  </List>
                </section>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Glyph name="mail" size={22} />}
              title="Your list is empty"
              text="Paste your customers or upload a CSV in the chat. Only people who bought from you or asked to hear from you."
              bullets={["I check every address and drop duplicates", "Each import keeps a record of their consent", "Anyone who unsubscribes is never emailed again"]}
              actions={<Button variant="primary" onClick={() => askAlphaa({ chip: data.chips.add })}>Add my customers</Button>}
            />
          )}
        </div>
      )}

      {tab === "emails" && (
        <div className="x3-col x3-top">
          {issueRow || data.campaigns.length ? (
            <List card label="Emails">
              {issueRow && (
                <ListRow
                  lead={<span className="xd-row__ic"><Glyph name="mail" size={16} /></span>}
                  title={issueRow.subject}
                  meta={`Issue #${issueRow.number} · ${data.listSize ? "ready for your OK" : "add your list to send it"}`}
                  end={<Pill tone="idle">Draft</Pill>}
                  onClick={() => { setTab("flow"); window.setTimeout(() => document.getElementById("issue")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50) }}
                  wrapEnd
                />
              )}
              {data.campaigns.map((c) => (
                <ListRow
                  key={c.id}
                  lead={<span className="xd-row__ic"><Glyph name="mail" size={16} /></span>}
                  title={c.subject}
                  meta={c.sent != null ? `Sent to ${c.sent.toLocaleString("en-US")} · ${c.bounced} bounced · ${c.complained} spam ${c.complained === 1 ? "report" : "reports"}` : c.preview}
                  end={<Pill tone={tone(c.pc)}>{c.status}</Pill>}
                  onClick={() => openCampaign(c)}
                  wrapEnd
                />
              ))}
            </List>
          ) : data.writingIssue ? (
            <div className="ax-card x3-pad"><Skeleton kind="row" rows={1} /><div className="ax-t11">I’m writing this month’s note. It shows up here in a minute or two.</div></div>
          ) : (
            <EmptyState
              icon={<Glyph name="mail" size={22} />}
              title="No emails yet"
              text="I write one in your voice from what’s new at your business. You see it before it goes out."
              actions={<Button variant="primary" onClick={() => askAlphaa({ chip: data.chips.write })}>Write an email</Button>}
            />
          )}
        </div>
      )}
      {node}
    </>
  )
}
