export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { pageTitle } from "@/lib/page-title"
import { trustedSchemas } from "@/lib/schema-generator"
import { generateLlmsTxt } from "@/lib/llms-txt"
import { getAgentSettings } from "@/lib/agent/settings"
import { installOption } from "@/lib/seo/site-vitals"
import { VaultView, type MissingFact, type VaultData } from "@/components/workspace/VaultView"
import { PlatformPicker } from "./PlatformPicker"

export const metadata = { title: pageTitle("What AI reads about you") }

// Schema types that describe the actual business (or its answers) — the ones
// that matter for an AI engine describing you. Matching is case-insensitive and
// covers the specific LocalBusiness subtypes our generator emits (Dentist,
// Plumber, Restaurant, …) via the suffix/keyword checks below.
const BUSINESS_TYPE_PLAIN: Record<string, string> = {
  localbusiness: "your business name, address and phone",
  organization: "your business name and details",
  faqpage: "your questions and answers",
  qapage: "your questions and answers",
  service: "the services you offer",
  product: "the products you sell",
  restaurant: "your restaurant details",
  menu: "your menu",
  menusection: "your menu",
  dentist: "your practice details",
  physician: "your practice details",
  medicalbusiness: "your practice details",
  legalservice: "your practice details",
  professionalservice: "your business details",
  homeandconstructionbusiness: "your business details",
  beautysalon: "your salon details",
  store: "your store details",
  review: "your reviews",
  aggregaterating: "your star rating",
  postaladdress: "your address",
  openinghoursspecification: "your opening hours",
  breadcrumblist: "how your pages link together",
  website: "your website name",
  webpage: "your page details",
  article: "your articles",
  blogposting: "your blog posts",
  person: "the people behind your business",
}

const NON_BUSINESS = new Set(["breadcrumblist", "website", "webpage", "article", "blogposting"])

function isBusinessType(type: string): boolean {
  const t = type.toLowerCase()
  if (NON_BUSINESS.has(t)) return false
  if (BUSINESS_TYPE_PLAIN[t]) return true
  // Unknown types that still look like a business/answer entity.
  return (
    t.endsWith("business") ||
    t.endsWith("service") ||
    t.endsWith("store") ||
    t.endsWith("shop") ||
    t.includes("faq")
  )
}

function plainName(type: string): string {
  return BUSINESS_TYPE_PLAIN[type.toLowerCase()] ?? `your ${type.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} details`
}

const BLOCK_TITLE: Record<string, string> = { website: "Your website name", faqpage: "Questions and answers from your site", organization: "Your business details", localbusiness: "Your business name, address and phone" }
const blockTitle = (type: string) => BLOCK_TITLE[type.toLowerCase()] ?? (isBusinessType(type) ? "Your business name, address and phone" : plainName(type).replace(/^your/, "Your"))

const PICKER: Record<string, string> = { wordpress: "wordpress", shopify: "shopify", webflow: "webflow", wix: "wix", squarespace: "squarespace" }

export default async function VaultPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/login")
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect("/login")

  const [latestSchema, latestCrawl, settings] = await Promise.all([
    db.schemaMarkup.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } }),
    db.crawlResult.findFirst({ where: { userId: user.id }, orderBy: { crawledAt: "desc" } }),
    getAgentSettings(user.id),
  ])
  // Only blocks built from real facts. Older AI-made records (invented FAQ answers, "My Business")
  // are never shown or served again (trustedSchemas).
  const schemas = trustedSchemas(latestSchema?.schemas)
  const hadOld = !!latestSchema && Array.isArray(latestSchema.schemas) && (latestSchema.schemas as unknown[]).length > 0 && !schemas.length

  // Real, measured status: only what the crawler found on the live site.
  const schemaFound: string[] = Array.isArray(latestCrawl?.schemaFound)
    ? (latestCrawl.schemaFound as unknown[]).filter((t): t is string => typeof t === "string")
    : []
  const businessTypesFound = schemaFound.filter(isBusinessType)
  const status: VaultData["status"] = !latestCrawl ? "none" : schemaFound.length === 0 ? "empty" : businessTypesFound.length === 0 ? "partial" : "good"

  const ask: (MissingFact | false | "" | undefined)[] = [
    !user.businessName?.trim() && { key: "businessName" as const, label: "Business name", placeholder: "As customers know it" },
    !user.businessType?.trim() && { key: "businessType" as const, label: "What you do", hint: "A few words, like “dentist” or “bike shop”.", placeholder: "Your kind of business" },
    !user.city?.trim() && { key: "city" as const, label: "City", hint: "Leave it empty if customers never visit you.", placeholder: "Where you’re based" },
    user.city?.trim() && !user.state?.trim() && { key: "state" as const, label: "State or province", placeholder: "For your address" },
  ]
  const missing = ask.filter((m): m is MissingFact => !!m)

  const appBase = (process.env.NEXT_PUBLIC_APP_URL || "https://alphaa.app").replace(/\/$/, "")
  const blocks = schemas.map((sch) => ({
    title: blockTitle(sch.type),
    where: !sch.pageUrl || sch.pageUrl === "/" ? "Goes in the header of every page" : `Goes only on ${sch.pageUrl}`,
    code: `<script type="application/ld+json">\n${JSON.stringify(sch.jsonLd, null, 2)}\n</script>`,
  }))

  const mailBody = `Hi,

Could you add the code below to ${user.businessName?.trim() || "our"} website? It goes in the page header, just before the closing </head> tag, so it's on every page.

It's standard schema.org structured data. It tells Google and AI assistants like ChatGPT, Claude and Perplexity about our business. It doesn't change how the site looks.

${blocks.length ? blocks.filter((b) => b.where.startsWith("Goes in")).map((b) => b.code).join("\n\n") : "(The code is in our Alphaa account.)"}

Thank you!`
  const mailtoHref = `mailto:?subject=${encodeURIComponent(`Please add this code to our website${user.businessName ? ` (${user.businessName})` : ""}`)}&body=${encodeURIComponent(mailBody)}`

  const data: VaultData = {
    status,
    checkedAt: latestCrawl?.crawledAt.toISOString() ?? null,
    checkedUrl: latestCrawl?.url ?? null,
    found: [...new Set(businessTypesFound.map(plainName))],
    blocks,
    writtenAt: schemas.length && latestSchema ? latestSchema.generatedAt.toISOString() : null,
    hadOld,
    hasSite: !!user.websiteUrl?.trim(),
    missing,
    install: installOption(settings),
    tag: `<script async src="${appBase}/tag.js?id=${user.id}"></script>`,
    llms: generateLlmsTxt(user),
    llmsUrl: `${appBase}/llms/${user.id}`,
  }

  return <VaultView data={data} mailtoHref={mailtoHref} picker={<PlatformPicker mailtoHref={mailtoHref} initial={PICKER[settings.wp ? "wordpress" : settings.site?.platform ?? ""] ?? "other"} />} />
}
