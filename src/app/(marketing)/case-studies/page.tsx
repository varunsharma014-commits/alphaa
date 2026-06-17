"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, BadgeCheck, ArrowRight, MapPin, TrendingUp, Clock, DollarSign, Users } from "lucide-react"
import { OrangePillButton } from "@/components/common/OrangePillButton"

const caseStudies = [
  {
    id: "bright-smile-dental",
    slug: "bright-smile-dental",
    industry: "Dental",
    industryColor: "from-blue-500/10",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/20",
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
      body: "Alphaa ran a full AI visibility audit on Bright Smile Dental across six AI engines. The report found zero citations, no structured practice data in any AI-indexed source, and a content gap that explained why competitors were getting recommended instead. The fix was systematic.",
      timeline: [
        { week: "Days 1–3", title: "AI Profile Build", detail: "Alphaa structured all practice data — services, specialties, insurance accepted, hours, Dr. Chen's credentials and background — into formats optimized for AI citation indexing across ChatGPT, Claude, Gemini, Perplexity, Google AI Overview, and Copilot." },
        { week: "Days 4–7", title: "Authority Signal Push", detail: "First round of AI-optimized content published: a detailed 'about the practice' page, FAQ schema markup for 18 common patient questions, and structured data markup for dental procedures. All designed to give AI engines something authoritative to cite." },
        { week: "Week 2", title: "First AI Mention", detail: "Bright Smile Dental appeared in a Perplexity answer for 'gentle dentist Austin accepting new patients' — the first AI citation ever. Dr. Chen called it 'surreal.'" },
        { week: "Weeks 3–4", title: "Weekly Content Cadence", detail: "Alphaa's autopilot published 2 posts per week to Google Business Profile and pushed structured updates to AI indexing pipelines. Each piece targeted a specific query patients were asking AI engines." },
        { week: "Week 5", title: "ChatGPT Breakthrough", detail: "Bright Smile Dental entered the top results on ChatGPT for 'dentist near me Austin' and 'best family dentist Austin TX' — the exact queries where three competitors had previously dominated." },
        { week: "Week 6+", title: "Consistent Top 3", detail: "Stable top-3 presence across ChatGPT and Perplexity. Google AI Overview also began featuring the practice. Dr. Chen cancelled her SEO agency contract." },
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
    industryColor: "from-purple-500/10",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/20",
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
      body: "When Marco ran his free Alphaa scan, it confirmed what he suspected: Torres Family Law had a score of 8/100 for AI visibility. Zero presence on Perplexity, Claude, or Copilot. One partial mention on Gemini that referenced outdated address information. The AI citation profile didn't exist. Alphaa rebuilt it from scratch.",
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
    industryColor: "from-cyan-500/10",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
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
        { week: "Weeks 4–6", title: "Broad AI Engine Presence", detail: "Consistent citations across Perplexity, Gemini, and Google AI Overview. ChatGPT began citing CoolAir Pro for Phoenix HVAC queries. Service call volume in the traditionally dead months of November tracking ahead of the prior three years combined." },
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

const filters = ["All", "Dental", "Legal", "HVAC"] as const
type Filter = (typeof filters)[number]

function CaseStudyCard({ cs }: { cs: (typeof caseStudies)[0] }) {
  return (
    <div className={`group rounded-2xl border border-white/[0.08] bg-gradient-to-b ${cs.industryColor} to-transparent overflow-hidden flex flex-col`}>
      {/* Top */}
      <div className="p-6 pb-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cs.badge}`}>
            {cs.industry}
          </span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-brand-orange text-brand-orange" />
            ))}
          </div>
        </div>

        <h3 className="text-white text-xl font-semibold leading-snug mb-1">{cs.business}</h3>
        <div className="flex items-center gap-1 text-white/40 text-xs mb-4">
          <MapPin className="w-3 h-3" />
          {cs.location}
        </div>

        <p className="text-white/70 text-sm leading-relaxed mb-5">{cs.headline}</p>

        {/* Key metric */}
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
          <p className="text-brand-orange text-2xl font-bold leading-none mb-1">{cs.keyResult}</p>
          <p className="text-white/40 text-xs">{cs.keyResultSub}</p>
        </div>
      </div>

      {/* Metric row */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.06] border-t border-white/[0.06]">
        {cs.metrics.slice(0, 2).map((m) => (
          <div key={m.label} className="bg-[#0a0a0a] p-4">
            <p className="text-white font-semibold text-base">{m.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-white/[0.06]">
        <Link
          href={`/case-studies/${cs.slug}`}
          className="flex items-center justify-between w-full text-white/60 hover:text-brand-orange text-sm font-medium transition-colors duration-200 group"
        >
          Read full case study
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  )
}

function FullCaseStudy({ cs }: { cs: (typeof caseStudies)[0] }) {
  return (
    <article id={cs.id} className="scroll-mt-24">
      {/* Hero */}
      <div className={`rounded-3xl border border-white/[0.08] bg-gradient-to-b ${cs.industryColor} to-transparent overflow-hidden mb-6`}>
        <div className="p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cs.badge}`}>
              {cs.industry}
            </span>
            <div className="flex items-center gap-1 text-white/40 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {cs.location}
            </div>
          </div>

          <h2 className="text-[32px] sm:text-[44px] font-semibold text-white leading-[1.1] tracking-tight mb-4 text-balance">
            {cs.business}
          </h2>
          <p className="text-white/60 text-lg sm:text-xl mb-8 max-w-2xl">{cs.headline}</p>

          {/* Hero metric */}
          <div className="inline-block rounded-2xl bg-brand-orange/10 border border-brand-orange/20 px-6 py-4">
            <p className="text-brand-orange text-4xl sm:text-5xl font-bold leading-none mb-1">{cs.keyResult}</p>
            <p className="text-white/50 text-sm">{cs.keyResultSub}</p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border-t border-white/[0.06]">
          {cs.metrics.map((m) => (
            <div key={m.label} className="bg-[#0a0a0a] p-5 sm:p-6">
              <m.icon className="w-4 h-4 text-brand-orange mb-3" />
              <p className="text-white text-2xl font-bold leading-none mb-1">{m.value}</p>
              <p className="text-white/70 text-sm font-medium">{m.label}</p>
              <p className="text-white/35 text-xs mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Problem */}
        <div className="lg:col-span-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <p className="text-red-400 text-xs font-semibold tracking-widest uppercase">The Problem</p>
          </div>
          <h3 className="text-white font-semibold text-lg mb-3 leading-snug">{cs.problem.title}</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-5">{cs.problem.body}</p>
          <div className="space-y-2">
            {cs.problem.tried.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 mt-1.5 flex-shrink-0" />
                <p className="text-white/50 text-sm leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solution + timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-orange" />
            <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase">The Solution</p>
          </div>
          <h3 className="text-white font-semibold text-lg mb-3 leading-snug">{cs.solution.title}</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">{cs.solution.body}</p>

          {/* Timeline */}
          <div className="space-y-4">
            {cs.solution.timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-orange text-[10px] font-bold">{i + 1}</span>
                  </div>
                  {i < cs.solution.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-white/[0.06] mt-2 mb-0" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-brand-orange text-xs font-semibold">{t.week}</span>
                    <span className="text-white text-sm font-semibold">{t.title}</span>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pull quote */}
      <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/5 p-7 sm:p-9 mb-6">
        <div className="max-w-3xl mx-auto">
          <svg className="w-8 h-8 text-brand-orange/40 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-white text-lg sm:text-xl leading-relaxed font-medium mb-6">
            {cs.quote.text}
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-sm font-bold flex-shrink-0">
              {cs.initials}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-white font-semibold text-sm">{cs.quote.name}</p>
                <BadgeCheck className="w-3.5 h-3.5 text-brand-orange" />
              </div>
              <p className="text-white/40 text-xs">{cs.quote.role} · {cs.quote.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold mb-1">Get similar results for your business</p>
          <p className="text-white/40 text-sm">Free AI visibility scan — see exactly where you stand in 2 minutes.</p>
        </div>
        <OrangePillButton href="/scan" size="md" className="flex-shrink-0">
          Scan my business →
        </OrangePillButton>
      </div>
    </article>
  )
}

export default function CaseStudiesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All")

  const filtered = activeFilter === "All"
    ? caseStudies
    : caseStudies.filter((cs) => cs.industry === activeFilter)

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center bottom, rgba(255,107,26,0.15) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-semibold mb-7 tracking-wide uppercase">
            Case Studies
          </div>
          <h1 className="text-[40px] sm:text-[58px] font-semibold leading-[1.05] tracking-[-0.02em] text-white mb-5 text-balance">
            Real businesses.{" "}
            <span className="text-brand-orange">Real AI visibility.</span>
            <br />
            Real results.
          </h1>
          <p className="text-white/55 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Every case study below is a real customer. Real numbers. Real timelines. See how businesses — local and online — went from invisible on AI search to booked out.
          </p>

          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "2 weeks", label: "avg. time to first AI mention" },
              { value: "$1,400/mo", label: "avg. agency savings" },
              { value: "1,200+", label: "businesses on Alphaa" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 text-center">
                <p className="text-white text-2xl font-bold mb-1">{s.value}</p>
                <p className="text-white/35 text-xs leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter + cards */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                  activeFilter === f
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "text-white/50 border-white/[0.08] hover:border-white/20 hover:text-white/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
            {filtered.map((cs) => (
              <CaseStudyCard key={cs.id} cs={cs} />
            ))}
          </div>

          {/* Full case studies */}
          <div className="space-y-20">
            <div className="text-center mb-8">
              <p className="text-white/30 text-xs font-semibold tracking-widest uppercase">Full Case Studies</p>
            </div>
            {filtered.map((cs) => (
              <FullCaseStudy key={cs.id} cs={cs} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 pb-28">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-3xl border border-brand-orange/20 bg-gradient-to-b from-brand-orange/8 to-transparent overflow-hidden p-10 sm:p-14 text-center"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,26,0.18) 0%, transparent 70%)" }}
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-brand-orange text-xs font-semibold tracking-widest uppercase mb-4">Ready to be next?</p>
              <h2 className="text-[32px] sm:text-[44px] font-semibold text-white leading-[1.1] tracking-tight mb-4 text-balance">
                Find out if AI search
                <br />knows your business.
              </h2>
              <p className="text-white/50 text-base sm:text-lg mb-8 max-w-xl mx-auto">
                Run a free scan in 2 minutes. No signup required. See your AI visibility score and exactly where you're missing.
              </p>
              <OrangePillButton href="/scan" size="lg">
                Scan my business for free →
              </OrangePillButton>
              <p className="text-white/25 text-xs mt-4">$99/mo · No setup fee · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
