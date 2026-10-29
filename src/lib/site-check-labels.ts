// Client-safe: keys, plain-English phrases, grouping and impact for the site
// checks. Server logic lives in lib/site-check.ts.
export type CheckKey =
  // Can AI get in?
  | "aibots" | "robots" | "indexable" | "render" | "canonical" | "https" | "bing" | "llms" | "sitemap" | "speed"
  // Can AI understand you?
  | "schema" | "schemaFacts" | "facts" | "local" | "meta" | "headings" | "depth" | "pages" | "faq"
  // Can AI trust you?
  | "reviews" | "profiles" | "about" | "blog"

export type CheckGroup = "access" | "understand" | "trust"

export const GROUP_TITLE: Record<CheckGroup, string> = {
  access: "Can AI get in?",
  understand: "Can AI understand what you do?",
  trust: "Does AI have a reason to trust you?",
}

export const CHECK_GROUP: Record<CheckKey, CheckGroup> = {
  aibots: "access", robots: "access", indexable: "access", render: "access", canonical: "access",
  https: "access", bing: "access", llms: "access", sitemap: "access", speed: "access",
  schema: "understand", schemaFacts: "understand", facts: "understand", local: "understand", meta: "understand",
  headings: "understand", depth: "understand", pages: "understand", faq: "understand",
  reviews: "trust", profiles: "trust", about: "trust", blog: "trust",
}

// 3 = can stop AI recommending you on its own; 2 = weakens the case; 1 = polish.
// "What's hurting you most" is ranked by this, not by list order.
export const CHECK_IMPACT: Record<CheckKey, 1 | 2 | 3> = {
  aibots: 3, robots: 3, indexable: 3, render: 3, canonical: 3,
  facts: 3, local: 3, bing: 2, schema: 2, schemaFacts: 2, reviews: 2, profiles: 2, depth: 2, pages: 2, faq: 2,
  https: 2, blog: 2, about: 1, llms: 1, sitemap: 1, meta: 1, headings: 1, speed: 1,
}

export const CHECK_SHORT: Record<CheckKey, string> = {
  aibots: "your site turns AI away at the door",
  robots: "a setting on your site tells AI to stay out",
  indexable: "your site tells Google not to show it",
  render: "AI sees a blank page — your words only appear after the page loads extra code",
  canonical: "your pages tell Google to look at a different page",
  https: "your website has more than one address, or isn’t secure",
  bing: "no sign you’re set up with Bing, which ChatGPT search leans on",
  llms: "no summary file for AI assistants",
  sitemap: "no list of your pages for search engines",
  speed: "a slow site",
  schema: "your business facts aren’t in a form AI can read",
  schemaFacts: "AI can’t find your address, phone or hours in your site’s business facts",
  facts: "no phone, address or hours AI can read",
  local: "your site doesn’t say which city you serve",
  meta: "a weak page title and summary",
  headings: "no clear main heading",
  depth: "too little text for AI to quote",
  pages: "too few pages about your services",
  faq: "no FAQ",
  reviews: "no reviews AI can read on your site",
  profiles: "no links to your Google, Yelp or social profiles",
  about: "no About page saying who you are",
  blog: "nothing fresh for AI to quote",
}
