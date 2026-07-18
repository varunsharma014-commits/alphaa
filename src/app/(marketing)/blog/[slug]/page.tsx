import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { getAllPosts, getPost } from "@/content/blog"

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.meta.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: "Not found" }
  return {
    title: post.meta.title,
    description: post.meta.description,
    openGraph: { title: post.meta.title, description: post.meta.description, type: "article" },
  }
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const { meta, Body } = post
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.date,
    author: { "@type": "Organization", name: "Alphaa" },
    publisher: { "@type": "Organization", name: "Alphaa", url: "https://alphaa.app" },
    mainEntityOfPage: `https://alphaa.app/blog/${meta.slug}`,
  }

  return (
    <article className="pt-28 pb-24 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All guides
        </Link>

        <div className="flex items-center gap-3 mb-4">
          {meta.tag && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              {meta.tag}
            </span>
          )}
          <span className="text-white/30 text-xs">
            {formatDate(meta.date)} · {meta.readMins} min read
          </span>
        </div>

        <h1 className="text-white text-[34px] sm:text-[48px] lg:text-[52px] font-semibold leading-[1.1] tracking-[-0.02em] mb-8 text-balance">
          {meta.title}
        </h1>

        <Body />
      </div>
    </article>
  )
}
