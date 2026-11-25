// Alphaa's ad playbook: the built-in knowledge every personal ad plan is generated from.
// Never shown to owners as a manual. They get their own plan (lib/ad-strategy/generate.ts).
//
// Adapted from the GIGABOOST short-form video ads research (gb-mockups/ads/reports/
// "Short form video ads playbook.md", Nov 2026). Hit rates are vendor data (Runneth Creative
// Benchmarks 2026: ~550K Meta ads, DTC-heavy, holiday window), so treat them as a starting
// order, not law. Thresholds are heuristics built on vendor benchmarks.
//
// REVIEW MONTHLY: re-check platform specs, music licence terms, AI-label rules and benchmarks,
// then bump PLAYBOOK_VERSION and REVIEWED. Plans keep the version they were made with.

export const PLAYBOOK_VERSION = "2026-11.1"
export const REVIEWED = "2026-11-25"
export const NEXT_REVIEW = "2026-12-25"

/** Ad formats, best first (Meta "winner" hit rate, Runneth 2026) [vendor]. */
export const FORMATS = [
  { key: "text", name: "Kinetic text / text-only", rate: 11.6, use: "One number or one line per beat on a plain background. Cheapest to make, highest hit rate." },
  { key: "letter", name: "Letter or Notes-app note", rate: 10.83, use: "A handwritten note, Notes-app list or letter on screen. Feels native, needs no face." },
  { key: "bts", name: "Behind the scenes", rate: 8.64, use: "Real footage of the work being done: the kitchen, the job site, the chair, the desk." },
  { key: "owner", name: "Owner to camera", rate: 8.57, use: "The real owner or staff talking plainly. Only real people, filmed with consent." },
  { key: "pov", name: "POV one-liner", rate: 8.28, use: "5–8s handheld shot with one \"POV: …\" line. No voice-over." },
  { key: "demo", name: "Demo / show the work", rate: 8.11, use: "The product or service in action, inside a native frame (POV, note, before/after)." },
  { key: "dodont", name: "Do vs don't split", rate: 5.62, use: "Left: the common mistake. Right: the better way. Works muted." },
] as const

/** Hook types in priority order (Runneth 2026 hit rates) [vendor]. */
export const HOOK_TYPES = [
  { key: "price_anchor", name: "Price anchor / us vs them", rate: 10.89, line: "Compare the real price against the expensive alternative the customer already knows. \"[Alternative] can cost [their fact]. This is [your price].\"" },
  { key: "newness", name: "Newness", rate: 11.37, line: "Something genuinely new: a new service, location, hours or offer. Only if it is real and recent." },
  { key: "confession", name: "Confession", rate: 8.74, line: "A second-person truth the customer recognises: \"You've been putting this off for months.\"" },
  { key: "curiosity", name: "Curiosity", rate: 7.77, line: "\"Nobody tells you this about [category].\" \"Watch what happens when…\"" },
  { key: "bold_claim", name: "Bold claim", rate: 7.19, line: "One specific, provable statement from the facts. Never a superlative." },
  { key: "reverse", name: "Reverse psychology", rate: 7.14, line: "\"Don't book this unless you…\"" },
  { key: "warning", name: "Warning / mistake", rate: 7.07, line: "\"If you're still [doing it the hard way], stop.\" \"Don't do this. Do this instead.\"" },
  { key: "contrarian", name: "Contrarian", rate: 7.01, line: "Push back on common advice in the category, honestly." },
] as const
/** Opening styles that score lowest. Avoid them as the first line. */
export const WEAK_HOOKS = ["question (\"Are you looking for…?\")", "how-to (\"How to…\")", "listicle (\"5 reasons…\")"]

/** First-second visual hooks with documented use. */
export const VISUAL_HOOKS = ["blurry text snapping sharp", "a handwritten note on a laptop or counter", "text in an unusual place in the frame", "a chat bubble mid-typing", "a cursor or finger tapping the button", "a before/after wipe"]

export const SPECS = {
  master: "1080x1920 (9:16) H.264 MP4, 30fps. Exports: 4:5 1080x1350 (Meta feed, LinkedIn), 16:9 1920x1080 (YouTube in-stream, LinkedIn desktop). LinkedIn needs under 30fps: export at 29.97 or 25fps.",
  length: "15–25s main cut plus a 6–10s cutdown. YouTube in-stream needs 10s or more. LinkedIn 15–30s.",
  brand: "Business name and the main message on screen by second 5 (Meta: 1.7x more likely to rank top 20% for purchase intent) [platform].",
  safeBox: "All text and key visuals inside x 120–960, y 270–1248. Below y 1152 keep content left of x 853 (Reels button column).",
  captions: "Burned in on every ad. Montserrat Black (or Inter Black), white with a 3–4px black stroke, key word in yellow #FFD400, 70–90px, 2–4 words a line, centred around y 1000–1150. LinkedIn: calmer full-line captions plus an SRT file. Max one emoji per caption block, none on LinkedIn.",
  pacing: "A visual change every 1–2s in the first 5s, every 2–3s in the proof section, every 1–1.5s into the call to action. Punch-in 110–120% on key words.",
  sound: "Design for sound on, but every ad must make sense muted. One sound effect every 2–4s at most, 6–12 dB under the voice.",
  voice: "160–180 words a minute after cutting pauses (15s ≈ 40–45 words, 20s ≈ 55, 25s ≈ 70). The owner's own voice, or a paid-plan stock AI voice credited \"AI voice\". Never a clone of a real person.",
  loudness: "Master at -14 LUFS integrated, true peak -1 dBTP, music ducked 12–18 dB under the voice.",
} as const

export const MUSIC = {
  yes: ["Epidemic Sound Pro or Business (covers paid ads)", "Artlist Pro (publish only while subscribed)", "TikTok Commercial Music Library, for TikTok-only cuts", "Meta Sound Collection, for Meta-only cuts"],
  never: ["trending TikTok or Instagram sounds", "any label song", "YouTube Audio Library in paid ads", "Suno or Udio AI music (licensing still disputed)"],
  why: "Record labels are suing brands over songs in social ads: Sony and Warner sued DSW, UMG sued Quince, Warner sued Luxottica over 427+ works.",
  log: "Log the track ID, licence and ad ID for every ad, keep the subscription active while the ad runs, and turn off Meta's automatic music in Advantage+ creative.",
} as const

export const AI_RULES = [
  "AI makes the props, the real business makes the proof. Use AI video (Veo, Kling, Runway) only for objects, rooms, textures and abstract motion.",
  "Never generate realistic people, fake customers, fake reviews or fake screens of the product.",
  "An AI presenter, if used at all, is labelled \"AI presenter\" on screen the whole time and never poses as a customer or the owner.",
  "Meta puts its most visible AI label on photorealistic AI people. Turn on TikTok's AI toggle and YouTube's altered-content setting when AI visuals or voices are used. Never strip C2PA data.",
  "Check every AI clip for warped hands, gibberish text, plastic lighting and stock-avatar faces before it runs.",
] as const

/** Kill / hold / scale thresholds (heuristics on vendor benchmarks). */
export const THRESHOLDS = {
  metaJudgeImpressions: 1500,
  metaJudgeSpend: 60,
  linkedinJudgeSpend: 250,
  rows: [
    { metric: "Meta hook rate (3-second views ÷ impressions), after 1,500 impressions", kill: "under 20%", hold: "20–30%", scale: "30% or more" },
    { metric: "Meta hold rate (15-second views ÷ 3-second views)", kill: "under 15%", hold: "15–25%", scale: "25% or more" },
    { metric: "Meta link click-through rate, after $60 spent", kill: "under 0.6%", hold: "0.6–1.0%", scale: "1.0% or more" },
    { metric: "LinkedIn video click-through rate, after $250 spent", kill: "under 0.35%", hold: "0.35–0.55%", scale: "0.55% or more" },
    { metric: "LinkedIn completion (videos under 30s)", kill: "under 20%", hold: "20–35%", scale: "35% or more" },
  ],
  rules: [
    "Run 3–4 genuinely different concepts per ad set, not 10 versions of one hook.",
    "Change nothing for the first 5–7 days.",
    "Pause the weakest ad using the kill column, then add one new concept a week.",
    "When an ad hits two scale marks, write 3 new opening hooks over the same body and test them.",
    "Refresh winning hooks every 1–2 weeks: strong hooks reportedly lose about a third of their pull after a week [vendor].",
    "Raise the budget on a proven ad set by at most 20% every 3–4 days.",
    "Judge on real bookings, calls and sales, not the platform's own conversion count.",
    "Expect about 1 real winner in 20 creatives [vendor]. That is normal.",
  ],
} as const

export const LEGAL = [
  "Use only facts the business gave or that can be verified. No invented prices, results, ratings, counts or years.",
  "No superlatives you can't prove: best, #1, leading, top-rated, cheapest, guaranteed.",
  "No fake or AI testimonials (FTC 16 CFR Part 465, in force since October 2024). Real customers only, with written consent.",
  "Disclose any free product, discount or payment given to someone in the ad, out loud or on screen, not in a hashtag.",
  "Canada: the Competition Bureau says there is \"no AI exception\" to deceptive-marketing law. An AI label doesn't fix a false claim.",
  "Mark any recreated scene, sample chat or example comment as \"Example\" or \"Dramatization\" on screen.",
  "No stock or AI photos of real-looking people in statics or thumbnails.",
] as const

export type Vertical = "health" | "medspa" | "dental" | "legal" | "finance" | "real_estate" | "housing" | "home_services" | "restaurant" | "fitness" | "beauty" | "retail" | "auto" | "education" | "b2b_software" | "professional" | "other"
export const VERTICALS: Vertical[] = ["health", "medspa", "dental", "legal", "finance", "real_estate", "housing", "home_services", "restaurant", "fitness", "beauty", "retail", "auto", "education", "b2b_software", "professional", "other"]

/** Extra rules per vertical. Code adds these; the model never decides them. */
export const VERTICAL_RULES: Record<Vertical, string[]> = {
  health: ["No claims that a treatment cures, heals or guarantees a result.", "No before/after images that imply typical results.", "Meta and Google restrict ads about health conditions: don't say or imply the viewer has a condition (\"Struggling with back pain?\")."],
  medspa: ["No promised results or \"look 10 years younger\" lines.", "Before/after images only with written consent and a \"results vary\" note; Meta restricts them.", "Name the licensed professional only if they agreed.", "Don't imply the viewer has a body or skin problem (Meta personal-attributes policy)."],
  dental: ["No \"painless\" or guaranteed outcomes.", "Before/after smiles only with written consent and \"results vary\".", "Prices only if they are your published prices."],
  legal: ["Follow your bar's advertising rules: many require \"Attorney advertising\" and forbid guaranteed outcomes or past-result claims without a disclaimer.", "No \"expert\" or \"specialist\" unless certified where you practise.", "No dramatizations without a \"Dramatization\" label."],
  finance: ["Meta Special Ad Category (financial products) limits targeting: no age, gender or postcode targeting.", "No promised returns, approvals or rates that aren't your published terms.", "Add required disclosures (licence numbers, \"not investment advice\") where your regulator requires them."],
  real_estate: ["Meta and Google Housing category: no targeting by age, gender or postcode, minimum 15-mile radius.", "Fair-housing language only: describe the home, never the kind of buyer.", "Include licence/brokerage details where your province or state requires them."],
  housing: ["Meta and Google Housing category: no targeting by age, gender or postcode, minimum 15-mile radius.", "Fair-housing language only: describe the property, never the kind of tenant."],
  home_services: ["Licence and insurance claims only if true and current.", "Prices and \"free estimate\" only if you really offer them.", "Before/after photos must be your own jobs."],
  restaurant: ["Show your real food, not stock or AI food.", "Allergy or health claims (\"gluten-free\", \"healthy\") only if accurate.", "Alcohol ads: follow platform age rules and local liquor-ad rules."],
  fitness: ["No promised weight loss or body change.", "Before/after photos only with consent and \"results vary\"; Meta restricts them.", "Don't imply the viewer is overweight or unfit (Meta personal-attributes policy)."],
  beauty: ["Before/after only with consent and \"results vary\".", "No \"flawless\" or guaranteed results.", "Don't imply the viewer has a skin or body problem."],
  retail: ["Sale prices must be real reductions from a real regular price.", "\"Limited time\" only if the offer really ends."],
  auto: ["Advertised prices must include required fees where your province or state requires all-in pricing (e.g. Ontario OMVIC).", "Financing offers need the full terms."],
  education: ["No promised jobs, grades or admissions.", "Accreditation claims only if current."],
  b2b_software: ["Customer logos and quotes only with permission.", "No \"saves X hours\" or ROI figures unless you can show how they were measured."],
  professional: ["Credentials only if current.", "No promised outcomes."],
  other: [],
}

/** Platform copy limits used for every static (characters). */
export const LIMITS = {
  metaPrimary: 125,
  metaHeadline: 40,
  linkedinIntro: 150,
  linkedinHeadline: 70,
  googleHeadline: 30,
  googleDescription: 90,
} as const

/** The playbook as a compact brief for the model. */
export function playbookBrief(): string {
  return [
    `AD PLAYBOOK v${PLAYBOOK_VERSION}`,
    "FORMATS (best first, Meta winner rate): " + FORMATS.map((f) => `${f.name} ${f.rate}% — ${f.use}`).join(" | "),
    "Screen recordings and feature callouts score low on their own (~5.5%); put them inside a native frame (POV, note, before/after).",
    "HOOK TYPES (priority order): " + HOOK_TYPES.map((h) => `${h.key}: ${h.line}`).join(" | "),
    "AVOID as openers: " + WEAK_HOOKS.join(", ") + ".",
    "FIRST-SECOND VISUALS: " + VISUAL_HOOKS.join(", ") + ".",
    "SPECS: " + Object.values(SPECS).join(" "),
    "AI: " + AI_RULES.join(" "),
    "LEGAL: " + LEGAL.join(" "),
  ].join("\n")
}
