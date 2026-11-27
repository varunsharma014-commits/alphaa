// The homepage's small print, in one numbered "Notes" block just above the footer (2026-11-26).
// Each claim it qualifies carries a superscript marker (<NoteRef n={…} />) that links here, so
// the disclosure stays on the same page and visibly tied to its claim. Numbers follow the order
// the markers first appear on the page: keep HOME_NOTE and HOME_NOTES in the same order.
import { SERVICE_BY_SLUG } from "@/content/services"
import { Notes } from "@/components/marketing/v3"

export const HOME_NOTE = { examples: 1, social: 2, aiAnswer: 3, email: 4, ads: 5, agency: 6, dental: 7, growth: 8 } as const

const HOME_NOTES: string[] = [
  "Example screens. The cards and status messages in the hero and in each service section show the kind of work I do and the updates I send. They are examples, not results from a real customer.",
  SERVICE_BY_SLUG["social-media-management"].availability ?? "",
  "Example answer. The question, the AI answers and the businesses named are fictional, to show what I check each week.",
  SERVICE_BY_SLUG["email-marketing"].availability ?? "",
  SERVICE_BY_SLUG["ads-management"].availability ?? "",
  "Agency prices are an example quote. Change them to yours. The Alphaa price is the Pro plan, billed monthly. Ads management is on the Growth plan (early access) and isn’t counted.",
  "Illustrative example: a sample dental practice, not real customer data.",
  "Growth is in early access: nobody is charged until ads open.",
]

export function HomeNotes() {
  return <Notes items={HOME_NOTES} />
}
