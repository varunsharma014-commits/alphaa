import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getAllPosts } from "@/content/blog"
import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/article.css"

export const metadata = {
  ...pageMeta({
    title: "Blog: Small Business Marketing, SEO & AI Search (AEO) Guides",
    description:
      "Practical marketing guides for small businesses: getting more customers from Google, AI assistants like ChatGPT, social media, ads and email.",
    path: "/blog",
  }),
  alternates: { canonical: "/blog", types: { "application/rss+xml": "https://alphaa.app/blog/rss.xml" } },
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
    <V3Page>
      <Frame top>
        <Section center>
          <p className="v3-kicker">
            The alphaa blog
          </p>
          <h1 className="v3-h1 v3-h1--md">
            More customers, less{" "}
            <span className="v3-blue">marketing work</span>
          </h1>
          <p className="v3-lede">
            Practical, no-fluff marketing guides for small business owners: Google, AI search,
            social media, ads and email, and how to win customers from each.
          </p>
        </Section>

        <Section flush>
          <div className="bl3-list">
            {posts.map(({ meta }) => (
              <Link key={meta.slug} href={`/blog/${meta.slug}`} className="bl3-post">
                <div className="bl3-post__meta">
                  {meta.tag && <span className="rd3-tag">{meta.tag}</span>}
                  <span>
                    {formatDate(meta.date)} · {meta.readMins} min read
                  </span>
                </div>
                <h2>{meta.title}</h2>
                <p>{meta.description}</p>
                <span className="bl3-post__more">
                  Read guide <ArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </Section>
      </Frame>
    </V3Page>
  )
}
