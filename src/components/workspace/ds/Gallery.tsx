"use client"

// Design system gallery: every shared component in its states, with SAMPLE content only.
// Shown at /dashboard/admin/ds (admins) and /preview?ws=ds (dev). Never linked for owners.
import { useState } from "react"
import {
  Button, PageHeader, SectionHeader, Pill, StatusDot, StatTile, StatRow, List, ListRow, RowIcon, Timeline,
  ChannelBadge, PlatformIcons, EmptyState, Skeleton, Tabs, LinkTabs, useTabParam, Segmented, FilterPills,
  Sheet, ConfirmSheet, useConfirm, Menu, DataTable, Field, TextInput, TextArea, Select, TokenSelect, Sentence, FieldGrid,
  SettingsSection, SaveBar, ConnectionCard, ConnectionRow, PlanCard, PlanGrid, StaleBadge, CodeBlock, IssueList, Glyph, ChannelMark,
} from "./index"
import { toast } from "@/lib/workspace/events"

type Row = { q: string; vol: number | null; pos: number | null; status: "ok" | "warn" | "idle" }
const ROWS: Row[] = [
  { q: "sample query one", vol: 320, pos: 4.2, status: "ok" },
  { q: "sample query two", vol: 140, pos: 11.8, status: "warn" },
  { q: "a much longer sample query that wraps on phones", vol: null, pos: 26.1, status: "idle" },
  { q: "sample query four", vol: 90, pos: null, status: "idle" },
]

const SAMPLE_CODE = Array.from({ length: 18 }, (_, i) => (i === 0 ? '<script type="application/ld+json">' : i === 17 ? "</script>" : `  "sampleKey${i}": "sample value ${i}",`)).join("\n")

function Box({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section className="ax-card xd-gal__box">
      <div className="xd-gal__lbl">{name}</div>
      {children}
    </section>
  )
}

export function DsGallery() {
  const [tab, setTab] = useTabParam(["one", "two", "three", "four", "five", "six"] as const, "one")
  const [seg, setSeg] = useState<"m" | "y">("m")
  const [days, setDays] = useState<"7" | "30">("30")
  const [fp, setFp] = useState("all")
  const [sheet, setSheet] = useState<"side" | "center" | null>(null)
  const [conf, setConf] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [name, setName] = useState("Sample Dental")
  const [metric, setMetric] = useState<"cpl" | "ctr" | "spend">("cpl")
  const [op, setOp] = useState<"over" | "under">("over")
  const [pack, setPack] = useState("120")
  const { confirm, node: confirmNode } = useConfirm()

  return (
    <div className="xd-gal">
      <PageHeader
        title="Design system"
        pill={<Pill tone="info">Admin only</Pill>}
        sub="Every shared workspace component in every state, with sample content."
        meta={<><span>components/workspace/ds</span><span>Usage in CLAUDE.md</span></>}
        actions={<><Button>Secondary</Button><Button variant="primary">Primary action</Button></>}
        tabs={<Tabs value={tab} onChange={setTab} tabs={[{ key: "one", label: "Overview" }, { key: "two", label: "Keywords", count: 49 }, { key: "three", label: "Who links to you" }, { key: "four", label: "Ideas & hooks" }, { key: "five", label: "Blog & page gaps" }, { key: "six", label: "Competitors" }]} />}
      />

      <h2 className="xd-gal__h">Tokens</h2>
      <Box name="--x-fs-xs … --x-fs-2xl · --x-ok/warn/bad/idle · --x-r-sm/md/lg">
        <div className="xd-gal__flex" style={{ alignItems: "baseline" }}>
          {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((k) => <span key={k} style={{ fontSize: `var(--x-fs-${k})`, fontWeight: 600 }}>{k}</span>)}
        </div>
        <div className="xd-gal__flex">
          {(["ok", "warn", "bad", "idle"] as const).map((k) => <span key={k} className="xd-gal__flex" style={{ gap: 6 }}><StatusDot tone={k} />{k}</span>)}
          {(["sm", "md", "lg"] as const).map((k) => <span key={k} style={{ width: 54, height: 36, borderRadius: `var(--x-r-${k})`, background: "var(--x-tint)", border: "1px solid var(--x-line)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{k}</span>)}
        </div>
      </Box>

      <h2 className="xd-gal__h">Buttons and pills</h2>
      <Box name="Button variant=primary|secondary|ghost|undo|grad|danger · size=sm · loading · Pill tone">
        <div className="xd-gal__flex">
          <Button variant="primary">Approve & publish</Button>
          <Button>Edit</Button>
          <Button variant="ghost">Stop</Button>
          <Button variant="undo">Undo</Button>
          <Button variant="grad">Run my week</Button>
          <Button variant="danger">Disconnect</Button>
          <Button variant="primary" loading={busy} onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 1800) }}>{busy ? "Approving" : "Click to load"}</Button>
          <Button size="sm">Small</Button>
          <Button size="sm" variant="primary" loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="xd-gal__flex">
          <Pill tone="ok" dot>Live</Pill><Pill tone="warn">Needs you</Pill><Pill tone="bad">Failed</Pill><Pill tone="info">Recommended</Pill><Pill tone="idle">Draft</Pill>
          <button type="button" className="ax-chip">Chip button</button>
          <button type="button" className="ax-lnk">Text link</button>
        </div>
      </Box>

      <h2 className="xd-gal__h">Headers</h2>
      <Box name="SectionHeader title sub end">
        <SectionHeader first title="Going out soon" sub="Everything scheduled for the next 7 days." end={<button type="button" className="ax-lnk">See the calendar →</button>} />
        <SectionHeader title="No subtitle" end={<Pill tone="info">Pro</Pill>} />
      </Box>

      <h2 className="xd-gal__h">Stats</h2>
      <StatRow>
        <StatTile label="Calls + leads · 30 days" value="42" delta={{ text: "18%", dir: "up" }} hint="vs the 30 days before" />
        <StatTile label="Cost per lead" value="$23.33" delta={{ text: "4%", dir: "down", good: true }} />
        <StatTile label="People reached" value={null} hint="Connect Instagram to see this" />
        <StatTile label="Loading" value={null} ghost />
      </StatRow>
      <div style={{ marginTop: 12 }}><StatRow min={130}><StatTile soft label="Clicks" value="340" /><StatTile soft label="CTR" value="2.1%" delta={{ text: "no change", dir: "flat" }} /><StatTile soft label="Spend" value="$210" onClick={() => toast("Tile clicked")} /></StatRow></div>

      <h2 className="xd-gal__h">Lists and channels</h2>
      <List card label="Sample list">
        <ListRow lead={<ChannelMark channel="instagram" size={36} />} title="Sample post about a first visit" meta={<><PlatformIcons channels={["instagram", "facebook", "linkedin"]} size={16} /><span>Goes out Thu 5:30 PM</span></>} end={<Button size="sm" variant="primary">Approve</Button>} onClick={() => toast("Row opened")} />
        <ListRow lead={<RowIcon><Glyph name="globe" size={18} /></RowIcon>} title="Sample website post" meta="Draft · 1,240 words" href="#" end={<Menu label="More actions for sample post" items={[{ label: "Edit" }, { label: "Duplicate", hint: "Makes a new draft" }, "sep", { label: "Delete", danger: true }]} />} />
        <ListRow thumb="/blog-covers/about-page-for-ai-search.jpg" title="Row with a thumbnail, no click" meta="Published Nov 20" chevron={false} wrapEnd end={<><Button size="sm">Repurpose</Button><Button size="sm" variant="undo">Undo</Button></>} />
      </List>
      <div style={{ marginTop: 12 }}>
        <Box name="ChannelBadge · PlatformIcons">
          <div className="xd-gal__flex">
            {(["facebook", "instagram", "linkedin", "google", "web", "email", "x"] as const).map((c) => <ChannelBadge key={c} channel={c} />)}
          </div>
          <div className="xd-gal__flex"><PlatformIcons channels={["facebook", "instagram", "linkedin"]} /><ChannelBadge channel="google" label="Google listing" size={22} /></div>
        </Box>
      </div>

      <h2 className="xd-gal__h">Timeline</h2>
      <section className="ax-card" style={{ padding: 20 }}>
        <Timeline groups={[
          { day: "Today", items: [
            { id: "1", icon: <ChannelMark channel="facebook" size={20} />, title: "Paused the ad “Sample static B”", why: "It spent 4 days of budget with no lead while the other ad got 3.", when: "9:02 AM", end: <Button size="sm" variant="undo">Undo</Button> },
            { id: "2", icon: <ChannelMark channel="google" size={20} />, title: "Cut 2 search terms that never converted", when: "8:40 AM" },
          ] },
          { day: "Mon", items: [{ id: "3", title: "Checked your rules", why: "Nothing needed changing.", when: "9:00 AM" }] },
        ]} />
      </section>

      <h2 className="xd-gal__h">Empty states</h2>
      <EmptyState title="No ads running yet" text="Once your first ad is on, I check it every day and show what each dollar brought in." bullets={["Spend, clicks and leads per ad", "What I changed and why", "Undo on every change"]} actions={<><Button variant="primary">Prepare my first ads</Button><Button>See the ad plan</Button></>} />
      <div style={{ marginTop: 12 }}>
        <EmptyState hero icon={<Glyph name="link" size={26} />} title="I haven’t checked your links yet" text="I look at who links to you and to your competitors once a month." actions={<Button variant="primary">Check my links now</Button>} chips={<><button type="button" className="ax-chip">Sample preset one</button><button type="button" className="ax-chip">Sample preset two</button></>} />
      </div>

      <h2 className="xd-gal__h">Loading</h2>
      <div className="ax-g2" style={{ marginTop: 0 }}>
        <Skeleton kind="card" />
        <section className="ax-card" style={{ padding: 8 }}><Skeleton kind="row" rows={3} /></section>
      </div>

      <h2 className="xd-gal__h">Controls</h2>
      <Box name="Segmented · FilterPills · LinkTabs · Tabs (?tab= in the URL above)">
        <div className="xd-gal__flex">
          <Segmented label="Billing period" value={seg} onChange={setSeg} options={[{ value: "m", label: "Monthly" }, { value: "y", label: "Yearly · save 15%" }]} />
          <Segmented label="Window" size="sm" value={days} onChange={setDays} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }]} />
        </div>
        <FilterPills label="Channel" value={fp} onChange={setFp} options={[{ value: "all", label: "All", count: 12 }, { value: "ig", label: "Instagram", count: 5, icon: <ChannelMark channel="instagram" size={14} /> }, { value: "fb", label: "Facebook", count: 4, icon: <ChannelMark channel="facebook" size={14} /> }, { value: "li", label: "LinkedIn", count: 3, icon: <ChannelMark channel="linkedin" size={14} /> }]} />
        <FilterPills scroll label="Channel (one row on phones)" value={fp} onChange={setFp} options={[{ value: "all", label: "All" }, { value: "ig", label: "Instagram" }, { value: "fb", label: "Facebook" }, { value: "li", label: "LinkedIn" }, { value: "g", label: "Google listing" }, { value: "w", label: "Website" }]} />
        <LinkTabs active="/dashboard/settings" tabs={[{ href: "/dashboard/settings", label: "Your business" }, { href: "/dashboard/settings/account", label: "Your account" }, { href: "/dashboard/settings/integrations", label: "Google" }, { href: "/dashboard/settings/website", label: "Your website" }, { href: "/dashboard/settings/billing", label: "Plan & billing" }]} />
      </Box>

      <h2 className="xd-gal__h">Sheets, menus, confirm</h2>
      <Box name="Sheet side|center · ConfirmSheet · useConfirm · Menu">
        <div className="xd-gal__flex">
          <Button onClick={() => setSheet("side")}>Open side sheet</Button>
          <Button onClick={() => setSheet("center")}>Open dialog</Button>
          <Button variant="ghost" onClick={() => setConf(true)}>ConfirmSheet</Button>
          <Button onClick={async () => toast((await confirm({ title: "Disconnect sample account?", text: "I stop posting there until you connect it again.", confirmLabel: "Disconnect", danger: true })) ? "Confirmed" : "Cancelled")}>useConfirm()</Button>
          <Menu label="Sample menu" trigger={<>Options <Glyph name="down" size={12} /></>} triggerClassName="ax-btn s sm" align="start" items={[{ label: "Rename" }, { label: "Move to next week", hint: "Keeps the time" }, "sep", { label: "Remove", danger: true }]} />
        </div>
      </Box>
      <Sheet open={sheet === "side"} onClose={() => setSheet(null)} eyebrow="Sample" title="Side sheet title" sub="One line about what this is." footer={<><Button onClick={() => setSheet(null)}>Close</Button><Button variant="primary" onClick={() => { setSheet(null); toast("Done") }}>Primary</Button></>}>
        <p style={{ marginTop: 0 }}>Scrim, Escape, focus trap and focus return. One scroll region. On phones it becomes a bottom sheet.</p>
        <Field label="Sample field" hint="Helper text."><TextInput placeholder="Type here" /></Field>
        {Array.from({ length: 12 }, (_, i) => <p key={i} style={{ color: "var(--x-mut)" }}>Sample paragraph {i + 1} so the body scrolls.</p>)}
      </Sheet>
      <Sheet side="center" open={sheet === "center"} onClose={() => setSheet(null)} title="Dialog title" footer={<><Button onClick={() => setSheet(null)}>Cancel</Button><Button variant="primary" onClick={() => setSheet(null)}>Continue</Button></>}>
        <p style={{ margin: 0, color: "var(--x-mut)" }}>A centred dialog for short decisions.</p>
      </Sheet>
      <ConfirmSheet open={conf} title="Stop this post?" text="It goes back to drafts. Nothing is deleted." confirmLabel="Stop it" danger onConfirm={() => { setConf(false); toast("Stopped") }} onClose={() => setConf(false)} />
      {confirmNode}

      <h2 className="xd-gal__h">Data table</h2>
      <DataTable<Row>
        label="Sample keywords"
        rows={ROWS}
        rowKey={(r) => r.q}
        defaultSort={{ key: "vol", dir: "desc" }}
        stickyFirst
        rowMenu={(r) => [{ label: "Draft it", onClick: () => toast(`Draft: ${r.q}`) }, { label: "Add to topic plan" }]}
        columns={[
          { key: "q", label: "Search", value: (r) => r.q, sortable: true },
          { key: "vol", label: "Searches a month", num: true, sortable: true, value: (r) => r.vol, render: (r) => (r.vol == null ? <span className="ax-t11">Not measured yet</span> : r.vol.toLocaleString("en-US")) },
          { key: "pos", label: "Your place", num: true, sortable: true, value: (r) => r.pos, render: (r) => (r.pos == null ? <span className="ax-t11">Not ranked</span> : `#${Math.round(r.pos)}`) },
          { key: "st", label: "Status", render: (r) => <Pill tone={r.status}>{r.status === "ok" ? "Top 10" : r.status === "warn" ? "Close" : "Far"}</Pill> },
        ]}
      />

      <h2 className="xd-gal__h">Fields and settings</h2>
      <SettingsSection title="Your business" text="What I use in every post, page and answer." footer={<Button variant="primary" onClick={() => toast("Saved")}>Save</Button>}>
        <Field label="Business name"><TextInput value={name} onChange={(e) => { setName(e.target.value); setDirty(true) }} /></Field>
        <Field label="Website" error="That doesn’t look like a web address."><TextInput defaultValue="sample dental" /></Field>
        <FieldGrid min={120}>
          <Field label="City"><TextInput defaultValue="Sampleton" /></Field>
          <Field label="State"><Select defaultValue="on" options={[{ value: "on", label: "Ontario" }, { value: "qc", label: "Quebec" }]} /></Field>
          <Field label="ZIP" optional><TextInput placeholder="K2K 0A1" /></Field>
        </FieldGrid>
        <Field label="Monthly limit" hint="I never spend more than this."><TextInput prefix="$" suffix="/mo" inputMode="numeric" defaultValue="500" /></Field>
        <Field label="About your business" hint="It grows as you type."><TextArea defaultValue="Sample description." onChange={() => setDirty(true)} /></Field>
        <Field label="Disabled"><TextInput disabled value="Can’t change this" readOnly /></Field>
      </SettingsSection>
      <section className="ax-card" style={{ padding: 20, marginTop: 16 }}>
        <Sentence>
          Pause any ad when <TokenSelect label="Metric" value={metric} onChange={setMetric} options={[{ value: "cpl", label: "cost per lead" }, { value: "ctr", label: "click rate" }, { value: "spend", label: "spend" }]} /> is{" "}
          <TokenSelect label="Direction" value={op} onChange={setOp} options={[{ value: "over", label: "over" }, { value: "under", label: "under" }]} /> $40 over the last 7 days.
        </Sentence>
      </section>
      <SaveBar dirty={dirty} onSave={() => { setDirty(false); toast("Saved") }} onDiscard={() => { setName("Sample Dental"); setDirty(false) }} />

      <h2 className="xd-gal__h">Connections</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ConnectionCard logo={<ChannelMark channel="google" size={28} />} name="Google" state="ok" status="Connected as sample@example.com" synced="Last synced 2h ago" action={<Button size="sm">Manage</Button>} onOpen={() => toast("Inspector")} subs={[{ label: "Search Console", value: "example.com" }, { label: "Analytics", value: "Sample property" }, { label: "Google listing", value: "Sample Dental" }]} />
        <ConnectionCard logo={<ChannelMark channel="instagram" size={28} />} name="Instagram" state="warn" status="The login expired. Reconnect once and I carry on." action={<Button size="sm" variant="primary">Reconnect</Button>} />
        <ConnectionCard logo={<ChannelMark channel="web" size={28} />} name="Your website" state="off" status="Not connected yet. I can still write, you copy it in." action={<Button size="sm" variant="primary">Connect</Button>} preview="Once connected, I publish posts and fixes straight to your site." />
        <section className="ax-card" style={{ padding: 6 }}>
          <ConnectionRow logo={<ChannelMark channel="facebook" size={22} />} name="Facebook Page" state="ok" status="Sample Page" />
          <ConnectionRow logo={<ChannelMark channel="linkedin" size={22} />} name="LinkedIn" state="bad" status="Posting failed twice" action={<Button size="sm">Fix</Button>} />
        </section>
      </div>

      <h2 className="xd-gal__h">Plans</h2>
      <div style={{ marginBottom: 14 }}><Segmented label="Billing period" value={seg} onChange={setSeg} options={[{ value: "m", label: "Monthly" }, { value: "y", label: "Yearly · save 15%" }]} /></div>
      <PlanGrid>
        <PlanCard name="Sample A" price={seg === "m" ? "$10" : "$8"} per="/month" text="Sample plan description." features={["Sample feature one", "Sample feature two"]} cta={<Button>Choose Sample A</Button>} current />
        <PlanCard name="Sample B" price={seg === "m" ? "$20" : "$17"} per="/month" was={seg === "y" ? "Sample yearly total" : undefined} recommended includes="Everything in Sample A, plus:" features={["Sample feature three", "Sample feature four", "Sample feature five"]} cta={<Button variant="primary">Choose Sample B</Button>} fine="Sample fine print." />
        <PlanCard name="Sample C" status={<Pill tone="warn">Early access</Pill>} price="$30" per="/month" includes="Everything in Sample B, plus:" features={["Sample feature six"]} cta={<Button>Join early access</Button>} />
      </PlanGrid>
      <div style={{ marginTop: 12 }}>
        <PlanGrid>
          {["50", "120", "300"].map((p) => <PlanCard key={p} selectable selected={pack === p} onSelect={() => setPack(p)} name={`${p} sample credits`} price="$0" per="sample" />)}
        </PlanGrid>
      </div>

      <h2 className="xd-gal__h">Stale data, code, issues</h2>
      <Box name="StaleBadge at scheduleDays onRerun">
        <div className="xd-gal__flex">
          <StaleBadge at={new Date(Date.now() - 40 * 86_400_000).toISOString()} scheduleDays={7} onRerun={() => toast("Re-running")} />
          <StaleBadge at={new Date(Date.now() - 2 * 3_600_000).toISOString()} scheduleDays={7} always />
        </div>
      </Box>
      <div style={{ marginTop: 12 }}>
        <CodeBlock title="Sample code to paste" where="Goes in the <head> of every page. Send it to your web person if you’re not sure." code={SAMPLE_CODE} />
      </div>
      <section className="ax-card" style={{ padding: 8, marginTop: 12 }}>
        <IssueList groups={[
          { key: "a", title: "Pages with no description", why: "Google writes its own snippet, often a worse one.", severity: "warn", urls: ["https://example.com/", "https://example.com/about", "https://example.com/services/sample-one", "https://example.com/services/sample-two"], fix: "I can write a description for each page.", action: <Button size="sm" variant="primary">Write them</Button> },
          { key: "b", title: "Broken links", severity: "bad", urls: ["https://example.com/blog/sample-post"], action: <Button size="sm">Fix the links</Button> },
        ]} />
      </section>
    </div>
  )
}
