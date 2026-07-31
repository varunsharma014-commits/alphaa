import Link from "next/link"
import { FileCode2, Star, Globe, CheckCheck } from "lucide-react"
import { SectionLabel } from "@/components/common/SectionLabel"

// Honest "how it actually works" section. Conversion gap: skeptical visitors
// assume AI visibility is magic ("you can't change what ChatGPT says"). This
// explains the real mechanism — you shape the public signals AI reads — which
// builds trust without overclaiming.
const layers = [
  {
    Icon: FileCode2,
    title: "Your own signals",
    body: "Clear service pages, structured data (schema), and an llms.txt that state who you are and what you do in a format machines can read without guessing.",
  },
  {
    Icon: Star,
    title: "Third-party proof",
    body: "Reviews, directories, press, and forums. AI weighs what the rest of the web says about you — not just your own site.",
  },
  {
    Icon: Globe,
    title: "Live retrieval",
    body: "When someone asks, engines like Perplexity and ChatGPT pull fresh results from the web and cite what they find. Recent, citable content wins.",
  },
  {
    Icon: CheckCheck,
    title: "Consistency",
    body: "AI favors businesses described the same way everywhere — verifiable, specific, and consistent across every source it checks.",
  },
]

export function MechanismSection() {
  return (
    <section data-reveal className="py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <SectionLabel className="mb-3 block">How it actually works</SectionLabel>
          <h2 className="text-[36px] sm:text-[56px] font-bold text-fg leading-[1.1] tracking-tight text-balance mb-5">
            No one can reach inside ChatGPT.{" "}
            <span className="text-fg/40">So how does this work?</span>
          </h2>
          <p className="text-fg/55 text-lg leading-relaxed">
            AI doesn&apos;t invent recommendations — it synthesizes signals it finds across the web.
            You can&apos;t edit the model, but you <em className="text-fg/80 not-italic font-medium">can</em> make
            every signal it reads point clearly to you. That&apos;s the entire game, and it&apos;s what alphaa automates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {layers.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="glass-card rounded-2xl p-6 flex gap-4 items-start hover:border-line/[0.14] transition-colors duration-200"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl border border-brand-orange/25 bg-brand-orange/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-fg font-semibold text-base mb-1.5">{title}</h3>
                <p className="text-fg/50 text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-fg/40 text-sm mt-10">
          Curious whether it&apos;s real?{" "}
          <Link
            href="/blog/is-aeo-real"
            className="text-brand-orange hover:text-brand-orange-light underline underline-offset-4 transition-colors"
          >
            Read the honest breakdown of how AI search actually works →
          </Link>
        </p>
      </div>
    </section>
  )
}
