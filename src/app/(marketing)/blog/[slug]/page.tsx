import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { getAllPosts, getPost } from "@/content/blog"
import { extractFaq } from "@/content/blog/faq"
import { CONTENT_REVIEWED } from "@/content/blog/reviewed"

const SITE = "https://alphaa.app"
const abs = (src: string) => (src.startsWith("http") ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`)
const ORG = {
  "@type": "Organization",
  name: "Alphaa",
  url: SITE,
  logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
}
const KIND_SECTION: Record<string, string> = {
  guide: "Guide",
  comparison: "Comparison",
  glossary: "Glossary",
  listicle: "Roundup",
  industry: "Industry guide",
  news: "News",
}

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
  const { meta } = post
  const url = `${SITE}/blog/${meta.slug}`
  const ogImage = meta.image
    ? [{ url: abs(meta.image.src), width: meta.image.width, height: meta.image.height, alt: meta.image.alt }]
    : undefined
  return {
    title: meta.title,
    description: meta.description,
    ...(meta.keyphrase ? { keywords: [meta.keyphrase] } : {}),
    alternates: { canonical: `/blog/${meta.slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      url,
      ...(ogImage
        ? { images: ogImage, publishedTime: meta.date, modifiedTime: meta.updated ?? meta.date, ...(meta.tag ? { section: meta.tag } : {}) }
        : {}),
    },
    ...(ogImage
      ? { twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: [ogImage[0].url] } }
      : {}),
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
  // dateModified: the post's own `updated` date when set, else the blog-wide
  // review date (never earlier than publication).
  const modified = [meta.date, meta.updated ?? CONTENT_REVIEWED].sort().pop()!
  const section = meta.tag ?? (meta.kind ? KIND_SECTION[meta.kind] : undefined)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    ...(meta.subtitle ? { abstract: meta.subtitle } : {}),
    ...(meta.image
      ? { image: { "@type": "ImageObject", url: abs(meta.image.src), width: meta.image.width, height: meta.image.height, caption: meta.image.alt } }
      : {}),
    datePublished: meta.date,
    dateModified: modified,
    author: ORG,
    publisher: ORG,
    ...(meta.keyphrase ? { keywords: meta.keyphrase, about: { "@type": "Thing", name: meta.keyphrase } } : {}),
    ...(section ? { articleSection: section } : {}),
    ...(meta.sources?.length
      ? {
          citation: meta.sources.map((s) => ({
            "@type": "CreativeWork",
            name: s.title,
            url: s.url,
            publisher: { "@type": "Organization", name: s.publisher },
          })),
        }
      : {}),
    mainEntityOfPage: `${SITE}/blog/${meta.slug}`,
    url: `${SITE}/blog/${meta.slug}`,
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

        <h1
          className={`text-fg text-[37.4px] sm:text-[52.8px] lg:text-[57.2px] font-semibold leading-[1.1] tracking-[-0.02em] text-balance ${meta.subtitle || meta.updated ? "mb-4" : "mb-8"}`}
        >
          {meta.title}
        </h1>

        {meta.subtitle && <p className="blog-subtitle">{meta.subtitle}</p>}

        {meta.updated && meta.updated > meta.date && (
          <p className="blog-updated">
            Updated <time dateTime={meta.updated}>{formatDate(meta.updated)}</time>
          </p>
        )}

        {meta.image && (
          <figure className="blog-hero">
            <Image
              src={meta.image.src}
              alt={meta.image.alt}
              width={meta.image.width}
              height={meta.image.height}
              priority
              sizes="(min-width: 720px) 672px, calc(100vw - 32px)"
            />
          </figure>
        )}

        {meta.takeaways && meta.takeaways.length > 0 && (
          <aside className="blog-takeaways" aria-labelledby="key-takeaways">
            <h2 id="key-takeaways" className="blog-takeaways__title">Key takeaways</h2>
            <ul>
              {meta.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </aside>
        )}

        {/* Every post leads to the free check — once near the top, once at the end. */}
        <Link href="/start" className="blog-cta-top">
          Free: see what ChatGPT, Gemini, Claude and Perplexity say about your business <span aria-hidden="true">›</span>
        </Link>

        <Body />

        {meta.sources && meta.sources.length > 0 && (
          <section className="blog-sources" aria-labelledby="sources">
            <h2 id="sources" className="blog-sources__title">Sources</h2>
            <ol>
              {meta.sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noopener">
                    {src.title}
                  </a>
                  <span className="blog-sources__pub"> — {src.publisher}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

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
