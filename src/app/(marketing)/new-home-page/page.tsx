import type { Metadata } from "next"
import Image from "next/image"
import { CheckCircle2, TrendingUp, FileText, ArrowUpRight } from "lucide-react"
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
// Dark theme kept. Redesign implementing the competitor-review takeaways
// (getautoseo.com / babylovegrowth.ai): far less hero copy, a real product
// screenshot as the hero visual, an AI-engine badge row, and proof cards with a
// face + big stat numbers + one-line quote. Lives at a standalone route for
// review before it (optionally) replaces the live home page. noindex so it never
// competes with `/` in search.
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

// Proof cards — swap for real customers + logos when available.
const proof = [
  {
    avatar: "/avatars/a1.jpg",
    name: "Maria Alvarez",
    business: "Bright Smile Dental",
    stat: "3.4×",
    statLabel: "more AI mentions",
    quote: "ChatGPT now names us when people ask for a dentist nearby.",
  },
  {
    avatar: "/avatars/a2.jpg",
    name: "James Okafor",
    business: "Northside HVAC",
    stat: "+61%",
    statLabel: "calls from search",
    quote: "We stopped paying an agency and get better answers on autopilot.",
  },
  {
    avatar: "/avatars/a3.jpg",
    name: "Priya Nair",
    business: "Lotus Yoga Studio",
    stat: "#1",
    statLabel: "in Perplexity answers",
    quote: "Set it up in an afternoon. Now we show up everywhere that matters.",
  },
]

const WEEK = [
  { icon: FileText, text: "2 Google posts published" },
  { icon: TrendingUp, text: "Up on 5 keywords" },
  { icon: CheckCircle2, text: "Fixed 3 site issues" },
]

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

export default function MockupPage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-24 pb-20">
        {/* warm glow behind hero */}
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,107,26,0.14) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left — copy (deliberately minimal) */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/70 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
              AI Search Optimization, on autopilot
            </div>

            <h1 className="text-[40px] sm:text-[56px] lg:text-[60px] font-semibold leading-[1.03] tracking-[-0.02em] text-white text-balance">
              Get found on{" "}
              <span className="serif-italic text-brand-orange">AI search.</span>
            </h1>

            {/* ONE sentence. */}
            <p className="text-white/55 text-lg sm:text-xl leading-relaxed max-w-md mx-auto lg:mx-0 mt-6">
              We get your business cited by ChatGPT, Gemini &amp; Google AI — for
              $99/mo, not $1,000.
            </p>

            {/* ONE primary CTA. */}
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:justify-center lg:justify-start">
              <OrangePillButton href="/scan" size="lg">
                Get your free score
              </OrangePillButton>
              <span className="text-white/40 text-xs">
                60 seconds · no signup
              </span>
            </div>

            {/* AI-engine badge row — scannable, not prose */}
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

          {/* Right — product screenshot as the hero visual (tilted) */}
          <div className="[perspective:1600px]">
            <div
              className="relative rounded-2xl border border-white/10 bg-[#13100C] shadow-2xl overflow-hidden"
              style={{
                transform: "rotateY(-14deg) rotateX(6deg) rotate(1deg)",
                transformOrigin: "center right",
              }}
            >
              {/* fake browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
                <span className="ml-3 text-white/30 text-[11px] font-mono">
                  app.alphaa.app/dashboard
                </span>
              </div>

              {/* dashboard body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col items-center justify-center text-center">
                    <ScoreRing score={78} size={66} strokeWidth={6} />
                    <p className="text-white/40 text-[10px] mt-2">Presence</p>
                    <p className="text-green-400 text-[10px]">↑ +6</p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2.5">
                      Where people find you
                    </p>
                    <div className="space-y-2">
                      {HERO_ENGINES.map((e) => (
                        <div
                          key={e.name}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-white/80 text-xs">{e.name}</span>
                          <span
                            className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${TONE[e.tone]}`}
                          >
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-2.5">
                    What alphaa did this week
                  </p>
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

      {/* ── LOGO / TRUST STRIP ───────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-8 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-x-10 gap-y-3 text-center">
          <p className="text-white/40 text-xs uppercase tracking-[0.18em]">
            Trusted by local businesses
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center text-white/50 text-sm font-semibold">
            <span>Bright Smile Dental</span>
            <span>Northside HVAC</span>
            <span>Lotus Yoga</span>
            <span>Corner Bistro</span>
            <span>Peak Realty</span>
          </div>
        </div>
      </section>

      {/* ── PROOF CARDS ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-3">
              Real results
            </p>
            <h2 className="text-white text-3xl sm:text-[40px] font-semibold leading-[1.05] tracking-[-0.02em]">
              Businesses AI now{" "}
              <span className="serif-italic text-brand-orange">recommends.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {proof.map((p) => (
              <div
                key={p.name}
                className="glass-card rounded-2xl p-6 flex flex-col"
              >
                {/* face + business */}
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
                    <p className="text-white text-sm font-semibold leading-tight">
                      {p.name}
                    </p>
                    <p className="text-white/40 text-xs">{p.business}</p>
                  </div>
                </div>

                {/* the big number */}
                <div className="mb-4">
                  <MonoNumber className="text-5xl font-medium text-brand-orange block leading-none">
                    {p.stat}
                  </MonoNumber>
                  <span className="text-white/50 text-sm mt-2 block">
                    {p.statLabel}
                  </span>
                </div>

                {/* one-line quote */}
                <p className="text-white/70 text-sm leading-relaxed mt-auto pt-4 border-t border-white/[0.06]">
                  &ldquo;{p.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-white text-3xl sm:text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-balance">
            See where you stand in{" "}
            <span className="serif-italic text-brand-orange">AI answers.</span>
          </h2>
          <p className="text-white/55 text-lg mt-5 max-w-md mx-auto">
            Free 60-second scan. No signup, no card.
          </p>
          <div className="mt-8 flex justify-center">
            <OrangePillButton href="/scan" size="lg">
              Get your free score
              <ArrowUpRight className="w-4 h-4" />
            </OrangePillButton>
          </div>
        </div>
      </section>
    </>
  )
}
