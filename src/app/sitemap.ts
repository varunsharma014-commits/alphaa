import { MetadataRoute } from "next"
import { getAllPosts } from "@/content/blog"
import { VERTICALS } from "@/content/verticals"
import { CONTENT_REVIEWED } from "@/content/blog/reviewed"
import { COMPARES, COMPARE_CHECKED } from "@/content/compare"
import { INTEGRATIONS, INTEGRATIONS_CHECKED } from "@/content/integrations"

const BASE_URL = "https://alphaa.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.meta.slug}`,
    lastModified: new Date([p.meta.date, p.meta.updated ?? CONTENT_REVIEWED].sort().pop()!),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const verticalPages: MetadataRoute.Sitemap = VERTICALS.map((v) => ({
    url: `${BASE_URL}/for/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  const comparePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/compare`, lastModified: new Date(COMPARE_CHECKED), changeFrequency: "monthly", priority: 0.8 },
    ...COMPARES.map((c) => ({
      url: `${BASE_URL}/compare/${c.slug}`,
      lastModified: new Date(COMPARE_CHECKED),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ]

  const integrationPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/integrations`, lastModified: new Date(INTEGRATIONS_CHECKED), changeFrequency: "monthly", priority: 0.8 },
    ...INTEGRATIONS.map((i) => ({
      url: `${BASE_URL}/integrations/${i.slug}`,
      lastModified: new Date(INTEGRATIONS_CHECKED),
      changeFrequency: "monthly" as const,
      priority: i.status === "live" ? 0.8 : 0.5,
    })),
  ]

  return [
    ...comparePages,
    ...integrationPages,
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/start`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
    ...verticalPages,
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/scan`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/case-studies`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/refer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-09-28"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-09-28"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
