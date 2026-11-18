// v3 presentation data per service: colour key, short pill label, the two-tone chapter
// headline, one TRUE proof line, the example cards drawn in the chapter visual and the
// short conversation the homepage tab demo plays. Copy and facts stay in content/services.tsx.
import type { ServiceSlug } from "@/content/services"

export type SvcKey = "mk" | "ad" | "ct" | "se" | "em"

export type SvcV3 = {
  key: SvcKey
  pill: string
  /** Two-tone headline: plain part, then the coloured part. */
  a: string
  b: string
  /** One true line: everything here is stated elsewhere on the site (pricing, services, terms). */
  proof: { n: string; t: string }
  /** Example cards floating in the chapter visual (labelled "Example" on the page). */
  cards: string[]
  demo: { tab: string; ask: string; steps: string[]; res: string[] }
}

export const SVC_ORDER: ServiceSlug[] = ["social-media-management", "ads-management", "content-writing", "ai-search-optimization", "email-marketing"]

export const SVC: Record<ServiceSlug, SvcV3> = {
  "social-media-management": {
    key: "mk",
    pill: "Social media",
    a: "Show up every week",
    b: "without lifting a finger",
    proof: { n: "3 posts", t: "a week for Facebook, Instagram and LinkedIn, each with a branded image" },
    cards: ["Tue 9:00 · Instagram", "Thu 12:30 · Facebook", "Sat 10:00 · LinkedIn"],
    demo: { tab: "Social posts", ask: "Post on Instagram this week", steps: ["Read your brand and voice", "Wrote 3 posts with your logo", "Scheduled Tue, Thu, Sat"], res: ["Tue 9:00", "Thu 12:30", "Sat 10:00"] },
  },
  "ads-management": {
    key: "ad",
    pill: "Ads",
    a: "Ads that reach people",
    b: "ready to buy now",
    proof: { n: "$0", t: "markup on your ad spend. It’s paid to Google and Meta directly" },
    cards: ["Paused · waiting for your OK", "Budget: never more than you set", "Cut searches that never call"],
    demo: { tab: "Ads", ask: "Get me more calls from Google", steps: ["Found the searches that already find you", "Built a campaign, paused", "Waiting for your budget OK"], res: ["11 searches", "$15/day", "Paused"] },
  },
  "content-writing": {
    key: "ct",
    pill: "Content",
    a: "Be the answer",
    b: "when customers search",
    proof: { n: "2 posts", t: "a month on Starter, 4 on Pro, written to be quoted by AI" },
    cards: ["Draft · “Is it safe to…”", "Published to WordPress", "Topic from real searches"],
    demo: { tab: "Blog posts", ask: "Write this month’s blog posts", steps: ["Found what your customers search for", "Wrote 2 posts in your voice", "Ready to publish to your site"], res: ["Post 1 ready", "Post 2 ready", "WordPress"] },
  },
  "ai-search-optimization": {
    key: "se",
    pill: "SEO & AI search",
    a: "Get found on Google",
    b: "and in ChatGPT’s answers",
    proof: { n: "4 AIs", t: "checked for you every week: ChatGPT, Gemini, Claude, Perplexity" },
    cards: ["ChatGPT · named you", "Fixed: wrong opening hours", "Replied to a new review"],
    demo: { tab: "Google & AI", ask: "Why doesn’t ChatGPT mention me?", steps: ["Asked 4 AIs your customers’ question", "Found 1 wrong fact about you", "Wrote the fix for your site"], res: ["ChatGPT ✗", "Gemini ✓", "Fix ready"] },
  },
  "email-marketing": {
    key: "em",
    pill: "Email",
    a: "Turn past customers",
    b: "into repeat customers",
    proof: { n: "Opt-in only", t: "emails go to people who said yes, with the unsubscribe link handled" },
    cards: ["Draft · “We miss you”", "Sends Tue 10:00", "Unsubscribe link added"],
    demo: { tab: "Email", ask: "Bring past customers back", steps: ["Picked customers who said yes", "Wrote a short offer email", "Ready to send Tuesday"], res: ["212 customers", "1 email", "Tue 10:00"] },
  },
}
