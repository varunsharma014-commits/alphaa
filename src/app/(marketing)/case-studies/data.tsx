import { Clock, DollarSign, TrendingUp, Users } from "lucide-react"

// Single source of truth for case studies. Consumed by the listing page and by
// the /case-studies/[slug] detail pages, which previously did not exist — the
// listing linked to them and every link 404'd.
const caseStudies = [
  {
    id: "bright-smile-dental",
    slug: "bright-smile-dental",
    industry: "Dental",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    business: "Bright Smile Dental",
    owner: "Dr. Sarah Chen",
    location: "Austin, TX",
    initials: "SC",
    headline: "From invisible to top 3 on ChatGPT in 6 weeks.",
    keyResult: "23 new patients in 60 days",
    keyResultSub: "$8,400 new revenue attributed to AI search",
    metrics: [
      { icon: Users, label: "New patients (60 days)", value: "23", sub: "attributed to AI search" },
      { icon: DollarSign, label: "New revenue", value: "$8,400", sub: "direct AI search attribution" },
      { icon: DollarSign, label: "Monthly savings", value: "$1,200", sub: "vs. prior SEO agency" },
      { icon: Clock, label: "Time to top 3 (ChatGPT)", value: "6 wks", sub: "from signup to top result" },
    ],
    problem: {
      title: "Three competitors. Zero mentions. Patients going elsewhere.",
      body: "Dr. Sarah Chen opened Bright Smile Dental in South Austin in 2021, building a steady practice through word-of-mouth. But by late 2023, she started noticing a troubling pattern: new patient calls had slowed, and a few existing patients mentioned they'd referred friends who ended up going somewhere else. When she investigated, the reason became clear. She typed 'best dentist near me Austin' into ChatGPT. Three competitors appeared by name — complete with addresses, hours, and glowing summaries. Her practice wasn't mentioned once.",
      tried: [
        "Was paying $1,200/month to a local SEO agency focused exclusively on Google rankings",
        "Had a Google Business Profile with 47 reviews (4.8 stars) but zero AI visibility",
        "Published a blog post once a quarter — not enough signal for AI training pipelines",
        "Asked the SEO agency about AI search; they said 'it's not a real channel yet'",
      ],
    },
    solution: {
      title: "A structured AI citation profile, built in days.",
      body: "Alphaa ran a full AI visibility audit on Bright Smile Dental across all four AI engines. The report found zero citations, no structured practice data in any AI-indexed source, and a content gap that explained why competitors were getting recommended instead. The fix was systematic.",
      timeline: [
        { week: "Days 1–3", title: "AI Profile Build", detail: "Alphaa structured all practice data — services, specialties, insurance accepted, hours, Dr. Chen's credentials and background — into formats optimized for AI citation indexing across ChatGPT, Claude, Gemini, and Perplexity." },
        { week: "Days 4–7", title: "Authority Signal Push", detail: "First round of AI-optimized content published: a detailed 'about the practice' page, FAQ schema markup for 18 common patient questions, and structured data markup for dental procedures. All designed to give AI engines something authoritative to cite." },
        { week: "Week 2", title: "First AI Mention", detail: "Bright Smile Dental appeared in a Perplexity answer for 'gentle dentist Austin accepting new patients' — the first AI citation ever. Dr. Chen called it 'surreal.'" },
        { week: "Weeks 3–4", title: "Weekly Content Cadence", detail: "Alphaa's autopilot published 2 posts per week to Google Business Profile and pushed structured updates to AI indexing pipelines. Each piece targeted a specific query patients were asking AI engines." },
        { week: "Week 5", title: "ChatGPT Breakthrough", detail: "Bright Smile Dental entered the top results on ChatGPT for 'dentist near me Austin' and 'best family dentist Austin TX' — the exact queries where three competitors had previously dominated." },
        { week: "Week 6+", title: "Consistent Top 3", detail: "Stable top-3 presence across ChatGPT and Perplexity. Gemini also began featuring the practice. Dr. Chen cancelled her SEO agency contract." },
      ],
    },
    quote: {
      text: "I literally typed 'best dentist near me Austin' into ChatGPT two months ago and my three biggest competitors showed up. I wasn't there at all. Now I'm in the top three results. Three patients last month told me they found me on 'the AI thing' — I never had patients say that before. The $99 a month pays for itself with one new patient.",
      name: "Dr. Sarah Chen",
      role: "Owner & Lead Dentist, Bright Smile Dental",
      location: "Austin, TX",
    },
  },
  {
    id: "torres-family-law",
    slug: "torres-family-law",
    industry: "Legal",
    badge: "bg-purple-50 text-purple-700 border-purple-100",
    business: "Torres Family Law",
    owner: "Marco Torres",
    location: "Miami, FL",
    initials: "MT",
    headline: "Cancelled the $1,800/mo agency. Top result on Claude in 5 weeks.",
    keyResult: "14 qualified leads/mo from AI search",
    keyResultSub: "$2,100/month saved vs. prior agency spend",
    metrics: [
      { icon: TrendingUp, label: "AI search leads (monthly)", value: "14", sub: "qualified consultations" },
      { icon: DollarSign, label: "Monthly savings", value: "$2,100", sub: "cancelled SEO agency" },
      { icon: Clock, label: "First Perplexity mention", value: "11 days", sub: "from signup" },
      { icon: Clock, label: "Top result on Claude", value: "5 wks", sub: "for 'family lawyer Miami'" },
    ],
    problem: {
      title: "Paying $1,800/month for an agency that couldn't explain AI search.",
      body: "Marco Torres built Torres Family Law over nine years into a well-respected Miami practice handling divorce, custody, and adoption cases. He was spending $1,800 a month with a digital marketing agency — and had been for three years. Google rankings were decent. But Marco started noticing that the type of inquiry coming through his website contact form had changed. More price shoppers, fewer serious cases. Then a colleague mentioned that a prospect had told her they'd asked Claude for a recommendation and found a competitor instead.",
      tried: [
        "Paying $1,800/month to an agency for SEO, citations, and 'digital presence management'",
        "Asked his agency about Perplexity and Claude visibility — they promised to 'look into it'",
        "Had a well-optimized Google Business Profile with 83 reviews",
        "Published case-result content that ranked well on Google but generated zero AI citations",
      ],
    },
    solution: {
      title: "Switched to Alphaa. Cancelled the agency the same week.",
      body: "When Marco ran his free Alphaa scan, it confirmed what he suspected: Torres Family Law had a score of 8/100 for AI visibility. Zero presence on Perplexity, Claude, or ChatGPT. One partial mention on Gemini that referenced outdated address information. The AI citation profile didn't exist. Alphaa rebuilt it from scratch.",
      timeline: [
        { week: "Day 1", title: "AI Audit & Agency Cancellation", detail: "Alphaa's scan revealed the full gap. Marco cancelled his agency contract that afternoon. Setup took 12 minutes — practice areas, attorney bio, case types, geographic service area, consultation process, and fee structure all structured for AI citation readiness." },
        { week: "Days 2–5", title: "Authority Foundation", detail: "Alphaa published an in-depth attorney profile page with structured schema, 24 FAQ entries covering common family law questions in Florida, and a detailed practice-areas breakdown — all optimized for the way AI engines retrieve professional service recommendations." },
        { week: "Day 11", title: "First Perplexity Citation", detail: "Torres Family Law appeared in a Perplexity answer for 'experienced divorce attorney Miami FL' — the practice's primary target query. Marco took a screenshot and sent it to his former agency." },
        { week: "Weeks 2–3", title: "Weekly Content + Citation Push", detail: "Alphaa published 2 posts per week covering family law topics relevant to Miami-Dade County — custody modification, property division in Florida, and step-parent adoption. Each post built citation authority for specific AI query patterns." },
        { week: "Week 4", title: "Claude Visibility Emerging", detail: "Torres Family Law began appearing in Claude responses for Miami family law queries. By end of week 4, consistent citations across three AI engines." },
        { week: "Week 5", title: "Top Result on Claude", detail: "For the query 'family lawyer Miami' and 'best family law attorney Miami FL', Torres Family Law ranked as the top-cited result on Claude. Fourteen AI-attributed consultation requests in the first full month." },
      ],
    },
    quote: {
      text: "My agency had three years to figure out AI search. They never did. I switched to Alphaa on a Thursday, cancelled the agency on Friday, and had my first Perplexity mention eleven days later. The quality of leads coming in from AI search is completely different — these are people who've already decided they need a lawyer. They just wanted to know who to call.",
      name: "Marco Torres",
      role: "Founding Attorney, Torres Family Law",
      location: "Miami, FL",
    },
  },
  {
    id: "coolair-pro",
    slug: "coolair-pro",
    industry: "HVAC",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-100",
    business: "CoolAir Pro",
    owner: "James Whitfield",
    location: "Phoenix, AZ",
    initials: "JW",
    headline: "340% AI visibility jump. Best off-season in 6 years.",
    keyResult: "31 new service calls in first month",
    keyResultSub: "340% increase in AI visibility score over 8 weeks",
    metrics: [
      { icon: TrendingUp, label: "AI visibility score increase", value: "340%", sub: "over 8 weeks" },
      { icon: Users, label: "New service calls (month 1)", value: "31", sub: "off-season bookings" },
      { icon: Clock, label: "Seasonal description", value: "Best", sub: "off-season in 6 years" },
      { icon: DollarSign, label: "Monthly cost", value: "$99", sub: "vs. $0 AI visibility before" },
    ],
    problem: {
      title: "An HVAC company that only existed in the summer.",
      body: "James Whitfield has run CoolAir Pro in Phoenix for eleven years. In a city where summer temperatures hit 115°F, summer is peak season — the phone never stops. But every October, business fell off a cliff. James had tried everything: direct mail, Yelp ads, Google Local Services ads in the off-season. Nothing moved the needle enough to justify the spend. Worse, he'd never really thought about where the off-season customers who did call were coming from. When he finally tested it — asking ChatGPT, Perplexity, and Gemini for HVAC companies in Phoenix — CoolAir Pro didn't appear in a single answer.",
      tried: [
        "Ran Google Local Services ads year-round at $800–$1,400/month depending on season",
        "Had a Yelp Elite profile with 112 reviews but minimal off-season traffic",
        "Tried a 'maintenance plan' promotion via direct mail — low conversion, high cost",
        "No structured content strategy; website hadn't been updated in two years",
      ],
    },
    solution: {
      title: "AI presence built for year-round queries, not just summer emergencies.",
      body: "Alphaa's audit showed CoolAir Pro at 6/100 for AI visibility — near zero. The problem wasn't just absence from AI engines; it was that the entire web presence was emergency-framed (AC repair, AC installation) rather than year-round service framed (furnace maintenance, duct cleaning, smart thermostat installation, winter prep). AI engines were recommending competitors for off-season queries because those competitors had content that matched. Alphaa rebuilt the presence with both dimensions.",
      timeline: [
        { week: "Days 1–2", title: "Full Service Restructure", detail: "Alphaa built out a complete AI citation profile covering all 14 service categories CoolAir Pro actually offered — not just AC repair. Furnace maintenance, duct cleaning, air quality testing, smart thermostat installation, and winter tune-ups all got structured service pages with FAQ schema." },
        { week: "Days 3–7", title: "Seasonal Content Foundation", detail: "First batch of AI-optimized content published: 'HVAC maintenance checklist for Phoenix winters', 'when to replace your furnace in Arizona', 'air quality issues unique to desert climates.' All structured to capture off-season AI query patterns." },
        { week: "Weeks 2–3", title: "Weekly Content Autopilot", detail: "Alphaa's autopilot published 2 posts per week to Google Business Profile and structured content feeds. Topics rotated through off-season services, Phoenix-specific climate advice, and maintenance scheduling content — all with rich structured data." },
        { week: "Week 3", title: "First AI Mentions", detail: "CoolAir Pro appeared in Perplexity for 'HVAC tune-up Phoenix' and in Gemini for 'furnace maintenance Phoenix AZ' — two queries with zero prior presence. AI visibility score jumped from 6 to 41 in three weeks." },
        { week: "Weeks 4–6", title: "Broad AI Engine Presence", detail: "Consistent citations across Perplexity, Gemini, and Claude. ChatGPT began citing CoolAir Pro for Phoenix HVAC queries. Service call volume in the traditionally dead months of November tracking ahead of the prior three years combined." },
        { week: "Week 8", title: "340% Visibility Score, Record Off-Season", detail: "AI visibility score reached 26/100 (340% increase from baseline 6). 31 service calls in the first full month on Alphaa — James Whitfield's best off-season in six years of tracking. Winter maintenance plans sold out for the first time ever." },
      ],
    },
    quote: {
      text: "For eleven years I thought off-season was just dead and there was nothing I could do about it. I'd run ads, mail postcards, whatever — nothing worked. Then I get on Alphaa, and eight weeks later I'm getting calls from people saying they asked AI for an HVAC company and found me. Thirty-one calls in a month I normally get eight. I don't know how to explain it except it works.",
      name: "James Whitfield",
      role: "Owner, CoolAir Pro",
      location: "Phoenix, AZ",
    },
  },
]

export type CaseStudy = (typeof caseStudies)[number]
export { caseStudies }

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug)
}
