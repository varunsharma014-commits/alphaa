import Image from "next/image"
import { Star } from "lucide-react"
import { HeroScanInput } from "@/components/marketing/HeroScanInput"
import { MonoNumber } from "@/components/common/MonoNumber"

const stats = [
  { value: "1B+", label: "daily AI searches" },
  { value: "6", label: "AI engines we optimize for" },
  { value: "2 min", label: "to get started" },
]

// Social-proof — update to your real numbers, and swap these placeholder
// portraits in /public/avatars for real customer photos when you have them.
const SOCIAL = { count: "1,000+", noun: "customers", rating: "4.9" }
const AVATARS = ["/avatars/a1.jpg", "/avatars/a2.jpg", "/avatars/a3.jpg", "/avatars/a4.jpg"]

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(255,107,26,0.20) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Your customers stopped Googling. They're asking AI.
        </div>

        {/* Headline */}
        <h1 className="text-[34px] sm:text-[50px] font-semibold leading-[1.08] tracking-[-0.02em] text-white mb-8 text-balance">
          Your customers are NOT on Google anymore. They&apos;re on{" "}
          <span className="serif-italic text-brand-orange">ChatGPT, Claude, Gemini.</span>
          <br />
          Are you showing up in their answers?
        </h1>

        {/* Sub-headline */}
        <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto mb-4">
          ChatGPT, Claude, Gemini, Perplexity — billions of people now ask AI instead of Googling. Alphaa gets your business into every AI answer, automatically, for $99/month.
        </p>

        {/* AI engines row */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {["ChatGPT", "Claude", "Gemini", "Perplexity", "Google AI", "Copilot"].map((p) => (
            <span
              key={p}
              className="inline-flex items-center px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Primary CTA — embedded scan to reduce friction */}
        <div className="mb-3">
          <HeroScanInput />
        </div>
        <p className="text-white/40 text-xs mb-4">
          Takes 60 seconds · No signup or credit card to see your score
        </p>
        <div className="flex items-center justify-center mb-2">
          <a
            href="/pricing"
            className="text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full"
          >
            View pricing →
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
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
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
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
