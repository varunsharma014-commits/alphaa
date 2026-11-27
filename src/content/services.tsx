// The service pages (/services/[slug]) and the homepage feature rows read from here.
// Rules: sell the outcome (the owner's better week), name the pain, show the savings with a
// real source, and never claim what isn't live. Social auto-posting, ads campaigns and email
// campaigns wait on platform approvals: say so where it matters ("availability").
// Agency price ranges were checked against 2026 pricing guides and surveys on 2026-11-17.
import type { ReactNode } from "react"
import { Fragment } from "react"

export type ServiceSlug = "social-media-management" | "ai-search-optimization" | "ads-management" | "content-writing" | "email-marketing"

export type Service = {
  slug: ServiceSlug
  name: string // nav / pill label
  color: string
  metaTitle: string
  metaDescription: string
  kicker: string
  h1: string
  sub: string
  /** The dream, in one line. */
  dream: string
  pains: { t: string; p: string }[]
  beforeAfter: [string, string][]
  how: { t: string; p: string }[]
  gets: string[]
  savings: { them: string; themWhat: string; us: string; usWhat: string; sources: { label: string; url: string }[] }
  plan: "starter" | "pro" | "growth"
  /** Shown when part of it isn't live yet. */
  availability?: string
  faqs: { q: string; a: string }[]
  /** Homepage feature row + the page's looping screen. */
  feature: { title: string; body: string; points: string[]; label: string; scenes: ReactNode[] }
  related: ServiceSlug[]
}

const k = (n: number) => `s${n}`

export const SERVICES: Service[] = [
  {
    slug: "social-media-management",
    name: "Social Media Management",
    color: "#ffd6e0",
    metaTitle: "AI Social Media Management for Small Businesses",
    metaDescription: "Your AI agent plans, writes and designs your Facebook, Instagram and LinkedIn posts every week, in your voice and your brand colours, each one ready to publish in one tap.",
    kicker: "Social Media Management",
    h1: "Show up on social every week. Without lifting a finger.",
    sub: "Your AI marketing agent plans, writes and designs your Facebook, Instagram and LinkedIn posts, in your voice and your brand colours, around what your customers care about this week.",
    dream: "It’s Sunday night. This week’s posts are already written, designed and ready to go.",
    pains: [
      { t: "The blank screen at 11pm", p: "You know you should post. Then you open Instagram after a twelve-hour day and have nothing to say." },
      { t: "Posts that look homemade", p: "Mismatched fonts, random photos, no logo. It doesn’t look like the business you’ve worked so hard to build." },
      { t: "Paying for posts that don’t sound like you", p: "Agencies charge hundreds a month, then you spend your evenings rewriting captions that sound nothing like you." },
    ],
    beforeAfter: [
      ["Posting when you remember", "Posts every week, planned around what’s happening near you"],
      ["Captions that sound like a robot", "Posts in your voice. Your customers can’t tell"],
      ["An hour in Canva per post", "An image in your colours and logo, ready with every post"],
      ["No idea what works", "You see which posts got the most likes, and get more like them"],
    ],
    how: [
      { t: "I learn your brand", p: "I read your website and the replies you write to customers, pick up your logo and colours, and give you voices to choose from." },
      { t: "I plan your week", p: "Local events, seasons, news in your industry and what your followers liked last time. Every post has a reason to exist." },
      { t: "You publish in one tap", p: "Each post is ready to publish with one tap. Posting straight to your accounts, with or without asking, turns on as Meta and LinkedIn approve Alphaa." },
    ],
    gets: [
      "3 posts a week for Facebook, Instagram and LinkedIn",
      "A branded image with every post: your colours, your logo, a headline people get in two seconds",
      "Your voice, learned from your own words, in your language",
      "Planned around local events, seasons and news",
      "Every post shown to you before it goes out",
    ],
    savings: { them: "$500–$3,000", themWhat: "a month is what most small businesses are quoted for social media management", us: "$499", usWhat: "a month for Pro, with SEO, Google posts and blogs included too", sources: [{ label: "SocialBu, social media management pricing 2026", url: "https://socialbu.com/blog/social-media-management-pricing" }, { label: "Boomp, pricing benchmarks for local businesses", url: "https://www.boomp.net/research/social-media-management-pricing-benchmarks-local-businesses" }] },
    plan: "pro",
    availability: "Social media is part of the Pro and Growth plans. Today I write each post and its image, and you publish it with one tap. Posting straight to Facebook, Instagram and LinkedIn opens as Meta and LinkedIn approve Alphaa.",
    faqs: [
      { q: "Can an AI agent really manage my social media?", a: "Yes. Alphaa plans your week, writes each post in your voice and makes an image in your brand colours with your logo. Each post is ready to publish with one tap; posting on its own turns on as Meta and LinkedIn approve Alphaa." },
      { q: "Will the posts sound like me?", a: "Alphaa reads your website and the replies you’ve written to customers, then gives you three voices to choose from, with an example of each. You can also set the tone, emoji, length and language, or describe your voice in your own words." },
      { q: "Which platforms does it cover?", a: "Facebook, Instagram and LinkedIn." },
      { q: "Do I need to design the images?", a: "No. Every post comes with a square image in your brand colours, with your logo and a short headline. Alphaa reads your colours and logo from your website, and you can change them in one tap." },
      { q: "How much does social media management cost?", a: "Most small businesses are quoted $500 to $3,000 a month by agencies, according to 2026 pricing guides. With Alphaa it’s part of the Pro plan at $499 a month, which also covers SEO, Google posts and blog posts." },
      { q: "Does it post automatically?", a: "Only if you want it to. Posting straight to your accounts opens as Meta and LinkedIn approve Alphaa’s access. Until then, each post is ready to copy with one tap." },
    ],
    feature: {
      title: "Show up every week, one tap per post.",
      body: "No more staring at a blank screen at 11pm. Your Facebook, Instagram and LinkedIn stay active with posts people stop scrolling for, written in your voice and made in your brand colours.",
      points: ["Planned around what your customers care about this week", "Your logo and colours on every image", "Ready to publish in one tap"],
      label: "Social posts · this week",
      scenes: [
        <Fragment key={k(1)}><div className="say">Run my social for this week</div><div className="row"><i />Reading your brand: logo, colours, voice</div><div className="row"><i />Checking which posts got the most likes</div></Fragment>,
        <Fragment key={k(2)}><div className="mini"><div style={{ background: "#0b3d91", color: "#fff" }}>Saturday visits are back</div><div style={{ background: "#f6d34a", color: "#111" }}>Croissants out at 7</div><div style={{ background: "#e4572e", color: "#fff" }}>Freeze warning tonight</div></div><div className="box"><b>3 posts ready</b> · in your voice, with your logo</div></Fragment>,
        <Fragment key={k(3)}><div className="box"><b>Ready for Instagram</b> · Tue</div><div className="box"><b>Ready for Facebook</b> · Thu</div><div className="box"><b>Ready for LinkedIn</b> · Fri</div></Fragment>,
      ],
    },
    related: ["content-writing", "ads-management", "email-marketing"],
  },
  {
    slug: "ai-search-optimization",
    name: "SEO & AEO",
    color: "#dcf7e3",
    metaTitle: "Get Customers from ChatGPT, Gemini & Google: AI SEO and AEO",
    metaDescription: "Your customers ask ChatGPT, Gemini, Claude and Perplexity who to call. Alphaa's AI agent works every week so they name you, and keeps you showing up on Google. From $99 a month.",
    kicker: "Getting customers from AI (SEO & AEO)",
    h1: "Be the business AI recommends.",
    sub: "Your customers now ask ChatGPT, Gemini, Claude and Perplexity who to call. They name a few businesses, and the customer calls one. Your AI agent works every week so one of them is you, and keeps you showing up on Google too.",
    dream: "A customer asks ChatGPT for a recommendation. It says your name. You find out in Monday’s note.",
    pains: [
      { t: "Losing customers you never see", p: "When AI names a competitor, that customer never reaches your website. You don’t even know you lost them." },
      { t: "Paying for SEO you can’t see working", p: "A monthly report full of charts, and still no clear answer to “are more people finding us?”" },
      { t: "A Google listing gathering dust", p: "No new posts, reviews without replies. Google and AI both notice." },
    ],
    beforeAfter: [
      ["AI names your competitor", "AI names you, and you know when it starts"],
      ["Your website confuses AI", "AI can read exactly what you do, where and for whom"],
      ["Reviews sit unanswered", "On Pro, every review gets a reply in your voice"],
      ["Guessing if SEO works", "A plain-English note every week: what changed and why"],
    ],
    how: [
      { t: "I ask the AIs about you", p: "Every week I ask ChatGPT, Gemini, Claude and Perplexity the questions your customers ask, and see who they name." },
      { t: "I fix what keeps you out", p: "The business facts AI can’t read, the pages it quotes, the settings that turn its crawlers away. On WordPress, Webflow, Shopify or Wix." },
      { t: "I keep Google busy", p: "On Pro, fresh Google listing updates and replies to your reviews, so Google and AI see a business that’s open and active." },
    ],
    gets: [
      "Weekly checks across ChatGPT, Gemini, Claude and Perplexity",
      "Your customers’ questions tracked every week (10 on Starter, 20 on Pro)",
      "Website fixes AI needs, published for you or sent to your web person",
      "On Pro: 4 Google listing updates a week and review replies",
      "If none of ChatGPT, Gemini, Claude or Perplexity names your business within your first 90 days, your next month is free",
    ],
    savings: { them: "$500–$3,000", themWhat: "a month is the usual local SEO retainer, and most SEO agencies still don’t work on AI answers", us: "$99", usWhat: "a month for Starter, month to month", sources: [{ label: "Ahrefs, SEO pricing survey", url: "https://ahrefs.com/blog/seo-pricing" }, { label: "SEO.com, local SEO pricing 2026", url: "https://www.seo.com/es/blog/local-seo-pricing" }] },
    plan: "starter",
    faqs: [
      { q: "What is AEO?", a: "AEO (answer engine optimization) is making your business the answer AI assistants like ChatGPT, Gemini, Claude and Perplexity give when customers ask for a recommendation. It works alongside SEO, which is about showing up in Google’s search results." },
      { q: "How do I get my business recommended by ChatGPT?", a: "AI assistants recommend businesses they can read clearly and see confirmed in many places. Alphaa checks what the four main AIs say about you every week, adds the business facts and pages they need to your website, and on Pro keeps your Google listing and reviews active." },
      { q: "How long does it take?", a: "Changes to your Google listing can show up within days. AI answers usually take longer, often weeks. Nobody can honestly guarantee a ranking, which is why Alphaa offers this instead: if none of ChatGPT, Gemini, Claude or Perplexity names your business within your first 90 days, your next month is free." },
      { q: "How much does SEO cost for a small business?", a: "Local SEO retainers usually run $500 to $3,000 a month, according to 2026 pricing guides and agency surveys. Alphaa starts at $99 a month, month to month, and covers AI answers as well as Google." },
      { q: "Do I need to change my website?", a: "Alphaa makes the changes for you if your site runs on WordPress, Webflow, Shopify or Wix. Otherwise it writes exactly what to change and emails it to your web person." },
    ],
    feature: {
      title: "Get recommended by ChatGPT, not your competitor.",
      body: "People now ask AI who to call. When ChatGPT, Gemini, Claude or Perplexity names someone else, you lose that customer without ever knowing. I fix what keeps you out and check every week.",
      points: ["Weekly checks across 4 AI assistants", "Fixes what AI can’t read on your website", "Keeps your Google listing busy and fresh on Pro"],
      label: "AI visibility · weekly check",
      scenes: [
        <Fragment key={k(1)}><div className="say">Does ChatGPT recommend me?</div><div className="row"><i />Asking ChatGPT, Gemini, Claude and Perplexity</div></Fragment>,
        <Fragment key={k(2)}><div className="box"><b>ChatGPT</b> · names you</div><div className="box"><b>Gemini</b> · names a competitor</div><div className="box"><b>Perplexity</b> · names you</div></Fragment>,
        <Fragment key={k(3)}><div className="row"><i />Added the business facts Gemini couldn’t read</div><div className="row"><i />Wrote the page it quotes for this question</div><div className="big">3 of 4</div><div>AIs now name you</div></Fragment>,
      ],
    },
    related: ["content-writing", "social-media-management", "ads-management"],
  },
  {
    slug: "ads-management",
    name: "Ads Management",
    color: "#d6ecff",
    metaTitle: "AI Google Ads & Meta Ads Management for Small Businesses",
    metaDescription: "Google and Meta ads management from your AI agent, in early access on the Growth plan: tracking first, ads built around what people search for, and your budget moved to what brings calls. No cut of your ad spend.",
    kicker: "Ads Management",
    h1: "Stop paying for clicks that never call.",
    sub: "Early access on the Growth plan: your AI agent will show your ads to people already looking for what you sell, count every call, form and booking they bring, and move your money to what works every week.",
    dream: "Same budget as last month. More calls. And you know exactly which ad brought each one.",
    pains: [
      { t: "Money in, nothing you can see out", p: "Your ads are running. Are they bringing customers? Nobody can give you a straight answer." },
      { t: "Fees on top of your ad spend", p: "Agencies usually charge a monthly fee or 10–20% of your ad spend, before a single customer calls." },
      { t: "Set and forget", p: "Campaigns built once and left alone, quietly spending on searches that never turn into customers." },
    ],
    beforeAfter: [
      ["“Are the ads working?”", "See every call, email and form your ads brought in"],
      ["Spend on clicks that never call", "Wasted keywords cut every week"],
      ["A fee that grows with your budget", "Your budget goes to Google and Meta. We never take a cut"],
      ["Surprise bills", "A monthly limit I never go over"],
    ],
    how: [
      { t: "I count what matters", p: "I set up Google Analytics and the Meta Pixel on your website and count phone taps, emails and form sends, so ads learn who your customers are." },
      { t: "I build your ads", p: "When ads open: Google Search and Meta campaigns around what people search for and what your business does. You approve the budget." },
      { t: "I tune them every week", p: "Once ads open: pause what doesn’t bring customers, write fresh ads, move money to what does. You see every change in plain English." },
    ],
    gets: [
      "Google Analytics and Meta Pixel set up and checked on your site",
      "Calls, emails and form sends counted as leads",
      "Google Search and Meta campaigns built for you",
      "Weekly tuning: wasted spend cut, fresh ads, budget moved to what works",
      "A monthly budget limit, never exceeded, and no cut of your ad spend",
    ],
    savings: { them: "$500–$2,500", themWhat: "a month in management fees for a small business, or 10–20% of ad spend, on top of the ads themselves", us: "$799", usWhat: "a month for Growth (early access) with ads for 1 ad account, +$200 a month per extra ad account, and everything in Pro too", sources: [{ label: "OuterBox, PPC management pricing 2026", url: "https://www.outerboxdesign.com/ppc-management" }, { label: "ClicksGeek, PPC management cost 2026", url: "https://clicksgeek.com/ppc-management-cost/" }] },
    plan: "growth",
    availability: "Ads management is part of the Growth plan, in early access: $799 a month for 1 ad account, +$200 a month per extra ad account. Building and tuning campaigns opens as Google and Meta approve Alphaa’s access.",
    faqs: [
      { q: "How much does Google Ads management cost?", a: "Small businesses are usually quoted $500 to $2,500 a month in management fees, or 10–20% of ad spend, on top of the ad spend itself, according to 2026 pricing guides. Alphaa’s ads management is part of the Growth plan, in early access: $799 a month for 1 ad account, +$200 a month per extra ad account, with everything in Pro included. We never take a cut of your ad spend." },
      { q: "Is my ad spend included?", a: "No. Your ad budget is paid to Google and Meta directly from your own ad accounts. Alphaa never marks it up and never spends more than the monthly limit you set." },
      { q: "Do I keep my ad accounts?", a: "Yes. Campaigns run in your own Google Ads and Meta accounts. If you leave, everything stays with you." },
      { q: "Will it spend money without asking me?", a: "Only within the monthly budget you set, and only if you switch that on. Otherwise Alphaa asks before starting any new campaign." },
      { q: "How do I know the ads are working?", a: "Alphaa sets up tracking first, so every phone tap, email and form send from your website is counted. Each week you see which ads brought customers, in plain English." },
    ],
    feature: {
      title: "Stop paying for clicks that never call.",
      body: "When ads open, your ads will reach people already looking for what you sell. Every week I’ll cut what isn’t bringing customers and put the money into what is, so the same budget brings in more.",
      points: ["Never spends more than your monthly budget", "Your budget goes to Google and Meta. We never take a cut", "See which ads brought calls and bookings"],
      label: "Ads · weekly tune-up",
      scenes: [
        <Fragment key={k(1)}><div className="say">How are my ads doing?</div><div className="box"><b>Google Search</b> · 14 calls this week</div><div className="box"><b>Meta</b> · 6 form fills</div></Fragment>,
        <Fragment key={k(2)}><div className="row"><i />Paused 3 keywords with clicks but no calls</div><div className="row"><i />Moved $40 to “emergency plumber”</div><div className="row"><i />Wrote 2 fresh ad versions</div></Fragment>,
        <Fragment key={k(3)}><div className="box">Budget used <b>$412 of $500</b></div><div className="bar"><span style={{ width: "82%" }} /></div><div className="box"><b>Same budget, more calls.</b> I’ll keep tuning.</div></Fragment>,
      ],
    },
    related: ["social-media-management", "email-marketing", "ai-search-optimization"],
  },
  {
    slug: "content-writing",
    name: "Content Writing",
    color: "#fff0c2",
    metaTitle: "AI Blog and Content Writing for Small Businesses",
    metaDescription: "Your AI agent finds the questions your customers ask Google and ChatGPT, writes the answers as blog posts in your voice, and publishes them to your website. From $99 a month.",
    kicker: "Blog & Content Writing",
    h1: "Be the answer when customers search.",
    sub: "Your AI agent finds the questions your customers type into Google and ChatGPT, writes the answers as posts on your website in your voice, and publishes them.",
    dream: "You open your website and there’s a new post you didn’t write. It sounds exactly like you, and it answers what your customers ask.",
    pains: [
      { t: "No time to write", p: "Blogging is always next week’s job. Your last post is from two years ago." },
      { t: "Writers who don’t know your business", p: "You pay per post, then rewrite half of it because it doesn’t sound like you or get the details right." },
      { t: "Posts nobody reads", p: "Topics picked by guesswork, not by what your customers actually search for." },
    ],
    beforeAfter: [
      ["A blog that died two years ago", "Fresh posts every month, without writing a word"],
      ["Topics picked by guesswork", "Topics picked from what your customers search and ask AI"],
      ["Paying per post", "Included in your plan"],
      ["Copying, pasting, formatting", "Published straight to your website (Wix: sent to your web person)"],
    ],
    how: [
      { t: "I find the questions", p: "From your Google search data, the questions customers ask AI about businesses like yours, and the topics your competitors cover that you don’t." },
      { t: "I write the answer", p: "Answer first, in your voice, with a short FAQ AI can quote. Anything only you know is marked so nothing is made up." },
      { t: "I publish it", p: "To WordPress, Webflow or Shopify, with a featured image. Approve with one tap, or on Pro let me publish finished posts on my own. On Wix, I send your web person the post for now." },
    ],
    gets: [
      "New blog posts every month (2 on Starter, 4 on Pro), picked from real customer questions",
      "Written answer-first, so Google and AI can quote them",
      "In your voice and your language",
      "Published to WordPress, Webflow or Shopify (Wix by email for now)",
      "See which posts bring visitors",
    ],
    savings: { them: "$250–$400", themWhat: "per 1,500-word post is the most common freelance rate, so four posts a month is $1,000 or more", us: "$99", usWhat: "a month for Starter with 2 posts a month, or $499 for Pro with 4 and social media too", sources: [{ label: "Peak Freelance, survey of 213 freelance writers", url: "https://peakfreelance.com/blog/freelance-writing-rates/" }] },
    plan: "starter",
    faqs: [
      { q: "Can AI write blog posts that rank?", a: "Posts rank when they answer a real question clearly. Alphaa picks topics from what your customers actually search for and ask AI, answers the question in the first lines, and adds a short FAQ, which is the format Google and AI assistants quote." },
      { q: "Will it make things up about my business?", a: "No. Alphaa writes from your website and the facts you give it. Anything only you know, like prices or hours, is marked in [brackets] for you to fill in, and posts with brackets are never published automatically." },
      { q: "How much does blog writing cost?", a: "Freelance writers most often charge $250 to $400 for a 1,500-word post, according to a survey of 213 writers. Alphaa includes blog posts from $99 a month." },
      { q: "Does it publish to my website?", a: "Yes, if your site runs on WordPress, Webflow or Shopify. You approve each post with one tap, or let Alphaa publish finished posts on its own on Pro. On Wix, Alphaa emails your web person each post until its Wix app launches." },
    ],
    feature: {
      title: "Be the answer when customers search.",
      body: "Your customers are asking Google and ChatGPT questions right now. I find the ones you’re missing and publish the answer on your website, so the next person who asks finds you, not a competitor.",
      points: ["Topics picked from what your customers actually search", "Written to be quoted by AI assistants", "Published to WordPress, Webflow or Shopify"],
      label: "Blog · new post",
      scenes: [
        <Fragment key={k(1)}><div className="row"><i />Found a question you’re losing: “emergency dentist open weekends”</div><div className="row"><i />Seen 420 times. You’re on page two.</div></Fragment>,
        <Fragment key={k(2)}><div className="box"><b>What to do in a dental emergency on a weekend</b><br />Most dental emergencies can wait a few hours. Here’s how to tell…</div><div className="box">5 questions answered · FAQ added</div></Fragment>,
        <Fragment key={k(3)}><div className="box"><b>Published to your website</b> · /blog/weekend-dental-emergency</div><div className="row"><i />Sent to Google to index</div></Fragment>,
      ],
    },
    related: ["ai-search-optimization", "social-media-management", "email-marketing"],
  },
  {
    slug: "email-marketing",
    name: "Email Marketing",
    color: "#eadcff",
    metaTitle: "AI Email Marketing for Small Businesses",
    metaDescription: "Your AI agent writes short, friendly emails your past customers actually open, sends them at the right moment and shows you who came back. Part of Alphaa Pro.",
    kicker: "Email Marketing",
    h1: "Turn past customers into repeat customers.",
    sub: "Your easiest sale is someone who already bought from you. Your AI agent writes short, friendly emails at the right moment, so they come back to you instead of wandering off to a competitor.",
    dream: "A customer you haven’t seen in six months books again. You didn’t write a word.",
    pains: [
      { t: "A list collecting dust", p: "Hundreds of past customers, and the last email you sent them was a holiday greeting two years ago." },
      { t: "No time for newsletters", p: "Writing, designing and sending an email takes an afternoon you don’t have." },
      { t: "Worried about getting it wrong", p: "Unsubscribe rules, spam laws, sending too often. So you don’t send at all." },
    ],
    beforeAfter: [
      ["Customers drift away", "Reminders arrive right when they’re due"],
      ["An afternoon per newsletter", "Written and ready in your voice"],
      ["Worried about spam rules", "Unsubscribe link and legal footer handled"],
      ["No idea who came back", "See who opened and who booked"],
    ],
    how: [
      { t: "I start from your customers", p: "People who said yes to hearing from you. I never email anyone who didn’t." },
      { t: "I write what they’d want", p: "Reminders when they’re due, seasonal news and offers you approve, short and in your voice." },
      { t: "I send and show results", p: "At the right time, with the unsubscribe link and legal footer in every email. You see who came back." },
    ],
    gets: [
      "Short emails in your voice, sent at the right moment",
      "Reminders, seasonal news and offers you approve",
      "Only to people who agreed to hear from you",
      "Unsubscribe link and legal footer in every email",
      "See who opened, clicked and came back",
    ],
    savings: { them: "$500–$3,000", themWhat: "a month is the usual small-business email agency retainer", us: "$499", usWhat: "a month for Pro, with social, SEO and blogs included too", sources: [{ label: "Nutshell, email marketing costs 2026", url: "https://www.nutshell.com/blog/cost-of-email-marketing" }, { label: "Email Vendor Selection, pricing guide", url: "https://www.emailvendorselection.com/email-marketing-cost-pricing-guide/" }] },
    plan: "pro",
    availability: "Email campaigns are part of the Pro and Growth plans.",
    faqs: [
      { q: "Who will the emails go to?", a: "Only customers who agreed to hear from you. Alphaa never emails anyone who didn’t, and every email has an unsubscribe link and your business address, as CAN-SPAM and CASL require." },
      { q: "How often will it send?", a: "Only when there’s a reason: a reminder that’s due, a seasonal moment or an offer you approved. You choose whether each email waits for your OK or goes out on its own." },
      { q: "How much does email marketing cost?", a: "Small businesses are usually quoted $500 to $3,000 a month by email marketing agencies, according to 2026 pricing guides. With Alphaa it’s part of the Pro plan at $499 a month." },
      { q: "Will the emails sound like me?", a: "Yes. They’re written in the same voice you pick for your posts, learned from your own website and customer replies." },
    ],
    feature: {
      title: "Turn past customers into repeat customers.",
      body: "Your easiest sale is someone who already bought from you. I send short, friendly emails at the right moment, reminders, seasonal news and offers, so they come back to you instead of wandering off.",
      points: ["Written in your voice, sent at the right time", "Unsubscribe link and legal footer handled", "See who came back"],
      label: "Email · this week",
      scenes: [
        <Fragment key={k(1)}><div className="row"><i />Found 214 customers due for a check-up</div><div className="row"><i />Writing a reminder in your voice</div></Fragment>,
        <Fragment key={k(2)}><div className="box"><b>Subject: Time for your check-up?</b><br />Hi Sam, it’s been six months. Saturday mornings are open again…</div></Fragment>,
        <Fragment key={k(3)}><div className="box"><b>Sent to 214</b> · Tue 10:00</div><div className="box">58% opened · 17 booked</div></Fragment>,
      ],
    },
    related: ["social-media-management", "ads-management", "content-writing"],
  },
]

export const SERVICE_BY_SLUG = Object.fromEntries(SERVICES.map((s) => [s.slug, s])) as Record<ServiceSlug, Service>
export const SERVICES_UPDATED = "2026-11-26"
