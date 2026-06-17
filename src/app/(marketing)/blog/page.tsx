import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getAllPosts } from "@/content/blog"

export const metadata = {
  title: "Blog — AI Search Optimization (AEO) guides",
  description:
    "Practical guides on getting your business found, cited, and recommended by AI assistants like ChatGPT, Claude, Gemini, and Perplexity.",
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12 text-center">
          <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-3">
            The alphaa blog
          </p>
          <h1 className="text-white text-[34px] sm:text-[44px] font-semibold leading-tight tracking-[-0.02em]">
            Getting found in the age of{" "}
            <span className="serif-italic text-brand-orange">AI search</span>
          </h1>
          <p className="text-white/50 text-base mt-4 max-w-xl mx-auto">
            Practical, no-fluff guides on AI Search Optimization — how AI assistants decide what to
            recommend, and how to make sure it&apos;s you.
          </p>
        </div>

        <div className="space-y-4">
          {posts.map(({ meta }) => (
            <Link
              key={meta.slug}
              href={`/blog/${meta.slug}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-colors p-6 group"
            >
              <div className="flex items-center gap-3 mb-2">
                {meta.tag && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                    {meta.tag}
                  </span>
                )}
                <span className="text-white/30 text-xs">
                  {formatDate(meta.date)} · {meta.readMins} min read
                </span>
              </div>
              <h2 className="text-white text-xl font-semibold leading-snug mb-2 group-hover:text-brand-orange transition-colors">
                {meta.title}
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-3">{meta.description}</p>
              <span className="inline-flex items-center gap-1.5 text-brand-orange text-sm font-medium">
                Read guide <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
