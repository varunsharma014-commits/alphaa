// Detailed example playbooks for /case-studies (added 2026-11-26). Same rules as data.tsx, made
// stricter (FTC 16 CFR 465, Competition Bureau, the no-invented-claims rule):
//   - no business or owner names, no photos, no quotes, no ratings, no results ("+38% calls");
//   - a vertical + city type only, and every line describes what Alphaa DOES with features that
//     ship today (plan-features.ts, lib/questions.ts, lib/workspace/schedule.ts 3-day stop window,
//     review-drafts cron, social cards with a 4-5 word headline, lead tracking, email outreach);
//   - outcomes are only things to measure, never things that happened.
// Prices come from PLAN_PRICES so a price change can't leave a stale number here.
import { PLAN_PRICES } from "@/lib/constants"

const P = { starter: `$${PLAN_PRICES.starter.monthly}/mo`, pro: `$${PLAN_PRICES.pro.monthly}/mo`, growth: `$${PLAN_PRICES.growth.monthly}/mo` }

export type Playbook = {
  id: string
  slug: string
  industry: string
  /** Vertical + city type, never a name. */
  business: string
  location: string
  headline: string
  /** Card fields (product facts only). */
  keyResult: string
  keyResultSub: string
  metrics: { label: string; value: string }[]
  situation: string
  questions: string[]
  finds: string[]
  pages: string[]
  googlePosts?: string[]
  social?: { headline: string; idea: string }[]
  reviews: string
  competitors: string
  care?: string
  owner: string[]
  timeline: { when: string; items: string[] }[]
  plan: { name: "Starter" | "Pro" | "Growth"; price: string; why: string; alt?: string }
  measure: string[]
}

const OWNER_BASE = [
  "Approves the first week with one tap each, or edits a line before it goes out.",
  "Turns on Autopilot when ready: finished posts go to “Going out soon” and wait up to 3 days, so anything can be stopped or undone before it publishes.",
  "Confirms or corrects any fact the AIs get wrong (hours, services, prices) the first time it comes up.",
]

export const playbooks: Playbook[] = [
  {
    id: "personal-injury-law-firm",
    slug: "personal-injury-law-firm",
    industry: "Legal",
    business: "A personal-injury law firm",
    location: "Example: a large US metro",
    headline: "What Alphaa's AI Agent does when people ask AI which injury lawyer to call after a crash.",
    keyResult: `Pro, ${P.pro}`,
    keyResultSub: "the plan that fits: AI search, Google posts, review replies and lead tracking",
    metrics: [{ label: "Customer questions put to AI weekly", value: "20" }, { label: "Google posts a week", value: "4" }],
    situation: "A typical picture: a small firm that wins most cases by referral, competing with firms that spend heavily on TV and billboards. After an accident, people now ask an AI assistant who to call, and the answer tends to name the biggest advertisers or a lawyer directory, not a three-attorney firm.",
    questions: [
      "Who is a good car accident lawyer near me?",
      "Do I need a lawyer after a minor rear-end collision?",
      "How much does a personal injury lawyer cost?",
      "Which injury lawyers near me offer a free consultation?",
      "What should I do in the first week after a car accident?",
    ],
    finds: [
      "AI assistants often name lawyer directories or the firms with the most press, because those pages spell out practice areas and locations plainly.",
      "The firm's own site lists \"personal injury\" in one line, with no page per case type or per city it serves.",
      "Hours, phone number or office address differ between the website and the directories AI reads.",
    ],
    pages: [
      "Car accident lawyer in [your city]: what to do in the first 72 hours",
      "How contingency fees work for personal injury cases",
      "Do you need a lawyer for a minor car accident?",
      "Slip and fall claims: what you need to show",
      "Truck accident claims vs car accident claims: what's different",
    ],
    googlePosts: [
      "Free consultation reminder with the office phone number and hours",
      "A short explainer: what to photograph at an accident scene",
      "Which areas of the city the firm serves, with a link to each area page",
    ],
    social: [
      { headline: "Hurt in a crash?", idea: "Three steps to take before talking to any insurer." },
      { headline: "Your first week, explained", idea: "What happens after you call the firm, step by step." },
      { headline: "No fee unless we win", idea: "How a contingency fee works, in plain words (only if the firm offers one)." },
    ],
    reviews: "Replies thank the reviewer without confirming they were a client or mentioning their case, since a public reply can't discuss a legal matter. Replies to negative reviews stay short, offer a phone call and never argue. Every reply waits for approval unless Autopilot is set to post replies to 4 and 5 star reviews only.",
    competitors: "Each week the agent notes which firms the AIs name instead, what pages those firms publish (from their sitemaps) and which questions they answer that this firm doesn't, then suggests the next page to write.",
    care: "Lawyer advertising rules apply (state bar rules based on ABA Model Rule 7.1): no case results, no promises of outcomes, no \"best lawyer\" claims. The agent writes informational pages and leaves anything that reads like legal advice for the firm to review.",
    owner: OWNER_BASE,
    timeline: [
      { when: "Week 1", items: ["Puts the 20 questions to ChatGPT, Gemini, Claude and Perplexity and lists who gets named instead", "Checks the firm's name, address, phone and hours on the directories AI reads", "Drafts structured data (schema) for the firm and each attorney, and an llms.txt file"] },
      { when: "Month 1", items: ["Publishes the first case-type pages and 4 blog posts, each answering one question people ask AI", "Drafts 4 Google posts a week and replies to every new review", "Turns on lead tracking so calls and form sends from the website are counted"] },
      { when: "Month 3", items: ["Adds a page for each city or neighbourhood the firm serves", "Rewrites the pages AI still skips, based on what the named firms publish", "Shows which questions moved from \"names someone else\" to \"names you\""] },
    ],
    plan: { name: "Pro", price: P.pro, why: "Injury clients search locally and read reviews, so the firm needs the Google posts, review replies and lead tracking that start on Pro, not only the AI-search work on Starter.", alt: `Growth (${P.growth}, early access) adds Google or Meta ads once ads open; nothing spends until the firm approves a budget.` },
    measure: ["Calls from the Google listing and form sends from the website (lead tracking on Pro)", "Which of the four AIs name the firm in the weekly checks, and for which questions", "Search Console clicks and impressions for the new case-type pages, once connected"],
  },
  {
    id: "boutique-fitness-studio",
    slug: "boutique-fitness-studio",
    industry: "Fitness",
    business: "A boutique fitness studio",
    location: "Example: a neighbourhood in a mid-sized city",
    headline: "What Alphaa's AI Agent does for a studio that lives on Instagram but disappears in AI answers.",
    keyResult: `Pro, ${P.pro}`,
    keyResultSub: "the plan that fits: 3 social posts a week, Google posts and email to past members",
    metrics: [{ label: "Branded social posts a week", value: "3" }, { label: "Blog posts a month", value: "4" }],
    situation: "A typical picture: a small studio with a loyal community and an active Instagram, but a thin website. When someone new asks an AI for a class nearby, the answer names big chains or class-booking apps.",
    questions: [
      "Best beginner-friendly fitness classes near me",
      "Is a boutique studio worth it compared to a gym?",
      "Where can I do reformer Pilates near me on weekends?",
      "Which studios near me offer a first class free or an intro offer?",
      "What should I bring to my first spin class?",
    ],
    finds: [
      "AI answers lean on booking apps and chain gyms, which list class types, times and prices in plain text.",
      "The studio's schedule lives in an embedded widget that AI can't read, and the site never says which neighbourhood it's in.",
      "The intro offer appears on Instagram only, so AI doesn't know it exists.",
    ],
    pages: [
      "Your first class at the studio: what to expect and what to bring",
      "Reformer Pilates vs mat Pilates: which one is right for you",
      "Class schedule and intro offer (as readable text, not only a widget)",
      "Is a boutique studio worth it? What you get that a big gym doesn't",
    ],
    googlePosts: ["This week's class times, with a link to book", "New-member intro offer, with its real terms", "A new class type or instructor, introduced in two lines"],
    social: [
      { headline: "Your first class, explained", idea: "A carousel-style post on what happens from check-in to cool-down." },
      { headline: "Saturday classes are back", idea: "Weekend schedule post in the studio's colours with its logo." },
      { headline: "Never done Pilates before?", idea: "Three questions beginners ask, answered in the caption." },
    ],
    reviews: "Replies thank members by first name only if they used it, mention the class they wrote about, and invite them back. Replies never share anything about a member's health or goals.",
    competitors: "Weekly notes on which studios and apps the AIs name, what classes they promote, and which of the studio's own social posts got the most likes, so next week's posts lean into what works.",
    care: "No weight-loss or health promises (\"lose 10 pounds\") in any post or page; the agent writes about classes, schedules and the experience instead.",
    owner: [...OWNER_BASE, "Copies each finished social post with one tap and shares it on Instagram or Facebook (posting straight to the accounts turns on as Meta approves Alphaa)."],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs the questions new members ask and lists who they name", "Learns the studio's voice from its website and replies, and its colours and logo for post images", "Drafts the first 3 social posts and the first-class page"] },
      { when: "Month 1", items: ["Turns the class schedule and intro offer into readable text on the site", "3 social posts and 4 Google posts a week, each ready in one tap", "Writes a monthly email to past members who said yes to hearing from the studio"] },
      { when: "Month 3", items: ["Adds pages for each class type people ask AI about", "Plans posts around what got the most likes in the first two months", "Shows which AI answers now include the studio"] },
    ],
    plan: { name: "Pro", price: P.pro, why: "The studio's growth comes from social and returning members, so the social posts, Google posts and member emails on Pro matter more than ads." },
    measure: ["Intro-offer bookings and form sends counted by lead tracking", "Likes and comments on the weekly posts", "Which AIs name the studio for \"classes near me\" questions"],
  },
  {
    id: "shopify-skincare-brand",
    slug: "shopify-skincare-brand",
    industry: "E-commerce",
    business: "A Shopify skincare brand",
    location: "Example: an online store shipping across the US and Canada",
    headline: "What Alphaa's AI Agent does when shoppers ask ChatGPT which product to buy and get a list of big brands.",
    keyResult: `Starter, ${P.starter}`,
    keyResultSub: "AI search first; Pro adds social posts and emails to past customers",
    metrics: [{ label: "Customer questions put to AI weekly", value: "10" }, { label: "Blog posts a month", value: "2" }],
    situation: "A typical picture: a small brand with good products and a Shopify store, but product pages that describe feelings more than facts. Shoppers ask an AI for \"a gentle moisturizer for sensitive skin\" and get the big names.",
    questions: [
      "What's a good fragrance-free moisturizer for sensitive skin?",
      "Which small skincare brands use clean ingredients?",
      "Is niacinamide or vitamin C better for dull skin?",
      "What's the difference between a serum and a moisturizer?",
      "Which skincare brands ship to Canada?",
    ],
    finds: [
      "AI answers name brands whose pages state ingredients, skin type and size in plain text, often from retailer and review sites.",
      "Product pages list ingredients only in an image, so AI can't read them.",
      "Shipping regions and return terms sit in a footer link AI rarely follows.",
    ],
    pages: [
      "How to choose a moisturizer for sensitive skin",
      "Niacinamide vs vitamin C: what each one does",
      "Full ingredient list and skin types, for each product (as text)",
      "Shipping to Canada: times, costs and returns",
    ],
    social: [
      { headline: "Sensitive skin? Start here", idea: "A simple routine using the brand's own products, with no medical claims." },
      { headline: "What's actually inside", idea: "One ingredient explained per post." },
    ],
    reviews: "This brand's reviews live on its store, not Google, so the agent doesn't post replies there; it uses common review themes to decide which questions to answer next.",
    competitors: "Weekly notes on which brands the AIs recommend for each question and what their pages state that this store's pages don't.",
    care: "Cosmetic, not drug, claims: no \"treats acne\" or \"cures eczema\" wording. The agent describes ingredients and skin feel, and the brand reviews anything about results.",
    owner: ["Connects the Shopify store with the Alphaa app so fixes and posts can be published from one approval.", ...OWNER_BASE.slice(0, 2)],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs 10 shopper questions and lists the brands they name", "Checks product pages for facts AI can't read (ingredients in images, missing sizes)", "Drafts product structured data and an llms.txt file"] },
      { when: "Month 1", items: ["Publishes 2 buying-guide posts that answer what shoppers ask AI", "Rewrites ingredient and skin-type details as readable text", "Adds a plain shipping and returns page"] },
      { when: "Month 3", items: ["Covers the next questions AI answers without the brand", "Updates pages where AI still names other brands", "Moves to Pro if social posts and emails to past customers are next"] },
    ],
    plan: { name: "Starter", price: P.starter, why: "The first job is getting named in AI answers, which is what Starter covers: weekly checks, website fixes and 2 posts a month.", alt: `Pro (${P.pro}) adds 3 social posts a week and emails that bring past customers back.` },
    measure: ["Which AIs name the brand for each shopper question", "Traffic from AI assistants and Search Console clicks to the new guides, once connected", "Orders the brand sees in Shopify (Alphaa doesn't claim them)"],
  },
  {
    id: "real-estate-team",
    slug: "real-estate-team",
    industry: "Real estate",
    business: "A real-estate team",
    location: "Example: a suburban market with several towns",
    headline: "What Alphaa's AI Agent does when buyers ask AI which agent knows their town best.",
    keyResult: `Pro, ${P.pro}`,
    keyResultSub: "the plan that fits: town pages, Google posts, social and past-client emails",
    metrics: [{ label: "Business locations", value: "Up to 3" }, { label: "Google posts a week", value: "4" }],
    situation: "A typical picture: a four-agent team that knows its towns well but whose website is mostly an IDX listing feed. When a buyer asks an AI who to work with in a specific town, the answer names big portals or national brokerages.",
    questions: [
      "Who is a good real estate agent in [town]?",
      "Is [town] a good place to buy a first home?",
      "How long do homes take to sell in [town] right now?",
      "What does a buyer's agent do, and how are they paid?",
      "Which agents near me help first-time buyers?",
    ],
    finds: [
      "AI answers lean on the big listing portals, which have a page for every town.",
      "The team's site has listings but no written page about each town it covers.",
      "Agent bios don't say which towns or buyer types each agent works with.",
    ],
    pages: [
      "Buying a first home in [town]: a plain guide",
      "How buyer's agent fees work now",
      "Selling in [town]: what to fix before you list",
      "One page per agent: towns they cover and who they help",
    ],
    googlePosts: ["A new town guide, with a link", "Open-house times this weekend", "A short explainer on one step of buying"],
    social: [
      { headline: "First home in town?", idea: "Five questions first-time buyers ask, answered in the caption." },
      { headline: "Open house this Saturday", idea: "Address, time and two photos the team supplies." },
      { headline: "Selling this spring?", idea: "Three things to fix before listing." },
    ],
    reviews: "Replies thank past clients, mention the town if the reviewer did, and invite referrals without offering anything in return.",
    competitors: "Weekly notes on which agents and portals the AIs name for each town, and what those town pages cover.",
    care: "Fair-housing advertising guidance applies: posts and town pages describe homes and amenities, never who a neighbourhood is \"for\". The agent avoids that wording.",
    owner: [...OWNER_BASE, "Supplies listing photos for open-house posts; the agent never uses photos from other sites."],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs the town-by-town questions buyers ask", "Checks the team's details on the profiles and directories AI reads", "Drafts schema for the team and each agent"] },
      { when: "Month 1", items: ["Publishes the first town guides and 4 blog posts", "4 Google posts and 3 social posts a week", "A monthly email to past clients who agreed to hear from the team"] },
      { when: "Month 3", items: ["A page for every town the team covers", "Updates guides where AI still names portals only", "Lead tracking shows which pages bring calls and form sends"] },
    ],
    plan: { name: "Pro", price: P.pro, why: "Up to 3 locations, Google posts, social and past-client emails are all on Pro, and referrals from past clients are the team's biggest source.", alt: `Growth (${P.growth}, early access) adds Google or Meta ads when ads open.` },
    measure: ["Calls and form sends from town pages (lead tracking)", "Which AIs name the team for each town question", "Replies and clicks from the past-client email"],
  },
  {
    id: "med-spa",
    slug: "med-spa",
    industry: "Med spa",
    business: "A med spa",
    location: "Example: a mid-sized US city",
    headline: "What Alphaa's AI Agent does when people ask AI where to get a treatment safely nearby.",
    keyResult: `Pro, ${P.pro}`,
    keyResultSub: "the plan that fits: treatment pages, Google posts, social and review replies",
    metrics: [{ label: "Branded social posts a week", value: "3" }, { label: "Customer questions put to AI weekly", value: "20" }],
    situation: "A typical picture: a med spa with a medical director, good reviews and a busy Instagram. People ask an AI where to get a treatment and who is qualified, and the answer names clinics whose pages spell out who performs each treatment.",
    questions: [
      "Where can I get Botox near me from a nurse injector?",
      "Is laser hair removal safe for darker skin?",
      "How much do lip fillers cost in [city]?",
      "Which med spas near me have a medical director?",
      "How long does microneedling take to heal?",
    ],
    finds: [
      "AI answers name clinics whose pages list who performs each treatment and their credentials.",
      "The med spa's treatment pages are short and don't answer the safety and recovery questions people ask AI.",
      "Prices or \"from\" prices aren't stated anywhere AI can read.",
    ],
    pages: [
      "Botox at [med spa type]: who performs it and what to expect",
      "Laser hair removal and skin types: what to ask first",
      "Microneedling recovery, day by day",
      "Our team and credentials (medical director, injectors)",
    ],
    googlePosts: ["A treatment explainer with a link to book a consultation", "New appointment times this month", "Aftercare tips for one treatment"],
    social: [
      { headline: "Who does your injections?", idea: "Introduce the injector and their credentials, supplied by the spa." },
      { headline: "Healing after microneedling", idea: "A simple day-by-day aftercare post." },
    ],
    reviews: "Replies thank the reviewer without confirming they had a treatment or naming one, since health details stay private. Replies to complaints offer a call with the manager.",
    competitors: "Weekly notes on which clinics the AIs name, which treatments they write about, and the questions the spa's pages don't answer yet.",
    care: "Health-claim rules apply: no before-and-after promises, no \"guaranteed results\", no claims about medical outcomes. The spa reviews every treatment page before it goes live, and the agent never writes dosing or medical advice.",
    owner: [...OWNER_BASE.slice(0, 2), "Has the medical director review treatment pages before approval."],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs the treatment and safety questions clients ask", "Checks the spa's details on the profiles AI reads", "Drafts schema for the business and its practitioners"] },
      { when: "Month 1", items: ["Publishes treatment pages after the spa's review", "4 Google posts and 3 social posts a week", "Review replies drafted every night, approved with a tap"] },
      { when: "Month 3", items: ["Aftercare and recovery pages for the most-asked treatments", "Updates pages AI still skips", "Lead tracking shows which treatment pages bring consult requests"] },
    ],
    plan: { name: "Pro", price: P.pro, why: "Bookings follow reviews, Google posts and social, which all start on Pro." },
    measure: ["Consultation requests and calls (lead tracking)", "Which AIs name the spa for each treatment question", "Search Console clicks to the treatment pages, once connected"],
  },
  {
    id: "plumbing-company",
    slug: "plumbing-company",
    industry: "Home services",
    business: "A plumbing company",
    location: "Example: a two-van business covering one county",
    headline: "What Alphaa's AI Agent does when someone with a burst pipe asks AI who can come today.",
    keyResult: `Pro, ${P.pro}`,
    keyResultSub: "the plan that fits: area pages, Google posts, review replies and call tracking",
    metrics: [{ label: "Google posts a week", value: "4" }, { label: "Blog posts a month", value: "4" }],
    situation: "A typical picture: a busy owner-operator with great reviews and no time for marketing. In an emergency, people ask an AI or their phone who can come today, and the answer names whoever says \"24/7\" and lists their service area clearly.",
    questions: [
      "Emergency plumber near me open now",
      "How much does it cost to fix a burst pipe?",
      "Who installs tankless water heaters in [county]?",
      "Is a leaking water heater an emergency?",
      "Plumber that does weekend calls near me",
    ],
    finds: [
      "AI answers name companies whose pages state hours, emergency availability and the towns they cover.",
      "The website says \"serving the area\" without naming towns, and its emergency hours differ from the Google listing.",
      "Lead-gen directories outrank the company's own site for the emergency questions.",
    ],
    pages: [
      "Emergency plumbing in [town]: what to do before we arrive",
      "Burst pipe repair: what affects the cost",
      "Tankless water heaters: are they worth it?",
      "One page per town in the service area",
    ],
    googlePosts: ["Emergency hours, stated exactly as they are", "Winter tip: how to keep pipes from freezing", "A recent job type, described in two lines with the owner's photo"],
    social: [
      { headline: "Pipes freezing tonight?", idea: "Three things to do now, posted before a cold snap." },
      { headline: "Is this leak urgent?", idea: "A quick check list: what can wait and what can't." },
    ],
    reviews: "Replies thank customers for the specific job they mention and the tech's first name if the customer used it. Negative reviews get a short reply with the office number, never an argument.",
    competitors: "Weekly notes on which plumbers and directories the AIs name for emergency questions, and which towns competitors have pages for.",
    care: "Hours and emergency claims must match reality: the agent only says \"24/7\" or \"same day\" if the owner confirms it, and keeps the website and Google listing saying the same thing.",
    owner: [...OWNER_BASE, "Snaps a job photo now and then; the agent uses only the owner's own photos."],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs the emergency and cost questions", "Finds every place the hours or phone number differ", "Drafts schema with the real service area and hours"] },
      { when: "Month 1", items: ["Town pages for the service area and 4 blog posts", "4 Google posts a week, review replies every night", "Lead tracking counts calls from the listing and the website"] },
      { when: "Month 3", items: ["Seasonal pages before winter and summer rushes", "Updates pages where AI still names directories", "Shows which towns and questions bring calls"] },
    ],
    plan: { name: "Pro", price: P.pro, why: "For a call-driven business, Google posts, review replies and call tracking on Pro do the heavy lifting.", alt: `Growth (${P.growth}, early access) adds Google or Meta ads once ads open; budgets never spend without approval.` },
    measure: ["Calls from the Google listing and website (lead tracking)", "Which AIs name the company for emergency questions", "Calls by town, from the area pages"],
  },
  {
    id: "family-restaurant",
    slug: "family-restaurant",
    industry: "Restaurant",
    business: "A family restaurant",
    location: "Example: a small downtown in a tourist town",
    headline: "What Alphaa's AI Agent does when visitors ask AI where to eat tonight.",
    keyResult: `Pro, ${P.pro}`,
    keyResultSub: "the plan that fits: Google posts, social, review replies and emails to regulars",
    metrics: [{ label: "Google posts a week", value: "4" }, { label: "Branded social posts a week", value: "3" }],
    situation: "A typical picture: a well-loved local spot with a menu that changes with the seasons. Visitors ask an AI for \"a family-friendly restaurant downtown with gluten-free options\", and the answer names places whose menus and hours AI can read.",
    questions: [
      "Family-friendly restaurants downtown open late",
      "Where can I get gluten-free options near me?",
      "Best place for a group dinner of 12 in [town]",
      "Restaurants near me with outdoor seating",
      "Is [restaurant type] near me open on Mondays?",
    ],
    finds: [
      "The menu is a PDF or photo, so AI can't tell what dishes or dietary options exist.",
      "Holiday hours on the website and Google listing don't match.",
      "AI answers lean on review sites and food blogs that describe other places in detail.",
    ],
    pages: [
      "The menu as readable text, with dietary notes the restaurant confirms",
      "Group dinners and private bookings: how it works",
      "Kids' menu and high chairs: what to expect",
      "Seasonal specials page, updated when the menu changes",
    ],
    googlePosts: ["This week's special, with the price", "Holiday hours, exactly as they are", "Group booking reminder before busy weekends"],
    social: [
      { headline: "Fall menu starts Friday", idea: "Three new dishes, photographed by the restaurant." },
      { headline: "Tables for big groups", idea: "How to book for 10 or more." },
      { headline: "Tuesday is family night", idea: "Only if the restaurant runs it; the agent never invents offers." },
    ],
    reviews: "Replies thank guests for the dish or server they mention and invite them back. Allergy-related complaints get a short reply and a direct contact, never a public debate.",
    competitors: "Weekly notes on which restaurants the AIs name for each question, and what their menus and pages state that this one doesn't.",
    care: "Dietary claims (gluten-free, nut-free) only as the restaurant confirms them, with its own wording about cross-contact.",
    owner: [...OWNER_BASE, "Pastes the new menu into the chat when it changes; the agent updates the menu page and the week's posts."],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs where visitors would eat tonight and who gets named", "Fixes hours and holiday hours everywhere AI reads", "Turns the menu into readable text with restaurant-approved notes"] },
      { when: "Month 1", items: ["4 Google posts and 3 social posts a week", "Review replies drafted every night", "A monthly email to regulars who signed up"] },
      { when: "Month 3", items: ["Seasonal menu pages and group-dining page", "Updates where AI still names other places", "Lead tracking shows calls and booking-form sends"] },
    ],
    plan: { name: "Pro", price: P.pro, why: "Restaurants live on Google posts, reviews, social and regulars, all on Pro." },
    measure: ["Calls and booking-form sends (lead tracking)", "Which AIs name the restaurant for \"where to eat\" questions", "Opens and clicks on the email to regulars"],
  },
  {
    id: "b2b-saas-startup",
    slug: "b2b-saas-startup",
    industry: "SaaS",
    business: "A B2B SaaS startup",
    location: "Example: a seed-stage team selling to small businesses",
    headline: "What Alphaa's AI Agent does when buyers ask AI for software in your category and get the market leaders.",
    keyResult: `Starter, ${P.starter}`,
    keyResultSub: "AI search and comparison content first; Pro adds LinkedIn posts and nurture emails",
    metrics: [{ label: "Customer questions put to AI weekly", value: "10" }, { label: "Blog posts a month", value: "2" }],
    situation: "A typical picture: a small product team with a good tool and a homepage full of slogans. Buyers ask an AI for \"the best [category] tool for small teams\" and get the three market leaders, because their pages state features, prices and integrations plainly.",
    questions: [
      "What's a simple [category] tool for small teams?",
      "Alternatives to [market leader] for small businesses",
      "Which [category] tools integrate with [common tool]?",
      "How much does [category] software cost per user?",
      "Is there a [category] tool with a free plan?",
    ],
    finds: [
      "AI answers name tools whose pages list features, pricing and integrations in text.",
      "The startup's pricing and integrations live behind \"book a demo\".",
      "Comparison articles on review sites mention the leaders but not the startup.",
    ],
    pages: [
      "[Your product] vs [market leader]: an honest comparison",
      "Pricing, explained (in plain text, matching the pricing page)",
      "Integrations: what connects and how",
      "How to choose a [category] tool for a team of 10",
    ],
    social: [
      { headline: "Choosing a [category] tool?", idea: "Five questions to ask any vendor, posted on LinkedIn." },
      { headline: "What we shipped this month", idea: "A short changelog post." },
    ],
    reviews: "There may be no Google reviews to reply to; the agent focuses on the review sites AI reads and suggests where the team should ask happy customers for a review (no incentives).",
    competitors: "Weekly notes on which tools the AIs recommend for each buyer question and what their pages state that this product's pages don't.",
    care: "Comparison pages stay factual and dated, cite the competitor's own public pages, and avoid \"best\" or \"#1\" claims.",
    owner: ["Answers the few facts only the team knows (pricing tiers, integrations) the first time the agent asks.", ...OWNER_BASE.slice(0, 2)],
    timeline: [
      { when: "Week 1", items: ["Asks the four AIs 10 buyer questions and lists the tools they name", "Finds facts AI can't read (pricing behind a demo form, integrations in images)", "Drafts software structured data and an llms.txt file"] },
      { when: "Month 1", items: ["2 posts a month: a comparison page and a buyer's guide", "Plain-text pricing and integrations pages", "Website fixes so AI crawlers can read the site"] },
      { when: "Month 3", items: ["Covers the next questions AI answers without the product", "Updates comparisons as competitors change their pages", "Moves to Pro if LinkedIn posts and nurture emails are next"] },
    ],
    plan: { name: "Starter", price: P.starter, why: "Getting named in AI answers to buyer questions is Starter's job: weekly checks, website fixes and 2 posts a month.", alt: `Pro (${P.pro}) adds 3 social posts a week (LinkedIn included), 4 posts a month and emails to past leads.` },
    measure: ["Which AIs name the product for each buyer question", "Trial or demo sign-ups the team sees from AI and search traffic (Alphaa doesn't claim them)", "Search Console clicks to comparison and pricing pages, once connected"],
  },
]

export function getPlaybook(slug: string): Playbook | undefined {
  return playbooks.find((p) => p.slug === slug)
}
