import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // No trailing slash so prefixes cover "/dashboard?x" too. Login/signup are
          // NOT blocked here: they carry noindex, which Google must crawl to see.
          "/dashboard",
          "/onboarding",
          "/api/",
          "/start-trial",
          "/scan/results",
        ],
      },
    ],
    sitemap: "https://alphaa.app/sitemap.xml",
  }
}
