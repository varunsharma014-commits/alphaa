export const dynamic = "force-dynamic"

import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/common/GlassCard"
import { FileText, CheckCircle2, Clock } from "lucide-react"
import { GeneratePostButton } from "./GeneratePostButton"
import { PublishPostButton } from "./PublishPostButton"
import { DeletePostButton } from "./DeletePostButton"

function PostTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    UPDATE: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    OFFER: "bg-green-500/10 border-green-500/20 text-green-400",
    EVENT: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  }
  const labels: Record<string, string> = {
    UPDATE: "Update",
    OFFER: "Offer",
    EVENT: "Event",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-medium ${styles[type] ?? styles.UPDATE}`}
    >
      {labels[type] ?? type}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    posted: "bg-green-500/10 border-green-500/20 text-green-400",
    failed: "bg-red-500/10 border-red-500/20 text-red-400",
    scheduled: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  }
  const labels: Record<string, string> = {
    draft: "Draft",
    posted: "Published",
    failed: "Failed",
    scheduled: "Scheduled",
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {labels[status] ?? status}
    </span>
  )
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

export default async function PostsPage() {
  const { userId: clerkId } = await auth()

  const user = await db.user.findUnique({
    where: { clerkId: clerkId! },
    include: {
      gbpPosts: { orderBy: { createdAt: "desc" } },
    },
  })

  const posts = user?.gbpPosts ?? []
  const totalPosts = posts.length
  const postedCount = posts.filter((p) => p.status === "posted").length
  const draftCount = posts.filter((p) => p.status === "draft").length
  const thisMonthPosted = getThisMonthPosted(posts)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">GBP Posts</h1>
          <p className="text-white/50 text-sm mt-1">
            {totalPosts > 0
              ? `${totalPosts} post${totalPosts !== 1 ? "s" : ""} · ${draftCount} draft${draftCount !== 1 ? "s" : ""} ready`
              : "Manage your Google Business Profile content"}
          </p>
        </div>
        <GeneratePostButton />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {/* Published this month */}
        <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/[0.10] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-green-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <CheckCircle2 className="w-4 h-4 text-green-400 mb-2" />
            <p className="text-3xl font-bold font-mono text-white">{thisMonthPosted}</p>
            <p className="text-white/50 text-xs mt-1">Published this month</p>
          </div>
        </div>

        {/* Drafts ready */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.10] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <Clock className="w-4 h-4 text-amber-400 mb-2" />
            <p className="text-3xl font-bold font-mono text-white">{draftCount}</p>
            <p className="text-white/50 text-xs mt-1">Drafts ready to publish</p>
          </div>
        </div>

        {/* Total posts */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative">
            <FileText className="w-4 h-4 text-white/40 mb-2" />
            <p className="text-3xl font-bold font-mono text-white">{totalPosts}</p>
            <p className="text-white/50 text-xs mt-1">Total posts created</p>
          </div>
        </div>
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#FF6B1A]/20 bg-gradient-to-br from-[#FF6B1A]/[0.08] via-transparent to-transparent p-8">
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#FF6B1A]/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col items-center text-center gap-4 py-8">
            <span className="text-5xl">📍</span>
            <div className="space-y-1.5 max-w-xs">
              <h2 className="text-white font-semibold text-lg">No posts yet</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Generate your first GBP post using the button above. Alphaa will
                create compelling, local content for your Google Business Profile.
              </p>
            </div>
            <GeneratePostButton />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
            >
              {/* Top row: badges + date */}
              <div className="flex items-center gap-2 flex-wrap">
                <PostTypeBadge type={post.postType} />
                <StatusBadge status={post.status} />
                <span className="text-white/30 text-xs ml-auto whitespace-nowrap">
                  {formatDate(post.createdAt)}
                </span>
              </div>

              {/* Content preview */}
              <p className="text-white/80 text-sm leading-relaxed mt-3">
                {post.content.length > 200
                  ? post.content.slice(0, 200) + "…"
                  : post.content}
              </p>

              {/* Bottom actions */}
              {post.status === "draft" && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  <PublishPostButton postId={post.id} />
                  <DeletePostButton postId={post.id} />
                </div>
              )}

              {post.status === "posted" && post.postedAt && (
                <p className="text-white/30 text-xs mt-3 pt-3 border-t border-white/[0.06]">
                  Published {formatDate(post.postedAt)}
                  {post.gmbPostId && (
                    <span className="ml-2 font-mono text-white/20">
                      #{post.gmbPostId.slice(-8)}
                    </span>
                  )}
                </p>
              )}

              {post.status === "failed" && (
                <p className="text-red-400/60 text-xs mt-3 pt-3 border-t border-white/[0.06]">
                  Failed to publish — try deleting and regenerating
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
