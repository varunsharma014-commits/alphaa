"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Check,
  Star,
  Search,
  Sparkles,
  Bot,
  FileText,
  TrendingUp,
  CheckCircle2,
} from "lucide-react"
import { ScoreRing } from "@/components/common/ScoreRing"
import {
  ChatGPTLogo,
  ClaudeLogo,
  GeminiLogo,
  PerplexityLogo,
  GoogleAILogo,
  CopilotLogo,
} from "@/components/marketing/AiEngineLogos"

// ─────────────────────────────────────────────────────────────────────────────
// NEW HOME PAGE (candidate v3) — /new-home-page
//
// Light, Apple-inspired funnel. Trust-first ordering (pricing moved late):
// hero → logos → how it works → features → cost savings → reviews → case
// studies → pricing → FAQ → CTA. Continuous CSS animation for floating engine
// icons + marquees; IntersectionObserver drives Apple-style reveal-on-scroll.
// noindex handled by the robots meta tag rendered below (client component).
// ─────────────────────────────────────────────────────────────────────────────

const HERO_ENGINES: { name: string; status: string; tone: "green" | "amber" | "muted" }[] = [
  { name: "ChatGPT", status: "Recommending you", tone: "green" },
  { name: "Google AI", status: "Recommending you", tone: "green" },
  { name: "Perplexity", status: "Sometimes", tone: "amber" },
  { name: "Gemini", status: "Working on it", tone: "muted" },
]

const TONE: Record<"green" | "amber" | "muted", string> = {
  green: "text-[#1d8a4e] bg-[#e8f5ee]",
  amber: "text-[#9a6a00] bg-[#fdf3e0]",
  muted: "text-[#86868b] bg-[#f0f0f2]",
}

// Scattered floating engine icons for the hero.
const FLOATERS = [
  { name: "ChatGPT", Logo: ChatGPTLogo, color: "#10a37f", top: "12%", left: "6%", d: 0, dur: 7 },
  { name: "Claude", Logo: ClaudeLogo, color: "#d97757", top: "20%", left: "84%", d: 1.2, dur: 8 },
  { name: "Gemini", Logo: GeminiLogo, color: "#4285f4", top: "58%", left: "4%", d: 0.6, dur: 9 },
  { name: "Perplexity", Logo: PerplexityLogo, color: "#20808d", top: "66%", left: "88%", d: 1.8, dur: 7.5 },
  { name: "Google AI", Logo: GoogleAILogo, color: "#4285f4", top: "6%", left: "60%", d: 2.1, dur: 8.5 },
  { name: "Copilot", Logo: CopilotLogo, color: "#0078d4", top: "78%", left: "44%", d: 0.9, dur: 9.5 },
]

const LOGOS = ["Bright Smile Dental", "Northside HVAC", "Lotus Yoga", "Corner Bistro", "Peak Realty", "Sunset Med Spa", "Ironline Fitness", "Harbor Law"]

const STEPS = [
  { icon: Search, title: "Run a free scan", body: "60 seconds, no signup. We check all six AI engines and show exactly where you stand today." },
  { icon: Bot, title: "We go to work", body: "Content, schema, Google posts and fixes — published automatically, tuned to your business and city." },
  { icon: Sparkles, title: "AI recommends you", body: "Watch your presence score climb as engines start naming you in answers. Reported every week." },
]

const FEATURES = [
  { kicker: "Visibility", title: "See what AI says about you.", body: "Track exactly how ChatGPT, Gemini, Perplexity and Google AI answer when your customers ask. No more guessing.", visual: "engines" as const },
  { kicker: "Content", title: "Publishing on autopilot.", body: "We write and publish optimized articles and Google Business posts every week — in your voice, with zero work from you.", visual: "content" as const },
  { kicker: "Proof", title: "A score that climbs.", body: "One presence score, updated weekly, that shows your visibility going up — and every action we took to get it there.", visual: "trend" as const },
]

const REVIEWS = [
  { avatar: "/avatars/a1.jpg", name: "Maria Alvarez", business: "Bright Smile Dental", text: "ChatGPT now recommends us when people ask for a dentist nearby. New patients mention it constantly." },
  { avatar: "/avatars/a2.jpg", name: "James Okafor", business: "Northside HVAC", text: "We fired our SEO agency and get better answers on autopilot for a tenth of the price." },
  { avatar: "/avatars/a3.jpg", name: "Priya Nair", business: "Lotus Yoga Studio", text: "Set it up in an afternoon. Now we show up everywhere that actually matters." },
  { avatar: "/avatars/a4.jpg", name: "Daniel Weiss", business: "Corner Bistro", text: "Reservations are up and half our new guests found us through an AI recommendation." },
  { avatar: "/avatars/a1.jpg", name: "Sofia Romano", business: "Sunset Med Spa", text: "Finally an SEO tool that speaks plain English. I know exactly what it's doing each week." },
  { avatar: "/avatars/a2.jpg", name: "Marcus Lee", business: "Ironline Fitness", text: "Our Perplexity and Gemini mentions went from zero to first-choice in two months." },
]

const CASES = [
  { business: "Bright Smile Dental", industry: "Dental · Austin, TX", headline: "3.4× more AI mentions in 60 days", chart: [8, 12, 11, 18, 26, 34, 41, 58], m1: { v: "3.4×", l: "AI mentions" }, m2: { v: "+128", l: "new patients / yr" } },
  { business: "Northside HVAC", industry: "Home services · Denver, CO", headline: "+61% inbound calls, $0 agency spend", chart: [10, 14, 20, 22, 31, 44, 52, 69], m1: { v: "+61%", l: "calls from search" }, m2: { v: "$0", l: "agency spend" } },
  { business: "Lotus Yoga Studio", industry: "Fitness · Portland, OR", headline: "#1 recommended studio in Perplexity", chart: [5, 9, 15, 19, 28, 33, 47, 61], m1: { v: "#1", l: "in Perplexity" }, m2: { v: "4 hrs", l: "to set up" } },
]

const PLANS = [
  { name: "Starter", price: "99", tagline: "Everything to get found on AI search.", features: ["All 6 AI engines tracked", "Weekly content + Google posts", "Schema & AEO markup", "Weekly reports"], featured: false },
  { name: "Pro", price: "199", tagline: "For businesses that want to dominate their market.", features: ["Everything in Starter", "Competitor tracking", "Keyword rankings (Search Console)", "Review management", "Priority publishing"], featured: true },
]

const FAQS = [
  { q: "What is AI Search Optimization?", a: "It's making sure AI engines like ChatGPT, Gemini and Perplexity know your business exists, understand what you do, and recommend you when customers ask. Traditional SEO targets Google's blue links; we target the answers people actually read now." },
  { q: "Do I need to do anything?", a: "No. After a two-minute setup, alphaa writes content, publishes Google posts, adds schema, and tracks your visibility automatically. You get a plain-English report each week." },
  { q: "How is this different from an SEO agency?", a: "Agencies charge $1,000+/month, take weeks to ramp, and mostly ignore AI engines. alphaa runs automatically for $99–199/month and is built specifically to get you cited by AI." },
  { q: "How fast will I see results?", a: "Most businesses see movement in their presence score within the first few weeks as content and schema get indexed. AI engines update on their own cadence, and we report progress weekly." },
  { q: "Is there a contract?", a: "No lock-in. It's month-to-month, and there's a 14-day free trial so you can see your score and our work before you pay." },
]

// Light-theme area chart used in the case-study cards.
function AreaChart({ points, className = "" }: { points: number[]; className?: string }) {
  const w = 260, h = 80
  const max = Math.max(...points, 1)
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => [i * step, h - (p / max) * (h - 8) - 4])
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="nhFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0071e3" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#nhFill)" />
      <path d={line} fill="none" stroke="#0071e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const CSS = `
@keyframes nhFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-16px) } }
@keyframes nhMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
.nh-float { animation: nhFloat var(--dur,8s) ease-in-out infinite; animation-delay: var(--d,0s); }
.nh-marquee { display: flex; width: max-content; animation: nhMarquee var(--mdur,40s) linear infinite; }
.nh-marquee:hover { animation-play-state: paused; }
.nh-reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
.nh-reveal.nh-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .nh-float, .nh-marquee { animation: none; }
  .nh-reveal { opacity: 1; transform: none; transition: none; }
}
`

export default function NewHomePage() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("nh-in")
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    els.forEach((el) => {
      el.classList.add("nh-reveal")
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <meta name="robots" content="noindex,nofollow" />

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <section id="overview" className="relative overflow-hidden">
        <div className="relative max-w-[1024px] mx-auto px-6 pt-24 pb-20 text-center">
          {FLOATERS.map((f) => (
            <div
              key={f.name}
              className="nh-float hidden sm:flex absolute w-14 h-14 rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-black/[0.04] items-center justify-center"
              style={{ top: f.top, left: f.left, ["--d" as string]: `${f.d}s`, ["--dur" as string]: `${f.dur}s`, color: f.color }}
              aria-hidden="true"
            >
              <f.Logo className="w-7 h-7" />
            </div>
          ))}

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f5f5f7] text-[#6e6e73] text-[13px] font-medium mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]" />
              AI Search Optimization, on autopilot
            </div>
            <h1 className="text-[44px] sm:text-[72px] lg:text-[84px] font-semibold leading-[1.03] tracking-[-0.03em] text-[#1d1d1f] max-w-4xl mx-auto">
              Get found on{" "}
              <span className="bg-gradient-to-r from-[#0071e3] to-[#8e5cff] bg-clip-text text-transparent">AI search.</span>
            </h1>
            <p className="text-[19px] sm:text-[24px] leading-[1.4] text-[#6e6e73] max-w-2xl mx-auto mt-6">
              We get your business cited by ChatGPT, Gemini and Google AI — automatically. For $99 a month, not $1,000.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 text-[17px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ED] px-7 py-3 rounded-full transition-colors duration-200"
              >
                Get your free score <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how" className="text-[17px] font-medium text-[#0071e3] hover:underline inline-flex items-center gap-1">
                See how it works <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[13px] text-[#86868b] mt-5">60 seconds · no signup · no credit card</p>
          </div>

          <div className="relative mt-16 max-w-3xl mx-auto" data-reveal>
            <div className="rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-black/[0.06] overflow-hidden text-left">
              <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-black/[0.06] bg-[#fbfbfd]">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[#86868b] text-[12px]">app.alphaa.app/dashboard</span>
              </div>
              <div className="p-6 grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-[#f5f5f7] p-5 flex flex-col items-center justify-center text-center">
                  <ScoreRing score={82} size={92} />
                  <p className="text-[#6e6e73] text-[12px] mt-3">Presence score</p>
                  <p className="text-[#1d8a4e] text-[12px] font-medium">↑ +9 this month</p>
                </div>
                <div className="sm:col-span-2 rounded-2xl bg-[#f5f5f7] p-5">
                  <p className="text-[#86868b] text-[11px] uppercase tracking-wider mb-3">Where people find you</p>
                  <div className="space-y-3">
                    {HERO_ENGINES.map((e) => (
                      <div key={e.name} className="flex items-center justify-between">
                        <span className="text-[#1d1d1f] text-[14px] font-medium">{e.name}</span>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TONE[e.tone]}`}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ LOGO MARQUEE ═══════════════════════════════════════════════════ */}
      <section className="py-14 border-y border-black/[0.06] bg-[#fbfbfd] overflow-hidden">
        <p className="text-center text-[13px] text-[#86868b] mb-8">Trusted by local businesses everywhere</p>
        <div className="relative">
          <div className="nh-marquee" style={{ ["--mdur" as string]: "45s" }}>
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span key={i} className="text-[20px] font-semibold text-[#b0b0b5] whitespace-nowrap px-10">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════════ */}
      <section id="how" className="py-28 px-6">
        <div className="max-w-[1024px] mx-auto">
          <div className="text-center mb-20" data-reveal>
            <p className="text-[15px] font-semibold text-[#0071e3] mb-3">How it works</p>
            <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
              From invisible to recommended.
            </h2>
            <p className="text-[19px] text-[#6e6e73] mt-5 max-w-xl mx-auto">Three steps. Then it runs itself.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title} data-reveal style={{ transitionDelay: `${i * 90}ms` }} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
                  <s.icon className="w-7 h-7 text-[#0071e3]" />
                </div>
                <p className="text-[13px] font-semibold text-[#86868b] mb-2">STEP {i + 1}</p>
                <h3 className="text-[22px] font-semibold text-[#1d1d1f] mb-3">{s.title}</h3>
                <p className="text-[16px] leading-relaxed text-[#6e6e73]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═══════════════════════════════════════════════════════ */}
      <section id="features" className="px-6 bg-[#f5f5f7]">
        <div className="max-w-[1024px] mx-auto py-20 text-center" data-reveal>
          <p className="text-[15px] font-semibold text-[#0071e3] mb-3">Features</p>
          <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
            A whole SEO team, running itself.
          </h2>
        </div>
        <div className="max-w-[1024px] mx-auto space-y-6 pb-20">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              className="grid md:grid-cols-2 gap-8 items-center bg-white rounded-[28px] p-8 sm:p-12"
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <p className="text-[14px] font-semibold text-[#0071e3] mb-3">{f.kicker}</p>
                <h3 className="text-[30px] sm:text-[38px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#1d1d1f]">{f.title}</h3>
                <p className="text-[18px] leading-relaxed text-[#6e6e73] mt-4">{f.body}</p>
              </div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <FeatureVisual kind={f.visual} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ COST SAVINGS ═══════════════════════════════════════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-[1024px] mx-auto text-center" data-reveal>
          <p className="text-[15px] font-semibold text-[#0071e3] mb-3">Cost savings</p>
          <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
            A tenth of the price of an agency.
          </h2>
          <div className="mt-16 grid sm:grid-cols-3 gap-6 items-stretch text-left">
            <div className="rounded-[24px] border border-black/[0.08] p-8">
              <p className="text-[14px] text-[#86868b] mb-2">SEO agency</p>
              <p className="text-[44px] font-semibold text-[#1d1d1f] tracking-tight leading-none">$1,000<span className="text-[20px] text-[#86868b] font-normal">+/mo</span></p>
              <ul className="mt-6 space-y-2 text-[14px] text-[#6e6e73]">
                <li>Weeks to onboard</li>
                <li>Mostly ignores AI engines</li>
                <li>Long contracts</li>
              </ul>
            </div>
            <div className="rounded-[24px] bg-[#0071e3] p-8 text-white shadow-[0_20px_60px_rgba(0,113,227,0.3)]">
              <p className="text-[14px] text-white/70 mb-2">alphaa</p>
              <p className="text-[44px] font-semibold tracking-tight leading-none">$99<span className="text-[20px] text-white/70 font-normal">/mo</span></p>
              <ul className="mt-6 space-y-2 text-[14px] text-white/90">
                <li>Live in minutes</li>
                <li>Built for AI engines</li>
                <li>No lock-in, cancel anytime</li>
              </ul>
            </div>
            <div className="rounded-[24px] border border-black/[0.08] p-8 flex flex-col justify-center">
              <p className="text-[14px] text-[#86868b] mb-2">You save</p>
              <p className="text-[44px] font-semibold text-[#1d8a4e] tracking-tight leading-none">$10,800</p>
              <p className="text-[14px] text-[#6e6e73] mt-2">every year, vs. a typical agency retainer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS SLIDER ═════════════════════════════════════════════════ */}
      <section id="reviews" className="py-24 bg-[#f5f5f7] overflow-hidden">
        <div className="text-center mb-16 px-6" data-reveal>
          <p className="text-[15px] font-semibold text-[#0071e3] mb-3">Loved by owners</p>
          <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
            Don&apos;t take our word for it.
          </h2>
        </div>
        <div className="relative">
          <div className="nh-marquee" style={{ ["--mdur" as string]: "60s" }}>
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="w-[360px] flex-shrink-0 mx-3 bg-white rounded-[22px] p-7 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex gap-0.5 mb-4">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="w-4 h-4 text-[#febc2e]" fill="currentColor" />
                  ))}
                </div>
                <p className="text-[16px] leading-relaxed text-[#1d1d1f]">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-3 mt-6">
                  <Image src={r.avatar} width={40} height={40} alt="" aria-hidden="true" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#1d1d1f]">{r.name}</p>
                    <p className="text-[13px] text-[#86868b]">{r.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CASE STUDIES ═══════════════════════════════════════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-[1024px] mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[15px] font-semibold text-[#0071e3] mb-3">Case studies</p>
            <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
              Real businesses. Real growth.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CASES.map((c, i) => (
              <div key={c.business} data-reveal style={{ transitionDelay: `${i * 90}ms` }} className="rounded-[24px] border border-black/[0.08] p-7 flex flex-col">
                <p className="text-[13px] text-[#86868b]">{c.industry}</p>
                <h3 className="text-[20px] font-semibold text-[#1d1d1f] mt-2 leading-snug">{c.headline}</h3>
                <div className="my-6 rounded-2xl bg-[#f5f5f7] p-3">
                  <AreaChart points={c.chart} className="w-full h-16" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <div>
                    <p className="text-[28px] font-semibold text-[#0071e3] leading-none">{c.m1.v}</p>
                    <p className="text-[12px] text-[#86868b] mt-1.5">{c.m1.l}</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-semibold text-[#1d1d1f] leading-none">{c.m2.v}</p>
                    <p className="text-[12px] text-[#86868b] mt-1.5">{c.m2.l}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING (late — after trust) ═══════════════════════════════════ */}
      <section id="pricing" className="py-28 px-6 bg-[#f5f5f7]">
        <div className="max-w-[880px] mx-auto">
          <div className="text-center mb-16" data-reveal>
            <p className="text-[15px] font-semibold text-[#0071e3] mb-3">Pricing</p>
            <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
              Simple pricing. 14-day free trial.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                data-reveal
                className={`rounded-[24px] p-8 bg-white ${plan.featured ? "ring-2 ring-[#0071e3] shadow-[0_20px_60px_rgba(0,113,227,0.15)]" : "border border-black/[0.08]"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[20px] font-semibold text-[#1d1d1f]">{plan.name}</h3>
                  {plan.featured && <span className="text-[12px] font-semibold text-[#0071e3] bg-[#eaf3fe] px-3 py-1 rounded-full">Most popular</span>}
                </div>
                <p className="text-[15px] text-[#6e6e73] mt-2">{plan.tagline}</p>
                <p className="mt-6 text-[48px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
                  ${plan.price}<span className="text-[18px] text-[#86868b] font-normal">/mo</span>
                </p>
                <Link
                  href="/signup"
                  className={`mt-7 block text-center text-[15px] font-medium px-6 py-3 rounded-full transition-colors ${
                    plan.featured ? "bg-[#0071e3] hover:bg-[#0077ED] text-white" : "bg-[#f5f5f7] hover:bg-[#ececee] text-[#1d1d1f]"
                  }`}
                >
                  Start free trial
                </Link>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((ft) => (
                    <li key={ft} className="flex items-start gap-2.5 text-[15px] text-[#1d1d1f]">
                      <Check className="w-4 h-4 text-[#0071e3] flex-shrink-0 mt-1" />
                      {ft}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-[760px] mx-auto">
          <div className="text-center mb-14" data-reveal>
            <p className="text-[15px] font-semibold text-[#0071e3] mb-3">FAQ</p>
            <h2 className="text-[40px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#1d1d1f]">
              Questions, answered.
            </h2>
          </div>
          <div className="border-t border-black/[0.08]" data-reveal>
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5 border-b border-black/[0.08]">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[19px] font-medium text-[#1d1d1f]">
                  {f.q}
                  <span className="text-[#0071e3] text-2xl leading-none transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="text-[16px] leading-relaxed text-[#6e6e73] mt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-[#f5f5f7]">
        <div className="max-w-[760px] mx-auto text-center" data-reveal>
          <div className="flex items-center justify-center gap-1 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-5 h-5 text-[#febc2e]" fill="currentColor" />
            ))}
            <span className="text-[14px] text-[#86868b] ml-2">Rated 4.9 by 1,000+ businesses</span>
          </div>
          <h2 className="text-[44px] sm:text-[64px] font-semibold leading-[1.04] tracking-[-0.03em] text-[#1d1d1f]">
            See where you stand in AI answers.
          </h2>
          <p className="text-[20px] text-[#6e6e73] mt-5">Free 60-second scan. No signup, no card.</p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 text-[17px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ED] px-8 py-3.5 rounded-full transition-colors duration-200"
            >
              Get your free score <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Feature visuals (light mock panels) ──────────────────────────────────────
function FeatureVisual({ kind }: { kind: "engines" | "content" | "trend" }) {
  if (kind === "engines") {
    return (
      <div className="rounded-2xl bg-[#f5f5f7] p-5 space-y-3">
        {HERO_ENGINES.map((e) => (
          <div key={e.name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
            <span className="text-[14px] font-medium text-[#1d1d1f]">{e.name}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${TONE[e.tone]}`}>{e.status}</span>
          </div>
        ))}
      </div>
    )
  }
  if (kind === "content") {
    const items = [
      { icon: FileText, t: "Published: “Best HVAC tips for winter”" },
      { icon: FileText, t: "Google post: Seasonal tune-up offer" },
      { icon: CheckCircle2, t: "Schema markup added to 12 pages" },
    ]
    return (
      <div className="rounded-2xl bg-[#f5f5f7] p-5 space-y-3">
        {items.map((it) => (
          <div key={it.t} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5">
            <it.icon className="w-4 h-4 text-[#1d8a4e] flex-shrink-0" />
            <span className="text-[14px] text-[#1d1d1f]">{it.t}</span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-[#f5f5f7] p-6 flex items-center gap-6">
      <ScoreRing score={82} size={96} />
      <div>
        <div className="flex items-center gap-2 text-[#1d8a4e] text-[15px] font-semibold">
          <TrendingUp className="w-4 h-4" /> +9 this month
        </div>
        <p className="text-[13px] text-[#86868b] mt-1">Presence score climbing every week.</p>
      </div>
    </div>
  )
}
