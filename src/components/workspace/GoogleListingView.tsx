"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/workspace/events"
import { Button, EmptyState, Field, Glyph, PageHeader, Pill, PlanGate, SectionHeader, Segmented, Sheet, StatRow, StatTile, TextInput, When, useConfirm } from "./ui"
import { GoogleListingConnect } from "./GoogleListingConnect"
import "./detail.css"

// Google listing posts (/dashboard/posts; /dashboard/content-plan redirects here). Drafts waiting for
// the owner's OK first, then what's scheduled, then what went out. Real GbpPost rows only.

export type ListingPost = {
  id: string
  content: string
  type: "UPDATE" | "OFFER" | "EVENT" | string
  status: "draft" | "posted" | "failed" | "scheduled" | string
  createdAt: string
  postedAt: string | null
  scheduledFor: string | null
}

export type ListingData = { connected: boolean; canPost: boolean; posts: ListingPost[] }

const TYPE_LABEL: Record<string, string> = { UPDATE: "Update", OFFER: "Offer", EVENT: "Event" }

function PostCard({ p, onChanged }: { p: ListingPost; onChanged: () => void }) {
  const [busy, setBusy] = useState<"post" | "discard" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { confirm, node } = useConfirm()
  const long = p.content.length > 320

  async function publish() {
    setBusy("post"); setError(null)
    try {
      const res = await fetch(`/api/gbp/posts/${p.id}/publish`, { method: "POST" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error === "No GMB account connected" ? "Your Google listing isn’t connected." : data?.error ?? "Google didn’t accept it this time. Try again in a minute.")
      toast("Posted to your Google listing")
      onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(null) }
  }

  async function discard() {
    if (!(await confirm({ title: "Discard this draft?", text: "It’s removed for good. I’ll write new ones on my usual schedule.", confirmLabel: "Discard", danger: true }))) return
    setBusy("discard")
    try {
      const res = await fetch(`/api/gbp/posts/${p.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("delete")
      toast("Draft discarded")
      onChanged()
    } catch { toast("I couldn’t discard it just now. Try again in a minute.") } finally { setBusy(null) }
  }

  return (
    <article className="xp-post">
      <div className="xp-post__top">
        <Pill tone={p.type === "OFFER" ? "ok" : p.type === "EVENT" ? "info" : "idle"}>{TYPE_LABEL[p.type] ?? "Update"}</Pill>
        {p.status === "failed" && <Pill tone="bad">Didn’t go out</Pill>}
        <span className="sp">
          {p.status === "posted" && p.postedAt ? <When at={p.postedAt} mode="ago" prefix="Posted " fallback="" />
            : p.status === "scheduled" && p.scheduledFor ? <When at={p.scheduledFor} mode="ahead" prefix="Goes out " fallback="" />
            : <When at={p.createdAt} mode="ago" prefix="Written " fallback="" />}
        </span>
      </div>
      <p className={`xp-post__c${open ? " open" : ""}`}>{p.content}</p>
      {long && <div><button type="button" className="ax-lnk" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Show less" : "Read all"}</button></div>}
      {(p.status === "draft" || p.status === "failed") && (
        <div className="xp-row-actions">
          <Button variant="primary" loading={busy === "post"} disabled={busy === "discard"} onClick={publish}>{busy === "post" ? "Posting" : p.status === "failed" ? "Try again" : "Post it to Google"}</Button>
          <Button variant="ghost" loading={busy === "discard"} disabled={busy === "post"} onClick={discard}>Discard</Button>
        </div>
      )}
      {error && <p className="xp-err">{error}</p>}
      {node}
    </article>
  )
}

function WriteSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<"UPDATE" | "OFFER" | "EVENT">("UPDATE")
  const [topic, setTopic] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function write() {
    setBusy(true); setError(null)
    try {
      const res = await fetch("/api/gbp/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postType: type, topic: topic.trim() || undefined }) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? "I couldn’t write it this time. Try again in a minute.")
      toast("Draft ready for your OK")
      setTopic("")
      onDone()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="center"
      title="Write a Google post"
      sub="I write it in your voice. Nothing goes out until you post it."
      footer={<><Button onClick={onClose} disabled={busy}>Cancel</Button><Button variant="primary" loading={busy} onClick={write}>{busy ? "Writing" : "Write it"}</Button></>}
    >
      <div className="xp-stack">
        <div>
          <div className="xp-eng__lbl">Kind of post</div>
          <Segmented label="Kind of post" full value={type} onChange={setType} options={[{ value: "UPDATE", label: "Update" }, { value: "OFFER", label: "Offer" }, { value: "EVENT", label: "Event" }]} />
        </div>
        <Field label="What it’s about" optional hint="Leave it empty and I’ll pick from what’s working for you.">
          <TextInput value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Your new weekend hours" maxLength={160} />
        </Field>
        {error && <p className="xp-err">{error}</p>}
      </div>
    </Sheet>
  )
}

export function GoogleListingView({ data }: { data: ListingData }) {
  const router = useRouter()
  const [writing, setWriting] = useState(false)
  const [month, setMonth] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const { confirm, node } = useConfirm()
  const refresh = () => router.refresh()

  const drafts = data.posts.filter((p) => p.status === "draft")
  const failed = data.posts.filter((p) => p.status === "failed")
  const scheduled = data.posts.filter((p) => p.status === "scheduled").sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))
  const posted = data.posts.filter((p) => p.status === "posted").sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))

  if (!data.connected) {
    const real = drafts[0]
    return (
      <GoogleListingConnect
        title="Google listing posts"
        sub="Fresh posts on your Google listing, so people who find you there see you’re open and active."
        what={["I write up to 4 posts a week in your voice", "You OK each one, or let Autopilot post them", "Offers and events go out on the right day"]}
        preview={real ? <><span className="xp-sample__k">A draft I already wrote for you</span>{real.content.length > 280 ? `${real.content.slice(0, 277)}…` : real.content}</> : undefined}
      />
    )
  }

  const now = new Date()
  const thisMonth = posted.filter((p) => { const d = new Date(p.postedAt!); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length
  const shownPosted = showAll ? posted : posted.slice(0, 6)

  async function writeMonth() {
    if (!(await confirm({ title: "Write a month of posts?", text: "I’ll draft 8 posts: a mix of updates, offers and events. Each one waits for your OK.", confirmLabel: "Write 8 drafts" }))) return
    setMonth(true)
    try {
      const res = await fetch("/api/gbp/generate-month", { method: "POST" })
      const d = await res.json().catch(() => null)
      if (!res.ok) throw new Error(d?.error ?? "")
      toast(d?.note ?? `${d?.count ?? 8} drafts ready for your OK`)
      refresh()
    } catch (e) { toast(e instanceof Error && e.message ? e.message : "I couldn’t write them this time. Try again in a minute.") } finally { setMonth(false) }
  }

  return (
    <>
      <PageHeader
        title="Google listing posts"
        sub="Fresh posts on your Google listing, so people who find you there see you’re open and active."
        actions={data.canPost ? <><Button loading={month} onClick={writeMonth}>{month ? "Writing" : "Write a month"}</Button><Button variant="primary" onClick={() => setWriting(true)}>Write a post</Button></> : undefined}
      />

      {!data.canPost ? (
        <PlanGate plan="Pro" title="Google listing posts come with the Pro plan" text="I write up to 4 posts a week and post them once you say OK." />
      ) : (
        <>
          <StatRow>
            <StatTile label="Posted this month" value={thisMonth} />
            <StatTile label="Waiting for your OK" value={drafts.length} />
            <StatTile label="Scheduled" value={scheduled.length} />
          </StatRow>

          {data.posts.length === 0 && (
            <div className="xp-gap">
              <EmptyState
                icon={<Glyph name="globe" size={22} />}
                title="No posts yet"
                text="I write new ones on my usual schedule, or write one now."
                actions={<Button variant="primary" onClick={() => setWriting(true)}>Write a post</Button>}
              />
            </div>
          )}

          {(drafts.length > 0 || failed.length > 0) && (
            <>
              <SectionHeader title="Waiting for your OK" sub="Read it, then post it or discard it." />
              <div className="xp-stack">{[...failed, ...drafts].map((p) => <PostCard key={p.id} p={p} onChanged={refresh} />)}</div>
            </>
          )}

          {scheduled.length > 0 && (
            <>
              <SectionHeader title="Scheduled" end={<Button size="sm" href="/dashboard/social/calendar">See the calendar</Button>} />
              <div className="xp-stack">{scheduled.map((p) => <PostCard key={p.id} p={p} onChanged={refresh} />)}</div>
            </>
          )}

          {posted.length > 0 && (
            <>
              <SectionHeader title="Posted" end={posted.length > 6 ? <Button size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `Show all ${posted.length}`}</Button> : undefined} />
              <div className="xp-stack">{shownPosted.map((p) => <PostCard key={p.id} p={p} onChanged={refresh} />)}</div>
            </>
          )}
        </>
      )}

      <WriteSheet open={writing} onClose={() => setWriting(false)} onDone={() => { setWriting(false); refresh() }} />
      {node}
    </>
  )
}
