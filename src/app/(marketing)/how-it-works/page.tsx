import Link from "next/link"
import { Panel, ChatAnswer, AgentNote, DraftDoc, Phone, EngineChips, Checklist } from "@/components/marketing/apple/Mockups"
import { BRAND } from "@/lib/brand"
import { pageMeta } from "@/lib/seo"

export const metadata = pageMeta({
  title: "How it works: an AI agent that runs your marketing",
  description:
    "Give Alphaa your website. It learns your voice and brand, checks where customers find you (including ChatGPT and Google), writes your first week free, then runs your social media, Google listing, blog, ads and email every week.",
  path: "/how-it-works",
})

const A = BRAND.agentName

// Accurate to what the product does today. Ads and email campaigns (Growth) open as the
// platforms approve access; social posting straight to accounts likewise.
const STEPS = [
  {
    tone: "sky" as const,
    eyebrow: "Step 1 · About two minutes",
    title: "Give me your website.",
    body: `${A} reads it to learn what you sell, how you talk, and your logo and colours. Then it asks ChatGPT, Gemini, Claude and Perplexity about you the way a customer would, and writes your first week of marketing so you can see exactly what you’d get.`,
    art: <ChatAnswer q="Best dentist near Zilker, Austin?" name="Example Dental Co." rest=" — gentle with nervous patients, open Saturdays. (Fictional business.)" />,
  },
  {
    tone: "lavender" as const,
    eyebrow: "Step 2 · A few clicks",
    title: "Connect what you already have.",
    body: "Your Google listing, your website and, on Growth, your ad and social accounts. One secure click each. No passwords to hand over, nothing to install.",
    art: <Checklist rows={[{ label: "Brand and voice learned", ok: true }, { label: "Google Business Profile connected", ok: true }, { label: "Website connected", ok: true }, { label: "First week planned", ok: true }]} />,
  },
  {
    tone: "peach" as const,
    eyebrow: "Step 3 · Every week",
    title: "I run your marketing.",
    body: `Social posts with images in your brand colours, Google listing updates, blog posts that answer what customers ask, replies to your reviews, and fixes so AI and Google can recommend you. On Growth, ${A} also runs your Google and Meta ads and emails your past customers. Just say “run my marketing for this week”.`,
    art: <DraftDoc title="This week · Example Dental Co. (example)" lines={["Tue · Blog post: weekend dental emergencies", "Thu · Google update: Saturday visits", "Fri · Social post with your logo"]} fresh="Your marketing for this week is done." />,
  },
  {
    tone: "mist" as const,
    eyebrow: "Step 4 · Your call",
    title: "Approve with a tap, or let me run.",
    body: "Anything public waits for your yes, unless you tell me what I can do on my own. Close the laptop: your posts go out and your customers hear back. Website changes can always be undone.",
    art: (
      <Phone>
        <AgentNote title="Reply to Maria’s ★★★★★ review?" body="“Thank you, Maria! We’re so glad the cleaning was painless — see you in six months.”" actions={["Approve", "Edit"]} />
      </Phone>
    ),
  },
  {
    tone: "sage" as const,
    eyebrow: "Step 5 · Plain English",
    title: "Know what’s bringing customers in.",
    body: "Every week: what brought you customers, what’s quietly losing them, what your competitors are doing, and what I’ll do next. No dashboards to decode.",
    fine: "Changes to your Google profile can show up within days. AI answers usually take longer, often weeks, and nobody can honestly promise when or guarantee a ranking.",
    art: (
      <Phone>
        <AgentNote title="This week" body="Named by 3 of 4 AIs, up from 1. 3 posts out, 4 reviews answered. Your weekend post brought the most visits." />
        <EngineChips items={[{ name: "ChatGPT", ok: true }, { name: "Gemini", ok: true }, { name: "Claude", ok: true }, { name: "Perplexity", ok: false }]} />
      </Phone>
    ),
  },
]

export default function HowItWorksPage() {
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How ${A} runs your marketing`,
    description: "From your website to a week of marketing written in your voice, then social media, Google, blog, ads and email run every week.",
    step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.body, url: `https://alphaa.app/how-it-works#step-${i + 1}` })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <section className="ap-sec ap-sec--grey" style={{ paddingTop: 120 }}>
        <h1 className="ap-h2 ap-center" style={{ fontSize: "clamp(44px, 7.7vw, 88px)", lineHeight: 1.05, letterSpacing: "-0.015em" }}>
          Your marketing, handled.<br /><span className="ap-quiet">Here’s exactly how.</span>
        </h1>
        <p className="ap-lead ap-center">No black boxes. From your website to a week of marketing done, and every week after.</p>
        <div className="ap-story">
          {STEPS.map((s, i) => (
            <article key={s.title} id={`step-${i + 1}`} className="ap-row">
              <div className="ap-row__art"><Panel tone={s.tone}>{s.art}</Panel></div>
              <div className="ap-row__text">
                <div className="ap-eyebrow">{s.eyebrow}</div>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
                {"fine" in s && s.fine && <p className="ap-row__fine">{s.fine}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="ap-sec ap-cta">
        <h2 className="ap-h2">Run the business. I’ll run the marketing.</h2>
        <p className="ap-lead">Give me your website and see your first week.</p>
        <Link href="/start" className="ap-btn">Get started</Link>
        <p className="ap-fine">Month to month. Cancel online in a minute. <Link href="/services">See every service ›</Link></p>
      </section>
    </>
  )
}
