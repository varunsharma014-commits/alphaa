"use client"

import { useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/workspace/events"
import { Button, EmptyState, Glyph, PageHeader, Pill, PlanGate, SectionHeader, StatRow, StatTile, TextArea, When } from "./ui"
import { GoogleListingConnect } from "./GoogleListingConnect"
import "./detail.css"

// Google reviews: rating up top, then every review that still needs a reply with my draft right
// there (Post / Edit), then the ones already answered. Nothing is posted until the owner taps Post.

export type ReviewItem = {
  id: string
  author: string
  rating: number
  comment: string | null
  at: string
  reply: string | null
  /** The reply I wrote overnight (review-drafts cron), if there is one. */
  draft: string | null
}

export type ReviewsData = {
  connected: boolean
  canReply: boolean
  location: string | null
  reviews: ReviewItem[]
}

function Stars({ n }: { n: number }) {
  return <span className="xp-stars" role="img" aria-label={`${n} out of 5 stars`}>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= n ? undefined : "off"}>★</span>)}</span>
}

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?"

function ReviewHead({ r }: { r: ReviewItem }) {
  return (
    <div className="xp-rev__top">
      <span className="xp-av" aria-hidden="true">{initials(r.author)}</span>
      <div className="xp-rev__who"><div className="xp-rev__n">{r.author}</div><Stars n={r.rating} /></div>
      <span className="xp-rev__when"><When at={r.at} mode="ago" fallback="" /></span>
    </div>
  )
}

function ReplyBox({ r, onPosted }: { r: ReviewItem; onPosted: (text: string) => void }) {
  const [text, setText] = useState(r.draft ?? "")
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState<"write" | "post" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function call(body: object): Promise<{ reply?: string; success?: boolean; error?: string; review?: boolean; message?: string } | null> {
    const res = await fetch(`/api/gbp/reviews/${r.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error ?? "That didn’t work this time. Try again in a minute.")
    return data
  }

  async function write() {
    setBusy("write"); setError(null)
    try {
      const d = await call({ action: "generate" })
      if (!d?.reply) throw new Error("I couldn’t write a reply this time. Try again in a minute.")
      setText(d.reply); setEditing(false)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(null) }
  }

  async function post() {
    const t = text.trim()
    if (!t) return
    setBusy("post"); setError(null)
    try {
      const d = await call({ action: "post", text: t })
      if (d?.review) { toast(d.message ?? "Sent for review."); return }
      toast("Reply posted to your Google listing")
      onPosted(t)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(null) }
  }

  if (!text && !editing) {
    return (
      <div className="xp-row-actions">
        <Button variant="primary" loading={busy === "write"} onClick={write}>{busy === "write" ? "Writing" : "Write a reply"}</Button>
        <Button variant="ghost" onClick={() => setEditing(true)} disabled={!!busy}>Write it myself</Button>
        {error && <span className="xp-err">{error}</span>}
      </div>
    )
  }

  return (
    <div className="xp-stack">
      {editing ? (
        <TextArea value={text} onChange={(e) => setText(e.target.value)} aria-label={`Reply to ${r.author}`} disabled={busy === "post"} autoFocus />
      ) : (
        <div className="xp-reply"><div className="xp-reply__k">My reply · nothing is posted until you tap Post</div><p>{text}</p></div>
      )}
      <div className="xp-row-actions">
        <Button variant="primary" loading={busy === "post"} disabled={!text.trim() || busy === "write"} onClick={post}>{busy === "post" ? "Posting" : "Post reply"}</Button>
        {editing ? <Button onClick={() => setEditing(false)} disabled={!!busy || !text.trim()}>Done editing</Button> : <Button onClick={() => setEditing(true)} disabled={!!busy}>Edit</Button>}
        <Button variant="undo" loading={busy === "write"} disabled={busy === "post"} onClick={write}>Write another</Button>
      </div>
      {error && <p className="xp-err">{error}</p>}
    </div>
  )
}

export function ReviewsView({ data, action }: { data: ReviewsData; action?: ReactNode }) {
  const router = useRouter()
  const [posted, setPosted] = useState<Record<string, string>>({})
  const [showAll, setShowAll] = useState(false)

  if (!data.connected) {
    return (
      <GoogleListingConnect
        title="Reviews"
        sub="Your Google reviews in one place, with a reply ready for each one."
        what={["I bring in every new Google review each day", "I write a warm reply for you to read, edit and post", "Your rating and reply rate, week by week"]}
      />
    )
  }

  const reviews = data.reviews.map((r) => (posted[r.id] ? { ...r, reply: posted[r.id] } : r))
  const needs = reviews.filter((r) => !r.reply)
  const done = reviews.filter((r) => r.reply)
  const total = reviews.length
  const avg = total ? reviews.reduce((a, r) => a + r.rating, 0) / total : null
  const week = Date.now() - 7 * 86_400_000
  const fresh = reviews.filter((r) => new Date(r.at).getTime() >= week).length
  const shownDone = showAll ? done : done.slice(0, 5)

  return (
    <>
      <PageHeader title="Reviews" sub="Every Google review, with a reply ready for the ones you haven’t answered." meta={data.location ? <span>{data.location}</span> : undefined} actions={action} />

      {total === 0 ? (
        <EmptyState hero icon={<Glyph name="inbox" size={26} />} title="No Google reviews yet" text="I check for new ones every day and write a reply as soon as one comes in." actions={action} />
      ) : (
        <>
          <StatRow>
            <StatTile label="Google rating" value={avg != null ? `${avg.toFixed(1)} ★` : null} hint={`From ${total} review${total === 1 ? "" : "s"}`} />
            <StatTile label="Replied" value={`${done.length} of ${total}`} />
            <StatTile label="New this week" value={fresh} />
          </StatRow>

          <SectionHeader title="Needs a reply" sub={needs.length ? undefined : "You’re all caught up."} end={needs.length ? <Pill tone="warn">{needs.length} waiting</Pill> : <Pill tone="ok" dot>All answered</Pill>} />
          {needs.length > 0 && !data.canReply && <PlanGate plan="Pro" title="Replies come with the Pro plan" text="I write a reply for every review and post it once you say OK." />}
          {needs.length > 0 && (
            <div className="xp-stack">
              {needs.map((r) => (
                <article key={r.id} className="xp-rev">
                  <ReviewHead r={r} />
                  {r.comment ? <p className="xp-rev__c">{r.comment}</p> : <p className="ax-p">No written comment, only a rating.</p>}
                  {data.canReply && <ReplyBox r={r} onPosted={(t) => { setPosted((p) => ({ ...p, [r.id]: t })); router.refresh() }} />}
                </article>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <>
              <SectionHeader title="Answered" end={done.length > 5 ? <Button size="sm" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `Show all ${done.length}`}</Button> : undefined} />
              <div className="xp-stack">
                {shownDone.map((r) => (
                  <article key={r.id} className="xp-rev">
                    <ReviewHead r={r} />
                    {r.comment && <p className="xp-rev__c">{r.comment}</p>}
                    <div className="xp-reply ok"><div className="xp-reply__k">Your reply</div><p>{r.reply}</p></div>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
