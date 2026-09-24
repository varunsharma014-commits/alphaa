// Entire marketing site is light.
export function MarketingThemeScope({ children }: { children: React.ReactNode }) {
  return (
    <div data-agent="" data-theme="light" data-brand="blue" className="min-h-screen flex flex-col">
      {children}
    </div>
  )
}
