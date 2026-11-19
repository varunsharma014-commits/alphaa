// Ads need the business's city (Google radius, Meta city targeting). When the profile has none,
// the agent asks for it in the chat instead of failing or guessing. Client-safe (no db imports).
import { agent, type Chip, type Message } from "@/lib/agent/types"

export type CityNext = "ads" | "metaads"

/** The chip that opens a small city/state form and saves it via POST /api/agent/city. */
export function cityChip(next: CityNext, state?: string | null): Chip {
  return {
    label: "Add my city",
    primary: true,
    action: {
      type: "agent-op",
      endpoint: "city",
      body: { next },
      form: {
        text: "Which city is your business in? I only show your ads to people near you.",
        fields: [
          { name: "city", label: "City", type: "text", placeholder: "Toronto", required: true },
          { name: "state", label: "State or province (optional)", type: "text", placeholder: "ON", value: state?.trim() || "" },
        ],
        cta: "Save it",
        fine: "Saved to your profile. You can change it any time.",
      },
    },
  }
}

/** "I need your city first" + the form chip, in place of an error. */
export function askCityMessages(next: CityNext, state?: string | null): Message[] {
  return [agent([
    { kind: "text", text: "Before I plan your ads I need your city, so they only show to people who can actually come to you." },
    { kind: "chips", items: [cityChip(next, state)] },
  ])]
}
