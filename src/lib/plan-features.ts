// What each plan includes, in owner words. Single list for the pricing page, the homepage, the
// upgrade screen and anywhere else a plan is described. Plans set 2026-11-26 (owner decision):
//   Starter $99  = AI search (AEO) only: getting named by ChatGPT, Gemini, Claude and Perplexity.
//   Pro     $499 = everything except ads: + social, Google Business Profile posts, review
//                  replies, email to past customers, lead tracking, up to 3 locations.
//   Growth  $799 = Pro + Google and Meta ads for 1 ad account (+$200/mo per extra ad account).
//                  Early access (no checkout) until Google and Meta approve ads access.
// Only shipped features go here. Growth lives in lib/growth.ts with its early-access switch.
export { GROWTH_FEATURES } from "@/lib/growth"

export const STARTER_FEATURES = [
  "Weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about you",
  "10 questions your customers ask, put to AI every week",
  "Wrong facts AI states about you caught, and corrected once you confirm",
  "Your name, address and phone checked on the profiles and directories AI reads",
  "Website fixes so AI can read and recommend you",
  "2 blog posts a month that answer what customers ask AI",
  "The questions AI answers without you, and how to win them",
  "Weekly briefing email",
  "1 business location",
  "Email support",
]

export const PRO_FEATURES = [
  "Everything in Starter",
  "3 branded social posts a week for Facebook, Instagram, LinkedIn and TikTok, ready to publish in one tap",
  "4 Google Business Profile posts a week",
  "Replies to your Google reviews, in your voice",
  "Emails that bring past customers back",
  "See which calls, emails and forms your marketing brought in",
  "4 blog posts a month and 20 customer questions checked every week",
  "Competitor benchmarking",
  "Up to 3 business locations",
  "Auto-approve: posts can publish on their own",
  "Priority chat support",
]
