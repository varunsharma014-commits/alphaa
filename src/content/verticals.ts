// Registry of vertical landing pages served at /for/[vertical].
// These are the destination pages for paid ads ("ai marketing for dentists"
// → /for/dentists). To add a vertical: add an entry here — the dynamic route,
// sitemap, and static params all read from this list.

export interface VerticalFaq {
  q: string
  a: string
}

export interface VerticalPlaybookItem {
  title: string
  body: string
}

export interface Vertical {
  slug: string
  /** Singular noun for the business, e.g. "dental practice" */
  noun: string
  /** Plural audience label, e.g. "dentists" */
  plural: string
  /** What a customer actually types into ChatGPT */
  examplePrompt: string
  /** Vertical-specific pain sentence used in the pain section */
  painLine: string
  /** Typical monthly agency retainer (midpoint used for the savings math) */
  agencyCostMonthly: number
  /** Human-readable retainer range shown next to the math */
  agencyCostLabel: string
  /** 5–6 vertical-specific things alphaa does */
  playbook: VerticalPlaybookItem[]
  faq: VerticalFaq[]
  /** Slug of the matching blog post in src/content/blog */
  relatedPostSlug: string
}

export const VERTICALS: Vertical[] = [
  {
    slug: "dentists",
    noun: "dental practice",
    plural: "dentists",
    examplePrompt: "who's the best dentist near me?",
    painLine:
      "A patient with a cracked tooth doesn't scroll ten blue links anymore — they ask AI, get three names, and call the first one. If your practice isn't one of those three names, that patient books with the office down the street.",
    agencyCostMonthly: 2000,
    agencyCostLabel: "$1,500–$2,500/mo",
    playbook: [
      {
        title: "Keeps your Google Business Profile alive",
        body: "AI engines lean heavily on your GBP. Alphaa publishes fresh posts about your services — cleanings, implants, emergency visits — on a steady schedule, automatically.",
      },
      {
        title: "Adds Dentist schema markup to your site",
        body: "Structured data that spells out your services, hours, insurance, and location in the exact format AI crawlers read — so engines can quote you accurately.",
      },
      {
        title: "Answers the questions patients actually ask",
        body: "“Does it hurt?” “Do you take my insurance?” “How much is a crown?” Alphaa builds content around real patient questions so AI has something to cite.",
      },
      {
        title: "Monitors what AI says about your practice",
        body: "We query ChatGPT, Gemini, Perplexity, and Google AI about dentists in your area every week and show you exactly where you appear — and where competitors do.",
      },
      {
        title: "Fixes the technical gaps on your website",
        body: "Missing meta descriptions, broken pages, no llms.txt — the quiet issues that keep AI crawlers from understanding your practice. Found and flagged automatically.",
      },
      {
        title: "Helps you turn reviews into a signal",
        body: "AI engines weigh review volume and recency. Alphaa drafts professional replies to Google reviews so your profile reads active and trustworthy.",
      },
    ],
    faq: [
      {
        q: "Can Alphaa guarantee my practice shows up on ChatGPT?",
        a: "No — and no one honestly can, because AI engines control their own answers. What Alphaa does is shape the public signals those engines read: your Google Business Profile, your website content, structured data, and reviews. Then we track your visibility weekly so you can see real movement.",
      },
      {
        q: "I already pay an SEO agency. Do I need this too?",
        a: "Ask your agency what they're doing to get you recommended by ChatGPT and Gemini. Most dental SEO agencies are still optimizing for 2019 Google. Many practices run Alphaa alongside their agency for a month, compare, then keep whichever is working — no contract either way.",
      },
      {
        q: "How long until patients find me through AI?",
        a: "Google Business Profile improvements often show within days. AI answer visibility typically takes 30–60 days as engines re-crawl and refresh their picture of your practice. Alphaa tracks it so you're never guessing.",
      },
      {
        q: "Do I need to do anything myself?",
        a: "About 2 minutes of setup: connect your Google Business Profile and tell us about your practice. Alphaa handles the posting, content, schema, and monitoring from there. No marketing knowledge required.",
      },
    ],
    relatedPostSlug: "get-recommended-by-ai-local-service-business",
  },
  {
    slug: "med-spas",
    noun: "med spa",
    plural: "med spas",
    examplePrompt: "best med spa for Botox near me?",
    painLine:
      "Med spa clients research hard before they book — and increasingly that research happens in ChatGPT, not Google. When AI recommends two competitors and not you, you lose a client worth thousands in lifetime value and never even see it happen.",
    agencyCostMonthly: 2000,
    agencyCostLabel: "$1,500–$2,500/mo",
    playbook: [
      {
        title: "Publishes treatment-focused Google posts",
        body: "Botox, fillers, laser, microneedling, memberships — Alphaa keeps your Google Business Profile publishing about the treatments clients search for, automatically.",
      },
      {
        title: "Builds structured data for your services",
        body: "Schema markup that tells AI engines exactly what treatments you offer, your location, hours, and booking info — in the machine-readable format they trust.",
      },
      {
        title: "Creates content around real client questions",
        body: "“How long does Botox last?” “What's the downtime?” “Is it safe?” AI cites businesses that answer these clearly. Alphaa makes sure that's you.",
      },
      {
        title: "Tracks AI recommendations in your market",
        body: "Weekly checks of what ChatGPT, Gemini, Perplexity, and Google AI say when someone asks about med spas in your area — including which competitors get named.",
      },
      {
        title: "Audits your website like an AI crawler would",
        body: "Finds missing schema, thin pages, and technical gaps that keep AI from confidently recommending you — and tells you exactly what to fix.",
      },
      {
        title: "Keeps your review presence active",
        body: "Drafts warm, professional replies to Google reviews so your profile signals an engaged, trusted practice — a signal AI engines pick up on.",
      },
    ],
    faq: [
      {
        q: "My clients come from Instagram. Why does AI search matter?",
        a: "Instagram builds desire; AI search closes the decision. When someone is ready to book, they increasingly ask ChatGPT or Google AI who's reputable near them. Being invisible at that moment means the client you warmed up on social books somewhere else.",
      },
      {
        q: "Can you promise I'll be the top recommendation?",
        a: "No — AI engines decide their own answers, and anyone promising a guaranteed spot is selling snake oil. Alphaa does the work that influences those answers — content, structured data, an active Google profile — and shows you your visibility trend week over week.",
      },
      {
        q: "How is this different from my med spa marketing agency?",
        a: "Most agencies charging $1,500–$2,500/month focus on ads and old-school SEO. Alphaa focuses specifically on AI answer engines — ChatGPT, Gemini, Perplexity, Google AI — for $99/month, no contract. Many med spas run both for a month and compare.",
      },
      {
        q: "How much of my time does this take?",
        a: "Setup is about 2 minutes. After that Alphaa runs on autopilot — posting, content, schema, monitoring. You can review drafts before they publish or let it run.",
      },
    ],
    relatedPostSlug: "get-recommended-by-ai-local-service-business",
  },
  {
    slug: "hvac",
    noun: "HVAC company",
    plural: "HVAC companies",
    examplePrompt: "my AC just died — who should I call?",
    painLine:
      "HVAC is an emergency business. When a furnace dies at 11pm, homeowners ask their phone who to call and take the first credible answer. If AI names two competitors and not you, that's a service call — and maybe a $12,000 system replacement — gone.",
    agencyCostMonthly: 1250,
    agencyCostLabel: "$1,000–$1,500/mo",
    playbook: [
      {
        title: "Keeps your Google Business Profile posting",
        body: "Seasonal tune-ups, emergency repair, new installs, financing — Alphaa publishes relevant posts automatically so your profile always looks active when AI checks it.",
      },
      {
        title: "Adds HVACBusiness schema to your site",
        body: "Machine-readable markup covering your service area, hours, emergency availability, and services — exactly what AI engines parse when deciding who to recommend.",
      },
      {
        title: "Builds pages for the questions homeowners ask",
        body: "“Why is my AC blowing warm air?” “How much does a new furnace cost?” AI recommends companies whose sites actually answer these. Alphaa creates that content.",
      },
      {
        title: "Watches your AI visibility every week",
        body: "We ask ChatGPT, Gemini, Perplexity, and Google AI who they'd recommend for HVAC in your area, and show you where you stand versus competitors.",
      },
      {
        title: "Finds and flags website issues",
        body: "Slow pages, missing service-area info, no llms.txt — the technical problems that make AI crawlers skip you. Detected automatically, with plain-English fixes.",
      },
      {
        title: "Keeps your reviews working for you",
        body: "Drafts responses to Google reviews so your profile shows an active, responsive company — a trust signal AI engines factor in.",
      },
    ],
    faq: [
      {
        q: "My customers are older — do they really use AI?",
        a: "Their kids do, and increasingly so do they. Google itself now puts AI answers at the top of most searches, so even people who “just Google it” are seeing AI-generated recommendations. If you're not in those answers, you're below the fold.",
      },
      {
        q: "Will this get me more emergency calls?",
        a: "Alphaa can't guarantee call volume — no honest company can. What it does is make sure that when AI engines are asked about HVAC help in your area, the public signals about your business — profile activity, content, schema, reviews — are strong enough to get you named.",
      },
      {
        q: "I pay a marketing company $1,200/month. Is this the same thing?",
        a: "Probably not. Most local marketing retainers cover ads and traditional SEO. Alphaa is built specifically for AI search — ChatGPT, Gemini, Perplexity, Google AI — at $99/month with no contract. Run both for a month and see which moves the needle.",
      },
      {
        q: "How fast will I see something change?",
        a: "Google Business Profile changes often show within days. AI answers refresh on a slower cycle — expect 30–60 days for visible movement there. Alphaa tracks it weekly so you can watch the trend.",
      },
    ],
    relatedPostSlug: "get-recommended-by-ai-local-service-business",
  },
  {
    slug: "plumbers",
    noun: "plumbing company",
    plural: "plumbers",
    examplePrompt: "I have a burst pipe — who's a good plumber near me?",
    painLine:
      "Nobody comparison-shops with water pouring through the ceiling. They ask AI, get a name or two, and call. Every emergency job in your area is being routed by AI answers right now — either to you or past you.",
    agencyCostMonthly: 1250,
    agencyCostLabel: "$1,000–$1,500/mo",
    playbook: [
      {
        title: "Automates your Google Business Profile",
        body: "Emergency service, drain cleaning, water heaters, repiping — Alphaa posts about your services on a schedule so your profile stays fresh without you touching it.",
      },
      {
        title: "Adds Plumber schema markup",
        body: "Structured data covering your service area, 24/7 availability, and services in the format AI crawlers actually read — so engines can recommend you with confidence.",
      },
      {
        title: "Answers homeowner questions before they call",
        body: "“Why is my water heater leaking?” “What does a repipe cost?” Alphaa builds content around real questions so AI engines have your answers to cite.",
      },
      {
        title: "Checks who AI recommends in your area",
        body: "Weekly scans of ChatGPT, Gemini, Perplexity, and Google AI asking about plumbers near you — so you know exactly where you show up and who's beating you.",
      },
      {
        title: "Audits your site for AI-readability",
        body: "Missing meta data, no llms.txt, thin service pages — Alphaa finds the gaps that keep AI from understanding what you do and where you do it.",
      },
      {
        title: "Keeps your review responses on point",
        body: "Drafts professional replies to Google reviews automatically, keeping your profile active and trustworthy — signals AI engines take seriously.",
      },
    ],
    faq: [
      {
        q: "Do people really ask ChatGPT for a plumber?",
        a: "Yes — and even more see AI answers without asking for them. Google now shows AI-generated summaries above the traditional results for most local searches. Between ChatGPT, Google AI, and voice assistants, a growing share of “who should I call” moments are answered by AI.",
      },
      {
        q: "Can you guarantee I'll be recommended?",
        a: "No, and be suspicious of anyone who says yes — AI engines control their own outputs. Alphaa strengthens the signals those engines read (Google profile, content, schema, reviews) and tracks your visibility weekly so you see whether it's working.",
      },
      {
        q: "What does this cost compared to my current marketing?",
        a: "Local marketing retainers for plumbers typically run $1,000–$1,500/month. Alphaa is $99/month, no contract, cancel anytime. It's not a replacement for everything an agency does — it's the AI-search piece they usually don't do at all.",
      },
      {
        q: "I'm busy on jobs all day. How much work is this for me?",
        a: "Two minutes to set up, then it runs itself — posts, content, schema, weekly visibility reports. You can review anything before it goes live, or let it ride.",
      },
    ],
    relatedPostSlug: "get-recommended-by-ai-local-service-business",
  },
  {
    slug: "lawyers",
    noun: "law firm",
    plural: "lawyers",
    examplePrompt: "who's a good personal injury lawyer near me?",
    painLine:
      "Legal clients are high-stakes and high-value — and they now vet firms through AI before they ever call. When ChatGPT summarizes “reputable firms in your city” and yours isn't in the list, a five-figure case walks to whoever is.",
    agencyCostMonthly: 2000,
    agencyCostLabel: "$1,500–$2,500/mo",
    playbook: [
      {
        title: "Keeps your Google Business Profile active",
        body: "Practice-area posts — injury, family, criminal defense, estate planning — published automatically so your profile signals an active, established firm.",
      },
      {
        title: "Adds LegalService schema to your site",
        body: "Structured data spelling out your practice areas, attorneys, location, and consultation info in the machine-readable format AI engines rely on.",
      },
      {
        title: "Builds content around real legal questions",
        body: "“What's my case worth?” “How long do I have to file?” AI engines cite firms that answer clearly. Alphaa creates that content — informational, not legal advice.",
      },
      {
        title: "Monitors AI recommendations for your practice areas",
        body: "Weekly queries to ChatGPT, Gemini, Perplexity, and Google AI about lawyers in your market — showing where you appear and which firms are being named instead.",
      },
      {
        title: "Audits your website's AI-readiness",
        body: "Finds missing schema, weak attorney bios, no llms.txt, and crawl issues that keep AI from confidently describing your firm.",
      },
      {
        title: "Keeps your review profile responsive",
        body: "Drafts measured, professional replies to Google reviews — because an actively managed profile is a credibility signal both clients and AI engines read.",
      },
    ],
    faq: [
      {
        q: "Is this compliant with attorney advertising rules?",
        a: "Alphaa publishes factual content about your firm and practice areas to your own website and Google profile — the same channels firms already use. You can review every post before it publishes. As with any marketing, final compliance responsibility with your state bar rests with the firm.",
      },
      {
        q: "Can you guarantee my firm gets recommended by ChatGPT?",
        a: "No — AI engines decide their own answers, and any vendor guaranteeing placement should worry you. Alphaa shapes the public signals engines read — content, structured data, an active Google profile, reviews — and tracks your visibility weekly.",
      },
      {
        q: "We already pay a legal marketing agency $2,000+/month. Why add this?",
        a: "Ask them what they're doing about ChatGPT and Gemini specifically. Most legal SEO agencies are still fighting the old Google war. Alphaa covers the AI-search flank for $99/month, no contract — many firms run both and compare after 60 days.",
      },
      {
        q: "How fast does this work for a competitive market like law?",
        a: "Legal is competitive, so expect the AI-visibility side to take 60+ days of consistent signals. Google Business Profile improvements land faster, often within days. Alphaa's weekly tracking shows you the trend either way — no mystery PDFs.",
      },
    ],
    relatedPostSlug: "get-recommended-by-ai-local-service-business",
  },
  {
    slug: "restaurants",
    noun: "restaurant",
    plural: "restaurants",
    examplePrompt: "where should we eat tonight?",
    painLine:
      "“Best tacos near me,” “romantic dinner spot,” “good place for a group of 8” — diners ask AI and get a shortlist of three. Every night your restaurant isn't on that shortlist, those tables fill up somewhere else, and you never know it happened.",
    agencyCostMonthly: 1250,
    agencyCostLabel: "$1,000–$1,500/mo",
    playbook: [
      {
        title: "Keeps your Google Business Profile sizzling",
        body: "New menu items, specials, events, happy hour — Alphaa posts to your profile on a steady schedule so it always looks alive when AI engines check.",
      },
      {
        title: "Adds Restaurant schema with menu data",
        body: "Structured data covering your cuisine, price range, hours, reservations, and menu — the exact format AI reads when someone asks “where should we eat?”",
      },
      {
        title: "Optimizes for occasion-based searches",
        body: "Date night, birthday dinner, kid-friendly, late-night — AI recommendations are driven by occasions. Alphaa builds content that matches how diners actually ask.",
      },
      {
        title: "Tracks what AI says about dining in your area",
        body: "Weekly checks of ChatGPT, Gemini, Perplexity, and Google AI for your cuisine and neighborhood — so you know when you're on the shortlist and when you're not.",
      },
      {
        title: "Finds the website gaps costing you covers",
        body: "Un-crawlable PDF menus, missing hours, no schema — Alphaa flags the technical issues that keep AI engines from recommending you.",
      },
      {
        title: "Keeps your review responses fresh",
        body: "Drafts friendly, on-brand replies to Google reviews automatically — recent, responded-to reviews are one of the strongest signals AI engines weigh.",
      },
    ],
    faq: [
      {
        q: "We're full on weekends already. Why do we need this?",
        a: "Weekends fill themselves — Tuesdays don't. AI recommendations drive the discretionary visits: the “where should we go tonight?” crowd, visitors from out of town, groups picking a spot. That's incremental covers on the nights you actually need them.",
      },
      {
        q: "Isn't Yelp and Instagram enough?",
        a: "They matter, but the discovery moment is moving. ChatGPT and Google AI now answer “where should we eat” directly, pulling from public signals — your Google profile, your website, your reviews. Alphaa makes sure those signals are strong; social alone doesn't.",
      },
      {
        q: "Can you guarantee AI will recommend my restaurant?",
        a: "No — AI engines make their own picks, and anyone promising otherwise is overselling. Alphaa does the work that influences those picks (fresh profile activity, schema, occasion-based content, review responses) and shows you your visibility every week.",
      },
      {
        q: "I run a restaurant — I don't have time for marketing software.",
        a: "That's the point. Setup takes about 2 minutes, then Alphaa posts, optimizes, and monitors on autopilot. You approve drafts from your phone if you want, or just let it run.",
      },
    ],
    relatedPostSlug: "ai-recommendations-for-restaurants",
  },
  {
    slug: "saas",
    noun: "SaaS company",
    plural: "SaaS companies",
    examplePrompt: "what's the best tool for managing client projects?",
    painLine:
      "B2B buyers now start their vendor shortlist by asking ChatGPT “what's the best tool for X” — and the three names in that answer get the demos. If AI doesn't mention you, you're not losing the deal at the pitch. You're losing it before the buyer knows you exist.",
    agencyCostMonthly: 3000,
    agencyCostLabel: "$3,000+/mo",
    playbook: [
      {
        title: "Builds comparison and alternative content",
        body: "“X vs Y” and “best tools for [job]” pages are what AI engines cite when recommending software. Alphaa identifies the gaps and generates the content plan.",
      },
      {
        title: "Adds SoftwareApplication schema",
        body: "Structured data covering your product category, pricing, and features — so AI engines can describe your product accurately instead of guessing or skipping you.",
      },
      {
        title: "Creates an llms.txt for your product",
        body: "A machine-readable summary of what your product does, who it's for, and how it's priced — served exactly where AI crawlers look for it.",
      },
      {
        title: "Tracks your share of AI recommendations",
        body: "Weekly queries to ChatGPT, Gemini, Perplexity, and Google AI for your category — showing when you're named, how you're described, and which competitors own the answer.",
      },
      {
        title: "Audits your site the way AI crawlers see it",
        body: "JavaScript-hidden content, thin docs, missing metadata — Alphaa finds what keeps engines from parsing your product story and tells you how to fix it.",
      },
      {
        title: "Monitors how AI describes your competitors",
        body: "See the exact language engines use to recommend rivals in your category — and what public signals are earning them that spot.",
      },
    ],
    faq: [
      {
        q: "We do content marketing already. How is this different?",
        a: "Traditional content targets Google rankings. AI engines cite differently — they favor clear comparison pages, structured data, consistent product descriptions across the web, and llms.txt. Alphaa optimizes specifically for how answer engines select and cite sources, and measures your presence in actual AI answers.",
      },
      {
        q: "Can you guarantee ChatGPT recommends our product?",
        a: "No — and in B2B SaaS especially, be wary of anyone selling guaranteed AI placement. Engines choose their own answers. Alphaa shapes the public signals they read and gives you weekly tracking of your category queries, so you see your trend line, not promises.",
      },
      {
        q: "Our agency charges $3,000+/month. Does Alphaa replace them?",
        a: "For AI search visibility specifically, Alphaa covers at $99/month what most agencies either don't offer or bolt on at a premium. Plenty of teams keep their agency for brand and paid, and use Alphaa for the answer-engine layer. No contract, so testing it is cheap.",
      },
      {
        q: "We sell globally, not locally. Does Alphaa still apply?",
        a: "Yes. Local features like Google Business Profile matter less for SaaS, but the core levers — comparison content, schema, llms.txt, consistent product descriptions, AI visibility tracking — are exactly how B2B products get into AI shortlists worldwide.",
      },
    ],
    relatedPostSlug: "aeo-for-saas-b2b",
  },
]

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug)
}
