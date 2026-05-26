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
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${styles[type] ?? styles.UPDATE}`}
    >
      {type}
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
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${styles[status] ?? styles.draft}`}
    >
      {status}
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-semibold text-2xl">GBP Posts</h1>
          <p className="text-muted text-sm mt-1">
            Manage your Google Business Profile content
          </p>
        </div>
        <GeneratePostButton />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted" />
          </div>
          <p className="text-white text-xl font-semibold font-mono">{totalPosts}</p>
          <p className="text-muted text-xs">Total Posts</p>
        </div>
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted" />
          </div>
          <p className="text-white text-xl font-semibold font-mono">{postedCount}</p>
          <p className="text-muted text-xs">Published</p>
        </div>
        <div className="bg-bg-tertiary rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
          </div>
          <p className="text-white text-xl font-semibold font-mono">{draftCount}</p>
          <p className="text-muted text-xs">Drafts</p>
        </div>
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <GlassCard className="flex flex-col items-center text-center py-12 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-tertiary border border-white/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h2 className="text-white font-semibold">No posts yet</h2>
            <p className="text-muted text-sm">
              Generate your first GBP post using the button above. Alphaa will
              create compelling, local content for your Google Business Profile.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <PostTypeBadge type={post.postType} />
                    <StatusBadge status={post.status} />
                    <span className="text-muted text-xs ml-auto">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {post.content.length > 120
                      ? post.content.slice(0, 120) + "…"
                      : post.content}
                  </p>
                </div>
              </div>

              {post.status === "draft" && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                  <PublishPostButton postId={post.id} />
                  <DeletePostButton postId={post.id} />
                </div>
              )}

              {post.status === "posted" && post.postedAt && (
                <p className="text-muted text-xs mt-3 pt-3 border-t border-white/[0.06]">
                  Published {formatDate(post.postedAt)}
                  {post.gmbPostId && (
                    <span className="ml-2 font-mono text-white/30">
                      #{post.gmbPostId.slice(-8)}
                    </span>
                  )}
                </p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
