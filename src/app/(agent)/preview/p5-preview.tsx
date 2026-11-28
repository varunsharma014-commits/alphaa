// Dev-only SAMPLE data for the UI package 5 pages (AI search, per-AI, Ask the AIs, reports, reviews,
// Google listing posts, vault). Rendered by ws-preview.tsx; never for a real account.
import type { ReactNode } from "react"
import type { AiCard } from "@/lib/workspace/ai-cards"
import type { VisibilityData, EngineDetail } from "@/lib/workspace/visibility"
import { VisibilityView } from "@/components/workspace/VisibilityView"
import { EngineDetailView } from "@/components/workspace/EngineDetailView"
import { ReportsView } from "@/components/workspace/ReportsView"
import { ReviewsView } from "@/components/workspace/ReviewsView"
import { GoogleListingView } from "@/components/workspace/GoogleListingView"
import { VaultView } from "@/components/workspace/VaultView"
import { Button, PageHeader } from "@/components/workspace/ui"
import SandboxClient from "@/components/dashboard/SandboxClient"
import { PlatformPicker } from "../../(dashboard)/dashboard/vault/PlatformPicker"
import { generateLlmsTxt } from "@/lib/llms-txt"

const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const ahead = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()
const fakeBtn = (label: string, primary = false) => <Button variant={primary ? "primary" : "secondary"}>{label}</Button>

const CARDS: AiCard[] = [
  { engine: "chatgpt", name: "ChatGPT", mark: "Ch", state: "no", question: "Which family dentist near me is open on Saturdays?", questionFull: "Which family dentist near me is open on Saturdays?", names: ["Rival Clinic A", "Rival Clinic B"], namesFrom: "answer", at: ago(2), answer: "Sample answer (preview only). A few clinics in the area open on Saturdays, including Rival Clinic A and Rival Clinic B. Call ahead to book, since weekend slots fill up fast.", citedPages: 8 },
  { engine: "claude", name: "Claude", mark: "Cl", state: "yes", question: "Best dentist for nervous patients nearby?", questionFull: "Best dentist for nervous patients nearby?", names: ["Rival Clinic C"], namesFrom: "answer", at: ago(2), answer: "Sample answer (preview only).", citedPages: 6, tone: "positive", toneQuote: "Sample Dental is often mentioned for its calm, unhurried visits (sample quote)." },
  { engine: "perplexity", name: "Perplexity", mark: "Pe", state: "no", question: "How much is a cleaning without insurance?", questionFull: "How much is a cleaning without insurance?", names: ["Rival Clinic A"], namesFrom: "weekly", at: ago(3), answer: null, citedPages: 9 },
  { engine: "gemini", name: "Gemini", mark: "Ge", state: "unknown", question: null, questionFull: null, names: [], namesFrom: "answer", at: null, answer: null, citedPages: null },
]

const wk = ["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"]
const line = (vals: number[]) => vals.map((v, i) => ({ week: wk[i], share: v, count: Math.round(v * 0.4) }))

function visibility(empty: boolean): VisibilityData {
  if (empty) return { business: "Sample Dental", cards: CARDS.map((c) => ({ ...c, state: "unknown" as const, question: null, answer: null, names: [], at: null })), naming: 0, checked: 0, prevNaming: null, lastAt: null, share: { last: null, prev: null, answers: null }, sov: null, sovWeeks: 0, trend: [], ownCited: null, totalCitations: null }
  return {
    business: "Sample Dental", cards: CARDS, naming: 1, checked: 3, prevNaming: 0, lastAt: ago(2),
    share: { last: 20, prev: 15, answers: 40 },
    sov: { weeks: wk.map((w) => ({ week: w, answers: 40 })), series: [
      { key: "you", name: "Sample Dental", own: true, points: line([5, 7.5, 7.5, 12.5, 15, 20]) },
      { key: "a", name: "Rival Clinic A", own: false, points: line([30, 32.5, 27.5, 30, 25, 22.5]) },
      { key: "b", name: "Rival Clinic B", own: false, points: line([20, 17.5, 22.5, 20, 22.5, 17.5]) },
    ] },
    sovWeeks: 6, trend: [], ownCited: 2, totalCitations: 23,
  }
}

function engine(empty: boolean): EngineDetail {
  return {
    engine: "chatgpt", name: "ChatGPT", business: "Sample Dental", card: empty ? { ...CARDS[3], engine: "chatgpt", name: "ChatGPT" } : CARDS[0], source: "my weekly check", questionsAt: ago(2),
    questions: empty ? [] : [
      { q: "Which family dentist near me is open on Saturdays?", state: "not_named", rank: null, others: ["Rival Clinic A", "Rival Clinic B"], tone: null, quote: null, cited: [{ url: "https://clinicfinder.example/saturday-dentists", title: "Dentists open Saturday (sample)", site: "clinicfinder.example", kind: "directory", cited: true }] },
      { q: "Best dentist for a chipped tooth nearby?", state: "named", rank: 2, others: ["Rival Clinic A"], tone: "positive", quote: "Sample Dental handles same-day repairs (sample quote).", cited: [{ url: "https://sampledental.example/services/repairs", title: null, site: "sampledental.example", kind: "own", cited: true }] },
      { q: "How much is a cleaning without insurance?", state: "error", rank: null, others: [], tone: null, quote: null, cited: [] },
    ],
    sites: empty ? [] : [{ site: "Google Maps", kindLabel: "Directory & reviews", count: 7 }, { site: "rivala.example", kindLabel: "Competitor", count: 3 }],
  }
}

export const P5_PATHS: Record<string, string> = { engine: "/dashboard/visibility/chatgpt" }

export const P5_PAGES: Record<string, (empty: boolean) => ReactNode> = {
  visibility: (empty) => <VisibilityView data={visibility(empty)} action={fakeBtn(empty ? "Ask the AIs now" : "Check again now", empty)} />,
  engine: (empty) => <EngineDetailView data={engine(empty)} action={fakeBtn("Check again now")} />,
  sandbox: () => (
    <>
      <PageHeader title="Ask the AIs" sub="Ask any question a customer might ask and see what ChatGPT, Claude, Perplexity and Gemini answer right now." />
      <SandboxClient businessName="Sample Dental" placeholder="Best family dentist in Sampleton?" initialRemaining={18} limit={20} questions={["Which family dentist near me is open on Saturdays?", "How much is a cleaning without insurance?", "Best dentist for nervous patients nearby?"]} />
    </>
  ),
  reports: (empty) => <ReportsView data={{ email: "owner@example.com", weeks: empty ? [] : [
    { id: "r1", at: ago(40), summary: "Sample summary (preview only). I asked ChatGPT and Claude about you this week. I published two Google updates and three social posts. One draft needs your OK.", emailed: true, counts: { google: 2, reviews: 1, social: 3, replies: 1, emails: 0, ads: 0 }, ai: [{ name: "Claude", change: 1 }], movers: [{ query: "sample dentist query", change: 4.5 }, { query: "another sample query", change: -2 }] },
    { id: "r2", at: ago(47), summary: "Sample summary.", emailed: true, counts: { google: 1, reviews: 0, social: 2, replies: 0, emails: 1, ads: 0 }, ai: [], movers: [] },
    { id: "r3", at: ago(54), summary: null, emailed: false, counts: { google: 0, reviews: 0, social: 0, replies: 0, emails: 0, ads: 0 }, ai: [], movers: [] },
  ] }} />,
  reviews: (empty) => <ReviewsView action={empty ? undefined : fakeBtn("Check for new reviews")} data={{ connected: !empty, canReply: true, location: "Sample Dental · Sampleton", reviews: [
    { id: "v1", author: "Sample Person", rating: 5, comment: "Sample review text (preview only). Friendly team and a quick visit.", at: ago(1), reply: null, draft: "Thank you so much for the kind words! (sample reply)" },
    { id: "v2", author: "Another Sample", rating: 3, comment: "Sample review text about waiting a bit long.", at: ago(4), reply: null, draft: null },
    { id: "v3", author: "Third Sample", rating: 5, comment: "Sample review.", at: ago(12), reply: "Thanks for visiting! (sample reply)", draft: null },
  ] }} />,
  posts: (empty) => <GoogleListingView data={{ connected: !empty, canPost: true, posts: [
    { id: "p1", content: "Sample Google post (preview only). Saturday hours are back: we're open 9 to 1 for cleanings and checkups. Book online or call the front desk.", type: "UPDATE", status: "draft", createdAt: ago(1), postedAt: null, scheduledFor: null },
    { id: "p2", content: "Sample offer post (preview only).", type: "OFFER", status: "scheduled", createdAt: ago(2), postedAt: null, scheduledFor: ahead(30) },
    { id: "p3", content: "Sample posted update (preview only).", type: "UPDATE", status: "posted", createdAt: ago(9), postedAt: ago(8), scheduledFor: null },
  ] }} />,
  vault: (empty) => {
    const mail = "mailto:?subject=Sample"
    return <VaultView mailtoHref={mail} picker={<PlatformPicker mailtoHref={mail} initial="webflow" />} data={{
      status: empty ? "empty" : "good", checkedAt: ago(1), checkedUrl: "https://sampledental.example/", found: empty ? [] : ["your practice details", "your website name"],
      blocks: empty ? [] : [{ title: "Your business name, address and phone", where: "Goes in the header of every page", code: `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "Dentist", name: "Sample Dental", url: "https://sampledental.example", address: { "@type": "PostalAddress", addressLocality: "Sampleton", addressRegion: "ON", addressCountry: "CA" } }, null, 2)}\n</script>` }],
      writtenAt: empty ? null : ago(1), hadOld: empty, hasSite: true,
      missing: empty ? [{ key: "businessType", label: "What you do", hint: "A few words, like “dentist” or “bike shop”.", placeholder: "Your kind of business" }] : [],
      install: { auto: false, platform: "Webflow", how: "Paste it in Site settings, Custom code, Head code, or send it to your web person." },
      tag: '<script async src="https://alphaa.app/tag.js?id=sample"></script>',
      llms: generateLlmsTxt({ businessName: "Sample Dental", businessType: "Dentist", city: "Sampleton", state: "ON", websiteUrl: "sampledental.example" }),
      llmsUrl: "https://alphaa.app/llms/sample",
    }} />
  },
}
