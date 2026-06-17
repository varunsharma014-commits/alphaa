import { CheckCircle2, TrendingUp, FileText } from "lucide-react"
import { ScoreRing } from "@/components/common/ScoreRing"

// "Show, don't tell" — a sneak peek of the alphaa dashboard so visitors can
// picture what $99/mo gets them. Illustrative mockup.
const ENGINES: { name: string; status: string; tone: "green" | "amber" | "muted" }[] = [
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
  { icon: CheckCircle2, text: "Fixed 3 website issues" },
]

export function DashboardPreview() {
  return (
    <section className="px-4 sm:px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-brand-orange text-xs font-semibold uppercase tracking-[0.18em] mb-3">
            Your dashboard
          </p>
          <h2 className="text-white text-2xl sm:text-[32px] font-semibold leading-tight">
            See exactly what you&apos;re getting for $99/mo
          </h2>
          <p className="text-white/50 text-sm mt-3 max-w-lg mx-auto">
            Plain-English progress, updated automatically every week. No SEO jargon, nothing to manage.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Presence score */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col items-center justify-center text-center">
              <ScoreRing score={78} size={84} />
              <p className="text-white/40 text-xs mt-3">Presence score</p>
              <p className="text-green-400 text-xs mt-0.5">↑ +6 this week</p>
            </div>

            {/* Where people find you */}
            <div className="sm:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-3">
                Where people find you
              </p>
              <div className="space-y-2.5">
                {ENGINES.map((e) => (
                  <div key={e.name} className="flex items-center justify-between gap-3">
                    <span className="text-white/80 text-sm">{e.name}</span>
                    <span
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${TONE[e.tone]}`}
                    >
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What alphaa did this week */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-3">
              What alphaa did this week
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WEEK.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-white/70 text-xs">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
