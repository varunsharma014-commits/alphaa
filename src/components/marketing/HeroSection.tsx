import Image from "next/image"
import { Star } from "lucide-react"
import { HeroScanInput } from "@/components/marketing/HeroScanInput"
import { HeroCyclingWord } from "@/components/marketing/HeroCyclingWord"
import { ScoreRing } from "@/components/common/ScoreRing"
import {
  ChatGPTLogo,
  ClaudeLogo,
  GeminiLogo,
  PerplexityLogo,
  GoogleAILogo,
  CopilotLogo,
} from "@/components/marketing/AiEngineLogos"

// Real engine logos read as more credible than text pills, and showing all six
// proves we cover more than the four named in the headline.
const engines = [
  { name: "ChatGPT", Logo: ChatGPTLogo },
  { name: "Claude", Logo: ClaudeLogo },
  { name: "Gemini", Logo: GeminiLogo },
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Google AI", Logo: GoogleAILogo },
  { name: "Copilot", Logo: CopilotLogo },
]

// Scattered floating engine icons — a couple of the named engines, plus one
// more so it doesn't read as only two-engine coverage.
const FLOATERS = [
  { name: "Claude", Logo: ClaudeLogo, color: "#d97757", top: "10%", left: "8%", d: 0, dur: 7 },
  { name: "Gemini", Logo: GeminiLogo, color: "#4285f4", top: "18%", left: "86%", d: 1.2, dur: 8 },
  { name: "ChatGPT", Logo: ChatGPTLogo, color: "#10a37f", top: "70%", left: "6%", d: 0.6, dur: 9 },
]

const DASHBOARD_ENGINES: { name: string; status: string; tone: "green" | "amber" | "muted" }[] = [
  { name: "ChatGPT", status: "Recommending you", tone: "green" },
  { name: "Google AI", status: "Recommending you", tone: "green" },
  { name: "Perplexity", status: "Sometimes", tone: "amber" },
  { name: "Gemini", status: "Working on it", tone: "muted" },
]

const DASHBOARD_TONE: Record<"green" | "amber" | "muted", string> = {
  green: "text-[#1d8a4e] bg-[#e8f5ee]",
  amber: "text-[#9a6a00] bg-[#fdf3e0]",
  muted: "text-[#86868b] bg-[#f0f0f2]",
}

// Social-proof — update to your real numbers, and swap these placeholder
// portraits in /public/avatars for real customer photos when you have them.
const SOCIAL = { count: "1,000+", noun: "customers", rating: "4.9" }
const AVATARS = ["/avatars/a1.jpg", "/avatars/a2.jpg", "/avatars/a3.jpg", "/avatars/a4.jpg"]

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-24 px-4 sm:px-6 overflow-hidden">
      <div
        className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[760px] h-[520px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgb(var(--orange-rgb) / 0.16) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[460px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgb(var(--orange-rgb) / 0.16) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {FLOATERS.map((f) => (
        <div
          key={f.name}
          className="hero-float hidden sm:flex absolute w-14 h-14 rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.25)] items-center justify-center"
          style={{ top: f.top, left: f.left, ["--d" as string]: `${f.d}s`, ["--dur" as string]: `${f.dur}s`, color: f.color }}
          aria-hidden="true"
        >
          <f.Logo className="w-7 h-7" />
        </div>
      ))}
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}.hero-float{animation:heroFloat var(--dur,8s) ease-in-out infinite;animation-delay:var(--d,0s)}@media(prefers-reduced-motion:reduce){.hero-float{animation:none}}`,
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-medium mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Your customers are asking AI, not just Google.
        </div>

        {/* Headline */}
        <h1 className="text-[38px] sm:text-[56px] lg:text-[64px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg mb-6 text-balance">
          Get Your Business Recommended by{" "}
          <HeroCyclingWord />
        </h1>

        {/* Sub-headline */}
        <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-7">
          Alphaa gets your business into AI answers automatically. Why pay an agency $1,000/month when AI can do it for $99/mo?
        </p>

        {/* AI engines row — real logos */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-9">
          {engines.map(({ name, Logo }) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fg/[0.04] border border-line/[0.08] text-fg/70 text-xs font-medium hover:border-brand-orange/30 hover:text-fg transition-colors duration-200"
            >
              <Logo className="w-3.5 h-3.5 text-brand-orange" />
              {name}
            </span>
          ))}
        </div>

        {/* Primary CTA — embedded scan to reduce friction */}
        <div className="mb-3 max-w-2xl mx-auto">
          <HeroScanInput />
        </div>
        <p className="text-fg/40 text-xs mb-5">
          Takes 60 seconds · No signup or credit card to see your score
        </p>
        <div className="flex items-center justify-center">
          <a
            href="/pricing"
            className="text-sm font-medium text-fg/50 hover:text-fg transition-colors duration-200 border border-line/10 hover:border-line/20 px-5 py-2.5 rounded-full"
          >
            View pricing →
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center">
            {AVATARS.map((src, i) => (
              <Image
                key={src}
                src={src}
                width={32}
                height={32}
                alt=""
                aria-hidden="true"
                className="w-8 h-8 rounded-full ring-2 ring-bg-primary object-cover"
                style={{ marginLeft: i === 0 ? 0 : "-10px" }}
              />
            ))}
          </div>
          <div className="text-left">
            <p className="text-sm leading-tight">
              <span className="font-semibold text-fg">{SOCIAL.count} {SOCIAL.noun}</span>
              <span className="text-fg/50"> getting found on AI with alphaa</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-brand-orange" fill="currentColor" />
                ))}
              </div>
              <span className="text-fg/40 text-xs">Rated {SOCIAL.rating} average</span>
            </div>
          </div>
        </div>

        {/* Dashboard preview — light card, so it reads as a real product screenshot */}
        <div className="relative mt-16 max-w-3xl mx-auto text-left">
          <div className="rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)] border border-black/[0.06] overflow-hidden">
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
                  {DASHBOARD_ENGINES.map((e) => (
                    <div key={e.name} className="flex items-center justify-between">
                      <span className="text-[#1d1d1f] text-[14px] font-medium">{e.name}</span>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${DASHBOARD_TONE[e.tone]}`}>{e.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
