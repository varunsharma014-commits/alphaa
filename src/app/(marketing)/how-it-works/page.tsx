import Link from "next/link"
import { V3Page, Frame, Section, Chapter, FinalCta, ServicePills, type SvcKey } from "@/components/marketing/v3"
import { ExBox, Note, Engines, Checks } from "@/components/marketing/v3/pages/Examples"
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
    tone: "se" as SvcKey,
    eyebrow: "Step 1 · About two minutes",
    title: "Give me your website.",
    body: `${A} reads it to learn what you sell, how you talk, and your logo and colours. Then it asks ChatGPT, Gemini, Claude and Perplexity about you the way a customer would, and writes your first week of marketing so you can see exactly what you’d get.`,
    art: <Note head="ChatGPT" title="Best dentist near Zilker, Austin?" body={<>I’d recommend <mark>Example Dental Co.</mark> — gentle with nervous patients, open Saturdays. (Fictional business.)</>} />,
  },
  {
    tone: "ad" as SvcKey,
    eyebrow: "Step 2 · A few clicks",
    title: "Connect what you already have.",
    body: "Your Google listing, your website and, on Growth, your ad and social accounts. One secure click each. No passwords to hand over, nothing to install.",
    art: <Checks rows={["Brand and voice learned", "Google Business Profile connected", "Website connected", "First week planned"]} />,
  },
  {
    tone: "mk" as SvcKey,
    eyebrow: "Step 3 · Every week",
    title: "I run your marketing.",
    body: `Social posts with images in your brand colours, Google listing updates, blog posts that answer what customers ask, replies to your reviews, and fixes so AI and Google can recommend you. On Growth, ${A} also runs your Google and Meta ads and emails your past customers. Just say “run my marketing for this week”.`,
    art: <><Note head="Draft" title="This week · Example Dental Co. (example)" body={<>Tue · Blog post: weekend dental emergencies<br />Thu · Google update: Saturday visits<br />Fri · Social post with your logo</>} /><Note head={null} title="Your marketing for this week is done." /></>,
  },
  {
    tone: "em" as SvcKey,
    eyebrow: "Step 4 · Your call",
    title: "Approve with a tap, or let me run.",
    body: "Anything public waits for your yes, unless you tell me what I can do on my own. Close the laptop: your posts go out and your customers hear back. Website changes can always be undone.",
    art: (
      <Note title="Reply to Maria’s ★★★★★ review?" body="“Thank you, Maria! We’re so glad the cleaning was painless — see you in six months.”" actions={["Approve", "Edit"]} />
    ),
  },
  {
    tone: "ct" as SvcKey,
    eyebrow: "Step 5 · Plain English",
    title: "Know what’s bringing customers in.",
    body: "Every week: what brought you customers, what’s quietly losing them, what your competitors are doing, and what I’ll do next. No dashboards to decode.",
    fine: "Changes to your Google profile can show up within days. AI answers usually take longer, often weeks, and nobody can honestly promise when or guarantee a ranking.",
    art: (
      <>
        <Note title="This week" body="Named by 3 of 4 AIs, up from 1. 3 posts out, 4 reviews answered. Your weekend post brought the most visits." />
        <Engines items={[{ name: "ChatGPT", ok: true }, { name: "Gemini", ok: true }, { name: "Claude", ok: true }, { name: "Perplexity", ok: false }]} />
      </>
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
    <V3Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <Frame top>
        <Section center>
          <ServicePills />
          <h1 className="v3-h1">
            Your marketing, handled.<br /><span className="v3-blue">Here’s exactly how.</span>
          </h1>
          <p className="v3-lede">No black boxes. From your website to a week of marketing done, and every week after.</p>
        </Section>
        <Section>
          <div className="v3-chapters">
            {STEPS.map((s, i) => (
              <Chapter
                key={s.title}
                id={`step-${i + 1}`}
                tone={s.tone}
                eyebrow={s.eyebrow}
                a={s.title}
                body={s.body}
                note={"fine" in s && s.fine ? s.fine : undefined}
                flip={i % 2 === 1}
                visual={<ExBox tone={s.tone}>{s.art}</ExBox>}
              />
            ))}
          </div>
        </Section>
        <FinalCta title="Run the business. I’ll run the marketing." sub="Give me your website and see your first week." secondary={{ href: "/services", label: "See every service ›" }}>
          <p>Month to month. Cancel online in a minute.</p>
        </FinalCta>
      </Frame>
    </V3Page>
  )
}
