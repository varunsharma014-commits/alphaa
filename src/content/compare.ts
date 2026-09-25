// "Vs" pages at /compare/[slug]. Written for buyers and for AI engines alike:
// a ~50-word direct answer up top, an HTML comparison table, a fair "what they're good at",
// question-shaped sections and an FAQ (emitted as FAQPage JSON-LD).
// Competitor facts come from their own public pages — keep `sources` and `checked` current.

export type CompareKind = "alternative" | "concept" | "tool"

export type Compare = {
  slug: string
  kind: CompareKind
  /** Short label for hub cards and related links. */
  label: string
  /** Column headings, left then right. For "alternative"/"tool" pages the right column is Alphaa. */
  left: string
  right: string
  metaTitle: string
  description: string
  h1: string
  h1Quiet: string
  tldr: string
  rows: [string, string, string][]
  leftGood: { title: string; points: string[] }
  rightGood: { title: string; points: string[] }
  chooseLeft: string[]
  chooseRight: string[]
  sections: { q: string; a: string[] }[]
  faq: { q: string; a: string }[]
  sources: { label: string; url: string }[]
  /** Longer blog post on the same topic, if one exists. */
  deepDive?: string
  /** Show the $24,000 vs $1,188 price block. */
  priceBlock?: boolean
}

export const COMPARE_CHECKED = "2026-09-25"

const ALPHAA_PRICE = "$99, $199 or $299 a month, month to month, no contract"
const ALPHAA_DOES =
  "Asks ChatGPT, Gemini, Claude and Perplexity your customers’ questions every week, checks 23 things AI reads on your site, then writes the fixes — FAQs, structured data, llms.txt, Google posts, review replies — for you to approve"

export const COMPARES: Compare[] = [
  // ─── Category 1: the old way of doing things ───────────────────────────
  {
    slug: "alphaa-vs-seo-agency",
    kind: "alternative",
    label: "Alphaa vs. SEO agencies",
    left: "SEO agency",
    right: "Alphaa",
    metaTitle: "Alphaa vs. a Traditional SEO Agency (2026): Cost, Contracts & AI Search",
    description:
      "An honest comparison of a ~$2,000/month local SEO agency and Alphaa, the AI agent that gets local businesses recommended by ChatGPT, Gemini, Claude and Perplexity for $99/month.",
    h1: "Alphaa vs. an SEO agency.",
    h1Quiet: "$24,000 a year, or $1,188.",
    tldr:
      "The main difference between Alphaa and a traditional SEO agency is who does the work and for which search engine. An agency sells monthly hours, usually on a contract, mostly aimed at Google rankings. Alphaa is an AI agent that works every week to get you named in ChatGPT, Gemini, Claude and Perplexity answers, from $99 a month.",
    rows: [
      ["Typical price", "Around $2,000/month ($24,000/year); varies widely", "$99/month ($1,188/year). Pro $199, Full Service $299"],
      ["Contract", "Often 6–12 months", "Month to month. Cancel in two clicks"],
      ["Main target", "Google blue-link rankings and Maps", "Being named in ChatGPT, Gemini, Claude and Perplexity answers"],
      ["Who does the work", "Account manager + specialists, a few hours a month", "An AI agent, every week. You approve anything public"],
      ["Checks AI answers", "Rarely, and usually by hand", "Every week, across four AI assistants"],
      ["What you get each month", "A report and a call", "Finished work: posts, FAQs, structured data, llms.txt, review replies"],
      ["Speed", "Waits for the next sprint or meeting", "Starts in minutes; weekly cycle"],
      ["Link building & PR", "Yes — a real strength", "No"],
      ["Website redesigns & ads", "Often offered", "No"],
    ],
    leftGood: {
      title: "What a good agency does well",
      points: [
        "Human strategy for competitive, high-budget markets.",
        "Link building, digital PR and outreach — work software can’t do.",
        "Site rebuilds, paid ads and big technical projects.",
        "One throat to choke when you want someone accountable.",
      ],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: [
        "Built for AI answers first, not ten blue links.",
        "It does the work instead of reporting on it.",
        "Checks ChatGPT, Gemini, Claude and Perplexity every week.",
        "About a twentieth of the price, with no contract.",
      ],
    },
    chooseLeft: [
      "You need links, PR, a new website or paid ads managed.",
      "You’re in a very competitive market with a budget to match.",
      "You want a person on a monthly call.",
    ],
    chooseRight: [
      "You want to be the business AI recommends in your area.",
      "You’d rather see finished work than a report.",
      "You don’t want a 12-month contract.",
    ],
    sections: [
      {
        q: "What does a $2,000-a-month SEO agency retainer pay for?",
        a: [
          "Mostly people’s hours: an account manager, some keyword research, a few blog posts, technical fixes and a monthly report. An Ahrefs survey of 439 SEO providers found agencies averaged around $3,209 a month, so ~$2,000 is a normal local-business retainer.",
          "Most of those hours go to Google rankings. Very few agencies check what ChatGPT or Perplexity say about you, because it isn’t in the report yet.",
        ],
      },
      {
        q: "Why does AI search change the agency model?",
        a: [
          "AI assistants don’t show ten links. They name two or three businesses. What decides that is readable facts on your site, structured data, reviews AI can read, consistent profiles and fresh answers to real questions — repeatable work an agent can do every week.",
          "That’s why Alphaa can cost $99. The repeatable work is done by software; a person only steps in on Full Service, to install things on your site.",
        ],
      },
      {
        q: "Can I use both an agency and Alphaa?",
        a: [
          "Yes. Plenty of owners keep an agency for links or ads and use Alphaa for AI answers. Alphaa’s weekly note shows which AI assistants name you and why, which also keeps the agency honest.",
        ],
      },
    ],
    faq: [
      { q: "Is Alphaa cheaper than an SEO agency?", a: "Yes. A typical local SEO agency retainer is around $2,000 a month ($24,000 a year). Alphaa starts at $99 a month ($1,188 a year), which saves up to $22,800 a year." },
      { q: "Does Alphaa require a contract?", a: "No. Alphaa is month to month and you can cancel in two clicks. Many agencies ask for 6 to 12 months." },
      { q: "Do SEO agencies optimize for ChatGPT?", a: "Some are starting to, but most agency work and reporting is still built around Google rankings. Alphaa checks ChatGPT, Gemini, Claude and Perplexity every week and fixes what stops them naming you." },
      { q: "Can Alphaa replace my SEO agency?", a: "For AI visibility, Google Business Profile posts, FAQs, structured data and review replies, yes. For link building, PR, website redesigns or paid ads, keep a specialist." },
      { q: "Who publishes changes to my website?", a: "You approve everything public. On Starter and Pro you publish with one tap or send it to your web person. On Full Service, a person on our team installs it for you." },
    ],
    sources: [
      { label: "Ahrefs: SEO pricing survey of 439 providers", url: "https://ahrefs.com/blog/seo-pricing/" },
    ],
    deepDive: "alphaa-vs-seo-agencies",
    priceBlock: true,
  },
  {
    slug: "alphaa-vs-freelance-seo",
    kind: "alternative",
    label: "Alphaa vs. freelance SEOs",
    left: "Freelance SEO",
    right: "Alphaa",
    metaTitle: "Alphaa vs. Hiring a Freelance SEO (2026): Cost, Speed & AI Search",
    description:
      "Freelance SEO or an AI agent? Compare cost, turnaround, coverage and AI-search expertise for local businesses deciding between a freelancer and Alphaa.",
    h1: "Alphaa vs. a freelance SEO.",
    h1Quiet: "One person’s hours, or an agent that never stops.",
    tldr:
      "The main difference between Alphaa and a freelance SEO is coverage. A freelancer sells a limited number of hours, usually focused on Google, and works when they’re available. Alphaa is an AI agent that checks ChatGPT, Gemini, Claude and Perplexity every week and writes the fixes for you, from $99 a month with no contract.",
    rows: [
      ["Typical price", "Around $1,348/month on average (hourly or retainer)", "$99/month. Pro $199, Full Service $299"],
      ["Availability", "Their working hours, shared with other clients", "Runs every week, whenever you open it"],
      ["Main target", "Usually Google rankings", "AI answers: ChatGPT, Gemini, Claude, Perplexity"],
      ["AI answer tracking", "Usually manual, if at all", "Weekly, four AI assistants, with sources"],
      ["Output", "Depends on the person", "Posts, FAQs, structured data, llms.txt, review replies — for approval"],
      ["If they leave", "Knowledge goes with them", "History and fixes stay in your account"],
      ["Custom one-off projects", "Yes — flexible", "No; focused on AI visibility"],
    ],
    leftGood: {
      title: "What a good freelancer does well",
      points: [
        "Flexible, custom work on your exact problem.",
        "Cheaper than an agency for a hands-on specialist.",
        "Can build links and handle one-off site projects.",
      ],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: [
        "Works every week without chasing anyone.",
        "Built around AI answers, not just Google.",
        "Shows you exactly what each AI said, with sources.",
        "A fraction of the average freelance retainer.",
      ],
    },
    chooseLeft: [
      "You need a one-off project: migration, site audit, link campaign.",
      "You want a specific person’s judgement on hand.",
    ],
    chooseRight: [
      "You want ongoing AI visibility work done every week.",
      "You don’t want to manage or chase a contractor.",
      "Budget matters: $99 vs. ~$1,348 a month.",
    ],
    sections: [
      {
        q: "How much does a freelance SEO cost?",
        a: [
          "Ahrefs’ survey of 439 SEO providers put the average freelancer retainer around $1,348 a month, with hourly rates varying widely by experience and location.",
        ],
      },
      {
        q: "Is AEO a job for a freelancer or an agent?",
        a: [
          "Most AI-visibility work is repeatable: ask the AI assistants, check the site, fix the facts, keep answers fresh. That suits an agent that runs every week. Judgement-heavy one-offs still suit a person.",
        ],
      },
    ],
    faq: [
      { q: "Is Alphaa cheaper than a freelance SEO?", a: "Usually. Ahrefs found freelance SEO retainers average around $1,348 a month. Alphaa starts at $99 a month, month to month." },
      { q: "Can a freelancer do AEO?", a: "Some can, but it’s mostly manual: typing questions into ChatGPT and writing up what they see. Alphaa checks four AI assistants every week automatically and drafts the fixes." },
      { q: "Should I fire my freelancer?", a: "Not necessarily. Keep them for one-off projects or links, and let Alphaa handle the weekly AI-visibility work." },
      { q: "Do I need technical skills to use Alphaa?", a: "No. Alphaa writes the fixes and you approve them. On Full Service, a person on our team installs them for you." },
    ],
    sources: [{ label: "Ahrefs: SEO pricing survey of 439 providers", url: "https://ahrefs.com/blog/seo-pricing/" }],
    priceBlock: false,
  },

  // ─── Category 2: the paradigm shift ───────────────────────────────────
  {
    slug: "seo-vs-aeo",
    kind: "concept",
    label: "SEO vs. AEO",
    left: "SEO",
    right: "AEO",
    metaTitle: "SEO vs. AEO (Answer Engine Optimization): What’s the Difference in 2026?",
    description:
      "SEO earns you a link in a list. AEO earns you the answer. A plain-English comparison of search engine optimization and answer engine optimization for local businesses.",
    h1: "SEO vs. AEO.",
    h1Quiet: "Ranking for links vs. being the answer.",
    tldr:
      "SEO (search engine optimization) helps your pages rank in a list of links on Google. AEO (answer engine optimization) helps AI assistants like ChatGPT, Gemini, Claude and Perplexity pick your business as the answer. They share foundations, but AEO rewards clear facts, structured data, direct answers and consistent third-party mentions over keywords and position.",
    rows: [
      ["Goal", "Rank high in a list of links", "Be named in the answer itself"],
      ["Where it shows", "Google and Bing results pages", "ChatGPT, Gemini, Claude, Perplexity, AI Overviews"],
      ["What the user sees", "10 links and ads", "Usually 1–3 named businesses"],
      ["Main signals", "Keywords, backlinks, page experience", "Readable facts, structured data, direct answers, reviews, mentions"],
      ["Success metric", "Rank position, clicks", "How often AI names you, and what it says"],
      ["Content shape", "Long pages targeting keywords", "Question headings with answer-first paragraphs"],
      ["How you measure it", "Search Console, rank trackers", "Asking the AI assistants the real questions, regularly"],
    ],
    leftGood: {
      title: "SEO still matters because",
      points: [
        "Google still sends a lot of traffic.",
        "AI engines often read the pages search engines rank.",
        "Crawlability, speed and clean HTML help both.",
      ],
    },
    rightGood: {
      title: "AEO matters now because",
      points: [
        "Customers ask AI for “the best dentist near me”.",
        "AI names a few businesses, not ten.",
        "If AI can’t read your facts, it names a rival.",
      ],
    },
    chooseLeft: ["Focus on SEO when most of your leads come from Google clicks today."],
    chooseRight: ["Add AEO when customers ask AI for recommendations in your category — which is most local categories in 2026."],
    sections: [
      {
        q: "Is AEO replacing SEO?",
        a: [
          "No — AEO is built on top of SEO. AI assistants still need to crawl and trust your site. What changes is the finish line: instead of a click from position three, you want to be the name in the answer.",
        ],
      },
      {
        q: "What does AEO work actually involve?",
        a: [
          "Letting AI crawlers in, putting your name, services, area, phone and hours in readable text and LocalBusiness structured data, writing question-and-answer content, getting reviews AI can read, keeping profiles consistent, and publishing an llms.txt file.",
        ],
      },
      {
        q: "Where does Alphaa fit?",
        a: [
          "Alphaa is an AI agent that does AEO for local businesses. It checks what ChatGPT, Gemini, Claude and Perplexity say about you every week, checks 23 things AI reads on your site, and writes the fixes for you to approve, from $99 a month.",
        ],
      },
    ],
    faq: [
      { q: "What is AEO?", a: "AEO, or answer engine optimization, is making your business easy for AI assistants such as ChatGPT, Gemini, Claude and Perplexity to understand, trust and name in their answers." },
      { q: "What is the difference between SEO and AEO?", a: "SEO aims to rank a page in a list of links. AEO aims to get your business named in the answer an AI assistant gives. AEO leans more on clear facts, structured data and direct answers." },
      { q: "Do I still need SEO if I do AEO?", a: "Yes. AI assistants read the web, so crawlable, fast, well-structured pages help both. AEO adds the work that gets you picked as the answer." },
      { q: "How do I check my AEO?", a: "Ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask and see who gets named. Alphaa’s free scan at alphaa.app/start does this for you." },
    ],
    sources: [
      { label: "Google: AI features and your website", url: "https://developers.google.com/search/docs/appearance/ai-features" },
      { label: "Google: Introduction to structured data", url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data" },
    ],
    deepDive: "seo-vs-aeo-vs-geo",
  },
  {
    slug: "local-seo-vs-geo",
    kind: "concept",
    label: "Local SEO vs. GEO",
    left: "Local SEO",
    right: "GEO",
    metaTitle: "Local SEO vs. GEO (Generative Engine Optimization): Why Your Google Profile Isn’t Enough",
    description:
      "Local SEO gets you into the Google Map Pack. GEO gets you named by ChatGPT, Gemini, Claude and Perplexity. Here’s how they differ and what local businesses should do.",
    h1: "Local SEO vs. GEO.",
    h1Quiet: "The Map Pack is no longer the only map.",
    tldr:
      "Local SEO gets your business into Google Maps and the local pack, mostly through your Google Business Profile, reviews and citations. GEO (generative engine optimization) gets you named when someone asks ChatGPT, Gemini, Claude or Perplexity for a local recommendation. GEO reads your website, reviews and third-party mentions, not just your Google profile.",
    rows: [
      ["Where it shows", "Google Maps and the local 3-pack", "AI answers in ChatGPT, Gemini, Claude, Perplexity"],
      ["Core asset", "Google Business Profile", "Your website’s readable facts + profiles across the web"],
      ["Key signals", "Proximity, relevance, reviews, citations", "Clear facts, structured data, reviews AI can read, mentions, freshness"],
      ["Who reads it", "Google’s local algorithm", "Several different AI models, each with its own sources"],
      ["What the customer sees", "Map pins and star ratings", "A written recommendation naming 1–3 businesses"],
      ["Typical tools", "GBP, citation builders, rank grids", "AI answer tracking, schema, llms.txt, answer-first content"],
    ],
    leftGood: {
      title: "Local SEO is still the base",
      points: [
        "Your Google Business Profile still drives calls and directions.",
        "Consistent name, address and phone feeds AI too.",
        "Reviews help on both.",
      ],
    },
    rightGood: {
      title: "GEO covers what it misses",
      points: [
        "ChatGPT and Claude don’t read your Google profile directly.",
        "AI leans heavily on your own site and third-party pages.",
        "You need to know what each AI actually says.",
      ],
    },
    chooseLeft: ["Start with local SEO if your Google Business Profile isn’t claimed and complete."],
    chooseRight: ["Add GEO once it is — that’s where most local businesses are missing out today."],
    sections: [
      {
        q: "Why isn’t a Google Business Profile enough anymore?",
        a: [
          "Your Google profile lives inside Google. ChatGPT, Claude and Perplexity build answers from the open web — your site, review sites, directories and articles. If those don’t state your facts clearly, the AI names a competitor whose facts it can read.",
        ],
      },
      {
        q: "How do LLMs read local businesses differently?",
        a: [
          "Instead of ranking pins by distance, an LLM writes a recommendation. It looks for clear evidence of what you do, where, for whom, and whether people trust you — then names a few businesses it’s confident about.",
        ],
      },
      {
        q: "Where does Alphaa fit?",
        a: [
          "Alphaa covers both sides for local businesses: it drafts Google Business Profile posts and review replies, and does the GEO work — weekly AI answer checks, 23 site checks, structured data, FAQs and llms.txt. From $99 a month.",
        ],
      },
    ],
    faq: [
      { q: "What is GEO?", a: "GEO, or generative engine optimization, is getting your business cited or named in answers written by generative AI such as ChatGPT, Gemini, Claude and Perplexity." },
      { q: "Is GEO the same as local SEO?", a: "No. Local SEO targets Google Maps and the local pack. GEO targets AI-written answers, which draw on your website and third-party sources, not only your Google profile." },
      { q: "Does ChatGPT use Google Business Profile?", a: "Not directly. ChatGPT builds answers from web sources it can access, so your website, reviews and directory listings matter a lot." },
      { q: "Do I need both local SEO and GEO?", a: "Yes for most local businesses. Local SEO keeps you on the map; GEO gets you named when customers ask an AI." },
    ],
    sources: [
      { label: "Google: Tips to improve your local ranking", url: "https://support.google.com/business/answer/7091" },
      { label: "Whitespark: 2026 Local Search Ranking Factors", url: "https://whitespark.ca/local-search-ranking-factors/" },
    ],
    deepDive: "aeo-vs-geo",
  },

  // ─── Category 3: competitor tools ─────────────────────────────────────
  {
    slug: "alphaa-vs-semrush",
    kind: "tool",
    label: "Alphaa vs. Semrush",
    left: "Semrush",
    right: "Alphaa",
    metaTitle: "Alphaa vs. Semrush (2026): Do the Work vs. See the Work",
    description:
      "Semrush is a powerful SEO and marketing suite. Alphaa is an AI agent that gets local businesses named by ChatGPT, Gemini, Claude and Perplexity. An honest comparison.",
    h1: "Alphaa vs. Semrush.",
    h1Quiet: "A to-do list, or the to-dos done.",
    tldr:
      "The main difference between Alphaa and Semrush is that Semrush is a powerful research and reporting suite that shows marketers what to fix, while Alphaa is an AI agent that does the fixing for a local business. Semrush suits marketing teams and agencies; Alphaa suits owners who want to be named in AI answers without learning a tool.",
    rows: [
      ["What it is", "SEO and marketing research suite", "AI agent that does AI-visibility work"],
      ["Built for", "Marketers, SEOs, agencies", "Local business owners"],
      ["Price (Sept 2026)", "From $139/month billed monthly (SEO plan); higher tiers to $549", "$99/month. Pro $199, Full Service $299"],
      ["AI search tracking", "Yes — Google, ChatGPT, Perplexity, Gemini and more", "Yes — ChatGPT, Gemini, Claude, Perplexity, weekly"],
      ["Keyword & backlink research", "Deep, industry-leading", "No"],
      ["Who does the fixes", "You or your team", "Alphaa drafts them; you approve"],
      ["Learning curve", "Steep — many tools and reports", "None — it talks to you in plain English"],
      ["Local-business checks", "Local SEO tools available", "23 AI-readiness checks on your site, every week"],
    ],
    leftGood: {
      title: "What Semrush is great at",
      points: [
        "Deep keyword, backlink and competitor research.",
        "Technical site audits for large sites.",
        "Ads, content and social tools in one suite.",
        "AI search tracking for teams who’ll act on it.",
      ],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: [
        "It doesn’t hand you a to-do list — it does the to-dos.",
        "No dashboards to learn. You approve in one tap.",
        "Priced and built for one local business.",
        "Covers Claude as well as ChatGPT, Gemini and Perplexity.",
      ],
    },
    chooseLeft: [
      "You have a marketer or agency who lives in SEO tools.",
      "You need keyword and backlink research at depth.",
      "You manage many sites or large content programs.",
    ],
    chooseRight: [
      "You’re an owner, not a marketer.",
      "You want the AI-visibility work done, not reported.",
      "You want one price, no setup and no learning curve.",
    ],
    sections: [
      {
        q: "Does Semrush track ChatGPT rankings?",
        a: [
          "Yes. As of September 2026, Semrush’s pricing page lists tracking performance in AI search across Google, ChatGPT, Perplexity, Gemini and more. It tells you where you stand; your team still does the work.",
        ],
      },
      {
        q: "Do I need Semrush to rank in AI answers?",
        a: [
          "Not if you’re a local business. You need your facts readable, structured data in place, direct answers to customer questions, reviews AI can read and consistent profiles. Alphaa checks and writes those for you; you don’t need keyword volumes to do it.",
        ],
      },
    ],
    faq: [
      { q: "Is Alphaa cheaper than Semrush?", a: "Yes. As of September 2026 Semrush plans start at $139 a month billed monthly and go up to $549. Alphaa starts at $99 a month, month to month." },
      { q: "Does Semrush track ChatGPT rankings?", a: "Yes. Semrush lists AI search tracking across Google, ChatGPT, Perplexity, Gemini and more. It reports visibility; you still make the fixes yourself." },
      { q: "Is Alphaa a Semrush alternative?", a: "For local businesses that want AI visibility done for them, yes. For keyword research, backlink analysis and large-site audits, Semrush is the stronger tool." },
      { q: "Can I use Semrush and Alphaa together?", a: "Yes. Marketers often keep Semrush for research and use Alphaa to do the weekly AI-visibility work for a local business." },
    ],
    sources: [{ label: "Semrush pricing", url: "https://www.semrush.com/prices/" }],
    deepDive: "best-aeo-tools-2026",
  },
  {
    slug: "alphaa-vs-ahrefs",
    kind: "tool",
    label: "Alphaa vs. Ahrefs",
    left: "Ahrefs",
    right: "Alphaa",
    metaTitle: "Alphaa vs. Ahrefs (2026): Research Tool vs. AI Agent for Local Businesses",
    description:
      "Ahrefs is a leading SEO research platform with Brand Radar for AI mentions. Alphaa is an AI agent that does AI-visibility work for local businesses. Compare price, features and fit.",
    h1: "Alphaa vs. Ahrefs.",
    h1Quiet: "Data on the problem, or the problem fixed.",
    tldr:
      "The main difference between Alphaa and Ahrefs is that Ahrefs is a research platform for SEO professionals — backlinks, keywords and, with Brand Radar, AI mentions — while Alphaa is an AI agent that does the AI-visibility work for a local business. Ahrefs tells experts what’s happening; Alphaa makes the changes, from $99 a month.",
    rows: [
      ["What it is", "SEO research platform", "AI agent that does AI-visibility work"],
      ["Built for", "SEO professionals and marketing teams", "Local business owners"],
      ["Price (Sept 2026)", "Lite $129, Standard $249, Advanced $449/month; Brand Radar AI add-on from $199/month", "$99/month. Pro $199, Full Service $299"],
      ["AI mention tracking", "Yes, via Brand Radar", "Yes — ChatGPT, Gemini, Claude, Perplexity, weekly"],
      ["Backlink index", "One of the largest available", "No"],
      ["Who does the fixes", "You or your team", "Alphaa drafts them; you approve"],
      ["Local-business checks", "Site audit (general)", "23 AI-readiness checks built for local businesses"],
    ],
    leftGood: {
      title: "What Ahrefs is great at",
      points: [
        "Backlink and keyword data at huge scale.",
        "Competitive research for SEO pros.",
        "Brand Radar for AI mention research across millions of prompts.",
      ],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: [
        "Does the work, not just the research.",
        "Checks the exact questions your local customers ask.",
        "No tool to learn; plain-English weekly note.",
        "One flat price that includes AI tracking.",
      ],
    },
    chooseLeft: [
      "You’re an SEO or marketer who needs research data.",
      "Backlinks and keyword gaps are your main job.",
    ],
    chooseRight: [
      "You run a local business and want AI to name you.",
      "You want fixes written for you each week.",
    ],
    sections: [
      {
        q: "Does Ahrefs track ChatGPT?",
        a: [
          "Yes. Ahrefs’ Brand Radar monitors brand visibility in AI assistants, and its pricing page lists a Brand Radar AI add-on from $199 a month on top of a plan. It’s a research tool; acting on it is up to you.",
        ],
      },
      {
        q: "Do backlinks matter for AI answers?",
        a: [
          "They help, because AI assistants read trusted pages that often have strong links. But for local businesses, clear facts, structured data, reviews and consistent mentions usually move AI answers faster.",
        ],
      },
    ],
    faq: [
      { q: "Is Alphaa cheaper than Ahrefs?", a: "Yes. Ahrefs plans start at $129 a month, and AI tracking through Brand Radar AI is an add-on from $199 a month. Alphaa is $99 a month with AI tracking included." },
      { q: "Does Ahrefs track AI mentions?", a: "Yes, through Brand Radar. It shows how brands appear in AI answers across a large prompt database and custom prompts." },
      { q: "Is Alphaa an Ahrefs alternative?", a: "For a local business that wants AI visibility done for it, yes. For backlink and keyword research, Ahrefs is the better tool." },
    ],
    sources: [{ label: "Ahrefs pricing", url: "https://ahrefs.com/pricing" }],
    deepDive: "do-backlinks-matter-for-ai-search",
  },
  {
    slug: "alphaa-vs-yext",
    kind: "tool",
    label: "Alphaa vs. Yext",
    left: "Yext",
    right: "Alphaa",
    metaTitle: "Alphaa vs. Yext (2026): Directory Listings vs. AI Answers",
    description:
      "Yext syncs business listings across hundreds of directories for multi-location brands. Alphaa gets a local business named in ChatGPT, Gemini, Claude and Perplexity answers. Honest comparison.",
    h1: "Alphaa vs. Yext.",
    h1Quiet: "AI is the new directory.",
    tldr:
      "The main difference between Alphaa and Yext is scale and focus. Yext is an enterprise platform that syncs location data to 200+ directories and publishers, now with AI visibility tracking, for multi-location brands. Alphaa is an AI agent that gets a local business named in ChatGPT, Gemini, Claude and Perplexity answers, done for you at a flat $99 a month.",
    rows: [
      ["What it is", "Enterprise listings, reviews and pages platform", "AI agent for AI visibility"],
      ["Built for", "Multi-location brands with a marketing team", "Local businesses, 1–3 locations"],
      ["Price", "Custom quote, typically billed annually", "$99/month. Pro $199, Full Service $299. Month to month"],
      ["Directory syncing", "200+ publishers — a real strength", "No; checks your profiles are linked and consistent"],
      ["AI visibility", "Yes, via Scout", "Yes — ChatGPT, Gemini, Claude, Perplexity, weekly"],
      ["Who does the work", "Your team runs the platform", "Alphaa drafts it; you approve"],
      ["Website fixes", "Yext Pages for location pages", "FAQs, structured data and llms.txt for your existing site"],
    ],
    leftGood: {
      title: "What Yext is great at",
      points: [
        "Keeping hundreds of locations accurate everywhere.",
        "Direct publisher integrations at scale.",
        "Reviews and location pages in one system.",
      ],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: [
        "Directories were the old map; AI answers are the new one.",
        "Does the work for an owner with no marketing team.",
        "Transparent flat pricing, no annual contract.",
      ],
    },
    chooseLeft: ["You manage dozens or hundreds of locations.", "You have a team to run an enterprise platform."],
    chooseRight: ["You have one to three locations.", "You want AI to name you, done for you."],
    sections: [
      {
        q: "Are directories still important for AI?",
        a: [
          "Consistent listings still help, because AI assistants cross-check facts. But customers increasingly ask an AI instead of browsing a directory — so what matters is whether the AI names you.",
        ],
      },
    ],
    faq: [
      { q: "Is Alphaa cheaper than Yext?", a: "For most local businesses, yes. Yext uses custom quotes typically billed annually. Alphaa is $99, $199 or $299 a month, month to month." },
      { q: "Does Yext track ChatGPT?", a: "Yes. Yext’s Scout tracks visibility across Google, AI Overviews, ChatGPT, Gemini, Claude and Perplexity." },
      { q: "Is Alphaa a Yext alternative?", a: "For single-location and small multi-location businesses that want AI visibility done for them, yes. For enterprise listings management across hundreds of locations, Yext is built for that." },
    ],
    sources: [
      { label: "Yext Listings", url: "https://www.yext.com/platform/listings" },
      { label: "Yext Scout", url: "https://www.yext.com/platform/scout" },
      { label: "Yext pricing FAQ", url: "https://www.yext.com/knowledge-center/yext-faq" },
    ],
    deepDive: "alphaa-vs-yext",
  },
  {
    slug: "alphaa-vs-brightlocal",
    kind: "tool",
    label: "Alphaa vs. BrightLocal",
    left: "BrightLocal",
    right: "Alphaa",
    metaTitle: "Alphaa vs. BrightLocal (2026): Google Maps Tools vs. an AI Agent",
    description:
      "BrightLocal is a respected local SEO platform for Google rankings, citations and reviews. Alphaa is an AI agent for getting named by ChatGPT, Gemini, Claude and Perplexity. Honest comparison.",
    h1: "Alphaa vs. BrightLocal.",
    h1Quiet: "From the Map Pack to every answer engine.",
    tldr:
      "The main difference between Alphaa and BrightLocal is who does the work. BrightLocal is a local SEO toolkit — rank tracking, citations, reviews and now AI visibility tracking — mainly used by agencies and marketers. Alphaa is an AI agent that does the AI-visibility work for a local business owner, at a flat $99 a month.",
    rows: [
      ["What it is", "Local SEO platform", "AI agent for AI visibility"],
      ["Built for", "Agencies and local marketers", "Local business owners"],
      ["Price (Sept 2026)", "Track, Manage, Grow plans — price on request; 14-day free trial; Managed SEO $1,299/month", "$99/month. Pro $199, Full Service $299"],
      ["Google rank tracking", "Yes — local grids and rankings", "No; focus is AI answers"],
      ["Citation building", "Yes, from $2 per citation", "No; checks your profiles are linked and consistent"],
      ["AI visibility", "Yes — Local AI Visibility Tracker (ChatGPT and Google AI)", "Yes — ChatGPT, Gemini, Claude, Perplexity, weekly"],
      ["Who does the fixes", "You or your agency", "Alphaa drafts them; you approve"],
    ],
    leftGood: {
      title: "What BrightLocal is great at",
      points: ["Local rank grids and Google Maps tracking.", "Citation building and cleanup.", "Agency-friendly reporting across many clients."],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: ["Built for the owner, not the agency.", "Does the fixes on your site, not just tracks them.", "Covers Claude and Perplexity as well as ChatGPT."],
    },
    chooseLeft: ["You’re an agency managing many local clients.", "Google Maps rank tracking is your main need."],
    chooseRight: ["You’re the owner and want AI to name you.", "You want the work done, not another report."],
    sections: [
      {
        q: "Is optimizing Google Maps enough in 2026?",
        a: [
          "It’s still important, but it only covers Google. Customers now ask ChatGPT, Claude and Perplexity too, and those read your website and third-party pages. Alphaa covers that side.",
        ],
      },
    ],
    faq: [
      { q: "Does BrightLocal track ChatGPT?", a: "Yes. BrightLocal lists a Local AI Visibility Tracker covering ChatGPT and Google’s AI on all its plans." },
      { q: "Is Alphaa a BrightLocal alternative?", a: "For owners who want AI visibility done for them, yes. For agencies tracking Google Maps rankings and building citations across many clients, BrightLocal is built for that." },
      { q: "How much does BrightLocal cost?", a: "As of September 2026 BrightLocal lists its Track, Manage and Grow plans as price on request, with a 14-day free trial and a Managed SEO service at $1,299 a month." },
    ],
    sources: [
      { label: "BrightLocal pricing", url: "https://www.brightlocal.com/pricing/" },
      { label: "BrightLocal: AI Insights", url: "https://www.brightlocal.com/blog/introducing-ai-insights/" },
    ],
    deepDive: "alphaa-vs-brightlocal",
  },
  {
    slug: "alphaa-vs-whitespark",
    kind: "tool",
    label: "Alphaa vs. Whitespark",
    left: "Whitespark",
    right: "Alphaa",
    metaTitle: "Alphaa vs. Whitespark (2026): Local Citations vs. AI Answers",
    description:
      "Whitespark is a trusted local SEO toolset for citations, rank tracking and reviews. Alphaa is an AI agent that gets local businesses named in AI answers. Honest comparison.",
    h1: "Alphaa vs. Whitespark.",
    h1Quiet: "Citations built, or answers won.",
    tldr:
      "The main difference between Alphaa and Whitespark is focus. Whitespark offers well-regarded local SEO tools and services — citation building, local rank tracking and review generation — priced per product. Alphaa is an AI agent that gets a local business named in ChatGPT, Gemini, Claude and Perplexity answers and writes the fixes for you, at a flat $99 a month.",
    rows: [
      ["What it is", "Local SEO tools and citation services", "AI agent for AI visibility"],
      ["Built for", "Local SEOs, agencies and hands-on owners", "Local business owners"],
      ["Price (Sept 2026)", "Per product: Local Rank Tracker $14–$200/mo, Citation Finder $33–$149/mo, Reputation Builder $79/mo per location; citation packages $20–$999 one-time", "$99/month. Pro $199, Full Service $299"],
      ["Citation building", "Yes — a core strength", "No"],
      ["Google rank tracking", "Yes, incl. ranking grids", "No; focus is AI answers"],
      ["AI answer tracking", "Not listed on its pricing page", "Yes — ChatGPT, Gemini, Claude, Perplexity, weekly"],
      ["Who does the fixes", "You, or Whitespark’s services for citations", "Alphaa drafts them; you approve"],
    ],
    leftGood: {
      title: "What Whitespark is great at",
      points: [
        "Citation building and cleanup.",
        "Local rank tracking and grids.",
        "Its annual Local Search Ranking Factors research, now covering AI search.",
      ],
    },
    rightGood: {
      title: "Where Alphaa is different",
      points: ["Watches what four AI assistants actually say about you.", "Fixes the facts on your own site that AI reads.", "One flat price instead of several products."],
    },
    chooseLeft: ["You need citations built or cleaned up.", "You track Google Maps rankings closely."],
    chooseRight: ["You want to be named in AI answers.", "You want one agent doing the work weekly."],
    sections: [
      {
        q: "Do citations help with AI answers?",
        a: [
          "Consistent citations help AI assistants trust your facts. Whitespark’s 2026 ranking-factors report found local and AI search signals now largely overlap. But AI also needs your own site to state your facts clearly — which is what Alphaa checks and fixes.",
        ],
      },
    ],
    faq: [
      { q: "Is Alphaa a Whitespark alternative?", a: "They do different jobs. Whitespark is strong at citations and Google rank tracking. Alphaa focuses on getting you named in AI answers. Many businesses could use both." },
      { q: "Does Whitespark track ChatGPT?", a: "As of September 2026, AI answer tracking isn’t listed on Whitespark’s pricing page. Alphaa checks ChatGPT, Gemini, Claude and Perplexity every week." },
    ],
    sources: [
      { label: "Whitespark pricing", url: "https://whitespark.ca/pricing/" },
      { label: "Whitespark: 2026 Local Search Ranking Factors", url: "https://whitespark.ca/local-search-ranking-factors/" },
    ],
  },
]

export const ALPHAA_SUMMARY = { price: ALPHAA_PRICE, does: ALPHAA_DOES }

export function getCompare(slug: string) {
  return COMPARES.find((c) => c.slug === slug)
}

export const COMPARE_GROUPS: { kind: CompareKind; title: string; blurb: string }[] = [
  { kind: "alternative", title: "The old way", blurb: "Agencies and freelancers sell hours. An agent does the work." },
  { kind: "concept", title: "The shift", blurb: "What changes when customers ask AI instead of Google." },
  { kind: "tool", title: "The tools", blurb: "You don’t need another dashboard. You need the work done." },
]
