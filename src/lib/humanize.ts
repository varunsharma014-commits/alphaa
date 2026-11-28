// Turn technical strings into plain English for non-technical business owners.
// NEVER show raw issue codes, API errors, or snake_case to users. No promises of work that
// isn't logged: these lines say what the problem is and what fixes it, never "I'm fixing it".

export type IssueText = { title: string; why: string; fix: string }

// Website check (lib/crawler.ts) issue types, grouped once per type on Tracking → Site health.
const ISSUES: Record<string, IssueText> = {
  missing_title: { title: "Pages without a title", why: "The title is the blue link people click on Google. Without one, Google makes one up.", fix: "Give each page a short title, 30 to 60 characters, that says what the page is about." },
  title_too_short: { title: "Page titles that are too short", why: "A very short title misses the words people search for.", fix: "Make each title 30 to 60 characters and include what you offer and where." },
  title_too_long: { title: "Page titles that are too long", why: "Google cuts titles off after about 60 characters, so the end goes missing.", fix: "Shorten each title to under 60 characters and keep the important words first." },
  missing_meta_description: { title: "Pages without a search summary", why: "Google shows this short summary under your link. Without one, it picks random text from the page.", fix: "Write a 120 to 160 character summary for each page that says what someone gets there." },
  meta_description_too_short: { title: "Search summaries that are too short", why: "A short summary wastes the space Google gives you under your link.", fix: "Expand each summary to 120 to 160 characters." },
  meta_description_too_long: { title: "Search summaries that are too long", why: "Google cuts summaries off after about 160 characters.", fix: "Trim each summary to 160 characters or fewer, with the most useful part first." },
  missing_h1: { title: "Pages without a main heading", why: "The main heading tells Google and AI what the page is about.", fix: "Add one clear main heading at the top of each page." },
  multiple_h1s: { title: "Pages with more than one main heading", why: "Several main headings blur what the page is about.", fix: "Keep one main heading per page and turn the others into subheadings." },
  missing_canonical: { title: "Pages that don’t name their main address", why: "Without it, Google can index copies of the same page and split its ranking.", fix: "Add a canonical link to each page pointing at its own address. Most site builders have a setting for it." },
  images_missing_alt: { title: "Pictures without a description", why: "Google and screen readers can’t see pictures. The description tells them what’s there.", fix: "Add a short description (alt text) to each picture that says what it shows." },
  no_internal_links: { title: "Pages that don’t link to your other pages", why: "Links between your own pages help Google find them and see how they fit together.", fix: "Link each page to 2 to 5 related pages on your site." },
  no_schema_markup: { title: "Your site doesn’t describe your business in code", why: "Google and AI read a small block of code for your name, address, phone and hours.", fix: "Add your business details block. I can write it from your profile in Structured data below." },
  missing_local_business_schema: { title: "No business details block for Google and AI", why: "It’s how Google and AI confirm your name, address, phone and hours.", fix: "Add your business details block. I can write it from your profile in Structured data below." },
  missing_faqpage_schema: { title: "Your questions and answers aren’t marked up", why: "Marked up questions can show right on Google and get quoted by AI.", fix: "Mark up the questions and answers already on your site. I only use ones that are really there." },
  // Older code names some stored rows still use.
  missing_meta: { title: "Pages without a search summary", why: "Google shows this short summary under your link.", fix: "Write a 120 to 160 character summary for each page." },
  title_missing: { title: "Pages without a title", why: "The title is the blue link people click on Google.", fix: "Give each page a short title that says what it is about." },
  broken_link: { title: "Links to pages that don’t exist", why: "Visitors hit a dead end and Google sees a broken site.", fix: "Point each link at a page that works, or remove it." },
  slow_lcp: { title: "The main content shows up slowly", why: "People leave pages that take too long to show anything.", fix: "See Speed for real visitors below for what slows it down." },
  missing_alt_text: { title: "Pictures without a description", why: "Google can’t see pictures without one.", fix: "Add a short description to each picture." },
  duplicate_title: { title: "Pages that share the same title", why: "Google may show only one of them.", fix: "Give each page its own title." },
  redirect_chain: { title: "Links that bounce through several redirects", why: "Each hop slows the page and wastes Google’s visit.", fix: "Point the link straight at the final address." },
  missing_schema: { title: "Your site doesn’t describe your business in code", why: "It helps Google and AI understand who you are.", fix: "Add your business details block from Structured data below." },
}

const keyOf = (code: string) => String(code).trim().toLowerCase().replace(/[\s-]+/g, "_")

/** Plain-English title, why and fix for a website check issue type, or null when unknown. */
export function issueText(code: string | null | undefined): IssueText | null {
  if (!code) return null
  return ISSUES[keyOf(code)] ?? null
}

/** One plain sentence for an issue code (older callers). Unknown codes get a neutral line. */
export function humanizeIssue(code: string | null | undefined): string {
  const t = issueText(code)
  return t ? `${t.title}. ${t.why}` : "Something on your site needs a look."
}

/** Friendly fallback for any failed external call. Never leak errors. */
export function friendlyError(): string {
  return "That didn’t work just now. I’ll try again shortly. If it keeps happening, email hi@alphaa.app."
}

/** "morning" | "afternoon" | "evening" for greetings. */
export function timeOfDayGreeting(date: Date = new Date()): "morning" | "afternoon" | "evening" {
  const h = date.getHours()
  if (h < 12) return "morning"
  if (h < 18) return "afternoon"
  return "evening"
}
