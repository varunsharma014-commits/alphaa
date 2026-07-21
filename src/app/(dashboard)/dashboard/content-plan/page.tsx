export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import Link from "next/link"
import { Wand2 } from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatBox } from "@/components/dashboard/StatBox"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { SectionDivider } from "@/components/dashboard/SectionDivider"
import { DsCard } from "@/components/dashboard/DsCard"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { GenerateMonthButton } from "./GenerateMonthButton"

export const metadata = { title: "Content Plan" }

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date))
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(new Date(date))
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(
    new Date(date)
  )
}

type PostStatus = "posted" | "draft" | "failed" | "scheduled"
type PostType = "UPDATE" | "OFFER" | "EVENT"

const STATUS_META: Record<
  PostStatus,
  { label: string; dot: string; variant: "found" | "warning" | "info" | "error" }
> = {
  posted: { label: "Published", dot: "var(--ds-ok)", variant: "found" },
  draft: { label: "Draft", dot: "var(--ds-warn)", variant: "warning" },
  scheduled: { label: "Scheduled", dot: "var(--ds-info)", variant: "info" },
  failed: { label: "Needs attention", dot: "var(--ds-bad)", variant: "error" },
}

const TYPE_META: Record<PostType, { label: string; variant: "info" | "found" | "neutral" }> = {
  UPDATE: { label: "Update", variant: "info" },
  OFFER: { label: "Offer", variant: "found" },
  EVENT: { label: "Event", variant: "neutral" },
}

export default async function ContentPlanPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: { gbpPosts: { orderBy: { createdAt: "desc" } }, integration: true },
  })

  const posts = user?.gbpPosts ?? []
  // Autopilot publishing only works once a Google Business Profile location is linked.
  const gbpConnected = Boolean(user?.integration?.gmbLocationId)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" })

  // Build 4-week grid
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(monthStart)
    start.setDate(1 + i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  })

  // Stats
  const thisMonth = posts.filter((p) => {
    const d = new Date(p.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const publishedCount = thisMonth.filter((p) => p.status === "posted").length
  const draftCount = thisMonth.filter((p) => p.status === "draft").length
  const targetPerMonth = 8
  const progressPct = Math.min(100, Math.round((publishedCount / targetPerMonth) * 100))

  // Next scheduled / upcoming post (first non-published, soonest)
  const upcoming = thisMonth
    .filter((p) => p.status !== "posted" && p.status !== "failed")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]
  const nextPostLabel = upcoming ? formatWeekday(upcoming.createdAt) : "Planned automatically"

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <AutopilotBar message="alphaa auto-generates and posts content — you can review drafts or let it run" />

      {/* ── Header ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ds-text)" }}>Content calendar</h1>
          <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "4px", maxWidth: "560px" }}>
            alphaa plans, writes, and schedules your content — you can approve each post or let it go out
            automatically.
          </p>
          <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "6px" }}>{monthName}</p>
        </div>
        <GenerateMonthButton />
      </div>

      {/* ── Stats row ──────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <StatBox
          value={`${publishedCount} of ${targetPerMonth}`}
          label="Published this month"
          tone="success"
        />
        <StatBox value={draftCount} label="Drafts ready to review" tone={draftCount > 0 ? "warning" : "muted"} />
        <StatBox value={nextPostLabel} label="Next post" tone="default" />
        <StatBox
          value={gbpConnected ? "On" : "Paused"}
          label="Posts on autopilot"
          tone={gbpConnected ? "success" : "warning"}
        />
      </div>

      {/* Honest notice: autopilot can't publish until Google is connected */}
      {!gbpConnected && (
        <DsCard accent="var(--ds-warn)" style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "var(--ds-text)", fontWeight: 500 }}>
            Autopilot is paused — your Google listing isn&apos;t connected yet
          </p>
          <p style={{ fontSize: "12px", color: "var(--ds-text-mute)", lineHeight: 1.6, marginTop: "4px" }}>
            alphaa can write your posts now, but it can&apos;t publish them to Google until your
            listing is connected. It takes about 2 minutes.
          </p>
          <Link
            href="/dashboard/settings/integrations"
            style={{
              display: "inline-block",
              marginTop: "10px",
              background: "var(--ds-accent)",
              color: "var(--ds-text)",
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Connect Google listing →
          </Link>
          <p style={{ fontSize: "12px", color: "var(--ds-text-mute)", marginTop: "10px", lineHeight: 1.6 }}>
            Prefer a human?{" "}
            <Link href="/dashboard/concierge" style={{ color: "var(--ds-accent)", fontWeight: 500 }}>
              We&apos;ll set everything up for you →
            </Link>{" "}
            — a real person, within 2 business days.
          </p>
        </DsCard>
      )}

      {/* ── Progress bar ───────────────────────────────── */}
      <DsCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", color: "var(--ds-text)", fontWeight: 500 }}>
            {publishedCount} of {targetPerMonth} posts published this month
          </span>
          <span style={{ fontSize: "13px", color: "var(--ds-accent)", fontWeight: 500 }}>{progressPct}%</span>
        </div>
        <div style={{ height: "8px", borderRadius: "20px", background: "var(--ds-surface)", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: "20px",
              background: "var(--ds-accent)",
              width: `${progressPct}%`,
              transition: "width 700ms",
            }}
          />
        </div>
        <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "10px", lineHeight: 1.6 }}>
          alphaa keeps publishing for you — about 2 posts per week, no action needed on your part.
        </p>
      </DsCard>

      {/* ── 4-Week Calendar ──────────────────────────── */}
      <SectionDivider>THIS MONTH AT A GLANCE</SectionDivider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
        }}
      >
        {weeks.map((week, i) => {
          const weekPosts = posts.filter((p) => {
            const d = new Date(p.createdAt)
            return d >= week.start && d < week.end
          })
          const postedInWeek = weekPosts.filter((p) => p.status === "posted").length
          const draftInWeek = weekPosts.filter((p) => p.status === "draft").length
          const isCurrentWeek = now >= week.start && now < week.end

          return (
            <div
              key={i}
              style={{
                position: "relative",
                borderRadius: "10px",
                padding: "14px",
                background: isCurrentWeek ? "var(--ds-warn-bg)" : "var(--ds-surface-2)",
                border: isCurrentWeek ? "1px solid var(--ds-accent)" : ".5px solid var(--ds-border)",
              }}
            >
              {isCurrentWeek && (
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    fontSize: "9px",
                    fontWeight: 500,
                    color: "var(--ds-accent)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                  }}
                >
                  Now
                </span>
              )}
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ds-text)" }}>Week {i + 1}</p>
              <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "2px" }}>
                {formatDate(week.start)} – {formatDate(week.end)}
              </p>

              {/* Slot dots */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px" }}>
                {[0, 1].map((slot) => {
                  const post = weekPosts[slot]
                  if (!post)
                    return (
                      <span
                        key={slot}
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "var(--ds-surface)",
                          border: "1px solid var(--ds-border-2)",
                        }}
                      />
                    )
                  const s = STATUS_META[post.status as PostStatus] ?? STATUS_META.draft
                  return (
                    <span
                      key={slot}
                      title={s.label}
                      style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.dot }}
                    />
                  )
                })}
                {weekPosts.length > 2 && (
                  <span style={{ fontSize: "11px", color: "var(--ds-text-faint)" }}>+{weekPosts.length - 2}</span>
                )}
              </div>

              <p style={{ fontSize: "11px", marginTop: "10px", lineHeight: 1.5 }}>
                {weekPosts.length === 0 ? (
                  <span style={{ color: "var(--ds-text-faint)" }}>
                    alphaa will generate posts for this week automatically
                  </span>
                ) : (
                  <>
                    {postedInWeek > 0 && <span style={{ color: "var(--ds-ok)" }}>{postedInWeek} published</span>}
                    {postedInWeek > 0 && draftInWeek > 0 && <span style={{ color: "var(--ds-text-ghost)" }}> · </span>}
                    {draftInWeek > 0 && <span style={{ color: "var(--ds-warn)" }}>{draftInWeek} draft</span>}
                  </>
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { dot: "var(--ds-ok)", label: "Published" },
          { dot: "var(--ds-warn)", label: "Draft" },
          { dot: "var(--ds-info)", label: "Scheduled" },
          { dot: "var(--ds-surface)", label: "Empty slot", border: true },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: l.dot,
                border: l.border ? "1px solid var(--ds-border-2)" : undefined,
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--ds-text-faint)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── All Posts ───────────────────────────── */}
      <SectionDivider>ALL POSTS ({posts.length})</SectionDivider>

      {posts.length === 0 ? (
        <DsCard>
          <EmptyState
            icon={Wand2}
            title="alphaa will handle your content calendar"
            body="Click below and alphaa writes a full month of Google posts tailored to your business. It keeps generating them every month automatically."
          >
            <GenerateMonthButton />
          </EmptyState>
        </DsCard>
      ) : (
        <DsCard style={{ padding: 0, overflow: "hidden" }}>
          {posts.slice(0, 20).map((post, idx) => {
            const s = STATUS_META[post.status as PostStatus] ?? STATUS_META.draft
            const t = TYPE_META[post.postType as PostType] ?? TYPE_META.UPDATE
            return (
              <div
                key={post.id}
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  borderTop: idx === 0 ? undefined : ".5px solid var(--ds-border)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: "6px",
                    background: s.dot,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.6 }}>
                    {post.content.slice(0, 180)}
                    {post.content.length > 180 ? "…" : ""}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--ds-text-faint)", marginTop: "4px" }}>
                    {formatDateLong(post.createdAt)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <StatusPill variant={t.variant}>{t.label}</StatusPill>
                  <StatusPill variant={s.variant}>{s.label}</StatusPill>
                </div>
              </div>
            )
          })}
        </DsCard>
      )}
    </div>
  )
}
