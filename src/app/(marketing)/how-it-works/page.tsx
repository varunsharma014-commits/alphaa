import { SectionLabel } from "@/components/common/SectionLabel"
import { GlassCard } from "@/components/common/GlassCard"
import { OrangePillButton } from "@/components/common/OrangePillButton"
import { Search, Link2, CalendarCheck, BarChart3, TrendingUp } from "lucide-react"

const sections = [
  {
    num: "01",
    icon: Search,
    title: "The audit — free, 60 seconds",
    body: [
      "Before anything else, we scan your business. Enter your business name, your market (a city or 'online / national'), and website. In under 60 seconds, we check 47 factors: your Google Business Profile activity, whether you appear on ChatGPT and Perplexity, your website's content gaps, your review velocity, and how you compare to the top 3 competitors in your space.",
      "You get a visibility score from 0–100 and a plain-English breakdown of exactly what's wrong and what it costs you in customers. No jargon. No PDF you'll never open. Just a score and a list.",
    ],
  },
  {
    num: "02",
    icon: Link2,
    title: "The setup — 2 minutes",
    body: [
      "Connect your Google Business Profile with one OAuth click. Then paste one small snippet on your website — works on WordPress, Squarespace, Webflow, GoDaddy, or any custom site. Your developer can do it in 2 minutes if you'd prefer.",
      "That's it. Alphaa now has everything it needs to start working for you.",
    ],
  },
  {
    num: "03",
    icon: CalendarCheck,
    title: "The weekly work — what we do for you",
    body: [
      "Every week, Alphaa publishes posts to your Google Business Profile, generates AI-written blog content specific to your business and market, monitors your reviews across Google and Yelp, and checks whether your business is appearing when people ask ChatGPT or Perplexity for businesses like yours.",
      "Specific weekly tasks: 2–4 Google Business Profile posts, 1–2 blog drafts (Pro: auto-published, Starter: one-click approval), review monitoring and response drafts, AI search citation tracking across ChatGPT, Perplexity, Google AI, and Gemini.",
    ],
  },
  {
    num: "04",
    icon: BarChart3,
    title: "The dashboard — what you see",
    body: [
      "Your dashboard shows your visibility score, what changed this week, whether you appeared on AI search tools, and what Alphaa did for you. Whether you serve one neighborhood or sell to the whole country, you don't have to do anything. But you can see everything.",
      "If you want to review content before it posts, you can. If you want to approve things automatically, turn on auto-approval in settings. The dashboard is for your peace of mind — not for you to manage manually.",
    ],
  },
  {
    num: "05",
    icon: TrendingUp,
    title: "The results — what changes",
    body: [
      "Within 7 days: your Google Business Profile becomes active. Google notices. Rankings start to shift — on Maps if you're local, in organic search if you're online.",
      "Within 30 days: your website has fresh, relevant content. ChatGPT and Perplexity start pulling it in responses. Your review count grows.",
      "Within 60–90 days: sustained visibility on Google Maps, organic search, and AI search tools. Customers start saying 'I found you on ChatGPT.'",
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel className="mb-3 block">How it works</SectionLabel>
          <h1 className="text-section-mobile md:text-section font-semibold text-white mb-4 text-balance">
            Everything Alphaa does —{" "}
            <span className="serif-italic text-brand-orange">explained</span>
          </h1>
          <p className="text-muted text-lg">
            No black boxes. Here's exactly what happens after you sign up.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <GlassCard key={s.num} className="gap-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <span className="mono text-brand-orange text-xs">{s.num}</span>
                  <h2 className="text-white font-semibold text-lg">{s.title}</h2>
                </div>
              </div>
              <div className="space-y-3 pl-16">
                {s.body.map((p, i) => (
                  <p key={i} className="text-muted text-sm leading-relaxed">{p}</p>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="text-center mt-16">
          <OrangePillButton href="/scan" size="lg">
            Get your free visibility scan →
          </OrangePillButton>
          <p className="text-muted/60 text-xs mt-3">60 seconds · No signup required</p>
        </div>
      </div>
    </div>
  )
}
