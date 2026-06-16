"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, X, ChevronDown } from "lucide-react"

export function GeneratePostButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [postType, setPostType] = useState("UPDATE")
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/gbp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postType, topic: topic.trim() || undefined }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to generate post")
      }
      setOpen(false)
      setTopic("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light text-fg font-semibold text-sm transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Generate Post
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 w-80 glass-card rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-fg font-medium text-sm">Generate a new post</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-muted hover:text-fg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-muted text-xs mb-1.5 font-medium uppercase tracking-wider">
                Post Type
              </label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full bg-bg-tertiary border border-line/10 rounded-xl px-3 py-2 text-fg text-sm focus:outline-none focus:border-line/20"
              >
                <option value="UPDATE">Update</option>
                <option value="OFFER">Offer</option>
                <option value="EVENT">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-muted text-xs mb-1.5 font-medium uppercase tracking-wider">
                Topic <span className="text-fg/30 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. summer sale, new menu items..."
                className="w-full bg-bg-tertiary border border-line/10 rounded-xl px-3 py-2 text-fg text-sm placeholder:text-fg/30 focus:outline-none focus:border-line/20"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orange-light disabled:opacity-50 disabled:cursor-not-allowed text-fg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-line/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
