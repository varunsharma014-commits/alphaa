import type { Metadata } from "next"
import Image from "next/image"
import {
  CheckCircle2,
  TrendingUp,
  FileText,
  ArrowUpRight,
  ArrowRight,
  Search,
  Bot,
  Sparkles,
  BarChart3,
  MessageSquareText,
  ShieldCheck,
  Star,
  X,
  Check,
  Zap,
} from "lucide-react"
import { MonoNumber } from "@/components/common/MonoNumber"
import { OrangePillButton } from "@/components/common/OrangePillButton"
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
// NEW HOME PAGE (candidate) — /new-home-page
//
// Dark theme kept. Full-funnel redesign modelled on getautoseo.com /
// babylovegrowth.ai: image-forward, minimal per-section copy, product mockups as
// the imagery, big proof numbers, growth charts, and a clear top-to-bottom
// conversion path. Self-contained so it can be iterated without touching the
// live `/` sections. noindex so it never competes with `/` in search.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "New Home Page (preview) — Alphaa",
  robots: { index: false, follow: false },
}

const engines = [
  { name: "ChatGPT", Logo: ChatGPTLogo },
  { name: "Claude", Logo: ClaudeLogo },
  { name: "Gemini", Logo: GeminiLogo },
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Google AI", Logo: GoogleAILogo },
  { name: "Copilot", Logo: CopilotLogo },
]

// ── Small inline area-chart used in the results cards ────────────────────────
// Rising area chart, drawn from a normalized set of points (0–100 on the y).
function AreaChart({
  points,
  className = "",
}: {
  points: number[]
  className?: string
}) {
  const w = 260
  const h = 90
  const max = Math.max(...points, 1)
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => [i * step, h - (p / max) * (h - 10) - 4])
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B1A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF6B1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartFill)" />
      <path d={line} fill="none" stroke="#FF6B1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === coords.length - 1 ? 3.5 : 0} fill="#FF6B1A" />
      ))}
    </svg>
  )
}

const HERO_ENGINES: { name: string; status: string; tone: "green" | "amber" | "muted" }[] = [
  { name: "ChatGPT", status: "Recommending you", tone: "green" },
  { name: "Google AI", status: "Recommending you", tone: "green" },
  { name: "Perplexity", status: "Sometimes", tone: "amber" },
  { name: "Gemini", status: "Working on it", tone: "muted" },
]

const TONE: Record<"green" | "amber" | "muted", string> = {
  green: "text-green-400 border-green-500/20 bg-green-500/10",
  amber: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  muted: "text-white/40 border-white/10 bg-white/[0.03]",
}

const WEEK = [
  { icon: FileText, text: "2 Google posts published" },
  { icon: TrendingUp, text: "Up on 5 keywords" },
  { icon: CheckCircle2, text: "Fixed 3 site issues" },
]

// ── Feature grid ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Search,
    title: "AI visibility tracking",
    body: "See exactly what ChatGPT, Gemini, Perplexity & Google AI say when customers ask about businesses like yours.",
  },
  {
    icon: FileText,
    title: "Content on autopilot",
    body: "We write and publish optimized articles and Google Business posts every week — in your voice, no work from you.",
  },
  {
    icon: Sparkles,
    title: "Schema & AEO markup",
    body: "Structured data that makes your site legible to AI engines, so they cite you instead of a competitor.",
  },
  {
    icon: BarChart3,
    title: "Keyword rankings",
    body: "Track where you rank in Google Search — synced straight from Search Console, in plain English.",
  },
  {
    icon: MessageSquareText,
    title: "Reviews & competitors",
    body: "AI-drafted review replies and a live view of what competitors are doing to win the same customers.",
  },
  {
    icon: ShieldCheck,
    title: "Weekly reports",
    body: "A plain-English summary of exactly what we did and what moved — in your inbox every week.",
  },
]

// ── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    title: "Run a free scan",
    body: "60 seconds, no signup. We check all six AI engines and show you where you stand today.",
  },
  {
    n: "02",
    title: "We go to work",
    body: "Content, schema, Google posts, fixes — all published automatically, tuned to your business and city.",
  },
  {
    n: "03",
    title: "AI starts recommending you",
    body: "Watch your presence score climb as engines begin naming you in answers. Reported every week.",
  },
]

// ── Proof / results cards ────────────────────────────────────────────────────
const PROOF = [
  {
    avatar: "/avatars/a1.jpg",
    name: "Maria Alvarez",
    business: "Bright Smile Dental",
    chart: [8, 12, 11, 18, 26, 34, 41, 58],
    statA: { v: "3.4×", l: "more AI mentions" },
    statB: { v: "+128", l: "new patients / yr" },
    quote: "ChatGPT now names us when people ask for a dentist nearby. That never used to happen.",
  },
  {
    avatar: "/avatars/a2.jpg",
    name: "James Okafor",
    business: "Northside HVAC",
    chart: [10, 14, 20, 22, 31, 44, 52, 69],
    statA: { v: "+61%", l: "calls from search" },
    statB: { v: "$0", l: "agency spend" },
    quote: "We fired our SEO agency and get better answers on autopilot for a tenth of the price.",
  },
  {
    avatar: "/avatars/a3.jpg",
    name: "Priya Nair",
    business: "Lotus Yoga Studio",
    chart: [5, 9, 15, 19, 28, 33, 47, 61],
    statA: { v: "#1", l: "in Perplexity" },
    statB: { v: "4 hrs", l: "to set up" },
    quote: "Set it up in an afternoon. Now we show up everywhere that actually matters.",
  },
]

// ── Comparison ───────────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { label: "Monthly cost", alphaa: "$99–199", agency: "$1,000+", diy: "Your time" },
  { label: "Optimizes for AI engines", alphaa: true, agency: "Rarely", diy: false },
  { label: "Publishes content for you", alphaa: true, agency: true, diy: false },
  { label: "Live visibility tracking", alphaa: true, agency: false, diy: false },
  { label: "Setup time", alphaa: "Minutes", agency: "Weeks", diy: "Ongoing" },
  { label: "Weekly reporting", alphaa: true, agency: "Monthly", diy: false },
]

// ── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Starter",
    price: "99",
    tagline: "Everything to get found on AI search.",
    features: ["All 6 AI engines tracked", "Weekly content + Google posts", "Schema & AEO markup", "Weekly reports"],
    featured: false,
  },
  {
    name: "Pro",
    price: "199",
    tagline: "For businesses that want to dominate their market.",
    features: [
      "Everything in Starter",
      "Competitor tracking",
      "Keyword rankings (Search Console)",
      "Review management",
      "Priority publishing",
    ],
    featured: true,
  },
]

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "What is AI Search Optimization?",
    a: "It's making sure AI engines like ChatGPT, Gemini and Perplexity know your business exists, understand what you do, and recommend you when customers ask. Traditional SEO targets Google's blue links; we target the answers people actually read now.",
  },
  {
    q: "Do I need to do anything?",
    a: "No. After a two-minute setup, alphaa writes content, publishes Google posts, adds schema, and tracks your visibility automatically. You get a plain-English report each week.",
  },
  {
    q: "How is this different from an SEO agency?",
    a: "Agencies charge $1,000+/month, take weeks to ramp, and mostly ignore AI engines. alphaa runs automatically for $99–199/month and is built specifically to get you cited by AI.",
  },
  {
    q: "How fast will I see results?",
    a: "Most businesses see movement in their presence score within the first few weeks as content and schema get indexed. AI engines update on their own cadence, and we report progress weekly.",
  },
  {
    q: "Is there a contract?",
    a: "No lock-in. It's month-to-month, and there's a 14-day free trial so you can see your score and our work before you pay.",
  },
]

export default function NewHomePage() {
  return (
    <>
      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-24 pb-20">
        <div
          className="absolute top-[-140px] left-1/2 -translate-x-1/2 w-[1000px] h-[640px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(255,107,26,0.16) 0%, transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
              AI Search Optimization, on autopilot
            </div>
            <h1 className="text-[42px] sm:text-[58px] lg:text-[64px] font-semibold leading-[1.02] tracking-[-0.02em] text-white text-balance">
              Get found on{" "}
              <span className="serif-italic text-brand-orange">AI search.</span>
            </h1>
            <p className="text-white/55 text-lg sm:text-xl leading-relaxed max-w-md mx-auto lg:mx-0 mt-6">
              We get your business cited by ChatGPT, Gemini &amp; Google AI — automatically, for
              $99/mo, not $1,000.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:justify-center lg:justify-start">
              <OrangePillButton href="/scan" size="lg">
                Get your free score
                <ArrowRight className="w-4 h-4" />
              </OrangePillButton>
              <span className="text-white/40 text-xs sm:self-center">60 seconds · no signup · no card</span>
            </div>
            <div className="mt-9 flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              {engines.map(({ name, Logo }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs font-medium"
                >
                  <Logo className="w-3.5 h-3.5 text-brand-orange" />
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Product screenshot — tilted */}
          <div className="[perspective:1600px]">
            <div
              className="relative rounded-2xl border border-white/10 bg-[#13100C] shadow-2xl overflow-hidden"
              style={{ transform: "rotateY(-14deg) rotateX(6deg) rotate(1deg)", transformOrigin: "center right" }}
            >
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="ml-3 text-white/30 text-[11px] font-mono">app.alphaa.app/dashboard</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col items-center justify-center text-center">
                    <ScoreRing score={78} size={66} strokeWidth={6} />
                    <p className="text-white/40 text-[10px] mt-2">Presence</p>
                    <p className="text-green-400 text-[10px]">↑ +6</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2.5">Where people find you</p>
                    <div className="space-y-2">
                      {HERO_ENGINES.map((e) => (
                        <div key={e.name} className="flex items-center justify-between gap-2">
                          <span className="text-white/80 text-xs">{e.name}</span>
                          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${TONE[e.tone]}`}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2.5">What alphaa did this week</p>
                  <div className="space-y-2">
                    {WEEK.map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span className="text-white/70 text-xs">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-8 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-3 text-center">
          <p className="text-white/40 text-xs uppercase tracking-[0.18em]">Trusted by local businesses</p>
          <div className="flex items-center gap-6 flex-wrap justify-center text-white/45 text-sm font-semibold">
            <span>Bright Smile Dental</span>
            <span>Northside HVAC</span>
            <span>Lotus Yoga</span>
            <span>Corner Bistro</span>
            <span>Peak Realty</span>
          </div>
        </div>
      </section>

      {/* ══ PROBLEM ════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">The shift</p>
          <h2 className="text-white text-3xl sm:text-[44px] font-semibold leading-[1.06] tracking-[-0.02em] text-balance max-w-3xl mx-auto">
            Your customers stopped scrolling Google.{" "}
            <span className="serif-italic text-brand-orange">They ask AI now.</span>
          </h2>
          <p className="text-white/50 text-lg mt-6 max-w-2xl mx-auto">
            If ChatGPT doesn&apos;t know you exist, you&apos;re invisible to the customers it answers — every single day.
          </p>
          <div className="mt-14 grid sm:grid-cols-3 gap-5">
            {[
              { v: "1B+", l: "AI searches every day" },
              { v: "63%", l: "of searches end without a click" },
              { v: "0", l: "of those clicks reach you if AI skips you" },
            ].map((s) => (
              <div key={s.l} className="glass-card rounded-2xl p-8">
                <MonoNumber className="text-5xl font-medium text-brand-orange block leading-none">{s.v}</MonoNumber>
                <p className="text-white/55 text-sm mt-3">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MECHANISM / 3 STEPS ════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">How it works</p>
            <h2 className="text-white text-3xl sm:text-[40px] font-semibold leading-[1.06] tracking-[-0.02em]">
              From invisible to{" "}
              <span className="serif-italic text-brand-orange">recommended.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 relative">
            {STEPS.map((s, i) => (
              <div key={s.n} className="glass-card rounded-2xl p-7 relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-brand-orange text-sm">{s.n}</span>
                  <span className="h-px flex-1 bg-white/10" />
                  {i === 0 && <Search className="w-5 h-5 text-white/40" />}
                  {i === 1 && <Bot className="w-5 h-5 text-white/40" />}
                  {i === 2 && <Sparkles className="w-5 h-5 text-white/40" />}
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE GRID ═══════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">Everything included</p>
            <h2 className="text-white text-3xl sm:text-[40px] font-semibold leading-[1.06] tracking-[-0.02em] max-w-2xl mx-auto text-balance">
              A whole SEO team,{" "}
              <span className="serif-italic text-brand-orange">running itself.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-card rounded-2xl p-6 hover:border-brand-orange/20 transition-colors duration-200">
                <div className="w-11 h-11 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-orange" />
                </div>
                <h3 className="text-white text-base font-semibold mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRODUCT DEEP-DIVE ══════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">Your dashboard</p>
            <h2 className="text-white text-3xl sm:text-[38px] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
              See exactly what $99 buys you — <span className="serif-italic text-brand-orange">every week.</span>
            </h2>
            <p className="text-white/50 text-base mt-5 leading-relaxed">
              No SEO jargon, nothing to manage. One screen shows where AI recommends you and everything alphaa did to get you there.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Live status across all six AI engines",
                "A presence score that goes up over time",
                "Every action logged in plain English",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-white/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#13100C] shadow-2xl p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center text-center">
                <ScoreRing score={82} size={84} />
                <p className="text-white/40 text-xs mt-3">Presence score</p>
                <p className="text-green-400 text-xs mt-0.5">↑ +9 this month</p>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-3">Where people find you</p>
                <div className="space-y-2.5">
                  {HERO_ENGINES.map((e) => (
                    <div key={e.name} className="flex items-center justify-between gap-3">
                      <span className="text-white/80 text-sm">{e.name}</span>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${TONE[e.tone]}`}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">Visibility trend</p>
              <AreaChart points={[20, 28, 26, 38, 44, 55, 63, 74]} className="w-full h-20" />
            </div>
          </div>
        </div>
      </section>

      {/* ══ RESULTS / PROOF ════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">Real results</p>
            <h2 className="text-white text-3xl sm:text-[40px] font-semibold leading-[1.06] tracking-[-0.02em]">
              Businesses AI now{" "}
              <span className="serif-italic text-brand-orange">recommends.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PROOF.map((p) => (
              <div key={p.name} className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <Image
                    src={p.avatar}
                    width={44}
                    height={44}
                    alt=""
                    aria-hidden="true"
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{p.name}</p>
                    <p className="text-white/40 text-xs">{p.business}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-5">
                  <AreaChart points={p.chart} className="w-full h-16" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <MonoNumber className="text-3xl font-medium text-brand-orange block leading-none">{p.statA.v}</MonoNumber>
                    <span className="text-white/45 text-xs mt-1.5 block">{p.statA.l}</span>
                  </div>
                  <div>
                    <MonoNumber className="text-3xl font-medium text-white block leading-none">{p.statB.v}</MonoNumber>
                    <span className="text-white/45 text-xs mt-1.5 block">{p.statB.l}</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mt-auto pt-4 border-t border-white/[0.06]">
                  &ldquo;{p.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ENGINE-CHECK CTA BAND ══════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto rounded-3xl border border-brand-orange/20 bg-gradient-to-b from-brand-orange/[0.08] to-transparent p-10 sm:p-14 text-center">
          <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">Free GEO audit</p>
          <h2 className="text-white text-2xl sm:text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-balance">
            Do ChatGPT, Claude, Perplexity &amp; Gemini{" "}
            <span className="serif-italic text-brand-orange">recommend you?</span>
          </h2>
          <div className="mt-7 flex items-center justify-center gap-2 flex-wrap">
            {engines.map(({ name, Logo }) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs font-medium"
              >
                <Logo className="w-3.5 h-3.5 text-brand-orange" />
                {name}
              </span>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <OrangePillButton href="/scan" size="lg">
              Check my visibility free
              <ArrowUpRight className="w-4 h-4" />
            </OrangePillButton>
          </div>
        </div>
      </section>

      {/* ══ COMPARISON ═════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">Why alphaa</p>
            <h2 className="text-white text-3xl sm:text-[40px] font-semibold leading-[1.06] tracking-[-0.02em]">
              A tenth of the price of an{" "}
              <span className="serif-italic text-brand-orange">agency.</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left p-4 text-white/40 text-xs font-medium uppercase tracking-wider"></th>
                  <th className="p-4 text-center">
                    <span className="inline-block text-brand-orange font-semibold">alphaa</span>
                  </th>
                  <th className="p-4 text-center text-white/50 text-sm font-medium">SEO agency</th>
                  <th className="p-4 text-center text-white/50 text-sm font-medium">DIY</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                    <td className="p-4 text-white/70 text-sm">{row.label}</td>
                    <td className="p-4 text-center">
                      <Cell value={row.alphaa} highlight />
                    </td>
                    <td className="p-4 text-center">
                      <Cell value={row.agency} />
                    </td>
                    <td className="p-4 text-center">
                      <Cell value={row.diy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ PRICING ════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">Pricing</p>
            <h2 className="text-white text-3xl sm:text-[40px] font-semibold leading-[1.06] tracking-[-0.02em]">
              Simple pricing.{" "}
              <span className="serif-italic text-brand-orange">14-day free trial.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.featured
                    ? "border-brand-orange/40 bg-brand-orange/[0.06] shadow-glow-sm"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white text-lg font-semibold">{plan.name}</h3>
                  {plan.featured && (
                    <span className="inline-flex items-center gap-1 text-brand-orange text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20">
                      <Zap className="w-3 h-3" /> Most popular
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1 mt-3">
                  <span className="text-white/50 text-lg">$</span>
                  <MonoNumber className="text-5xl font-medium text-white leading-none">{plan.price}</MonoNumber>
                  <span className="text-white/40 text-sm mb-1">/mo</span>
                </div>
                <p className="text-white/45 text-sm mt-3">{plan.tagline}</p>
                <div className="mt-6">
                  <OrangePillButton href="/signup" variant={plan.featured ? "primary" : "ghost"} className="w-full">
                    Start free trial
                  </OrangePillButton>
                </div>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-white/70 text-sm">
                      <Check className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ GUARANTEE ══════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h3 className="text-white text-lg font-semibold">See your score before you pay a cent.</h3>
            <p className="text-white/50 text-sm mt-1.5">
              Free scan, 14-day trial, no lock-in contract. Cancel any time — you keep the work we published.
            </p>
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-24 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-4">FAQ</p>
            <h2 className="text-white text-3xl sm:text-[38px] font-semibold leading-[1.06] tracking-[-0.02em]">
              Questions,{" "}
              <span className="serif-italic text-brand-orange">answered.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group glass-card rounded-2xl px-6 py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-white font-medium text-base">
                  {f.q}
                  <span className="text-brand-orange text-xl leading-none transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-white/55 text-sm leading-relaxed mt-4">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════════ */}
      <section className="px-4 sm:px-6 py-28">
        <div className="max-w-3xl mx-auto text-center relative">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(255,107,26,0.12) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-center justify-center gap-1 mb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 text-brand-orange" fill="currentColor" />
              ))}
              <span className="text-white/40 text-xs ml-2">Rated 4.9 by 1,000+ businesses</span>
            </div>
            <h2 className="text-white text-3xl sm:text-[48px] font-semibold leading-[1.04] tracking-[-0.02em] text-balance">
              Get recommended by the AI your{" "}
              <span className="serif-italic text-brand-orange">customers ask.</span>
            </h2>
            <p className="text-white/55 text-lg mt-5 max-w-md mx-auto">
              Free 60-second scan. See where you stand — no signup, no card.
            </p>
            <div className="mt-8 flex justify-center">
              <OrangePillButton href="/scan" size="lg">
                Get your free score
                <ArrowRight className="w-4 h-4" />
              </OrangePillButton>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// Renders a comparison-table cell: check / X / or text.
function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return (
      <Check className={`w-5 h-5 mx-auto ${highlight ? "text-brand-orange" : "text-green-400"}`} />
    )
  }
  if (value === false) {
    return <X className="w-5 h-5 mx-auto text-white/20" />
  }
  return (
    <span className={`text-sm ${highlight ? "text-brand-orange font-semibold" : "text-white/60"}`}>{value}</span>
  )
}
