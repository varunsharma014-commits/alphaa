import Image from "next/image"
import { Star } from "lucide-react"
import { HeroScanInput } from "@/components/marketing/HeroScanInput"
import { MonoNumber } from "@/components/common/MonoNumber"
import {
  ChatGPTLogo,
  ClaudeLogo,
  GeminiLogo,
  PerplexityLogo,
  GoogleAILogo,
  CopilotLogo,
} from "@/components/marketing/AiEngineLogos"

const stats = [
  { value: "1B+", label: "daily AI searches" },
  { value: "6", label: "AI engines we optimize for" },
  { value: "2 min", label: "to get started" },
]

// Real engine logos read as more credible than text pills, and showing all six
// proves we cover more than the three named in the headline.
const engines = [
  { name: "ChatGPT", Logo: ChatGPTLogo },
  { name: "Claude", Logo: ClaudeLogo },
  { name: "Gemini", Logo: GeminiLogo },
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Google AI", Logo: GoogleAILogo },
  { name: "Copilot", Logo: CopilotLogo },
]

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
          background: "radial-gradient(ellipse at center, rgba(255,107,26,0.16) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[460px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255,107,26,0.16) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-medium mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Your customers stopped Googling. They&apos;re asking AI.
        </div>

        {/* Headline — statement, then the question as the punchline */}
        <h1 className="text-[32px] sm:text-[46px] font-semibold leading-[1.07] tracking-[-0.02em] text-white mb-5 text-balance">
          Your customers are{" "}
          <span className="relative whitespace-nowrap">
            <span className="relative z-10">NOT</span>
            <span
              className="absolute left-0 right-0 bottom-[-0.06em] h-[5px] sm:h-[6px] rounded-full bg-brand-orange z-0"
              aria-hidden="true"
            />
          </span>{" "}
          on Google anymore.
          <br className="hidden sm:block" /> They&apos;re on{" "}
          <span className="serif-italic text-brand-orange">ChatGPT, Claude, Gemini.</span>
        </h1>
        <p className="text-[22px] sm:text-[30px] font-semibold leading-[1.12] tracking-[-0.01em] text-white/85 mb-6 text-balance">
          Are you showing up in their answers?
        </p>

        {/* Sub-headline */}
        <p className="text-white/55 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-7">
          Alphaa gets your business into AI answers automatically. Why pay an agency $1,000/month when AI can do it for $99/mo?
        </p>

        {/* AI engines row — real logos */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-9">
          {engines.map(({ name, Logo }) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs font-medium hover:border-brand-orange/30 hover:text-white transition-colors duration-200"
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
        <p className="text-white/40 text-xs mb-5">
          Takes 60 seconds · No signup or credit card to see your score
        </p>
        <div className="flex items-center justify-center">
          <a
            href="/pricing"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full"
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
                className="w-8 h-8 rounded-full ring-2 ring-[#0a0806] object-cover"
                style={{ marginLeft: i === 0 ? 0 : "-10px" }}
              />
            ))}
          </div>
          <div className="text-left">
            <p className="text-sm leading-tight">
              <span className="font-semibold text-white">{SOCIAL.count} {SOCIAL.noun}</span>
              <span className="text-white/50"> getting found on AI with alphaa</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-brand-orange" fill="currentColor" />
                ))}
              </div>
              <span className="text-white/40 text-xs">Rated {SOCIAL.rating} average</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <MonoNumber className="text-3xl font-medium text-white block">{s.value}</MonoNumber>
              <span className="text-white/40 text-xs mt-1 block">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
