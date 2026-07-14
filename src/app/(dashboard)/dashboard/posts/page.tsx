export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import Link from "next/link"
import { AlertCircle, Wand2 } from "lucide-react"
import { AutopilotBar } from "@/components/dashboard/AutopilotBar"
import { StatusPill } from "@/components/dashboard/StatusPill"
import { StatBox } from "@/components/dashboard/StatBox"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { DsCard } from "@/components/dashboard/DsCard"
import { GeneratePostButton } from "./GeneratePostButton"
import { PublishPostButton } from "./PublishPostButton"
import { DeletePostButton } from "./DeletePostButton"

const TYPE_LABELS: Record<string, string> = {
  UPDATE: "Update",
  OFFER: "Offer",
  EVENT: "Event",
}

function PostTypeBadge({ type }: { type: string }) {
  const variant = type === "OFFER" ? "found" : type === "EVENT" ? "info" : "neutral"
  return <StatusPill variant={variant}>{TYPE_LABELS[type] ?? type}</StatusPill>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "found" | "warning" | "error" | "info"; label: string }> = {
    draft: { variant: "warning", label: "Draft" },
    posted: { variant: "found", label: "Published" },
    failed: { variant: "error", label: "Failed" },
    scheduled: { variant: "info", label: "Scheduled" },
  }
  const s = map[status] ?? map.draft
  return <StatusPill variant={s.variant}>{s.label}</StatusPill>
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

function getThisMonthPosted(posts: { status: string; postedAt: Date | null }[]) {
  const now = new Date()
  return posts.filter(
    (p) =>
      p.status === "posted" &&
      p.postedAt &&
      new Date(p.postedAt).getMonth() === now.getMonth() &&
      new Date(p.postedAt).getFullYear() === now.getFullYear()
  ).length
}

// alphaa posts every Mon + Thu — work out which comes next.
function getNextPostDay() {
  const now = new Date()
  const day = now.getDay() // 0 Sun .. 6 Sat
  // Monday = 1, Thursday = 4
  if (day < 1 || day > 4) return "Monday"
  if (day < 4) return "Thursday"
  return "Monday"
}

export default async function PostsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: {
      gbpPosts: { orderBy: { createdAt: "desc" } },
      integration: true,
    },
  })

  const posts = user?.gbpPosts ?? []
  const totalPosts = posts.length
  const draftCount = posts.filter((p) => p.status === "draft").length
  const thisMonthPosted = getThisMonthPosted(posts)
  const nextPostDay = getNextPostDay()

  // Connected = Google Business Profile location is linked.
  const gbpConnected = Boolean(user?.integration?.gmbLocationId)

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <AutopilotBar
        message={
          gbpConnected
            ? "alphaa publishes to your Google listing automatically every Monday and Thursday"
            : "Connect your Google listing once and alphaa posts to it automatically from then on"
        }
      />

      {/* Header */}
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
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#ffffff" }}>Google listing</h1>
          <p style={{ fontSize: "13px", color: "#888888", marginTop: "4px", lineHeight: 1.6, maxWidth: "560px" }}>
            alphaa posts to your Google Business Profile automatically — keeping it active so more
            customers find you.
          </p>
        </div>
        {gbpConnected && posts.length > 0 && <GeneratePostButton />}
      </div>

      {!gbpConnected ? (
        // LOUD not-connected banner.
        <DsCard accent="#dc2626" style={{ background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: "10px" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <AlertCircle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                Google Business Profile is not connected yet
              </h2>
              <p style={{ fontSize: "13px", color: "#888888", lineHeight: 1.6, marginTop: "6px", maxWidth: "560px" }}>
                Without this, alphaa cannot post to your listing or monitor reviews. This takes 2
                minutes to set up and unlocks the most important features.
              </p>
              <Link
                href="/dashboard/settings/integrations"
                style={{
                  display: "inline-block",
                  marginTop: "14px",
                  background: "#e05a2b",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Connect Google Business Profile →
              </Link>
            </div>
          </div>
        </DsCard>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
            <StatBox value={thisMonthPosted} label="Published this month" tone="success" />
            <StatBox value={draftCount} label="Drafts ready" tone={draftCount > 0 ? "warning" : "muted"} />
            <StatBox value={totalPosts} label="Total posts" tone="default" />
            <StatBox value={nextPostDay} label="Next post" tone="default" />
          </div>

          {posts.length === 0 ? (
            <DsCard>
              <EmptyState
                icon={Wand2}
                title="alphaa will post for you — every week"
                body="One click and alphaa writes a full month of Google posts in your voice. You never have to log in or write anything."
              >
                <GeneratePostButton />
              </EmptyState>
            </DsCard>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {posts.map((post) => (
                <DsCard key={post.id}>
                  {/* Top row: badges + date */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <PostTypeBadge type={post.postType} />
                    <StatusBadge status={post.status} />
                    <span style={{ fontSize: "11px", color: "#555555", marginLeft: "auto", whiteSpace: "nowrap" }}>
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  {/* Content preview */}
                  <p style={{ fontSize: "13px", color: "#cccccc", lineHeight: 1.6, marginTop: "12px" }}>
                    {post.content.length > 200 ? post.content.slice(0, 200) + "…" : post.content}
                  </p>

                  {/* Draft actions */}
                  {post.status === "draft" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "14px",
                        paddingTop: "14px",
                        borderTop: "1px solid #222222",
                      }}
                    >
                      <PublishPostButton postId={post.id} />
                      <DeletePostButton postId={post.id} />
                    </div>
                  )}

                  {post.status === "posted" && post.postedAt && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#555555",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #222222",
                      }}
                    >
                      Published {formatDate(post.postedAt)}
                    </p>
                  )}

                  {post.status === "scheduled" && post.scheduledFor && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#555555",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #222222",
                      }}
                    >
                      Scheduled for {formatDate(post.scheduledFor)}
                    </p>
                  )}

                  {post.status === "failed" && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#dc2626",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #222222",
                      }}
                    >
                      alphaa couldn&apos;t publish this one — it will retry automatically on the next run.
                    </p>
                  )}
                </DsCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
