import Link from "next/link"
import { getAllPosts } from "@/content/blog"
import { AUTHOR, AUTHOR_SCHEMA } from "@/lib/author"
import { pageMeta } from "@/lib/seo"

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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="ap-sec" style={{ paddingTop: 120 }}>
        <p className="ap-lead ap-center" style={{ marginBottom: 8 }}>Author</p>
        <h1 className="ap-h2 ap-center" style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
          {AUTHOR.name}
        </h1>
        <p className="ap-lead ap-center">{AUTHOR.jobTitle}</p>
        <div className="article-prose" style={{ maxWidth: 720, margin: "48px auto 0", padding: "0 22px" }}>
          <p>{AUTHOR.bio}</p>
          <p>
            <a href={AUTHOR.linkedin} target="_blank" rel="noopener noreferrer">Connect on LinkedIn</a> ·{" "}
            <Link href="/about">About Alphaa</Link>
          </p>
          <h2>Recent guides by {AUTHOR.name.split(" ")[0]}</h2>
          <ul>
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
      </section>
    </>
  )
}
