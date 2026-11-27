import type { SvcKey } from "@/components/marketing/v3/services-v3"

// Colour per example industry on /case-studies (presentation only).
export const INDUSTRY_TONE: Record<string, SvcKey> = {
  Dental: "se", Legal: "em", HVAC: "ad",
  Fitness: "mk", "E-commerce": "ct", "Real estate": "ad", "Med spa": "mk", "Home services": "se", Restaurant: "ct", SaaS: "em",
}
