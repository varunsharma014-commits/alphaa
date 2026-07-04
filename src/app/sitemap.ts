import { MetadataRoute } from "next"
import { getAllPosts } from "@/content/blog"
import { VERTICALS } from "@/content/verticals"

const BASE_URL = "https://alphaa.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.meta.slug}`,
    lastModified: new Date(p.meta.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const verticalPages: MetadataRoute.Sitemap = VERTICALS.map((v) => ({
    url: `${BASE_URL}/for/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
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
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/scan`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
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
      lastModified: new Date("2026-06-15"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-06-15"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
