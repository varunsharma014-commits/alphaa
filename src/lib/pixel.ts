// Meta Pixel event helper. No-ops when fbq isn't loaded (env var unset, or an
// ad blocker ate it) so calls are always safe from any client component.
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || ""

type Params = Record<string, string | number | boolean | undefined>

// Standard Meta events only — custom ones need Events Manager setup to be
// usable for optimization, so the funnel sticks to the standard set.
export type MetaEvent =
  | "Lead"
  | "ViewContent"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "StartTrial"
  | "Subscribe"

export function fbTrack(event: MetaEvent, params?: Params): void {
  if (typeof window === "undefined") return
  const w = window as unknown as { fbq?: (...args: unknown[]) => void }
  if (typeof w.fbq !== "function") return
  w.fbq("track", event, params || {})
}
