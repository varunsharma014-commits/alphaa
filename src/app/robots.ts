import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/onboarding/",
          "/api/",
          "/login/",
          "/signup/",
          "/scan/results",
        ],
      },
    ],
    sitemap: "https://alphaa.app/sitemap.xml",
  }
}
