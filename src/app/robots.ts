import { MetadataRoute } from "next"

// No trailing slash so prefixes cover "/dashboard?x" too. Login/signup are
// NOT blocked here: they carry noindex, which Google must crawl to see.
const PRIVATE = ["/dashboard", "/onboarding", "/api/", "/start-trial", "/scan/results"]

// AI search assistants get their own named group (practising what we sell).
// A bot with its own group ignores "*", so the private paths are repeated.
const AI_SEARCH_BOTS = [
  "OAI-SearchBot", "ChatGPT-User", "GPTBot",
  "Claude-SearchBot", "Claude-User", "ClaudeBot",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Bingbot", "Applebot", "Applebot-Extended",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_SEARCH_BOTS, allow: ["/", "/llms.txt", "/compare/"], disallow: PRIVATE },
    ],
    sitemap: "https://alphaa.app/sitemap.xml",
  }
}
