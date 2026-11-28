import "@/components/workspace/settings/settings.css"

// Settings shell: each tab page renders its own PageHeader with <SettingsTabs /> under it, so the
// title and the lit tab always match. One footer with a way to reach a person.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="xs-page">
      {children}
      <p className="xs-foot">
        Stuck or have a question? Email <a href="mailto:hi@alphaa.app">hi@alphaa.app</a> and a real person reads it.
      </p>
    </div>
  )
}
