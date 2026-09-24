// The agent surfaces (public /start) run without the marketing chrome: no
// nav, no footer, no floating CTA — the conversation is the whole page.
export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-agent="" data-theme="light" data-brand="blue" style={{ minHeight: "100dvh" }}>
      {children}
    </div>
  )
}
