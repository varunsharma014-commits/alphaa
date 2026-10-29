import { Clock, DollarSign, FileText, Search } from "lucide-react"

// Single source of truth for the example walkthroughs on /case-studies and
// /case-studies/<slug>. These are illustrative examples, not customer stories:
// no names, no quotes, no results presented as things that happened. Every
// figure is either a product fact (what the plan includes) or cost maths, and
// outcomes are phrased as what can happen. Slugs are kept because the pages rank.
const caseStudies = [
  {
    id: "bright-smile-dental",
    slug: "bright-smile-dental",
    industry: "Dental",
    badge: "bg-black/[0.04] text-[#1d1d1f] border-black/[0.08]",
    business: "A family dental practice",
    location: "Example: a mid-sized US city",
    headline: "What Alphaa's AI Agent does when ChatGPT names three other dentists instead of you.",
    keyResult: "$99/mo vs ~$1,200/mo",
    keyResultSub: "Alphaa Starter vs a typical local SEO agency retainer",
    metrics: [
      { icon: Search, label: "AIs checked every week", value: "4", sub: "ChatGPT, Gemini, Claude, Perplexity" },
      { icon: FileText, label: "Blog posts a month", value: "2", sub: "on Starter (4 on Pro)" },
      { icon: Clock, label: "Free check", value: "~60s", sub: "see what AI says today" },
      { icon: DollarSign, label: "Yearly cost difference", value: "$13,212", sub: "$14,400 agency vs $1,188 Alphaa" },
    ],
    problem: {
      title: "Patients ask ChatGPT for a dentist. It names three practices, and not this one.",
      body: "A typical picture: a well-reviewed family practice that grew on word of mouth. New-patient calls slow down. The owner asks ChatGPT \"who's a good family dentist near me?\" and gets three names, none of them hers. The practice has good reviews, but its website doesn't spell out its services, insurance, hours and dentists in a way AI assistants can read and trust.",
      tried: [
        "Pays a local SEO agency around $1,200 a month, mostly for Google rankings and a monthly report",
        "Has a Google Business Profile with good reviews, but posts on it rarely",
        "Publishes a blog post now and then, with no plan behind the topics",
        "Has never checked what ChatGPT, Gemini, Claude or Perplexity say about the practice",
      ],
    },
    solution: {
      title: "What the AI Agent does, week by week",
      body: "This is how Alphaa works for a practice like this. The owner approves anything public with one tap, and every website change can be undone.",
      timeline: [
        { week: "Day 1", title: "Find out why AI names someone else", detail: "The agent asks ChatGPT, Gemini, Claude and Perplexity the questions patients ask, such as \"family dentist near me\" and \"dentist that takes my insurance\", and shows which practices they name instead, and what those practices have that this one doesn't." },
        { week: "Week 1", title: "Fix the facts AI reads", detail: "It checks the practice's name, address, phone, hours and category everywhere AI looks, then drafts the fixes: structured data (schema), an llms.txt file and a services page that lists treatments, insurance accepted and the dentists' credentials." },
        { week: "Weeks 2–4", title: "Answer the questions patients ask AI", detail: "It turns the real questions patients ask AI into FAQ answers and blog posts (2 a month on Starter), drafts Google Business Profile posts (2 a week on Starter) and writes replies to new reviews, each waiting for one-tap approval." },
        { week: "Every week", title: "Re-check and report in plain English", detail: "It asks the four AIs again, watches what nearby practices publish, and sends a short weekly email: what it did, what's waiting for approval, and an alert the first time an AI names the practice." },
        { week: "Months 1–3", title: "When AI can start naming the practice", detail: "Each AI updates on its own schedule, so this varies. Alphaa's guarantee covers the wait: if none of the four AIs names the practice in any weekly check during the first 90 days, the next month is free." },
      ],
    },
    note: "This is an illustrative example of how Alphaa works for a dental practice. It is not a specific customer, and the agency fee is a typical figure, not a quote. Results vary, and no one can guarantee what an AI will say.",
  },
  {
    id: "torres-family-law",
    slug: "torres-family-law",
    industry: "Legal",
    badge: "bg-black/[0.04] text-[#1d1d1f] border-black/[0.08]",
    business: "A family law firm",
    location: "Example: a large US metro",
    headline: "What Alphaa's AI Agent does when prospects ask Claude for a family lawyer and get a competitor.",
    keyResult: "$99/mo vs ~$1,800/mo",
    keyResultSub: "Alphaa Starter vs a typical legal marketing agency retainer",
    metrics: [
      { icon: Search, label: "AIs checked every week", value: "4", sub: "ChatGPT, Gemini, Claude, Perplexity" },
      { icon: FileText, label: "Blog posts a month", value: "2", sub: "on Starter (4 on Pro)" },
      { icon: Clock, label: "Cancel", value: "2 clicks", sub: "month to month, no contract" },
      { icon: DollarSign, label: "Yearly cost difference", value: "$20,412", sub: "$21,600 agency vs $1,188 Alphaa" },
    ],
    problem: {
      title: "A respected firm that AI assistants don't know enough about to recommend.",
      body: "A typical picture: an established family law practice handling divorce, custody and adoption. Google rankings are fine, but a colleague mentions that a prospect asked Claude for a recommendation and called someone else. The firm's site describes its attorneys and practice areas in general terms, so AI assistants have little to quote when someone asks a specific question.",
      tried: [
        "Pays a marketing agency around $1,800 a month for SEO and \"digital presence\"",
        "Asked the agency about ChatGPT and Claude; got a promise to \"look into it\"",
        "Has a strong Google Business Profile with plenty of reviews",
        "Publishes case-result content that ranks on Google but isn't written to answer questions",
      ],
    },
    solution: {
      title: "What the AI Agent does, week by week",
      body: "This is how Alphaa works for a firm like this. Nothing goes live without the attorney's approval, and every website change can be undone.",
      timeline: [
        { week: "Day 1", title: "Find out why AI names someone else", detail: "The agent asks the four AIs the questions prospects ask, such as \"experienced divorce attorney near me\" and \"how is custody decided in my state\", and shows which firms they name and why." },
        { week: "Week 1", title: "Give AI clear facts about the firm", detail: "It drafts attorney profile pages with structured data, a clear practice-areas page and corrected firm details (address, phone, hours, category), so AI assistants can describe the firm accurately." },
        { week: "Weeks 2–4", title: "Answer the questions prospects ask AI", detail: "It writes FAQ answers and blog posts on the family law questions people ask AI in the firm's state, drafts Google Business Profile posts and review replies, all waiting for one-tap approval." },
        { week: "Every week", title: "Re-check and report in plain English", detail: "It re-asks the four AIs, watches what competing firms publish, and sends a short weekly email of what it did and what needs approval." },
        { week: "Months 1–3", title: "When AI can start naming the firm", detail: "Timing varies by AI and by market. If none of the four AIs names the firm in any weekly check during the first 90 days, the next month is free." },
      ],
    },
    note: "This is an illustrative example of how Alphaa works for a law firm. It is not a specific customer, and the agency fee is a typical figure, not a quote. Results vary, and no one can guarantee what an AI will say. Alphaa doesn't give legal advice; the firm approves every word published.",
  },
  {
    id: "coolair-pro",
    slug: "coolair-pro",
    industry: "HVAC",
    badge: "bg-black/[0.04] text-[#1d1d1f] border-black/[0.08]",
    business: "An HVAC company",
    location: "Example: a hot-climate US city",
    headline: "What Alphaa's AI Agent does for an HVAC company that AI only knows for summer emergencies.",
    keyResult: "$99/mo vs ~$1,100/mo",
    keyResultSub: "Alphaa Starter vs typical off-season Local Services ad spend",
    metrics: [
      { icon: Search, label: "AIs checked every week", value: "4", sub: "ChatGPT, Gemini, Claude, Perplexity" },
      { icon: FileText, label: "Google posts a week", value: "2", sub: "on Starter (4 on Pro)" },
      { icon: Clock, label: "Free check", value: "~60s", sub: "see what AI says today" },
      { icon: DollarSign, label: "Monthly cost", value: "$99", sub: "keeps working when ad spend stops" },
    ],
    problem: {
      title: "AI recommends this company for AC repair in July, and nobody else for the rest of the year.",
      body: "A typical picture: a long-running HVAC company that's slammed in summer and quiet in the off-season. Its website only talks about AC repair and installation. When people ask ChatGPT or Gemini about furnace tune-ups, duct cleaning or air quality, the AI names competitors that have pages about those services.",
      tried: [
        "Runs Local Services ads year-round, around $800–$1,400 a month depending on season",
        "Has plenty of reviews, but little off-season traffic from them",
        "Tried direct-mail maintenance-plan promotions with low response",
        "Website hasn't been updated in two years and lists only a few services",
      ],
    },
    solution: {
      title: "What the AI Agent does, week by week",
      body: "This is how Alphaa works for a company like this. The owner approves anything public with one tap, and every website change can be undone.",
      timeline: [
        { week: "Day 1", title: "Find out why AI names someone else", detail: "The agent asks the four AIs year-round questions, such as \"furnace tune-up near me\" and \"duct cleaning near me\", as well as AC repair, and shows who gets named for each." },
        { week: "Week 1", title: "Cover every service, not just AC", detail: "It drafts a clear page for each service the company actually offers (furnace maintenance, duct cleaning, air quality testing, thermostat installs, winter tune-ups) with FAQ structured data, and corrects business details where they're wrong." },
        { week: "Weeks 2–4", title: "Seasonal answers AI can quote", detail: "It writes posts on the off-season questions people ask AI in that climate, drafts Google Business Profile posts (2 a week on Starter) and review replies, all waiting for one-tap approval." },
        { week: "Every week", title: "Re-check and report in plain English", detail: "It re-asks the four AIs, watches what competitors publish, and sends a short weekly email of what it did and what needs approval." },
        { week: "Months 1–3", title: "When AI can start naming the company", detail: "Timing varies. Unlike ads, the pages keep working after they're published. If none of the four AIs names the company in any weekly check during the first 90 days, the next month is free." },
      ],
    },
    note: "This is an illustrative example of how Alphaa works for an HVAC company. It is not a specific customer, and the ad spend is a typical figure, not a quote. Results vary, and no one can guarantee what an AI will say.",
  },
]

export type CaseStudy = (typeof caseStudies)[number]
export { caseStudies }

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((c) => c.slug === slug)
}
