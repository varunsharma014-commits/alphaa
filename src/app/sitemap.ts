import { MetadataRoute } from "next"
import { getAllPosts } from "@/content/blog"
import { VERTICALS } from "@/content/verticals"
import { CONTENT_REVIEWED } from "@/content/blog/reviewed"
import { COMPARES, COMPARE_CHECKED } from "@/content/compare"
import { INTEGRATIONS, INTEGRATIONS_CHECKED } from "@/content/integrations"

const BASE_URL = "https://alphaa.app"

// Real last-edit dates (from git) for pages without their own content date.
// lastModified used to be the build time, which tells Google every page
// changed on every deploy — so it learns to ignore our dates. Bump the date
// here when you actually change one of these pages.
const PAGE_UPDATED: Record<string, string> = {
  "/": "2026-10-29",
  "/start": "2026-10-29",
  "/for": "2026-10-29",
  "/pricing": "2026-10-29",
  "/about": "2026-10-29",
  "/how-it-works": "2026-10-29",
  "/scan": "2026-10-29",
  "/case-studies": "2026-10-29",
  "/refer": "2026-10-29",
}
const updated = (path: string) => new Date(PAGE_UPDATED[path])

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.meta.slug}`,
    lastModified: new Date([p.meta.date, p.meta.updated ?? CONTENT_REVIEWED].sort().pop()!),
    changeFrequency: "monthly",
    priority: 0.7,
    ...(p.meta.image ? { images: [`${BASE_URL}${p.meta.image.src}`] } : {}),
  }))

  const verticalPages: MetadataRoute.Sitemap = VERTICALS.map((v) => ({
    url: `${BASE_URL}/for/${v.slug}`,
    lastModified: updated("/for"),
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
      lastModified: updated("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/start`,
      lastModified: updated("/start"),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/blog`,
      // The blog index changes when a post is added or updated.
      lastModified: new Date(blogPosts.map((b) => (b.lastModified as Date).toISOString()).sort().pop()!),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
    ...verticalPages,
    {
      url: `${BASE_URL}/pricing`,
      lastModified: updated("/pricing"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: updated("/about"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: updated("/how-it-works"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/scan`,
      lastModified: updated("/scan"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/case-studies`,
      lastModified: updated("/case-studies"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/refer`,
      lastModified: updated("/refer"),
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
