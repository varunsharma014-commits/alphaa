import { HeroCta } from "@/components/marketing/hero/HeroCta"

// The last thing on the page: one action, back to the live scan in the hero.
export function FinalCta() {
  return (
    <section className="ag-final">
      <h2>See what AI says about you.</h2>
      <p>About 60 seconds. No card. If you hire me and no AI names you by day 90 with weekly checks active, next month is free.</p>
      <HeroCta label="Check my website" href="/start" />
    </section>
  )
}
