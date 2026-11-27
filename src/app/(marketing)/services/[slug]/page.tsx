import { notFound } from "next/navigation"
import { ServicePage } from "@/components/marketing/home/ServicePage"
import { SERVICES, SERVICE_BY_SLUG, type ServiceSlug } from "@/content/services"
import { pageMeta } from "@/lib/seo"
import { planOffer } from "@/lib/seo-offers"

const SITE = "https://alphaa.app"

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = SERVICE_BY_SLUG[(await params).slug as ServiceSlug]
  if (!s) return {}
  return pageMeta({ title: s.metaTitle, description: s.metaDescription, path: `/services/${s.slug}`, eyebrow: s.name })
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const s = SERVICE_BY_SLUG[(await params).slug as ServiceSlug]
  if (!s) notFound()
  const url = `${SITE}/services/${s.slug}`
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: s.kicker,
      serviceType: s.name,
      description: s.metaDescription,
      url,
      provider: { "@type": "Organization", name: "Alphaa", url: SITE },
      areaServed: ["US", "CA"],
      // The cheapest plan that includes this service, monthly and yearly. Ads = Growth, which is
      // PreOrder while it's early access (nobody is charged until ads open).
      offers: planOffer(s.plan),
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Solutions", item: `${SITE}/services` },
        { "@type": "ListItem", position: 3, name: s.name, item: url },
      ],
    },
  ]
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <ServicePage s={s} />
    </>
  )
}
