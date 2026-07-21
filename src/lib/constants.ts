export const TRIAL_DAYS = 14

export const PLANS = {
  NONE: "none",
  STARTER: "starter",
  PRO: "pro",
  FULLSERVICE: "fullservice",
} as const

export const PLAN_NAMES = {
  none: "Free Trial",
  starter: "Starter",
  pro: "Pro",
  fullservice: "Full Service",
} as const

export const PLAN_PRICES = {
  starter: { monthly: 99, annual: 79 },
  pro: { monthly: 199, annual: 159 },
  // Full Service is human-fulfilled (a real person publishes to the
  // customer's CMS), so no discounted annual — monthly only.
  fullservice: { monthly: 299, annual: 299 },
} as const

// One-time white-glove setup: a real person installs the Vault code on the
// customer's site via invite-based access (WP admin invite, Shopify
// collaborator, Webflow seat — never passwords) and verifies it renders.
export const SETUP_FEE_USD = 149
export const CONCIERGE_SLA = "within 2 business days"
export const SUPPORT_EMAIL = "hi@alphaa.app"

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
  "SaaS / Software",
  "Marketing or Ad Agency",
  "Ecommerce / Online Store",
  "Consulting",
  "Professional Services",
  "B2B Services",
  "Agency",
  "Online Education",
  "Media / Publishing",
  "Financial Services",
  "Manufacturing",
  "Nonprofit",
  "Other",
] as const

export const AI_ENGINES = ["chatgpt", "perplexity", "google_ai", "gemini"] as const

export const SCAN_MESSAGES = [
  "Checking your Google Business Profile…",
  "Asking ChatGPT about your business…",
  "Scanning your website for issues…",
  "Analyzing local competitors…",
  "Reading the answers AI gives about your area…",
  "Checking AI search citations…",
  "Comparing you to top-ranked locals…",
  "Generating your visibility score…",
]
