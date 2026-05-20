export const TRIAL_DAYS = 14

export const PLANS = {
  NONE: "none",
  STARTER: "starter",
  PRO: "pro",
} as const

export const PLAN_NAMES = {
  none: "Free Trial",
  starter: "Starter",
  pro: "Pro",
} as const

export const PLAN_PRICES = {
  starter: { monthly: 99, annual: 79 },
  pro: { monthly: 199, annual: 159 },
} as const

export const ROUTES = {
  HOME: "/",
  SCAN: "/scan",
  PRICING: "/pricing",
  HOW_IT_WORKS: "/how-it-works",
  LOGIN: "/login",
  SIGNUP: "/signup",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  SETTINGS: "/dashboard/settings",
} as const

export const BUSINESS_TYPES = [
  "Dentist",
  "Lawyer / Law Firm",
  "Med Spa",
  "Plumber",
  "Electrician",
  "HVAC",
  "General Contractor",
  "Real Estate Agent",
  "Restaurant",
  "Retail Store",
  "Chiropractor",
  "Physical Therapist",
  "Accountant / CPA",
  "Insurance Agent",
  "Salon / Barbershop",
  "Auto Repair",
  "Landscaping",
  "Cleaning Service",
  "Photographer",
  "Other",
] as const

export const AI_ENGINES = ["chatgpt", "perplexity", "google_ai", "gemini"] as const

export const SCAN_MESSAGES = [
  "Checking your Google Business Profile…",
  "Asking ChatGPT about your business…",
  "Scanning your website for issues…",
  "Analyzing local competitors…",
  "Testing 47 visibility factors…",
  "Checking AI search citations…",
  "Comparing you to top-ranked locals…",
  "Generating your visibility score…",
]
