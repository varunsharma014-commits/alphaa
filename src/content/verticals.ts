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
  /** 5–6 vertical-specific things the Alphaa agent does across marketing */
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
      "Patients pick a dentist from what they see online: a Google profile that looks active, recent review replies, clear answers on your website, and whether ChatGPT or Google names you when they ask. Keeping all of that going takes hours you spend in the chair instead. When it slips, new patients quietly book with the office down the street.",
    agencyCostMonthly: 2000,
    agencyCostLabel: "$1,500–$2,500/mo",
    playbook: [
      {
        title: "Posts to your social accounts (Growth)",
        body: "Smile tips, new-patient offers, team moments. Posts and branded images written in your voice for you to approve. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Keeps your Google profile busy",
        body: "Fresh Google Business Profile posts about cleanings, implants and emergency visits, on a steady schedule. Patients see an active practice before they call.",
      },
      {
        title: "Writes blogs patients actually read",
        body: "“Does it hurt?” “Do you take my insurance?” “How much is a crown?” Clear posts in your voice that answer real patient questions and bring in search traffic.",
      },
      {
        title: "Replies to every Google review",
        body: "Warm, professional reply drafts for each new review, so your profile reads cared-for. You approve with one tap.",
      },
      {
        title: "Gets you found on Google and AI search",
        body: "Dentist schema, website fixes and weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about dentists near you, so you can see where you stand.",
      },
      {
        title: "Runs ads and emails that fill the chair (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, plus emails that bring overdue patients back for a cleaning. Early access on Growth; ad spend goes to Google and Meta directly, never marked up.",
      },
    ],
    faq: [
      {
        q: "What does the AI agent actually do for my practice?",
        a: "It runs the marketing you never have time for: Google posts, blog posts, review replies, website fixes and SEO and AI search checks on every plan. On Growth (early access) it also drafts social posts, builds Google and Meta ads and writes emails to past patients. You get a weekly briefing and approve anything with one tap.",
      },
      {
        q: "I already pay a dental marketing agency. Why switch?",
        a: "Dental agencies typically charge $1,500–$2,500/month. Alphaa starts at $99/month with no contract. Many practices run both for a month, compare what actually got done, then keep whichever is working.",
      },
      {
        q: "Can you guarantee I show up on ChatGPT?",
        a: "Nobody controls AI answers, so nobody can promise a spot. Alphaa strengthens the signals those engines read and checks your visibility every week. If no AI names you by day 90 with weekly checks active, next month is free.",
      },
      {
        q: "How much of my time does this take?",
        a: "About 2 minutes to get started: connect your Google Business Profile and tell the agent about your practice. After that it drafts the work and you approve what goes out. No marketing knowledge required.",
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
      "Med spa clients research hard before they book. They scroll your Instagram, read your Google reviews, check your treatment pages and ask ChatGPT who's reputable nearby. If any of those look quiet, a client worth thousands in lifetime value books with a competitor, and you never see it happen.",
    agencyCostMonthly: 2000,
    agencyCostLabel: "$1,500–$2,500/mo",
    playbook: [
      {
        title: "Creates your social posts (Growth)",
        body: "Treatment spotlights, seasonal offers and membership promos, written in your voice with branded images. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Publishes treatment-focused Google posts",
        body: "Botox, fillers, laser, microneedling, memberships. Your Google Business Profile keeps posting about what clients search for, without you lifting a finger.",
      },
      {
        title: "Writes blogs around real client questions",
        body: "“How long does Botox last?” “What's the downtime?” “Is it safe?” Clear answers in your voice that build trust before the consult.",
      },
      {
        title: "Answers every review",
        body: "Warm, on-brand reply drafts for each Google review so your profile signals an engaged, trusted practice. Approve with one tap.",
      },
      {
        title: "Gets you found on Google and AI search",
        body: "Schema for your treatments, website fixes, and weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about med spas in your area.",
      },
      {
        title: "Brings clients back with ads and email (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, and emails that remind past clients it's time to rebook. Early access on Growth; ad spend is paid to Google and Meta directly.",
      },
    ],
    faq: [
      {
        q: "My clients come from Instagram. Is this just about AI search?",
        a: "No. Alphaa is an AI agent that runs your marketing: Google posts, blogs, review replies and SEO and AI search on every plan, social posts on Pro, and ads and email on Growth (early access). Instagram builds desire; Google and AI search are often where the booking decision gets made. You want to show up in both.",
      },
      {
        q: "How is this different from my med spa marketing agency?",
        a: "Agencies typically charge $1,500–$2,500/month and lock you into a contract. Alphaa starts at $99/month, no contract, and does the work every week. Many med spas run both for a month and compare.",
      },
      {
        q: "Can you promise I'll be the top recommendation?",
        a: "No. AI engines and Google decide their own results, and anyone promising a guaranteed spot is overselling. Alphaa does the work that influences them and shows you your trend week over week. If no AI names you by day 90 with weekly checks active, next month is free.",
      },
      {
        q: "How much of my time does this take?",
        a: "About 2 minutes to get started. After that the agent drafts posts, blogs and replies, and you approve with one tap or let it run.",
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
      "HVAC is an emergency business. When a furnace dies at 11pm, homeowners grab their phone, check Google, glance at reviews or ask AI who to call, and take the first credible answer. You're on rooftops all day, so the marketing slides. That's a service call, and maybe a $12,000 system replacement, going to someone else.",
    agencyCostMonthly: 1250,
    agencyCostLabel: "$1,000–$1,500/mo",
    playbook: [
      {
        title: "Posts your jobs to social (Growth)",
        body: "Seasonal tune-up reminders, before-and-after installs, financing offers. Written in your voice with branded images. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Keeps your Google profile posting",
        body: "Tune-ups, emergency repair, new installs and financing. Fresh Google Business Profile posts so homeowners see an active company when they search.",
      },
      {
        title: "Writes blogs homeowners search for",
        body: "“Why is my AC blowing warm air?” “How much does a new furnace cost?” Helpful posts in your voice that bring in local search traffic.",
      },
      {
        title: "Replies to your reviews",
        body: "Reply drafts for every Google review, so your profile shows a responsive company. Approve from the truck with one tap.",
      },
      {
        title: "Gets you found on Google and AI search",
        body: "HVACBusiness schema, service-area fixes on your site, and weekly checks of who ChatGPT, Gemini, Claude and Perplexity recommend for HVAC near you.",
      },
      {
        title: "Fills slow weeks with ads and email (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, plus maintenance reminder emails to past customers. Early access on Growth; ad spend goes to Google and Meta directly, never marked up.",
      },
    ],
    faq: [
      {
        q: "What does the AI agent actually do for my HVAC company?",
        a: "It runs your marketing while you run jobs: Google posts, blogs, review replies, website fixes and SEO and AI search checks on every plan. On Growth (early access) it also drafts social posts, builds Google and Meta ads and writes tune-up reminder emails. You get a weekly briefing and approve with one tap.",
      },
      {
        q: "I pay a marketing company $1,200/month. Is this the same thing?",
        a: "Local HVAC retainers typically run $1,000–$1,500/month. Alphaa starts at $99/month with no contract. Run both for a month and keep whichever gets more done.",
      },
      {
        q: "Will this get me more emergency calls?",
        a: "No honest company can guarantee call volume. What Alphaa does is keep the signals homeowners and search engines check (your Google profile, reviews, website, AI answers) strong every week, so you're a credible pick when the AC dies.",
      },
      {
        q: "How fast will I see something change?",
        a: "Google Business Profile activity shows right away. Search and AI answers refresh more slowly, often 30–60 days. Alphaa checks weekly so you can watch the trend.",
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
      "Nobody comparison-shops with water pouring through the ceiling. They check Google, scan the reviews or ask AI, and call the first name that looks trustworthy. If your profile is quiet and your reviews go unanswered because you're under a sink all day, that emergency job goes to someone else.",
    agencyCostMonthly: 1250,
    agencyCostLabel: "$1,000–$1,500/mo",
    playbook: [
      {
        title: "Posts to your social accounts (Growth)",
        body: "Job photos, seasonal tips and offers, written in your voice with branded images. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Keeps your Google profile fresh",
        body: "Emergency service, drain cleaning, water heaters, repiping. Regular Google Business Profile posts so you look open for business every time someone searches.",
      },
      {
        title: "Writes blogs that answer homeowner questions",
        body: "“Why is my water heater leaking?” “What does a repipe cost?” Plain-English posts in your voice that bring in search traffic.",
      },
      {
        title: "Replies to every review",
        body: "Professional reply drafts for each Google review, keeping your profile active and trustworthy. Approve with one tap.",
      },
      {
        title: "Gets you found on Google and AI search",
        body: "Plumber schema, website fixes and weekly checks of who ChatGPT, Gemini, Claude and Perplexity recommend for plumbers near you.",
      },
      {
        title: "Runs ads and repeat-customer emails (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, plus emails that bring past customers back. Early access on Growth; ad spend is paid to Google and Meta directly.",
      },
    ],
    faq: [
      {
        q: "What does the AI agent actually do for a plumber?",
        a: "It handles the marketing you don't have time for: Google posts, blogs, review replies, website fixes and SEO and AI search checks on every plan. On Growth (early access) it also drafts social posts, builds Google and Meta ads and writes emails to past customers.",
      },
      {
        q: "What does this cost compared to my current marketing?",
        a: "Local marketing retainers for plumbers typically run $1,000–$1,500/month. Alphaa starts at $99/month, no contract, cancel anytime.",
      },
      {
        q: "Can you guarantee I'll get recommended?",
        a: "No, and be wary of anyone who says yes. Google and AI engines decide their own results. Alphaa strengthens the signals they read and checks your visibility weekly. If no AI names you by day 90 with weekly checks active, next month is free.",
      },
      {
        q: "I'm on jobs all day. How much work is this for me?",
        a: "About 2 minutes to get started. Then the agent drafts the work and sends you a weekly briefing. Approve with one tap, or let it run.",
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
      "Legal clients are high-stakes and high-value, and they vet firms online before they ever call: your Google profile, your reviews, your practice-area pages and what ChatGPT says about firms in your city. Billable hours leave no time to keep all that current. When it goes stale, a five-figure case walks to the firm that looks more established.",
    agencyCostMonthly: 2000,
    agencyCostLabel: "$1,500–$2,500/mo",
    playbook: [
      {
        title: "Drafts your social posts (Growth)",
        body: "Practice-area explainers and firm news for LinkedIn and Facebook, written in your voice for you to review. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Keeps your Google profile active",
        body: "Practice-area posts on injury, family, criminal defense and estate planning, published on schedule so your firm looks active and established.",
      },
      {
        title: "Writes blogs around real legal questions",
        body: "“What's my case worth?” “How long do I have to file?” Clear, informational posts in your voice. Not legal advice, and you review every one.",
      },
      {
        title: "Replies to reviews with care",
        body: "Measured, professional reply drafts for each Google review. You approve every reply before it goes out.",
      },
      {
        title: "Gets you found on Google and AI search",
        body: "LegalService schema, website fixes and weekly checks of what ChatGPT, Gemini, Claude and Perplexity say about lawyers in your market.",
      },
      {
        title: "Runs ads and client emails (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, plus emails that keep past clients and referrers in touch. Early access on Growth; ad spend goes to Google and Meta directly, never marked up.",
      },
    ],
    faq: [
      {
        q: "Is this compliant with attorney advertising rules?",
        a: "Alphaa drafts factual content about your firm and practice areas for your own website, Google profile and (on Pro) social accounts, the same channels firms already use. You can review everything before it publishes. As with any marketing, final compliance responsibility with your state bar rests with the firm.",
      },
      {
        q: "What does the AI agent actually do for my firm?",
        a: "Google posts, blog posts, review replies, website fixes and SEO and AI search checks on every plan. On Growth (early access) it also drafts social posts, builds Google and Meta ads and writes client emails. You get a weekly briefing and approve with one tap.",
      },
      {
        q: "We already pay a legal marketing agency $2,000+/month. Why switch?",
        a: "Legal agencies typically charge $1,500–$2,500/month. Alphaa starts at $99/month with no contract. Many firms run both for 60 days and compare what actually got done.",
      },
      {
        q: "Can you guarantee my firm gets recommended by ChatGPT?",
        a: "No. AI engines decide their own answers, and any vendor guaranteeing placement should worry you. Legal is competitive, so expect 60+ days of consistent work. Alphaa tracks your visibility weekly, and if no AI names you by day 90 with weekly checks active, next month is free.",
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
      "“Best tacos near me,” “romantic dinner spot,” “good place for a group of 8.” Diners decide from your Instagram, your Google profile, your reviews and the shortlist AI gives them. You're running a kitchen, so the posting and replying falls behind. Every night you're not on their radar, those tables fill up somewhere else.",
    agencyCostMonthly: 1250,
    agencyCostLabel: "$1,000–$1,500/mo",
    playbook: [
      {
        title: "Posts your specials to social (Growth)",
        body: "New dishes, events and happy hour, written in your voice with branded images. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Keeps your Google profile sizzling",
        body: "Menu items, specials, events and hours, posted to your Google Business Profile on a steady schedule so it always looks alive.",
      },
      {
        title: "Writes blogs for how diners search",
        body: "Date night, birthday dinner, kid-friendly, late night. Posts in your voice that match the occasions people actually search for.",
      },
      {
        title: "Replies to every review",
        body: "Friendly, on-brand reply drafts for each Google review. Approve from your phone between services.",
      },
      {
        title: "Gets you found on Google and AI search",
        body: "Restaurant schema with menu data, fixes for un-crawlable PDF menus, and weekly checks of what ChatGPT, Gemini, Claude and Perplexity recommend in your area.",
      },
      {
        title: "Fills quiet nights with ads and email (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, plus emails that bring regulars back on slow nights. Early access on Growth; ad spend is paid to Google and Meta directly.",
      },
    ],
    faq: [
      {
        q: "We're full on weekends already. Why do we need this?",
        a: "Weekends fill themselves. Tuesdays don't. Steady Google posts, fresh review replies, social posts (on Pro) and emails to regulars (on Growth) drive the discretionary visits: out-of-towners, groups picking a spot, the “where should we go tonight?” crowd.",
      },
      {
        q: "What does the AI agent actually do for my restaurant?",
        a: "Google posts, blog posts, review replies, website fixes and SEO and AI search checks on every plan. On Growth (early access) it also drafts social posts, builds Google and Meta ads and writes emails to regulars. You get a weekly briefing and approve with one tap.",
      },
      {
        q: "Can you guarantee AI will recommend my restaurant?",
        a: "No. Google and AI engines make their own picks. Alphaa does the work that influences them and shows you your visibility every week. If no AI names you by day 90 with weekly checks active, next month is free.",
      },
      {
        q: "I run a restaurant. I don't have time for marketing software.",
        a: "That's the point. About 2 minutes to get started, then the agent drafts the work and you approve from your phone, or just let it run.",
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
      "B2B buyers build their shortlist from what they find: comparison posts, LinkedIn, Google results and what ChatGPT says when they ask “what's the best tool for X.” Small teams ship product instead of content, so the marketing stalls. The vendors who show up get the demos, and you lose deals before buyers know you exist.",
    agencyCostMonthly: 3000,
    agencyCostLabel: "$3,000+/mo",
    playbook: [
      {
        title: "Drafts your LinkedIn and social posts (Growth)",
        body: "Product updates, customer problems and founder takes, written in your voice. Early access on Growth; direct posting opens as Meta and LinkedIn approve.",
      },
      {
        title: "Writes comparison and alternative blogs",
        body: "“X vs Y” and “best tools for [job]” posts are what buyers read and what Google and AI engines cite. Alphaa finds the gaps and writes them in your voice.",
      },
      {
        title: "Fixes your site for search crawlers",
        body: "SoftwareApplication schema, an llms.txt, metadata and JavaScript-hidden content. The quiet issues that keep Google and AI from describing your product properly.",
      },
      {
        title: "Tracks your share of AI recommendations",
        body: "Weekly checks of ChatGPT, Gemini, Claude and Perplexity for your category, showing when you're named, how you're described and which competitors own the answer.",
      },
      {
        title: "Sends you a weekly marketing briefing",
        body: "What got published, what moved and what to do next, in plain English. Approve the next batch with one tap.",
      },
      {
        title: "Runs ads and nurture emails (Growth)",
        body: "Google and Meta ads built paused until you approve the budget, plus emails that bring trial users and past leads back. Early access on Growth; ad spend goes to Google and Meta directly, never marked up.",
      },
    ],
    faq: [
      {
        q: "We do content marketing already. How is this different?",
        a: "Alphaa is an AI agent that runs the work end to end: blogs, comparison pages, website fixes, SEO and AI search tracking on every plan, social posts on Pro, and ads and email on Growth (early access). It also measures whether you're named in real AI answers, which most content programs don't.",
      },
      {
        q: "Our agency charges $3,000+/month. Does Alphaa replace them?",
        a: "Alphaa starts at $99/month with no contract. Some teams keep their agency for brand work and use Alphaa for the weekly content and search grind. Testing it is cheap.",
      },
      {
        q: "Can you guarantee ChatGPT recommends our product?",
        a: "No. Engines choose their own answers, so be wary of anyone selling guaranteed AI placement. Alphaa shapes the public signals they read and tracks your category queries weekly. If no AI names you by day 90 with weekly checks active, next month is free.",
      },
      {
        q: "We sell globally, not locally. Does Alphaa still apply?",
        a: "Yes. Google Business Profile matters less for SaaS, but comparison content, schema, llms.txt, social posts and AI visibility tracking work the same worldwide.",
      },
    ],
    relatedPostSlug: "aeo-for-saas-b2b",
  },
]

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug)
}
