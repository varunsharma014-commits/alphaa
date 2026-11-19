import Link from "next/link"
import { getAllPosts } from "@/content/blog"
import { AUTHOR, AUTHOR_SCHEMA } from "@/lib/author"
import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section } from "@/components/marketing/v3"
import "@/components/marketing/v3/pages/article.css"

export const metadata = pageMeta({
  title: "Varun Sharma, founder of Alphaa",
  description: AUTHOR.bio,
  path: AUTHOR.path,
  eyebrow: "Author",
})

export default function AuthorPage() {
  const posts = [...getAllPosts()].sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1)).slice(0, 20)
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: { ...AUTHOR_SCHEMA, description: AUTHOR.bio },
  }
  return (
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Frame top>
        <Section center>
          <p className="v3-kicker">Author</p>
          <h1 className="v3-h1 v3-h1--md">
            {AUTHOR.name}
          </h1>
          <p className="v3-lede">{AUTHOR.jobTitle}</p>
        </Section>
        <Section flush>
          <div className="article-prose rd3" style={{ paddingTop: 0 }}>
            <p>{AUTHOR.bio}</p>
            <p>
              <a href={AUTHOR.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn</a> ·{" "}
              <Link href="/about">About Alphaa</Link>
            </p>
            <h2>Recent guides by {AUTHOR.name.split(" ")[0]}</h2>
            <ul className="rd3-list">
              {posts.map((p) => (
                <li key={p.meta.slug}>
                  <Link href={`/blog/${p.meta.slug}`}>{p.meta.title}</Link>
                </li>
              ))}
            </ul>
            <p>
              <Link href="/blog">See all guides →</Link>
            </p>
          </div>
        </Section>
      </Frame>
    </V3Page>
  )
}
