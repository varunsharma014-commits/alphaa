import { notFound } from "next/navigation"
import { ServicePage } from "@/components/marketing/home/ServicePage"
import { SERVICES, SERVICE_BY_SLUG, type ServiceSlug } from "@/content/services"
import { pageMeta } from "@/lib/seo"

const SITE = "https://alphaa.app"
const PRICE = { starter: "99", pro: "399", growth: "499" } as const

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
      offers: { "@type": "Offer", price: PRICE[s.plan], priceCurrency: "USD", priceSpecification: { "@type": "UnitPriceSpecification", price: PRICE[s.plan], priceCurrency: "USD", unitText: "MONTH" }, url: `${SITE}/pricing` },
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: s.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/services` },
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
