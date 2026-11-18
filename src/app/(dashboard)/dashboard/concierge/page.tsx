export const dynamic = "force-dynamic"

// The human services (Full Service plan, $149 setup) were retired from sale on 2026-11-18.
// The route stays so old links and bookmarks land somewhere useful.
export default function ConciergePage() {
  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--ds-text)", marginBottom: "6px" }}>This service is no longer offered.</h1>
      <p style={{ fontSize: "13px", color: "var(--ds-text-mute)", lineHeight: 1.7 }}>
        Connect your website and I publish the changes you approve myself. For any other site, tap “Email it to my web person” on a fix and I send them the exact change.
        Stuck? Email{" "}
        <a href="mailto:hi@alphaa.app" style={{ color: "var(--ds-accent)" }}>hi@alphaa.app</a> and a real person will reply. See what each plan includes on the{" "}
        <a href="/pricing" style={{ color: "var(--ds-accent)" }}>pricing page</a>.
      </p>
    </div>
  )
}
