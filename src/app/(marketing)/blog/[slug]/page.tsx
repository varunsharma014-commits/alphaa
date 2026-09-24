import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { getAllPosts, getPost } from "@/content/blog"
import { extractFaq } from "@/content/blog/faq"
import { CONTENT_REVIEWED } from "@/content/blog/reviewed"

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
    alternates: { canonical: `/blog/${post.meta.slug}` },
    openGraph: { title: post.meta.title, description: post.meta.description, type: "article", url: `https://alphaa.app/blog/${post.meta.slug}` },
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
    dateModified: meta.date > CONTENT_REVIEWED ? meta.date : CONTENT_REVIEWED,
    author: { "@type": "Organization", name: "Alphaa" },
    publisher: { "@type": "Organization", name: "Alphaa", url: "https://alphaa.app" },
    mainEntityOfPage: `https://alphaa.app/blog/${meta.slug}`,
    url: `https://alphaa.app/blog/${meta.slug}`,
    inLanguage: "en",
    isAccessibleForFree: true,
  }
  // Question-phrased H2 + its first paragraph → FAQPage, so AI engines can
  // lift a direct answer per question.
  const faq = extractFaq(meta.slug)
  const faqSchema = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://alphaa.app" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://alphaa.app/blog" },
      { "@type": "ListItem", position: 3, name: meta.title, item: `https://alphaa.app/blog/${meta.slug}` },
    ],
  }

  return (
    <article className="pt-28 pb-24 px-4 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <div className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-muted hover:text-fg text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All guides
        </Link>

        <div className="flex items-center gap-3 mb-4">
          {meta.tag && (
            <span className="text-[10px] font-semibold tracking-[-0.01em] px-2 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
              {meta.tag}
            </span>
          )}
          <span className="text-fg/30 text-xs">
            {formatDate(meta.date)} · {meta.readMins} min read
          </span>
        </div>

        <h1 className="text-fg text-[37.4px] sm:text-[52.8px] lg:text-[57.2px] font-semibold leading-[1.1] tracking-[-0.02em] mb-8 text-balance">
          {meta.title}
        </h1>

        {/* Every post leads to the free check — once near the top, once at the end. */}
        <Link href="/start" className="blog-cta-top">
          Free: see what ChatGPT, Gemini, Claude and Perplexity say about your business <span aria-hidden="true">›</span>
        </Link>

        <Body />

        <aside className="blog-cta" aria-label="Free AI check">
          <p className="blog-cta__eyebrow">Free · 60 seconds</p>
          <h2 className="blog-cta__title">Does AI recommend your business?</h2>
          <p className="blog-cta__text">
            Alphaa asks ChatGPT, Gemini, Claude and Perplexity the question your customers ask, shows you who they named,
            and runs 23 checks on what AI can read on your site.
          </p>
          <Link href="/start" className="blog-cta__btn">Scan Your Website – It’s Free</Link>
          <p className="blog-cta__fine">No credit card required.</p>
        </aside>
      </div>
    </article>
  )
}
