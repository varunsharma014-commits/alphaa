import Link from "next/link"
import { INTEGRATIONS } from "@/content/integrations"
import { PlatformIcon } from "@/components/brand/PlatformIcon"
import { pageMeta } from "@/lib/seo"
import { V3Page, Frame, Section, FinalCta } from "@/components/marketing/v3"

const BASE = "https://alphaa.app"

export const metadata = pageMeta({
  title: "Integrations — Alphaa for WordPress, Shopify, Webflow and Wix",
  absolute: true,
  description:
    "Alphaa publishes the blog posts and website fixes you approve straight to your website: WordPress (free plugin), Shopify and Webflow (one-click apps). Wix is coming soon. Any other site: Alphaa emails your web person the exact change.",
  path: "/integrations",
})

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
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Frame top>
        <Section center>
          <p className="v3-kicker">Integrations</p>
          <h1 className="v3-h1">
            Connections.<br /><span className="v3-blue">Your AI Agent fixes your site for you.</span>
          </h1>
          <p className="v3-lede">
            Connect your website once. Alphaa publishes the FAQ pages, blog posts and page titles you approve, and every change has Undo.
          </p>
        </Section>
        <Section>
          <div className="v3-grid v3-grid--4" style={{ marginTop: 0 }}>
            {INTEGRATIONS.map((i) => (
              <Link key={i.slug} href={`/integrations/${i.slug}`} className="v3-card v3-card--line">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <PlatformIcon platform={i.slug} size={40} />
                  <span className="v3-example" style={i.status === "soon" ? undefined : { color: "var(--v-good)", borderColor: "currentColor" }}>{i.status === "soon" ? "Coming soon" : i.slug === "wordpress" ? "Free plugin" : "One-click app"}</span>
                </div>
                <h2 className="v3-h3" style={{ marginTop: 16 }}>{i.name}</h2>
                <p>{i.h1Quiet}</p>
                <span className="v3-link" style={{ marginTop: "auto", paddingTop: 14 }}>Learn more →</span>
              </Link>
            ))}
          </div>
        </Section>
        <Section>
          <div className="v3-grid v3-grid--2" style={{ marginTop: 0 }}>
            <div className="v3-card">
              <h2 className="v3-h3">On something else?</h2>
              <p>
                Squarespace, GoDaddy, a custom site: Alphaa still writes every fix. Tap “Email it to my web person” and it sends them the exact change,
                where it goes and how to check it. Their replies come to you.
              </p>
            </div>
            <div className="v3-card">
              <h2 className="v3-h3">What every connection has in common</h2>
              <p>
                Nothing goes live until you approve it, unless you turn on auto-publish for blog posts on Pro. Every change has Undo.
                Alphaa never asks for your website password, and it only requests the access it needs to publish content.
              </p>
            </div>
          </div>
        </Section>
        <FinalCta title="Let me check what AI says about you." sub="Free. About a minute. Just your website." label="Check my business — free">
          <p>No credit card required.</p>
        </FinalCta>
      </Frame>
    </V3Page>
  )
}
