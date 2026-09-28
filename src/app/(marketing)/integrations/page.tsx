import Link from "next/link"
import type { Metadata } from "next"
import { INTEGRATIONS } from "@/content/integrations"
import { PlatformIcon } from "@/components/brand/PlatformIcon"

const BASE = "https://alphaa.app"

export const metadata: Metadata = {
  title: { absolute: "Integrations — Alphaa for WordPress, Shopify, Webflow and Wix" },
  description:
    "Alphaa publishes the AI-visibility fixes you approve straight to your website: WordPress (free plugin), Shopify and Webflow (one-click apps). Wix is coming soon. Any other site: Alphaa emails your web person the exact change.",
  alternates: { canonical: "/integrations" },
}

export default function IntegrationsHub() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Alphaa integrations",
      itemListElement: INTEGRATIONS.map((i, n) => ({ "@type": "ListItem", position: n + 1, name: `Alphaa for ${i.name}`, url: `${BASE}/integrations/${i.slug}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Integrations", item: `${BASE}/integrations` },
      ],
    },
  ]
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="ap-sec cmp-hero">
        <h1 className="ap-h2 ap-center cmp-h1">
          Integrations.<br /><span className="ap-quiet">Your site, fixed for you.</span>
        </h1>
        <p className="ap-lead ap-center">
          Connect your website once. Alphaa publishes the FAQ pages, blog posts and page titles you approve, and every change has Undo.
        </p>
      </section>
      <section className="ap-sec ap-sec--grey" style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div className="cmp-grid int-hub">
          {INTEGRATIONS.map((i) => (
            <Link key={i.slug} href={`/integrations/${i.slug}`} className="cmp-tile">
              <div className="int-tile__top">
                <PlatformIcon platform={i.slug} size={40} />
                <em className={`int-badge${i.status === "soon" ? " is-soon" : ""}`}>{i.status === "soon" ? "Coming soon" : i.slug === "wordpress" ? "Free plugin" : "One-click app"}</em>
              </div>
              <h3>{i.name}</h3>
              <p>{i.h1Quiet}</p>
              <span>Learn more →</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="ap-sec">
        <div className="cmp-prose">
          <div>
            <h2>On something else?</h2>
            <p>
              Squarespace, GoDaddy, a custom site: Alphaa still writes every fix. Tap “Email it to my web person” and it sends them the exact change,
              where it goes and how to check it. Their replies come to you. On the Full Service plan, our team makes the changes for you.
            </p>
          </div>
          <div>
            <h2>What every connection has in common</h2>
            <p>
              Nothing goes live until you approve it, unless you turn on auto-publish for blog posts on Pro. Every change has Undo.
              Alphaa never asks for your website password, and it only requests the access it needs to publish content.
            </p>
          </div>
        </div>
      </section>
      <section className="ap-sec ap-sec--grey ap-cta">
        <h2 className="ap-h2">See what AI says about you.</h2>
        <p className="ap-lead">Free. About a minute. Just your website.</p>
        <Link href="/start" className="ap-btn">Scan Your Website – It’s Free</Link>
        <p className="ap-fine">No credit card required.</p>
      </section>
    </>
  )
}
