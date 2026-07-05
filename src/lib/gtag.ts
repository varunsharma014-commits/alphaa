// GA4 event helper. No-ops when gtag isn't loaded (env var unset) so calls
// are always safe from any client component.
export const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""

type Params = Record<string, string | number | boolean | undefined>

export function track(event: string, params?: Params): void {
  if (typeof window === "undefined") return
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  if (typeof w.gtag !== "function") return
  w.gtag("event", event, params || {})
}
