// Entire marketing site is light.
export function MarketingThemeScope({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="radial-bg min-h-screen flex flex-col">
      {children}
    </div>
  )
}
