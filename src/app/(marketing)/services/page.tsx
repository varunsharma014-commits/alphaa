import Link from "next/link"
import "@/components/marketing/home/home-v2.css"
import { SERVICES } from "@/content/services"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "AI Marketing Services for Small Businesses",
  description: "One AI agent runs your whole marketing: social media, Google and Meta ads, SEO and AI search, blog posts and email. Month to month, from $99.",
  path: "/services",
})

const SITE = "https://alphaa.app"

export default function ServicesIndex() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Alphaa marketing services",
    itemListElement: SERVICES.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/services/${s.slug}`, name: s.kicker })),
  }
  return (
    <div className="hv">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="hv-hero">
        <div className="hv-wrap">
          <p className="hv-kicker">Services</p>
          <h1 style={{ fontSize: "clamp(40px, 6.6vw, 76px)" }}>Your whole marketing. <span>One AI agent.</span></h1>
          <p className="hv-lede">Stop juggling an agency, a freelancer and five apps. Your AI agent does all of it every week, in your voice, and shows you what’s bringing customers in.</p>
          <div className="hv-svc-grid">
            {SERVICES.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} style={{ ["--c" as string]: s.color }}>
                <small>{s.name}</small>
                <b>{s.h1}</b>
                <p>{s.dream}</p>
                <span className="hv-related__more">See how it works ›</span>
              </Link>
            ))}
          </div>
          <Link className="hv-cta" href="/start">Get started</Link>
          <p className="hv-fine">Month to month. Cancel online in a minute.</p>
        </div>
      </section>
    </div>
  )
}
